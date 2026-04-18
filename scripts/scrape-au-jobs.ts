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
  source:        'jora' | 'acs' | 'indeed' | 'seek' | 'arbeitnow' | 'freelancer';
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
  job_type:      'onsite' | 'remote' | 'freelance';
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

// ── IT job filter — reject sponsored/unrelated results from Jora ──────────────
const IT_TITLE_RE = /\b(developer|engineer|devops|architect|analyst|scientist|dba|database|software|frontend|backend|fullstack|full.?stack|qa|tester|testing|security|cloud|aws|azure|gcp|machine.?learning|data|python|java|javascript|react|node|php|ruby|golang|kotlin|mobile|android|ios|sre|platform|infrastructure|network|systems|it.?support|helpdesk|cyber|soc|scrum|agile|product.?manager|ux|ui.?ux|devSecOps)\b/i;

function isITJob(title: string, description: string): boolean {
  return IT_TITLE_RE.test(title) || IT_TITLE_RE.test(description.slice(0, 300));
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const DELAY_MS        = 1500;
const SOURCE_DELAY_MS = 3000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function dedupKey(title: string, company: string) {
  return `${title}|${company}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

const REMOTE_PATTERN  = /\bremote\b/i;
const INDEED_JK_RE    = /jk=([a-f0-9]+)/i;

function stripHtmlTags(html: string): string {
  // Iteratively strip tags to handle nested/malformed HTML like <scr<script>ipt>
  let result = html;
  let prev = '';
  while (prev !== result) {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  }
  return result;
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

  // Prefer organic results only; fall back to all results if none found
  // (Jora sponsored slots show unrelated jobs — we filter by IT title later)
  const cardSel = '.organic-job, [class*="job-card"][class*="organic"]';
  const organicCards = $(cardSel);
  const allCards = $('[class*="job-card"][class*="result"]');
  const cards = organicCards.length > 0 ? organicCards : allCards;

  cards.each((_, el) => {
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

    const isRemote = REMOTE_PATTERN.test(title) || REMOTE_PATTERN.test(loc);

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
      job_type:      isRemote ? 'remote' : 'onsite',
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
        job_type:      REMOTE_PATTERN.test(loc) ? 'remote' : 'onsite',
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
    const jkMatch   = href.match(INDEED_JK_RE);
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
      job_type:      REMOTE_PATTERN.test(title) || REMOTE_PATTERN.test(loc) ? 'remote' : 'onsite',
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

// ── Seek via Apify ────────────────────────────────────────────────────────────
// Apify hosts a Seek.com.au scraper actor. Set APIFY_TOKEN env var to enable.
// Free tier: 5 USD/month credit. Sign up at https://apify.com (free plan available).
// Actor used: https://apify.com/websift/seek-job-scraper

const APIFY_TOKEN  = process.env.APIFY_TOKEN;
const SEEK_ACTOR   = 'websift~seek-job-scraper';

async function scrapeSeekViaApify(): Promise<ScrapedJob[]> {
  if (!APIFY_TOKEN) {
    console.log('  Seek/Apify: APIFY_TOKEN not set — skipping (set it to enable Seek.com.au results)');
    return [];
  }

  const allJobs: ScrapedJob[] = [];

  for (const keyword of IT_KEYWORDS.slice(0, 5)) {   // limit to 5 keywords to save Apify credits
    for (const location of LOCATIONS.slice(0, 3)) {   // Brisbane, Sydney, Melbourne
      try {
        // Run actor synchronously and wait for results (timeout 120s)
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${SEEK_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=90&memory=256`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword,
              location,
              maxPages:  2,
              maxItems:  20,
            }),
            signal: AbortSignal.timeout(120000),
          },
        );

        if (!runRes.ok) {
          const errText = await runRes.text();
          console.warn(`  Seek/Apify: HTTP ${runRes.status} for "${keyword}" ${location}: ${errText.slice(0, 100)}`);
          continue;
        }

        const items: any[] = await runRes.json();
        console.log(`  Seek: "${keyword}" in ${location} → ${items.length}`);

        for (const item of items) {
          const sal = normalizeSalary(item.salary ?? null);
          const seekTitle = item.title ?? '';
          const seekLoc   = item.location ?? location;
          allJobs.push({
            id:            `seek-${item.jobId ?? hashId('seek', item.title ?? '', item.company ?? '', item.url ?? '')}`,
            source:        'seek' as const,
            title:         seekTitle,
            company:       item.advertiser ?? item.company ?? 'Unknown',
            location:      seekLoc,
            description:   item.teaser ?? item.description ?? '',
            salary:        sal.text ?? item.salary ?? null,
            salary_min:    sal.min,
            salary_max:    sal.max,
            url:           item.url ?? `https://www.seek.com.au/job/${item.jobId ?? ''}`,
            category:      item.classification ?? 'IT Jobs',
            contract_type: item.workType ?? null,
            created:       item.listingDate ?? new Date().toISOString(),
            dedup_key:     dedupKey(item.title ?? '', item.advertiser ?? item.company ?? ''),
            expires_at:    expiresAt(),
            job_type:      REMOTE_PATTERN.test(seekTitle) || REMOTE_PATTERN.test(seekLoc) ? 'remote' : 'onsite',
          });
        }

        await sleep(DELAY_MS);
      } catch (e) {
        console.warn(`  Seek/Apify error "${keyword}" ${location}: ${(e as Error).message}`);
      }
    }
    await sleep(SOURCE_DELAY_MS);
  }

  return allJobs;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Map<string, ScrapedJob>();
  for (const job of jobs) {
    if (!seen.has(job.dedup_key)) seen.set(job.dedup_key, job);
  }
  return Array.from(seen.values());
}

