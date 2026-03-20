'use client';
import { useEffect, useRef } from 'react';

export default function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      });
    });
  }, [chart]);

  return (
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
      }}
    />
  );
}
