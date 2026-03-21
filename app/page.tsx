import Link from 'next/link';
import { getAllPosts, getAllDigests, getAllGithot } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import PostHeatmap from '@/components/PostHeatmap';

const tools = [
  {
    href: '/jobs',
    emoji: '🔍',
    title: 'IT Job Search',
    desc: 'Search thousands of Australian IT roles, filtered and aggregated in one place.',
  },
  {
    href: '/cover-letter',
    emoji: '✍️',
    title: 'Cover Letter AI',
    desc: 'Paste a job description, get a tailored cover letter in seconds.',
  },
  {
    href: '/resume',
    emoji: '📄',
    title: 'Resume Matcher',
    desc: 'Score your resume against any job description with AI analysis.',
  },
];

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);

  // Collect all post dates across blog, digest, and githot
  const allDates = [
    ...getAllPosts(),
    ...getAllDigests(),
    ...getAllGithot(),
  ].map(p => p.date.slice(0, 10));  // normalise to YYYY-MM-DD
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Hero */}
      <section style={{ padding: '5rem 0 4rem', position: 'relative' }}>
        <p className="animate-fade-up font-handwritten" style={{
          fontSize: '1.2rem', color: 'var(--terracotta)', marginBottom: '0.75rem',
        }}>
          Hey, I'm Henry 👋
        </p>
        <h1 className="animate-fade-up delay-1" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 700,
          color: 'var(--brown-dark)',
          lineHeight: 1.15,
          marginBottom: '1.2rem',
        }}>
          I build things,<br />write about it.
        </h1>
        <p className="animate-fade-up delay-2" style={{
          fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '48ch', lineHeight: 1.75, marginBottom: '2rem',
        }}>
          Full stack developer in Brisbane. I share what I'm building, learning, and thinking about
          — mostly code, AI tools, and occasionally life.
        </p>
        <div className="animate-fade-up delay-3" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link href="/blog" style={{
            background: 'var(--terracotta)', color: 'white',
            padding: '0.65em 1.5em', borderRadius: '99px',
            fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem',
          }}>
            Read the blog →
          </Link>
          <Link href="/about" style={{
            background: 'var(--parchment)', color: 'var(--brown-mid)',
            padding: '0.65em 1.5em', borderRadius: '99px',
            fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem',
          }}>
            About me
          </Link>
        </div>

        {/* decorative dots */}
        <div style={{
          position: 'absolute', right: 0, top: '3rem',
          width: '120px', height: '120px', opacity: 0.1,
          backgroundImage: 'radial-gradient(var(--terracotta) 1.5px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
        }} />
      </section>

      {/* Writing activity heatmap */}
      <PostHeatmap dates={allDates} />

      {/* Recent Posts */}
      {posts.length > 0 && (
        <section style={{ paddingBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.35rem', color: 'var(--brown-dark)' }}>
              Recent writing
            </h2>
            <Link href="/blog" style={{ fontSize: '0.88rem', color: 'var(--terracotta)', textDecoration: 'none' }}>
              All posts →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {posts.map((post, i) => <PostCard key={post.slug} post={post} index={i} />)}
          </div>
        </section>
      )}

      {/* Tools */}
      <section style={{ paddingBottom: '5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.35rem', color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
            Tools I built into this site
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Free to use — designed for developers job-hunting in Australia.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.9rem' }}>
          {tools.map(tool => (
            <Link key={tool.href} href={tool.href} className="tool-card" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                borderRadius: '14px', padding: '1.3rem 1.4rem', height: '100%',
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{tool.emoji}</div>
                <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: '0.97rem', color: 'var(--brown-dark)', marginBottom: '0.4rem' }}>
                  {tool.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
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
