import dotenv from 'dotenv';
import { existsSync } from 'fs';
// Load .env.local (Next.js convention) then .env as fallback
if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();
import Parser from 'rss-parser';
import { claudeMessage, ClaudeQuotaError } from './llm-claude';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';


const parser  = new Parser({ timeout: 20000 });

// ── Config ────────────────────────────────────────────────────────
const MAX_PER_RUN   = 5;
const daysArg = process.argv.indexOf('--days');
const LOOKBACK_DAYS = daysArg >= 0 ? parseInt(process.argv[daysArg + 1], 10) : 1;
const OUT_DIR = path.join(process.cwd(), 'content', 'ai-news');

const RSS_FEEDS: { company: 'anthropic' | 'openai' | 'google'; id: string; url: string }[] = [
  { company: 'openai',  id: 'openai',    url: 'https://openai.com/news/rss.xml' },
  { company: 'google',  id: 'google-ai', url: 'https://blog.google/technology/ai/rss/' },
];

const COMPANY_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai:    'OpenAI',
  google:    'Google AI',
};

// ── Helpers ───────────────────────────────────────────────────────
function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function formatDate(d: Date) { return d.toISOString().split('T')[0]; }

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

// ── Fetch full article content for richer Claude context ──────────
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechPathBot/1.0; +https://henrysdigitallife.com)' },
    });
    if (!res.ok) return '';
    const html = await res.text();

    // If page is JS-rendered (just a loading spinner), bail early
    if (html.length < 3000 && html.includes('script') && !html.includes('<p')) return '';

    // 1. og:description
    const ogDesc = html.match(/property="og:description"\s+content="([^"]{30,})"/i)?.[1]
      ?? html.match(/name="og:description"\s+content="([^"]{30,})"/i)?.[1]
      ?? '';

    // 2. meta description (skip if it's a generic company tagline)
    const metaDescRaw = html.match(/name="description"\s+content="([^"]{30,})"/i)?.[1] ?? '';
    const metaDesc = metaDescRaw === ogDesc ? '' : metaDescRaw;

    // 3. Class-based article body paragraphs (works for Anthropic, Google, most blogs)
    const classParas = [...html.matchAll(
      /<p[^>]+class="[^"]*(?:body|content|article|post|text|lead|intro|summary|paragraph|prose|copy|rich)[^"]*"[^>]*>([\s\S]{60,800}?)<\/p>/gi
    )].map(m => stripHtml(m[1])).filter(t => t.length > 50);

    // 4. Generic paragraphs (fallback — filter out navigation/legal text)
    const genericParas = classParas.length < 2
      ? [...html.matchAll(/<p>([\s\S]{100,600}?)<\/p>/g)]
          .map(m => stripHtml(m[1]))
          .filter(t => t.length > 80 && !/cookie|privacy|terms|copyright|subscribe|all rights reserved/i.test(t))
      : [];

    const paras = [...classParas, ...genericParas].slice(0, 6);

    const combined = [ogDesc, metaDesc, ...paras]
      .filter(Boolean)
      .join('\n\n');

    return combined.slice(0, 2500);
  } catch {
    return '';
  }
}

// ── Scrape Anthropic news page ────────────────────────────────────
interface FeedItem {
  company:    'anthropic' | 'openai' | 'google';
  feedId:     string;
  title:      string;
  link:       string;
  isoDate:    string;
  excerpt:    string;
  slug:       string;
}

