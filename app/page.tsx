import Link from 'next/link';
import { getAllPosts, getAllDigests, getAllGithot, getAllAINews, getAllVisaNews } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import PostHeatmap from '@/components/PostHeatmap';
import HomepageHero from '@/components/HomepageHero';
import SocialProof from '@/components/SocialProof';
import { createSupabaseService } from '@/lib/auth-server';

// Static generation — homepage reads only filesystem markdown files.
// Revalidate every hour so new posts appear without a full redeploy.
export const revalidate = 3600;

export default async function HomePage() {
  const posts    = getAllPosts().slice(0, 3);
  const allDates = [
    ...getAllPosts(),
    ...getAllDigests(),
    ...getAllGithot(),
  ].map(p => p.date.slice(0, 10));

  const totalContent =
    getAllPosts().length +
    getAllAINews().length +
    getAllVisaNews().length +
    getAllGithot().length;

  // Fetch aggregate stats — runs at ISR time, cached for 1 hour
  const sb = createSupabaseService();
  const [{ count: resumeCount }, { count: memberCount }] = await Promise.all([
    sb.from('resume_analyses').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* ── Hero — personalised for logged-in users, targeted for guests ── */}
      <HomepageHero />

      {/* ── Social proof — stats + trust signals, guests only via client ── */}
      <SocialProof
        resumeCount={resumeCount ?? 0}
        memberCount={memberCount ?? 0}
        contentCount={totalContent}
      />

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
            <Link href="/posts" style={{
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

    </div>
  );
}
