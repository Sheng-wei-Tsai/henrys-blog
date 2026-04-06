import Link from 'next/link';
import { getAllPosts, getAllDigests, getAllGithot } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import PostHeatmap from '@/components/PostHeatmap';

export const dynamic = 'force-dynamic';

const tools = [
  {
    href: '/jobs',
    icon: <IconJobs />,
    title: 'IT Job Search',
    desc: 'Search thousands of Australian IT roles, filtered and aggregated in one place.',
    accent: 'var(--vermilion)',
  },
  {
    href: '/cover-letter',
    icon: <IconCoverLetter />,
    title: 'Cover Letter AI',
    desc: 'Paste a job description, get a tailored cover letter in seconds.',
    accent: 'var(--gold)',
  },
  {
    href: '/resume',
    icon: <IconResume />,
    title: 'Resume Matcher',
    desc: 'Score your resume against any job description with AI analysis.',
    accent: 'var(--jade)',
  },
];

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);
  const allDates = [
    ...getAllPosts(),
    ...getAllDigests(),
    ...getAllGithot(),
  ].map(p => p.date.slice(0, 10));

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 0 4rem', position: 'relative', overflow: 'hidden' }}>

        {/* Halftone dot accent — top right */}
        <div style={{
          position: 'absolute', right: '-1rem', top: '2rem',
          width: '140px', height: '140px', opacity: 0.07,
          backgroundImage: 'radial-gradient(var(--ink) 1.5px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
        }} />

        {/* Red lantern — floating top right */}
        <div className="lantern-float" style={{
          position: 'absolute', right: '4%', top: '1.5rem',
          pointerEvents: 'none', opacity: 0.75,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        }}>
          <LanternSVG />
        </div>

        {/* Small yin-yang stamp — bottom right of hero */}
        <div style={{
          position: 'absolute', right: '8%', bottom: '3rem',
          pointerEvents: 'none', opacity: 0.12,
          animation: 'bambooSway 8s ease-in-out infinite',
        }}>
          <SmallYinYangSVG />
        </div>

        {/* Ink brush corner — bottom left */}
        <div style={{
          position: 'absolute', left: '-1.5rem', bottom: '0',
          pointerEvents: 'none', opacity: 0.07,
        }}>
          <BambooSVG />
        </div>

        {/* Hero content */}
        <p className="animate-fade-up font-handwritten" style={{
          fontSize: '1.25rem', color: 'var(--vermilion)', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          嗨，我是 Henry
          <span style={{ fontSize: '1rem', fontFamily: 'sans-serif' }}>👋</span>
        </p>

        <h1 className="animate-fade-up delay-1" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.8rem, 7vw, 4.8rem)',
          fontWeight: 700,
          color: 'var(--brown-dark)',
          lineHeight: 1.1,
          marginBottom: '0.4rem',
          letterSpacing: '-0.03em',
        }}>
          I build things,
        </h1>
        <h1 className="animate-brush delay-2" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.8rem, 7vw, 4.8rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          letterSpacing: '-0.03em',
          background: `linear-gradient(135deg, var(--vermilion) 0%, var(--gold) 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          write about it.
        </h1>

        {/* Ink divider */}
        <div className="animate-fade-up delay-2" style={{
          width: '60px', height: '3px',
          background: 'var(--vermilion)',
          borderRadius: '2px',
          marginBottom: '1.5rem',
          boxShadow: '2px 2px 0 rgba(20,10,5,0.2)',
        }} />

        <p className="animate-fade-up delay-3" style={{
          fontSize: '1.05rem', color: 'var(--text-secondary)',
          maxWidth: '44ch', lineHeight: 1.75, marginBottom: '2.2rem',
        }}>
          Full stack developer in Brisbane. I share what I&apos;m building,
          learning, and thinking about — mostly code, AI tools, and
          occasionally life.
        </p>

        <div className="animate-fade-up delay-4" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link href="/blog" className="hero-btn-primary">
            Read the blog →
          </Link>
          <Link href="/about" className="hero-btn-secondary">
            About me
          </Link>
        </div>
      </section>

      {/* Writing activity heatmap */}
      <PostHeatmap dates={allDates} />

      {/* ── Recent Posts ── */}
      {posts.length > 0 && (
        <section style={{ paddingBottom: '4rem' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: '1.5rem',
          }}>
            <h2 style={{
              fontFamily: "'Lora', serif", fontSize: '1.4rem',
              color: 'var(--brown-dark)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{
                display: 'inline-block', width: '12px', height: '12px',
                background: 'var(--vermilion)', borderRadius: '2px',
                border: '2px solid var(--ink)',
                boxShadow: '1px 1px 0 var(--ink)',
                flexShrink: 0,
              }} />
              Recent writing
            </h2>
            <Link href="/blog" style={{
              fontSize: '0.88rem', color: 'var(--vermilion)',
              textDecoration: 'none', fontWeight: 600,
              borderBottom: '2px solid var(--vermilion)',
              paddingBottom: '1px',
            }}>
              All posts →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map((post, i) => <PostCard key={post.slug} post={post} index={i} />)}
          </div>
        </section>
      )}

      {/* ── Tools ── */}
      <section style={{ paddingBottom: '5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontFamily: "'Lora', serif", fontSize: '1.4rem',
            color: 'var(--brown-dark)', marginBottom: '0.3rem',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px',
              background: 'var(--gold)', borderRadius: '2px',
              border: '2px solid var(--ink)',
              boxShadow: '1px 1px 0 var(--ink)',
              flexShrink: 0,
            }} />
            Tools I built into this site
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Free to use — designed for developers job-hunting in Australia.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}
          className="tools-grid">
          {tools.map(tool => (
            <Link key={tool.href} href={tool.href} className="tool-card" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--warm-white)',
                border: 'var(--panel-border)',
                borderRadius: '8px',
                padding: '1.4rem',
                height: '100%',
                boxShadow: 'var(--panel-shadow)',
                transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '0.6rem', marginBottom: '0.6rem',
                }}>
                  <div style={{
                    fontFamily: "'Lora', serif", fontWeight: 700,
                    fontSize: '0.97rem', color: 'var(--brown-dark)',
                  }}>
                    {tool.title}
                  </div>
                  <div style={{
                    width: '36px', height: '36px', flexShrink: 0,
                    borderRadius: '6px',
                    background: `${tool.accent}18`,
                    border: `2px solid ${tool.accent}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tool.accent,
                  }}>
                    {tool.icon}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55,
                }}>
                  {tool.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Decorative SVG Components ── */

function LanternSVG() {
  return (
    <svg width="36" height="64" viewBox="0 0 36 64" fill="none" aria-hidden="true">
      {/* String top */}
      <line x1="18" y1="0" x2="18" y2="8" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Lantern cap */}
      <rect x="8" y="8" width="20" height="5" rx="2" fill="var(--gold)" />
      {/* Lantern body */}
      <ellipse cx="18" cy="32" rx="13" ry="18" fill="var(--vermilion)" opacity="0.9"/>
      {/* Vertical ribs */}
      <line x1="10" y1="14" x2="8"  y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.6"/>
      <line x1="18" y1="14" x2="18" y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.6"/>
      <line x1="26" y1="14" x2="28" y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.6"/>
      {/* Horizontal rings */}
      <ellipse cx="18" cy="22" rx="13" ry="3" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity="0.5"/>
      <ellipse cx="18" cy="42" rx="13" ry="3" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity="0.5"/>
      {/* Lantern bottom cap */}
      <rect x="8" y="49" width="20" height="4" rx="2" fill="var(--gold)" />
      {/* Tassel */}
      <line x1="16" y1="53" x2="14" y2="64" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="53" x2="18" y2="64" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="53" x2="22" y2="64" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Inner glow */}
      <ellipse cx="18" cy="32" rx="8" ry="12" fill="var(--gold)" opacity="0.15"/>
    </svg>
  );
}

function SmallYinYangSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="var(--ink)" />
      <path d="M20,2 A18,18 0 0,1 20,38 A9,9 0 0,1 20,20 A9,9 0 0,0 20,2 Z" fill="var(--warm-white)" />
      <circle cx="20" cy="11" r="4.5" fill="var(--ink)" />
      <circle cx="20" cy="29" r="4.5" fill="var(--warm-white)" />
      <circle cx="20" cy="20" r="18" fill="none" stroke="var(--ink)" strokeWidth="2"/>
    </svg>
  );
}

function BambooSVG() {
  return (
    <svg width="60" height="120" viewBox="0 0 60 120" fill="none" aria-hidden="true">
      {/* Left stalk */}
      <rect x="8"  y="10" width="10" height="30" rx="2" fill="var(--jade)" opacity="0.8"/>
      <rect x="8"  y="42" width="10" height="30" rx="2" fill="var(--jade)" opacity="0.7"/>
      <rect x="8"  y="74" width="10" height="30" rx="2" fill="var(--jade)" opacity="0.6"/>
      {/* Nodes */}
      <rect x="6"  y="40" width="14" height="4" rx="2" fill="var(--ink)" opacity="0.6"/>
      <rect x="6"  y="72" width="14" height="4" rx="2" fill="var(--ink)" opacity="0.5"/>
      {/* Right stalk */}
      <rect x="32" y="0"  width="10" height="30" rx="2" fill="var(--jade)" opacity="0.7"/>
      <rect x="32" y="32" width="10" height="35" rx="2" fill="var(--jade)" opacity="0.6"/>
      <rect x="32" y="69" width="10" height="35" rx="2" fill="var(--jade)" opacity="0.5"/>
      {/* Nodes */}
      <rect x="30" y="30" width="14" height="4" rx="2" fill="var(--ink)" opacity="0.5"/>
      <rect x="30" y="67" width="14" height="4" rx="2" fill="var(--ink)" opacity="0.4"/>
      {/* Leaves */}
      <ellipse cx="22" cy="20" rx="14" ry="5" fill="var(--jade)" opacity="0.6" transform="rotate(-30 22 20)"/>
      <ellipse cx="42" cy="50" rx="14" ry="5" fill="var(--jade)" opacity="0.5" transform="rotate(25 42 50)"/>
    </svg>
  );
}

/* ── Tool Icons ── */
function IconJobs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function IconCoverLetter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}
function IconResume() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
