'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface VideoMeta { id: string; title: string; channelTitle: string; thumbnail: string; duration: string }

interface Concept { term: string; definition: string; example: string; whyMatters: string }
interface Section { title: string; timestamp: string; summary: string }
interface UseCase { scenario: string; description: string; industry: string }
interface Infographic {
  title: string; tagline: string; palette: string;
  stats:     Array<{ value: string; label: string; icon: string }>;
  flow:      Array<{ step: string; detail: string }>;
  keyPoints: string[];
}
interface StudyGuide {
  summary: string;
  essay?: string;
  keyConcepts: Concept[];
  sections: Section[];
  useCases: UseCase[];
  coreInsights: string[];
  architectureNote: string | null;
  australianContext: string;
  studyTips: string[];
  videoType: string;
  audioScript: string;
  infographic: Infographic;
}
interface QuizQuestion { q: string; options: string[]; answer: number; explanation: string }

type TabId = 'guide' | 'cards' | 'audio' | 'quiz';

/* ─── Constants ──────────────────────────────────────────────────────── */
const TABS: Array<{ id: TabId; emoji: string; label: string }> = [
  { id: 'guide',  emoji: '📖', label: 'Study Guide' },
  { id: 'cards',  emoji: '🃏', label: 'Flashcards'  },
  { id: 'audio',  emoji: '🔊', label: 'Audio'        },
  { id: 'quiz',   emoji: '🧠', label: 'Quiz'         },
];

const PALETTE: Record<string, { bg: string; text: string; accent: string; subtle: string }> = {
  blue:   { bg: '#0f172a', text: '#e2e8f0', accent: '#3b82f6', subtle: '#1e3a5f' },
  green:  { bg: '#052e16', text: '#dcfce7', accent: '#22c55e', subtle: '#14532d' },
  purple: { bg: '#1e0a3c', text: '#ede9fe', accent: '#a855f7', subtle: '#3b0764' },
  orange: { bg: '#1c0a00', text: '#ffedd5', accent: '#f97316', subtle: '#431407' },
  teal:   { bg: '#042f2e', text: '#ccfbf1', accent: '#14b8a6', subtle: '#134e4a' },
};

function scoreBand(s: number) {
  if (s >= 90) return { label: 'Outstanding!',             color: '#10b981', emoji: '🎉' };
  if (s >= 75) return { label: 'Strong — interview-ready', color: '#10b981', emoji: '💪' };
  if (s >= 60) return { label: 'Good foundation',          color: '#f59e0b', emoji: '👍' };
  return         { label: 'Keep studying',                 color: '#ef4444', emoji: '📚' };
}

/* ─── Helpers: bold markdown renderer ───────────────────────────────── */
function renderBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700, color: 'var(--brown-dark)' }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

