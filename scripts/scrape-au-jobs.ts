/**
 * scrape-au-jobs.ts
 *
 * Scrapes IT job listings from:
 *   - Jora.com.au  (Seek-owned, scrapeable HTML — 15+ jobs per search)
 *   - ACS TechCareers RSS feed  (official RSS, clean structured data)
 *   - Indeed.com.au  (attempted; gracefully skipped if Cloudflare blocks)
 *
 * Results cached in the `scraped_jobs` Supabase table (30-day TTL).
 *
 * Run: npx tsx --env-file=.env.local scripts/scrape-au-jobs.ts
 *
 * Note on Seek/LinkedIn/Indeed:
 *   Seek and Indeed deploy Cloudflare bot-protection (HTTP 403) against server-side
 *   fetches from CI/VPS IPs. Jora (au.jora.com) is Seek-owned and serves the same
 *   listings without Cloudflare protection. LinkedIn is covered by the existing
 *   JSearch integration in /api/jobs.
 */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { load as cheerioLoad } from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import crypto from 'crypto';

if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

// ── Supabase ──────────────────────────────────────────────────────────────────

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const rssParser = new Parser({ timeout: 20000 });

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScrapedJob {
  id:            string;
  source:        'jora' | 'acs' | 'indeed';
  title:         string;
  company:       string;
  location:      string;
  description:   string;
  salary:        string | null;
  salary_min:    number | null;
  salary_max:    number | null;
  url:           string;
  category:      string;
  contract_type: string | null;
  created:       string;
  dedup_key:     string;
  expires_at:    string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const IT_KEYWORDS = [
  'software developer',
  'frontend developer',
  'backend developer',
  'full stack developer',
  'devops engineer',
  'data engineer',
  'QA engineer',
  'cloud engineer',
  'cyber security',
];

const LOCATIONS = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide'];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const DELAY_MS        = 1500;
const SOURCE_DELAY_MS = 3000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function dedupKey(title: string, company: string) {
  return `${title}|${company}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function expiresAt() {
  const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
}

function hashId(source: string, ...parts: string[]) {
  const h = crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);
  return `${source}-${h}`;
}

function normalizeSalary(raw: string | null | undefined) {
  if (!raw?.trim()) return { text: null, min: null, max: null };
  // Strip currency codes like AUD, extract numbers
  const cleaned = raw.replace(/AUD\s*/gi, '$').replace(/,/g, '');
  const nums = [...cleaned.matchAll(/[\d]+(?:\.\d+)?/g)]
    .map(m => parseFloat(m[0]))
    .filter(n => n > 0);
  if (!nums.length) return { text: raw.trim(), min: null, max: null };
  const lo = Math.min(...nums), hi = Math.max(...nums);
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
  return {
    text: lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`,
    min: lo,
    max: hi > lo ? hi : null,
  };
}

// ── Jora scraper ──────────────────────────────────────────────────────────────
// au.jora.com is Seek-owned; serves SSR HTML without Cloudflare protection.

async function scrapeJoraPage(keyword: string, location: string): Promise<ScrapedJob[]> {
  const params = new URLSearchParams({ q: keyword, l: location });
  const res = await fetch(`https://au.jora.com/jobs?${params}`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Jora ${res.status}`);

  const html = await res.text();
  const $    = cheerioLoad(html);
  const jobs: ScrapedJob[] = [];

  // Jora job cards: container has class "job-card result [organic-job|sponsored-job]"
  // data-job-id is on the save button inside the card, not on the card itself
  $('[class*="job-card"][class*="result"]').each((_, el) => {
    const saveBtn = $(el).find('.save-job-button, [class*="save-job"]').first();
    const jobId   = saveBtn.attr('data-job-id') ?? saveBtn.attr('data-id') ?? '';

    const titleEl  = $(el).find('.job-title');
    // Jora duplicates the title text in adjacent spans; deduplicate by taking only the first span
    const titleSpan = titleEl.find('span').first();
    const rawTitle = titleSpan.text().trim() || titleEl.text().trim();
    // Remove exact duplicate halves (e.g. "Foo BarFoo Bar" → "Foo Bar")
    const half  = rawTitle.slice(0, rawTitle.length / 2);
    const title = half && rawTitle === half + half ? half : rawTitle;
    const company  = $(el).find('.job-company').text().trim() || 'Unknown';
    const loc      = $(el).find('.job-location').text().trim() || location;
    const sal      = normalizeSalary($(el).find('[class*="salary"]').filter((_, e) => $(e).text().includes('$')).first().text());

    // Prefer explicit <a> link; fall back to constructing from job-id
    const href     = $(el).find('a[href*="/job/"]').first().attr('href') ?? '';
    // Extract ID from URL pattern: /job/Title-{jobId}
    const idFromUrl = href.match(/\/job\/[^?]*?-([a-f0-9]{8,})/i)?.[1] ?? jobId;
    const effectiveId = idFromUrl || jobId;
    const jobUrl   = href
      ? (href.startsWith('http') ? href.split('?')[0] : `https://au.jora.com${href.split('?')[0]}`)
      : (effectiveId ? `https://au.jora.com/job/${effectiveId}` : '');

    const abstract = $(el).find('.job-abstract').text().trim();

    if (!title || !effectiveId) return;

    jobs.push({
      id:            `jora-${effectiveId}`,
      source:        'jora',
      title,
      company,
      location:      loc,
      description:   abstract,
      salary:        sal.text,
      salary_min:    sal.min,
      salary_max:    sal.max,
      url:           jobUrl || `https://au.jora.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`,
      category:      'IT Jobs',
      contract_type: $(el).find('[class*="job-type"]').text().trim() || null,
      created:       new Date().toISOString(),
      dedup_key:     dedupKey(title, company),
      expires_at:    expiresAt(),
    });
  });

  return jobs;
}

