import { getAllDigests } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI Digest' };

export default function DigestPage() {
  const digests = getAllDigests();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.5rem',
        }}>
          AI Digest
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Weekly roundups from OpenAI, Google, DeepMind, HuggingFace & ArXiv — filtered and summarized. 🤖
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '4rem' }}>
        {digests.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--warm-white)', borderRadius: '14px',
            border: '1px dashed var(--parchment)',
          }}>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.4rem', color: 'var(--brown-light)' }}>
              First digest coming soon... 🌱
            </p>
          </div>
        ) : (
          digests.map((digest, i) => (
            <PostCard
              key={digest.slug}
              post={digest}
              basePath="/digest"
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