// ── Indeed via RapidAPI (more reliable than direct scraping) ──────────────────
// Uses the "Indeed12" API on RapidAPI. Shares the same RAPIDAPI_KEY as JSearch.

const RAPIDAPI_KEY_SCRAPER = process.env.RAPIDAPI_KEY;

async function scrapeIndeedRapidAPI(): Promise<ScrapedJob[]> {
  if (!RAPIDAPI_KEY_SCRAPER) {
    console.log('  Indeed/RapidAPI: RAPIDAPI_KEY not set — skipping (set it to enable Indeed API results)');
    return [];
  }

  const allJobs: ScrapedJob[] = [];
  const sampleKeywords  = IT_KEYWORDS.slice(0, 5);
  const sampleLocations = LOCATIONS.slice(0, 3);

  for (const keyword of sampleKeywords) {
    for (const location of sampleLocations) {
      try {
        const params = new URLSearchParams({
          query:    `${keyword} in ${location}`,
          location: `${location}, Australia`,
          page_id:  '1',
          country:  'au',
          locality: 'au',
        });
        const res = await fetch(
          `https://indeed12.p.rapidapi.com/jobs/search?${params}`,
          {
            headers: {
              'X-RapidAPI-Key':  RAPIDAPI_KEY_SCRAPER,
              'X-RapidAPI-Host': 'indeed12.p.rapidapi.com',
            },
            signal: AbortSignal.timeout(15000),
          },
        );
        if (!res.ok) {
          console.warn(`  Indeed/RapidAPI: HTTP ${res.status} for "${keyword}" ${location}`);
          continue;
        }

        const json = await res.json();
        const hits: any[] = json.hits ?? json.results ?? json.data ?? [];
        console.log(`  Indeed/RapidAPI: "${keyword}" in ${location} → ${hits.length}`);

        for (const r of hits.slice(0, 20)) {
          const title   = r.title ?? r.job_title ?? '';
          const company = r.company_name ?? r.company ?? 'Unknown';
          const loc     = r.location ?? `${location}, Australia`;
          const isRemote = REMOTE_PATTERN.test(title) || REMOTE_PATTERN.test(loc);

          let salText: string | null = null;
          let salMin: number | null = null;
          let salMax: number | null = null;
          if (r.salary_min && r.salary_max) {
            salMin = r.salary_min;
            salMax = r.salary_max;
            salText = `$${Math.round(r.salary_min / 1000)}k – $${Math.round(r.salary_max / 1000)}k`;
          } else if (r.formatted_salary) {
            salText = r.formatted_salary;
          }

          const jobId = r.id ?? r.job_id ?? r.indeed_final_url?.match(INDEED_JK_RE)?.[1] ?? hashId('indeed-api', title, company, loc).replace('indeed-api-', '');

          allJobs.push({
            id:            `indeed-${jobId}`,
            source:        'indeed',
            title,
            company,
            location:      loc,
            description:   (r.snippet ?? r.description ?? '').slice(0, 500),
            salary:        salText,
            salary_min:    salMin,
            salary_max:    salMax,
            url:           r.indeed_final_url ?? r.link ?? r.url ?? `https://au.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`,
            category:      r.job_type ?? 'IT Jobs',
            contract_type: r.job_type ?? null,
            created:       r.pub_date_ts_milli ? new Date(r.pub_date_ts_milli).toISOString() : new Date().toISOString(),
            dedup_key:     dedupKey(title, company),
            expires_at:    expiresAt(),
            job_type:      isRemote ? 'remote' : 'onsite',
          });
        }

        await sleep(DELAY_MS);
      } catch (e) {
        console.warn(`  Indeed/RapidAPI error "${keyword}" ${location}: ${(e as Error).message}`);
      }
    }
    await sleep(SOURCE_DELAY_MS);
  }

  return allJobs;
}

// ── Arbeitnow (Remote AU IT Jobs — free public API) ──────────────────────────
// arbeitnow.com/api/job-board-api — free, no auth required.

