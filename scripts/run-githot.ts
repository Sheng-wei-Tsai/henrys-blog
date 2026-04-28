import 'dotenv/config';
import axios from 'axios';
import { claudeMessage, ClaudeQuotaError } from './llm-claude';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';



// ── Types ────────────────────────────────────────────────────────
interface GithubRepo {
  name:             string;
  full_name:        string;
  html_url:         string;
  description:      string | null;
  stargazers_count: number;
  language:         string | null;
  topics:           string[];
  forks_count:      number;
  created_at:       string;
  pushed_at:        string;
  readme?:          string;
}

interface RepoAnalysis {
  repo:          GithubRepo;
  useCase:       string;
  whyTrending:   string;
  howToUse:      string;
  brainstorm:    string[];
  tldr:          string;
}

// ── Fetch top trending repos from GitHub Search API ──────────────
async function fetchTrendingRepos(): Promise<GithubRepo[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const dateStr = since.toISOString().split('T')[0];

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  console.log('🔍 Fetching trending GitHub repos...');

  const { data } = await axios.get('https://api.github.com/search/repositories', {
    headers,
    params: {
      q:        `created:>${dateStr} stars:>50`,
      sort:     'stars',
      order:    'desc',
      per_page: 12,
    },
    timeout: 15000,
  });

  const repos: GithubRepo[] = data.items;
  console.log(`✅ Fetched ${repos.length} trending repos`);

  // Try to get README for the top repos (helps Claude understand what it does)
  const withReadme = await Promise.all(
    repos.slice(0, 10).map(async (repo) => {
      try {
        const { data: readme } = await axios.get(
          `https://api.github.com/repos/${repo.full_name}/readme`,
          { headers, timeout: 8000 }
        );
        const decoded = Buffer.from(readme.content, 'base64').toString('utf8');
        return { ...repo, readme: decoded.slice(0, 2000) };
      } catch {
        return repo;
      }
    })
  );

  return withReadme;
}

// ── Claude analysis for each repo ───────────────────────────────
const SYSTEM = `You are a senior full-stack developer reviewing trending GitHub repos for a junior developer building an AI-powered personal blog in Next.js, React, TypeScript and Supabase.

For each repo you write:
- A sharp, specific use case (what real problem does this solve — not just repeat the description)
- Why it's trending right now (what makes it relevant this week)
- How to actually use it (a concrete getting-started snippet or workflow — 3-5 steps)
- 3 specific brainstorm ideas for how Henry (the developer) could use this in his blog, career tools, or AI projects

Be specific. No generic advice. No hype. Treat the reader as an experienced developer.
Return valid JSON only.`;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function analyseRepo(repo: GithubRepo, attempt = 1): Promise<RepoAnalysis> {
  const prompt = `
Repo: ${repo.full_name}
Stars this week: ${repo.stargazers_count.toLocaleString()}
Language: ${repo.language ?? 'unknown'}
Topics: ${(repo.topics ?? []).join(', ') || 'none listed'}
Description: ${repo.description ?? 'no description'}
README excerpt:
${repo.readme ?? '(no README available)'}

Return JSON:
{
  "tldr": "one sentence — what this repo does and why it matters",
  "useCase": "2-3 sentences — the real problem this solves with a concrete example scenario",
  "whyTrending": "1-2 sentences — what makes this repo relevant or newly interesting right now",
  "howToUse": "3-5 concrete steps to get started — include a code snippet if relevant",
  "brainstorm": [
    "specific idea 1 for Henry's blog/portfolio",
    "specific idea 2 for career tools (resume matcher, cover letter, etc.)",
    "specific idea 3 for AI features"
  ]
}`;

  let raw: string;
  try {
    raw = await claudeMessage({
      model:  'claude-sonnet-4-6',
      system: SYSTEM,
      prompt,
    });
  } catch (err: unknown) {
    if (err instanceof ClaudeQuotaError) throw err; // do not retry quota
    if (attempt <= 3) {
      const wait = attempt * 8000;
      process.stdout.write(` (error, retrying in ${wait / 1000}s)... `);
      await sleep(wait);
      return analyseRepo(repo, attempt + 1);
    }
    throw err;
  }

  const match = raw.match(/\{[\s\S]*\}/);

  let parsed: { tldr: string; useCase: string; whyTrending: string; howToUse: string; brainstorm: string[] };
  try {
    parsed = match ? JSON.parse(match[0]) : null;
    if (!parsed?.useCase) throw new Error('bad parse');
  } catch {
    parsed = {
      tldr:        repo.description ?? '',
      useCase:     repo.description ?? '',
      whyTrending: '',
      howToUse:    '',
      brainstorm:  [],
    };
  }

  return { repo, ...parsed };
}

