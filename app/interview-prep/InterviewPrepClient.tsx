'use client';
import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { INTERVIEW_ROLES, COMPANY_INTEL } from '@/lib/interview-roles';
import CompanyLinks from '@/components/CompanyLinks';

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};


const stepIn = (delay: number) => ({
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { delay, duration: 0.36, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -8, transition: { duration: 0.1 } },
});

const arrowIn = (delay: number) => ({
  hidden:  { scaleY: 0, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { delay, duration: 0.2, ease: 'easeOut' as const } },
  exit:    { scaleY: 0, opacity: 0, transition: { duration: 0.1 } },
});

const roleCardIn = (delay: number) => ({
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { delay, type: 'spring' as const, stiffness: 280, damping: 24 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.12 } },
});

// ── Progress data ─────────────────────────────────────────────────────────────
interface ProgressData {
  resumeCount:       number;
  coverLetterCount:  number;
  interviewXp:       number;
  interviewLevel:    number;
  networkingPct:     number;
}

const NETWORKING_KEY   = 'networking-30day-checklist';
const NETWORKING_TOTAL = 22;

function loadNetworkingPct(): number {
  try {
    const raw = localStorage.getItem(NETWORKING_KEY);
    if (!raw) return 0;
    const ids: string[] = JSON.parse(raw);
    return Math.round((ids.length / NETWORKING_TOTAL) * 100);
  } catch { return 0; }
}

// ── Cartoon arrow between steps ───────────────────────────────────────────────
function CartoonArrow({ delay }: { delay: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
      <motion.div
        variants={arrowIn(delay)}
        initial="hidden" animate="visible" exit="exit"
        style={{ transformOrigin: 'top', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Dashed animated line */}
        <svg width="2" height="28" style={{ overflow: 'visible' }}>
          <motion.line
            x1="1" y1="0" x2="1" y2="28"
            stroke="var(--terracotta)" strokeWidth="2" strokeDasharray="4 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: delay + 0.05, duration: 0.35, ease: 'easeOut' }}
          />
        </svg>
        {/* Bouncing arrowhead */}
        <motion.svg
          width="12" height="7" viewBox="0 0 12 7"
          animate={{ y: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: delay + 0.4 }}
          style={{ marginTop: '-1px' }}
        >
          <path d="M1 1L6 6L11 1" stroke="var(--terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.svg>
      </motion.div>
    </div>
  );
}

// ── Progress pill ─────────────────────────────────────────────────────────────
function ProgressPill({ value, label, accent }: { value: string | number; label: string; accent: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.7rem', fontWeight: 700,
      color: accent, background: `${accent}20`,
      padding: '0.2em 0.6em', borderRadius: '99px',
    }}>
      {value} {label}
    </span>
  );
}

// ── Difficulty / demand colors ────────────────────────────────────────────────
const demandColor: Record<string, string> = {
  'Very High': '#10b981',
  'High':      '#f59e0b',
  'Medium':    '#6b7280',
};
const difficultyColor: Record<string, string> = {
  'Entry':  '#3b82f6',
  'Mid':    '#8b5cf6',
  'Senior': '#ef4444',
};

// ── Tool cards config ─────────────────────────────────────────────────────────
const TOOL_CARDS = [
  {
    href:        '/resume',
    emoji:       '📄',
    label:       'Resume Analyser',
    tagLine:     'AI-POWERED · CLAUDE',
    desc:        'AU recruiter prompt scores your resume — format, keywords, and the specifics Australian hiring managers actually look at.',
    bg:          'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    dotColor:    'rgba(16,185,129,0.22)',
    accent:      '#10b981',
    cta:         'Analyse my resume',
    progressKey: 'resume' as const,
  },
  {
    href:        '/cover-letter',
    emoji:       '✉️',
    label:       'Cover Letter',
    tagLine:     'GPT-4.1 · AU ENGLISH',
    desc:        'Paste the job description — GPT-4.1 writes a 4-paragraph cover letter in Australian English, tailored and ready to send.',
    bg:          'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
    dotColor:    'rgba(245,158,11,0.22)',
    accent:      '#f59e0b',
    cta:         'Generate cover letter',
    progressKey: 'coverLetter' as const,
  },
  {
    href:        '/interview-prep',
    emoji:       '🎯',
    label:       'Interview Prep',
    tagLine:     'GAMIFIED · ALEX MENTOR',
    desc:        'Practice 10 real AU tech questions per role. Mentor Alex streams scored feedback — plus a Reality Check stage international candidates need.',
    bg:          'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    dotColor:    'rgba(129,140,248,0.22)',
    accent:      '#818cf8',
    cta:         'Start practising',
    progressKey: 'interview' as const,
  },
  {
    href:        '/interview-prep/networking',
    emoji:       '🤝',
    label:       'Networking Hub',
    tagLine:     'FREE · AU MARKET',
    desc:        'LinkedIn templates, GitHub checklist, AU tech meetup map for 4 cities, and a 30-day action plan — the #1 gap for international grads.',
    bg:          'linear-gradient(135deg, #042f2e 0%, #134e4a 100%)',
    dotColor:    'rgba(20,184,166,0.22)',
    accent:      '#14b8a6',
    cta:         'Start networking',
    progressKey: 'networking' as const,
  },
];

