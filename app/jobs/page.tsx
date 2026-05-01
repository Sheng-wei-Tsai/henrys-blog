'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { AdzunaJob } from '../api/jobs/route';
import GapAnalysisPanel from '@/components/GapAnalysisPanel';
import EIcon from '@/components/icons/EIcon';
import CityIcon from '@/components/icons/CityIcon';
import CitySelector from '@/components/CitySelector';

type JobTab = 'au' | 'remote' | 'freelance';

const JOB_TABS: { id: JobTab; label: string; keyword: string; location?: string }[] = [
  { id: 'au',        label: 'AU Jobs',        keyword: '' },
  { id: 'remote',    label: 'Remote Jobs',    keyword: 'remote',             location: 'Remote' },
  { id: 'freelance', label: 'Freelance Jobs', keyword: 'freelance contract' },
];

const LOCATIONS    = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide', 'Remote', 'Australia'];
const SORT_OPTIONS = [
  { value: 'date',   label: 'Most Recent' },
  { value: 'salary', label: 'Salary' },
];
// Category → keyword appended to query (server-side, not client-side filter)
const CATEGORIES: { label: string; keyword: string }[] = [
  { label: 'All',       keyword: '' },
  { label: 'Developer', keyword: 'developer' },
  { label: 'DevOps',    keyword: 'devops' },
  { label: 'Data',      keyword: 'data engineer' },
  { label: 'Security',  keyword: 'cyber security' },
  { label: 'QA',        keyword: 'QA tester' },
];

const QUICK_STARTS = [
  'Software Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Cyber Security',
  'QA Engineer',
  'Python Developer',
  'ML Engineer',
];

const LS_KEY        = 'job-search-prefs';
// v5: ScraperAPI Google Jobs added (googleCount), Jobicy added to remote tab
const JOBS_CACHE_KEY = 'job-search-cache-v5';
const JOBS_CACHE_TTL = 10 * 60 * 1000;
// Evict all prior cache versions on load
if (typeof window !== 'undefined') {
  localStorage.removeItem('job-search-cache');
  localStorage.removeItem('job-search-cache-v2');
  localStorage.removeItem('job-search-cache-v3');
  localStorage.removeItem('job-search-cache-v4');
}

function loadPrefs() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null'); } catch { return null; }
}

function savePrefs(prefs: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch { /* quota */ }
}

interface SourceCounts {
  jsearch?:  number;
  scraped?:  number;
  google?:   number;
  adzuna?:   number;
  remotive?: number;
  jobicy?:   number;
}

interface JobsCache {
  jobs:         AdzunaJob[];
  scrapedCount: number;
  googleCount:  number;
  adzunaCount:  number;
  total:        number;
  count:        number;
  hasMore:      boolean;
  sources?:     SourceCounts;
  query:        string;
  cachedAt:     number;
}

function loadJobsCache(query: string): JobsCache | null {
  try {
    const raw = localStorage.getItem(JOBS_CACHE_KEY);
    if (!raw) return null;
    const cache: JobsCache = JSON.parse(raw);
    if (cache.query !== query) return null;
    if (Date.now() - cache.cachedAt > JOBS_CACHE_TTL) return null;
    return cache;
  } catch { return null; }
}

function saveJobsCache(cache: Omit<JobsCache, 'cachedAt'>) {
  try {
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({ ...cache, cachedAt: Date.now() }));
  } catch { /* quota */ }
}

function clearJobsCache() {
  localStorage.removeItem(JOBS_CACHE_KEY);
}

// ─── Section divider (AU tab only) ───────────────────────────────────────────

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.2rem 0 0.5rem' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--parchment)', borderRadius: '99px', padding: '0.1em 0.55em' }}>
        {count}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--parchment)' }} />
    </div>
  );
}

// ─── HTML stripping ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasHtmlTags(str: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(str);
}

// ─── Freshness ───────────────────────────────────────────────────────────────

