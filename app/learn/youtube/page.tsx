'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LEARN_CHANNELS } from '@/lib/learn-channels';

interface Video {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
}

interface Progress {
  video_id:  string;
  quiz_score: number | null;
  quiz_taken: boolean;
  completed:  boolean;
}

function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

// RapidAPI returns relative text like "3 days ago" — use directly
function timeAgo(publishedAt: string) {
  return publishedAt || '';
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`,
      padding: '0.15em 0.5em', borderRadius: '5px' }}>
      {score}%
    </span>
  );
}

export default function LearnYoutubePage() {
  const router = useRouter();
  const [url,           setUrl]          = useState('');
  const [urlError,      setUrlError]     = useState('');
  const [activeChannel, setActiveChannel] = useState(LEARN_CHANNELS[0].id);
  const [videos,        setVideos]        = useState<Video[]>([]);
  const [nextToken,     setNextToken]     = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [progress,      setProgress]      = useState<Record<string, Progress>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef  = useRef(false); // prevent double-fire from IntersectionObserver

  const channel = LEARN_CHANNELS.find(c => c.id === activeChannel)!;

  const loadChannel = useCallback(async (channelId: string, cursor?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    if (!cursor) setVideos([]);
    const apiUrl = `/api/learn/channel-videos?channelId=${channelId}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    try {
      const res  = await fetch(apiUrl);
      const data = await res.json();
      setVideos(prev => cursor ? [...prev, ...(data.videos ?? [])] : (data.videos ?? []));
      setNextToken(data.nextPageToken || null); // '' → null (no more pages)
    } catch { /* ignore fetch errors */ }
    setLoading(false);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    loadChannel(channel.channelId);
  }, [activeChannel, channel.channelId, loadChannel]);

  useEffect(() => {
    fetch('/api/learn/progress')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Progress> = {};
        (d.progress ?? []).forEach((p: Progress) => { map[p.video_id] = p; });
        setProgress(map);
      })
      .catch(() => {});
  }, []);

  // ── Infinite scroll: auto-load next page when sentinel enters viewport ──
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextToken || loading) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextToken && !loadingRef.current) {
          loadChannel(channel.channelId, nextToken);
        }
      },
      { rootMargin: '200px' }, // start loading 200px before visible
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextToken, loading, channel.channelId, loadChannel]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    const id = extractVideoId(url.trim());
    if (!id) { setUrlError('Paste a valid YouTube URL or video ID'); return; }
    router.push(`/learn/youtube/${id}`);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
      <style>{`
        .video-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .video-card { transition: box-shadow 0.15s, transform 0.15s; }
        .channel-btn:hover { background: var(--parchment) !important; }
      `}</style>

      {/* Header */}
      <section style={{ paddingTop: '4rem', paddingBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          <Link href="/learn" style={{ color: 'var(--terracotta)', textDecoration: 'none' }}>← Learning</Link>
        </p>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Learn from YouTube
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '54ch', marginBottom: '2rem' }}>
          Paste any YouTube URL and get an AI study guide powered by Gemini — the same model that runs Google NotebookLM.
          Then test your knowledge with a quiz, or jump into NotebookLM for a deeper session.
        </p>

        {/* URL paste form */}
        <form onSubmit={handleUrlSubmit}>
          <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '540px' }}>
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError(''); }}
              placeholder="Paste a YouTube URL…"
              style={{
                flex: 1, padding: '0.7rem 1rem',
                border: `1px solid ${urlError ? '#fca5a5' : 'var(--parchment)'}`,
                borderRadius: '10px', background: 'var(--warm-white)',
                color: 'var(--brown-dark)', fontSize: '0.92rem',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button type="submit" style={{
              background: 'var(--terracotta)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '0.7rem 1.25rem',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Study →
            </button>
          </div>
          {urlError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem' }}>{urlError}</p>}
        </form>
      </section>

      {/* Channel tabs */}
      <section>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Or browse curated channels
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {LEARN_CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className="channel-btn"
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '99px', border: '1px solid var(--parchment)',
                background: activeChannel === c.id ? 'var(--brown-dark)' : 'var(--warm-white)',
                color: activeChannel === c.id ? 'white' : 'var(--brown-dark)',
                fontSize: '0.83rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {/* Active channel description */}
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--warm-white)',
          border: '1px solid var(--parchment)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brown-dark)' }}>{channel.emoji} {channel.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}> · {channel.description}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {channel.focus.map(f => (
              <span key={f} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15em 0.5em', borderRadius: '5px',
                background: 'var(--parchment)', color: 'var(--text-secondary)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Video grid */}
        {loading && videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Loading videos…
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.1rem', marginBottom: '2rem' }}>
              {videos.map(v => {
                const p = progress[v.id];
                return (
                  <Link key={v.id} href={`/learn/youtube/${v.id}`} style={{ textDecoration: 'none' }}>
                    <div className="video-card" style={{
                      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                      borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                    }}>
                      <div style={{ position: 'relative', paddingBottom: '56.25%', overflow: 'hidden' }}>
                        <Image
                          src={v.thumbnail}
                          alt={v.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 260px"
                          style={{ objectFit: 'cover' }}
                        />
                        {p?.completed && (
                          <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem',
                            background: '#10b981', color: 'white', fontSize: '0.68rem',
                            fontWeight: 700, padding: '0.2em 0.55em', borderRadius: '5px' }}>
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '0.85rem' }}>
                        <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--brown-dark)',
                          lineHeight: 1.4, marginBottom: '0.45rem',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {v.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(v.publishedAt)}</span>
                          {p?.quiz_taken && p.quiz_score !== null && <ScoreBadge score={p.quiz_score} />}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Infinite scroll sentinel — IntersectionObserver fires loadChannel when this enters view */}
            <div ref={sentinelRef} style={{ height: '1px' }} />

            {/* Loading spinner while fetching next page */}
            {loading && videos.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '1.5rem 0 3rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--terracotta)', opacity: 0.7,
                    animation: 'dotPulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
                <style>{`@keyframes dotPulse{0%,80%,100%{transform:scale(0.7);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
              </div>
            )}

            {/* End of list indicator */}
            {!nextToken && videos.length > 0 && !loading && (
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingBottom: '3rem' }}>
                All videos loaded
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