const HOW_STEPS = [
  { n: '1', label: 'Pick a role',             body: 'Choose the job type you\'re targeting in the Australian market.' },
  { n: '2', label: 'Study the question',       body: 'Read the scenario, understand the focus area, and read the framework.' },
  { n: '3', label: 'Write + get AI feedback',  body: 'Type your answer, then get streamed feedback from mentor Alex with a score.' },
  { n: '4', label: 'Earn XP',                  body: 'Progress from Beginner to Interview Ready. Each level unlocks harder questions.' },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function InterviewPrepClient() {
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  const [howOpen,    setHowOpen]    = useState(false);
  const [rolesOpen,  setRolesOpen]  = useState(false);
  const [progress,   setProgress]   = useState<ProgressData | null>(null);
  const [progLoading, setProgLoading] = useState(true);

  // Load progress data
  useEffect(() => {
    const networkingPct = loadNetworkingPct();

    if (!user) {
      setProgress({ resumeCount: 0, coverLetterCount: 0, interviewXp: 0, interviewLevel: 1, networkingPct });
      setProgLoading(false);
      return;
    }

    Promise.all([
      supabase.from('resume_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('api_usage').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('endpoint', 'cover-letter'),
      supabase.from('profiles').select('interview_xp, interview_level').eq('id', user.id).maybeSingle(),
    ]).then(([resumeRes, coverRes, profileRes]) => {
      setProgress({
        resumeCount:      resumeRes.count ?? 0,
        coverLetterCount: coverRes.count  ?? 0,
        interviewXp:      profileRes.data?.interview_xp    ?? 0,
        interviewLevel:   profileRes.data?.interview_level ?? 1,
        networkingPct,
      });
      setProgLoading(false);
    }).catch(() => {
      setProgress({ resumeCount: 0, coverLetterCount: 0, interviewXp: 0, interviewLevel: 1, networkingPct });
      setProgLoading(false);
    });
  }, [user]);

  function getProgressLabel(key: typeof TOOL_CARDS[0]['progressKey']): React.ReactNode {
    if (progLoading) {
      return (
        <span style={{ display: 'inline-block', width: '60px', height: '18px', borderRadius: '99px', background: 'rgba(255,255,255,0.1)', animation: 'shimmer 1.4s ease infinite' }} />
      );
    }
    if (!progress) return null;
    switch (key) {
      case 'resume':
        return progress.resumeCount > 0
          ? <ProgressPill value={progress.resumeCount} label="analyses" accent="#10b981" />
          : <ProgressPill value="New" label="" accent="#10b981" />;
      case 'coverLetter':
        return progress.coverLetterCount > 0
          ? <ProgressPill value={progress.coverLetterCount} label="generated" accent="#f59e0b" />
          : <ProgressPill value="New" label="" accent="#f59e0b" />;
      case 'interview':
        return <ProgressPill value={`Lv ${progress.interviewLevel}`} label={`· ${progress.interviewXp} XP`} accent="#818cf8" />;
      case 'networking':
        return <ProgressPill value={`${progress.networkingPct}%`} label="done" accent="#14b8a6" />;
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible"
        style={{ paddingTop: '4.5rem', paddingBottom: '2.5rem' }}
      >
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.9rem',
        }}>
          Land the Job
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '54ch' }}>
          Four tools to take you from application to offer — built specifically for international IT graduates in Australia.
        </p>
      </motion.section>

      {/* ── Comic tool cards — stacked full-width ───────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}
      >
        {TOOL_CARDS.map(tool => (
          <motion.div
            key={tool.href}
            whileTap={prefersReduced ? {} : { scale: 0.98, y: 2 }}
          >
            <Link href={tool.href} className="comic-tool-card" tabIndex={0}>
              <div style={{
                background: tool.bg,
                borderRadius: '11px',
                padding: '1.6rem 1.8rem',
                display: 'flex',
                alignItems: 'stretch',
                gap: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '9rem',
              }}>
                {/* Dot halftone — right decorative panel */}
                <div
                  className="comic-card-dots"
                  style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '38%', height: '100%',
                    background: `radial-gradient(circle, ${tool.dotColor} 0.06em, transparent 0.06em)`,
                    backgroundSize: '0.55em 0.55em',
                    pointerEvents: 'none',
                  }}
                />

                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: '-20px', right: '60px', width: '120px', height: '120px', borderRadius: '50%', background: tool.dotColor, filter: 'blur(35px)', pointerEvents: 'none' }} />

                {/* Content */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Tag label — comic-book caps style */}
                  <p style={{
                    fontFamily: 'Impact, "Arial Narrow Bold", sans-serif',
                    fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.12em',
                    color: tool.accent, marginBottom: '0.4rem',
                    textTransform: 'uppercase',
                  }}>
                    {tool.tagLine}
                  </p>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700,
                    color: '#f8fafc', lineHeight: 1.2, marginBottom: '0.5rem',
                  }}>
                    {tool.label}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.83rem', color: 'rgba(248,250,252,0.72)',
                    lineHeight: 1.6, marginBottom: '0.9rem', maxWidth: '52ch',
                  }}>
                    {tool.desc}
                  </p>

                  {/* Progress + CTA row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                    {/* CTA — yellow comic button style */}
                    <span style={{
                      display: 'inline-block',
                      background: tool.accent,
                      color: '#0f172a',
                      padding: '0.42rem 1.1rem',
                      borderRadius: '99px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: '2px solid rgba(0,0,0,0.25)',
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
                      letterSpacing: '0.01em',
                    }}>
                      {tool.cta} →
                    </span>
                    {getProgressLabel(tool.progressKey)}
                  </div>
                </div>

                {/* Right emoji — large, ghost, decorative */}
                <div style={{
                  position: 'absolute', right: '1.4rem', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '4.5rem', lineHeight: 1,
                  opacity: 0.18, pointerEvents: 'none',
                  userSelect: 'none',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                }}>
                  {tool.emoji}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Practice by Role header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--parchment)' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          🎯 Practice by Role
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--parchment)' }} />
      </div>

      {/* ── How it works accordion ──────────────────────────────────────── */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: '1.5rem' }}>
        <motion.button
          onClick={() => setHowOpen(o => !o)}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--warm-white)',
            border: `1.5px solid ${howOpen ? 'var(--terracotta)' : 'var(--parchment)'}`,
            borderRadius: howOpen ? '12px 12px 0 0' : '12px',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.2s, border-radius 0.2s',
          }}
          aria-expanded={howOpen}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🗺️</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--brown-dark)' }}>How it works</span>
          </div>
          <motion.svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            animate={{ rotate: howOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <path d="M3 5L7 9L11 5" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {howOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                border: '1.5px solid var(--terracotta)', borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '1.4rem 1.5rem 1.5rem',
                background: 'var(--warm-white)',
              }}>
                {HOW_STEPS.map((step, i) => (
                  <div key={step.n}>
                    <motion.div
                      variants={stepIn(i * 0.35)}
                      initial="hidden" animate="visible" exit="exit"
                      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                    >
                      <span style={{
                        fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
                        color: 'var(--terracotta)', minWidth: '1.4rem', paddingTop: '1px',
                      }}>{step.n}.</span>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          {step.body}
                        </div>
                      </div>
                    </motion.div>
                    {i < HOW_STEPS.length - 1 && <CartoonArrow delay={i * 0.35 + 0.25} />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── Role grid ─────────────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" style={{ paddingBottom: '5rem' }}>
        {/* Header + toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Choose a role
          </p>
          <motion.button
            onClick={() => setRolesOpen(o => !o)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '99px',
              background: rolesOpen ? 'var(--terracotta)' : 'var(--warm-white)',
              color: rolesOpen ? 'white' : 'var(--text-secondary)',
              border: rolesOpen ? 'none' : '1.5px solid var(--parchment)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: rolesOpen ? '2px 2px 0 rgba(20,10,5,0.25)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            {rolesOpen ? 'Collapse ↑' : 'Browse roles →'}
          </motion.button>
        </div>

        {/* Expanded: full role cards */}
        <AnimatePresence>
          {rolesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              {INTERVIEW_ROLES.map((role, i) => {
                const intelEntries = role.companies
                  .map(c => COMPANY_INTEL[c] ? { company: c, ...COMPANY_INTEL[c] } : null)
                  .filter(Boolean) as Array<{ company: string; process: string; style: string; tip: string; interviewLength: string }>;

                return (
                  <motion.div
                    key={role.id}
                    variants={roleCardIn(i * 0.07)}
                    initial="hidden" animate="visible" exit="exit"
                  >
                    <Link href={`/interview-prep/${role.id}`} style={{ textDecoration: 'none' }}>
                      <motion.div
                        whileHover={prefersReduced ? {} : { scale: 1.01, y: -2 }}
                        whileTap={prefersReduced ? {} : { scale: 0.99 }}
                        style={{
                          background: role.badge
                            ? 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, var(--warm-white) 60%)'
                            : 'var(--warm-white)',
                          border: role.badge ? '1.5px solid rgba(20,184,166,0.4)' : '1px solid var(--parchment)',
                          borderRadius: '14px',
                          padding: '1.3rem 1.4rem',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{role.emoji}</span>
                            <div>
                              <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.97rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>
                                {role.title}
                              </h3>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {role.badge ? (
                                  <span style={{ fontSize: '0.63rem', fontWeight: 700, color: '#0d9488', background: 'rgba(20,184,166,0.12)', padding: '0.13em 0.5em', borderRadius: '4px' }}>
                                    {role.badge}
                                  </span>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '0.63rem', fontWeight: 700, color: difficultyColor[role.difficulty], background: `${difficultyColor[role.difficulty]}15`, padding: '0.13em 0.5em', borderRadius: '4px' }}>
                                      {role.difficulty}
                                    </span>
                                    <span style={{ fontSize: '0.63rem', fontWeight: 700, color: demandColor[role.demand], background: `${demandColor[role.demand]}15`, padding: '0.13em 0.5em', borderRadius: '4px' }}>
                                      {role.demand} Demand
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
                          {role.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1.4rem', marginBottom: '0.85rem' }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Salary</div>
                            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{role.salaryRange}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Questions</div>
                            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{role.questionCount} questions</div>
                          </div>
                        </div>
                        <CompanyLinks companies={role.companies} />
                      </motion.div>
                    </Link>

                    {/* Company Intel — expandable below card */}
                    {intelEntries.length > 0 && (
                      <details style={{ marginTop: '0.35rem' }}>
                        <summary style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem 0.6rem', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', userSelect: 'none' }}>
                          <span>🏢</span> Interview intel for {intelEntries.length} {intelEntries.length === 1 ? 'company' : 'companies'}
                          <span style={{ marginLeft: 'auto' }}>▾</span>
                        </summary>
                        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.3rem' }}>
                          {intelEntries.map(intel => (
                            <div key={intel.company}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.25rem' }}>{intel.company}</p>
                              <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.18rem' }}>
                                <strong>Process:</strong> {intel.process}
                              </p>
                              <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.18rem' }}>
                                <strong>Style:</strong> {intel.style}
                              </p>
                              <p style={{ fontSize: '0.77rem', color: '#b45309', lineHeight: 1.5 }}>
                                <strong>Tip:</strong> {intel.tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed: compact pill list */}
        {!rolesOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}
          >
            {INTERVIEW_ROLES.map((role, i) => (
              <motion.div
                key={role.id}
                whileHover={{ backgroundColor: 'var(--parchment)' }}
                style={{
                  background: 'var(--warm-white)',
                  padding: '1rem 1.3rem',
                  borderBottom: i < INTERVIEW_ROLES.length - 1 ? '1px solid var(--parchment)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => setRolesOpen(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{role.emoji}</span>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--brown-dark)' }}>{role.title}</span>
                      {role.badge ? (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.63rem', fontWeight: 700, color: '#0d9488' }}>● Start here</span>
                      ) : (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 700, color: demandColor[role.demand] }}>{role.demand}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>→</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>
    </div>
  );
}
