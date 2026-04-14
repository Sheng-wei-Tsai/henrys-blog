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
  source: 'adzuna' | 'jsearch' | 'jora' | 'indeed' | 'acs';
  publisher?: string;   // e.g. "LinkedIn", "Glassdoor" — from JSearch
  salary_min?: number;
  salary_max?: number;
}

// ─── JSearch (Google for Jobs via RapidAPI) ───────────────────────────────────

async function fetchJSearch(keywords: string, location: string): Promise<AdzunaJob[]> {
  if (!RAPIDAPI_KEY) return [];
  try {
    const query = `${keywords} in ${location}, Australia`;
    const params = new URLSearchParams({
      query,
      page:        '1',
      num_pages:   '1',
      date_posted: '3days',
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
    if (!res.ok) return [];

    const json = await res.json();
    const results: any[] = json.data ?? [];

    return results.map(r => {
      const city     = r.job_city ?? '';
      const state    = r.job_state ?? '';
      const loc      = [city, state].filter(Boolean).join(', ') || location;
      const created  = r.job_posted_at_datetime_utc ?? new Date().toISOString();

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
  } catch {
    return [];
  }
}

// ─── Scraped Jobs (Seek / Indeed / ACS cached in Supabase) ────────────────────

async function fetchScrapedJobs(keywords: string, location: string): Promise<AdzunaJob[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return [];

  try {
    const sb = createClient(supabaseUrl, anonKey);
    const kw = keywords.slice(0, 60);
    const loc = location.slice(0, 40);

    const { data, error } = await sb
      .from('scraped_jobs')
      .select('id, source, title, company, location, description, salary, salary_min, salary_max, url, category, contract_type, created')
      .or(`title.ilike.%${kw}%,description.ilike.%${kw}%`)
      .ilike('location', `%${loc}%`)
      .gt('expires_at', new Date().toISOString())
      .order('created', { ascending: false })
      .limit(50);

    if (error || !data) return [];

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
  } catch {
    return [];
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupKey(title: string, company: string): string {
  return `${title}|${company}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!APP_ID || !APP_KEY) {
    return NextResponse.json({ error: 'Job search not configured' }, { status: 503 });
  }

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

  const adzunaParams = new URLSearchParams({
    app_id:           APP_ID,
    app_key:          APP_KEY,
    results_per_page: '20',
    what:             keywords,
    where:            location,
    sort_by:          sortBy,
  });

  if (fullTime === '1') adzunaParams.set('full_time', '1');
  if (salaryMin)        adzunaParams.set('salary_min', salaryMin);
  if (salaryMax)        adzunaParams.set('salary_max', salaryMax);

  const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/au/search/${page}?${adzunaParams}`;

  try {
    const [adzunaRes, jsearchJobs, scrapedJobs] = await Promise.all([
      fetch(adzunaUrl, { next: { revalidate: 300 } }),
      fetchJSearch(keywords, location),
      fetchScrapedJobs(keywords, location),
    ]);

    if (!adzunaRes.ok) {
      const err = await adzunaRes.text();
      return NextResponse.json({ error: err }, { status: adzunaRes.status });
    }

    const data = await adzunaRes.json();

    const adzunaJobs: AdzunaJob[] = (data.results ?? []).map((r: any) => ({
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

    // Priority: JSearch (freshest, includes LinkedIn) → scraped (Seek/Indeed/ACS) → Adzuna
    const seen = new Set(jsearchJobs.map(j => dedupKey(j.title, j.company)));

    const uniqueScraped = scrapedJobs.filter(j => {
      const key = dedupKey(j.title, j.company);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const merged = [
      ...jsearchJobs,
      ...uniqueScraped,
      ...adzunaJobs.filter(j => !seen.has(dedupKey(j.title, j.company))),
    ];

    return NextResponse.json({ jobs: merged, total: data.count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
