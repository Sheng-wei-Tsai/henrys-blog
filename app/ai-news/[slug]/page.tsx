import { getAllAINews, getAINewsBySlug } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { format } from 'date-fns';
import Link from 'next/link';
import { Metadata } from 'next';
import rehypePrettyCode from 'rehype-pretty-code';

const mdxOptions = {
  mdxOptions: {
    rehypePlugins: [
      [rehypePrettyCode, {
        theme: { dark: 'github-dark-dimmed', light: 'github-light' },
        keepBackground: false,
        defaultLang: 'plaintext',
      }],
    ],
  },
};

const COMPANY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  anthropic: { label: 'Anthropic',  color: '#CC785C', bg: 'rgba(204,120,92,0.08)',  border: 'rgba(204,120,92,0.25)' },
  openai:    { label: 'OpenAI',     color: '#10a37f', bg: 'rgba(16,163,127,0.08)',  border: 'rgba(16,163,127,0.25)' },
  google:    { label: 'Google AI',  color: '#4285f4', bg: 'rgba(66,133,244,0.08)',  border: 'rgba(66,133,244,0.25)' },
};

export async function generateStaticParams() {
  return getAllAINews().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getAINewsBySlug(slug);
  return {
    title: post?.title ?? 'AI News',
    description: post?.excerpt,
  };
}

export default async function AINewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getAINewsBySlug(slug);
  if (!post) notFound();

  const company = COMPANY_META[post.company ?? ''] ?? COMPANY_META.google;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
        <Link href="/posts/ai-news" style={{
          fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem',
        }}>
          ← AI News
        </Link>

        {/* Company badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: company.color, background: company.bg,
            border: `1px solid ${company.border}`,
            padding: '0.25em 0.75em', borderRadius: '5px',
          }}>
            {company.label}
          </span>
        </div>

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{post.coverEmoji}</div>

        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontWeight: 700, color: 'var(--brown-dark)',
          lineHeight: 1.2, marginBottom: '1rem',
        }}>
          {post.title}
        </h1>

        <div className="animate-fade-up delay-1" style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.8rem',
          alignItems: 'center', marginBottom: '1.5rem',
          color: 'var(--text-muted)', fontSize: '0.85rem',
        }}>
          <span>{format(new Date(post.date), 'd MMMM yyyy')}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        {/* Read original CTA */}
        {post.sourceUrl && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: company.bg, border: `1.5px solid ${company.border}`,
              color: company.color, fontSize: '0.88rem', fontWeight: 600,
              textDecoration: 'none', marginBottom: '2rem',
              transition: 'opacity 0.15s ease',
            }}
            className="visa-source-cta"
          >
            Read original on {company.label} ↗
          </a>
        )}
      </div>

      <article className="prose animate-fade-up delay-2" style={{ paddingBottom: '5rem' }}>
        <MDXRemote source={post.content} {...(mdxOptions as object)} />
      </article>

      <div style={{
        borderTop: '1px solid var(--parchment)', paddingTop: '2rem', paddingBottom: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/posts/ai-news" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All AI News
        </Link>
        <span style={{ fontFamily: "'Caveat', cursive", color: 'var(--brown-light)', fontSize: '1.1rem' }}>
          Thanks for reading 🌿
        </span>
      </div>
    </div>
  );
}
