import dotenv from 'dotenv';
import { existsSync } from 'fs';
if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();
import Parser from 'rss-parser';
import { claudeMessage, ClaudeQuotaError } from './llm-claude';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';


const parser  = new Parser({ timeout: 20000 });

// ── Config ────────────────────────────────────────────────────────
const MAX_PER_RUN   = 4;
const daysArg = process.argv.indexOf('--days');
const LOOKBACK_DAYS = daysArg >= 0 ? parseInt(process.argv[daysArg + 1], 10) : 1;
const OUT_DIR = path.join(process.cwd(), 'content', 'visa-news');

const RSS_FEEDS: { id: string; label: string; url: string }[] = [
  { id: 'home-affairs',       label: 'Department of Home Affairs', url: 'https://immi.homeaffairs.gov.au/news-media/rss' },
  { id: 'abf',                label: 'Australian Border Force',    url: 'https://www.abf.gov.au/news-media/rss' },
  { id: 'acs',                label: 'ACS',                        url: 'https://www.acs.org.au/news/rss' },
  { id: 'study-international', label: 'Study International',       url: 'https://studyinternational.com/feed/' },
  { id: 'migration-alliance', label: 'Migration Alliance',         url: 'https://www.migrationalliance.com.au/feed/' },
  { id: 'universities-au',    label: 'Universities Australia',     url: 'https://www.universitiesaustralia.edu.au/news/rss/' },
];

// Visa type keywords → subclass tags
const VISA_PATTERNS: { pattern: RegExp; types: string[] }[] = [
  { pattern: /\b482\b|TSS|Temporary Skill Shortage/i,          types: ['482'] },
  { pattern: /\b189\b|Skilled Independent/i,                   types: ['189'] },
  { pattern: /\b190\b|Skilled Nominated/i,                     types: ['190'] },
  { pattern: /\b485\b|Graduate Temporary/i,                    types: ['485'] },
  { pattern: /\b491\b|Skilled Work Regional/i,                 types: ['491'] },
  { pattern: /\b500\b|student visa|international student/i,    types: ['500'] },
  { pattern: /\bPR\b|permanent residence|permanent residency/i, types: ['PR'] },
  { pattern: /\bENS\b|\b186\b/i,                               types: ['186'] },
  { pattern: /\bRSMS\b|\b187\b/i,                              types: ['187'] },
  { pattern: /skilled migration|MLTSSL|STSOL/i,                types: ['skilled'] },
];

// Audience keywords
const AUDIENCE_PATTERNS: { pattern: RegExp; audience: string[] }[] = [
  { pattern: /international student|student visa|500/i, audience: ['students'] },
  { pattern: /482|TSS|skilled worker|sponsored/i,       audience: ['skilled-workers'] },
  { pattern: /permanent residence|PR|189|190|491/i,     audience: ['pr-applicants'] },
  { pattern: /graduate|485/i,                           audience: ['graduates'] },
  { pattern: /employer|sponsor|nomination/i,            audience: ['employers'] },
];

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

function classifyVisaTypes(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, types } of VISA_PATTERNS) {
    if (pattern.test(text)) types.forEach(t => found.add(t));
  }
  return found.size > 0 ? Array.from(found) : ['general'];
}

function classifyAudience(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, audience } of AUDIENCE_PATTERNS) {
    if (pattern.test(text)) audience.forEach(a => found.add(a));
  }
  return found.size > 0 ? Array.from(found) : ['skilled-workers'];
}

