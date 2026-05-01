'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}

interface Progress {
  video_id: string;
  quiz_score: number | null;
  quiz_taken: boolean;
  completed: boolean;
}

interface StudyGuide {
  summary: string;
  keyConcepts: Array<{ term: string; definition: string; whyMatters: string }>;
  coreInsights: string[];
  architectureNote: string | null;
  australianContext: string;
  studyTips: string[];
}

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

/* ─── helpers ──────────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`,
      padding: '0.15em 0.5em', borderRadius: '5px' }}>
      {score}%
    </span>
  );
}

/* ─── Quiz component ────────────────────────────────────────────────── */
function Quiz({ questions, onComplete }: {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}) {
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers]   = useState<boolean[]>([]);
  const [done, setDone]         = useState(false);

  const q = questions[idx];
  const score = done ? Math.round((answers.filter(Boolean).length / questions.length) * 100) : 0;

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
  };

  const next = () => {
    const correct = selected === q.answer;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);
    if (idx + 1 >= questions.length) {
      const finalScore = Math.round((newAnswers.filter(Boolean).length / questions.length) * 100);
      setDone(true);
      onComplete(finalScore);
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  if (done) {
    const correct = answers.filter(Boolean).length;
    const band = score >= 80 ? { label: 'Excellent!', color: '#10b981' }
               : score >= 60 ? { label: 'Good work', color: '#f59e0b' }
               : { label: 'Keep studying', color: '#ef4444' };
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {score >= 80 ? '🎉' : score >= 60 ? '💪' : '📚'}
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: band.color, marginBottom: '0.25rem' }}>
          {score}%
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
          {band.label}
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {correct} / {questions.length} correct
        </div>
        <button onClick={() => { setIdx(0); setSelected(null); setAnswers([]); setDone(false); }}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1px solid var(--parchment)',
            color: 'var(--brown-dark)', background: 'transparent', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Question {idx + 1} of {questions.length}
        <span style={{ float: 'right' }}>{answers.filter(Boolean).length} correct so far</span>
      </div>
      <p style={{ fontWeight: 600, color: 'var(--brown-dark)', lineHeight: 1.5, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
        {q.q}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--warm-white)';
          let border = '1px solid var(--parchment)';
          if (selected !== null) {
            if (i === q.answer)  { bg = '#f0fdf4'; border = '1px solid #86efac'; }
            if (i === selected && selected !== q.answer) { bg = '#fef2f2'; border = '1px solid #fca5a5'; }
          }
          return (
            <button key={i} onClick={() => choose(i)} style={{
              textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '10px',
              border, background: bg, color: 'var(--brown-dark)', fontSize: '0.88rem',
              cursor: selected !== null ? 'default' : 'pointer', lineHeight: 1.45,
            }}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          background: 'var(--parchment)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          {q.explanation}
        </div>
      )}
      <button onClick={next} disabled={selected === null} style={{
        background: selected !== null ? 'var(--terracotta)' : 'var(--parchment)',
        color: selected !== null ? 'white' : 'var(--text-muted)',
        border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem',
        fontSize: '0.9rem', fontWeight: 600, cursor: selected !== null ? 'pointer' : 'default',
      }}>
        {idx + 1 >= questions.length ? 'See results' : 'Next →'}
      </button>
    </div>
  );
}

