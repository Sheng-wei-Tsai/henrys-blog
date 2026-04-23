import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const APP_ID       = process.env.ADZUNA_APP_ID;
const APP_KEY      = process.env.ADZUNA_APP_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const ALLOWED_SORT = new Set(['date', 'salary']);

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
  source: 'adzuna' | 'jsearch' | 'jora' | 'indeed' | 'acs' | 'seek';
  publisher?: string;   // e.g. "LinkedIn", "Glassdoor" — from JSearch
  salary_min?: number;
  salary_max?: number;
}

// ─── JSearch (Google for Jobs via RapidAPI) ───────────────────────────────────

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
      date_posted: 'week',   // was '3days' — too restrictive for AU niche roles
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
      };
    });
  } catch (e) {
    console.warn('[jobs] JSearch exception:', e);
    return [];
  }
}

// ─── Scraped Jobs (Jora / ACS / Indeed cached in Supabase) ───────────────────

async function fetchScrapedJobs(keywords: string, location: string): Promise<AdzunaJob[]> {
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

    const { data, error } = await sb
      .from('scraped_jobs')
      .select('id, source, title, company, location, description, salary, salary_min, salary_max, url, category, contract_type, created')
      .or(`title.ilike.%${kw}%,description.ilike.%${kw}%`)
      .or(`location.ilike.%${loc}%,location.ilike.%remote%,location.ilike.%australia%`)
      .gt('expires_at', new Date().toISOString())
      .order('created', { ascending: false })
      .limit(50);

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
      source:        r.source as AdzunaJob['source'],
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
    const jobs = (data.results ?? []).map((r: any) => ({
      id:            r.id,
      title:         r.title,
      company:       r.company?.display_name ?? 'Unknown',
      location:      r.location?.display_name ?? location,
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
    }));
    return { jobs, total: data.count ?? jobs.length };
  } catch (e) {
    console.warn('[jobs] Adzuna exception:', e);
    return { jobs: [], total: 0 };
  }
}

// Note: Remotive (US-only results) and CareerJet (403) removed — tested and confirmed non-functional for AU IT jobs.

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

  // Fetch all sources concurrently.
  // Adzuna: fetch 2 pages per user-page (pages 2n-1 and 2n) → 100 jobs per page.
  const adzunaPage1 = 2 * page - 1;
  const adzunaPage2 = 2 * page;

  const [jsearchResult, scrapedResult, adzuna1Result, adzuna2Result] =
    await Promise.allSettled([
      fetchJSearch(keywords, location),
      fetchScrapedJobs(keywords, location),
      fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, adzunaPage1),
      fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, adzunaPage2),
    ]);

  const jsearchJobs: AdzunaJob[] = jsearchResult.status === 'fulfilled' ? jsearchResult.value : [];
  const scrapedJobs: AdzunaJob[] = scrapedResult.status === 'fulfilled' ? scrapedResult.value : [];
  const adzuna1 = adzuna1Result.status === 'fulfilled' ? adzuna1Result.value : { jobs: [] as AdzunaJob[], total: 0 };
  const adzuna2 = adzuna2Result.status === 'fulfilled' ? adzuna2Result.value : { jobs: [] as AdzunaJob[], total: 0 };

  const adzunaJobs  = [...adzuna1.jobs, ...adzuna2.jobs];
  const adzunaTotal = adzuna1.total; // total from page 1 of the pair (most accurate)

  if (jsearchResult.status  === 'rejected') console.warn('[jobs] JSearch rejected:',  jsearchResult.reason);
  if (scrapedResult.status  === 'rejected') console.warn('[jobs] Scraped rejected:',  scrapedResult.reason);
  if (adzuna1Result.status  === 'rejected') console.warn('[jobs] Adzuna p1 rejected:', adzuna1Result.reason);
  if (adzuna2Result.status  === 'rejected') console.warn('[jobs] Adzuna p2 rejected:', adzuna2Result.reason);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[jobs] sources: jsearch=${jsearchJobs.length} scraped=${scrapedJobs.length} adzuna=${adzunaJobs.length} (pages ${adzunaPage1}+${adzunaPage2})`);
  }

  // Merge priority: scraped Seek/Jora (most AU-specific) → JSearch → Adzuna
  const seen = new Set<string>();

  function addUnique(list: AdzunaJob[]): AdzunaJob[] {
    return list.filter(j => {
      const key = dedupKey(j.title, j.company);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const merged = [
    ...addUnique(scrapedJobs),
    ...addUnique(jsearchJobs),
    ...addUnique(adzunaJobs),
  ];

  // total = Adzuna's API count (drives pagination; Adzuna has the most pages)
  // count = actual merged jobs on this page
  return NextResponse.json({
    jobs:  merged,
    total: adzunaTotal || merged.length,
    count: merged.length,
    sources: {
      jsearch: jsearchJobs.length,
      scraped: scrapedJobs.length,
      adzuna:  adzunaJobs.length,
    },
  });
}