async function scrapeJora(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  let consecutiveErrors = 0;

  for (const keyword of IT_KEYWORDS) {
    if (consecutiveErrors >= 3) { console.warn('  Jora: too many errors, stopping'); break; }
    for (const location of LOCATIONS) {
      try {
        const jobs = await scrapeJoraPage(keyword, location);
        console.log(`  Jora: "${keyword}" in ${location} → ${jobs.length}`);
        all.push(...jobs);
        consecutiveErrors = 0;
      } catch (e) {
        consecutiveErrors++;
        const msg = String((e as Error).message);
        if (msg.includes('403') || msg.includes('429')) {
          console.warn(`  Jora blocked — stopping Jora scrape`);
          return all;
        }
        console.warn(`  Jora error "${keyword}" ${location}: ${msg}`);
      }
      await sleep(DELAY_MS);
    }
  }

  return all;
}

// ── ACS RSS ───────────────────────────────────────────────────────────────────
// techcareers.acs.org.au/rss/jobs — public RSS, stable, includes salary + location.

async function scrapeACS(): Promise<ScrapedJob[]> {
  try {
    const feed  = await rssParser.parseURL('https://techcareers.acs.org.au/rss/jobs');
    const jobs: ScrapedJob[] = [];

    for (const item of feed.items ?? []) {
      const title   = item.title?.replace(/\s*\|.*$/, '').trim() ?? '';
      const company = item.title?.match(/\|\s*(.+)$/)?.[1]?.trim() ?? 'ACS Partner';
      const url     = item.link ?? '';

      if (!title || !url) continue;

      // Description contains salary + location as HTML
      const descHtml = item.content ?? item.summary ?? '';
      const $        = cheerioLoad(descHtml);
      const salRaw   = $('.salary').text().trim();
      const loc      = $('.location').text().trim() || 'Australia';
      const sal      = normalizeSalary(salRaw);

      jobs.push({
        id:            hashId('acs', title, company, url),
        source:        'acs',
        title,
        company,
        location:      loc,
        description:   $('body').text().replace(/\s+/g, ' ').trim(),
        salary:        sal.text,
        salary_min:    sal.min,
        salary_max:    sal.max,
        url,
        category:      'IT Jobs',
        contract_type: null,
        created:       item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        dedup_key:     dedupKey(title, company),
        expires_at:    expiresAt(),
      });
    }

    console.log(`  ACS RSS: ${jobs.length} listings`);
    return jobs;
  } catch (e) {
    console.warn(`  ACS RSS error: ${(e as Error).message}`);
    return [];
  }
}

// ── Indeed (best-effort) ──────────────────────────────────────────────────────
// Indeed blocks most server-side requests with Cloudflare 403.
// Included as best-effort; script continues gracefully if blocked.

