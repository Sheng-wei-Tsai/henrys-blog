'use client';
import { useState } from 'react';
import { resume } from '@/lib/resume-data';
import { Metadata } from 'next';

// ── Helpers ────────────────────────────────────────────────────
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--terracotta)', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
    >
      {children}
    </a>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem',
      borderRadius: '99px', fontSize: '0.75rem', fontWeight: 500,
      background: 'var(--parchment)', color: 'var(--text-secondary)',
      lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

// ── Job Match Widget ───────────────────────────────────────────
function JobMatchWidget() {
  const [jd,       setJd]       = useState('');
  const [result,   setResult]   = useState<any>(null);
  const [loading,  setLoading]  = useState(false);

  const analyse = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setResult(null);
    const res  = await fetch('/api/resume-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: jd }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '16px', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}
      className="no-print"
    >
      <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown-dark)', margin: 0 }}>
        🎯 Match This Job
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
        Paste a job description — AI scores your resume against it and tells you exactly what to improve before applying.
      </p>
      <textarea
        value={jd} onChange={e => setJd(e.target.value)}
        placeholder="Paste the full job description here..."
        style={{
          width: '100%', minHeight: '120px', padding: '0.8rem',
          borderRadius: '10px', border: '1px solid var(--parchment)',
          fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit',
          background: 'white', color: 'var(--brown-dark)', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button onClick={analyse} disabled={loading || !jd.trim()} style={{
        background: loading ? 'var(--parchment)' : 'var(--terracotta)',
        color: loading ? 'var(--text-muted)' : 'white',
        border: 'none', borderRadius: '10px', padding: '0.7rem',
        fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Analysing...' : 'Analyse Match'}
      </button>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor(result.score) }}>
              {result.score}%
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '10px', background: 'var(--parchment)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor(result.score), borderRadius: '99px', transition: 'width 0.8s ease' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{result.summary}</p>
            </div>
          </div>

          {/* Matched */}
          {result.matched?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10b981', marginBottom: '0.4rem' }}>✅ Matched Keywords</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {result.matched.map((k: string) => (
                  <span key={k} style={{ padding: '0.2rem 0.6rem', background: '#ecfdf5', color: '#10b981', borderRadius: '99px', fontSize: '0.78rem', border: '1px solid #a7f3d0' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {result.missing?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.4rem' }}>❌ Missing Keywords</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {result.missing.map((k: string) => (
                  <span key={k} style={{ padding: '0.2rem 0.6rem', background: '#fef2f2', color: '#ef4444', borderRadius: '99px', fontSize: '0.78rem', border: '1px solid #fecaca' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.4rem' }}>💡 How to Improve</p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {result.suggestions.map((s: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Resume Page ───────────────────────────────────────────
export default function ResumePage() {
  const print = () => window.print();

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, footer { display: none !important; }
          body { background: white !important; }
          .resume-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '4rem' }}>

        {/* Top actions — no-print */}
        <div className="no-print" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a href="/jobs" style={{
            padding: '0.5rem 1.2rem', borderRadius: '99px',
            border: '1px solid var(--parchment)', background: 'var(--warm-white)',
            color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
          }}>🔍 Find Jobs</a>
          <button onClick={print} style={{
            padding: '0.5rem 1.2rem', borderRadius: '99px',
            background: 'var(--terracotta)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
          }}>🖨️ Print / Save PDF</button>
        </div>

        {/* ── Resume Card ── */}
        <div className="resume-card" style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid var(--parchment)',
          boxShadow: '0 4px 32px rgba(44,31,20,0.07)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2c1f14 0%, #5c3a1e 100%)',
            padding: '2.5rem 2.5rem 2rem',
            color: 'white',
          }}>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: '2.2rem', fontWeight: 700, margin: 0, marginBottom: '0.3rem' }}>
              {resume.name}
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0, marginBottom: '0.1rem' }}>
              Legal name: {resume.legalName}
            </p>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0.5rem 0 1.2rem', fontWeight: 400 }}>
              {resume.title}
            </p>

            {/* Contact row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
              <span>📍 {resume.location}</span>
              <span>📞 {resume.phone}</span>
              <a href={`mailto:${resume.email}`} style={{ color: 'white', textDecoration: 'none' }}>✉️ {resume.email}</a>
              <a href={`https://${resume.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'none' }}>
                LinkedIn ↗
              </a>
              <a href={`https://${resume.github}`} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'none' }}>
                GitHub ↗
              </a>
              {resume.portfolio && (
                <a href={`https://${resume.portfolio}`} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'none' }}>
                  Portfolio ↗
                </a>
              )}
            </div>

            {/* Visa badge */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '99px', padding: '0.25rem 0.8rem',
                fontSize: '0.78rem',
              }}>
                🇦🇺 {resume.visa}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>

            {/* Summary */}
            <section>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.4rem' }}>
                Professional Summary
              </h2>
              <p style={{ fontSize: '0.93rem', lineHeight: 1.75, color: '#374151', margin: 0 }}>
                {resume.summary}
              </p>
            </section>

            {/* Skills */}
            <section>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.4rem' }}>
                Technical Skills
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(resume.skills).map(([category, skills]) => (
                  <div key={category} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', minWidth: '130px', paddingTop: '0.2rem' }}>
                      {category}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {skills.map(s => <Tag key={s}>{s}</Tag>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.4rem' }}>
                Projects
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {resume.projects.map(project => (
                  <div key={project.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.97rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                          {project.name}
                        </h3>
                        <ExternalLink href={project.url}>GitHub ↗</ExternalLink>
                        {project.demo && <ExternalLink href={project.demo}>Live ↗</ExternalLink>}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{project.period}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0 0 0.5rem', lineHeight: 1.6 }}>
                      {project.description}
                    </p>
                    <ul style={{ margin: '0 0 0.6rem', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {project.highlights.map((h, i) => (
                        <li key={i} style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6 }}>{h}</li>
                      ))}
                    </ul>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {project.tech.map(t => <Tag key={t}>{t}</Tag>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.4rem' }}>
                Education
              </h2>
              {resume.education.map(edu => (
                <div key={edu.degree}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.97rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {edu.degree}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0.2rem 0' }}>
                        {edu.institution} · {edu.location}
                      </p>
                      <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: 0 }}>{edu.notes}</p>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{edu.period}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* Languages */}
            <section>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.4rem' }}>
                Languages
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {resume.languages.map(l => <Tag key={l}>{l}</Tag>)}
              </div>
            </section>

          </div>
        </div>

        {/* ── AI Job Match Widget ── */}
        <div style={{ marginTop: '2rem' }}>
          <JobMatchWidget />
        </div>

      </div>
    </>
  );
}
