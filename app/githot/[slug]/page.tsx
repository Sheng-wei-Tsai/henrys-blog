import { getAllGithot, getGithotBySlug } from '@/lib/posts';
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
      }],
    ],
  },
};

export async function generateStaticParams() {
  return getAllGithot().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getGithotBySlug(slug);
  return { title: post?.title ?? 'GitHub Hot' };
}

export default async function GithotPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getGithotBySlug(slug);
  if (!post) notFound();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
        <Link href="/githot" style={{
          fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem',
        }}>
          ← GitHub Hot
        </Link>

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
          alignItems: 'center', marginBottom: '2.5rem',
          color: 'var(--text-muted)', fontSize: '0.85rem',
        }}>
          <span>{format(new Date(post.date), 'd MMMM yyyy')}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
          {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
      </div>

      <article className="prose animate-fade-up delay-2" style={{ paddingBottom: '5rem' }}>
        <MDXRemote source={post.content} {...(mdxOptions as object)} />
      </article>

      <div style={{
        borderTop: '1px solid var(--parchment)', paddingTop: '2rem', paddingBottom: '4rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/githot" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All issues
        </Link>
        <span style={{ fontFamily: "'Caveat', cursive", color: 'var(--brown-light)', fontSize: '1.1rem' }}>
          Go build something
        </span>
      </div>
    </div>
  );
}
