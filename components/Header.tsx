'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/digest', label: 'AI Digest' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header style={{ borderBottom: '1px solid var(--parchment)', background: 'var(--warm-white)' }}
      className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem' }}>🌿</span>
          <span style={{
            fontFamily: "'Lora', serif",
            fontWeight: 600,
            fontSize: '1.1rem',
            color: 'var(--brown-dark)',
          }}>
            My Little Corner
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} style={{
                padding: '0.3em 0.85em',
                borderRadius: '99px',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                background: active ? 'var(--terracotta)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