// ── Fetch items from one RSS feed ─────────────────────────────────
interface FeedItem {
  feedId:    string;
  source:    string;  // matches frontmatter 'source' field
  label:     string;
  title:     string;
  link:      string;
  isoDate:   string;
  excerpt:   string;
  slug:      string;
  visaTypes: string[];
  audience:  string[];
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<FeedItem[]> {
  try {
    console.log(`  Fetching ${feed.id}...`);
    const result = await parser.parseURL(feed.url);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

    return (result.items ?? [])
      .filter(item => item.isoDate && new Date(item.isoDate) >= cutoff)
      .map(item => {
        const title   = item.title ?? 'Untitled';
        const date    = item.isoDate ? formatDate(new Date(item.isoDate)) : formatDate(new Date());
        const slug    = `${date}-${feed.id}-${kebabCase(title)}`;
        const excerpt = (item.contentSnippet ?? item.content ?? item.summary ?? '')
          .replace(/<[^>]*>/g, '')
          .slice(0, 800);
        const combined = `${title} ${excerpt}`;
        return {
          feedId:    feed.id,
          source:    feed.id,
          label:     feed.label,
          title,
          link:      item.link ?? '',
          isoDate:   item.isoDate ?? '',
          excerpt,
          slug,
          visaTypes: classifyVisaTypes(combined),
          audience:  classifyAudience(combined),
        };
      });
  } catch (err) {
    console.warn(`  WARNING: ${feed.id} feed failed: ${(err as Error).message}`);
    return [];
  }
}

// ── Claude enrichment ─────────────────────────────────────────────
interface Enrichment {
  whatChanged:      string;
  whatItMeansForYou: string;
  actionItems:      string[];
  whoIsAffected:    string;
  coverEmoji:       string;
}

const SYSTEM_PROMPT = `You are a plain-English immigration explainer writing for skilled migrants and international students in Australia.
Your audience: people on 482, 485, 189, 190, or 500 visas — NOT lawyers, on tight timelines, anxious about their status.
Tone: direct, empathetic, never alarmist. Think "knowledgeable friend who works in immigration, not a lawyer giving you a bill."
Always include a reminder to consult a registered migration agent (MARA) where there is legal ambiguity.
Never give legal advice. Return valid JSON only.`;

async function enrich(item: FeedItem, attempt = 1): Promise<Enrichment | null> {
  const prompt = `Source: ${item.label}
Title: ${item.title}
URL: ${item.link}
Excerpt: ${item.excerpt || '(no excerpt — infer from title)'}

Return JSON:
{
  "whatChanged": "2-3 sentences — what exactly changed or was announced? Be specific about dates, numbers, and visa subclasses.",
  "whatItMeansForYou": "2-3 sentences — practical consequence for the affected person. Start with 'If you are on a [visa type]...' where relevant.",
  "actionItems": ["- [ ] Concrete action step 1", "- [ ] Concrete action step 2", "- [ ] Concrete action step 3"],
  "whoIsAffected": "One sentence naming the specific audience (e.g. 'Primary 482 holders in regional NSW' or 'International students at Group of Eight universities').",
  "coverEmoji": "one emoji related to immigration/visas/Australia"
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
    if (!parsed.whatChanged || !parsed.whatItMeansForYou) return null;
    return parsed as Enrichment;
  } catch (err: unknown) {
    if (err instanceof ClaudeQuotaError) throw err;
    console.warn(`  WARNING: Claude failed for "${item.title}": ${(err as Error).message}`);
    return null;
  }
}

// ── Write markdown file ───────────────────────────────────────────
function writeMarkdown(item: FeedItem, enrichment: Enrichment | null): string {
  const tags = ['Visa', 'Australia', item.label];
  const emoji = enrichment?.coverEmoji ?? '🛂';
  const dateStr = item.isoDate ? formatDate(new Date(item.isoDate)) : formatDate(new Date());

  const safeTitle   = item.title.replace(/"/g, '\\"');
  const safeExcerpt = (item.excerpt || item.title).slice(0, 160).replace(/"/g, '\\"').replace(/\n/g, ' ');

  const frontmatter = `---
title: "${safeTitle}"
date: "${dateStr}"
source: "${item.source}"
source_url: "${item.link}"
excerpt: "${safeExcerpt}"
visa_types: ${JSON.stringify(item.visaTypes)}
audience: ${JSON.stringify(item.audience)}
tags: ${JSON.stringify(tags)}
coverEmoji: "${emoji}"
auto_generated: true
ai_enriched: ${enrichment !== null}
---

*Source: [${item.label}](${item.link}) — ${dateStr}*

> **Not legal advice.** Always consult a [MARA-registered migration agent](https://www.mara.gov.au/consumer-information/find-a-registered-migration-agent/) for your specific situation.

`;

  if (!enrichment) {
    return frontmatter + `## What changed\n\n${item.excerpt || item.title}\n`;
  }

  const actionItems = Array.isArray(enrichment.actionItems)
    ? enrichment.actionItems.map(a => a.startsWith('- [ ]') ? a : `- [ ] ${a.replace(/^-\s*/, '')}`).join('\n')
    : '- [ ] Review the full announcement on the official source';

  return frontmatter + `## What changed

${enrichment.whatChanged}

## What this means for you

${enrichment.whatItMeansForYou}

## Action items

${actionItems}

## Who is affected

${enrichment.whoIsAffected}

**Visa types:** ${item.visaTypes.join(', ')}
**Audience:** ${item.audience.join(', ')}
`;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\nVisa News pipeline (last ${LOOKBACK_DAYS} day${LOOKBACK_DAYS > 1 ? 's' : ''})\n`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Fetch all feeds
  console.log('Fetching RSS feeds...');
  const allItems: FeedItem[] = [];
  for (const feed of RSS_FEEDS) {
    const items = await fetchFeed(feed);
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
  for (const item of toProcess) {
    process.stdout.write(`  -> [${item.feedId}] ${item.title.slice(0, 60)}... `);
    const enrichment = await enrich(item);
    const md = writeMarkdown(item, enrichment);
    const filePath = path.join(OUT_DIR, `${item.slug}.md`);
    fs.writeFileSync(filePath, md, 'utf8');
    written.push(filePath);
    console.log(enrichment ? 'enriched' : 'plain');
    await sleep(1000);
  }

  console.log(`\nWrote ${written.length} file${written.length !== 1 ? 's' : ''} to content/visa-news/`);

  // 4. Commit and push
  console.log('\nPushing to GitHub...');
  try {
    for (const fp of written) {
      execSync('git add ' + fp, { stdio: 'inherit' });
    }
    const dateStr = formatDate(new Date());
    execSync(`git commit -m "visa-news: ${written.length} new article${written.length !== 1 ? 's' : ''} ${dateStr}"`, { stdio: 'inherit' });

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
