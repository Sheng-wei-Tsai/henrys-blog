'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { ReadinessScoreMini } from '@/components/ReadinessScore';
import { useState, useRef, useEffect } from 'react';

/* ── Zone data ─────────────────────────────────────────────── */
const contentLinks = [
  { href: '/posts',             label: 'All Posts', desc: 'Everything in one feed',         emoji: '📚' },
  { href: '/posts/blog',        label: 'Blog',      desc: 'Posts & articles',               emoji: '✍️' },
  { href: '/posts/research',    label: 'Research',  desc: 'AI research digest',             emoji: '🤖' },
  { href: '/posts/githot',      label: 'Githot',    desc: 'GitHub trending today',          emoji: '🔥' },
  { href: '/posts/ai-news',     label: 'AI News',   desc: 'Anthropic · OpenAI · Google',    emoji: '📡' },
  { href: '/posts/visa-news',   label: 'Visa News', desc: 'Daily AU immigration updates',   emoji: '📰' },
];

const LEARN_ITEMS = [
  { href: '/learn',             label: 'Learning Paths',    desc: '5 AU IT career paths + spaced rep',    emoji: '📚' },
  { href: '/learn/youtube',     label: 'YouTube Learning',  desc: 'Gemini study guide from any video',    emoji: '🎥' },
  { href: '/learn/claude-code', label: 'Claude Code Guide', desc: '30 interactive lessons, beginner→pro', emoji: '🤖' },
  { href: '/learn/github',      label: 'GitHub Skills',     desc: '37 official courses — Git to Copilot', emoji: '🐙' },
];

const AU_INSIGHTS_ITEMS = [
  { href: '/au-insights',                  label: 'AU Companies',   desc: 'Company tiers, culture & interview Qs', emoji: '🏆' },
  { href: '/au-insights?tab=salary',       label: 'Salary Checker', desc: 'Paste your offer → AI verdict',         emoji: '💰' },
  { href: '/au-insights?tab=skillmap',     label: 'Skill Map',      desc: 'Your skills → matching AU roles',       emoji: '🗺️' },
  { href: '/au-insights?tab=sponsorship',  label: 'Visa Sponsors',  desc: 'Top 20 by 482 sponsorship volume',      emoji: '🛂' },
  { href: '/au-insights?tab=gradprograms', label: 'Grad Programs',  desc: 'Live status, deadlines, apply links',   emoji: '🎓' },
  { href: '/au-insights?tab=visa',         label: 'Visa Guide',     desc: '482/SID — 6 steps, costs & timeline',  emoji: '🛫' },
  { href: '/au-insights?tab=visa-news',   label: 'Visa News',      desc: 'Daily immigration & student visa updates', emoji: '📰' },
];

/* Two-column grouping for the mega-menu */
const AU_COL_LEFT = [
  { href: '/au-insights',                   label: 'Company Tiers',  tag: 'Rankings',    emoji: '🏆' },
  { href: '/au-insights?tab=ecosystem',     label: 'IT Ecosystem',   tag: 'Overview',    emoji: '🗂️' },
  { href: '/au-insights?tab=market',        label: 'Job Market',     tag: 'Data',        emoji: '📊' },
  { href: '/au-insights?tab=gradprograms',  label: 'Grad Programs',  tag: 'Listings',    emoji: '🎓' },
  { href: '/au-insights?tab=compare',       label: 'Compare',        tag: 'Side-by-side', emoji: '⚖️' },
];
const AU_COL_RIGHT = [
  { href: '/au-insights?tab=guide',        label: 'Career Guide',   tag: 'Strategy',    emoji: '🚀' },
  { href: '/au-insights?tab=salary',       label: 'Salary Checker', tag: 'Tools',       emoji: '💰' },
  { href: '/au-insights?tab=skillmap',     label: 'Skill Map',      tag: 'Interactive', emoji: '🗺️' },
  { href: '/au-insights?tab=sponsorship',  label: 'Visa Sponsors',  tag: 'Visa',        emoji: '🛂' },
  { href: '/au-insights?tab=visa',         label: 'Visa Guide',     tag: '482 / SID',   emoji: '🛫' },
];

