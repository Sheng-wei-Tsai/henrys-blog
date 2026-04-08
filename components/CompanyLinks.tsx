'use client';
import { COMPANY_CAREERS_URLS } from '@/lib/interview-roles';

export default function CompanyLinks({ companies }: { companies: readonly string[] }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {companies.slice(0, 3).map(c => {
        const url = COMPANY_CAREERS_URLS[c];
        const chipStyle: React.CSSProperties = {
          fontSize: '0.68rem',
          background: 'var(--parchment)',
          padding: '0.2em 0.5em', borderRadius: '4px',
          textDecoration: 'none',
        };
        return url ? (
          <a key={c} href={url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ ...chipStyle, color: 'var(--terracotta)' }}>
            {c} ↗
          </a>
        ) : (
          <span key={c} style={{ ...chipStyle, color: 'var(--text-muted)' }}>{c}</span>
        );
      })}
      {companies.length > 3 && (
        <span style={{
          fontSize: '0.68rem', color: 'var(--text-muted)',
          background: 'var(--parchment)',
          padding: '0.2em 0.5em', borderRadius: '4px',
        }}>
          +{companies.length - 3} more
        </span>
      )}
    </div>
  );
}