async function scrapeAnthropic(cutoff: Date): Promise<FeedItem[]> {
  try {
    console.log('  Fetching anthropic (scrape)...');
    const res = await fetch('https://www.anthropic.com/news', {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechPathBot/1.0)' },
    });
    if (!res.ok) { console.warn('  WARNING: anthropic scrape returned', res.status); return []; }
    const html = await res.text();

    // Extract article cards — look for linked /news/* paths with nearby dates
    // Pattern: href="/news/slug" ... date text
    const articleMatches = [...html.matchAll(/href="(\/news\/[a-z0-9-]+)"/g)];
    const seen = new Set<string>();
    const slugs: string[] = [];
    for (const m of articleMatches) {
      if (!seen.has(m[1]) && m[1] !== '/news') {
        seen.add(m[1]);
        slugs.push(m[1]);
      }
    }

    // Fetch each article page (up to 8) to get title, date, og:description
    const items: FeedItem[] = [];
    for (const articlePath of slugs.slice(0, 8)) {
      try {
        const articleUrl = `https://www.anthropic.com${articlePath}`;
        const aRes = await fetch(articleUrl, {
          signal: AbortSignal.timeout(10000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechPathBot/1.0)' },
        });
        if (!aRes.ok) continue;
        const aHtml = await aRes.text();

        // Prefer og:title (clean) over <title> (has " \ Anthropic" or "| Anthropic" suffix)
        const ogTitle = aHtml.match(/property="og:title"\s+content="([^"]+)"/i)?.[1]
          ?? aHtml.match(/name="og:title"\s+content="([^"]+)"/i)?.[1]
          ?? '';
        const rawTitle = ogTitle || stripHtml(aHtml.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '');
        const title = rawTitle.replace(/\s*[|–—\\\/]\s*Anthropic.*$/i, '').trim();

        // Anthropic's meta description is always generic — extract article body paragraphs instead
        const articleParas = [...aHtml.matchAll(
          /<p[^>]+class="[^"]*(?:body|content|article|post|text|lead|intro|paragraph|prose|copy|rich)[^"]*"[^>]*>([\s\S]{60,800}?)<\/p>/gi
        )].map(m => stripHtml(m[1])).filter(t => t.length > 50).slice(0, 6);
        // Fallback to generic paragraph extraction
        const genericParas = articleParas.length < 2
          ? [...aHtml.matchAll(/<p>([\s\S]{100,600}?)<\/p>/g)]
              .map(m => stripHtml(m[1]))
              .filter(t => t.length > 80 && !/cookie|privacy|terms|copyright|subscribe/i.test(t))
              .slice(0, 5)
          : [];

        const bodyContent = [...articleParas, ...genericParas].join('\n\n');

        // published_time
        const pubTimeRaw = aHtml.match(/(?:property|name)="article:published_time"\s+content="([^"]+)"/i)?.[1]
          ?? aHtml.match(/content="([^"]+)"\s+(?:property|name)="article:published_time"/i)?.[1]
          ?? '';

        // If we can't parse a date, try to find it in the HTML near the title
        const dateStr = pubTimeRaw
          ? pubTimeRaw
          : (() => {
              // Look for ISO date patterns in the HTML
              const isoMatch = aHtml.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
              return isoMatch ? isoMatch[1] : '';
            })();

        if (!dateStr) { await sleep(300); continue; }
        const pubDate = new Date(dateStr);
        if (isNaN(pubDate.getTime()) || pubDate < cutoff) { await sleep(300); continue; }

        if (!title || title.length < 5) { await sleep(300); continue; }

        const slug = `${formatDate(pubDate)}-anthropic-${kebabCase(title)}`;
        const excerpt = bodyContent.slice(0, 800);

        items.push({
          company: 'anthropic',
          feedId:  'anthropic',
          title,
          link:    articleUrl,
          isoDate: pubDate.toISOString(),
          excerpt,
          slug,
        });
        await sleep(400);
      } catch {
        await sleep(300);
      }
    }
    console.log(`  anthropic: ${items.length} recent item${items.length !== 1 ? 's' : ''}`);
    return items;
  } catch (err) {
    console.warn(`  WARNING: anthropic scrape failed: ${(err as Error).message}`);
    return [];
  }
}

