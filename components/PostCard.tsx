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
          padding: '1.4rem 1.6rem',
          display: 'flex',
          gap: '1.2rem',
          alignItems: 'flex-start',
          transition: 'transform 0.18s, box-shadow 0.18s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(44,31,20,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Emoji accent */}
        <div style={{
          fontSize: '1.8rem', lineHeight: 1, flexShrink: 0,
          marginTop: '0.1rem',
        }}>
          {post.coverEmoji}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            {format(new Date(post.date), 'd MMM yyyy')} · {post.readingTime}
          </div>
          <h2 style={{
            fontFamily: "'Lora', serif",
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--brown-dark)',
            marginBottom: '0.35rem',
            lineHeight: 1.3,
          }}>
            {post.title}
          </h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.88rem',
            lineHeight: 1.6, marginBottom: '0.8rem',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {post.excerpt}
          </p>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
