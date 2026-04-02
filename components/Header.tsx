'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useRef, useEffect } from 'react';

/* ── Posts sub-links (Blog / Digest / Githot) ── */
const contentLinks = [
  {
    href: '/blog',
    label: 'Blog',
    desc: 'Posts & articles',
    accent: 'var(--vermilion)',
    icon: IconBlog,
  },
  {
    href: '/digest',
    label: 'Digest',
    desc: 'AI research digest',
    accent: 'var(--gold)',
    icon: IconDigest,
  },
  {
    href: '/githot',
    label: 'Githot',
    desc: 'GitHub trending today',
    accent: 'var(--jade)',
    icon: IconGithot,
  },
];

/* ── Main nav (Posts dropdown replaces the three individual links) ── */
const navLinks = [
  { href: '/learn',          label: 'Learn',     icon: IconLearn,     mobile: true  },
  { href: '/interview-prep', label: 'Interview', icon: IconInterview, mobile: false },
  { href: '/resume',         label: 'Resume',    icon: IconResume,    mobile: false },
  { href: '/about',          label: 'About',     icon: IconAbout,     mobile: false },
];

const moreLinks = navLinks.filter(l => !l.mobile);

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, loading, signInWithGithub, signOut } = useAuth();

  const [moreOpen,          setMoreOpen]          = useState(false);
  const [contentOpen,       setPostsOpen]         = useState(false);
  const [contentMobileOpen, setPostsMobileOpen]   = useState(false);
  const [avatarOpen,        setAvatarOpen]        = useState(false);

  const contentBtnRef = useRef<HTMLDivElement>(null);
  const avatarBtnRef  = useRef<HTMLDivElement>(null);

  /* Close Posts dropdown on outside click */
  useEffect(() => {
    if (!contentOpen) return;
    function handleClick(e: MouseEvent) {
      if (contentBtnRef.current && !contentBtnRef.current.contains(e.target as Node)) {
        setPostsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contentOpen]);

  /* Close avatar popover on outside click */
  useEffect(() => {
    if (!avatarOpen) return;
    function handleClick(e: MouseEvent) {
      if (avatarBtnRef.current && !avatarBtnRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [avatarOpen]);

  /* Close everything on route change */
  useEffect(() => {
    setPostsOpen(false);
    setPostsMobileOpen(false);
    setMoreOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const isPostsActive = contentLinks.some(l => isActive(l.href));

  return (
    <>
      {/* ── Top bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0.75rem 0',
        background: 'transparent',
      }}>
        {/* maxWidth + padding matches page content wrapper so pill edges align with "I build things" */}
        <div style={{
          maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* ── Left: main nav pill — Home + Posts ── */}
          <nav className="desktop-nav" style={{
            background: 'rgba(253,245,228,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2.5px solid rgba(20,10,5,0.18)',
            borderRadius: '8px',
            padding: '0.3rem 0.4rem',
            boxShadow: '3px 3px 0 rgba(20,10,5,0.14)',
            display: 'flex', gap: '0.1rem', alignItems: 'center',
          }}>

            {/* Home */}
            <Link href="/" style={{
              padding: '0.3em 0.9em', borderRadius: '4px',
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              background: isActive('/') ? 'var(--vermilion)' : 'transparent',
              color: isActive('/') ? 'white' : 'var(--text-secondary)',
              boxShadow: isActive('/') ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
              transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              whiteSpace: 'nowrap',
            }}>Home</Link>

            {/* ── Posts dropdown ── */}
            <div ref={contentBtnRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setPostsOpen(o => !o)}
                style={{
                  padding: '0.3em 0.9em', borderRadius: '4px',
                  fontSize: '0.88rem', fontWeight: 600,
                  background: isPostsActive || contentOpen ? 'var(--vermilion)' : 'transparent',
                  color: isPostsActive || contentOpen ? 'white' : 'var(--text-secondary)',
                  boxShadow: isPostsActive || contentOpen ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.3em',
                  transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  whiteSpace: 'nowrap',
                }}
              >
                Posts
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: contentOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown panel */}
              {contentOpen && (
                <div
                  className="content-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '240px',
                    background: 'rgba(255,254,246,0.97)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '2.5px solid rgba(20,10,5,0.16)',
                    borderRadius: '10px',
                    boxShadow: '4px 4px 0 rgba(20,10,5,0.14), 0 12px 32px rgba(20,10,5,0.08)',
                    padding: '0.4rem',
                    zIndex: 60,
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative top accent bar — vermilion→gold→jade */}
                  <div style={{
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--vermilion) 0%, var(--gold) 50%, var(--jade) 100%)',
                    borderRadius: '2px 2px 0 0',
                    marginBottom: '0.4rem',
                  }} />

                  {contentLinks.map((link) => {
                    const active = isActive(link.href);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="content-dropdown-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          background: active ? `${link.accent}12` : 'transparent',
                          borderLeft: `3px solid ${active ? link.accent : 'transparent'}`,
                          transition: 'all 0.14s ease',
                          marginBottom: '0.1rem',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget;
                          el.style.background = `${link.accent}12`;
                          el.style.borderLeftColor = link.accent;
                          el.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget;
                          el.style.background = active ? `${link.accent}12` : 'transparent';
                          el.style.borderLeftColor = active ? link.accent : 'transparent';
                          el.style.transform = 'translateX(0)';
                        }}
                      >
                        {/* Icon in coloured circle */}
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
                          background: `${link.accent}15`,
                          border: `1.5px solid ${link.accent}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: link.accent,
                        }}>
                          <Icon active={active} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: '0.87rem', fontWeight: 700,
                            color: active ? link.accent : 'var(--brown-dark)',
                            lineHeight: 1.2,
                          }}>
                            {link.label}
                          </div>
                          <div style={{
                            fontSize: '0.72rem', color: 'var(--text-muted)',
                            lineHeight: 1.3, marginTop: '1px',
                          }}>
                            {link.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secondary links — all in the same pill */}
            {navLinks.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '0.3em 0.9em', borderRadius: '4px',
                  fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
                  background: active ? 'var(--vermilion)' : 'transparent',
                  color: active ? 'white' : 'var(--text-secondary)',
                  boxShadow: active ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
                  transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  whiteSpace: 'nowrap',
                }}>{link.label}</Link>
              );
            })}
          </nav>

          {/* ── Right: theme toggle (icon-only) + avatar ── */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>

              {/* Theme toggle — icon only, tooltip on hover */}
              <ThemeToggle />

            <div ref={avatarBtnRef} style={{ position: 'relative' }}>
              {user ? (
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  aria-label="Account menu"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'var(--terracotta)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 600,
                    overflow: 'hidden', flexShrink: 0,
                    border: avatarOpen ? '2px solid var(--vermilion)' : '2px solid transparent',
                    boxShadow: avatarOpen ? '0 0 0 2px rgba(192,40,28,0.3)' : '2px 2px 0 rgba(20,10,5,0.2)',
                    cursor: 'pointer', padding: 0,
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.email?.[0].toUpperCase()
                  }
                </button>
              ) : (
                <button onClick={signInWithGithub} style={{
                  background: 'rgba(255,253,249,0.82)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(242,235,224,0.9)', borderRadius: '99px',
                  padding: '0.3rem 1rem', fontSize: '0.83rem', fontWeight: 500,
                  color: 'var(--brown-dark)', cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(44,31,20,0.06)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <svg height="14" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Sign in
                </button>
              )}

              {/* Avatar popover — theme toggle + secondary links + sign out */}
              {avatarOpen && user && (
                <div
                  className="content-dropdown"
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: '200px',
                    background: 'rgba(255,254,246,0.97)',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    border: '2.5px solid rgba(20,10,5,0.16)', borderRadius: '10px',
                    boxShadow: '4px 4px 0 rgba(20,10,5,0.14), 0 12px 32px rgba(20,10,5,0.08)',
                    padding: '0.5rem',
                    zIndex: 60,
                  }}
                >
                  {/* User email */}
                  <div style={{
                    padding: '0.3rem 0.6rem 0.5rem',
                    fontSize: '0.72rem', color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--parchment)', marginBottom: '0.3rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{user.email}</div>

                  {/* Sign out */}
                  <button onClick={() => { setAvatarOpen(false); handleSignOut(); }} style={{
                    width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)',
                    textAlign: 'left', transition: 'background 0.12s ease',
                  }}>Sign out</button>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">

        {/* More sheet */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{
              position: 'fixed', inset: 0, zIndex: 90,
              background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)',
            }} />
            <div style={{
              position: 'fixed', bottom: '6rem', left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2.4rem)', maxWidth: '420px',
              background: 'var(--warm-white)',
              border: '1px solid var(--parchment)',
              borderRadius: '20px', padding: '1rem', zIndex: 95,
              boxShadow: '0 -4px 32px rgba(44,31,20,0.12)',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              {moreLinks.map(link => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.8rem 1rem', borderRadius: '12px',
                    textDecoration: 'none',
                    background: active ? 'var(--terracotta)' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    <Icon active={active} />
                    <span style={{
                      fontSize: '0.95rem', fontWeight: 500,
                      color: active ? 'white' : 'var(--text-primary)',
                    }}>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Posts sub-sheet — slides up above the bottom bar */}
        {contentMobileOpen && (
          <>
            <div onClick={() => setPostsMobileOpen(false)} style={{
              position: 'fixed', inset: 0, zIndex: 90,
              background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)',
            }} />
            <div
              className="content-sheet"
              style={{
                position: 'fixed', bottom: '6rem', left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 2.4rem)', maxWidth: '420px',
                background: 'var(--warm-white)',
                border: '2.5px solid rgba(20,10,5,0.16)',
                borderRadius: '16px', padding: '0.75rem', zIndex: 95,
                boxShadow: '4px 4px 0 rgba(20,10,5,0.12), 0 -4px 32px rgba(44,31,20,0.1)',
              }}
            >
              {/* Gradient accent top bar */}
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, var(--vermilion) 0%, var(--gold) 50%, var(--jade) 100%)',
                borderRadius: '2px', marginBottom: '0.6rem',
              }} />
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                padding: '0 0.5rem', marginBottom: '0.4rem',
              }}>Posts</p>

              {contentLinks.map(link => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setPostsMobileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.9rem',
                      padding: '0.75rem 0.75rem', borderRadius: '10px',
                      textDecoration: 'none', marginBottom: '0.2rem',
                      background: active ? `${link.accent}15` : 'transparent',
                      borderLeft: `3px solid ${active ? link.accent : 'transparent'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      background: `${link.accent}15`,
                      border: `1.5px solid ${link.accent}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: link.accent,
                    }}>
                      <Icon active={active} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.95rem', fontWeight: 600,
                        color: active ? link.accent : 'var(--text-primary)',
                      }}>{link.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {link.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Main tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'rgba(253,245,228,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '2.5px solid rgba(20,10,5,0.2)',
          borderRadius: '8px', padding: '0.55rem 0.5rem',
          boxShadow: '3px 3px 0 rgba(20,10,5,0.15)', width: '100%',
        }}>

          {/* Home */}
          <Link href="/" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.2rem', textDecoration: 'none',
            padding: '0.35rem 0.6rem', borderRadius: '4px',
            background: isActive('/') ? 'var(--vermilion)' : 'transparent',
            boxShadow: isActive('/') ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '48px',
          }}>
            <IconHome active={isActive('/')} />
            <span style={{ fontSize: '0.62rem', fontWeight: isActive('/') ? 600 : 500, color: isActive('/') ? 'white' : 'var(--text-muted)' }}>
              Home
            </span>
          </Link>

          {/* Posts tab — opens sub-sheet */}
          <button
            onClick={() => { setPostsMobileOpen(o => !o); setMoreOpen(false); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.2rem', padding: '0.35rem 0.6rem', borderRadius: '4px',
              background: isPostsActive || contentMobileOpen ? 'var(--vermilion)' : 'transparent',
              boxShadow: isPostsActive || contentMobileOpen ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '48px',
            }}
          >
            <IconPosts active={isPostsActive || contentMobileOpen} />
            <span style={{ fontSize: '0.62rem', fontWeight: isPostsActive || contentMobileOpen ? 600 : 500, color: isPostsActive || contentMobileOpen ? 'white' : 'var(--text-muted)' }}>
              Posts
            </span>
          </button>

          {/* Learn */}
          <Link href="/learn" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.2rem', textDecoration: 'none',
            padding: '0.35rem 0.6rem', borderRadius: '4px',
            background: isActive('/learn') ? 'var(--vermilion)' : 'transparent',
            boxShadow: isActive('/learn') ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '48px',
          }}>
            <IconLearn active={isActive('/learn')} />
            <span style={{ fontSize: '0.62rem', fontWeight: isActive('/learn') ? 600 : 500, color: isActive('/learn') ? 'white' : 'var(--text-muted)' }}>
              Learn
            </span>
          </Link>

          {/* More */}
          <button
            onClick={() => { setMoreOpen(o => !o); setPostsMobileOpen(false); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.2rem', padding: '0.35rem 0.6rem', borderRadius: '4px',
              background: moreOpen ? 'var(--vermilion)' : 'transparent',
              boxShadow: moreOpen ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '48px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="5"  cy="12" r="1.5" fill={moreOpen ? 'white' : 'var(--text-muted)'} />
              <circle cx="12" cy="12" r="1.5" fill={moreOpen ? 'white' : 'var(--text-muted)'} />
              <circle cx="19" cy="12" r="1.5" fill={moreOpen ? 'white' : 'var(--text-muted)'} />
            </svg>
            <span style={{ fontSize: '0.62rem', fontWeight: 500, color: moreOpen ? 'white' : 'var(--text-muted)' }}>
              More
            </span>
          </button>

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
  const c = active ? 'currentColor' : 'var(--text-muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconDigest({ active }: { active: boolean }) {
  const c = active ? 'currentColor' : 'var(--text-muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function IconGithot({ active }: { active: boolean }) {
  const c = active ? 'currentColor' : 'var(--text-muted)';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
function IconInterview({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="13" y2="14" />
    </svg>
  );
}
/* Posts tab icon — layers/stack */
function IconPosts({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <rect x="2" y="10" width="20" height="5" rx="1" />
      <rect x="2" y="17" width="20" height="4" rx="1" />
    </svg>
  );
}
