/**
 * scrape-au-jobs.ts
 *
 * Scrapes IT job listings from:
 *   - Greenhouse direct API  (25 AU tech companies, free public boards API)
 *   - Lever direct API       (15 AU tech companies, free public postings API)
 *   - Jora.com.au            (public HTML aggregator)
 *   - ACS TechCareers RSS    (official RSS)
 *   - 80,000 Hours           (impact-focused board, weekly; AU/remote filter)
 *   - Apify actors           (Workday + Ashby tenants that block direct API)
 *
 * Results cached in the `scraped_jobs` Supabase table (30-day TTL).
 * Run: npx tsx --env-file=.env.local scripts/scrape-au-jobs.ts
 */

import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { load as cheerioLoad }  from 'cheerio';
import { createClient }         from '@supabase/supabase-js';
import Parser                   from 'rss-parser';
import crypto                   from 'crypto';
import { sourceLabel, formatAttribution, type SourceRef } from '@/lib/jobs-sources';
import type { Sponsor }         from './fetch-au-sponsors';
import { fetchApifyWorkdayJobs, fetchApifyAshbyJobs } from './apify-jobs';

if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

// ── Supabase ──────────────────────────────────────────────────────────────────

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const rssParser = new Parser({ timeout: 20000 });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedJob {
  id:               string;
  source:           string;
  primary_source:   string;
  sources:          SourceRef[];
  title:            string;
  company:          string;
  location:         string;
  description:      string;
  salary:           string | null;
  salary_min:       number | null;
  salary_max:       number | null;
  url:              string;
  category:         string;
  contract_type:    string | null;
  created:          string;
  dedup_key:        string;
  cluster_key:      string;
  expires_at:       string;
  sponsor_signal:   boolean;
  sponsor_confirmed: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const IT_KEYWORDS = [
  'software developer', 'frontend developer', 'backend developer',
  'full stack developer', 'devops engineer', 'data engineer',
  'QA engineer', 'cloud engineer', 'cyber security',
];

const LOCATIONS = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide'];

const IT_TITLE_RE = /\b(developer|engineer|devops|architect|analyst|scientist|dba|database|software|frontend|backend|fullstack|full.?stack|qa|tester|testing|security|cloud|aws|azure|gcp|machine.?learning|data|python|java|javascript|react|node|php|ruby|golang|kotlin|mobile|android|ios|sre|platform|infrastructure|network|systems|it.?support|helpdesk|cyber|soc|scrum|agile|product.?manager|ux|ui.?ux|devSecOps)\b/i;

function isITJob(title: string): boolean { return IT_TITLE_RE.test(title); }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
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
  const cleaned = raw.replace(/AUD\s*/gi, '$').replace(/,/g, '');
  const nums = [...cleaned.matchAll(/[\d]+(?:\.\d+)?/g)]
    .map(m => parseFloat(m[0])).filter(n => n > 0);
  if (!nums.length) return { text: raw.trim(), min: null, max: null };
  const lo = Math.min(...nums), hi = Math.max(...nums);
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
  return { text: lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`, min: lo, max: hi > lo ? hi : null };
}

function makeJob(source: string, overrides: Partial<ScrapedJob> & Pick<ScrapedJob, 'id' | 'title' | 'company' | 'url'>): ScrapedJob {
  const src    = overrides.sources ?? [{ name: source, label: sourceLabel(source), apply_url: overrides.url }];
  const key    = dedupKey(overrides.title, overrides.company);
  return {
    source,
    primary_source:   source,
    location:         'Australia',
    description:      '',
    salary:           null,
    salary_min:       null,
    salary_max:       null,
    category:         'IT Jobs',
    contract_type:    null,
    created:          new Date().toISOString(),
    dedup_key:        key,
    cluster_key:      key,
    expires_at:       expiresAt(),
    sponsor_signal:   false,
    sponsor_confirmed: false,
    ...overrides,
    sources: src,
  };
}

// ── Sponsor overlay ───────────────────────────────────────────────────────────
// Loads data/au-sponsors.json (seed or PDF-generated) and flags matching jobs.

function loadSponsors(): Sponsor[] {
  const p = 'data/au-sponsors.json';
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return []; }
}

function jaroWinklerSimple(a: string, b: string): number {
  if (a === b) return 1;
  const maxDist = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const m1 = new Uint8Array(a.length), m2 = new Uint8Array(b.length);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - maxDist), hi = Math.min(i + maxDist + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (m2[j] || a[i] !== b[j]) continue;
      m1[i] = m2[j] = 1; matches++; break;
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!m1[i]) continue; while (!m2[k]) k++;
    if (a[i] !== b[k]) t++; k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  if (jaro < 0.7) return jaro;
  let prefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length, 4); i++) {
    if (a[i] === b[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function normCo(name: string): string {
  return name.toLowerCase()
    .replace(/\bpty\s*\.?\s*ltd\.?/gi, '').replace(/\blimited\b/gi, '')
    .replace(/\bltd\.?\b/gi, '').replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function applySponsorOverlay(jobs: ScrapedJob[], sponsors: Sponsor[]): ScrapedJob[] {
  if (!sponsors.length) return jobs;
  return jobs.map(j => {
    const jNorm = normCo(j.company);
    const signal = sponsors.some(s => jaroWinklerSimple(s.normalised, jNorm) >= 0.92);
    return signal ? { ...j, sponsor_signal: true } : j;
  });
}

// ── Greenhouse direct API ─────────────────────────────────────────────────────
// Free public: boards-api.greenhouse.io/v1/boards/{slug}/jobs

const GREENHOUSE_AU_SLUGS = [
  'canva', 'cultureamp', 'octopusdeploy', 'immutable', 'eucalyptus',
  'safetyculture', 'envato', 'mable', 'buildkite', 'go1',
  'aconex', 'healthengine', 'aruma', 'ansarada', 'airwallex',
  'brighte', 'creditorwatch', 'fluentretail', 'up-education', 'whispir',
  'shippit', 'simpro', 'swoop', 'rezdy', 'employmenthero',
];

interface GreenhouseJob { id: number; title: string; location?: { name?: string }; absolute_url: string; updated_at: string; }
interface GreenhouseResponse { jobs: GreenhouseJob[]; }

async function fetchGreenhouseBoard(slug: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: GreenhouseResponse = await res.json();
    return (data.jobs ?? [])
      .filter(j => isITJob(j.title))
      .map(j => makeJob('greenhouse', {
        id:       hashId('greenhouse', slug, String(j.id)),
        title:    j.title,
        company:  slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        location: j.location?.name ?? 'Australia',
        url:      j.absolute_url,
        created:  j.updated_at ?? new Date().toISOString(),
        dedup_key: dedupKey(j.title, slug),
        cluster_key: dedupKey(j.title, slug),
      }));
  } catch (e) {
    if (!(e as Error).message.includes('404')) {
      console.warn(`  Greenhouse ${slug}: ${(e as Error).message}`);
    }
    return [];
  }
}

async function scrapeGreenhouse(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  for (const slug of GREENHOUSE_AU_SLUGS) {
    const jobs = await fetchGreenhouseBoard(slug);
    if (jobs.length) console.log(`  Greenhouse ${slug}: ${jobs.length}`);
    all.push(...jobs);
    await sleep(500);
  }
  return all;
}

// ── Lever direct API ──────────────────────────────────────────────────────────
// Free public: api.lever.co/v0/postings/{slug}?mode=json

const LEVER_AU_SLUGS = [
  'atlassian', 'realestate', 'carsales', 'afterpay', 'wisetech',
  'deputy', 'airtasker', 'linktree', 'rokt', 'liven',
  'zooplus-au', 'coviu', 'shippit', 'tyro', 'montu',
];

interface LeverPosting {
  id: string;
  text: string;
  categories?: { location?: string; team?: string };
  urls?: { apply?: string; show?: string };
  createdAt?: number;
  salaryRange?: { min?: number; max?: number; currency?: string };
}

async function fetchLeverBoard(slug: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: LeverPosting[] = await res.json();
    return data
      .filter(p => isITJob(p.text ?? ''))
      .map(p => {
        const sal = p.salaryRange;
        const salText = sal?.min && sal?.max
          ? `$${Math.round(sal.min / 1000)}k – $${Math.round(sal.max / 1000)}k`
          : null;
        return makeJob('lever', {
          id:           hashId('lever', slug, p.id),
          title:        p.text ?? '',
          company:      slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
          location:     p.categories?.location ?? 'Australia',
          url:          p.urls?.apply ?? p.urls?.show ?? `https://jobs.lever.co/${slug}/${p.id}`,
          salary:       salText,
          salary_min:   sal?.min ?? null,
          salary_max:   sal?.max ?? null,
          created:      p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          dedup_key:    dedupKey(p.text ?? '', slug),
          cluster_key:  dedupKey(p.text ?? '', slug),
        });
      });
  } catch (e) {
    if (!(e as Error).message.includes('404')) {
      console.warn(`  Lever ${slug}: ${(e as Error).message}`);
    }
    return [];
  }
}

