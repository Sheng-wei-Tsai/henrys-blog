import { getAllPosts, getAllDigests, getAllGithot, getAllAINews, getAllVisaNews } from '@/lib/posts';
import PostsTabs from '@/components/PostsTabs';

export default function PostsLayout({ children }: { children: React.ReactNode }) {
  const posts    = getAllPosts();
  const digests  = getAllDigests();
  const githot   = getAllGithot();
  const ainews   = getAllAINews();
  const visanews = getAllVisaNews();

  const total = posts.length + digests.length + githot.length + ainews.length + visanews.length;

  const counts = {
    '/posts':           total,
    '/posts/blog':      posts.length,
    '/posts/research':  digests.length,
    '/posts/githot':    githot.length,
    '/posts/ai-news':   ainews.length,
    '/posts/visa-news': visanews.length,
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '0.6rem', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          All Posts
        </h1>
        <div style={{ width: '48px', height: '4px', borderRadius: '2px', background: 'var(--vermilion)', boxShadow: '2px 2px 0 rgba(20,10,5,0.2)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          {total} pieces of content
        </p>
      </div>

      <PostsTabs counts={counts} />

      {children}
    </div>
  );
}
