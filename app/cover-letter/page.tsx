'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

const BACKGROUND_KEY = 'cover_letter_background';

const BACKGROUND_PLACEHOLDER = `Example:
- Recent IT graduate (Bachelor of IT, Griffith University, 2025)
- 1 year internship at XYZ as a fullstack developer (React, Node.js, PostgreSQL)
- Built a personal blog with AI digest pipeline and job search engine
- Strong in TypeScript, Next.js, Supabase, REST APIs
- Based in Brisbane, Australia, open to hybrid/remote roles
- Looking for graduate developer or junior fullstack roles`;

interface CoverLetterHistoryItem {
  id: string;
  job_title: string;
  company: string;
  cover_letter: string;
  created_at: string;
}

function CoverLetterContent() {
  const { user }       = useAuth();
  const searchParams   = useSearchParams();

  const [jobTitle,        setJobTitle]        = useState(searchParams.get('title') ?? '');
  const [company,         setCompany]         = useState(searchParams.get('company') ?? '');
  const [jobDescription,  setJobDescription]  = useState(searchParams.get('desc') ?? '');
  const [background,      setBackground]      = useState('');
  const [output,          setOutput]          = useState('');
  const [generating,      setGenerating]      = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [history,         setHistory]         = useState<CoverLetterHistoryItem[]>([]);
  const [showHistory,     setShowHistory]     = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Persist background locally so they don't retype it every time
  useEffect(() => {
    const saved = localStorage.getItem(BACKGROUND_KEY);
    if (saved) setBackground(saved);
  }, []);
  useEffect(() => {
    if (background) localStorage.setItem(BACKGROUND_KEY, background);
  }, [background]);

  // Load history if logged in
  useEffect(() => {
    if (!user) return;
    supabase
      .from('cover_letters')
      .select('id, job_title, company, cover_letter, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory(data ?? []));
  }, [user]);

  const generate = async () => {
    if (!jobTitle || !company || !jobDescription || !background) return;
    setGenerating(true);
    setOutput('');
    setSaved(false);

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription, background }),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Please sign in to generate cover letters.');
        if (res.status === 403) throw new Error('This feature requires a subscription. Upgrade on the pricing page to unlock it.');
        throw new Error('Generation failed — please try again.');
      }

      // Read the stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setOutput(full);
        // Auto-scroll output
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }

      // Auto-save to Supabase if logged in
      if (user && full) {
        const { data } = await supabase.from('cover_letters').insert({
          user_id:         user.id,
          job_title:       jobTitle,
          company,
          job_description: jobDescription,
          cover_letter:    full,
        }).select().single();
        if (data) {
          setHistory(prev => [data, ...prev].slice(0, 10));
          setSaved(true);
        }
      }
    } catch (err) {
      setOutput('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cover-letter-${company.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item: CoverLetterHistoryItem) => {
    setJobTitle(item.job_title);
    setCompany(item.company);
    setOutput(item.cover_letter);
    setShowHistory(false);
  };

  const inputStyle = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    border: '1px solid var(--parchment)', fontSize: '0.95rem',
    background: 'white', color: 'var(--brown-dark)', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    display: 'block', fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: '0.4rem',
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Header */}
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.5rem',
        }}>
          AI Cover Letter Generator
        </h1>
        <p className="animate-fade-up delay-1" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Paste a job description → get a tailored, human-sounding cover letter in seconds.
          {!user && <span> <Link href="/login" style={{ color: 'var(--terracotta)' }}>Sign in</Link> to save your history.</span>}
        </p>
      </div>

      <div className="cl-grid">

        {/* ── LEFT: Inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          <div style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '16px', padding: '1.4rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
          }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown-dark)', margin: 0 }}>
              Job Details
            </h2>

            <div>
              <label style={labelStyle}>Job Title *</label>
              <input
                style={inputStyle} value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Junior Software Developer"
              />
            </div>

            <div>
              <label style={labelStyle}>Company *</label>
              <input
                style={inputStyle} value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Atlassian"
              />
            </div>

            <div>
              <label style={labelStyle}>Job Description * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(paste from job listing)</span></label>
              <textarea
                style={{ ...inputStyle, minHeight: '180px', resize: 'vertical', lineHeight: 1.6 }}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </div>
          </div>

          <div style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '16px', padding: '1.4rem',
          }}>
            <label style={{ ...labelStyle, fontSize: '1rem', marginBottom: '0.6rem' }}>
              Your Background *
              <span style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                (saved automatically)
              </span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', lineHeight: 1.6, fontSize: '0.9rem' }}
              value={background}
              onChange={e => setBackground(e.target.value)}
              placeholder={BACKGROUND_PLACEHOLDER}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Fill this in once — it's saved to your browser and reused every time.
            </p>
          </div>

          {/* Generate button — inside column on desktop, hidden on mobile (fixed bar below handles mobile) */}
          <button
            onClick={generate}
            disabled={generating || !jobTitle || !company || !jobDescription || !background}
            className="cl-desktop-btn"
            style={{
              background: generating ? 'var(--parchment)' : 'var(--terracotta)',
              color: generating ? 'var(--text-muted)' : 'white',
              border: 'none', borderRadius: '12px',
              padding: '0.9rem', fontSize: '1rem', fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {generating ? '✍️ Writing...' : '✨ Generate Cover Letter'}
          </button>
        </div>

        {/* ── RIGHT: Output ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

          {/* History button */}
          {user && history.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowHistory(v => !v)} style={{
                background: 'none', border: '1px solid var(--parchment)',
                borderRadius: '99px', padding: '0.3rem 0.9rem',
                fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                📋 History ({history.length})
              </button>
            </div>
          )}

          {/* History dropdown */}
          {showHistory && (
            <div style={{
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              borderRadius: '12px', padding: '0.8rem',
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}>
              {history.map(item => (
                <button key={item.id} onClick={() => loadFromHistory(item)} style={{
                  background: 'none', border: 'none', textAlign: 'left',
                  padding: '0.5rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.85rem', color: 'var(--brown-dark)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--parchment)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <strong>{item.job_title}</strong> at {item.company}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                    {new Date(item.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Output area */}
          <div className="cl-output-area" style={{
            flex: 1, background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '16px', padding: '1.4rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            minHeight: '500px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown-dark)', margin: 0 }}>
                Generated Letter
                {saved && <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#10b981', marginLeft: '0.5rem' }}>✓ Saved</span>}
              </h2>
              {output && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={copy} style={{
                    background: 'none', border: '1px solid var(--parchment)',
                    borderRadius: '99px', padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button onClick={download} style={{
                    background: 'none', border: '1px solid var(--parchment)',
                    borderRadius: '99px', padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}>
                    Download
                  </button>
                  <button onClick={generate} disabled={generating} style={{
                    background: 'var(--terracotta)', color: 'white',
                    border: 'none', borderRadius: '99px',
                    padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer',
                  }}>
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {!output && !generating && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem' }}>✍️</div>
                <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
                  Your cover letter will appear here
                </p>
              </div>
            )}

            {(output || generating) && (
              <textarea
                ref={outputRef}
                readOnly={generating}
                value={generating && !output ? 'Writing...' : output}
                onChange={e => setOutput(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none', resize: 'none',
                  background: 'transparent', fontSize: '0.92rem',
                  lineHeight: 1.8, color: 'var(--brown-dark)',
                  fontFamily: 'Georgia, serif', minHeight: '420px',
                  cursor: generating ? 'default' : 'text',
                }}
              />
            )}
          </div>

          {output && !generating && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              ✏️ Click the letter to edit directly — copy will capture your changes.
            </p>
          )}
        </div>
      </div>

      {/* Mobile-only fixed generate bar */}
      <div className="cl-generate-bar">
        <button
          onClick={generate}
          disabled={generating || !jobTitle || !company || !jobDescription || !background}
          style={{
            background: generating ? 'var(--parchment)' : 'var(--terracotta)',
            color: generating ? 'var(--text-muted)' : 'white',
            border: 'none', borderRadius: '12px',
            padding: '0.9rem', fontSize: '1rem', fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {generating ? '✍️ Writing...' : '✨ Generate Cover Letter'}
        </button>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <CoverLetterContent />
    </Suspense>
  );
}
