'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/posts',            label: 'All',       emoji: '📚' },
  { href: '/posts/blog',       label: 'Blog',      emoji: '✍️'  },
  { href: '/posts/research',   label: 'Research',  emoji: '🤖' },
  { href: '/posts/githot',     label: 'Githot',    emoji: '🔥' },
  { href: '/posts/ai-news',    label: 'AI News',   emoji: '📡' },
  { href: '/posts/visa-news',  label: 'Visa News', emoji: '📰' },
];

export default function PostsTabs({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
      {TABS.map(t => {
        const active = pathname === t.href;
        const count  = counts[t.href] ?? 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '99px', flexShrink: 0,
              background: active ? 'var(--terracotta)' : 'var(--warm-white)',
              color: active ? 'white' : 'var(--text-secondary)',
              border: active ? 'none' : '1px solid var(--parchment)',
              fontWeight: 600, fontSize: '0.88rem',
              fontFamily: 'inherit',
              boxShadow: active ? '2px 2px 0 rgba(20,10,5,0.25)' : 'none',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.05em 0.45em',
              borderRadius: '99px',
              background: active ? 'rgba(255,255,255,0.25)' : 'var(--parchment)',
              color: active ? 'white' : 'var(--text-muted)',
            }}>{count}</span>
          </Link>
        );
      })}
    </div>
  );
}
