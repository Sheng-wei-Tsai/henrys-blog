import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { format } from 'date-fns';
import Link from 'next/link';
import { Metadata } from 'next';
import rehypePrettyCode from 'rehype-pretty-code';
import FeedButton from '@/components/petcho/FeedButton';
import CommentsClient from '@/components/CommentsClient';

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

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrysdigitallife.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const url = `${BASE_URL}/blog/${slug}`;
  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.title,
      type: 'article',
      url,
      publishedTime: post.date,
      authors: ['Henry Tsai'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? post.title,
    },
    alternates: { canonical: url },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // JSON-LD for Google rich results — data is server-controlled (our markdown files)
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: 'Henry Tsai', url: `${BASE_URL}/about` },
    publisher: { '@type': 'Organization', name: 'TechPath AU', url: BASE_URL },
    url: `${BASE_URL}/blog/${post.slug}`,
    keywords: post.tags.join(', '),
  });

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* eslint-disable-next-line react/no-danger -- safe: server-owned content, JSON.stringify escapes </script> */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
        <Link href="/posts/blog" style={{
          fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem',
        }}>
          ← Blog
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

      {/* Feed Hopper */}
      <div style={{ marginBottom: '2rem' }}>
        <FeedButton slug={post.slug} readingTime={post.readingTime} tags={post.tags} />
      </div>

      <div style={{
        borderTop: '1px solid var(--parchment)', paddingTop: '2rem', paddingBottom: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/posts/blog" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All posts
        </Link>
        <span style={{ fontFamily: "'Caveat', cursive", color: 'var(--brown-light)', fontSize: '1.1rem' }}>
          Thanks for reading 🌿
        </span>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--parchment)', margin: '0 0 2rem' }} />
      <CommentsClient slug={slug} />
    </div>
  );
}