async function scrapeLever(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  for (const slug of LEVER_AU_SLUGS) {
    const jobs = await fetchLeverBoard(slug);
    if (jobs.length) console.log(`  Lever ${slug}: ${jobs.length}`);
    all.push(...jobs);
    await sleep(500);
  }
  return all;
}

// ── 80,000 Hours ──────────────────────────────────────────────────────────────
// Impact-focused global job board; weekly fetch; filter for AU/remote + IT tags.

const EIGHTY_K_AU_TAGS = ['software', 'engineering', 'ml', 'security', 'data', 'ops', 'ai', 'devops'];

interface EightyKJob {
  id?: string | number;
  title?: string;
  organization?: string;
  company?: string;
  location?: string;
  tags?: string[];
  categories?: string[];
  url?: string;
  apply_url?: string;
  date_published?: string;
  published_at?: string;
}

function is80kAU(job: EightyKJob): boolean {
  const loc  = (job.location ?? '').toLowerCase();
  const isAU = loc.includes('australia') || loc.includes('remote') || loc.includes('anywhere') || loc === '';
  const tags  = [...(job.tags ?? []), ...(job.categories ?? [])].map(t => t.toLowerCase());
  const isIT  = tags.some(t => EIGHTY_K_AU_TAGS.some(kw => t.includes(kw)));
  return isAU && (isIT || isITJob(job.title ?? ''));
}

