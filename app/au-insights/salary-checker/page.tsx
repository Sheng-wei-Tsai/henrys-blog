'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const SalaryChecker = dynamic(() => import('./SalaryChecker'), { ssr: false });

export default function SalaryCheckerPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '5rem' }}>
      <div style={{ paddingTop: '2.5rem' }}>
        <Link href="/au-insights" style={{
          fontSize: '0.85rem', color: 'var(--terracotta)',
          textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        }}>
          ← AU Insights
        </Link>
      </div>
      <div style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.7rem',
        }}>
          Is This Salary Fair?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '52ch', marginBottom: '0.5rem' }}>
          Paste your job offer and get an instant verdict against ACS market data —
          plus a negotiation script you can send today.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          International grads accept offers 15–30% below market on average. Don't be one of them.
        </p>
      </div>

      <SalaryChecker />

      <div style={{
        marginTop: '3rem', background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '8px', padding: '0.9rem 1rem',
        fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong>Data sources:</strong> Salary ranges from ACS / Think & Grow Australian Tech Salary Guide 2025
        and ACS Information Age (ia.acs.org.au). Company tier adjustments based on ACS sector premium data.
        All figures are base salary in AUD — superannuation (11.5%) is additional.
        Verify current rates on{' '}
        <a href="https://www.seek.com.au/career-advice/salary-insights" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
          SEEK Salary Insights
        </a>{' '}before negotiating.
      </div>
    </div>
  );
}
