'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CompanyData } from '@/app/au-insights/companies/data';
import type { CompanyResearch } from '@/app/api/companies/research/route';

function Shimmer({ w, h, radius = 8 }: { w: string; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: `${h}px`, borderRadius: `${radius}px`,
      background: 'linear-gradient(90deg, var(--parchment) 25%, var(--warm-white) 50%, var(--parchment) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--warm-white)',
      border: 'var(--panel-border)',
      boxShadow: 'var(--panel-shadow)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <h2 style={{
        fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 700,
        color: 'var(--brown-dark)', margin: '0 0 1rem',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.65rem',
      background: 'var(--parchment)',
      color: 'var(--text-secondary)',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 500,
      margin: '0.2rem',
    }}>
      {text}
    </span>
  );
}

function CheckList({ items, accent = 'var(--jade)' }: { items: string[]; accent?: string }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: '0.5rem', marginBottom: '0.45rem',
          fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5,
        }}>
          <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatChip({ label, value, valueColor = 'var(--text-primary)' }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: valueColor }}>{value}</div>
    </div>
  );
}

function BattleCard({ company, research }: { company: CompanyData; research: CompanyResearch }) {
  const printDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <div className="battle-card" aria-hidden="true">
      <div className="bc-header">
        <div className="bc-company-name">{company.name}</div>
        <div className="bc-header-meta">
          <span className="bc-tier">{company.tierLabel}</span>
          <span>·</span>
          <span>{company.auCity}</span>
          <span>·</span>
          <span>Glassdoor {company.glassdoor.rating}/5 ({company.glassdoor.reviews} reviews)</span>
        </div>
        <div className="bc-tagline">{company.tagline}</div>
      </div>

      <div className="bc-stats-bar">
        <div className="bc-stat">
          <span className="bc-stat-label">WFH Policy</span>
          <span className="bc-stat-val">{company.wfh}</span>
        </div>
        <div className="bc-stat">
          <span className="bc-stat-label">Visa 482</span>
          <span className="bc-stat-val">{company.sponsorship.sponsors482 ? '✓ Sponsors' : '✗ None'}</span>
        </div>
        <div className="bc-stat">
          <span className="bc-stat-label">Grad Salary</span>
          <span className="bc-stat-val">{company.compensation.gradRange}</span>
        </div>
        <div className="bc-stat">
          <span className="bc-stat-label">Culture</span>
          <span className="bc-stat-val">{company.culture.vibe}</span>
        </div>
      </div>

      <div className="bc-body">
        <div className="bc-col">
          <div className="bc-section">
            <div className="bc-section-title">Interview Process</div>
            <p className="bc-text-primary">{research.interviewProcess.rounds}</p>
            <p className="bc-text-secondary">{research.interviewProcess.style}</p>
          </div>
          <div className="bc-section">
            <div className="bc-section-title">Prep Checklist</div>
            <ol className="bc-ordered-list">
              {research.interviewProcess.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ol>
          </div>
          <div className="bc-section">
            <div className="bc-section-title">Culture Insight</div>
            <p className="bc-quote">&ldquo;{research.culture.standout}&rdquo;</p>
          </div>
        </div>
        <div className="bc-col">
          <div className="bc-section">
            <div className="bc-section-title">Must-Haves</div>
            <ul className="bc-check-list">
              {research.candidateProfile.mustHaves.map((item, i) => (
                <li key={i}><span className="bc-check">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bc-section">
            <div className="bc-section-title">Nice-to-Haves</div>
            <ul className="bc-check-list">
              {research.candidateProfile.niceToHaves.map((item, i) => (
                <li key={i}><span className="bc-diamond">◆</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bc-section">
            <div className="bc-section-title">Insider Tips</div>
            <ol className="bc-ordered-list">
              {research.insiderTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="bc-footer">
        <span>TechPath AU · henrysdigitallife.com</span>
        <span>AI-generated · verify with recent sources</span>
        <span>{printDate}</span>
      </div>
    </div>
  );
}

export function ResearchClient({ company }: { company: CompanyData }) {
  const cacheKey = `company_research_${company.slug}`;
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) setResearch(JSON.parse(cached) as CompanyResearch);
    } catch { /* sessionStorage may be unavailable */ }
  }, [cacheKey]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/companies/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: company.slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 401) throw new Error('Sign in to generate research briefs');
        if (res.status === 403) throw new Error('Pro subscription required — upgrade to access AI research');
        if (res.status === 429) throw new Error('Daily limit reached — try again tomorrow');
        throw new Error(data.error ?? 'Failed to generate brief');
      }
      const data = await res.json() as CompanyResearch;
      setResearch(data);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const tierColor = company.tier === 'SSS' ? 'var(--gold)'
    : company.tier === 'S' ? 'var(--amber)'
    : company.tier === 'A+' ? 'var(--terracotta)'
    : company.tier === 'A' ? 'var(--brown-mid)'
    : company.tier === 'B+' ? 'var(--brown-light)'
    : 'var(--text-muted)';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '5rem' }}>

      {/* Back nav */}
      <div style={{ paddingTop: '2.5rem', paddingBottom: '1.5rem' }}>
        <Link href={`/au-insights/companies/${company.slug}`} style={{
          fontSize: '0.85rem', color: 'var(--terracotta)',
          textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        }}>
          ← {company.name} profile
        </Link>
      </div>

      {/* Hero */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
            color: tierColor, background: `${tierColor}20`,
            border: `1px solid ${tierColor}40`,
            padding: '0.15rem 0.7rem', borderRadius: '99px',
          }}>
            {company.tierLabel}
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Lora', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2,
          margin: '0 0 0.4rem',
        }}>
          {company.name} — AI Research Brief
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.3rem' }}>
          {company.tagline}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
          {company.auCity} · Glassdoor {company.glassdoor.rating}/5 ({company.glassdoor.reviews} reviews)
        </p>
      </section>

      {/* Static quick-facts bar */}
      <div style={{
        background: 'var(--warm-white)',
        border: 'var(--panel-border)',
        boxShadow: 'var(--panel-shadow)',
        borderRadius: '12px',
        padding: '1.1rem 1.5rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '1rem',
      }}>
        <StatChip label="WFH Policy" value={company.wfh} />
        <StatChip
          label="Visa 482"
          value={company.sponsorship.sponsors482 ? 'Sponsors' : 'No sponsorship'}
          valueColor={company.sponsorship.sponsors482 ? 'var(--jade)' : 'var(--vermilion)'}
        />
        <StatChip label="Grad Salary" value={company.compensation.gradRange} />
        <StatChip label="Culture vibe" value={company.culture.vibe} />
      </div>

      {/* Generate CTA — shown only before research is loaded */}
      {!research && (
        <div style={{
          background: 'var(--warm-white)',
          border: 'var(--panel-border)',
          boxShadow: 'var(--panel-shadow)',
          borderRadius: '12px',
          padding: '2.25rem 2rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>🔍</div>
          <h2 style={{
            fontFamily: "'Lora', serif", fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--ink)', margin: '0 0 0.5rem',
          }}>
            AI Research Brief
          </h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.9rem',
            maxWidth: '400px', margin: '0 auto 1.75rem', lineHeight: 1.55,
          }}>
            Deep-dive on culture, interview process, and what makes a strong candidate — grounded in real Glassdoor and company data.
          </p>

          {error && (
            <div style={{
              color: 'var(--vermilion)', fontSize: '0.875rem',
              background: 'rgba(232,64,64,0.08)',
              padding: '0.6rem 1rem', borderRadius: '8px',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="btn-research-generate"
            style={{
              background: loading ? 'var(--parchment)' : 'var(--vermilion)',
              color: loading ? 'var(--text-muted)' : 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 2rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : 'var(--panel-shadow)',
            }}
          >
            {loading ? 'Generating…' : 'Generate Research Brief'}
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.85rem' }}>
            Pro feature · counts toward your 10 daily briefs
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {([120, 100, 140, 90, 80] as const).map((h, i) => (
            <div key={i} style={{
              background: 'var(--warm-white)', border: 'var(--panel-border)',
              borderRadius: '12px', padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              <Shimmer w="38%" h={18} />
              <Shimmer w="100%" h={h} />
            </div>
          ))}
        </div>
      )}

      {/* Research results */}
      {research && !loading && (
        <>
          {/* Meta row */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              AI-generated · verify with recent sources
            </span>
            <button
              onClick={generate}
              disabled={loading}
              className="btn-research-regenerate"
              style={{
                background: 'transparent',
                border: '1.5px solid var(--parchment)',
                borderRadius: '6px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Regenerate
            </button>
            <button
              onClick={() => window.print()}
              className="btn-research-print"
              aria-label="Print interview battle card"
              style={{
                background: 'var(--ink)',
                color: 'var(--warm-white)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🖨 Battle Card
            </button>
          </div>

          {/* Culture */}
          <SectionCard title="🏢 Culture &amp; Work Style">
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              {research.culture.snapshot}
            </p>
            <span style={{
              display: 'inline-block', background: 'var(--parchment)',
              padding: '0.3rem 0.85rem', borderRadius: '20px',
              fontSize: '0.82rem', color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
            }}>
              📍 {research.culture.workStyle}
            </span>
            <p style={{
              color: 'var(--text-secondary)', fontSize: '0.875rem',
              fontStyle: 'italic', margin: 0,
            }}>
              &ldquo;{research.culture.standout}&rdquo;
            </p>
          </SectionCard>

          {/* Tech Stack */}
          <SectionCard title="⚙️ Tech Stack">
            {research.techStack.primary.length > 0 && (
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Primary
                </div>
                <div>{research.techStack.primary.map(t => <Pill key={t} text={t} />)}</div>
              </div>
            )}
            {research.techStack.infrastructure.length > 0 && (
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Infrastructure
                </div>
                <div>{research.techStack.infrastructure.map(t => <Pill key={t} text={t} />)}</div>
              </div>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
              {research.techStack.interesting}
            </p>
          </SectionCard>

          {/* Interview Process */}
          <SectionCard title="🎯 Interview Process">
            <p style={{
              color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600,
              margin: '0 0 0.4rem', lineHeight: 1.5,
            }}>
              {research.interviewProcess.rounds}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {research.interviewProcess.style}
            </p>
            <div style={{
              fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Preparation Tips
            </div>
            <CheckList items={research.interviewProcess.tips} />
          </SectionCard>

          {/* Candidate Profile */}
          <SectionCard title="🌟 What They Look For">
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
              {research.candidateProfile.ideal}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Must-haves
                </div>
                <CheckList items={research.candidateProfile.mustHaves} accent="var(--jade)" />
              </div>
              <div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Nice-to-haves
                </div>
                <CheckList items={research.candidateProfile.niceToHaves} accent="var(--gold)" />
              </div>
            </div>
          </SectionCard>

          {/* For International Grads */}
          <SectionCard title="🌏 For International Graduates">
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              <strong>Visa Sponsorship:</strong> {research.forInternational.sponsorship}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
              <strong>Typical Pathway:</strong> {research.forInternational.pathway}
            </p>
          </SectionCard>

          {/* Insider Tips */}
          <SectionCard title="💡 Insider Tips">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {research.insiderTips.map((tip, i) => (
                <li key={i} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.75rem', background: 'var(--cream)', borderRadius: '8px',
                  fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5,
                }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* View full profile link */}
          <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
            <Link href={`/au-insights/companies/${company.slug}`} style={{
              color: 'var(--terracotta)', fontSize: '0.875rem',
              fontWeight: 600, textDecoration: 'none',
            }}>
              View full company profile →
            </Link>
          </div>

          <BattleCard company={company} research={research} />
        </>
      )}
    </div>
  );
}