async function scrape80kHours(): Promise<ScrapedJob[]> {
  const endpoints = [
    'https://jobs.80000hours.org/jobs.json',
    'https://jobs.80000hours.org/api/v2/jobs',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const raw: unknown = await res.json();
      const items: EightyKJob[] = Array.isArray(raw) ? raw : ((raw as { jobs?: EightyKJob[] }).jobs ?? []);
      const filtered = items.filter(is80kAU);
      const jobs = filtered.map(j => makeJob('80kh', {
        id:       hashId('80kh', String(j.id ?? ''), j.title ?? '', j.url ?? ''),
        title:    j.title ?? '',
        company:  j.organization ?? j.company ?? '80,000 Hours',
        location: j.location ?? 'Remote',
        url:      j.url ?? j.apply_url ?? 'https://jobs.80000hours.org',
        created:  j.date_published ?? j.published_at ?? new Date().toISOString(),
        dedup_key:   dedupKey(j.title ?? '', j.organization ?? ''),
        cluster_key: dedupKey(j.title ?? '', j.organization ?? ''),
      }));
      console.log(`  80,000 Hours: ${items.length} total → ${jobs.length} AU IT`);
      return jobs;
    } catch { continue; }
  }
  console.warn('  80,000 Hours: no working endpoint found — skipping');
  return [];
}

// ── Jora scraper ──────────────────────────────────────────────────────────────

