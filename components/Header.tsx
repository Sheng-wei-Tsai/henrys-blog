'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/digest', label: 'AI Digest' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/cover-letter', label: 'Cover Letter' },
  { href: '/resume', label: 'Resume' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, loading, signInWithGithub, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header style={{ borderBottom: '1px solid var(--parchment)', background: 'var(--warm-white)' }}
      className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem' }}>🌿</span>
          <span style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: '1.1rem', color: 'var(--brown-dark)' }}>
            My Little Corner
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {navLinks.map(link => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '0.3em 0.85em', borderRadius: '99px',
                  fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
                  background: active ? 'var(--terracotta)' : 'transparent',
                  color: active ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2" style={{ marginLeft: '0.5rem' }}>
                <Link href="/dashboard" title="Dashboard" style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--terracotta)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  overflow: 'hidden',
                }}>
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.email?.[0].toUpperCase()
                  }
                </Link>
                <button onClick={handleSignOut} style={{
                  background: 'none', border: '1px solid var(--parchment)',
                  borderRadius: '99px', padding: '0.25rem 0.75rem',
                  fontSize: '0.82rem', color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}>
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={signInWithGithub} style={{
                marginLeft: '0.5rem',
                background: '#24292e', color: 'white',
                border: 'none', borderRadius: '99px',
                padding: '0.35rem 1rem', fontSize: '0.85rem',
                fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <svg height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Sign in
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
