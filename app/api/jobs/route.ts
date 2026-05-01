import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const APP_ID          = process.env.ADZUNA_APP_ID;
const APP_KEY         = process.env.ADZUNA_APP_KEY;
const RAPIDAPI_KEY    = process.env.RAPIDAPI_KEY;
const SCRAPERAPI_KEY  = process.env.SCRAPERAPI_KEY;

const ALLOWED_SORT = new Set(['date', 'salary']);
const ALLOWED_TABS = new Set(['au', 'remote', 'freelance']);

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
  source: 'adzuna' | 'jsearch' | 'jora' | 'indeed' | 'acs' | 'seek' | 'linkedin' | 'remotive' | 'google_jobs' | 'jobicy';
  publisher?: string;
  salary_min?: number;
  salary_max?: number;
}

interface JSearchHit {
  job_id: string;
  job_city?: string;
  job_state?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_title?: string;
  employer_name?: string;
  job_description?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_publisher?: string;
}

interface AdzunaHit {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
  category?: { label?: string };
  contract_type?: string;
}

interface GoogleJobsHit {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  detected_extensions?: {
    salary?: string;
    posted_at?: string;
    schedule_type?: string;
  };
  apply_options?: Array<{ link: string }>;
  related_links?: Array<{ link: string }>;
  via?: string;
}

interface JobicyHit {
  id: string;
  jobTitle?: string;
  companyName?: string;
  jobGeo?: string;
  jobExcerpt?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  url?: string;
  pubDate?: string;
  jobIndustry?: string | string[];
  jobType?: string | string[];
}

interface RemotiveHit {
  id: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  description?: string;
  salary?: string;
  url?: string;
  publication_date?: string;
  category?: string;
  job_type?: string;
}

// ─── IT title filter ──────────────────────────────────────────────────────────
// Title-only check. "analyst" and "engineer" are intentionally NOT included as
// bare words — they match too many non-IT roles (Finance Analyst, Mechanical
// Engineer). Instead, compound patterns require an IT qualifier.

const IT_TITLE_RE = new RegExp(
  '\\b(' + [
    // Core IT roles — specific enough to stand alone
    'developer', 'devops', 'devsecops', 'sre', 'architect',
    'programmer', 'coder',
    // "engineer" requires an IT qualifier to avoid Mechanical/Civil/Civil matches
    '(?:software|cloud|data|platform|infrastructure|network|systems?|security|' +
      'reliability|machine.?learning|ml|ai|full.?stack|frontend|backend|mobile|' +
      'devops|automation|qa|test|embedded|firmware|solutions?|technical)\\s+engineer',
    'engineer(?=\\s+(?:frontend|backend|fullstack|full.?stack|cloud|devops|data|ml|ai|platform|infrastructure|security|qa|test|sre))',
    // "analyst" requires IT qualifier to avoid Finance/Investment Analyst matches
    '(?:data|systems?|business|technical|it|software|security|network|bi|etl|crm|' +
      'intelligence|application|functional)\\s+analyst',
    'analyst\\s+(?:developer|programmer)',
    // Data & AI
    'data\\s+(?:scientist|engineer|architect|modeller?)',
    'machine\\s+learning', 'ml\\s+engineer', 'ai\\s+engineer',
    // Specific tech stacks — safe to match standalone
    'python', 'java(?:script)?', 'typescript', 'react', 'angular', 'vue',
    'node(?:\\.js)?', 'php', 'ruby', 'golang', 'kotlin', 'swift',
    'android', 'ios', 'mobile',
    // Database
    'dba', 'database\\s+administrator',
    // QA / Test
    '\\bqa\\b', 'tester', 'test\\s+(?:engineer|lead|automation)',
    // Security
    'cyber(?:\\s+security)?', 'infosec', 'penetration\\s+tester', 'pentester', '\\bsoc\\b',
    // IT ops
    'it\\s+(?:support|manager|director|consultant|specialist|administrator)',
    'helpdesk', 'service\\s+desk',
    // Cloud
    'cloud\\s+(?:engineer|architect|consultant|specialist)',
    '\\baws\\b', '\\bazure\\b', '\\bgcp\\b',
    // UI/UX
    'ui.?ux', 'ux\\s+(?:designer|researcher|engineer)',
    // Leadership
    'tech(?:nical)?\\s+lead', 'engineering\\s+manager', 'cto', 'vp\\s+engineering',
    'solutions?\\s+architect',
    // Generic but safe in context
    'software', 'fullstack', 'full.?stack', 'frontend', 'back.?end',
    'platform\\s+engineer', 'infrastructure\\s+engineer',
  ].join('|') + ')\\b',
  'i',
);