async function scrapeJoraPage(keyword: string, location: string): Promise<ScrapedJob[]> {
  const params = new URLSearchParams({ q: keyword, l: location });
  const res = await fetch(`https://au.jora.com/jobs?${params}`, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-AU,en;q=0.9' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Jora ${res.status}`);

  const $ = cheerioLoad(await res.text());
  const jobs: ScrapedJob[] = [];

  const cardSel    = '.organic-job, [class*="job-card"][class*="organic"]';
  const allCards   = $('[class*="job-card"][class*="result"]');
  const cards      = $(cardSel).length > 0 ? $(cardSel) : allCards;

  cards.each((_, el) => {
    const saveBtn  = $(el).find('.save-job-button, [class*="save-job"]').first();
    const jobId    = saveBtn.attr('data-job-id') ?? saveBtn.attr('data-id') ?? '';
    const titleEl  = $(el).find('.job-title');
    const rawTitle = titleEl.find('span').first().text().trim() || titleEl.text().trim();
    const half     = rawTitle.slice(0, rawTitle.length / 2);
    const title    = half && rawTitle === half + half ? half : rawTitle;
    const company  = $(el).find('.job-company').text().trim() || 'Unknown';
    const loc      = $(el).find('.job-location').text().trim() || location;
    const sal      = normalizeSalary($(el).find('[class*="salary"]').filter((_, e) => $(e).text().includes('$')).first().text());
    const href     = $(el).find('a[href*="/job/"]').first().attr('href') ?? '';
    const idFromUrl = href.match(/\/job\/[^?]*?-([a-f0-9]{8,})/i)?.[1] ?? jobId;
    const eid      = idFromUrl || jobId;
    const jobUrl   = href
      ? (href.startsWith('http') ? href.split('?')[0] : `https://au.jora.com${href.split('?')[0]}`)
      : (eid ? `https://au.jora.com/job/${eid}` : '');

    if (!title || !eid) return;

    jobs.push(makeJob('jora', {
      id:           `jora-${eid}`,
      title,
      company,
      location:     loc,
      description:  $(el).find('.job-abstract').text().trim(),
      salary:       sal.text,
      salary_min:   sal.min,
      salary_max:   sal.max,
      url:          jobUrl || `https://au.jora.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`,
      contract_type: $(el).find('[class*="job-type"]').text().trim() || null,
      dedup_key:    dedupKey(title, company),
      cluster_key:  dedupKey(title, company),
    }));
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
        all.push(...jobs); consecutiveErrors = 0;
      } catch (e) {
        consecutiveErrors++;
        const msg = String((e as Error).message);
        if (msg.includes('403') || msg.includes('429')) { console.warn('  Jora blocked — stopping'); return all; }
        console.warn(`  Jora error "${keyword}" ${location}: ${msg}`);
      }
      await sleep(DELAY_MS);
    }
  }
  return all;
}

// ── ACS RSS ───────────────────────────────────────────────────────────────────

