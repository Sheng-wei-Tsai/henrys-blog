'use client';
import { useEffect, useState, useRef } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved ?? 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';

    if (wrapRef.current) {
      const degrees = next === 'dark' ? 180 : -180;
      wrapRef.current.animate(
        [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: `rotate(${degrees * 0.5}deg) scale(0.8)` },
          { transform: `rotate(${degrees}deg) scale(1)` },
        ],
        { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'none' }
      );
    }

    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const isDark = theme === 'dark';
  const yangColor = isDark ? '#f0e6d0' : '#fdfef6';
  const yinColor  = isDark ? '#e84040' : '#140a05';
  const ringColor = isDark ? 'rgba(240,230,208,0.5)' : 'rgba(20,10,5,0.7)';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? '陽 — Brisbane day mode' : '陰 — Night market mode'}
      style={{
        width: '40px', height: '40px',
        borderRadius: '50%',
        border: isDark
          ? '2px solid rgba(240,230,208,0.25)'
          : '2px solid rgba(20,10,5,0.2)',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        flexShrink: 0,
        padding: 0,
        boxShadow: isDark
          ? '0 0 12px rgba(240,230,208,0.1), 2px 2px 0 rgba(232,64,64,0.3)'
          : '2px 2px 0 rgba(20,10,5,0.2)',
      }}
    >
      <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 40 40" width="28" height="28" style={{ display: 'block' }}>
          <circle cx="20" cy="20" r="18" fill={yinColor} />
          <path d="M20,2 A18,18 0 0,1 20,38 A9,9 0 0,1 20,20 A9,9 0 0,0 20,2 Z" fill={yangColor} />
          <circle cx="20" cy="11" r="4.5" fill={yinColor} />
          <circle cx="20" cy="29" r="4.5" fill={yangColor} />
          <circle cx="20" cy="20" r="18" fill="none" stroke={ringColor} strokeWidth="1.5" />
        </svg>
      </div>
    </button>
  );
}