/* ─── Tab 1: Study Guide ────────────────────────────────────────────── */
function StudyGuideTab({ guide }: { guide: StudyGuide }) {
  const [openConcept, setOpenConcept] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Essay — professional flowing summary with bold key terms */}
      {guide.essay ? (
        <div>
          <p style={{
            fontSize: '0.93rem', color: 'var(--brown-dark)', lineHeight: 1.85,
            margin: 0, fontFamily: "'Lora', serif",
          }}>
            {renderBold(guide.essay)}
          </p>
        </div>
      ) : guide.summary ? (
        <div>
          <Label>Overview</Label>
          <p style={{ fontSize: '0.9rem', color: 'var(--brown-dark)', lineHeight: 1.8, margin: 0 }}>
            {guide.summary}
          </p>
        </div>
      ) : (guide.coreInsights?.length ?? 0) > 0 ? (
        <div>
          <Label>Key Takeaways</Label>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(guide.coreInsights ?? []).map((ins, i) => (
              <li key={i} style={{ fontSize: '0.87rem', color: 'var(--brown-dark)', lineHeight: 1.65 }}>{ins}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Sections / chapter breakdown */}
      {(guide.sections?.length ?? 0) > 0 && (
        <div>
          <Label>Chapter Breakdown</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {(guide.sections ?? []).map((s, i) => (
              <div key={i} style={{
                padding: '0.75rem 0',
                borderBottom: i < (guide.sections?.length ?? 0) - 1 ? '1px solid var(--parchment)' : 'none',
              }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--terracotta)',
                  marginBottom: '0.2rem' }}>
                  {s.timestamp}
                </span>
                <p style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--brown-dark)',
                  margin: '0 0 0.2rem' }}>{s.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {s.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Concepts accordion */}
      {(guide.keyConcepts?.length ?? 0) > 0 && (
      <div>
        <Label>Key Concepts ({guide.keyConcepts?.length ?? 0})</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {(guide.keyConcepts ?? []).map((c, i) => (
            <div key={i} style={{ border: '1px solid var(--parchment)', borderRadius: '10px', overflow: 'hidden' }}>
              <button onClick={() => setOpenConcept(openConcept === i ? null : i)} style={{
                width: '100%', textAlign: 'left', padding: '0.8rem 1rem',
                background: openConcept === i ? '#faf7f2' : 'var(--warm-white)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brown-dark)' }}>{c.term}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flexShrink: 0 }}>
                  {openConcept === i ? '▲' : '▼'}
                </span>
              </button>
              {openConcept === i && (
                <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid var(--parchment)',
                  background: '#faf7f2', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', lineHeight: 1.65, margin: 0 }}>
                    {c.definition}
                  </p>
                  {c.example && (
                    <div style={{ background: 'var(--warm-white)', borderRadius: '7px',
                      padding: '0.6rem 0.8rem', borderLeft: '3px solid var(--terracotta)' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)',
                        marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Example
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--brown-dark)', lineHeight: 1.6, margin: 0 }}>
                        {c.example}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55,
                    display: 'flex', gap: '0.35rem', margin: 0 }}>
                    <span>💼</span><span>{c.whyMatters}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Use Cases */}
      {(guide.useCases?.length ?? 0) > 0 && (
        <div>
          <Label>Real-World Use Cases</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(guide.useCases ?? []).map((u, i) => (
              <div key={i} style={{ padding: '0.9rem 1rem', borderRadius: '10px',
                border: '1px solid var(--parchment)', background: 'var(--warm-white)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--brown-dark)', margin: 0 }}>
                    {u.scenario}
                  </p>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15em 0.5em',
                    borderRadius: '4px', background: '#f0fdf4', color: '#166534', whiteSpace: 'nowrap' }}>
                    {u.industry}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {u.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AU Context */}
      {guide.australianContext && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
            🇦🇺 Australian Market
          </p>
          <p style={{ fontSize: '0.84rem', color: '#1e3a8a', lineHeight: 1.65, margin: 0 }}>
            {guide.australianContext}
          </p>
        </div>
      )}

      {/* Core Insights */}
      {(guide.coreInsights?.length ?? 0) > 0 && (
      <div>
        <Label>Core Insights</Label>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {(guide.coreInsights ?? []).map((ins, i) => (
            <li key={i} style={{ fontSize: '0.87rem', color: 'var(--brown-dark)', lineHeight: 1.65 }}>{ins}</li>
          ))}
        </ol>
      </div>
      )}

      {/* Architecture note */}
      {guide.architectureNote && (
        <div style={{ background: '#f8f4ef', border: '1px solid var(--parchment)', borderRadius: '10px', padding: '1rem' }}>
          <Label muted>Architecture Note</Label>
          <p style={{ fontSize: '0.84rem', color: 'var(--brown-dark)', lineHeight: 1.65, margin: 0 }}>
            {guide.architectureNote}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Tab 2: Flashcards ─────────────────────────────────────────────── */
function FlashcardsTab({ concepts }: { concepts: Concept[] }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState<Set<number>>(new Set());
  const [shuffled, setShuffled] = useState<number[]>(() => concepts.map((_, i) => i));

  const card = concepts[shuffled[idx]];
  const total = concepts.length;

  const goTo = (next: number) => { setFlipped(false); setTimeout(() => setIdx(next), 180); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === 'ArrowRight') goTo(Math.min(total - 1, idx + 1));
      if (e.key === 'ArrowLeft')  goTo(Math.max(0, idx - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const shuffle = () => {
    const arr = [...shuffled].sort(() => Math.random() - 0.5);
    setShuffled(arr); setIdx(0); setFlipped(false); setKnown(new Set());
  };

  if (!card) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
      <style>{`
        .fc { perspective: 1000px; width: 100%; height: 210px; cursor: pointer; }
        .fc-inner { position: relative; width: 100%; height: 100%;
          transition: transform 0.42s cubic-bezier(.4,0,.2,1); transform-style: preserve-3d; }
        .fc-inner.flip { transform: rotateY(180deg); }
        .fc-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 14px;
          display: flex; flex-direction: column; justify-content: center;
          align-items: center; padding: 1.5rem; text-align: center; }
        .fc-front { background: var(--warm-white); border: 2px solid var(--parchment); }
        .fc-back  { background: #faf7f2; border: 2px solid #ddd1c0; transform: rotateY(180deg); }
      `}</style>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
        {shuffled.map((realIdx, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: '9px', height: '9px', borderRadius: '50%', border: 'none',
            cursor: 'pointer', padding: 0, flexShrink: 0,
            background: known.has(realIdx) ? '#10b981' : i === idx ? 'var(--terracotta)' : 'var(--parchment)',
          }} />
        ))}
      </div>

      {/* Card */}
      <div className="fc" onClick={() => setFlipped(f => !f)}>
        <div className={`fc-inner${flipped ? ' flip' : ''}`}>
          <div className="fc-face fc-front">
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
              Tap to flip • Space
            </p>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.4rem', fontWeight: 700,
              color: 'var(--brown-dark)', lineHeight: 1.25, margin: 0 }}>
              {card.term}
            </h3>
          </div>
          <div className="fc-face fc-back">
            <p style={{ fontSize: '0.87rem', color: 'var(--brown-dark)', lineHeight: 1.65,
              marginBottom: '0.5rem', margin: 0 }}>
              {card.definition}
            </p>
            {card.example && (
              <p style={{ fontSize: '0.78rem', color: 'var(--terracotta)', lineHeight: 1.55,
                marginTop: '0.6rem', fontStyle: 'italic', margin: 0 }}>
                e.g. {card.example}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0}
          style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--parchment)',
            background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer',
            color: idx === 0 ? '#ccc' : 'var(--brown-dark)', fontFamily: 'inherit', fontSize: '0.85rem' }}>
          ← Prev
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '48px', textAlign: 'center' }}>
          {idx + 1} / {total}
        </span>
        <button onClick={() => goTo(Math.min(total - 1, idx + 1))} disabled={idx === total - 1}
          style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--parchment)',
            background: 'transparent', cursor: idx === total - 1 ? 'default' : 'pointer',
            color: idx === total - 1 ? '#ccc' : 'var(--brown-dark)', fontFamily: 'inherit', fontSize: '0.85rem' }}>
          Next →
        </button>
      </div>

      {/* Got it / Review buttons — only when flipped */}
      {flipped && (
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => { setKnown(p => new Set([...p, shuffled[idx]])); goTo(Math.min(total-1, idx+1)); }}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none',
              background: '#f0fdf4', color: '#166534', fontWeight: 600,
              fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            ✓ Got it
          </button>
          <button onClick={() => { setKnown(p => { const s=new Set(p); s.delete(shuffled[idx]); return s; }); goTo(Math.min(total-1, idx+1)); }}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none',
              background: '#fef2f2', color: '#991b1b', fontWeight: 600,
              fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ Review again
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {known.size}/{total} known · Space to flip · ←→ navigate
        </span>
        <button onClick={shuffle} style={{ fontSize: '0.74rem', color: 'var(--terracotta)',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          ⇌ Shuffle
        </button>
      </div>
    </div>
  );
}

/* ─── Tab 3: Audio ───────────────────────────────────────────────────── */
function AudioTab({ guide, title }: { guide: StudyGuide; title: string }) {
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [speed,     setSpeed]     = useState(1);
  const [supported, setSupported] = useState(true);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) setSupported(false);
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const script = guide.audioScript || [
    `Here's a 5-minute audio summary of: ${title}.`,
    guide.summary,
    'The key insights are:',
    ...(guide.coreInsights ?? []),
    'Key concepts to know:',
    ...(guide.keyConcepts ?? []).slice(0, 5).map(c => `${c.term}: ${c.definition}`),
    guide.australianContext ? `Australian context: ${guide.australianContext}` : '',
    'That wraps up your 5-minute summary. Review the flashcards and take the quiz to lock in what you learned.',
  ].filter(Boolean).join(' ');

  const toggle = () => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    setProgress(0);
    const utt = new SpeechSynthesisUtterance(script);
    utt.rate  = speed;
    utt.pitch = 1;
    utt.lang  = 'en-AU';
    const voices = window.speechSynthesis.getVoices();
    const voice  = voices.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('en'))
      ?? voices.find(v => v.lang.startsWith('en-AU'))
      ?? voices.find(v => v.lang.startsWith('en'));
    if (voice) utt.voice = voice;
    utt.onboundary = (e) => { if (e.name === 'word') setProgress(Math.round((e.charIndex / script.length) * 100)); };
    utt.onend  = () => { setPlaying(false); setProgress(100); };
    utt.onerror = () => { setPlaying(false); };
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setPlaying(true);
  };

  const restart = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setProgress(0);
    setTimeout(toggle, 100);
  };

  const approxMins = Math.ceil(script.split(' ').length / (speed * 130));

  if (!supported) return (
    <div style={{ padding: '1rem', background: '#fef9c3', borderRadius: '10px' }}>
      <p style={{ fontSize: '0.84rem', color: '#854d0e' }}>
        Audio playback requires a browser with Web Speech API support (Chrome or Safari recommended).
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        A ~{approxMins}-minute spoken summary — condensed from the full video. Great for commutes or passive review.
      </p>

      {/* Waveform visualiser */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '3px', height: '48px', padding: '0.5rem' }}>
        <style>{`
          @keyframes wave { 0%,100%{height:4px} 50%{height:28px} }
          .wbar { width:3px; border-radius:99px; background:var(--terracotta);
            animation: wave 1s ease-in-out infinite; opacity:0.7; }
        `}</style>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className={playing ? 'wbar' : ''} style={{
            width: '3px', borderRadius: '99px',
            background: playing ? 'var(--terracotta)' : 'var(--parchment)',
            height: playing ? undefined : `${4 + Math.sin(i * 0.7) * 12 + 8}px`,
            animationDelay: `${(i * 0.04) % 1}s`,
            animationDuration: `${0.7 + (i % 5) * 0.1}s`,
          }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--parchment)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--terracotta)',
          borderRadius: '99px', transition: 'width 0.5s linear' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={toggle} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: playing ? '#fef2f2' : 'var(--terracotta)',
          color: playing ? '#dc2626' : 'white', border: playing ? '1px solid #fca5a5' : 'none',
          borderRadius: '99px', padding: '0.65rem 1.5rem',
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {playing ? '⏸ Pause' : progress > 0 ? '▶ Resume' : '▶ Play 5-min summary'}
        </button>
        {progress > 0 && (
          <button onClick={restart} style={{ background: 'none', border: '1px solid var(--parchment)',
            borderRadius: '99px', padding: '0.65rem 1rem', fontSize: '0.85rem',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺
          </button>
        )}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {progress === 100 ? '✓ Done' : progress > 0 ? `${progress}%` : ''}
        </span>
      </div>

      {/* Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
        {[0.75, 1, 1.25, 1.5].map(s => (
          <button key={s} onClick={() => { setSpeed(s); if (playing) { window.speechSynthesis.cancel(); setPlaying(false); setProgress(0); } }}
            style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--parchment)',
              background: speed === s ? 'var(--terracotta)' : 'transparent',
              color: speed === s ? 'white' : 'var(--brown-dark)',
              fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {s}×
          </button>
        ))}
      </div>

      {/* Script preview */}
      <div style={{ background: 'var(--parchment)', borderRadius: '10px', padding: '1rem',
        maxHeight: '140px', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
          Script preview
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          {script.slice(0, 320)}…
        </p>
      </div>
    </div>
  );
}

/* ─── Tab 4: Mind Map ────────────────────────────────────────────────── */
const NODE_COLORS = ['#c2410c','#b45309','#15803d','#1d4ed8','#7c3aed','#be185d','#0e7490','#4d7c0f'];

function MindMapTab({ guide, title }: { guide: StudyGuide; title: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const concepts = (guide.keyConcepts ?? []).slice(0, 8);
  const n = concepts.length;
  const W = 700, H = 440, cx = W / 2, cy = H / 2, R = 165;

  const nodes = concepts.map((c, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle), ...c, color: NODE_COLORS[i % NODE_COLORS.length] };
  });

  const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  const shortTitle = trunc(title, 22);
  const titleLines = shortTitle.length > 11 ? [shortTitle.slice(0, 11), shortTitle.slice(11)] : [shortTitle];
  const active = selected !== null ? selected : hovered;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ borderRadius: '12px', border: '1px solid var(--parchment)', overflow: 'hidden', background: '#fdfcfa' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '280px', display: 'block' }}>
          {nodes.map((node, i) => (
            <line key={i} x1={cx} y1={cy} x2={node.x} y2={node.y}
              stroke={active === i ? node.color : '#e5e7eb'}
              strokeWidth={active === i ? 2.5 : 1.5}
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
          ))}
          {/* Center */}
          <rect x={cx - 64} y={cy - 30} width={128} height={60} rx={14} fill="var(--terracotta)" />
          {titleLines.map((line, i) => (
            <text key={i} x={cx} y={cy - 6 + i * 17} textAnchor="middle"
              fill="white" fontSize="11" fontWeight="700" fontFamily="serif">{line}</text>
          ))}
          {/* Concept nodes */}
          {nodes.map((node, i) => {
            const lines = node.term.length > 13
              ? [node.term.slice(0, 13), trunc(node.term.slice(13), 13)]
              : [node.term];
            const isActive = active === i;
            return (
              <g key={i} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === i ? null : i)}>
                <rect x={node.x - 56} y={node.y - 24} width={112} height={48} rx={10}
                  fill={isActive ? node.color : 'var(--warm-white)'}
                  stroke={isActive ? node.color : '#e5e7eb'} strokeWidth={1.5}
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }} />
                {lines.map((line, li) => (
                  <text key={li} x={node.x} y={node.y - 5 + li * 14}
                    textAnchor="middle" fill={isActive ? 'white' : '#3b1f0e'}
                    fontSize="10.5" fontWeight="600" style={{ transition: 'fill 0.2s', pointerEvents: 'none' }}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected concept detail */}
      {selected !== null && (
        <div style={{ padding: '0.9rem 1rem', background: 'var(--warm-white)',
          border: `2px solid ${nodes[selected].color}`, borderRadius: '10px',
          animation: 'fadein 0.2s ease' }}>
          <p style={{ fontWeight: 700, fontSize: '0.92rem',
            color: nodes[selected].color, marginBottom: '0.4rem' }}>
            {nodes[selected].term}
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--brown-dark)', lineHeight: 1.65, marginBottom: '0.4rem' }}>
            {nodes[selected].definition}
          </p>
          {nodes[selected].example && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55, fontStyle: 'italic' }}>
              e.g. {nodes[selected].example}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Click a concept node to see its definition
      </p>
    </div>
  );
}

