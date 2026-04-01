import { getAllPosts, getAllTags } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  const posts = getAllPosts();
  const tags  = getAllTags();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
          fontWeight: 700,
          color: 'var(--brown-dark)',
          marginBottom: '0.6rem',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}>
          All Writings
        </h1>
        <div style={{
          width: '48px', height: '4px', borderRadius: '2px',
          background: 'var(--vermilion)',
          boxShadow: '2px 2px 0 rgba(20,10,5,0.2)',
          marginBottom: '0.75rem',
        }} />
        <p className="animate-fade-up delay-1" style={{
          color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500,
        }}>
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} and counting
        </p>
      </div>

      <BlogList posts={posts} tags={tags} />
    </div>
  );
}