const INTERVIEW_ITEMS = [
  { href: '/resume',         label: 'Resume Analyser', desc: 'AI feedback for AU IT roles',       emoji: '📄' },
  { href: '/cover-letter',   label: 'Cover Letter',    desc: 'GPT-4.1, AU English structure',     emoji: '✉️' },
  { href: '/interview-prep', label: 'Interview Prep',  desc: 'Alex mentor, company-specific Qs', emoji: '🎯' },
];

type Drawer = 'learn' | 'au-insights' | 'interview' | 'me' | null;

/* ── Posts dropdown sub-components ── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function DropPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
      width: '240px', background: 'var(--warm-white)',
      border: '2px solid var(--parchment)', borderRadius: '12px',
      boxShadow: 'var(--panel-shadow), 0 16px 40px var(--shadow-color)',
      padding: '0.5rem', zIndex: 60, overflow: 'hidden',
    }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--vermilion) 0%, var(--gold) 50%, var(--jade) 100%)', borderRadius: '2px 2px 0 0', marginBottom: '0.4rem' }} />
      {children}
    </div>
  );
}
function DropItem({ href, emoji, label, desc, onClick }: { href: string; emoji: string; label: string; desc: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0.6rem', borderRadius: '7px', textDecoration: 'none', background: hovered ? 'var(--parchment)' : 'transparent', transition: 'background 0.12s ease' }}>
      <span style={{ fontSize: '1.05rem', flexShrink: 0, marginTop: '1px' }}>{emoji}</span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '1px' }}>{desc}</div>
      </div>
    </Link>
  );
}

/* Section label inside dropdown groups */
function GroupLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.1rem 0.55rem 0.25rem', opacity: 0.7 }}>{label}</div>
  );
}
function GroupDivider() {
  return <div style={{ height: '1px', background: 'var(--parchment)', margin: '0.35rem 0.4rem' }} />;
}

/* Compact item for the AU Insights mega-menu: emoji + label + tag badge only */
function MegaItem({ href, emoji, label, tag, onClick }: { href: string; emoji: string; label: string; tag: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.38rem 0.55rem', borderRadius: '7px', textDecoration: 'none',
        background: hovered ? 'var(--parchment)' : 'transparent',
        transition: 'background 0.12s ease',
      }}>
      <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{emoji}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brown-dark)', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  );
}

