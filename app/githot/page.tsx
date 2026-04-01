import { getAllGithot } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'GitHub Hot' };

export default function GithotPage() {
  const posts = getAllGithot();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '0.6rem', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          GitHub Hot
        </h1>
        <div style={{
          width: '48px', height: '4px', borderRadius: '2px',
          background: 'var(--jade)', boxShadow: '2px 2px 0 rgba(20,10,5,0.2)',
          marginBottom: '0.75rem',
        }} />
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          Top trending repos — use case, why it matters, how to apply it.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '4rem' }}>
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--warm-white)',
            border: 'var(--panel-border)', boxShadow: 'var(--panel-shadow)',
            borderRadius: '8px',
          }}>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.4rem', color: 'var(--text-muted)' }}>
              First issue coming soon
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.slug} post={post} basePath="/githot" index={i} />
          ))
        )}
      </div>
    </div>
  );
}
