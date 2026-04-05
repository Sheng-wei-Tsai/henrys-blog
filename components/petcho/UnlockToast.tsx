'use client';

import { useEffect, useState } from 'react';

interface Props {
  message: string;
  onDone: () => void;
}

export default function UnlockToast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Animate out
    const t2 = setTimeout(() => setVisible(false), 3000);
    const t3 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '60px'})`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s',
      background: 'var(--warm-white)',
      border: '2px solid var(--ink)',
      borderRadius: '8px',
      boxShadow: '4px 4px 0 var(--ink)',
      padding: '0.75rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      zIndex: 10000,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '1.4rem' }}>🏆</span>
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '0.88rem',
        color: 'var(--brown-dark)',
      }}>{message}</span>
    </div>
  );
}