async function scrapeIndeedPage(keyword: string, location: string): Promise<ScrapedJob[]> {
  const params = new URLSearchParams({ q: keyword, l: location });
  const res = await fetch(`https://au.indeed.com/jobs?${params}`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-AU,en;q=0.9',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Indeed ${res.status}`);

  const html = await res.text();
  const $    = cheerioLoad(html);
  const jobs: ScrapedJob[] = [];

  $('[class*="job_seen_beacon"], [class*="tapItem"]').each((_, el) => {
    const titleEl   = $(el).find('h2[class*="jobTitle"] a, a[class*="jcs-JobTitle"]');
    const title     = titleEl.attr('aria-label') ?? titleEl.text().trim();
    const company   = $(el).find('[data-testid="company-name"], [class*="companyName"]').text().trim() || 'Unknown';
    const loc       = $(el).find('[data-testid="text-location"], [class*="companyLocation"]').text().trim() || location;
    const sal       = normalizeSalary($(el).find('[class*="salary-snippet"], [class*="salaryText"]').first().text());
    const href      = titleEl.attr('href') ?? '';
    const jkMatch   = href.match(/jk=([a-f0-9]+)/i);
    const jobId     = jkMatch?.[1] ?? hashId('indeed', title, company, new Date().toDateString()).replace('indeed-', '');

    if (!title) return;
    jobs.push({
      id:            `indeed-${jobId}`,
      source:        'indeed',
      title, company, location: loc,
      description:   $(el).find('[class*="job-snippet"] li').map((_, li) => $(li).text().trim()).get().join(' '),
      salary:        sal.text, salary_min: sal.min, salary_max: sal.max,
      url:           href.startsWith('http') ? href : `https://au.indeed.com${href}`,
      category:      '', contract_type: null,
      created:       new Date().toISOString(),
      dedup_key:     dedupKey(title, company),
      expires_at:    expiresAt(),
    });
  });

  return jobs;
}

async function scrapeIndeed(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  // Only try a few searches — Indeed blocks quickly
  const sampleKeywords  = IT_KEYWORDS.slice(0, 3);
  const sampleLocations = LOCATIONS.slice(0, 2);

  for (const keyword of sampleKeywords) {
    for (const location of sampleLocations) {
      try {
        const jobs = await scrapeIndeedPage(keyword, location);
        console.log(`  Indeed: "${keyword}" in ${location} → ${jobs.length}`);
        all.push(...jobs);
      } catch (e) {
        const msg = String((e as Error).message);
        if (msg.includes('403') || msg.includes('429')) {
          console.warn(`  Indeed: blocked by Cloudflare — skipping`);
          return all;  // stop entirely, don't retry
        }
        console.warn(`  Indeed error "${keyword}" ${location}: ${msg}`);
      }
      await sleep(DELAY_MS);
    }
  }
  return all;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Map<string, ScrapedJob>();
  for (const job of jobs) {
    if (!seen.has(job.dedup_key)) seen.set(job.dedup_key, job);
  }
  return Array.from(seen.values());
}

// ── Upsert ────────────────────────────────────────────────────────────────────

async function upsertJobs(jobs: ScrapedJob[]): Promise<number> {
  if (!jobs.length) return 0;
  const BATCH = 50;
  let saved = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const { error } = await sb.from('scraped_jobs').upsert(jobs.slice(i, i + BATCH), { onConflict: 'id' });
    if (error) console.error(`  Upsert error (batch ${i / BATCH + 1}):`, error.message);
    else saved += Math.min(BATCH, jobs.length - i);
  }
  return saved;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Verify the table exists before starting slow scrapes
  const { error: tableErr } = await sb.from('scraped_jobs').select('id').limit(1);
  if (tableErr) {
    console.error('\n❌ scraped_jobs table not found in Supabase.');
    console.error('   Please run supabase/017_scraped_jobs.sql in the Supabase Dashboard → SQL Editor first.\n');
    process.exit(1);
  }

  console.log('🔍 Scraping Australian IT jobs...\n');

  // Cleanup expired
  const { error: cleanErr } = await sb.from('scraped_jobs').delete().lt('expires_at', new Date().toISOString());
  if (cleanErr) console.warn('Cleanup warning:', cleanErr.message);
  else console.log('✓ Expired jobs cleaned up\n');

  // Jora
  console.log('📋 Jora (au.jora.com)...');
  const joraJobs = await scrapeJora();
  console.log(`  → ${joraJobs.length} raw Jora results\n`);

  await sleep(SOURCE_DELAY_MS);

  // ACS
  console.log('📋 ACS TechCareers (RSS)...');
  const acsJobs = await scrapeACS();
  console.log(`  → ${acsJobs.length} ACS listings\n`);

  await sleep(SOURCE_DELAY_MS);

  // Indeed (best-effort)
  console.log('📋 Indeed (best-effort — may be blocked)...');
  const indeedJobs = await scrapeIndeed();
  console.log(`  → ${indeedJobs.length} Indeed results\n`);

  // Dedup + save
  const allUniq = deduplicateJobs([...joraJobs, ...acsJobs, ...indeedJobs]);
  console.log(`📊 ${joraJobs.length} Jora + ${acsJobs.length} ACS + ${indeedJobs.length} Indeed = ${joraJobs.length + acsJobs.length + indeedJobs.length} raw → ${allUniq.length} unique`);

  console.log('\n💾 Saving to Supabase...');
  const saved = await upsertJobs(allUniq);
  console.log(`\n✅ Done — ${saved} jobs saved to scraped_jobs`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