async function scrapeArbeitnowRemote(): Promise<ScrapedJob[]> {
  const allJobs: ScrapedJob[] = [];
  const remoteKeywords = ['developer', 'engineer', 'devops', 'data', 'software'];

  for (const keyword of remoteKeywords) {
    try {
      const params = new URLSearchParams({
        search:   keyword,
        location: 'australia',
        remote:   'true',
        page:     '1',
      });
      const res = await fetch(
        `https://arbeitnow.com/api/job-board-api?${params}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) {
        console.warn(`  Arbeitnow: HTTP ${res.status} for "${keyword}"`);
        continue;
      }

      const json = await res.json();
      const items: any[] = json.data ?? [];
      console.log(`  Arbeitnow: "${keyword}" → ${items.length}`);

      for (const r of items.slice(0, 15)) {
        const title   = r.title ?? '';
        const company = r.company_name ?? 'Unknown';
        allJobs.push({
          id:            `arbeitnow-${r.slug ?? hashId('arbeitnow', title, company, '').replace('arbeitnow-', '')}`,
          source:        'arbeitnow',
          title,
          company,
          location:      r.location ?? 'Remote (Australia)',
          description:   stripHtmlTags(r.description ?? '').slice(0, 500),
          salary:        null,
          salary_min:    null,
          salary_max:    null,
          url:           r.url ?? `https://arbeitnow.com/view/${r.slug ?? ''}`,
          category:      r.tags?.join(', ') ?? 'IT Jobs',
          contract_type: 'Remote',
          created:       r.created_at ? new Date(r.created_at * 1000).toISOString() : new Date().toISOString(),
          dedup_key:     dedupKey(title, company),
          expires_at:    expiresAt(),
          job_type:      'remote',
        });
      }

      await sleep(DELAY_MS);
    } catch (e) {
      console.warn(`  Arbeitnow error "${keyword}": ${(e as Error).message}`);
    }
  }

  return allJobs;
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

  // Indeed (best-effort direct scraping)
  console.log('📋 Indeed (best-effort — may be blocked)...');
  const indeedJobs = await scrapeIndeed();
  console.log(`  → ${indeedJobs.length} Indeed results\n`);

  await sleep(SOURCE_DELAY_MS);

  // Indeed via RapidAPI (more reliable, requires RAPIDAPI_KEY)
  console.log('📋 Indeed via RapidAPI (requires RAPIDAPI_KEY)...');
  const indeedAPIJobs = await scrapeIndeedRapidAPI();
  console.log(`  → ${indeedAPIJobs.length} Indeed/RapidAPI results\n`);

  await sleep(SOURCE_DELAY_MS);

  // Seek via Apify (set APIFY_TOKEN env var to enable)
  console.log('📋 Seek.com.au (via Apify — requires APIFY_TOKEN)...');
  const seekJobs = await scrapeSeekViaApify();
  console.log(`  → ${seekJobs.length} Seek results\n`);

  await sleep(SOURCE_DELAY_MS);

  // Arbeitnow (remote AU IT jobs — free, no auth)
  console.log('📋 Arbeitnow (remote AU IT jobs — free API)...');
  const arbeitnowJobs = await scrapeArbeitnowRemote();
  console.log(`  → ${arbeitnowJobs.length} Arbeitnow remote results\n`);

  // Filter non-IT jobs (Jora/Indeed sponsored results are often unrelated)
  const joraIT          = joraJobs.filter(j => isITJob(j.title, j.description));
  const indeedIT        = indeedJobs.filter(j => isITJob(j.title, j.description));
  const indeedAPIIT     = indeedAPIJobs.filter(j => isITJob(j.title, j.description));
  const seekIT          = seekJobs.filter(j => isITJob(j.title, j.description));
  const arbeitnowIT     = arbeitnowJobs.filter(j => isITJob(j.title, j.description));
  console.log(`  Jora IT-filtered: ${joraJobs.length} raw → ${joraIT.length} kept`);
  console.log(`  Indeed (direct) IT-filtered: ${indeedJobs.length} raw → ${indeedIT.length} kept`);
  console.log(`  Indeed (RapidAPI) IT-filtered: ${indeedAPIJobs.length} raw → ${indeedAPIIT.length} kept`);
  console.log(`  Seek IT-filtered: ${seekJobs.length} raw → ${seekIT.length} kept`);
  console.log(`  Arbeitnow IT-filtered: ${arbeitnowJobs.length} raw → ${arbeitnowIT.length} kept`);

  // Dedup + save
  const allUniq = deduplicateJobs([...seekIT, ...joraIT, ...acsJobs, ...indeedIT, ...indeedAPIIT, ...arbeitnowIT]);
  const totalRaw = seekIT.length + joraIT.length + acsJobs.length + indeedIT.length + indeedAPIIT.length + arbeitnowIT.length;
  console.log(`📊 ${seekIT.length} Seek + ${joraIT.length} Jora + ${acsJobs.length} ACS + ${indeedIT.length} Indeed(direct) + ${indeedAPIIT.length} Indeed(API) + ${arbeitnowIT.length} Arbeitnow = ${totalRaw} IT jobs → ${allUniq.length} unique`);

  console.log('\n💾 Saving to Supabase...');
  const saved = await upsertJobs(allUniq);
  console.log(`\n✅ Done — ${saved} jobs saved to scraped_jobs`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