// Titles that look like IT (contain "analyst", "engineer" etc.) but are
// definitively NOT software/IT roles — reject even if IT_TITLE_RE matched.
const NON_IT_RE = /\b(finance|financial|investment|accounting|accountant|mortgage|insurance|trading|risk\s+analyst|equity|banking|treasury|actuar|chef|cook|nurse|driver|warehouse|forklift|electrician|plumber|carpenter|mechanic|retail|civil\s+engineer|structural\s+engineer|mechanical\s+engineer|chemical\s+engineer|electrical\s+engineer|mining\s+engineer|environmental\s+engineer|geotechnical)\b/i;

function filterIT(jobs: AdzunaJob[]): AdzunaJob[] {
  return jobs.filter(j => IT_TITLE_RE.test(j.title) && !NON_IT_RE.test(j.title));
}

// ─── JSearch (used only for Remote + Freelance tabs) ─────────────────────────
// JSearch aggregates from LinkedIn/Glassdoor/Indeed — too broad/noisy for AU.
// Kept for Remote/Freelance where broad aggregation is a feature, not a bug.

async function fetchJSearch(keywords: string, location: string): Promise<AdzunaJob[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[jobs] JSearch: RAPIDAPI_KEY not configured — skipping');
    return [];
  }
  try {
    const params = new URLSearchParams({
      query:       `${keywords} in ${location}, Australia`,
      page:        '1',
      num_pages:   '1',
      date_posted: 'week',
      country:     'au',
    });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'X-RapidAPI-Key':  RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn('[jobs] JSearch HTTP error:', res.status, res.statusText);
      return [];
    }
    const json = await res.json();
    return (json.data ?? []).map((r: JSearchHit) => {
      const loc = [r.job_city, r.job_state].filter(Boolean).join(', ') || location;
      let salary: string | null = null;
      if (r.job_min_salary && r.job_max_salary)
        salary = `$${Math.round(r.job_min_salary / 1000)}k – $${Math.round(r.job_max_salary / 1000)}k`;
      else if (r.job_min_salary)
        salary = `From $${Math.round(r.job_min_salary / 1000)}k`;
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
        created:       r.job_posted_at_datetime_utc ?? new Date().toISOString(),
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

// ─── Google Jobs via ScraperAPI ───────────────────────────────────────────────
// Aggregates Seek, LinkedIn, Indeed, Glassdoor via Google's job index.
// Legal: no direct ToS violation — Google exposes this via public search.
// Cost: 25 credits/request on ScraperAPI Hobby ($49/mo = 100K credits ≈ 4K searches).

function googleDateToISO(posted: string | undefined): string {
  if (!posted) return new Date().toISOString();
  const m = posted.match(/(\d+)\s+(hour|day|week|month)/i);
  if (!m) return new Date().toISOString();
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = unit === 'hour'  ? n * 3_600_000
           : unit === 'day'   ? n * 86_400_000
           : unit === 'week'  ? n * 7 * 86_400_000
           : n * 30 * 86_400_000;
  return new Date(Date.now() - ms).toISOString();
}

function gjobsId(title: string, company: string, index: number): string {
  const raw = `${title}|${company}|${index}`.toLowerCase();
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0; }
  return `gjobs-${(h >>> 0).toString(16)}`;
}

async function fetchGoogleJobs(
  keywords: string,
  location: string,
  page: number,
): Promise<AdzunaJob[]> {
  if (!SCRAPERAPI_KEY) {
    console.warn('[jobs] GoogleJobs: SCRAPERAPI_KEY not configured — skipping');
    return [];
  }
  try {
    const start = (page - 1) * 10;
    const params = new URLSearchParams({
      api_key:       SCRAPERAPI_KEY,
      query:         `${keywords} ${location}`,
      country_code:  'au',
      tld:           'com.au',
      output_format: 'json',
    });
    if (start > 0) params.set('start', String(start));

    const res = await fetch(
      `https://api.scraperapi.com/structured/google/jobs?${params}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      console.warn('[jobs] GoogleJobs HTTP error:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const jobs: GoogleJobsHit[] = Array.isArray(data) ? data : (data.jobs ?? data.job_results ?? []);

    return jobs.map((r: GoogleJobsHit, i: number) => ({
      id:            gjobsId(r.title ?? '', r.company_name ?? '', start + i),
      title:         r.title ?? '',
      company:       r.company_name ?? 'Unknown',
      location:      r.location ?? location,
      description:   r.description ?? '',
      salary:        r.detected_extensions?.salary ?? null,
      salary_min:    undefined,
      salary_max:    undefined,
      url:           r.apply_options?.[0]?.link ?? r.related_links?.[0]?.link ?? '',
      created:       googleDateToISO(r.detected_extensions?.posted_at),
      category:      'IT Jobs',
      contract_type: r.detected_extensions?.schedule_type ?? null,
      source:        'google_jobs' as const,
      publisher:     r.via ?? undefined,
    }));
  } catch (e) {
    console.warn('[jobs] GoogleJobs exception:', e);
    return [];
  }
}

// ─── Jobicy (free remote jobs API) ────────────────────────────────────────────
// No auth required. Used in Remote tab to supplement Remotive.

async function fetchJobicy(keywords: string): Promise<AdzunaJob[]> {
  try {
    const tag = encodeURIComponent(keywords.replace(/\bremote\b/gi, '').trim() || 'developer');
    const res = await fetch(
      `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) { console.warn('[jobs] Jobicy HTTP error:', res.status); return []; }
    const json = await res.json();
    return (json.jobs ?? []).map((r: JobicyHit) => ({
      id:            `jobicy-${r.id}`,
      title:         r.jobTitle ?? '',
      company:       r.companyName ?? 'Unknown',
      location:      r.jobGeo || 'Remote',
      description:   r.jobExcerpt ?? '',
      salary:        r.annualSalaryMin && r.annualSalaryMax
        ? `$${Math.round(r.annualSalaryMin / 1000)}k – $${Math.round(r.annualSalaryMax / 1000)}k`
        : null,
      salary_min:    r.annualSalaryMin ?? undefined,
      salary_max:    r.annualSalaryMax ?? undefined,
      url:           r.url ?? '',
      created:       r.pubDate ? new Date(r.pubDate).toISOString() : new Date().toISOString(),
      category:      Array.isArray(r.jobIndustry) ? r.jobIndustry[0] : (r.jobIndustry ?? ''),
      contract_type: Array.isArray(r.jobType) ? r.jobType[0] : (r.jobType ?? null),
      source:        'jobicy' as const,
    }));
  } catch (e) {
    console.warn('[jobs] Jobicy exception:', e);
    return [];
  }
}

// ─── Scraped Jobs (Jora / ACS cached in Supabase) ────────────────────────────
// Already IT-filtered by the scraper's isITJob() at write time — no re-filter needed.

// City → state abbreviation for scraped job location matching.
// Only the state for the selected city is included — not all states at once,
// which was causing Brisbane searches to return NSW/VIC/WA results.
const CITY_STATE: Record<string, string> = {
  brisbane:  'QLD',
  sydney:    'NSW',
  melbourne: 'VIC',
  perth:     'WA',
  adelaide:  'SA',
  canberra:  'ACT',
  hobart:    'TAS',
  darwin:    'NT',
};

async function fetchScrapedJobs(location: string): Promise<AdzunaJob[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.warn('[jobs] Scraped: Supabase env vars not set — skipping');
    return [];
  }
  try {
    const sb    = createClient(supabaseUrl, anonKey);
    const loc   = location.slice(0, 40);
    const state = CITY_STATE[loc.toLowerCase()];

    // Match the selected city/state + catch-alls (remote + australia-wide).
    // Do NOT include other states — "Brisbane" must not return NSW/VIC/WA jobs.
    const locationClauses = [
      `location.ilike.%${loc}%`,
      state ? `location.ilike.%${state}%` : null,
      `location.ilike.%remote%`,
      `location.ilike.%australia%`,
    ].filter(Boolean).join(',');

    const { data, error } = await sb
      .from('scraped_jobs')
      .select('id, source, title, company, location, description, salary, salary_min, salary_max, url, category, contract_type, created')
      .or(locationClauses)
      .gt('expires_at', new Date().toISOString())
      .gte('created', '2026-01-01')
      .not('source', 'in', '("indeed","seek")')
      .order('created', { ascending: false })
      .limit(60);

    if (error || !data) {
      console.warn('[jobs] Scraped query error:', error?.message ?? 'no data');
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
// Uses AND matching (what=) + category=it-jobs to restrict at source.
// This prevents non-IT results (accountants, plant operators) from ever reaching
// our filter — Adzuna's own category filter is applied server-side on their end.

async function fetchAdzuna(
  keywords: string,
  location: string,
  sortBy: string,
  fullTime: string | null,
  salaryMin: string | null,
  salaryMax: string | null,
  page: number,
): Promise<AdzunaJob[]> {
  if (!APP_ID || !APP_KEY) {
    console.warn('[jobs] Adzuna: credentials not configured — skipping');
    return [];
  }
  try {
    const params = new URLSearchParams({
      app_id:           APP_ID,
      app_key:          APP_KEY,
      results_per_page: '50',
      what:             keywords,   // AND match — all words must appear (not what_or)
      where:            location,
      sort_by:          sortBy,
      category:         'it-jobs',  // Adzuna IT category — filters at source
      max_days_old:     '120',      // 2026 jobs only (covers Jan 1 → now with buffer)
    });
    if (fullTime === '1') params.set('full_time', '1');
    if (salaryMin)        params.set('salary_min', salaryMin);
    if (salaryMax)        params.set('salary_max', salaryMax);

    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/au/search/${page}?${params}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      console.warn('[jobs] Adzuna HTTP error:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return (data.results ?? []).map((r: AdzunaHit) => ({
      id:            r.id,
      title:         r.title,
      company:       r.company?.display_name ?? 'Unknown',
      location:      r.location?.display_name ?? location,
      description:   r.description ?? '',
      salary:        r.salary_min && r.salary_max
        ? `$${Math.round(r.salary_min / 1000)}k – $${Math.round(r.salary_max / 1000)}k`
        : r.salary_min
          ? `From $${Math.round(r.salary_min / 1000)}k`
          : null,
      salary_min:    r.salary_min ?? undefined,
      salary_max:    r.salary_max ?? undefined,
      url:           r.redirect_url,
      created:       r.created,
      category:      r.category?.label ?? '',
      contract_type: r.contract_type ?? null,
      source:        'adzuna' as const,
    }));
  } catch (e) {
    console.warn('[jobs] Adzuna exception:', e);
    return [];
  }
}

// ─── Remotive (global remote tech jobs — Remote tab only) ─────────────────────

async function fetchRemotive(keywords: string): Promise<AdzunaJob[]> {
  try {
    const search = keywords.replace(/\bremote\b/gi, '').trim() || 'developer';
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?limit=50&search=${encodeURIComponent(search)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) { console.warn('[jobs] Remotive HTTP error:', res.status); return []; }
    const json = await res.json();
    return (json.jobs ?? []).map((r: RemotiveHit) => ({
      id:            `remotive-${r.id}`,
      title:         r.title ?? '',
      company:       r.company_name ?? 'Unknown',
      location:      r.candidate_required_location || 'Remote',
      description:   r.description ?? '',
      salary:        r.salary || null,
      salary_min:    undefined,
      salary_max:    undefined,
      url:           r.url ?? '',
      created:       r.publication_date ?? new Date().toISOString(),
      category:      r.category ?? '',
      contract_type: r.job_type ?? null,
      source:        'remotive' as const,
    }));
  } catch (e) {
    console.warn('[jobs] Remotive exception:', e);
    return [];
  }
}

// ─── HTML sanitizer ───────────────────────────────────────────────────────────

function sanitizeJobHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/<\/?(?:form|input|button|textarea|select|object|embed|applet|meta|link|base)[^>]*>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .trim();
}