// ── Fetch items from one RSS feed ─────────────────────────────────
async function fetchFeed(feed: typeof RSS_FEEDS[0], cutoff: Date): Promise<FeedItem[]> {
  try {
    console.log(`  Fetching ${feed.id}...`);
    const result = await parser.parseURL(feed.url);

    return (result.items ?? [])
      .filter(item => item.isoDate && new Date(item.isoDate) >= cutoff)
      .map(item => {
        const title   = item.title ?? 'Untitled';
        const date    = item.isoDate ? formatDate(new Date(item.isoDate)) : formatDate(new Date());
        const slug    = `${date}-${feed.id}-${kebabCase(title)}`;
        const excerpt = (item.contentSnippet ?? item.content ?? item.summary ?? '')
          .replace(/<[^>]*>/g, '')
          .slice(0, 800);
        return {
          company:  feed.company,
          feedId:   feed.id,
          title,
          link:     item.link ?? '',
          isoDate:  item.isoDate ?? '',
          excerpt,
          slug,
        };
      });
  } catch (err) {
    console.warn(`  WARNING: ${feed.id} feed failed: ${(err as Error).message}`);
    return [];
  }
}

// ── Claude enrichment ─────────────────────────────────────────────
interface Enrichment {
  whatWasAnnounced: string;
  whyItMatters:     string;
  keyTakeaways:     string[];
  coverEmoji:       string;
}

const SYSTEM_PROMPT = `You are a concise, opinionated technical analyst writing for experienced developers.
Explain what an AI company just announced and why it matters to developers who use AI tools daily.
Be specific, concrete, and skip marketing fluff. Return valid JSON only.`;

async function enrich(item: FeedItem, articleContent: string, attempt = 1): Promise<Enrichment | null> {
  const companyLabel = COMPANY_LABELS[item.company] ?? item.company;
  const fullContext = [item.excerpt, articleContent].filter(Boolean).join('\n\n---\n\n').slice(0, 2500);

  const prompt = `Company: ${companyLabel}
Title: ${item.title}
URL: ${item.link}
Content:
${fullContext || '(no content available — infer from title)'}

Return JSON:
{
  "whatWasAnnounced": "3-4 sentences — what was actually released/changed/announced. Be specific about model names, numbers, capabilities, pricing, or API changes.",
  "whyItMatters": "3-4 sentences — (1) what changes for developers TODAY? (2) how does this compare to alternatives? (3) what concrete action should a developer take now?",
  "keyTakeaways": ["specific takeaway with numbers/details", "practical implication for devs", "action item or watch-out"],
  "coverEmoji": "one emoji"
}`;

  try {
    const raw = await claudeMessage({
      model:  'claude-haiku-4-5-20251001',
      system: SYSTEM_PROMPT,
      prompt,
    });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!parsed.whatWasAnnounced || !parsed.whyItMatters) return null;
    return parsed as Enrichment;
  } catch (err: unknown) {
    if (err instanceof ClaudeQuotaError) throw err;
    console.warn(`  WARNING: Claude failed for "${item.title}": ${(err as Error).message}`);
    return null;
  }
}

