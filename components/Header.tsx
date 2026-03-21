'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';

const navLinks = [
  { href: '/',        label: 'Home',   icon: IconHome },
  { href: '/blog',    label: 'Blog',   icon: IconBlog },
  { href: '/digest',  label: 'Digest', icon: IconDigest },
  { href: '/githot',  label: 'Githot', icon: IconGithot },
  { href: '/learn',   label: 'Learn',  icon: IconLearn },
  { href: '/resume',  label: 'Resume', icon: IconResume },
  { href: '/about',   label: 'About',  icon: IconAbout },
];

export default function Header() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, loading, signInWithGithub, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ── Top bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0.75rem 1.5rem',
        background: 'transparent',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🌿</span>
            <span style={{
              fontFamily: "'Lora', serif", fontWeight: 600, fontSize: '1rem',
              color: 'var(--brown-dark)', letterSpacing: '-0.01em',
            }}>
              My Little Corner
            </span>
          </Link>

          {/* Desktop floating pill nav */}
          <nav className="desktop-nav" style={{
            background: 'rgba(255,253,249,0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(242,235,224,0.9)',
            borderRadius: '99px',
            padding: '0.3rem 0.4rem',
            boxShadow: '0 4px 20px rgba(44,31,20,0.07), 0 1px 4px rgba(44,31,20,0.05)',
            display: 'flex', gap: '0.1rem',
          }}>
            {navLinks.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '0.3em 0.9em', borderRadius: '99px',
                  fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none',
                  background: active ? 'var(--terracotta)' : 'transparent',
                  color: active ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth + theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <ThemeToggle />
            {!loading && (
              user ? (
                <>
                  <Link href="/dashboard" title="Dashboard" style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'var(--terracotta)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {user.user_metadata?.avatar_url
                      ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : user.email?.[0].toUpperCase()
                    }
                  </Link>
                  <button onClick={handleSignOut} className="auth-btn" style={{
                    background: 'none',
                    border: '1px solid var(--parchment)',
                    borderRadius: '99px', padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer',
                  }}>
                    Sign out
                  </button>
                </>
              ) : (
                <button onClick={signInWithGithub} style={{
                  background: 'rgba(255,253,249,0.82)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(242,235,224,0.9)',
                  borderRadius: '99px',
                  padding: '0.3rem 1rem',
                  fontSize: '0.83rem', fontWeight: 500,
                  color: 'var(--brown-dark)', cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(44,31,20,0.06)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <svg height="14" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'rgba(255,253,249,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(242,235,224,0.95)',
          borderRadius: '24px',
          padding: '0.55rem 0.5rem',
          boxShadow: '0 8px 32px rgba(44,31,20,0.12), 0 2px 8px rgba(44,31,20,0.06)',
          width: '100%',
        }}>
          {navLinks.map(link => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.2rem', textDecoration: 'none',
                padding: '0.35rem 0.7rem', borderRadius: '14px',
                background: active ? 'var(--terracotta)' : 'transparent',
                transition: 'background 0.18s',
                minWidth: '52px',
              }}>
                <Icon active={active} />
                <span style={{
                  fontSize: '0.65rem', fontWeight: active ? 600 : 500,
                  color: active ? 'white' : 'var(--text-muted)',
                  letterSpacing: '0.01em',
                }}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* ── SVG Icons ── */
function IconHome({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconBlog({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconDigest({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function IconResume({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconGithot({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}
function IconLearn({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function IconAbout({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
