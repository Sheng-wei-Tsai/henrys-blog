'use client';
import Link from 'next/link';
import { Post } from '@/lib/posts';
import { format } from 'date-fns';

export default function PostCard({ post, index = 0, basePath = '/blog' }: { post: Post; index?: number; basePath?: string }) {
  return (
    <Link href={`${basePath}/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className={`animate-fade-up delay-${Math.min(index + 1, 4)}`}
        style={{
          background: 'var(--warm-white)',
          border: '1px solid var(--parchment)',
          borderRadius: '14px',
          padding: '1.6rem',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(44,31,20,0.09)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>{post.coverEmoji}</div>
        <h2 style={{
          fontFamily: "'Lora', serif",
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--brown-dark)',
          marginBottom: '0.5rem',
          lineHeight: 1.3,
        }}>
          {post.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1rem', lineHeight: 1.6 }}>
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {format(new Date(post.date), 'MMM d, yyyy')} · {post.readingTime}
          </span>
        </div>
      </article>
    </Link>
  );
}