/* ─── Study guide renderer ─────────────────────────────────────────── */
function StudyGuideView({ guide }: { guide: StudyGuide }) {
  const [openConcept, setOpenConcept] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>Summary</p>
        <p style={{ fontSize: '0.92rem', color: 'var(--brown-dark)', lineHeight: 1.7 }}>{guide.summary}</p>
      </div>

      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.8rem' }}>Key Concepts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {guide.keyConcepts.map((c, i) => (
            <div key={i} style={{ border: '1px solid var(--parchment)', borderRadius: '10px', overflow: 'hidden' }}>
              <button onClick={() => setOpenConcept(openConcept === i ? null : i)} style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'var(--warm-white)',
                border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brown-dark)' }}>{c.term}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{openConcept === i ? '▲' : '▼'}</span>
              </button>
              {openConcept === i && (
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--parchment)', background: '#fafaf8' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{c.definition}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>💼 {c.whyMatters}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.8rem' }}>Core Insights</p>
        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {guide.coreInsights.map((insight, i) => (
            <li key={i} style={{ fontSize: '0.88rem', color: 'var(--brown-dark)', lineHeight: 1.6 }}>{insight}</li>
          ))}
        </ol>
      </div>

      {guide.architectureNote && (
        <div style={{ background: '#f8f4ef', border: '1px solid var(--parchment)', borderRadius: '10px', padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Architecture Note</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', lineHeight: 1.65 }}>{guide.architectureNote}</p>
        </div>
      )}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>🇦🇺 Australian Context</p>
        <p style={{ fontSize: '0.85rem', color: '#1e3a8a', lineHeight: 1.65 }}>{guide.australianContext}</p>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function LearnIBMPage() {
  const [videos,      setVideos]      = useState<Video[]>([]);
  const [nextToken,   setNextToken]   = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [progress,    setProgress]    = useState<Record<string, Progress>>({});
  const [selected,    setSelected]    = useState<Video | null>(null);
  const [tab,         setTab]         = useState<'guide' | 'quiz'>('guide');
  const [guide,       setGuide]       = useState<StudyGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError,   setGuideError]   = useState('');
  const [questions,   setQuestions]   = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const sessionRef = useRef<Video | null>(null);

  useEffect(() => {
    loadVideos();
    fetch('/api/learn/progress?channel=ibm')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Progress> = {};
        (d.progress ?? []).forEach((p: Progress) => { map[p.video_id] = p; });
        setProgress(map);
      })
      .catch(() => {});
  }, []);

  const loadVideos = async (pageToken?: string) => {
    setLoading(true);
    const url = `/api/learn/videos${pageToken ? `?pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    setVideos(prev => pageToken ? [...prev, ...(data.videos ?? [])] : (data.videos ?? []));
    setNextToken(data.nextPageToken ?? null);
    setLoading(false);
  };

  const openVideo = async (video: Video) => {
    setSelected(video);
    sessionRef.current = video;
    setGuide(null);
    setGuideError('');
    setGuideLoading(true);
    setTab('guide');
    setQuestions([]);

    // Stream analysis — Gemini reads the video URL directly
    const res = await fetch('/api/learn/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id, videoTitle: video.title }),
    });

    if (!res.ok) { setGuideError('Analysis failed.'); setGuideLoading(false); return; }

    // Collect streamed text
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
    }

    const match = accumulated.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        setGuide(JSON.parse(match[0]));
      } catch { setGuideError('Could not parse study guide.'); }
    } else {
      setGuideError('Study guide generation failed.');
    }
    setGuideLoading(false);
  };

  const loadQuiz = async () => {
    if (!guide || !selected) return;
    setQuizLoading(true);
    setTab('quiz');
    const res = await fetch('/api/learn/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: selected.id, videoTitle: selected.title, studyGuide: guide }),
    });
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setQuizLoading(false);
  };

  const onQuizComplete = async (score: number) => {
    if (!selected) return;
    setProgress(prev => ({
      ...prev,
      [selected.id]: { ...(prev[selected.id] ?? { video_id: selected.id, completed: false }), quiz_score: score, quiz_taken: true },
    }));
    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: selected.id, videoTitle: selected.title, quizScore: score, completed: score >= 60 }),
    }).catch(() => {});
  };

  /* ── Video session view ── */
  if (selected) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <button onClick={() => setSelected(null)} style={{
          background: 'none', border: 'none', color: 'var(--terracotta)',
          cursor: 'pointer', fontSize: '0.88rem', marginBottom: '1.5rem', padding: 0,
        }}>
          ← Back to videos
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Video embed */}
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${selected.id}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.35, marginBottom: '1.5rem' }}>
              {selected.title}
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--parchment)', paddingBottom: '0.1rem' }}>
              {(['guide', 'quiz'] as const).map(t => (
                <button key={t} onClick={() => { if (t === 'quiz' && questions.length === 0) loadQuiz(); else setTab(t); }}
                  style={{
                    padding: '0.45rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '0.88rem', fontWeight: tab === t ? 700 : 400,
                    color: tab === t ? 'var(--terracotta)' : 'var(--text-muted)',
                    borderBottom: tab === t ? '2px solid var(--terracotta)' : '2px solid transparent',
                    marginBottom: '-2px',
                  }}>
                  {t === 'guide' ? '📖 Study Guide' : '🧠 Quiz'}
                </button>
              ))}
            </div>

            {tab === 'guide' && (
              guideLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  Analysing video with Gemini…
                </div>
              ) : guideError ? (
                <p style={{ color: '#dc2626', fontSize: '0.88rem' }}>{guideError}</p>
              ) : guide ? (
                <StudyGuideView guide={guide} />
              ) : null
            )}

            {tab === 'quiz' && (
              quizLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Generating quiz…</div>
              ) : questions.length > 0 ? (
                <Quiz questions={questions} onComplete={onQuizComplete} />
              ) : null
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Video grid ── */
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <section style={{ paddingTop: '4rem', paddingBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          <Link href="/learn" style={{ color: 'var(--terracotta)', textDecoration: 'none' }}>← Learning</Link>
        </p>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Learn with IBM 🎥
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '52ch' }}>
          Pick a video → get a Claude-generated study guide → take the quiz.
          Cloud, AI, DevOps, and distributed systems explained clearly.
        </p>
      </section>

      {loading && videos.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: '3rem 0', textAlign: 'center' }}>Loading videos…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem', paddingBottom: '2rem' }}>
            {videos.map(v => {
              const p = progress[v.id];
              return (
                <button key={v.id} onClick={() => openVideo(v)} style={{
                  background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                  borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                  textAlign: 'left', padding: 0, transition: 'box-shadow 0.15s',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                    <Image src={v.thumbnail} alt={v.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 280px" />
                    {p?.completed && (
                      <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#10b981', color: 'white',
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.15em 0.5em', borderRadius: '5px' }}>
                        ✓ Done
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--brown-dark)', lineHeight: 1.4, marginBottom: '0.4rem',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(v.publishedAt)}</span>
                      {p?.quiz_taken && p.quiz_score !== null && <ScoreBadge score={p.quiz_score} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {nextToken && (
            <div style={{ textAlign: 'center', paddingBottom: '4rem' }}>
              <button onClick={() => loadVideos(nextToken)} disabled={loading}
                style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '99px',
                  padding: '0.55rem 1.5rem', fontSize: '0.88rem', cursor: 'pointer', color: 'var(--brown-dark)' }}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
