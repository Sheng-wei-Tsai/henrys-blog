import { getAllDigests } from '@/lib/posts';
import { fetchIAFeed, formatRelativeDate } from '@/lib/ia-feed';
import PostCard from '@/components/PostCard';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI Digest' };

export default async function DigestPage() {
  const digests = getAllDigests();
  const iaItems = await fetchIAFeed(8);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '0.6rem', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          AI Digest
        </h1>
        <div style={{
          width: '48px', height: '4px', borderRadius: '2px',
          background: 'var(--gold)', boxShadow: '2px 2px 0 rgba(20,10,5,0.2)',
          marginBottom: '0.75rem',
        }} />
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          Weekly AI research roundups — filtered, summarised, signal over noise.
        </p>
      </div>

      {/* ── Information Age live feed ─────────────────────────────────── */}
      {iaItems.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.4rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                borderRadius: '99px', background: '#eff6ff', color: '#0369a1',
                border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Information Age
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)' }}>
                Latest from ACS
              </span>
            </div>
            <a
              href="https://ia.acs.org.au"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.72rem', color: '#0369a1', textDecoration: 'none' }}
            >
              ia.acs.org.au →
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {iaItems.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textDecoration: 'none',
                  background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                  borderRadius: '10px', padding: '0.8rem 1rem',
                  transition: 'border-color 0.15s',
                  borderLeft: '3px solid #0369a1',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{
                    fontSize: '0.86rem', fontWeight: 600, color: 'var(--brown-dark)',
                    margin: 0, lineHeight: 1.4, flex: 1,
                  }}>
                    {item.title}
                  </p>
                  <span style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', paddingTop: '2px', flexShrink: 0,
                  }}>
                    {formatRelativeDate(item.pubDate)}
                  </span>
                </div>
                {item.description && (
                  <p style={{
                    fontSize: '0.78rem', color: 'var(--text-secondary)',
                    margin: '0.3rem 0 0', lineHeight: 1.55,
                  }}>
                    {item.description}{item.description.length >= 220 ? '…' : ''}
                  </p>
                )}
                {item.category.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {item.category.slice(0, 3).map(cat => (
                      <span key={cat} style={{
                        fontSize: '0.63rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                        background: 'var(--parchment)', color: 'var(--text-muted)',
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
          <p style={{
            fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.6rem',
            borderTop: '1px solid var(--parchment)', paddingTop: '0.5rem',
          }}>
            Source:{' '}
            <a href="https://ia.acs.org.au" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
              Information Age
            </a>
            {' '}— ACS flagship publication for Australian ICT professionals.
            Feed refreshes every 6 hours. Filtered to AI, careers, security, and policy.
          </p>
        </div>
      )}

      {/* ── Weekly digest posts ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '4rem' }}>
        {digests.length === 0 ? (
          <EmptyState message="First digest coming soon... 🌱" />
        ) : (
          digests.map((digest, i) => (
            <PostCard key={digest.slug} post={digest} basePath="/digest" index={i} />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--warm-white)',
      border: 'var(--panel-border)', boxShadow: 'var(--panel-shadow)',
      borderRadius: '8px',
    }}>
      <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.4rem', color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  );
}
