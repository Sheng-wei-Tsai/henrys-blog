/**
 * apify-jobs.ts
 *
 * Fetches AU IT jobs via Apify actors for ATSes that block direct API access.
 * Covers: Workday tenants, Ashby boards.
 * Greenhouse and Lever are fetched for free directly in scrape-au-jobs.ts.
 *
 * Run: npx tsx --env-file=.env.local scripts/apify-jobs.ts
 */

import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { sourceLabel } from '@/lib/jobs-sources';

if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_BASE    = 'https://api.apify.com/v2';
const POLL_INTERVAL = 5_000;
const MAX_WAIT_MS   = 10 * 60_000;

// Known AU tech companies on Workday (no free public jobs API)
const WORKDAY_AU_TENANTS = [
  'atlassian', 'seek', 'realestate', 'carsales', 'domain',
  'xero', 'afterpay', 'zip', 'wisetech', 'myob',
  'iress', 'computershare', 'telstra', 'healthengine',
];

// Known AU tech companies on Ashby
const ASHBY_AU_SLUGS = [
  'buildkite', 'linktree', 'eucalyptus', 'airtasker',
  'liven', 'rokt', 'up-bank',
];

export interface ApifyJobResult {
  id:               string;
  source:           'workday' | 'ashby';
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
  primary_source:   string;
  sources:          { name: string; label: string; apply_url: string }[];
  sponsor_signal:   boolean;
  sponsor_confirmed: boolean;
}

type ApifyStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT' | 'READY';

interface ApifyRaw {
  title?:          string;
  position?:       string;
  company?:        string;
  organization?:   string;
  location?:       string;
  jobLocation?:    string;
  url?:            string;
  applyUrl?:       string;
  apply_url?:      string;
  jobUrl?:         string;
  description?:    string;
  salary?:         string;
  datePosted?:     string;
  postedAt?:       string;
  employment_type?: string;
  jobType?:        string;
}

function isAU(location: string): boolean {
  const l = location.toLowerCase();
  return l.includes('australia') || l.includes('sydney') || l.includes('melbourne') ||
    l.includes('brisbane') || l.includes('perth') || l.includes('adelaide') ||
    l.includes('canberra') || l.includes('hobart') || l.includes(',au') ||
    l.endsWith(' au') || l.includes('remote');
}

function normalizeJob(raw: ApifyRaw, source: 'workday' | 'ashby', company: string): ApifyJobResult | null {
  const title   = (raw.title ?? raw.position ?? '').trim();
  const co      = (raw.company ?? raw.organization ?? company).trim();
  const loc     = (raw.location ?? raw.jobLocation ?? 'Australia').trim();
  const url     = (raw.url ?? raw.applyUrl ?? raw.apply_url ?? raw.jobUrl ?? '').trim();

  if (!title || !url) return null;
  if (!isAU(loc)) return null;

  const now      = new Date();
  const expires  = new Date(now); expires.setDate(expires.getDate() + 30);
  const created  = raw.datePosted ?? raw.postedAt ?? now.toISOString();
  const id       = `${source}-${Buffer.from(url).toString('base64url').slice(0, 12)}`;
  const key      = `${title}|${co}`.toLowerCase().replace(/\s+/g, ' ').trim();

  return {
    id,
    source,
    title,
    company:          co,
    location:         loc,
    description:      raw.description ?? '',
    salary:           raw.salary ?? null,
    salary_min:       null,
    salary_max:       null,
    url,
    category:         'IT Jobs',
    contract_type:    raw.employment_type ?? raw.jobType ?? null,
    created:          new Date(created).toISOString(),
    dedup_key:        key,
    cluster_key:      key,
    expires_at:       expires.toISOString(),
    primary_source:   source,
    sources:          [{ name: source, label: sourceLabel(source), apply_url: url }],
    sponsor_signal:   false,
    sponsor_confirmed: false,
  };
}

async function runActor(actorId: string, input: object): Promise<ApifyRaw[]> {
  if (!APIFY_API_KEY) throw new Error('APIFY_API_KEY not set');

  const runRes = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${APIFY_API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  });
  if (!runRes.ok) throw new Error(`Apify start failed (${runRes.status}): ${actorId}`);
  const { data: runData } = await runRes.json() as { data: { id: string } };
  const runId = runData.id;

  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const sr = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    const { data: sd } = await sr.json() as { data: { status: ApifyStatus } };
    if (sd.status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(sd.status))
      throw new Error(`Apify run ${runId} ended: ${sd.status}`);
  }

  const ir = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}&format=json`);
  return ir.json() as Promise<ApifyRaw[]>;
}

export async function fetchApifyWorkdayJobs(): Promise<ApifyJobResult[]> {
  if (!APIFY_API_KEY) { console.warn('  Apify: APIFY_API_KEY not set — skipping Workday'); return []; }
  try {
    const items = await runActor('fantastic-jobs/workday-jobs-api', {
      companies:    WORKDAY_AU_TENANTS,
      country:      'Australia',
      maxJobsPerCompany: 50,
    });
    const jobs = items.flatMap(raw => {
      const company = (raw.company ?? raw.organization ?? '').trim();
      const result  = normalizeJob(raw, 'workday', company);
      return result ? [result] : [];
    });
    console.log(`  Apify Workday: ${items.length} raw → ${jobs.length} AU IT jobs`);
    return jobs;
  } catch (e) {
    console.warn('  Apify Workday error:', (e as Error).message);
    return [];
  }
}

export async function fetchApifyAshbyJobs(): Promise<ApifyJobResult[]> {
  if (!APIFY_API_KEY) { console.warn('  Apify: APIFY_API_KEY not set — skipping Ashby'); return []; }
  try {
    const items = await runActor('bytepulselabs/ashby-job-scraper', {
      companyIdentifiers: ASHBY_AU_SLUGS,
    });
    const jobs = items.flatMap(raw => {
      const company = (raw.company ?? raw.organization ?? '').trim();
      const result  = normalizeJob(raw, 'ashby', company);
      return result ? [result] : [];
    });
    console.log(`  Apify Ashby: ${items.length} raw → ${jobs.length} AU IT jobs`);
    return jobs;
  } catch (e) {
    console.warn('  Apify Ashby error:', (e as Error).message);
    return [];
  }
}

// Standalone run
if (process.argv[1]?.endsWith('apify-jobs.ts')) {
  (async () => {
    const [workday, ashby] = await Promise.all([
      fetchApifyWorkdayJobs(),
      fetchApifyAshbyJobs(),
    ]);
    console.log(`\nTotal: ${workday.length + ashby.length} Apify jobs`);
  })().catch(err => { console.error('Fatal:', err); process.exit(1); });
}
