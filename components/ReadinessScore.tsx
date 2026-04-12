'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ScoreComponent {
  score:  number;
  detail: string;
}
interface ReadinessData {
  score:       number;
  band:        string;
  bandColor:   string;
  boostAction: { label: string; href: string; gain: string };
  components:  {
    resume:    ScoreComponent;
    skills:    ScoreComponent;
    interview: ScoreComponent;
    quiz:      ScoreComponent;
  };
}

// ── SVG Ring ──────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-label={`Readiness score: ${score}`} style={{ flexShrink: 0 }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--parchment)" strokeWidth="10" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

function Bar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ flex: 1, height: '6px', background: 'var(--parchment)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ── Full widget ───────────────────────────────────────────────
export default function ReadinessScore() {
  const [data,    setData]    = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const res = await fetch('/api/readiness-score', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calculating score…</span>
    </div>
  );

  if (!data) return null;

  const { score, band, bandColor, components, boostAction } = data;
  const rows: Array<{ key: string; label: string }> = [
    { key: 'resume',    label: 'Resume' },
    { key: 'skills',    label: 'Skills' },
    { key: 'interview', label: 'Interviews' },
    { key: 'quiz',      label: 'Quizzes' },
  ];

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '1.2rem' }}>
        Job Readiness Score
      </h2>

      {/* Top row: ring + band label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <ScoreRing score={score} color={bandColor} />
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brown-dark)', fontFamily: "'Lora', serif", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: bandColor, marginTop: '0.2rem' }}>{band}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>out of 100</div>
        </div>
      </div>

      {/* Breakdown rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {rows.map(({ key, label }) => {
          const c = components[key as keyof typeof components];
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.detail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bar score={c.score} color={bandColor} />
                <span style={{ width: '26px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brown-dark)', flexShrink: 0, textAlign: 'right' }}>{c.score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boost suggestion */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          💡 Boost your score:
        </span>
        <Link href={boostAction.href} style={{
          padding: '0.35rem 0.9rem', borderRadius: '99px',
          background: 'var(--terracotta)', color: 'white',
          fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
        }}>
          {boostAction.label} <span style={{ opacity: 0.8 }}>{boostAction.gain}</span>
        </Link>
      </div>
    </div>
  );
}

// ── Mini widget (header) — SVG ring around avatar ────────────
export function ReadinessScoreMini({ children }: { children?: React.ReactNode }) {
  const [data, setData] = useState<{ score: number; bandColor: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/readiness-score', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = await res.json();
        setData({ score: j.score, bandColor: j.bandColor });
      }
    })();
  }, []);

  const r    = 19;
  const circ = 2 * Math.PI * r;
  const dash = data ? (data.score / 100) * circ : 0;

  return (
    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
      {/* Progress ring — rotated so arc starts at 12 o'clock */}
      <svg
        width="44" height="44" viewBox="0 0 44 44"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--parchment)" strokeWidth="3.5" />
        {data && (
          <circle
            cx="22" cy="22" r={r}
            fill="none"
            stroke={data.bandColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        )}
      </svg>
      {/* Avatar centered inside the ring */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {children}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background:   'var(--warm-white)',
  border:       '1px solid var(--parchment)',
  borderRadius: '14px',
  padding:      '1.4rem',
  marginBottom: '1.5rem',
};
