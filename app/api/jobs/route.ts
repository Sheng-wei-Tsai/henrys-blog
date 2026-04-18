import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const APP_ID       = process.env.ADZUNA_APP_ID;
const APP_KEY      = process.env.ADZUNA_APP_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const ALLOWED_SORT     = new Set(['date', 'salary']);
const ALLOWED_JOB_TYPE = new Set(['all', 'onsite', 'remote', 'freelance']);
const REMOTE_PATTERN   = /\bremote\b/i;
const FREELANCE_PATTERN = /\bfreelanc/i;
const CONTRACT_PATTERN  = /\bcontract/i;
const INDEED_JK_RE      = /jk=([a-f0-9]+)/i;

export type JobSource = 'adzuna' | 'jsearch' | 'jora' | 'indeed' | 'acs' | 'seek' | 'arbeitnow' | 'freelancer';
export type JobType   = 'onsite' | 'remote' | 'freelance';

export interface AdzunaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  created: string;
  category: string;
  contract_type: string | null;
  source: JobSource;
  publisher?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: JobType;
}

// ─── JSearch (Google for Jobs / LinkedIn / Glassdoor via RapidAPI) ─────────────
// JSearch pulls from Google for Jobs index which includes LinkedIn, Glassdoor,
// Workday, and direct company career pages. This is our primary LinkedIn source.

async function fetchJSearch(keywords: string, location: string): Promise<AdzunaJob[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[jobs] JSearch: RAPIDAPI_KEY not configured — skipping source');
    return [];
  }
  try {
    const query = `${keywords} in ${location}, Australia`;
    const params = new URLSearchParams({
      query,
      page:        '1',
      num_pages:   '1',
      date_posted: 'week',
      country:     'au',
    });
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      console.warn('[jobs] JSearch HTTP error:', res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    const results: any[] = json.data ?? [];

    return results.map(r => {
      const city    = r.job_city ?? '';
      const state   = r.job_state ?? '';
      const loc     = [city, state].filter(Boolean).join(', ') || location;
      const created = r.job_posted_at_datetime_utc ?? new Date().toISOString();

      let salary: string | null = null;
      if (r.job_min_salary && r.job_max_salary) {
        salary = `$${Math.round(r.job_min_salary / 1000)}k – $${Math.round(r.job_max_salary / 1000)}k`;
      } else if (r.job_min_salary) {
        salary = `From $${Math.round(r.job_min_salary / 1000)}k`;
      }

      const isRemote = r.job_is_remote === true
        || REMOTE_PATTERN.test(r.job_title ?? '')
        || REMOTE_PATTERN.test(loc);

      return {
        id:            `jsearch-${r.job_id}`,
        title:         r.job_title ?? '',
        company:       r.employer_name ?? 'Unknown',
        location:      loc,
        description:   r.job_description ?? '',
        salary,
        salary_min:    r.job_min_salary ?? undefined,
        salary_max:    r.job_max_salary ?? undefined,
        url:           r.job_apply_link ?? r.job_google_link ?? '',
        created,
        category:      r.job_employment_type ?? '',
        contract_type: r.job_employment_type ?? null,
        source:        'jsearch' as const,
        publisher:     r.job_publisher ?? undefined,
        job_type:      isRemote ? 'remote' as const : 'onsite' as const,
      };
    });
  } catch (e) {
    console.warn('[jobs] JSearch exception:', e);
    return [];
  }
}

// ─── Scraped Jobs (Jora / ACS / Indeed / Seek cached in Supabase) ─────────────

