'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminGuard from '@/components/AdminGuard';

interface DailyPoint { date: string; views: number }
interface Summary {
  overview: { totalViews: number; uniqueSessions: number; topDay: { date: string; views: number } };
  daily: DailyPoint[];
  topPages:  { path: string;    count: number }[];
  referrers: { source: string;  count: number }[];
  countries: { country: string; count: number }[];
  devices:   { mobile: number; tablet: number; desktop: number };
}
interface Suggestion { title: string; insight: string; action: string }

// Country code → flag emoji
function flag(code: string) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E0 - 65 + c.charCodeAt(0)));
}

function SparkLine({ data }: { data: DailyPoint[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.views), 1);
  const W = 600, H = 80, PAD = 4;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (d.views / max) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px', overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke="var(--terracotta)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
        const y = H - PAD - (d.views / max) * (H - PAD * 2);
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--terracotta)" opacity={d.views > 0 ? 0.8 : 0}>
            <title>{d.date}: {d.views} views</title>
          </circle>
        );
      })}
    </svg>
  );
}

function BarRow({ label, count, total, color = 'var(--terracotta)' }: { label: string; count: number; total: number; color?: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
        <span style={{ color: 'var(--brown-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          {label}
        </span>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{count} <span style={{ opacity: 0.6 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: '5px', background: 'var(--parchment)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setSummary(d);
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoadingData(false));
  }, []);

  const fetchAI = useCallback(() => {
    if (!summary) return;
    setLoadingAI(true);
    fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    })
      .then(r => r.json())
      .then(d => setSuggestions(d.suggestions ?? []))
      .catch(() => setSuggestions([{ title: 'Error', insight: 'Failed to load suggestions', action: 'Try again' }]))
      .finally(() => setLoadingAI(false));
  }, [summary]);

  if (loadingData) return <p style={{ color: 'var(--text-muted)', padding: '3rem' }}>Loading analytics…</p>;
  if (error) return <p style={{ color: 'red', padding: '3rem' }}>{error}</p>;
  if (!summary) return null;

  const { overview, daily, topPages, referrers, countries, devices } = summary;
  const totalViews = overview.totalViews;
  const totalDevices = (devices.mobile ?? 0) + (devices.tablet ?? 0) + (devices.desktop ?? 0);

  const card = (label: string, value: string | number, sub?: string) => (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '12px', padding: '1.25rem 1.5rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--terracotta)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
    }}>
      <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '2rem', color: 'var(--brown-dark)', marginBottom: '0.4rem' }}>
          Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Last 30 days · <a href="/admin" style={{ color: 'var(--terracotta)' }}>← Admin</a>
        </p>
      </div>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {card('Page views (30d)', totalViews.toLocaleString())}
        {card('Unique sessions', overview.uniqueSessions.toLocaleString())}
        {card('Best day', overview.topDay?.views ?? 0, overview.topDay?.date ?? '')}
      </div>

      {/* Daily trend */}
      {section('Daily views — last 30 days',
        <div>
          <SparkLine data={daily} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>{daily[0]?.date}</span>
            <span>{daily[daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Top pages */}
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Top pages
          </h2>
          {topPages.slice(0, 10).map(p => (
            <BarRow key={p.path} label={p.path || '/'} count={p.count} total={totalViews} />
          ))}
        </div>

        {/* Traffic sources */}
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Traffic sources
          </h2>
          {referrers.slice(0, 10).map(r => (
            <BarRow key={r.source} label={r.source} count={r.count} total={totalViews} color="var(--jade)" />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Countries */}
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Countries
          </h2>
          {countries.slice(0, 10).map(c => (
            <BarRow key={c.country} label={`${flag(c.country)} ${c.country}`} count={c.count} total={totalViews} color="#a78bfa" />
          ))}
        </div>

        {/* Devices */}
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Devices
          </h2>
          {[
            { label: '🖥  Desktop', count: devices.desktop ?? 0 },
            { label: '📱  Mobile',  count: devices.mobile  ?? 0 },
            { label: '📟  Tablet',  count: devices.tablet  ?? 0 },
          ].map(d => (
            <BarRow key={d.label} label={d.label} count={d.count} total={totalDevices} color="var(--gold)" />
          ))}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Mobile share: {totalDevices ? Math.round(((devices.mobile ?? 0) / totalDevices) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            AI Growth Suggestions
          </h2>
          <button
            onClick={fetchAI}
            disabled={loadingAI}
            style={{
              padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 600,
              background: 'var(--terracotta)', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: loadingAI ? 'default' : 'pointer',
              opacity: loadingAI ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loadingAI ? 'Thinking…' : suggestions ? '↻ Refresh' : 'Generate insights'}
          </button>
        </div>

        {!suggestions && !loadingAI && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Click "Generate insights" to get AI-powered growth recommendations based on your traffic data.
          </p>
        )}

        {loadingAI && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Analysing 30 days of traffic…</p>
        )}

        {suggestions && !loadingAI && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                borderLeft: '3px solid var(--terracotta)', paddingLeft: '1rem',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--brown-dark)', marginBottom: '0.25rem' }}>
                  {i + 1}. {s.title}
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  {s.insight}
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--terracotta)', fontWeight: 500 }}>
                  → {s.action}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return <AdminGuard><Dashboard /></AdminGuard>;
}
