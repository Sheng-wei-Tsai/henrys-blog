import Link from 'next/link';

const TOOLS = [
  { href: '/dashboard/resume-analyser', emoji: '📄', label: 'Resume Analyser' },
  { href: '/interview-prep',            emoji: '🎯', label: 'Interview Prep' },
  { href: '/dashboard/visa-tracker',   emoji: '🛂', label: 'Visa Tracker' },
  { href: '/jobs',                      emoji: '💼', label: 'Job Search' },
  { href: '/learn/junior-fullstack',    emoji: '📚', label: 'Learning Paths' },
  { href: '/au-insights',               emoji: '💰', label: 'Salary Checker' },
];

export default function PublicHero() {
  return (
    <>
      {/* ── Targeted hero ── */}
      <section className="public-hero-section">
        <p style={{ fontSize: '0.85rem', color: 'var(--terracotta)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          For international IT graduates in Australia
        </p>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
          fontWeight: 700, lineHeight: 1.15,
          color: 'var(--brown-dark)', marginBottom: '1rem', letterSpacing: '-0.02em',
        }}>
          Getting your first IT job<br />in Australia is harder<br />
          <span style={{ background: 'linear-gradient(135deg, var(--terracotta) 0%, var(--gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            than it should be.
          </span>
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '44ch', lineHeight: 1.75, marginBottom: '2rem' }}>
          We built the tools you actually need: visa tracking, company intel,
          interview prep, skill paths — all for international grads.
        </p>

        <div className="hero-ctas">
          <Link href="/login" className="hero-btn-primary">Start for free →</Link>
          <a href="#tools" className="hero-btn-secondary">See how it works ↓</a>
        </div>
      </section>

      {/* ── Tools grid ── */}
      <section id="tools" style={{ paddingBottom: '3rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>
          What you get
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }} className="tools-grid">
          {TOOLS.map(t => (
            <Link key={t.href} href={t.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--warm-white)',
              border: '1px solid var(--parchment)',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 500,
              color: 'var(--brown-dark)',
              transition: 'border-color 0.15s, transform 0.15s',
            }}>
              <span>{t.emoji}</span> {t.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