function freshness(dateStr: string): { label: string; color: string } {
  const hours = (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
  if (hours < 24)  return { label: 'Today',                             color: 'var(--jade)' };
  if (hours < 72)  return { label: `${Math.floor(hours / 24)}d ago`,    color: 'var(--gold)' };
  const days = Math.floor(hours / 24);
  if (days  < 30)  return { label: `${days}d ago`,                      color: 'var(--vermilion)' };
  return             { label: `${Math.floor(days / 30)}mo ago`,          color: 'var(--text-muted)' };
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, savedIds, onSaveToggle, onApply, isLoggedIn }: {
  job: AdzunaJob;
  savedIds: Set<string>;
  onSaveToggle: (job: AdzunaJob) => void;
  onApply: (job: AdzunaJob) => void;
  isLoggedIn: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSaved = savedIds.has(job.id);
  const { label: ageLabel, color: ageColor } = freshness(job.created);

  const SOURCE_META: Record<string, { label: string; cls: string }> = {
    jsearch:     { label: job.publisher ?? 'Google Jobs', cls: 'tag tag-jsearch' },
    google_jobs: { label: job.publisher ?? 'Google Jobs', cls: 'tag tag-google' },
    jora:        { label: 'Jora',     cls: 'tag tag-jora' },
    indeed:      { label: 'Indeed',   cls: 'tag tag-indeed' },
    acs:         { label: 'ACS',      cls: 'tag tag-acs' },
    seek:        { label: 'Seek',     cls: 'tag tag-seek' },
    adzuna:      { label: 'Adzuna',   cls: 'tag tag-adzuna' },
    linkedin:    { label: 'LinkedIn', cls: 'tag tag-linkedin' },
    remotive:    { label: 'Remotive', cls: 'tag tag-remotive' },
    jobicy:      { label: 'Jobicy',   cls: 'tag tag-jobicy' },
  };
  const srcMeta = SOURCE_META[job.source] ?? { label: job.source, cls: 'tag' };
  const isHtml = hasHtmlTags(job.description);

  return (
    <div className="job-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* City mascot — slides in on hover/focus-within via .job-card-mascot CSS class */}
      <div className="job-card-mascot" aria-hidden="true" role="presentation">
        <CityIcon city={job.location ?? ''} size={80} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
      </div>
      {/* Top row: title/meta + age badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="job-card-title">
            {job.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {job.company} · {job.location}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {job.contract_type && <span className="tag">{job.contract_type}</span>}
            {job.category      && <span className="tag">{job.category}</span>}
            {job.salary        && <span className="tag" style={{ color: 'var(--terracotta)', display: 'inline-flex', alignItems: 'center', gap: '0.25em' }}><EIcon name="coin" size={12} />{job.salary}</span>}
            <span className={srcMeta.cls}>via {srcMeta.label}</span>
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: ageColor, flexShrink: 0 }}>{ageLabel}</span>
      </div>

      {/* Action buttons — always visible, wrap on mobile */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={() => onSaveToggle(job)}
          title={isSaved ? 'Remove from saved' : 'Save job'}
          className="job-btn-save"
          style={{
            background: isSaved ? 'rgba(232,64,64,0.08)' : undefined,
            border: isSaved ? '1px solid var(--terracotta)' : undefined,
            color: isSaved ? 'var(--terracotta)' : undefined,
          }}
        >
          <EIcon name={isSaved ? 'heart-filled' : 'heart'} size={13} style={{ marginRight: '0.3em' }} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <Link
          href={`/cover-letter?title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&desc=${encodeURIComponent(job.description)}`}
          className="job-btn-cover">
          <EIcon name="pencil-letter" size={13} style={{ marginRight: '0.3em' }} />Cover Letter
        </Link>
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          onClick={() => onApply(job)}
          style={{
            background: 'var(--terracotta)', color: 'white',
            padding: '0.4rem 1rem', borderRadius: '99px',
            fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
          }}>
          Apply →
        </a>
      </div>

      {/* Skill Gap Analysis */}
      <div style={{ marginBottom: '0.5rem' }}>
        <GapAnalysisPanel
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          description={job.description}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {expanded ? (
          isHtml
            /* Description is server-sanitized (script/iframe/on* stripped) before reaching client */
            // eslint-disable-next-line react/no-danger
            ? <div className="job-description-html" dangerouslySetInnerHTML={{ __html: job.description }} />
            : <p>{job.description}</p>
        ) : (
          <p style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {isHtml ? stripHtml(job.description) : job.description}
          </p>
        )}
        <button onClick={() => setExpanded(v => !v)} style={{
          background: 'none', border: 'none', color: 'var(--terracotta)',
          cursor: 'pointer', fontSize: '0.82rem', padding: '0.2rem 0',
        }}>
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const prefs = loadPrefs() ?? {};

  const [activeTab, setActiveTab] = useState<JobTab>('au');

  const [keywords,  setKeywords]  = useState<string>(prefs.keywords  ?? 'software developer');
  const [location,  setLocation]  = useState<string>(prefs.location  ?? 'Brisbane');
  const [sortBy,    setSortBy]    = useState<string>(prefs.sortBy    ?? 'date');
  const [fullTime,      setFullTime]      = useState<boolean>(prefs.fullTime      ?? false);
  const [workingRights, setWorkingRights] = useState<boolean>(prefs.workingRights ?? false);
  const [category,  setCategory]  = useState<string>(prefs.category  ?? 'All');
  const [salaryMin, setSalaryMin] = useState<string>(prefs.salaryMin ?? '');
  const [salaryMax, setSalaryMax] = useState<string>(prefs.salaryMax ?? '');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [jobs,         setJobs]         = useState<AdzunaJob[]>([]);
  const [scrapedCount, setScrapedCount] = useState(0);
  const [googleCount,  setGoogleCount]  = useState(0);
  const [adzunaCount,  setAdzunaCount]  = useState(0);
  const [total,        setTotal]        = useState(0);
  const [count,        setCount]        = useState(0);
  const [hasMore,      setHasMore]      = useState(false);
  const [sources,      setSources]      = useState<SourceCounts | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [searched,     setSearched]     = useState(false);
  const [fromCache,    setFromCache]    = useState(false);
  const [error,        setError]        = useState('');
  const [savedIds,     setSavedIds]     = useState<Set<string>>(new Set());
  const [alertSaved,   setAlertSaved]   = useState(false);
  const [applyToast,   setApplyToast]   = useState<{ id: string; company: string } | null>(null);

  // Fire default search on first load — tries cache first
  useEffect(() => { search(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when tab changes (force refresh — different query shape)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    search(1, true);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved job IDs
  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map(r => r.job_id)));
      });
  }, [user]);

  // Persist prefs to localStorage whenever they change
  useEffect(() => {
    savePrefs({ keywords, location, sortBy, fullTime, workingRights, category, salaryMin, salaryMax });
  }, [keywords, location, sortBy, fullTime, workingRights, category, salaryMin, salaryMax]);

  // overrideKeywords: used by quick-start pills to pass the new value before state updates
  // overrideTab: used by tab buttons to pass the new tab before state updates
  const search = useCallback(async (p = 1, forceRefresh = false, overrideKeywords?: string, overrideTab?: JobTab) => {
    setLoading(true);
    setError('');
    setAlertSaved(false);

    const effectiveKeywords = overrideKeywords ?? keywords;
    const effectiveTab      = overrideTab ?? activeTab;
    const tabConfig         = JOB_TABS.find(t => t.id === effectiveTab)!;
    const catKeyword        = CATEGORIES.find(c => c.label === category)?.keyword ?? '';
    const rightsKeyword     = workingRights ? 'full working rights' : '';
    const fullQuery         = [effectiveKeywords, catKeyword, rightsKeyword, tabConfig.keyword].filter(Boolean).join(' ');
    const effectiveLocation = tabConfig.location ?? location;
    const params = new URLSearchParams({
      keywords: fullQuery, location: effectiveLocation, sort_by: sortBy, page: String(p),
      tab: effectiveTab,
      ...(fullTime  ? { full_time: '1' }      : {}),
      ...(salaryMin ? { salary_min: salaryMin } : {}),
      ...(salaryMax ? { salary_max: salaryMax } : {}),
    });
    const cacheKey = `${effectiveTab}:${params.toString()}`;

    if (p === 1 && !forceRefresh) {
      const cached = loadJobsCache(cacheKey);
      if (cached) {
        setJobs(cached.jobs);
        setScrapedCount(cached.scrapedCount ?? 0);
        setGoogleCount(cached.googleCount   ?? 0);
        setAdzunaCount(cached.adzunaCount   ?? 0);
        setTotal(cached.total);
        setCount(cached.count ?? cached.jobs.length);
        setHasMore(cached.hasMore ?? false);
        setSources(cached.sources ?? null);
        setFilterSource('all');
        setPage(1);
        setSearched(true);
        setFromCache(true);
        setLoading(false);
        return;
      }
    }

    setFromCache(false);
    setFilterSource('all');
    try {
      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch jobs. Please try again.');
      const sc = data.scrapedCount ?? 0;
      const gc = data.googleCount  ?? 0;
      const ac = data.adzunaCount  ?? 0;
      const c  = data.count ?? data.jobs?.length ?? 0;
      setJobs(data.jobs);
      setScrapedCount(sc);
      setGoogleCount(gc);
      setAdzunaCount(ac);
      setTotal(data.total);
      setCount(c);
      setHasMore(data.hasMore ?? false);
      setSources(data.sources ?? null);
      setPage(p);
      setSearched(true);
      if (p === 1) saveJobsCache({
        jobs: data.jobs, scrapedCount: sc, googleCount: gc, adzunaCount: ac,
        total: data.total, count: c, hasMore: data.hasMore ?? false,
        sources: data.sources, query: cacheKey,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [keywords, location, sortBy, fullTime, workingRights, salaryMin, salaryMax, category, activeTab]);

  const handleSaveToggle = async (job: AdzunaJob) => {
    if (!user) { router.push('/login'); return; }
    if (savedIds.has(job.id)) {
      await supabase.from('saved_jobs').delete()
        .eq('user_id', user.id).eq('job_id', job.id);
      setSavedIds(prev => { const s = new Set(prev); s.delete(job.id); return s; });
    } else {
      await supabase.from('saved_jobs').insert({
        user_id: user.id, job_id: job.id,
        title: job.title, company: job.company, location: job.location,
        salary: job.salary, url: job.url, description: job.description,
        category: job.category, contract_type: job.contract_type,
      });
      setSavedIds(prev => new Set(prev).add(job.id));
    }
  };

  const handleApply = async (job: AdzunaJob) => {
    setApplyToast({ id: job.id, company: job.company });
    setTimeout(() => setApplyToast(null), 6000);
    if (!user) return;
    await supabase.from('job_applications').upsert({
      user_id: user.id,
      job_id:  job.id,
      title:   job.title,
      company: job.company,
      url:     job.url,
      status:  'applied',
    }, { onConflict: 'user_id,job_id' });
  };

  const handleSaveSearch = async () => {
    if (!user) { router.push('/login'); return; }
    await supabase.from('job_alerts').insert({
      user_id:   user.id,
      keywords,
      location,
      full_time: fullTime,
      frequency: 'weekly',
    });
    setAlertSaved(true);
  };

  // AU tab: split flat jobs array into three sections (scraped / google / adzuna)
  const showSections   = activeTab === 'au' && filterSource === 'all' && (scrapedCount > 0 || googleCount > 0 || adzunaCount > 0);
  const sectionScraped = showSections ? jobs.slice(0, scrapedCount) : [];
  const sectionGoogle  = showSections ? jobs.slice(scrapedCount, scrapedCount + googleCount) : [];
  const sectionAdzuna  = showSections ? jobs.slice(scrapedCount + googleCount) : [];
  const visibleJobs    = filterSource === 'all' ? jobs : jobs.filter(j => j.source === filterSource);
  const jobCardProps   = { savedIds, onSaveToggle: handleSaveToggle, onApply: handleApply, isLoggedIn: !!user };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{ fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
          {activeTab === 'au' ? 'IT Jobs in Australia' : activeTab === 'remote' ? 'Remote IT Jobs' : 'Freelance IT Jobs'}
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {activeTab === 'au'
            ? 'IT roles from Jora, ACS, Google Jobs (Seek · LinkedIn · Indeed) and Adzuna.'
            : activeTab === 'remote'
            ? 'Remote IT roles from Remotive, Jobicy, Google Jobs and Adzuna.'
            : 'Contract & freelance IT roles from Google Jobs and Adzuna.'}
          {user
            ? <span> <Link href="/dashboard" style={{ color: 'var(--terracotta)' }}>View saved jobs →</Link></span>
            : ' Sign in to save jobs.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {JOB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'job-tab-active' : 'job-tab'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick-start pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
        {QUICK_STARTS.map(q => (
          <button key={q} onClick={() => { setKeywords(q); search(1, true, q); }}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '99px', fontSize: '0.82rem',
              border: '1px solid var(--parchment)', background: 'var(--warm-white)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
            {q}
          </button>
        ))}
      </div>

      {/* Search panel — hero command + chip filters + advanced drawer */}
      <div className="animate-fade-up delay-2 search-panel">

        {/* Hero row: large keyword input + location + search button */}
        <div className="search-panel-hero">
          <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
            <label htmlFor="job-keywords" className="visually-hidden">Search keywords</label>
            <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <EIcon name="magnifier" size={18} />
            </div>
            <input
              id="job-keywords"
              type="text" value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search(1)}
              placeholder="e.g. software developer, devops…"
              className="search-input-hero"
              aria-describedby="job-keywords-hint"
            />
          </div>
          <CitySelector value={location} onChange={setLocation} />
          <button onClick={() => search(1)} disabled={loading} style={{
            background: loading ? 'var(--parchment)' : 'var(--terracotta)',
            color: loading ? 'var(--text-muted)' : 'white',
            border: 'none', borderRadius: '10px',
            padding: '0.85rem 1.5rem', minWidth: '130px',
            fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '3px 3px 0 var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4em',
            transition: 'all 0.15s',
          }}>
            {loading ? 'Searching…' : (
              <>
                <EIcon name="magnifier" size={15} />
                Search
                <kbd style={{ fontSize: '0.75em', opacity: 0.75, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '3px', padding: '0 0.3em' }}>↵</kbd>
              </>
            )}
          </button>
        </div>

        <span id="job-keywords-hint" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
          Press <kbd style={{ padding: '0 0.3em', border: '1px solid var(--parchment)', borderRadius: '3px', fontSize: '0.85em' }}>Enter</kbd> to search
        </span>

        {/* Chip filter row */}
        <div className="search-chip-row">
          <label htmlFor="job-sort" className="visually-hidden">Sort by</label>
          <select id="job-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="search-select" style={{ fontSize: '0.84rem', padding: '0.4rem 0.8rem' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label htmlFor="job-category" className="visually-hidden">Job category</label>
          <select id="job-category" value={category} onChange={e => setCategory(e.target.value)}
            className="search-select" style={{ fontSize: '0.84rem', padding: '0.4rem 0.8rem' }}>
            {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label === 'All' ? 'All categories' : c.label}</option>)}
          </select>

          <button
            onClick={() => setFullTime(v => !v)}
            className={fullTime ? 'search-chip active' : 'search-chip'}
            title="Full-time positions only"
          >
            {fullTime && <EIcon name="tick" size={12} />}
            Full-time
          </button>

          <button
            onClick={() => setWorkingRights(v => !v)}
            className={workingRights ? 'search-chip active' : 'search-chip'}
            title="Roles specifying full working rights — ideal for 485 visa holders and citizens"
          >
            {workingRights && <EIcon name="tick" size={12} />}
            Working rights
          </button>

          <button
            onClick={() => setAdvancedOpen(v => !v)}
            className="search-adv-toggle"
            aria-expanded={advancedOpen}
          >
            <EIcon name="sparkle" size={12} />
            {advancedOpen ? 'Less filters' : 'More filters'}
          </button>
        </div>

        {/* Advanced drawer — salary range */}
        <div className={`search-adv-drawer${advancedOpen ? ' open' : ''}`}>
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--parchment)' }}>
              <span id="salary-range-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35em' }}>
                <EIcon name="coin" size={14} />Salary (AUD):
              </span>
              <label htmlFor="salary-min" className="visually-hidden">Minimum salary AUD</label>
              <input id="salary-min" type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                placeholder="Min" min="0" step="10000"
                className="search-input search-input-sm"
                aria-labelledby="salary-range-label"
              />
              <span aria-hidden="true" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>–</span>
              <label htmlFor="salary-max" className="visually-hidden">Maximum salary AUD</label>
              <input id="salary-max" type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                placeholder="Max" min="0" step="10000"
                className="search-input search-input-sm"
                aria-labelledby="salary-range-label"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: 'rgba(232,64,64,0.08)', border: '1px solid rgba(232,64,64,0.35)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', color: 'var(--vermilion)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Live region — announces search results to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {searched && !loading && (
          count > 0
            ? `${visibleJobs.length} IT jobs found${hasMore ? ', more available on next page' : ''}`
            : 'No IT jobs found. Try broader keywords.'
        )}
        {loading && 'Searching for jobs…'}
      </div>

      {searched && !loading && (
        <div style={{ marginBottom: '0.75rem' }}>
          {/* Top row: count + controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {count > 0
                ? `${visibleJobs.length} IT jobs found${hasMore ? ' — more on next page' : ''}`
                : 'No IT jobs found — try broader keywords'}
              {fromCache && (
                <span style={{ fontSize: '0.72rem', color: 'var(--jade)', background: 'rgba(30,122,82,0.08)', border: '1px solid rgba(30,122,82,0.2)', padding: '0.1em 0.5em', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2em' }}>
                  <EIcon name="bolt" size={10} />cached
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {fromCache && (
                <button onClick={() => { clearJobsCache(); search(1, true); }}
                  style={{ background: 'none', border: '1px solid var(--parchment)', borderRadius: '99px', padding: '0.3rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  ↻ Refresh
                </button>
              )}
              {page > 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Page {page}</span>}
              {alertSaved
                ? <span style={{ fontSize: '0.82rem', color: 'var(--jade)' }}>✓ Alert saved</span>
                : (
                  <button onClick={handleSaveSearch} style={{
                    background: 'none', border: '1px solid var(--parchment)',
                    borderRadius: '99px', padding: '0.3rem 0.8rem',
                    fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}>
                    <EIcon name="bell" size={13} style={{ marginRight: '0.3em' }} />Save this search
                  </button>
                )
              }
            </div>
          </div>

          {/* Source filter chips — hidden on AU tab (sections replace them) */}
          {count > 0 && !showSections && (() => {
            const presentSources = Array.from(new Set(jobs.map(j => j.source)));
            if (presentSources.length <= 1) return null;
            const LABELS: Record<string, string> = {
              adzuna: 'Adzuna', jsearch: 'Google Jobs', google_jobs: 'Google Jobs',
              jora: 'Jora', indeed: 'Indeed', acs: 'ACS', seek: 'Seek',
              linkedin: 'LinkedIn', remotive: 'Remotive', jobicy: 'Jobicy',
            };
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Source:</span>
                <button onClick={() => setFilterSource('all')}
                  className={filterSource === 'all' ? 'source-chip source-chip-active' : 'source-chip'}>
                  All ({count})
                </button>
                {presentSources.map(src => (
                  <button key={src}
                    onClick={() => setFilterSource(filterSource === src ? 'all' : src)}
                    className={filterSource === src ? 'source-chip source-chip-active' : 'source-chip'}>
                    {LABELS[src] ?? src} ({jobs.filter(j => j.source === src).length})
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: '1.25rem', color: 'var(--terracotta)', opacity: 0.7 }}>
            <EIcon name="magnifier" size={56} />
          </div>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>Search for your dream IT job in Australia</p>
        </div>
      )}

      {/* Job list — two labelled sections for AU tab, flat list for Remote/Freelance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingBottom: '2rem' }}>
        {showSections ? (
          <>
            {sectionScraped.length > 0 && (
              <>
                <SectionDivider label="Jora · ACS" count={sectionScraped.length} />
                {sectionScraped.map(job => (
                  <JobCard key={job.id} job={job} {...jobCardProps} />
                ))}
              </>
            )}
            {sectionGoogle.length > 0 && (
              <>
                <SectionDivider label="Google Jobs — Seek · LinkedIn · Indeed" count={sectionGoogle.length} />
                {sectionGoogle.map(job => (
                  <JobCard key={job.id} job={job} {...jobCardProps} />
                ))}
              </>
            )}
            {sectionAdzuna.length > 0 && (
              <>
                <SectionDivider label="Adzuna" count={sectionAdzuna.length} />
                {sectionAdzuna.map(job => (
                  <JobCard key={job.id} job={job} {...jobCardProps} />
                ))}
              </>
            )}
          </>
        ) : (
          visibleJobs.map(job => (
            <JobCard key={job.id} job={job} {...jobCardProps} />
          ))
        )}
      </div>

      {/* Apply → Track toast */}
      {applyToast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--brown-dark)', color: 'white',
          padding: '0.75rem 1.2rem', borderRadius: '12px',
          fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 999,
          whiteSpace: 'nowrap',
        }}>
          Applied to {applyToast.company}?
          <Link href="/dashboard" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
            Track it →
          </Link>
          <button onClick={() => setApplyToast(null)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
            ✕
          </button>
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', paddingBottom: '4rem' }}>
          <button onClick={() => search(page - 1)} disabled={page <= 1 || loading}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>
            ← Prev
          </button>
          <button onClick={() => search(page + 1)} disabled={!hasMore || loading}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: !hasMore ? 'not-allowed' : 'pointer', color: !hasMore ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
