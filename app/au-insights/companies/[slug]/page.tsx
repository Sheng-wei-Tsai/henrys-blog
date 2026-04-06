import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPANIES } from '../data';

export function generateStaticParams() {
  return COMPANIES.map(c => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const company = COMPANIES.find(c => c.slug === params.slug);
  if (!company) return {};
  return { title: `${company.name} — AU Company Guide` };
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const pct = (rating / max) * 100;
  const color = rating >= 4 ? '#10b981' : rating >= 3.5 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{
        fontFamily: "'Lora', serif", fontSize: '1.5rem', fontWeight: 700, color,
      }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ 5</span>
    </span>
  );
}

function SubRating({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  const color = value >= 4 ? '#10b981' : value >= 3.5 ? '#f59e0b' : '#ef4444';
  const pct = (value / 5) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '130px' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--parchment)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: '28px' }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = COMPANIES.find(c => c.slug === params.slug);
  if (!company) notFound();

  const tierColor = company.tier === 'SSS' ? '#c8a800'
    : company.tier === 'S' ? '#d97706'
    : company.tier === 'A+' ? '#dc2626'
    : company.tier === 'A' ? '#7c3aed'
    : company.tier === 'B+' ? '#0369a1'
    : '#374151';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '5rem' }}>

      {/* Back nav */}
      <div style={{ paddingTop: '2.5rem', paddingBottom: '1.5rem' }}>
        <Link href="/au-insights" style={{
          fontSize: '0.85rem', color: 'var(--terracotta)',
          textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        }}>
          ← AU Insights
        </Link>
      </div>

      {/* Header */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          <div>
            <span style={{
              display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
              color: tierColor, background: `${tierColor}15`,
              border: `1px solid ${tierColor}40`,
              padding: '0.15rem 0.7rem', borderRadius: '99px',
              marginBottom: '0.6rem',
            }}>
              {company.tierLabel}
            </span>
            <h1 style={{
              fontFamily: "'Lora', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2,
              margin: 0,
            }}>
              {company.name}
            </h1>
          </div>
          <StarRating rating={company.glassdoor.rating} />
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          {company.tagline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {[
            { icon: '📍', text: company.auCity },
            { icon: '👥', text: company.auHeadcount },
            { icon: '🔗', text: company.website },
          ].map(item => (
            <span key={item.text} style={{
              fontSize: '0.8rem', color: 'var(--text-muted)',
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              padding: '0.25rem 0.7rem', borderRadius: '99px',
            }}>
              {item.icon} {item.text}
            </span>
          ))}
        </div>
      </section>

      {/* Glassdoor Ratings */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
          Glassdoor Ratings
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Based on {company.glassdoor.reviews.toLocaleString()} reviews on{' '}
          <a href={company.glassdoor.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            Glassdoor
          </a>
          {company.glassdoor.recommendPct && ` · ${company.glassdoor.recommendPct}% recommend to a friend`}
        </p>
        <div style={{
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderRadius: '12px', padding: '1.2rem 1.4rem',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}>
          <SubRating label="Work-Life Balance" value={company.glassdoor.workLifeBalance} />
          <SubRating label="Culture & Values" value={company.glassdoor.cultureValues} />
          <SubRating label="Career Opportunities" value={company.glassdoor.careerOpportunities} />
          <SubRating label="Diversity & Inclusion" value={company.glassdoor.divInclusion} />
          <SubRating label="Comp & Benefits" value={company.glassdoor.compBenefits} />
        </div>
      </section>

      {/* WFH Policy */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Work-From-Home Policy
        </h2>
        <div style={{
          background: '#f0f9ff', border: '1px solid #7dd3fc',
          borderRadius: '10px', padding: '1rem 1.2rem',
          fontSize: '0.88rem', color: '#0c4a6e', lineHeight: 1.65,
        }}>
          {company.wfh}
        </div>
      </section>

      {/* Culture */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Culture & Vibe
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          {company.culture.vibe}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>✓ What employees praise</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {company.culture.pros.map(pro => (
                <li key={pro} style={{ fontSize: '0.82rem', color: '#15803d', marginBottom: '0.3rem', lineHeight: 1.5 }}>{pro}</li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>✗ Common complaints</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {company.culture.cons.map(con => (
                <li key={con} style={{ fontSize: '0.82rem', color: '#dc2626', marginBottom: '0.3rem', lineHeight: 1.5 }}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Interview Style */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Interview Process
        </h2>
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '10px', padding: '1rem 1.2rem',
          fontSize: '0.88rem', color: '#92400e', lineHeight: 1.65,
        }}>
          {company.culture.interviewStyle}
        </div>
      </section>

      {/* Compensation */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Compensation (AUD, 2025–2026 est.)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
          {[
            { label: 'Graduate / Junior (0–2 yrs)', value: company.compensation.gradRange },
            { label: 'Mid-level (2–5 yrs)', value: company.compensation.midRange },
            { label: 'Senior (5+ yrs)', value: company.compensation.seniorRange },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', gap: '1rem', alignItems: 'center',
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              borderRadius: '8px', padding: '0.6rem 0.9rem', flexWrap: 'wrap',
            }}>
              <span style={{ flex: 1, minWidth: '160px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brown-dark)' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {company.compensation.notes}
        </p>
      </section>

      {/* Tech stack & roles */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Tech Stack & Roles
        </h2>
        <div style={{ marginBottom: '0.8rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {company.techStack.map(t => (
              <span key={t} style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fef4f0', border: '1px solid #f5c6b4', color: 'var(--terracotta)' }}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Common roles hired</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {company.roles.map(r => (
              <span key={r} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--warm-white)', border: '1px solid var(--parchment)', color: 'var(--text-secondary)' }}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Visa Sponsorship */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Visa Sponsorship (482 / Skills in Demand)
        </h2>
        <div style={{
          background: company.sponsorship.sponsors482 ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${company.sponsorship.sponsors482 ? '#86efac' : '#fca5a5'}`,
          borderRadius: '10px', padding: '1rem 1.2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{company.sponsorship.sponsors482 ? '✅' : '❌'}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: company.sponsorship.sponsors482 ? '#166534' : '#991b1b' }}>
              {company.sponsorship.sponsors482 ? 'Active 482 / Skills in Demand Sponsor' : 'Does not commonly sponsor'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: company.sponsorship.sponsors482 ? '#15803d' : '#dc2626', lineHeight: 1.55, margin: 0 }}>
            {company.sponsorship.notes}
          </p>
        </div>
      </section>

      {/* Recent News */}
      {company.recentNews.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
            Recent News
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {company.recentNews.map(news => (
              <div key={news.headline} style={{
                display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
                background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                borderRadius: '8px', padding: '0.7rem 0.9rem',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', minWidth: '52px', paddingTop: '0.1rem' }}>{news.date}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{news.headline}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data disclaimer */}
      <div style={{
        background: '#f9fafb', border: '1px solid var(--parchment)',
        borderRadius: '8px', padding: '0.8rem 1rem',
        fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong>Data sources:</strong> Glassdoor ratings sourced April 2026 from glassdoor.com.au (AU-filtered reviews).
        Visa sponsorship data from Department of Home Affairs FOI FA-230900293 (Sep 2023) and community-verified{' '}
        <a href="https://github.com/geshan/au-companies-providing-work-visa-sponsorship" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
          au-companies-providing-work-visa-sponsorship
        </a>{' '}
        database. Salary figures are market estimates — verify on SEEK Salary Insights before negotiating. All information is for educational purposes.
      </div>
    </div>
  );
}
