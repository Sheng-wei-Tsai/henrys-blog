import { ImageResponse } from 'next/og';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { format } from 'date-fns';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title ?? 'Henry Tsai';
  const date  = post?.date  ? format(new Date(post.date), 'd MMM yyyy') : '';
  const readTime = post?.readingTime ?? '';
  const tags = post?.tags?.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 90px',
          background: '#f5f0e8',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #c0281c 0%, #c88a14 50%, #1e7a52 100%)',
          display: 'flex',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 600, color: '#c0281c',
            letterSpacing: '0.05em', display: 'flex',
          }}>
            Henry Tsai
          </div>
          <div style={{
            fontSize: 20, color: '#8a6a5a', display: 'flex', gap: 16,
          }}>
            {date && <span>{date}</span>}
            {readTime && <span>·</span>}
            {readTime && <span>{readTime}</span>}
          </div>
        </div>

        {/* Title */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: '40px 0',
        }}>
          <div style={{
            fontSize: title.length > 60 ? 44 : title.length > 40 ? 52 : 60,
            fontWeight: 700,
            color: '#1a0a03',
            lineHeight: 1.2,
            display: 'flex',
          }}>
            {title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {tags.map(tag => (
              <div key={tag} style={{
                fontSize: 18, fontWeight: 600,
                color: '#c0281c',
                background: 'rgba(192,40,28,0.08)',
                border: '1px solid rgba(192,40,28,0.2)',
                padding: '6px 14px', borderRadius: 6,
                display: 'flex',
              }}>
                {tag}
              </div>
            ))}
          </div>
          <div style={{
            fontSize: 20, color: '#8a6a5a',
            display: 'flex',
          }}>
            henrysdigitallife.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
