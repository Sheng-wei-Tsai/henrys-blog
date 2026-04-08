'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Issue { severity: 'critical' | 'warning' | 'pass'; title: string; detail: string }
interface ActionItem { priority: 'high' | 'medium' | 'low'; action: string }

interface Analysis {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  auFormatting: { score: number; issues: Issue[] };
  contentQuality: { score: number; strengths: string[]; gaps: string[] };
  auMarketFit: { score: number; topRolesMatch: string[]; missingSkills: string[]; shortage: boolean };
  actionItems: ActionItem[];
  interviewReadiness: string;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 80 ? 'var(--jade)' : score >= 60 ? 'var(--gold)' : 'var(--terracotta)';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--parchment)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="34" fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${(score / 100) * 213.6} 213.6`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: size > 60 ? '1.3rem' : '0.9rem', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

function SectionScore({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'var(--jade)' : score >= 60 ? 'var(--gold)' : 'var(--terracotta)';
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 6, background: 'var(--parchment)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

const SEVERITY_CONFIG = {
  critical: { icon: '❌', color: 'var(--terracotta)', bg: 'rgba(192,40,28,0.06)', border: 'rgba(192,40,28,0.2)' },
  warning:  { icon: '⚠️', color: 'var(--gold)',       bg: 'rgba(200,138,20,0.07)', border: 'rgba(200,138,20,0.25)' },
  pass:     { icon: '✅', color: 'var(--jade)',        bg: 'rgba(30,122,82,0.06)',  border: 'rgba(30,122,82,0.2)' },
};

const PRIORITY_COLOR = {
  high:   'var(--terracotta)',
  medium: 'var(--gold)',
  low:    'var(--text-muted)',
};

export default function ResumeAnalyserPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  function handleFile(f: File) {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    if (f.size > 5 * 1024 * 1024)    { setError('PDF must be under 5 MB.'); return; }
    setFile(f); setError(''); setResult(null);
  }

  async function analyse() {
    if (!file) return;
    setAnalysing(true); setError(''); setResult(null);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/resume-analyse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Analysis failed.'); return; }
      setResult(data as Analysis);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setAnalysing(false);
    }
  }

  if (loading) return null;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '5rem' }}>

      {/* Back */}
      <div style={{ paddingTop: '2.5rem' }}>
        <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 600 }}>
          ← Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.6rem' }}>
          AU Resume Analyser
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '52ch', margin: 0 }}>
          Upload your resume PDF — Claude analyses it against Australian IT industry standards
          and tells you exactly what to fix to get an interview.
        </p>
      </div>

      {/* Upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--terracotta)' : file ? 'var(--jade)' : 'var(--parchment)'}`,
          borderRadius: '12px', padding: '2.5rem 1.5rem',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(192,40,28,0.04)' : file ? 'rgba(30,122,82,0.04)' : 'var(--warm-white)',
          transition: 'all 0.2s',
          marginBottom: '1rem',
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{file ? '📄' : '⬆️'}</div>
        {file ? (
          <>
            <p style={{ fontWeight: 700, color: 'var(--jade)', margin: '0 0 0.2rem', fontSize: '0.95rem' }}>{file.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{(file.size / 1024).toFixed(0)} KB — click to change</p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, color: 'var(--brown-dark)', margin: '0 0 0.2rem' }}>Drop your PDF here, or click to browse</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>PDF only · max 5 MB · analysed by Claude AI</p>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--terracotta)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
      )}

      <button
        onClick={analyse}
        disabled={!file || analysing}
        style={{
          width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none',
          background: !file || analysing ? 'var(--parchment)' : 'var(--terracotta)',
          color: !file || analysing ? 'var(--text-muted)' : 'white',
          fontWeight: 700, fontSize: '1rem', cursor: !file || analysing ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s', marginBottom: '2rem',
        }}
      >
        {analysing ? '🔍 Analysing your resume...' : '🚀 Analyse My Resume'}
      </button>

      {/* Loading state */}
      {analysing && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤔</div>
          Reading your resume against AU IT industry standards...<br />
          This usually takes 10–20 seconds.
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Overall score */}
          <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginBottom: '1rem' }}>
              <ScoreRing score={result.overallScore} size={76} />
              <div>
                <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.2rem', color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>
                  {result.scoreLabel}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: result.overallScore >= 80 ? 'var(--jade)' : result.overallScore >= 60 ? 'var(--gold)' : 'var(--terracotta)', marginBottom: '0.4rem' }}>
                  {result.interviewReadiness}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{result.summary}</p>
              </div>
            </div>

            {/* Section scores */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <SectionScore label="AU Formatting" score={result.auFormatting.score} />
              <SectionScore label="Content Quality" score={result.contentQuality.score} />
              <SectionScore label="AU Market Fit" score={result.auMarketFit.score} />
            </div>
          </div>

          {/* Action items */}
          {result.actionItems.length > 0 && (
            <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.9rem', marginTop: 0 }}>
                🎯 Priority Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.actionItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', padding: '0.5rem 0.7rem', borderRadius: '8px', background: 'rgba(192,40,28,0.04)', border: `1px solid ${item.priority === 'high' ? 'rgba(192,40,28,0.15)' : 'var(--parchment)'}` }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '99px', background: item.priority === 'high' ? 'rgba(192,40,28,0.08)' : item.priority === 'medium' ? 'rgba(200,138,20,0.08)' : 'var(--parchment)', color: PRIORITY_COLOR[item.priority], whiteSpace: 'nowrap', flexShrink: 0, marginTop: '0.1rem' }}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AU Formatting */}
          <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.9rem', marginTop: 0 }}>
              📋 AU Formatting Check
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.auFormatting.issues.map((issue, i) => {
                const cfg = SEVERITY_CONFIG[issue.severity];
                return (
                  <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span>{cfg.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.color }}>{issue.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '1.5rem' }}>{issue.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content quality */}
          <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.9rem', marginTop: 0 }}>
              ✍️ Content Quality
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.8rem' }}>
              <div style={{ background: 'rgba(30,122,82,0.06)', border: '1px solid rgba(30,122,82,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.5rem' }}>✓ Strengths</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {result.contentQuality.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ul>
              </div>
              <div style={{ background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem' }}>✗ Gaps to address</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {result.contentQuality.gaps.map((g, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AU Market Fit */}
          <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.9rem', marginTop: 0 }}>
              🇦🇺 AU Market Fit
            </h2>
            {result.auMarketFit.shortage && (
              <div style={{ background: 'rgba(30,122,82,0.07)', border: '1px solid rgba(30,122,82,0.2)', borderRadius: '8px', padding: '0.65rem 0.9rem', marginBottom: '0.8rem', fontSize: '0.82rem', color: 'var(--jade)', fontWeight: 600 }}>
                💪 Your skills align with JSA national shortage occupations — strong negotiating position.
              </div>
            )}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Best-fit AU roles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {result.auMarketFit.topRolesMatch.map((r, i) => (
                  <span key={i} style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.7rem', borderRadius: '99px', background: 'rgba(192,40,28,0.06)', border: '1px solid rgba(192,40,28,0.18)', color: 'var(--terracotta)' }}>{r}</span>
                ))}
              </div>
            </div>
            {result.auMarketFit.missingSkills.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Skills to add for AU market</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {result.auMarketFit.missingSkills.map((s, i) => (
                    <span key={i} style={{ fontSize: '0.8rem', padding: '0.2rem 0.7rem', borderRadius: '99px', background: 'var(--warm-white)', border: '1px solid var(--parchment)', color: 'var(--text-secondary)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analyse another */}
          <button
            onClick={() => { setFile(null); setResult(null); setError(''); if (fileRef.current) fileRef.current.value = ''; }}
            style={{ background: 'none', border: '1px solid var(--parchment)', borderRadius: '8px', padding: '0.6rem 1.2rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
          >
            ↩ Analyse another resume
          </button>
        </div>
      )}
    </div>
  );
}