async function scrapeACS(): Promise<ScrapedJob[]> {
  try {
    const feed = await rssParser.parseURL('https://techcareers.acs.org.au/rss/jobs');
    const jobs: ScrapedJob[] = [];
    for (const item of feed.items ?? []) {
      const title   = item.title?.replace(/\s*\|.*$/, '').trim() ?? '';
      const company = item.title?.match(/\|\s*(.+)$/)?.[1]?.trim() ?? 'ACS Partner';
      const url     = item.link ?? '';
      if (!title || !url) continue;
      const $      = cheerioLoad(item.content ?? item.summary ?? '');
      const sal    = normalizeSalary($('.salary').text().trim());
      jobs.push(makeJob('acs', {
        id:           hashId('acs', title, company, url),
        title,
        company,
        location:     $('.location').text().trim() || 'Australia',
        description:  $('body').text().replace(/\s+/g, ' ').trim(),
        salary:       sal.text,
        salary_min:   sal.min,
        salary_max:   sal.max,
        url,
        created:      item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        dedup_key:    dedupKey(title, company),
        cluster_key:  dedupKey(title, company),
      }));
    }
    console.log(`  ACS RSS: ${jobs.length} listings`);
    return jobs;
  } catch (e) {
    console.warn(`  ACS RSS error: ${(e as Error).message}`);
    return [];
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Map<string, ScrapedJob>();
  for (const job of jobs) {
    const existing = seen.get(job.cluster_key);
    if (!existing) {
      seen.set(job.cluster_key, job);
    } else {
      // Merge sources if same job from different ATS
      const seenNames = new Set(existing.sources.map(s => s.name));
      const merged    = job.sources.filter(s => !seenNames.has(s.name));
      if (merged.length) {
        existing.sources.push(...merged);
      }
    }
  }
  return Array.from(seen.values());
}

// ── Update attribution strings after dedup ────────────────────────────────────

function refreshAttribution(jobs: ScrapedJob[]): ScrapedJob[] {
  return jobs.map(j => ({ ...j, sources: j.sources }));
}

// ── Upsert ────────────────────────────────────────────────────────────────────

async function upsertJobs(jobs: ScrapedJob[]): Promise<number> {
  if (!jobs.length) return 0;
  const BATCH = 50;
  let saved = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const { error } = await sb.from('scraped_jobs').upsert(jobs.slice(i, i + BATCH), { onConflict: 'id' });
    if (error) console.error(`  Upsert error (batch ${Math.floor(i / BATCH) + 1}):`, error.message);
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

  const { error: tableErr } = await sb.from('scraped_jobs').select('id').limit(1);
  if (tableErr) {
    console.error('\n❌ scraped_jobs table not found. Run supabase/017_scraped_jobs.sql first.\n');
    process.exit(1);
  }

  const DRY_RUN = process.env.DRY_RUN === 'true';
  const sponsors = loadSponsors();
  console.log(`🔍 Scraping Australian IT jobs (Greenhouse + Lever + Jora + ACS + 80kh + Apify)...\n`);
  console.log(`   Sponsor overlay: ${sponsors.length} known 482 sponsors\n`);

  const { error: cleanErr } = await sb.from('scraped_jobs').delete().lt('expires_at', new Date().toISOString());
  if (cleanErr) console.warn('Cleanup warning:', cleanErr.message);
  else console.log('✓ Expired jobs cleaned\n');

  // Parallel fetch: Greenhouse + Lever + ACS + 80kh + Apify (all free-or-keyed sources)
  console.log('📋 Greenhouse (direct API)...');
  const ghJobs = await scrapeGreenhouse();
  console.log(`  → ${ghJobs.length} Greenhouse jobs\n`);

  await sleep(SOURCE_DELAY_MS);

  console.log('📋 Lever (direct API)...');
  const lvJobs = await scrapeLever();
  console.log(`  → ${lvJobs.length} Lever jobs\n`);

  await sleep(SOURCE_DELAY_MS);

  console.log('📋 ACS TechCareers (RSS)...');
  const acsJobs = await scrapeACS();
  console.log(`  → ${acsJobs.length} ACS jobs\n`);

  console.log('📋 80,000 Hours (impact board)...');
  const eightyKJobs = await scrape80kHours();
  console.log(`  → ${eightyKJobs.length} 80kh jobs\n`);

  // Apify (Workday + Ashby — only runs if APIFY_API_KEY is set)
  let apifyJobs: ScrapedJob[] = [];
  if (process.env.APIFY_API_KEY) {
    console.log('📋 Apify (Workday + Ashby)...');
    const [wdJobs, ashbyJobs] = await Promise.all([fetchApifyWorkdayJobs(), fetchApifyAshbyJobs()]);
    apifyJobs = [...wdJobs, ...ashbyJobs] as unknown as ScrapedJob[];
    console.log(`  → ${apifyJobs.length} Apify jobs\n`);
  }

  // Jora (last — slower HTML scraper)
  await sleep(SOURCE_DELAY_MS);
  console.log('📋 Jora (au.jora.com)...');
  const joraRaw = await scrapeJora();
  const joraJobs = joraRaw.filter(j => isITJob(j.title));
  console.log(`  → ${joraRaw.length} raw → ${joraJobs.length} IT-filtered Jora jobs\n`);

  // Combine, dedup, sponsor overlay
  const allRaw  = [...ghJobs, ...lvJobs, ...apifyJobs, ...acsJobs, ...eightyKJobs, ...joraJobs];
  const allUniq = deduplicateJobs(allRaw);
  const withSponsor = applySponsorOverlay(refreshAttribution(allUniq), sponsors);
  const sponsorCount = withSponsor.filter(j => j.sponsor_signal).length;

  console.log(`📊 Total: ${allRaw.length} raw → ${allUniq.length} unique (${sponsorCount} with 482 sponsor signal)`);

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN — skipping Supabase upsert');
    return;
  }

  console.log('\n💾 Saving to Supabase...');
  const saved = await upsertJobs(withSponsor);
  console.log(`\n✅ Done — ${saved} jobs saved to scraped_jobs`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