/* ── Main component ── */
export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, loading, signOut } = useAuth();

  const [openMenu,     setOpenMenu]    = useState<'posts' | 'learn' | 'au-insights' | null>(null);
  const [avatarOpen,   setAvatarOpen]  = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<Drawer>(null);

  const navRef    = useRef<HTMLElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* Close nav dropdowns on outside click */
  useEffect(() => {
    if (!openMenu) return;
    function h(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openMenu]);

  /* Close avatar on outside click */
  useEffect(() => {
    if (!avatarOpen) return;
    function h(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [avatarOpen]);

  /* Close everything on route change */
  useEffect(() => {
    setOpenMenu(null);
    setAvatarOpen(false);
    setMobileDrawer(null);
  }, [pathname]);

  const handleSignOut = async () => { await signOut(); router.push('/'); };

  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return path === '/' ? pathname === '/' : pathname.startsWith(path);
  };
  const isZoneActive = (items: { href: string }[]) => items.some(i => isActive(i.href));
  const isPostsActive = contentLinks.some(l => isActive(l.href));
  const postsOpen      = openMenu === 'posts';
  const learnOpen      = openMenu === 'learn';
  const auInsightsOpen = openMenu === 'au-insights';

  /* Desktop nav link style */
  const navLink = (active: boolean): React.CSSProperties => ({
    padding: '0.3em 0.9em', borderRadius: '4px',
    fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.2, textDecoration: 'none',
    background: active ? 'var(--vermilion)' : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
    boxShadow: active ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
    transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* ── Top bar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0.75rem 0', background: 'transparent' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          <nav ref={navRef} className="desktop-nav" style={{
            background: 'rgba(253,245,228,0.88)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '2.5px solid rgba(20,10,5,0.18)', borderRadius: '8px',
            padding: '0.3rem 0.4rem',
            boxShadow: '3px 3px 0 rgba(20,10,5,0.14)',
            display: 'flex', gap: '0.35rem', alignItems: 'center',
          }}>
            <Link href="/" style={navLink(isActive('/'))}>Home</Link>

            {/* Posts — dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenMenu(m => m === 'posts' ? null : 'posts')}
                style={{ ...navLink(isPostsActive), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3em' }}
              >
                Posts <Chevron open={postsOpen} />
              </button>
              {postsOpen && (
                <DropPanel>
                  {contentLinks.map(link => (
                    <DropItem key={link.href} {...link} onClick={() => setOpenMenu(null)} />
                  ))}
                </DropPanel>
              )}
            </div>

            {/* Learn — dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenMenu(m => m === 'learn' ? null : 'learn')}
                style={{ ...navLink(isZoneActive(LEARN_ITEMS)), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3em' }}
              >
                Learn <Chevron open={learnOpen} />
              </button>
              {learnOpen && (
                <DropPanel>
                  <DropItem href="/learn"              emoji="🗺" label="Career Paths"      desc="5 AU IT roadmaps with spaced repetition" onClick={() => setOpenMenu(null)} />
                  <DropItem href="/learn/youtube"      emoji="🎥" label="YouTube Learning"  desc="Gemini builds your study guide + quiz"   onClick={() => setOpenMenu(null)} />
                  <DropItem href="/learn/claude-code"  emoji="🤖" label="Claude Code Guide" desc="30 interactive lessons, beginner→pro"    onClick={() => setOpenMenu(null)} />
                  <DropItem href="/learn/github"       emoji="🐙" label="GitHub Skills"     desc="37 official courses — Git to Copilot"    onClick={() => setOpenMenu(null)} />
                </DropPanel>
              )}
            </div>
            {/* AU Insights — mega-menu dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenMenu(m => m === 'au-insights' ? null : 'au-insights')}
                style={{ ...navLink(isZoneActive(AU_INSIGHTS_ITEMS)), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3em' }}
              >
                AU Insights <Chevron open={auInsightsOpen} />
              </button>
              {auInsightsOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: '270px', background: 'var(--warm-white)',
                  border: '2px solid var(--parchment)', borderRadius: '12px',
                  boxShadow: 'var(--panel-shadow), 0 16px 40px var(--shadow-color)',
                  padding: '0.5rem', zIndex: 60, overflow: 'hidden',
                }}>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--vermilion) 0%, var(--gold) 50%, var(--jade) 100%)', borderRadius: '2px 2px 0 0', marginBottom: '0.4rem' }} />

                  {/* Group 1 — AU IT Trends */}
                  <GroupLabel label="AU IT Trends" />
                  <MegaItem href="/au-insights?tab=ecosystem"    emoji="🗂️" label="IT Ecosystem"   tag="Overview"  onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=market"       emoji="📊" label="Job Market"     tag="Data"      onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=gradprograms" emoji="🎓" label="Grad Programs"  tag="Listings"  onClick={() => setOpenMenu(null)} />

                  <GroupDivider />

                  {/* Group 2 — Companies */}
                  <GroupLabel label="Companies" />
                  <MegaItem href="/au-insights"              emoji="🏆" label="Company Tiers" tag="Rankings"    onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=compare"  emoji="⚖️" label="Compare"       tag="Side-by-side" onClick={() => setOpenMenu(null)} />

                  <GroupDivider />

                  {/* Group 3 — Visa & Career Tools */}
                  <GroupLabel label="Visa & Career" />
                  <MegaItem href="/au-insights?tab=sponsorship" emoji="🛂" label="Visa Sponsors"  tag="Visa"        onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=visa"        emoji="🛫" label="Visa Guide"     tag="482 / SID"   onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=visa-news"   emoji="📰" label="Visa News"      tag="Live"        onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=guide"       emoji="🚀" label="Career Guide"   tag="Strategy"    onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=salary"      emoji="💰" label="Salary Checker" tag="Tools"       onClick={() => setOpenMenu(null)} />
                  <MegaItem href="/au-insights?tab=skillmap"    emoji="🗺️" label="Skill Map"      tag="Interactive" onClick={() => setOpenMenu(null)} />
                </div>
              )}
            </div>
            <Link href="/jobs"           style={navLink(isActive('/jobs'))}>Jobs</Link>
            <Link href="/interview-prep" style={navLink(isZoneActive(INTERVIEW_ITEMS))}>Interview</Link>
          </nav>

          <ThemeToggle />
        </div>

        {/* Avatar — absolute far right */}
        {!loading && (
          <div ref={avatarRef} style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)' }}>
            {user ? (
              <ReadinessScoreMini>
                <button onClick={() => setAvatarOpen(o => !o)} aria-label="Account menu" style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'var(--terracotta)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600,
                  overflow: 'hidden', flexShrink: 0, border: 'none',
                  boxShadow: avatarOpen ? '0 0 0 2px rgba(192,40,28,0.5)' : 'none',
                  cursor: 'pointer', padding: 0, transition: 'box-shadow 0.15s ease',
                }}>
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.email?.[0].toUpperCase()}
                </button>
              </ReadinessScoreMini>
            ) : (
              <Link href="/login" style={{
                background: 'var(--terracotta)', border: 'none', borderRadius: '99px',
                padding: '0.35rem 1.1rem', fontSize: '0.83rem', fontWeight: 600,
                color: 'white', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(180,60,40,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>Sign in</Link>
            )}

            {avatarOpen && user && (
              <div className="content-dropdown" style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: '200px', background: 'var(--warm-white)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '2px solid var(--parchment)', borderRadius: '10px',
                boxShadow: 'var(--panel-shadow), 0 12px 32px var(--shadow-color)',
                padding: '0.5rem', zIndex: 60,
              }}>
                <div style={{ padding: '0.3rem 0.6rem 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--parchment)', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
                {[
                  { href: '/dashboard',              label: 'Dashboard' },
                  { href: '/dashboard/visa-tracker', label: 'Visa Tracker' },
                  { href: '/pricing',                label: 'Upgrade to Pro' },
                  { href: '/about',                  label: 'About' },
                ].map(({ href, label }) => (
                  <AvatarLink key={href} href={href} label={label} onClick={() => setAvatarOpen(false)} />
                ))}
                <div style={{ height: '1px', background: 'var(--parchment)', margin: '0.2rem 0.4rem' }} />
                <button onClick={() => { setAvatarOpen(false); handleSignOut(); }} style={{
                  width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)',
                  textAlign: 'left', transition: 'background 0.12s ease', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--parchment)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >Sign out</button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">

        {/* Drawer backdrop */}
        {mobileDrawer && (
          <div onClick={() => setMobileDrawer(null)} style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)',
          }} />
        )}

        {/* Learn drawer */}
        {mobileDrawer === 'learn' && (
          <MobileDrawer title="Learn" onClose={() => setMobileDrawer(null)}>
            {LEARN_ITEMS.map(item => (
              <MobileDrawerItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileDrawer(null)} />
            ))}
          </MobileDrawer>
        )}

        {/* AU Insights drawer */}
        {mobileDrawer === 'au-insights' && (
          <MobileDrawer title="AU Insights" onClose={() => setMobileDrawer(null)}>
            {AU_INSIGHTS_ITEMS.map(item => (
              <MobileDrawerItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileDrawer(null)} />
            ))}
          </MobileDrawer>
        )}

        {/* Interview drawer */}
        {mobileDrawer === 'interview' && (
          <MobileDrawer title="Interview" onClose={() => setMobileDrawer(null)}>
            {INTERVIEW_ITEMS.map(item => (
              <MobileDrawerItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileDrawer(null)} />
            ))}
            <MobileDrawerItem href="/jobs" emoji="💼" label="Job Search" desc="Live AU jobs, working rights filter" active={isActive('/jobs')} onClick={() => setMobileDrawer(null)} />
          </MobileDrawer>
        )}

        {/* Me drawer */}
        {mobileDrawer === 'me' && (
          <div style={{
            position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 2.4rem)', maxWidth: '420px',
            background: 'var(--warm-white)', border: '2px solid var(--parchment)',
            borderRadius: '20px', padding: '0.75rem', zIndex: 95,
            boxShadow: 'var(--panel-shadow), 0 -4px 32px var(--shadow-color)',
          }}>
            {user ? (
              <>
                <div style={{ padding: '0.3rem 0.75rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--parchment)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
                {[
                  { href: '/dashboard',              label: 'Dashboard',      emoji: '📋' },
                  { href: '/dashboard/visa-tracker', label: 'Visa Tracker',   emoji: '🛂' },
                  { href: '/pricing',                label: 'Upgrade to Pro', emoji: '⭐' },
                  { href: '/about',                  label: 'About',          emoji: 'ℹ️' },
                ].map(({ href, label, emoji }) => (
                  <MobileDrawerItem key={href} href={href} emoji={emoji} label={label} desc="" active={isActive(href)} onClick={() => setMobileDrawer(null)} />
                ))}
                <div style={{ height: '1px', background: 'var(--parchment)', margin: '0.3rem 0.5rem' }} />
                <button onClick={() => { setMobileDrawer(null); handleSignOut(); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.75rem', borderRadius: '10px',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>👋</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sign out</span>
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileDrawer(null)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '12px',
                textDecoration: 'none', background: 'var(--vermilion)',
              }}>
                <span style={{ fontSize: '1.1rem' }}>👤</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>Sign in</span>
              </Link>
            )}
          </div>
        )}

        {/* Main tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'var(--warm-white)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '2.5px solid var(--parchment)', borderRadius: '8px',
          padding: '0.55rem 0.25rem', boxShadow: 'var(--panel-shadow)', width: '100%',
        }}>
          <MobileTab href="/" active={isActive('/')} label="Home" icon={<IconHome active={isActive('/')} />} />

          <MobileDrawerTab
            label="Learn"
            active={isZoneActive(LEARN_ITEMS)}
            open={mobileDrawer === 'learn'}
            onClick={() => setMobileDrawer(d => d === 'learn' ? null : 'learn')}
            icon={<IconLearn active={isZoneActive(LEARN_ITEMS) || mobileDrawer === 'learn'} />}
          />

          <MobileDrawerTab
            label="AU"
            active={isZoneActive(AU_INSIGHTS_ITEMS)}
            open={mobileDrawer === 'au-insights'}
            onClick={() => setMobileDrawer(d => d === 'au-insights' ? null : 'au-insights')}
            icon={<IconSearch active={isZoneActive(AU_INSIGHTS_ITEMS) || mobileDrawer === 'au-insights'} />}
          />

          <MobileDrawerTab
            label="Interview"
            active={isZoneActive(INTERVIEW_ITEMS) || isActive('/jobs')}
            open={mobileDrawer === 'interview'}
            onClick={() => setMobileDrawer(d => d === 'interview' ? null : 'interview')}
            icon={<IconBriefcase active={isZoneActive(INTERVIEW_ITEMS) || isActive('/jobs') || mobileDrawer === 'interview'} />}
          />

          {/* Me */}
          {!loading && (
            user ? (
              <button
                onClick={() => setMobileDrawer(d => d === 'me' ? null : 'me')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                  padding: '0.35rem 0.5rem', borderRadius: '4px',
                  background: mobileDrawer === 'me' ? 'var(--vermilion)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s', minWidth: '44px',
                }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden',
                  background: mobileDrawer === 'me' ? 'white' : 'var(--vermilion)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color: 'white',
                }}>
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.email?.[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 500, color: mobileDrawer === 'me' ? 'white' : 'var(--text-muted)' }}>Me</span>
              </button>
            ) : (
              <Link href="/login" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                padding: '0.35rem 0.5rem', borderRadius: '4px', textDecoration: 'none',
                background: isActive('/login') ? 'var(--vermilion)' : 'transparent',
                transition: 'all 0.15s', minWidth: '44px',
              }}>
                <IconAbout active={isActive('/login')} />
                <span style={{ fontSize: '0.6rem', fontWeight: 500, color: isActive('/login') ? 'white' : 'var(--text-muted)' }}>Sign in</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </>
  );
}