/* ─── Tab 5: Quiz ────────────────────────────────────────────────────── */
function QuizTab({ guide, videoId, videoTitle, onScoreSaved, prefetchedQuestions }: {
  guide: StudyGuide; videoId: string; videoTitle: string;
  onScoreSaved?: (s: number) => void;
  prefetchedQuestions?: QuizQuestion[] | null;
}) {
  const [questions,  setQuestions]  = useState<QuizQuestion[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [started,    setStarted]    = useState(false);
  const [quizError,  setQuizError]  = useState('');
  const [idx,        setIdx]        = useState(0);
  const [selected,   setSelected]   = useState<number | null>(null);
  const [answers,    setAnswers]    = useState<boolean[]>([]);
  const [done,       setDone]       = useState(false);

  const start = async () => {
    // Use pre-fetched questions if available — instant start
    if (prefetchedQuestions?.length) {
      setQuestions(prefetchedQuestions);
      setStarted(true);
      return;
    }
    setLoading(true);
    setQuizError('');
    const res  = await fetch('/api/learn/quiz', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, videoTitle, studyGuide: guide }),
    });
    if (!res.ok) {
      setLoading(false);
      setQuizError(res.status === 401
        ? 'Sign in to generate quizzes.'
        : res.status === 403
          ? 'Subscribe to unlock quizzes. Visit the pricing page to upgrade.'
          : 'Could not generate quiz. Please try again.');
      return;
    }
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
    setStarted(true);
  };

  const next = () => {
    const q = questions[idx];
    const correct = selected === q.answer;
    const newAns = [...answers, correct];
    setAnswers(newAns);
    if (idx + 1 >= questions.length) {
      const score = Math.round((newAns.filter(Boolean).length / questions.length) * 100);
      setDone(true);
      onScoreSaved?.(score);
      fetch('/api/learn/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, videoTitle, quizScore: score, completed: score >= 60 }),
      }).catch(() => {});
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  const retry = () => { setIdx(0); setSelected(null); setAnswers([]); setDone(false); setStarted(false); };

  if (!started && !loading) return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧠</p>
      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
        Ready to test yourself?
      </p>
      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
        Review the Study Guide and Flashcards first, then take the quiz to lock in what you learned.
      </p>
      {quizError && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
          padding: '0.9rem 1.2rem', marginBottom: '1.2rem', fontSize: '0.87rem', color: '#92400e', lineHeight: 1.6 }}>
          {quizError}{' '}
          {quizError.includes('Subscribe') && (
            <a href="/pricing" style={{ color: 'var(--terracotta)', fontWeight: 600, textDecoration: 'none' }}>View pricing →</a>
          )}
        </div>
      )}
      {prefetchedQuestions?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>✓ Questions ready</span>
          <button onClick={start} style={{ background: 'var(--terracotta)', color: 'white', border: 'none',
            borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '0.92rem',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Start quiz →
          </button>
        </div>
      ) : (
        <button onClick={start} style={{ background: 'var(--terracotta)', color: 'white', border: 'none',
          borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '0.92rem',
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Start quiz →
        </button>
      )}
    </div>
  );

  if (loading) return (
    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⟳</span>
      Generating your questions…
    </p>
  );

  if (done) {
    const score = Math.round((answers.filter(Boolean).length / questions.length) * 100);
    const { label, color, emoji } = scoreBand(score);
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{emoji}</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>{score}%</div>
        <div style={{ fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>{label}</div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {answers.filter(Boolean).length} / {questions.length} correct
        </div>
        <button onClick={retry} style={{ padding: '0.55rem 1.3rem', borderRadius: '8px',
          border: '1px solid var(--parchment)', background: 'transparent',
          color: 'var(--brown-dark)', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit' }}>
          Try again
        </button>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem',
        color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        <span>Q {idx + 1} / {questions.length}</span>
        <span>{answers.filter(Boolean).length} correct</span>
      </div>
      <div style={{ height: '3px', background: 'var(--parchment)', borderRadius: '99px', marginBottom: '1.5rem' }}>
        <div style={{ height: '100%', width: `${(idx / questions.length) * 100}%`,
          background: 'var(--terracotta)', borderRadius: '99px', transition: 'width 0.3s' }} />
      </div>
      <p style={{ fontWeight: 600, color: 'var(--brown-dark)', lineHeight: 1.55,
        fontSize: '0.92rem', marginBottom: '1.25rem' }}>{q.q}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.25rem' }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--warm-white)', border = '1px solid var(--parchment)', color = 'var(--brown-dark)';
          if (selected !== null) {
            if (i === q.answer) { bg = '#f0fdf4'; border = '1px solid #86efac'; color = '#166534'; }
            else if (i === selected) { bg = '#fef2f2'; border = '1px solid #fca5a5'; color = '#991b1b'; }
          }
          return (
            <button key={i} onClick={() => { if (selected === null) setSelected(i); }} style={{
              textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '10px',
              border, background: bg, color, fontSize: '0.87rem',
              cursor: selected !== null ? 'default' : 'pointer',
              lineHeight: 1.45, fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{opt}</button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.65,
          background: 'var(--parchment)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          {q.explanation}
        </div>
      )}
      <button onClick={next} disabled={selected === null} style={{
        background: selected !== null ? 'var(--terracotta)' : '#e5e7eb',
        color: selected !== null ? 'white' : '#9ca3af', border: 'none',
        borderRadius: '10px', padding: '0.6rem 1.5rem',
        fontSize: '0.9rem', fontWeight: 600,
        cursor: selected !== null ? 'pointer' : 'default', fontFamily: 'inherit',
      }}>
        {idx + 1 >= questions.length ? 'See results →' : 'Next →'}
      </button>
    </div>
  );
}

/* ─── Tab 6: Infographic ─────────────────────────────────────────────── */
function InfographicTab({ guide, title }: { guide: StudyGuide; title: string }) {
  const raw = guide.infographic;
  const key = raw?.palette && PALETTE[raw.palette] ? raw.palette : 'blue';
  const pal = PALETTE[key];

  if (!raw) return (
    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
      Infographic not available for this video.
    </p>
  );

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', background: pal.bg, color: pal.text }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${pal.subtle}` }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: pal.accent,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
          Visual Summary
        </p>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', fontWeight: 700,
          color: pal.text, marginBottom: '0.25rem', lineHeight: 1.3 }}>
          {raw.title || title}
        </h2>
        <p style={{ fontSize: '0.82rem', color: pal.accent, margin: 0 }}>{raw.tagline}</p>
      </div>

      {/* Stats */}
      {raw.stats?.length > 0 && (
        <div style={{ padding: '1.25rem 1.5rem', display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(raw.stats.length, 3)}, 1fr)`,
          gap: '0.75rem', borderBottom: `1px solid ${pal.subtle}` }}>
          {raw.stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0.75rem',
              background: pal.subtle, borderRadius: '10px' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pal.accent,
                lineHeight: 1, marginBottom: '0.2rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: pal.text, opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Flow */}
      {raw.flow?.length > 0 && (
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${pal.subtle}` }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: pal.accent,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            How it works
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {raw.flow.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%',
                  background: pal.accent, color: pal.bg, fontSize: '0.72rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.84rem', color: pal.text,
                    marginBottom: '0.15rem' }}>{f.step}</p>
                  <p style={{ fontSize: '0.78rem', color: pal.text, opacity: 0.7,
                    lineHeight: 1.55, margin: 0 }}>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key points */}
      {raw.keyPoints?.length > 0 && (
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: pal.accent,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            Key points
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {raw.keyPoints.map((point, i) => (
              <li key={i} style={{ fontSize: '0.83rem', color: pal.text, opacity: 0.85, lineHeight: 1.6 }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function Label({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p style={{ fontSize: '0.68rem', fontWeight: 700,
      color: muted ? 'var(--text-muted)' : 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
      {children}
    </p>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      {[100, 75, 88, 60, 80, 50].map((w, i) => (
        <div key={i} style={{ height: '12px', borderRadius: '6px',
          background: 'var(--parchment)', width: `${w}%`,
          animation: `shimmer 1.4s ease-in-out infinite`,
          animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

/* ─── Loading stages indicator ──────────────────────────────────────── */
const STAGES = [
  { key: 'transcript', label: 'Fetching transcript' },
  { key: 'analysing',  label: 'Analysing content'   },
  { key: 'building',   label: 'Building guide'       },
] as const;

function LoadingStages({ stage }: { stage: 'transcript' | 'analysing' | 'building' }) {
  const current = STAGES.findIndex(s => s.key === stage);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {STAGES.map((s, i) => {
          const done    = i < current;
          const active  = i === current;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#10b981' : active ? 'var(--terracotta)' : 'var(--parchment)',
                transition: 'background 0.3s',
              }}>
                {done
                  ? <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>
                  : active
                    ? <span style={{ width: '8px', height: '8px', borderRadius: '50%',
                        background: 'white', animation: 'pulse 1s ease-in-out infinite',
                        display: 'inline-block' }} />
                    : null
                }
              </div>
              <span style={{
                fontSize: '0.85rem', fontWeight: active ? 600 : 400,
                color: done ? '#10b981' : active ? 'var(--brown-dark)' : '#ccc',
                transition: 'color 0.3s',
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <Skeleton />
    </div>
  );
}

/* ─── Streaming essay preview ────────────────────────────────────────── */
function StreamingEssayPreview({ text, stage }: { text: string; stage: 'transcript' | 'analysing' | 'building' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <LoadingStages stage={stage} />
      <div style={{ borderTop: '1px solid var(--parchment)', paddingTop: '1.25rem' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
          Overview — streaming live
        </p>
        <p style={{
          fontSize: '0.93rem', color: 'var(--brown-dark)', lineHeight: 1.85,
          margin: 0, fontFamily: "'Lora', serif",
        }}>
          {text}
          <span style={{
            display: 'inline-block', width: '2px', height: '1em',
            background: 'var(--terracotta)', marginLeft: '2px', verticalAlign: 'text-bottom',
            animation: 'blink 0.8s step-end infinite',
          }} />
        </p>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function StudySessionPage() {
  const params  = useParams();
  const videoId = params.videoId as string;

  const [meta,           setMeta]           = useState<VideoMeta | null>(null);
  const [metaError,      setMetaError]      = useState('');
  const [guide,          setGuide]          = useState<StudyGuide | null>(null);
  const [guideLoading,   setGuideLoading]   = useState(false);
  const [guideError,     setGuideError]     = useState('');
  const [activeTab,      setActiveTab]      = useState<TabId>('guide');
  const [loadingStage,   setLoadingStage]   = useState<'transcript' | 'analysing' | 'building'>('transcript');
  const [streamingEssay, setStreamingEssay] = useState('');

  useEffect(() => {
    fetch(`/api/learn/video-meta?videoId=${videoId}`)
      .then(r => r.json())
      .then(d => d.error ? setMetaError(d.error) : setMeta(d))
      .catch(() => setMetaError('Could not load video'));
  }, [videoId]);

  const loadGuide = useCallback(async (videoTitle: string, channelTitle: string) => {
    setGuideLoading(true); setGuideError(''); setStreamingEssay(''); setLoadingStage('transcript');
    const res = await fetch('/api/learn/analyse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, videoTitle, channelTitle }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        setGuideError('Sign in to analyse videos and generate study guides.');
      } else if (res.status === 403) {
        setGuideError('Subscribe to unlock AI study guides and quizzes. Visit the pricing page to upgrade.');
      } else {
        try {
          const errData = await res.json();
          setGuideError(errData.error ?? 'Could not analyse this video.');
        } catch {
          setGuideError('Could not analyse this video.');
        }
      }
      setGuideLoading(false); return;
    }

    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const d = await res.json();
      d.error ? setGuideError(d.error) : setGuide(d);
      setGuideLoading(false); return;
    }

    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let acc = '';
    let firstByteReceived = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });

      // Stage: first byte means transcript was fetched, now analysing
      if (!firstByteReceived) {
        firstByteReceived = true;
        setLoadingStage('analysing');
      }

      // Extract essay text as it streams in and show it live
      const essayMatch = acc.match(/"essay"\s*:\s*"((?:[^"\\]|\\.|\n)*)(?:"|$)/);
      if (essayMatch) {
        setLoadingStage('building');
        const partial = essayMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        setStreamingEssay(partial);
      }
    }

    const match = acc.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.error) {
          setGuideError(parsed.error);
        } else if (!parsed.essay && !parsed.summary && !(parsed.keyConcepts?.length)) {
          setGuideError('Could not read this video. It may be private, a live stream, or temporarily unavailable — try again or open in NotebookLM.');
        } else {
          setStreamingEssay('');
          setGuide(parsed);
        }
      } catch { setGuideError('Could not parse the study guide.'); }
    } else {
      setGuideError('Could not analyse this video. It may be private, too long, or music-only.');
    }
    setGuideLoading(false);
  }, [videoId]);

  const [prefetchedQuiz, setPrefetchedQuiz] = useState<QuizQuestion[] | null>(null);
  const quizPrefetchStarted = useRef(false);

  // Pre-fetch quiz in background once guide is ready
  useEffect(() => {
    if (!guide || quizPrefetchStarted.current) return;
    quizPrefetchStarted.current = true;
    fetch('/api/learn/quiz', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, videoTitle: meta?.title ?? videoId, studyGuide: guide }),
    })
      .then(r => r.json())
      .then(d => { if (d.questions?.length) setPrefetchedQuiz(d.questions); })
      .catch(() => {});
  }, [guide, videoId, meta?.title]);

  // Fire analysis immediately — do not wait for video-meta (RapidAPI may be slow/unavailable)
  const analysisStarted = useRef(false);
  useEffect(() => {
    if (!analysisStarted.current) {
      analysisStarted.current = true;
      // Start with videoId as title placeholder; meta may arrive before or after
      loadGuide(meta?.title ?? videoId, meta?.channelTitle ?? '');
    }
  }, [videoId, loadGuide]); // eslint-disable-line react-hooks/exhaustive-deps


  const saveToNLM = () => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
    window.open('https://notebooklm.google.com', '_blank');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <style>{`
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .study-layout { flex-direction: column !important; }
          .video-col { position: static !important; width: auto !important; }
          .panel-col { width: auto !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ paddingTop: '1.5rem', paddingBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/learn/youtube" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontSize: '0.88rem' }}>
          ← Videos
        </Link>
        <button onClick={saveToNLM} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.38rem 0.85rem', borderRadius: '99px',
          border: '1px solid #bfdbfe', background: '#eff6ff',
          color: '#1d4ed8', fontSize: '0.76rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }} title="Copies the YouTube URL and opens NotebookLM — paste as a source for audio overviews and deep questions">
          📓 Save to NotebookLM
        </button>
      </div>

      {/* Side-by-side layout */}
      <div className="study-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>

        {/* ── Left: video column ── */}
        <div className="video-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: '14px',
            overflow: 'hidden', background: '#000', marginBottom: '0.9rem' }}>
            <iframe src={`https://www.youtube.com/embed/${videoId}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
          {meta ? (
            <div>
              <h1 style={{ fontFamily: "'Lora', serif", fontSize: '1.0rem', fontWeight: 700,
                color: 'var(--brown-dark)', lineHeight: 1.4, marginBottom: '0.2rem' }}>
                {meta.title}
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {meta.channelTitle}
              </p>
            </div>
          ) : null /* suppress RapidAPI 'Video not found' — embed works without metadata */}

          {/* Status indicator */}
          {guideLoading && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem',
              background: 'var(--parchment)', borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block', fontSize: '0.9rem' }}>⟳</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {loadingStage === 'transcript' && 'Fetching transcript…'}
                {loadingStage === 'analysing'  && 'Analysing content…'}
                {loadingStage === 'building'   && 'Building study guide…'}
              </span>
            </div>
          )}
          {guide && !guideLoading && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2em 0.6em',
                borderRadius: '5px', background: '#f0fdf4', color: '#166534' }}>
                ✓ Study guide ready
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2em 0.6em',
                borderRadius: '5px', background: 'var(--parchment)', color: 'var(--text-muted)',
                textTransform: 'capitalize' }}>
                {guide.videoType ?? 'video'}
              </span>
            </div>
          )}
        </div>

        {/* ── Right: interactive panel ── */}
        <div className="panel-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '0',
            border: '1px solid var(--parchment)', borderBottom: 'none',
            borderRadius: '12px 12px 0 0', overflow: 'hidden',
            background: '#faf8f5' }}>
            {TABS.map((tab, i) => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!guide && tab.id !== 'guide'}
                style={{
                  flex: 1, padding: '0.7rem 0.25rem', border: 'none',
                  borderRight: i < TABS.length - 1 ? '1px solid var(--parchment)' : 'none',
                  background: activeTab === tab.id ? 'var(--warm-white)' : 'transparent',
                  borderBottom: activeTab === tab.id ? '2px solid var(--terracotta)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--terracotta)'
                    : !guide && tab.id !== 'guide' ? '#ccc' : 'var(--text-muted)',
                  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: activeTab === tab.id ? 700 : 400,
                  cursor: !guide && tab.id !== 'guide' ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                  transition: 'color 0.15s', marginBottom: '-1px',
                }}>
                <span style={{ fontSize: '1.1rem' }}>{tab.emoji}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ border: '1px solid var(--parchment)', borderRadius: '0 0 12px 12px',
            background: 'var(--warm-white)', flex: 1,
            overflowY: 'auto',
            padding: guide ? '1.5rem' : '1.75rem' }}>

            {guideLoading && activeTab === 'guide' && (
              streamingEssay
                ? <StreamingEssayPreview text={streamingEssay} stage={loadingStage} />
                : <LoadingStages stage={loadingStage} />
            )}

            {guideError && !guideLoading && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: '10px', padding: '1.25rem' }}>
                <p style={{ color: '#991b1b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {guideError}
                </p>
                <button onClick={() => loadGuide(meta?.title ?? videoId, meta?.channelTitle ?? '')} style={{
                  background: 'var(--terracotta)', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.84rem',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>Try again</button>
              </div>
            )}

            {guide && !guideLoading && (
              <div style={{ animation: 'fadein 0.3s ease' }}>
                {activeTab === 'guide'  && <StudyGuideTab guide={guide} />}
                {activeTab === 'cards'  && <FlashcardsTab concepts={guide.keyConcepts ?? []} />}
                {activeTab === 'audio'  && <AudioTab guide={guide} title={meta?.title ?? ''} />}
                {activeTab === 'quiz'   && <QuizTab guide={guide} videoId={videoId} videoTitle={meta?.title ?? ''} prefetchedQuestions={prefetchedQuiz} />}
              </div>
            )}

            {!guide && !guideLoading && !guideError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '300px', color: 'var(--text-muted)',
                fontSize: '0.88rem', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>🎥</span>
                Waiting for video info…
              </div>
            )}
          </div>

          {/* Study tips footer */}
          {(guide?.studyTips?.length ?? 0) > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem',
              background: 'var(--parchment)', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
                Next steps
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex',
                flexDirection: 'column', gap: '0.35rem' }}>
                {guide?.studyTips?.map((tip, i) => (
                  <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
