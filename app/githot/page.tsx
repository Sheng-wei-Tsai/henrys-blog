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
          fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.5rem',
        }}>
          GitHub Hot
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
          Top trending repos every week — use case, why it matters, how to use it,
          and how I could use it in my own projects.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '4rem' }}>
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--warm-white)', borderRadius: '14px',
            border: '1px dashed var(--parchment)',
          }}>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.4rem', color: 'var(--brown-light)' }}>
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