/* ── Avatar popover link ── */
function AvatarLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.45rem 0.6rem', borderRadius: '6px',
      textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, color: 'var(--brown-dark)',
      transition: 'background 0.12s ease',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--parchment)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >{label}</Link>
  );
}

/* ── Mobile drawer wrapper ── */
function MobileDrawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 2.4rem)', maxWidth: '420px',
      background: 'var(--warm-white)', border: '2.5px solid rgba(20,10,5,0.16)',
      borderRadius: '16px', padding: '0.75rem', zIndex: 95,
      boxShadow: '4px 4px 0 rgba(20,10,5,0.12), 0 -4px 32px rgba(44,31,20,0.1)',
    }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--vermilion) 0%, var(--gold) 50%, var(--jade) 100%)', borderRadius: '2px', marginBottom: '0.5rem' }} />
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.3rem' }}>{title}</p>
      {children}
    </div>
  );
}

/* ── Mobile drawer item ── */
function MobileDrawerItem({ href, emoji, label, desc, active, onClick }: {
  href: string; emoji: string; label: string; desc: string; active: boolean; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.6rem 0.75rem', borderRadius: '10px', textDecoration: 'none',
      background: active ? 'rgba(192,40,28,0.08)' : 'transparent',
      borderLeft: `3px solid ${active ? 'var(--vermilion)' : 'transparent'}`,
      marginBottom: '0.15rem', transition: 'background 0.12s ease',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
        background: 'var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
      }}>{emoji}</div>
      <div>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: active ? 'var(--terracotta)' : 'var(--brown-dark)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</div>}
      </div>
    </Link>
  );
}

