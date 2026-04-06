'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { AdzunaJob } from '../api/jobs/route';

const LOCATIONS    = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide', 'Remote', 'Australia'];
const SORT_OPTIONS = [
  { value: 'date',   label: 'Most Recent' },
  { value: 'salary', label: 'Salary' },
];
// Category → keyword appended to query (server-side, not client-side filter)
const CATEGORIES: { label: string; keyword: string }[] = [
  { label: 'All',             keyword: '' },
  { label: 'Developer',       keyword: 'developer' },
  { label: 'DevOps',          keyword: 'devops' },
  { label: 'Data',            keyword: 'data engineer' },
  { label: 'QA',              keyword: 'QA tester' },
];

const QUICK_STARTS = [
  'Graduate Developer',
  'Junior Full Stack',
  'Junior DevOps',
  'Data Engineer Graduate',
  'Junior QA',
  'IT Support Graduate',
];

const LS_KEY = 'job-search-prefs';

function loadPrefs() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null'); } catch { return null; }
}

function savePrefs(prefs: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch { /* quota */ }
}

// ─── Freshness ───────────────────────────────────────────────────────────────

function freshness(dateStr: string): { label: string; color: string } {
  const hours = (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
  if (hours < 24)  return { label: 'Today',                             color: '#16a34a' };
  if (hours < 72)  return { label: `${Math.floor(hours / 24)}d ago`,    color: '#d97706' };
  const days = Math.floor(hours / 24);
  if (days  < 30)  return { label: `${days}d ago`,                      color: '#dc2626' };
  return             { label: `${Math.floor(days / 30)}mo ago`,          color: '#9ca3af' };
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, savedIds, onSaveToggle, onApply }: {
  job: AdzunaJob;
  savedIds: Set<string>;
  onSaveToggle: (job: AdzunaJob) => void;
  onApply: (job: AdzunaJob) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSaved = savedIds.has(job.id);
  const { label: ageLabel, color: ageColor } = freshness(job.created);
  const sourceBadge = job.source === 'jsearch'
    ? (job.publisher ?? 'Google Jobs')
    : null;

  return (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '14px', padding: '1.4rem 1.6rem', transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(44,31,20,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Top row: title/meta + age badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
            {job.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {job.company} · {job.location}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {job.contract_type && <span className="tag">{job.contract_type}</span>}
            {job.category      && <span className="tag">{job.category}</span>}
            {job.salary        && <span className="tag" style={{ color: 'var(--terracotta)' }}>💰 {job.salary}</span>}
            {sourceBadge && (
              <span className="tag" style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}>
                via {sourceBadge}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: ageColor, flexShrink: 0 }}>{ageLabel}</span>
      </div>

      {/* Action buttons — always visible, wrap on mobile */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={() => onSaveToggle(job)}
          title={isSaved ? 'Remove from saved' : 'Save job'}
          style={{
            background: isSaved ? '#fff3f0' : 'var(--warm-white)',
            border: `1px solid ${isSaved ? 'var(--terracotta)' : 'var(--parchment)'}`,
            borderRadius: '99px', padding: '0.4rem 0.8rem',
            fontSize: '0.85rem', cursor: 'pointer',
            color: isSaved ? 'var(--terracotta)' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          {isSaved ? '♥ Saved' : '♡ Save'}
        </button>
        <a
          href={`/cover-letter?title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&desc=${encodeURIComponent(job.description)}`}
          style={{
            background: 'white', color: 'var(--terracotta)',
            padding: '0.4rem 0.8rem', borderRadius: '99px',
            border: '1px solid var(--terracotta)',
            fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
          }}>
          ✍️ Cover Letter
        </a>
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

      <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <p style={expanded ? {} : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {job.description}
        </p>
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

  const [keywords,  setKeywords]  = useState<string>(prefs.keywords  ?? 'software developer');
  const [location,  setLocation]  = useState<string>(prefs.location  ?? 'Brisbane');
  const [sortBy,    setSortBy]    = useState<string>(prefs.sortBy    ?? 'date');
  const [fullTime,  setFullTime]  = useState<boolean>(prefs.fullTime ?? false);
  const [category,  setCategory]  = useState<string>(prefs.category  ?? 'All');
  const [salaryMin, setSalaryMin] = useState<string>(prefs.salaryMin ?? '');
  const [salaryMax, setSalaryMax] = useState<string>(prefs.salaryMax ?? '');

  const [jobs,       setJobs]       = useState<AdzunaJob[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [error,      setError]      = useState('');
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set());
  const [alertSaved, setAlertSaved] = useState(false);
  const [applyToast, setApplyToast] = useState<{ id: string; company: string } | null>(null);

  // Fire default search on first load
  useEffect(() => { search(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    savePrefs({ keywords, location, sortBy, fullTime, category, salaryMin, salaryMax });
  }, [keywords, location, sortBy, fullTime, category, salaryMin, salaryMax]);

  const search = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    setAlertSaved(false);
    try {
      const catKeyword = CATEGORIES.find(c => c.label === category)?.keyword ?? '';
      const fullQuery  = catKeyword ? `${keywords} ${catKeyword}` : keywords;
      const params = new URLSearchParams({
        keywords: fullQuery, location, sort_by: sortBy, page: String(p),
        ...(fullTime    ? { full_time: '1' }      : {}),
        ...(salaryMin   ? { salary_min: salaryMin } : {}),
        ...(salaryMax   ? { salary_max: salaryMax } : {}),
      });
      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) throw new Error('Job search is not configured yet. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to enable it.');
        throw new Error(data.error || 'Failed to fetch jobs. Please try again.');
      }
      setJobs(data.jobs);
      setTotal(data.total);
      setPage(p);
      setSearched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [keywords, location, sortBy, fullTime, salaryMin, salaryMax]);

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

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{ fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
          IT Jobs in Australia
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Aggregated from Adzuna + Google for Jobs — same-day listings.
          {user
            ? <span> <a href="/dashboard" style={{ color: 'var(--terracotta)' }}>View saved jobs →</a></span>
            : ' Sign in to save jobs.'}
        </p>
      </div>

      {/* Quick-start pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
        {QUICK_STARTS.map(q => (
          <button key={q} onClick={() => { setKeywords(q); setTimeout(() => search(1), 0); }}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '99px', fontSize: '0.82rem',
              border: '1px solid var(--parchment)', background: 'var(--warm-white)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
            {q}
          </button>
        ))}
      </div>

      {/* Search panel */}
      <div className="animate-fade-up delay-2" style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '16px', padding: '1.4rem', marginBottom: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        {/* Row 1: keywords + location */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text" value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(1)}
            placeholder="e.g. software developer, devops, data engineer"
            style={{ flex: 2, minWidth: '200px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.95rem', background: 'white', color: 'var(--brown-dark)', outline: 'none' }}
          />
          <select value={location} onChange={e => setLocation(e.target.value)}
            style={{ flex: 1, minWidth: '130px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.95rem', background: 'white', color: 'var(--brown-dark)', cursor: 'pointer' }}>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Row 2: filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.5rem 0.9rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.88rem', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ padding: '0.5rem 0.9rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.88rem', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label === 'All' ? 'All categories' : c.label}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={fullTime} onChange={e => setFullTime(e.target.checked)}
              style={{ accentColor: 'var(--terracotta)', width: '15px', height: '15px' }} />
            Full-time only
          </label>

          <button onClick={() => search(1)} disabled={loading} style={{
            marginLeft: 'auto',
            background: loading ? 'var(--parchment)' : 'var(--terracotta)',
            color: loading ? 'var(--text-muted)' : 'white',
            border: 'none', borderRadius: '10px', padding: '0.65rem 1.6rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>

        {/* Row 3: salary range */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary (AUD):</span>
          <input
            type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
            placeholder="Min" min="0" step="10000"
            style={{ width: '100px', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.88rem', background: 'white', color: 'var(--brown-dark)', outline: 'none' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>–</span>
          <input
            type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
            placeholder="Max" min="0" step="10000"
            style={{ width: '100px', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.88rem', background: 'white', color: 'var(--brown-dark)', outline: 'none' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', color: '#c00', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {searched && !loading && (
        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {total > 0 ? `${total.toLocaleString()} jobs found` : 'No jobs found — try different keywords'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {total > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Page {page} of {totalPages}</span>}
            {alertSaved
              ? <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>✓ Alert saved</span>
              : (
                <button onClick={handleSaveSearch} style={{
                  background: 'none', border: '1px solid var(--parchment)',
                  borderRadius: '99px', padding: '0.3rem 0.8rem',
                  fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)',
                }}>
                  🔔 Save this search
                </button>
              )
            }
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>Search for your dream IT job in Australia</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingBottom: '2rem' }}>
        {jobs.map(job => (
          <JobCard key={job.id} job={job} savedIds={savedIds} onSaveToggle={handleSaveToggle} onApply={handleApply} />
        ))}
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
          <a href="/dashboard" style={{ color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>
            Track it →
          </a>
          <button onClick={() => setApplyToast(null)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
            ✕
          </button>
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', paddingBottom: '4rem' }}>
          <button onClick={() => search(page - 1)} disabled={page <= 1 || loading}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>
            ← Prev
          </button>
          <button onClick={() => search(page + 1)} disabled={page >= totalPages || loading}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
