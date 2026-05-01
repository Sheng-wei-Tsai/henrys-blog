import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Role Posted — TechPath AU',
  description: 'Your job listing has been received and will be live within 24 hours.',
};

export default function PostARoleSuccessPage() {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto',
      padding: '6rem 1.5rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem', lineHeight: 1 }}>🎉</div>

      <h1 style={{
        fontFamily: "'Lora', serif", fontSize: 'clamp(1.5rem, 3vw, 1.9rem)',
        fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '1rem', lineHeight: 1.25,
      }}>
        Your listing is on its way
      </h1>

      <p style={{
        color: 'var(--text-secondary)', lineHeight: 1.75,
        marginBottom: '1.5rem', fontSize: '0.95rem',
      }}>
        Payment received. Your role will be featured at the top of the TechPath AU
        Jobs page within 24 hours.
      </p>

      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'var(--warm-white)',
        border: '1px solid var(--parchment)',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'left',
      }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: '0.6rem' }}>
          What happens next
        </p>
        {[
          'We review your listing and publish it within 24 hours',
          'It appears pinned at the top of /jobs with a "Hiring" badge',
          'Candidates click your apply link and contact you directly',
          'Your listing stays live for 30 days — you\'ll hear from us before it expires',
        ].map(step => (
          <p key={step} style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)',
            lineHeight: 1.65, margin: '0 0 0.4rem',
            display: 'flex', gap: '0.5rem',
          }}>
            <span style={{ color: 'var(--jade)', flexShrink: 0 }}>✓</span>{step}
          </p>
        ))}
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Questions?{' '}
        <a
          href="mailto:hello@henrysdigitallife.com"
          style={{ color: 'var(--vermilion)', textDecoration: 'none' }}
        >
          hello@henrysdigitallife.com
        </a>
      </p>

      <Link
        href="/jobs"
        style={{
          display: 'inline-block',
          padding: '0.8rem 1.75rem',
          background: 'var(--vermilion)',
          color: 'var(--warm-white)',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '1rem',
          textDecoration: 'none',
          border: 'var(--panel-border)',
          boxShadow: 'var(--panel-shadow)',
        }}
      >
        View the Jobs page →
      </Link>
    </div>
  );
}