/* ── Mobile tab button (for drawer zones) ── */
function MobileDrawerTab({ label, active, open, onClick, icon }: {
  label: string; active: boolean; open: boolean; onClick: () => void; icon: React.ReactNode;
}) {
  const highlight = active || open;
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
      padding: '0.35rem 0.5rem', borderRadius: '4px',
      background: highlight ? 'var(--vermilion)' : open ? 'rgba(192,40,28,0.07)' : 'transparent',
      boxShadow: highlight ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
      border: open && !active ? '1px solid rgba(192,40,28,0.3)' : '1px solid transparent',
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '44px',
    }}>
      {icon}
      <span style={{ fontSize: '0.6rem', fontWeight: highlight ? 600 : 500, color: highlight ? 'white' : 'var(--text-muted)' }}>{label}</span>
    </button>
  );
}

/* ── SVG icons ── */
function IconHome({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconSearch({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
function IconBriefcase({ active }: { active: boolean }) {
  const c = active ? 'white' : 'var(--text-muted)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
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

/* ── Desktop tab link ── */
function MobileTab({ href, active, label, icon }: { href: string; active: boolean; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
      textDecoration: 'none', padding: '0.35rem 0.5rem', borderRadius: '4px',
      background: active ? 'var(--vermilion)' : 'transparent',
      boxShadow: active ? '2px 2px 0 rgba(20,10,5,0.3)' : 'none',
      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', minWidth: '44px',
    }}>
      {icon}
      <span style={{ fontSize: '0.6rem', fontWeight: active ? 600 : 500, color: active ? 'white' : 'var(--text-muted)' }}>
        {label}
      </span>
    </Link>
  );
}
