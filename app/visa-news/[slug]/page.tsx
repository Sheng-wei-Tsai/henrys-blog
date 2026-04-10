import { getAllVisaNews, getVisaNewsBySlug } from '@/lib/posts';
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

const SOURCE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'home-affairs':       { label: 'Dept. of Home Affairs',  color: '#0369a1', bg: 'rgba(3,105,161,0.08)',   border: 'rgba(3,105,161,0.25)' },
  'abf':                { label: 'Australian Border Force', color: '#0c4a6e', bg: 'rgba(12,74,110,0.08)',   border: 'rgba(12,74,110,0.25)' },
  'acs':                { label: 'ACS',                     color: '#065f46', bg: 'rgba(6,95,70,0.08)',     border: 'rgba(6,95,70,0.25)' },
  'study-international':{ label: 'Study International',     color: '#4338ca', bg: 'rgba(67,56,202,0.08)',   border: 'rgba(67,56,202,0.25)' },
  'migration-alliance': { label: 'Migration Alliance',      color: '#9333ea', bg: 'rgba(147,51,234,0.08)',  border: 'rgba(147,51,234,0.25)' },
  'universities-au':    { label: 'Universities Australia',  color: '#b45309', bg: 'rgba(180,83,9,0.08)',    border: 'rgba(180,83,9,0.25)' },
};

const VISA_CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  '482':     { bg: '#fef3c7', color: '#92400e' },
  '189':     { bg: '#d1fae5', color: '#065f46' },
  '190':     { bg: '#dbeafe', color: '#1e40af' },
  '485':     { bg: '#ede9fe', color: '#4c1d95' },
  '491':     { bg: '#fce7f3', color: '#9d174d' },
  '500':     { bg: '#e0f2fe', color: '#0c4a6e' },
  'PR':      { bg: '#f0fdf4', color: '#14532d' },
  '186':     { bg: '#fff7ed', color: '#7c2d12' },
  '187':     { bg: '#fdf2f8', color: '#701a75' },
  'skilled': { bg: '#f1f5f9', color: '#334155' },
  'general': { bg: '#f8fafc', color: '#475569' },
};

export async function generateStaticParams() {
  return getAllVisaNews().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getVisaNewsBySlug(slug);
  return {
    title: post?.title ?? 'Visa News',
    description: post?.excerpt,
  };
}

export default async function VisaNewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getVisaNewsBySlug(slug);
  if (!post) notFound();

  const source = SOURCE_META[post.visaSource ?? ''] ?? SOURCE_META['home-affairs'];
  const visaTypes = post.visaTypes ?? [];

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3rem', paddingBottom: '1.5rem' }}>
        <Link href="/posts/visa-news" style={{
          fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem',
        }}>
          ← Visa News
        </Link>

        {/* MARA disclaimer banner */}
        <div style={{
          background: 'rgba(239,246,255,0.8)', border: '1.5px solid #93c5fd',
          borderRadius: '8px', padding: '0.75rem 1rem',
          fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5,
          marginBottom: '1.5rem',
        }}>
          <strong>Not legal advice.</strong> This summary is for general information only.
          Always consult a{' '}
          <a href="https://www.mara.gov.au/consumer-information/find-a-registered-migration-agent/" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: 600 }}>
            MARA-registered migration agent
          </a>{' '}
          for your specific situation.
        </div>

        {/* Source badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: source.color, background: source.bg,
            border: `1px solid ${source.border}`,
            padding: '0.25em 0.75em', borderRadius: '5px',
          }}>
            {source.label}
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

        {/* Visa type chips */}
        {visaTypes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {visaTypes.map(vt => {
              const chip = VISA_CHIP_COLORS[vt] ?? VISA_CHIP_COLORS.general;
              return (
                <span key={vt} style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  background: chip.bg, color: chip.color,
                  padding: '0.2em 0.6em', borderRadius: '4px',
                }}>
                  {vt === 'PR' ? 'PR' : `Visa ${vt}`}
                </span>
              );
            })}
          </div>
        )}

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
            className="visa-source-cta"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: source.bg, border: `1.5px solid ${source.border}`,
              color: source.color, fontSize: '0.88rem', fontWeight: 600,
              textDecoration: 'none', marginBottom: '2rem',
              transition: 'opacity 0.15s ease',
            }}
          >
            Read original on {source.label} ↗
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
        <Link href="/posts/visa-news" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All Visa News
        </Link>
        <span style={{ fontFamily: "'Caveat', cursive", color: 'var(--brown-light)', fontSize: '1.1rem' }}>
          Good luck with your visa journey 🌿
        </span>
      </div>
    </div>
  );
}