async function fetchScrapedJobs(keywords: string, location: string, jobType?: string): Promise<AdzunaJob[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.warn('[jobs] Scraped: Supabase env vars not set — skipping source');
    return [];
  }

  try {
    const sb  = createClient(supabaseUrl, anonKey);
    const kw  = keywords.slice(0, 60);
    const loc = location.slice(0, 40);

    let query = sb
      .from('scraped_jobs')
      .select('id, source, title, company, location, description, salary, salary_min, salary_max, url, category, contract_type, created, job_type')
      .or(`title.ilike.%${kw}%,description.ilike.%${kw}%`)
      .or(`location.ilike.%${loc}%,location.ilike.%remote%,location.ilike.%australia%`)
      .gt('expires_at', new Date().toISOString())
      .order('created', { ascending: false })
      .limit(50);

    if (jobType && jobType !== 'all') {
      query = query.eq('job_type', jobType);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn('[jobs] Scraped query error:', error?.message ?? 'no data returned');
      return [];
    }

    return data.map(r => ({
      id:            r.id,
      title:         r.title,
      company:       r.company,
      location:      r.location,
      description:   r.description ?? '',
      salary:        r.salary ?? null,
      salary_min:    r.salary_min ?? undefined,
      salary_max:    r.salary_max ?? undefined,
      url:           r.url,
      created:       r.created,
      category:      r.category ?? '',
      contract_type: r.contract_type ?? null,
      source:        r.source as JobSource,
      job_type:      (r.job_type as JobType) ?? 'onsite',
    }));
  } catch (e) {
    console.warn('[jobs] Scraped exception:', e);
    return [];
  }
}

// ─── Adzuna ───────────────────────────────────────────────────────────────────

