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
  const color = rating >= 4 ? 'var(--jade)' : rating >= 3.5 ? 'var(--gold)' : 'var(--terracotta)';
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
  const color = value >= 4 ? 'var(--jade)' : value >= 3.5 ? 'var(--gold)' : 'var(--terracotta)';
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
          ].map(item => (
            <span key={item.text} style={{
              fontSize: '0.8rem', color: 'var(--text-muted)',
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              padding: '0.25rem 0.7rem', borderRadius: '99px',
            }}>
              {item.icon} {item.text}
            </span>
          ))}
          <a
            href={`https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem', color: 'var(--terracotta)',
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              padding: '0.25rem 0.7rem', borderRadius: '99px',
              textDecoration: 'none', fontWeight: 600,
            }}
          >
            🔗 {company.website} ↗
          </a>
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
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: '10px', padding: '1rem 1.2rem',
          fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65,
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
          <div style={{ background: 'rgba(30,122,82,0.06)', border: '1px solid rgba(30,122,82,0.2)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.5rem' }}>✓ What employees praise</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {company.culture.pros.map(pro => (
                <li key={pro} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{pro}</li>
              ))}
            </ul>
          </div>
          <div style={{ background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem' }}>✗ Common complaints</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {company.culture.cons.map(con => (
                <li key={con} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Interview Process */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Interview Process
        </h2>
        <div style={{
          background: 'rgba(200,138,20,0.06)', border: '1px solid rgba(200,138,20,0.25)',
          borderRadius: '10px', padding: '1rem 1.2rem',
          fontSize: '0.88rem', color: 'var(--brown-mid)', lineHeight: 1.65,
          marginBottom: company.interviewProcess ? '1rem' : 0,
        }}>
          {company.culture.interviewStyle}
        </div>

        {company.interviewProcess && (
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Round breakdown
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
              {company.interviewProcess.rounds.map((round, i) => (
                <span key={round} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.73rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '99px',
                    background: 'rgba(200,138,20,0.08)', border: '1px solid rgba(200,138,20,0.25)', color: 'var(--brown-mid)',
                  }}>{round}</span>
                  {i < company.interviewProcess!.rounds.length - 1 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>→</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {[
                { label: 'Format', value: company.interviewProcess.format },
                { label: 'Duration', value: company.interviewProcess.duration },
              ].map(item => (
                <span key={item.label} style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--brown-dark)' }}>{item.label}:</strong> {item.value}
                </span>
              ))}
              {company.interviewProcess.officialGuideUrl && (
                <a
                  href={company.interviewProcess.officialGuideUrl}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.77rem', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Official hiring guide →
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Interview Questions */}
      {(company.interviewQuestions?.length ?? 0) > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', margin: 0 }}>
              Real Interview Questions
            </h2>
            {company.glassdoorInterviewUrl && (
              <a
                href={company.glassdoorInterviewUrl}
                target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--jade)',
                  textDecoration: 'none', padding: '0.25rem 0.7rem',
                  borderRadius: '6px', border: '1px solid rgba(30,122,82,0.25)', background: 'rgba(30,122,82,0.06)',
                  whiteSpace: 'nowrap',
                }}
              >
                More on Glassdoor →
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {company.interviewQuestions!.map((q, i) => {
              const roundColor: Record<string, { bg: string; text: string }> = {
                'Online Assessment': { bg: 'var(--warm-white)',               text: 'var(--text-muted)' },
                'Phone Screen':      { bg: 'rgba(200,138,20,0.06)',            text: 'var(--brown-mid)' },
                'Technical':         { bg: 'rgba(200,138,20,0.06)',            text: 'var(--brown-mid)' },
                'System Design':     { bg: 'rgba(61,28,14,0.06)',              text: 'var(--brown-mid)' },
                'Values/Culture':    { bg: 'rgba(30,122,82,0.06)',             text: 'var(--jade)' },
                'Manager':           { bg: 'rgba(200,138,20,0.08)',            text: 'var(--brown-mid)' },
                'Initial Interview': { bg: 'rgba(200,138,20,0.08)',            text: 'var(--brown-mid)' },
                'Final':             { bg: 'rgba(192,40,28,0.06)',             text: 'var(--terracotta)' },
              };
              const rc = roundColor[q.round] ?? { bg: 'var(--warm-white)', text: 'var(--text-muted)' };
              return (
                <div key={i} style={{
                  background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                  borderRadius: '10px', padding: '0.9rem 1rem',
                  borderLeft: `3px solid ${rc.text}`,
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                      borderRadius: '99px', background: rc.bg, color: rc.text,
                      border: `1px solid ${rc.text}30`,
                    }}>
                      {q.round}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--parchment)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                      {q.role}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brown-dark)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                    "{q.question}"
                  </p>
                  {q.context && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.4rem', lineHeight: 1.55 }}>
                      💡 {q.context}
                    </p>
                  )}
                  <a
                    href={q.sourceUrl}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textDecoration: 'none' }}
                  >
                    Source: {q.source}{q.year ? ` (${q.year})` : ''} ↗
                  </a>
                </div>
              );
            })}
          </div>

          <p style={{
            fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.7rem',
            lineHeight: 1.55, borderTop: '1px solid var(--parchment)', paddingTop: '0.5rem',
          }}>
            Questions sourced from official company hiring pages, published career guides, and MIT-licensed community repositories.
            No AI-generated questions — all cited to a primary source.
          </p>
        </section>
      )}

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
              <span key={t} style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(192,40,28,0.06)', border: '1px solid rgba(192,40,28,0.2)', color: 'var(--terracotta)' }}>{t}</span>
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
          background: company.sponsorship.sponsors482 ? 'rgba(30,122,82,0.06)' : 'rgba(192,40,28,0.05)',
          border: `1px solid ${company.sponsorship.sponsors482 ? 'rgba(30,122,82,0.2)' : 'rgba(192,40,28,0.2)'}`,
          borderRadius: '10px', padding: '1rem 1.2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{company.sponsorship.sponsors482 ? '✅' : '❌'}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: company.sponsorship.sponsors482 ? 'var(--jade)' : 'var(--terracotta)' }}>
              {company.sponsorship.sponsors482 ? 'Active 482 / Skills in Demand Sponsor' : 'Does not commonly sponsor'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
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
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
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