function sanitizeJobs(jobs: AdzunaJob[]): AdzunaJob[] {
  return jobs.map(j => ({ ...j, description: sanitizeJobHtml(j.description) }));
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupKey(title: string, company: string): string {
  return `${title}|${company}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const keywords  = sp.get('keywords') || 'software developer';
  const location  = sp.get('location') || 'Brisbane';
  const fullTime  = sp.get('full_time');
  const salaryMin = sp.get('salary_min');
  const salaryMax = sp.get('salary_max');

  const rawPage = parseInt(sp.get('page') ?? '1', 10);
  const page    = Number.isFinite(rawPage) ? Math.max(1, Math.min(rawPage, 10)) : 1;

  const rawSort = sp.get('sort_by') ?? 'date';
  const sortBy  = ALLOWED_SORT.has(rawSort) ? rawSort : 'date';

  const rawTab = sp.get('tab') ?? 'au';
  const tab    = ALLOWED_TABS.has(rawTab) ? rawTab : 'au';

  const seen = new Set<string>();
  function addUnique(list: AdzunaJob[]): AdzunaJob[] {
    return list.filter(j => {
      const key = dedupKey(j.title, j.company);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── Remote tab: Remotive + Jobicy + JSearch + Adzuna + Google Jobs ───────────
  if (tab === 'remote') {
    const kw = keywords.replace(/\bremote\b/gi, '').trim() || 'developer';
    const [remotiveRes, jobicyRes, jsearchRes, az1Res, az2Res, gjRes] = await Promise.allSettled([
      fetchRemotive(kw),
      fetchJobicy(kw),
      fetchJSearch(`${kw} remote`, 'Remote'),
      fetchAdzuna(`${kw} remote`, 'Australia', sortBy, fullTime, salaryMin, salaryMax, 2 * page - 1),
      fetchAdzuna(`${kw} remote`, 'Australia', sortBy, fullTime, salaryMin, salaryMax, 2 * page),
      fetchGoogleJobs(`${kw} remote`, 'Australia', page),
    ]);

    const rawRemotive = remotiveRes.status === 'fulfilled' ? remotiveRes.value : [];
    const rawJobicy   = jobicyRes.status   === 'fulfilled' ? jobicyRes.value   : [];
    const rawJSearch  = jsearchRes.status  === 'fulfilled' ? jsearchRes.value  : [];
    const rawAdzuna   = [
      ...(az1Res.status === 'fulfilled' ? az1Res.value : []),
      ...(az2Res.status === 'fulfilled' ? az2Res.value : []),
    ];
    const rawGJobs    = gjRes.status === 'fulfilled' ? gjRes.value : [];

    if (remotiveRes.status === 'rejected') console.warn('[jobs] Remotive rejected:', remotiveRes.reason);
    if (jobicyRes.status   === 'rejected') console.warn('[jobs] Jobicy rejected:',   jobicyRes.reason);
    if (jsearchRes.status  === 'rejected') console.warn('[jobs] JSearch rejected:',  jsearchRes.reason);
    if (az1Res.status      === 'rejected') console.warn('[jobs] Adzuna p1 rejected:', az1Res.reason);
    if (az2Res.status      === 'rejected') console.warn('[jobs] Adzuna p2 rejected:', az2Res.reason);
    if (gjRes.status       === 'rejected') console.warn('[jobs] GoogleJobs rejected:', gjRes.reason);

    const remotiveJobs = filterIT(rawRemotive);
    const jobicyJobs   = filterIT(rawJobicy);
    const jsearchJobs  = filterIT(rawJSearch);
    const adzunaJobs   = filterIT(rawAdzuna);
    const gjobsJobs    = filterIT(rawGJobs);
    if (process.env.NODE_ENV !== 'production') console.log(`[jobs] remote: remotive=${rawRemotive.length}→${remotiveJobs.length} jobicy=${rawJobicy.length}→${jobicyJobs.length} jsearch=${rawJSearch.length}→${jsearchJobs.length} gjobs=${rawGJobs.length}→${gjobsJobs.length} adzuna=${rawAdzuna.length}→${adzunaJobs.length}`);

    const merged = sanitizeJobs([
      ...addUnique(remotiveJobs),
      ...addUnique(jobicyJobs),
      ...addUnique(gjobsJobs),
      ...addUnique(jsearchJobs),
      ...addUnique(adzunaJobs),
    ]);
    return NextResponse.json({
      jobs:    merged,
      total:   merged.length,
      count:   merged.length,
      hasMore: rawAdzuna.length >= 90,
      sources: { remotive: remotiveJobs.length, jobicy: jobicyJobs.length, google: gjobsJobs.length, jsearch: jsearchJobs.length, adzuna: adzunaJobs.length },
    });
  }

  // ── Freelance tab: JSearch + Adzuna ───────────────────────────────────────────
  if (tab === 'freelance') {
    const kw = `${keywords} contract freelance`;
    const [jsearchRes, az1Res, az2Res] = await Promise.allSettled([
      fetchJSearch(kw, location),
      fetchAdzuna(kw, location, sortBy, '0', salaryMin, salaryMax, 2 * page - 1),
      fetchAdzuna(kw, location, sortBy, '0', salaryMin, salaryMax, 2 * page),
    ]);

    const rawJSearch = jsearchRes.status === 'fulfilled' ? jsearchRes.value : [];
    const rawAdzuna  = [
      ...(az1Res.status === 'fulfilled' ? az1Res.value : []),
      ...(az2Res.status === 'fulfilled' ? az2Res.value : []),
    ];

    if (jsearchRes.status === 'rejected') console.warn('[jobs] JSearch rejected:', jsearchRes.reason);
    if (az1Res.status     === 'rejected') console.warn('[jobs] Adzuna p1 rejected:', az1Res.reason);
    if (az2Res.status     === 'rejected') console.warn('[jobs] Adzuna p2 rejected:', az2Res.reason);

    const jsearchJobs = filterIT(rawJSearch);
    const adzunaJobs  = filterIT(rawAdzuna);
    if (process.env.NODE_ENV !== 'production') console.log(`[jobs] freelance: jsearch=${rawJSearch.length}→${jsearchJobs.length} adzuna=${rawAdzuna.length}→${adzunaJobs.length}`);

    const merged = sanitizeJobs([
      ...addUnique(jsearchJobs),
      ...addUnique(adzunaJobs),
    ]);
    return NextResponse.json({
      jobs:    merged,
      total:   merged.length,
      count:   merged.length,
      hasMore: rawAdzuna.length >= 90,
      sources: { jsearch: jsearchJobs.length, adzuna: adzunaJobs.length },
    });
  }

  // ── AU tab: Jora/ACS (scraped) + Google Jobs (live) + Adzuna ────────────────
  // Three parallel sources, three UI sections.
  // JSearch removed: too noisy for AU. Apify Seek/LinkedIn/Indeed dropped: ToS.
  // Google Jobs via ScraperAPI fills that gap legally (indexes Seek/LinkedIn/Indeed).
  const [scrapedRes, gj1Res, gj2Res, az1Res, az2Res] = await Promise.allSettled([
    fetchScrapedJobs(location),
    fetchGoogleJobs(keywords, location, 2 * page - 1),
    fetchGoogleJobs(keywords, location, 2 * page),
    fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, 2 * page - 1),
    fetchAdzuna(keywords, location, sortBy, fullTime, salaryMin, salaryMax, 2 * page),
  ]);

  const rawScraped = scrapedRes.status === 'fulfilled' ? scrapedRes.value : [];
  const rawGJobs   = [
    ...(gj1Res.status === 'fulfilled' ? gj1Res.value : []),
    ...(gj2Res.status === 'fulfilled' ? gj2Res.value : []),
  ];
  const rawAdzuna  = [
    ...(az1Res.status === 'fulfilled' ? az1Res.value : []),
    ...(az2Res.status === 'fulfilled' ? az2Res.value : []),
  ];

  if (scrapedRes.status === 'rejected') console.warn('[jobs] Scraped rejected:',    scrapedRes.reason);
  if (gj1Res.status     === 'rejected') console.warn('[jobs] GoogleJobs p1 rejected:', gj1Res.reason);
  if (gj2Res.status     === 'rejected') console.warn('[jobs] GoogleJobs p2 rejected:', gj2Res.reason);
  if (az1Res.status     === 'rejected') console.warn('[jobs] Adzuna p1 rejected:',  az1Res.reason);
  if (az2Res.status     === 'rejected') console.warn('[jobs] Adzuna p2 rejected:',  az2Res.reason);

  const scrapedJobs = addUnique(filterIT(rawScraped));
  const googleFinal = addUnique(filterIT(rawGJobs));
  const adzunaFinal = addUnique(filterIT(rawAdzuna));

  if (process.env.NODE_ENV !== 'production') console.log(`[jobs] au: scraped=${rawScraped.length}→${scrapedJobs.length} google=${rawGJobs.length}→${googleFinal.length} adzuna=${rawAdzuna.length}→${adzunaFinal.length}`);

  // Jobs array order: scraped → google_jobs → adzuna
  // scrapedCount and googleCount are boundary indices for UI section rendering.
  const allJobs = sanitizeJobs([...scrapedJobs, ...googleFinal, ...adzunaFinal]);

  return NextResponse.json({
    jobs:         allJobs,
    scrapedCount: scrapedJobs.length,
    googleCount:  googleFinal.length,
    adzunaCount:  adzunaFinal.length,
    total:        allJobs.length,
    count:        allJobs.length,
    hasMore:      rawAdzuna.length >= 90,
    sources: {
      scraped: scrapedJobs.length,
      google:  googleFinal.length,
      adzuna:  adzunaFinal.length,
    },
  });
}