async function fetchAdzuna(
  keywords: string,
  location: string,
  sortBy: string,
  fullTime: string | null,
  salaryMin: string | null,
  salaryMax: string | null,
  page: number,
): Promise<{ jobs: AdzunaJob[]; total: number }> {
  if (!APP_ID || !APP_KEY) {
    console.warn('[jobs] Adzuna: ADZUNA_APP_ID/ADZUNA_APP_KEY not configured — skipping source');
    return { jobs: [], total: 0 };
  }

  try {
    const params = new URLSearchParams({
      app_id:           APP_ID,
      app_key:          APP_KEY,
      results_per_page: '50',
      what:             keywords,
      where:            location,
      sort_by:          sortBy,
    });
    if (fullTime === '1') params.set('full_time', '1');
    if (salaryMin)        params.set('salary_min', salaryMin);
    if (salaryMax)        params.set('salary_max', salaryMax);

    const url = `https://api.adzuna.com/v1/api/jobs/au/search/${page}?${params}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.warn('[jobs] Adzuna HTTP error:', res.status, res.statusText);
      return { jobs: [], total: 0 };
    }

    const data = await res.json();
    const jobs = (data.results ?? []).map((r: any) => {
      const loc = r.location?.display_name ?? location;
      const isRemote = REMOTE_PATTERN.test(r.title ?? '') || REMOTE_PATTERN.test(loc);
      return {
        id:            r.id,
        title:         r.title,
        company:       r.company?.display_name ?? 'Unknown',
        location:      loc,
        description:   r.description,
        salary:        r.salary_min
          ? `$${Math.round(r.salary_min / 1000)}k – $${Math.round(r.salary_max / 1000)}k`
          : null,
        salary_min:    r.salary_min ?? undefined,
        salary_max:    r.salary_max ?? undefined,
        url:           r.redirect_url,
        created:       r.created,
        category:      r.category?.label ?? '',
        contract_type: r.contract_type ?? null,
        source:        'adzuna' as const,
        job_type:      isRemote ? 'remote' as const : 'onsite' as const,
      };
    });
    return { jobs, total: data.count ?? jobs.length };
  } catch (e) {
    console.warn('[jobs] Adzuna exception:', e);
    return { jobs: [], total: 0 };
  }
}

// ─── Indeed (via RapidAPI — reliable alternative to direct scraping) ───────────
// Uses the "Indeed12" API on RapidAPI which scrapes Indeed server-side.
// Shares the same RAPIDAPI_KEY as JSearch. Falls back gracefully if unavailable.

async function fetchIndeedAPI(keywords: string, location: string): Promise<AdzunaJob[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[jobs] Indeed API: RAPIDAPI_KEY not configured — skipping');
    return [];
  }
  try {
    const params = new URLSearchParams({
      query:    `${keywords} in ${location}`,
      location: `${location}, Australia`,
      page_id:  '1',
      country:  'au',
      locality: 'au',
    });
    const res = await fetch(
      `https://indeed12.p.rapidapi.com/jobs/search?${params}`,
      {
        headers: {
          'X-RapidAPI-Key':  RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'indeed12.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      console.warn('[jobs] Indeed API HTTP error:', res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    const hits: any[] = json.hits ?? json.results ?? json.data ?? [];

    return hits.slice(0, 30).map(r => {
      const title   = r.title ?? r.job_title ?? '';
      const company = r.company_name ?? r.company ?? 'Unknown';
      const loc     = r.location ?? `${location}, Australia`;
      const isRemote = REMOTE_PATTERN.test(title) || REMOTE_PATTERN.test(loc);

      let salary: string | null = null;
      if (r.salary_min && r.salary_max) {
        salary = `$${Math.round(r.salary_min / 1000)}k – $${Math.round(r.salary_max / 1000)}k`;
      } else if (r.formatted_salary || r.salary) {
        salary = r.formatted_salary ?? r.salary;
      }

      return {
        id:            `indeed-${r.id ?? r.job_id ?? r.indeed_final_url?.match(INDEED_JK_RE)?.[1] ?? Math.random().toString(36).slice(2, 10)}`,
        title,
        company,
        location:      loc,
        description:   (r.snippet ?? r.description ?? '').slice(0, 500),
        salary,
        salary_min:    r.salary_min ?? undefined,
        salary_max:    r.salary_max ?? undefined,
        url:           r.indeed_final_url ?? r.link ?? r.url ?? `https://au.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`,
        created:       r.pub_date_ts_milli ? new Date(r.pub_date_ts_milli).toISOString() : (r.date ?? new Date().toISOString()),
        category:      r.job_type ?? '',
        contract_type: r.job_type ?? null,
        source:        'indeed' as const,
        job_type:      isRemote ? 'remote' as const : 'onsite' as const,
      };
    });
  } catch (e) {
    console.warn('[jobs] Indeed API exception:', e);
    return [];
  }
}

// ─── Arbeitnow (Remote AU IT Jobs — free public API) ──────────────────────────
// arbeitnow.com/api/job-board-api — free, no auth required, supports location filter.
// Excellent source for remote positions that specify Australian companies.

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

async function fetchArbeitnowRemote(keywords: string): Promise<AdzunaJob[]> {
  try {
    const params = new URLSearchParams({
      search:   keywords.slice(0, 60),
      location: 'australia',
      remote:   'true',
      page:     '1',
    });
    const res = await fetch(
      `https://arbeitnow.com/api/job-board-api?${params}`,
      {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      console.warn('[jobs] Arbeitnow HTTP error:', res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    const items: any[] = json.data ?? [];

    return items.slice(0, 25).map(r => ({
      id:            `arbeitnow-${r.slug ?? Math.random().toString(36).slice(2, 10)}`,
      title:         r.title ?? '',
      company:       r.company_name ?? 'Unknown',
      location:      r.location ?? 'Remote (Australia)',
      description:   stripHtmlTags(r.description ?? '').slice(0, 500),
      salary:        null,
      salary_min:    undefined,
      salary_max:    undefined,
      url:           r.url ?? `https://arbeitnow.com/view/${r.slug ?? ''}`,
      created:       r.created_at ? new Date(r.created_at * 1000).toISOString() : new Date().toISOString(),
      category:      r.tags?.join(', ') ?? '',
      contract_type: r.remote ? 'Remote' : null,
      source:        'arbeitnow' as const,
      job_type:      'remote' as const,
    }));
  } catch (e) {
    console.warn('[jobs] Arbeitnow exception:', e);
    return [];
  }
}

// ─── Freelancer.com (AU Freelance IT Projects — public API) ───────────────────
// Freelancer.com is headquartered in Sydney, AU. Their public API returns
// projects filtered by location. No auth required for searching.
// Docs: https://developers.freelancer.com/docs/projects

async function fetchFreelancerAU(keywords: string): Promise<AdzunaJob[]> {
  try {
    const params = new URLSearchParams({
      query:               keywords.slice(0, 60),
      // Job IDs for IT/Software categories on Freelancer
      'jobs[]':            '3',    // PHP (generic IT — Freelancer requires at least one)
      'countries[]':       'Australia',
      compact:             'true',
      limit:               '25',
      sort_field:          'time_submitted',
      project_types:       'fixed,hourly',
    });
    const res = await fetch(
      `https://www.freelancer.com/api/projects/0.1/projects/active/?${params}`,
      {
        headers: {
          'User-Agent': 'TechPathAU/1.0',
        },
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      console.warn('[jobs] Freelancer HTTP error:', res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    const projects: any[] = json.result?.projects ?? [];

    return projects.slice(0, 25).map(p => {
      const budget = p.budget;
      let salary: string | null = null;
      if (budget?.minimum && budget?.maximum) {
        const cur = budget.currency?.code ?? 'AUD';
        salary = `${cur} $${budget.minimum} – $${budget.maximum}`;
      }

      return {
        id:            `freelancer-${p.id ?? Math.random().toString(36).slice(2, 10)}`,
        title:         (p.title ?? '').slice(0, 200),
        company:       p.owner?.display_name ?? p.owner?.username ?? 'Freelancer Client',
        location:      p.location?.country?.name ?? 'Australia',
        description:   (p.preview_description ?? p.description ?? '').slice(0, 500),
        salary,
        salary_min:    budget?.minimum ?? undefined,
        salary_max:    budget?.maximum ?? undefined,
        url:           `https://www.freelancer.com/projects/${p.seo_url ?? p.id}`,
        created:       p.time_submitted ? new Date(p.time_submitted * 1000).toISOString() : new Date().toISOString(),
        category:      p.type ?? 'Freelance',
        contract_type: p.type === 'hourly' ? 'Hourly' : 'Fixed Price',
        source:        'freelancer' as const,
        job_type:      'freelance' as const,
      };
    });
  } catch (e) {
    console.warn('[jobs] Freelancer exception:', e);
    return [];
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupKey(title: string, company: string): string {
  return `${title}|${company}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keywords  = searchParams.get('keywords') || 'software developer';
  const location  = searchParams.get('location') || 'Brisbane';
  const fullTime  = searchParams.get('full_time');
  const salaryMin = searchParams.get('salary_min');
  const salaryMax = searchParams.get('salary_max');

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page    = Number.isFinite(rawPage) ? Math.max(1, Math.min(rawPage, 10)) : 1;

  const rawSort = searchParams.get('sort_by') ?? 'date';
  const sortBy  = ALLOWED_SORT.has(rawSort) ? rawSort : 'date';

  const rawJobType = searchParams.get('job_type') ?? 'all';
  const jobType    = ALLOWED_JOB_TYPE.has(rawJobType) ? rawJobType : 'all';

  // Adzuna: fetch 2 pages per user-page (pages 2n-1 and 2n) → 100 jobs per page.
  const adzunaPage1 = 2 * page - 1;
  const adzunaPage2 = 2 * page;

  // Build the concurrent fetch list based on job_type filter.
  // For 'remote' and 'freelance' tabs we add specialised sources; for 'all' we fetch everything.
  const fetches: Promise<any>[] = [
    fetchJSearch(keywords, location),
    fetchScrapedJobs(keywords, location, jobType),
  ];

  // Adzuna and Indeed — skip for freelance-only tab (not relevant)
  if (jobType !== 'freelance') {
    fetches.push(
      fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, adzunaPage1),
      fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, adzunaPage2),
      fetchIndeedAPI(keywords, location),
    );
  } else {
    fetches.push(
      Promise.resolve({ jobs: [], total: 0 }),
      Promise.resolve({ jobs: [], total: 0 }),
      Promise.resolve([]),
    );
  }

  // Remote source — fetch for 'all' and 'remote' tabs
  if (jobType === 'all' || jobType === 'remote') {
    fetches.push(fetchArbeitnowRemote(keywords));
  } else {
    fetches.push(Promise.resolve([]));
  }

  // Freelance source — fetch for 'all' and 'freelance' tabs
  if (jobType === 'all' || jobType === 'freelance') {
    fetches.push(fetchFreelancerAU(keywords));
  } else {
    fetches.push(Promise.resolve([]));
  }

  const [
    jsearchResult, scrapedResult, adzuna1Result, adzuna2Result,
    indeedResult, arbeitnowResult, freelancerResult,
  ] = await Promise.allSettled(fetches);

  const jsearchJobs: AdzunaJob[]    = jsearchResult.status === 'fulfilled' ? jsearchResult.value : [];
  const scrapedJobs: AdzunaJob[]    = scrapedResult.status === 'fulfilled' ? scrapedResult.value : [];
  const adzuna1                     = adzuna1Result.status === 'fulfilled' ? adzuna1Result.value : { jobs: [] as AdzunaJob[], total: 0 };
  const adzuna2                     = adzuna2Result.status === 'fulfilled' ? adzuna2Result.value : { jobs: [] as AdzunaJob[], total: 0 };
  const indeedJobs: AdzunaJob[]     = indeedResult.status === 'fulfilled' ? indeedResult.value : [];
  const arbeitnowJobs: AdzunaJob[]  = arbeitnowResult.status === 'fulfilled' ? arbeitnowResult.value : [];
  const freelancerJobs: AdzunaJob[] = freelancerResult.status === 'fulfilled' ? freelancerResult.value : [];

  const adzunaJobs  = [...adzuna1.jobs, ...adzuna2.jobs];
  const adzunaTotal = adzuna1.total;

  if (jsearchResult.status    === 'rejected') console.warn('[jobs] JSearch rejected:',     jsearchResult.reason);
  if (scrapedResult.status    === 'rejected') console.warn('[jobs] Scraped rejected:',     scrapedResult.reason);
  if (adzuna1Result.status    === 'rejected') console.warn('[jobs] Adzuna p1 rejected:',   adzuna1Result.reason);
  if (adzuna2Result.status    === 'rejected') console.warn('[jobs] Adzuna p2 rejected:',   adzuna2Result.reason);
  if (indeedResult.status     === 'rejected') console.warn('[jobs] Indeed rejected:',      indeedResult.reason);
  if (arbeitnowResult.status  === 'rejected') console.warn('[jobs] Arbeitnow rejected:',   arbeitnowResult.reason);
  if (freelancerResult.status === 'rejected') console.warn('[jobs] Freelancer rejected:',  freelancerResult.reason);

  console.log(`[jobs] sources: jsearch=${jsearchJobs.length} scraped=${scrapedJobs.length} adzuna=${adzunaJobs.length} indeed=${indeedJobs.length} arbeitnow=${arbeitnowJobs.length} freelancer=${freelancerJobs.length} (type=${jobType})`);

  // Merge priority: scraped Seek/Jora (most AU-specific) → Indeed → JSearch → Adzuna → Remote → Freelance
  const seen = new Set<string>();

  function addUnique(list: AdzunaJob[]): AdzunaJob[] {
    return list.filter(j => {
      const key = dedupKey(j.title, j.company);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  let merged = [
    ...addUnique(scrapedJobs),
    ...addUnique(indeedJobs),
    ...addUnique(jsearchJobs),
    ...addUnique(adzunaJobs),
    ...addUnique(arbeitnowJobs),
    ...addUnique(freelancerJobs),
  ];

  // Apply job_type filter to non-Supabase results (scraped already filtered server-side)
  if (jobType === 'remote') {
    merged = merged.filter(j =>
      j.job_type === 'remote'
      || REMOTE_PATTERN.test(j.title)
      || REMOTE_PATTERN.test(j.location)
    );
  } else if (jobType === 'freelance') {
    merged = merged.filter(j =>
      j.job_type === 'freelance'
      || FREELANCE_PATTERN.test(j.title)
      || CONTRACT_PATTERN.test(j.contract_type ?? '')
    );
  }

  return NextResponse.json({
    jobs:     merged,
    total:    jobType === 'all' ? (adzunaTotal || merged.length) : merged.length,
    count:    merged.length,
    job_type: jobType,
    sources: {
      jsearch:    jsearchJobs.length,
      scraped:    scrapedJobs.length,
      adzuna:     adzunaJobs.length,
      indeed:     indeedJobs.length,
      arbeitnow:  arbeitnowJobs.length,
      freelancer: freelancerJobs.length,
    },
  });
}