// ── Write markdown file ───────────────────────────────────────────
function writeMarkdown(item: FeedItem, enrichment: Enrichment | null): string {
  const companyLabel = COMPANY_LABELS[item.company] ?? item.company;
  const tags = [companyLabel, 'AI News'];
  const emoji = enrichment?.coverEmoji ?? '📡';
  const dateStr = item.isoDate ? formatDate(new Date(item.isoDate)) : formatDate(new Date());

  const safeTitle   = item.title.replace(/"/g, '\\"');
  const safeExcerpt = (item.excerpt || item.title).slice(0, 160).replace(/"/g, '\\"').replace(/\n/g, ' ');

  const frontmatter = `---
title: "${safeTitle}"
date: "${dateStr}"
company: "${item.company}"
source_url: "${item.link}"
excerpt: "${safeExcerpt}"
tags: ${JSON.stringify(tags)}
coverEmoji: "${emoji}"
auto_generated: true
ai_enriched: ${enrichment !== null}
---

*Source: [${companyLabel}](${item.link})*

`;

  if (!enrichment) {
    return frontmatter + `## What was announced\n\n${item.excerpt || item.title}\n`;
  }

  const takeaways = enrichment.keyTakeaways.map(t => `- ${t}`).join('\n');

  return frontmatter + `## What was announced

${enrichment.whatWasAnnounced}

## Why it matters

${enrichment.whyItMatters}

## Key takeaways

${takeaways}
`;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\nAI News pipeline (last ${LOOKBACK_DAYS} day${LOOKBACK_DAYS > 1 ? 's' : ''})\n`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  // 1. Fetch all feeds
  console.log('Fetching RSS feeds...');
  const allItems: FeedItem[] = [];

  // Anthropic scrape
  const anthropicItems = await scrapeAnthropic(cutoff);
  allItems.push(...anthropicItems);

  // RSS feeds
  for (const feed of RSS_FEEDS) {
    const items = await fetchFeed(feed, cutoff);
    allItems.push(...items);
    console.log(`  ${feed.id}: ${items.length} recent item${items.length !== 1 ? 's' : ''}`);
  }

  // 2. Deduplicate — skip slugs that already have files
  const newItems = allItems.filter(item => {
    const filePath = path.join(OUT_DIR, `${item.slug}.md`);
    return !fs.existsSync(filePath);
  });

  console.log(`\n${newItems.length} new item${newItems.length !== 1 ? 's' : ''} (${allItems.length - newItems.length} already exist)\n`);

  if (newItems.length === 0) {
    console.log('Nothing new today — exiting.');
    process.exit(0);
  }

  // 3. Process newest items up to MAX_PER_RUN
  const toProcess = newItems
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
    .slice(0, MAX_PER_RUN);

  console.log(`Enriching ${toProcess.length} item${toProcess.length !== 1 ? 's' : ''} with Claude...\n`);

  const written: string[] = [];
  let quotaExhausted = false;
  for (const item of toProcess) {
    process.stdout.write(`  -> [${item.feedId}] ${item.title.slice(0, 55)}... `);

    let enrichment: Enrichment | null = null;
    if (!quotaExhausted) {
      // Fetch richer article content for better Claude context
      process.stdout.write('fetching article... ');
      const articleContent = item.link ? await fetchArticleContent(item.link) : '';
      try {
        enrichment = await enrich(item, articleContent);
      } catch (err) {
        if (err instanceof ClaudeQuotaError) {
          quotaExhausted = true;
          console.log('quota hit — writing remaining as plain');
        } else {
          throw err;
        }
      }
    }

    const md = writeMarkdown(item, enrichment);
    const filePath = path.join(OUT_DIR, `${item.slug}.md`);
    fs.writeFileSync(filePath, md, 'utf8');
    written.push(filePath);
    if (!quotaExhausted || enrichment) {
      console.log(enrichment ? 'enriched ✓' : 'plain');
    } else {
      console.log(`  ${item.slug} (plain)`);
    }
    if (!quotaExhausted) await sleep(1000);
  }

  console.log(`\nWrote ${written.length} file${written.length !== 1 ? 's' : ''} to content/ai-news/`);

  // 4. Commit and push
  console.log('\nPushing to GitHub...');
  try {
    for (const fp of written) {
      execSync('git add ' + fp, { stdio: 'inherit' });
    }
    const dateStr = formatDate(new Date());
    execSync(`git commit -m "ai-news: ${written.length} new article${written.length !== 1 ? 's' : ''} ${dateStr}"`, { stdio: 'inherit' });

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
      } catch {
        if (attempt === 3) throw new Error('push failed after 3 attempts');
        console.warn(`Push attempt ${attempt} failed, retrying...`);
      }
    }
    console.log('Deployed — Vercel is building now');
  } catch (err) {
    console.warn('Git push failed:', (err as Error).message);
  }
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