// ── Generate markdown post ────────────────────────────────────────
function formatDate(d: Date) { return d.toISOString().split('T')[0]; }
function formatDisplay(d: Date) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function repoToMd(a: RepoAnalysis, index: number): string {
  const stars = a.repo.stargazers_count.toLocaleString();
  const lang  = a.repo.language ?? 'various';
  const topics = (a.repo.topics ?? []).slice(0, 4).map(t => `\`${t}\``).join(' ');
  const brainstorm = a.brainstorm.map((b, i) => `${i + 1}. ${b}`).join('\n');

  return `## ${index + 1}. [${a.repo.full_name}](${a.repo.html_url})

**${stars} stars this week** · ${lang}${topics ? ' · ' + topics : ''}

${a.tldr}

**Use case**

${a.useCase}

**Why it's trending**

${a.whyTrending}

**How to use it**

${a.howToUse}

**How I could use this**

${brainstorm}`;
}

function writePost(analyses: RepoAnalysis[], date = new Date()): string {
  const dateStr    = formatDate(date);
  const displayDate = formatDisplay(date);

  const frontmatter = `---
title: "GitHub Hot — ${displayDate}"
date: "${dateStr}"
excerpt: "Top ${analyses.length} trending repos this week — use cases, how to use them, and project ideas for each."
tags: ["GitHub", "Open Source", "Tools"]
coverEmoji: "🔥"
auto_generated: true
---

*Top ${analyses.length} repos trending on GitHub this week — what they do, why they matter, and how to use them in your projects.*

---

`;

  const body = analyses.map((a, i) => repoToMd(a, i)).join('\n\n---\n\n');
  return frontmatter + body + '\n';
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 GitHub Hot pipeline\n');

  // 0. Skip if today's file already exists (prevents duplicate on double-run)
  const todayStr = formatDate(new Date());
  const todayFile = path.join(process.cwd(), 'content', 'githot', `${todayStr}.md`);
  if (fs.existsSync(todayFile)) {
    console.log(`✅ GitHub Hot for ${todayStr} already exists — skipping.`);
    process.exit(0);
  }

  const repos = await fetchTrendingRepos();

  console.log(`\n🤖 Analysing top ${repos.length} repos with Claude...\n`);
  const analyses: RepoAnalysis[] = [];
  let quotaExhausted = false;
  for (const repo of repos) {
    process.stdout.write(`   → ${repo.full_name} (★${repo.stargazers_count.toLocaleString()})... `);
    if (quotaExhausted) {
      console.log('skipped (quota exhausted)');
      continue;
    }
    try {
      const analysis = await analyseRepo(repo);
      analyses.push(analysis);
      console.log('✓');
    } catch (err) {
      if (err instanceof ClaudeQuotaError) {
        quotaExhausted = true;
        console.log('quota hit — stopping further analyses');
      } else {
        console.log(`✗ skipped (${(err as Error).message.slice(0, 50)})`);
      }
    }
    await sleep(1500); // small gap between calls to avoid rate limits
  }

  if (analyses.length === 0) {
    console.warn('\n⚠️  No analyses produced (quota exhausted on first call). Skipping post — will retry next window.');
    process.exit(0);
  }

  const dateStr  = formatDate(new Date());
  const dir      = path.join(process.cwd(), 'content', 'githot');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${dateStr}.md`);
  fs.writeFileSync(filePath, writePost(analyses), 'utf8');
  console.log(`\n📝 Post written → content/githot/${dateStr}.md`);

  console.log('\n📤 Pushing to GitHub...');
  try {
    execSync(`git add "${filePath}"`, { stdio: 'inherit' });
    execSync(`git commit -m "githot: GitHub Hot ${dateStr}"`, { stdio: 'inherit' });
    // Retry push with rebase to handle parallel job conflicts
    const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
    let pushed = false;
    for (let attempt = 1; attempt <= 3 && !pushed; attempt++) {
      try {
        if (attempt > 1) {
          await sleep(10000 * attempt);
          execSync('git pull --rebase origin main', { stdio: 'inherit', env: gitEnv, timeout: 60000 });
        }
        execSync('git push origin main', { stdio: 'inherit', env: gitEnv, timeout: 60000 });
        pushed = true;
      } catch (pushErr) {
        if (attempt === 3) throw pushErr;
        console.warn(`⚠️  Push attempt ${attempt} failed, retrying...`);
      }
    }
    console.log('✅ Deployed — Vercel is building now');
  } catch (err) {
    console.warn('⚠️  Git push failed:', (err as Error).message);
  }
}

main().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
