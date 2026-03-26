import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────────
interface TrendingItem {
  source:      string;
  title:       string;
  url:         string;
  description: string;
  signal:      string;   // e.g. "1,234 points on HN" or "★2.3k on GitHub"
  extra?:      string;   // README excerpt or snippet
}

// ── Fetch top HN stories ──────────────────────────────────────────
async function fetchHNStories(): Promise<TrendingItem[]> {
  const { data } = await axios.get('https://hn.algolia.com/api/v1/search', {
    params: {
      tags:           'story',
      numericFilters: 'points>200,num_comments>50',
      hitsPerPage:    8,
    },
    timeout: 10000,
  });

  return (data.hits as Array<{
    title: string; url: string | null; points: number; num_comments: number;
  }>)
    .filter(h => h.url)
    .map(h => ({
      source:      'Hacker News',
      title:       h.title,
      url:         h.url!,
      description: `${h.points} points, ${h.num_comments} comments`,
      signal:      `${h.points} points on Hacker News`,
    }));
}

// ── Fetch trending GitHub repos ───────────────────────────────────
async function fetchGitHubTrending(): Promise<TrendingItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const dateStr = since.toISOString().split('T')[0];

  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

  const { data } = await axios.get('https://api.github.com/search/repositories', {
    headers,
    params: { q: `created:>${dateStr} stars:>100`, sort: 'stars', order: 'desc', per_page: 6 },
    timeout: 15000,
  });

  const repos = data.items as Array<{
    full_name: string; html_url: string; description: string | null;
    stargazers_count: number; language: string | null;
  }>;

  // Fetch README for top repos to give Claude real context
  const withReadme = await Promise.all(
    repos.slice(0, 5).map(async repo => {
      try {
        const { data: rm } = await axios.get(
          `https://api.github.com/repos/${repo.full_name}/readme`,
          { headers, timeout: 8000 }
        );
        const readme = Buffer.from(rm.content, 'base64').toString('utf8').slice(0, 3000);
        return { ...repo, readme };
      } catch { return { ...repo, readme: undefined }; }
    })
  );

  return withReadme.map(repo => ({
    source:      'GitHub Trending',
    title:       repo.full_name,
    url:         repo.html_url,
    description: repo.description ?? 'No description',
    signal:      `★${repo.stargazers_count.toLocaleString()} stars this week · ${repo.language ?? 'various'}`,
    extra:       'readme' in repo ? (repo as typeof repo & { readme?: string }).readme : undefined,
  }));
}

// ── Claude picks the best topic ───────────────────────────────────
async function pickTopic(items: TrendingItem[]): Promise<TrendingItem & { angle: string }> {
  const list = items
    .map((item, i) => `${i}. [${item.source}] ${item.title}\n   ${item.signal}\n   ${item.description}`)
    .join('\n\n');

  const msg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role:    'user',
      content: `You are picking the best topic for a deep-dive developer blog post for Henry's blog.

Henry is an Australian developer building AI-powered web apps (Next.js, TypeScript, Supabase).
His readers are developers who want to learn something actionable and immediately useful today.

Pick the ONE item that would make the most interesting, useful, and timely deep-dive post.
Prefer topics where you can include real code, practical steps, or specific project ideas.
Prefer novel tools, techniques, or ideas over pure announcements.

Items:
${list}

Return JSON only:
{
  "index": 0,
  "angle": "the specific hook — what makes this worth a deep-dive right now, one sentence"
}`,
    }],
  });

  const raw    = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const match  = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : { index: 0, angle: '' };

  const chosen = items[parsed.index ?? 0] ?? items[0];
  return { ...chosen, angle: parsed.angle ?? '' };
}

// ── Claude writes the full post ───────────────────────────────────
async function generatePost(topic: TrendingItem & { angle: string }) {
  const context = topic.extra
    ? `\nAdditional context (README / excerpt):\n${topic.extra}`
    : '';

  const msg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2500,
    system: `You are writing a blog post for Henry, an Australian developer.

Henry's voice: direct, practical, no fluff. He writes like a senior developer talking to peers.
He always includes real code snippets when relevant. He never explains things condescendingly.
He focuses on "what you can actually build with this right now".
He never uses: "delve into", "it's worth noting", "in conclusion", "exciting", "game-changing".
He uses Australian English. He writes in first person.

Post structure:
1. One punchy opening paragraph — the hook and why this matters NOW
2. 2-4 substantive sections with ## headings — explain the thing, include real code where relevant
3. A "What I'd build with this" section — 2-3 specific, concrete project ideas
4. A short closing paragraph with Henry's personal take

Target length: 600-900 words. Substantive but never padded.`,
    messages: [{
      role:    'user',
      content: `Write a deep-dive blog post about this trending topic.

Topic: ${topic.title}
Source: ${topic.source}
Signal: ${topic.signal}
Angle to cover: ${topic.angle}
URL: ${topic.url}
${context}

Return JSON only:
{
  "title": "compelling post title — specific, not generic, not clickbait",
  "slug": "kebab-case-slug-max-6-words",
  "excerpt": "1-2 sentence teaser for the post card",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "coverEmoji": "single emoji",
  "body": "full markdown post body — no frontmatter, starts with the first paragraph"
}`,
    }],
  });

  const raw   = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned unparseable JSON');

  const parsed = JSON.parse(match[0]);
  return {
    title:   parsed.title   as string,
    slug:    parsed.slug    as string,
    excerpt: parsed.excerpt as string,
    tags:    parsed.tags    as string[],
    emoji:   parsed.coverEmoji as string,
    body:    parsed.body    as string,
  };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Daily Post pipeline\n');

  // 1. Fetch trending signals in parallel
  console.log('🔍 Fetching trending topics...');
  const [hnStories, githubTrending] = await Promise.all([
    fetchHNStories().catch(() => [] as TrendingItem[]),
    fetchGitHubTrending().catch(() => [] as TrendingItem[]),
  ]);

  const allItems = [...hnStories, ...githubTrending];
  console.log(`✅ Found ${allItems.length} trending items\n`);

  if (allItems.length === 0) {
    console.error('No trending items found. Exiting.');
    process.exit(1);
  }

  // 2. Pick the best topic
  console.log('🤖 Picking best topic...');
  const topic = await pickTopic(allItems);
  console.log(`✅ Picked: "${topic.title}"\n   Angle: ${topic.angle}\n`);

  // 3. Generate the post
  console.log('✍️  Writing post with Claude...');
  const post = await generatePost(topic);
  console.log(`✅ Written: "${post.title}"\n`);

  // 4. Write to disk
  const dateStr  = new Date().toISOString().split('T')[0];
  const filename = `${dateStr}-${post.slug}.md`;
  const dir      = path.join(process.cwd(), 'content', 'posts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const content =
`---
title: "${post.title.replace(/"/g, '\\"')}"
date: "${dateStr}"
excerpt: "${post.excerpt.replace(/"/g, '\\"')}"
tags: [${post.tags.map(t => `"${t}"`).join(', ')}]
coverEmoji: "${post.emoji}"
auto_generated: true
source_url: "${topic.url}"
---

${post.body}
`;

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`📝 Post written → content/posts/${filename}`);

  // 5. Commit + push → Vercel auto-deploys
  console.log('\n📤 Pushing to GitHub...');
  try {
    execSync(`git add "${filePath}"`, { stdio: 'inherit' });
    execSync(`git commit -m "post: ${post.title}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Deployed — Vercel is building now');
  } catch (err) {
    console.warn('⚠️  Git push failed:', (err as Error).message);
  }

  console.log('\n✅ Daily Post pipeline complete!');
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
