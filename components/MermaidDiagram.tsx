'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  chart: string;
  /** Optional override for container styling (e.g. minHeight while loading). */
  className?: string;
}

export default function MermaidDiagram({ chart, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    setError(null);

    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark';

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        securityLevel: 'strict',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
      });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid
        .render(id, chart)
        .then(({ svg }) => {
          if (!cancelled && ref.current) ref.current.innerHTML = svg;
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            if (ref.current) ref.current.innerHTML = '';
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div className={className}>
      <div
        ref={ref}
        style={{
          background: 'var(--warm-white)',
          border: '1px solid var(--parchment)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '1.5rem 0',
          overflowX: 'auto',
          textAlign: 'center',
          minHeight: '120px',
        }}
      />
      {error && (
        <div
          role="alert"
          style={{
            margin: '0.5rem 0 1.5rem',
            padding: '0.75rem 1rem',
            border: '1px solid var(--parchment)',
            borderRadius: '8px',
            background: 'var(--warm-white)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          Could not render this diagram. The Mermaid syntax may be invalid.
          <details style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <summary style={{ cursor: 'pointer' }}>Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.4rem' }}>{error}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
