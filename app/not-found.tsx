import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      maxWidth: '480px', margin: '0 auto',
      padding: '6rem 1.5rem 4rem', textAlign: 'center',
    }}>
      <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</p>
      <h1 style={{
        fontFamily: "'Lora', serif", fontSize: '2rem', fontWeight: 700,
        color: 'var(--brown-dark)', marginBottom: '0.75rem',
      }}>
        Page not found
      </h1>
      <p style={{
        fontSize: '0.95rem', color: 'var(--text-secondary)',
        lineHeight: 1.7, marginBottom: '2rem',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{
          background: 'var(--terracotta)', color: 'white', textDecoration: 'none',
          padding: '0.65rem 1.5rem', borderRadius: '10px',
          fontSize: '0.92rem', fontWeight: 600,
        }}>
          Go home
        </Link>
        <Link href="/jobs" style={{
          border: '1px solid var(--text-muted)', color: 'var(--text-primary)',
          textDecoration: 'none', padding: '0.65rem 1.5rem', borderRadius: '10px',
          fontSize: '0.92rem', fontWeight: 500,
        }}>
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
