'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { AdzunaJob } from '../api/jobs/route';

const LOCATIONS    = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'Adelaide', 'Remote', 'Australia'];
const SORT_OPTIONS = [
  { value: 'date',      label: 'Most Recent' },
  { value: 'salary',    label: 'Salary' },
  { value: 'relevance', label: 'Relevance' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function JobCard({ job, savedIds, onSaveToggle }: {
  job: AdzunaJob;
  savedIds: Set<string>;
  onSaveToggle: (job: AdzunaJob) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSaved = savedIds.has(job.id);

  return (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '14px', padding: '1.4rem 1.6rem', transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(44,31,20,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
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
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{timeAgo(job.created)}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
              background: 'var(--terracotta)', color: 'white',
              padding: '0.4rem 1rem', borderRadius: '99px',
              fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
            }}>
              Apply →
            </a>
          </div>
        </div>
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

export default function JobsPage() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [keywords, setKeywords] = useState('software developer');
  const [location, setLocation] = useState('Brisbane');
  const [sortBy, setSortBy]     = useState('date');
  const [fullTime, setFullTime] = useState(false);
  const [jobs, setJobs]         = useState<AdzunaJob[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Load user's saved job IDs on mount
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

  const search = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        keywords, location, sort_by: sortBy, page: String(p),
        ...(fullTime ? { full_time: '1' } : {}),
      });
      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setJobs(data.jobs);
      setTotal(data.total);
      setPage(p);
      setSearched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [keywords, location, sortBy, fullTime]);

  const handleSaveToggle = async (job: AdzunaJob) => {
    if (!user) { router.push('/login'); return; }

    if (savedIds.has(job.id)) {
      // Unsave
      await supabase.from('saved_jobs').delete()
        .eq('user_id', user.id).eq('job_id', job.id);
      setSavedIds(prev => { const s = new Set(prev); s.delete(job.id); return s; });
    } else {
      // Save
      await supabase.from('saved_jobs').insert({
        user_id: user.id, job_id: job.id,
        title: job.title, company: job.company, location: job.location,
        salary: job.salary, url: job.url, description: job.description,
        category: job.category, contract_type: job.contract_type,
      });
      setSavedIds(prev => new Set(prev).add(job.id));
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{ fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
          IT Jobs in Australia
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Search thousands of tech jobs across Australia. {user ? <span>Logged in as <strong>{user.user_metadata?.full_name ?? user.email}</strong> · <a href="/dashboard" style={{ color: 'var(--terracotta)' }}>View saved jobs →</a></span> : 'Sign in to save jobs.'}
        </p>
      </div>

      {/* Search */}
      <div className="animate-fade-up delay-2" style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '16px', padding: '1.4rem', marginBottom: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.5rem 0.9rem', borderRadius: '10px', border: '1px solid var(--parchment)', fontSize: '0.88rem', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', color: '#c00', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {searched && !loading && (
        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {total > 0 ? `${total.toLocaleString()} jobs found` : 'No jobs found — try different keywords'}
          </p>
          {total > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Page {page} of {Math.ceil(total / 20)}</p>}
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
          <JobCard key={job.id} job={job} savedIds={savedIds} onSaveToggle={handleSaveToggle} />
        ))}
      </div>

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', paddingBottom: '4rem' }}>
          <button onClick={() => search(page - 1)} disabled={page <= 1 || loading} style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>← Prev</button>
          <button onClick={() => search(page + 1)} disabled={page >= Math.ceil(total / 20) || loading} style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', border: '1px solid var(--parchment)', background: 'var(--warm-white)', cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer', color: page >= Math.ceil(total / 20) ? 'var(--text-muted)' : 'var(--brown-dark)', fontSize: '0.9rem' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
