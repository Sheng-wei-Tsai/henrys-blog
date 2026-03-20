import { getAllDigests, getDigestBySlug } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { format } from 'date-fns';
import Link from 'next/link';
import { Metadata } from 'next';
import MermaidDiagram from '@/components/MermaidDiagram';

export async function generateStaticParams() {
  return getAllDigests().map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const digest = getDigestBySlug(slug);
  return { title: digest?.title ?? 'AI Digest' };
}

// Intercept ```mermaid code blocks and render them as diagrams
function MermaidCode({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (className === 'language-mermaid' && typeof children === 'string') {
    return <MermaidDiagram chart={children.trim()} />;
  }
  return <code className={className}>{children}</code>;
}

const components = { code: MermaidCode };

export default async function DigestPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const digest = getDigestBySlug(slug);
  if (!digest) notFound();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
        <Link href="/digest" style={{
          fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem',
        }}>
          ← Back to digests
        </Link>

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{digest.coverEmoji}</div>

        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontWeight: 700, color: 'var(--brown-dark)',
          lineHeight: 1.2, marginBottom: '1rem',
        }}>
          {digest.title}
        </h1>

        <div className="animate-fade-up delay-1" style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.8rem',
          alignItems: 'center', marginBottom: '1rem',
          color: 'var(--text-muted)', fontSize: '0.85rem',
        }}>
          <span>{format(new Date(digest.date), 'd MMMM yyyy')}</span>
          <span>·</span>
          <span>{digest.readingTime}</span>
          {digest.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>

        <div className="animate-fade-up delay-1" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'var(--parchment)', borderRadius: '99px',
          padding: '0.25rem 0.75rem', fontSize: '0.78rem',
          color: 'var(--text-muted)', marginBottom: '2rem',
        }}>
          🤖 Auto-generated digest
        </div>
      </div>

      <article className="prose animate-fade-up delay-2" style={{ paddingBottom: '5rem' }}>
        <MDXRemote source={digest.content} components={components} />
      </article>

      <div style={{
        borderTop: '1px solid var(--parchment)', paddingTop: '2rem', paddingBottom: '4rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/digest" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All digests
        </Link>
        <span style={{ fontFamily: "'Caveat', cursive", color: 'var(--brown-light)', fontSize: '1.1rem' }}>
          Stay curious 🔬
        </span>
      </div>
    </div>
  );
}
