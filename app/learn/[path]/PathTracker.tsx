'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  SkillPath, Skill, getNextReviewDate, getReviewLabel, getAllSkillIds,
} from '@/lib/skill-paths';

type Status = 'not_started' | 'learning' | 'needs_review' | 'mastered';

interface SkillProgress {
  skill_id:         string;
  status:           Status;
  review_count:     number;
  next_review_at:   string | null;
  last_reviewed_at: string | null;
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  not_started:  { label: 'Not started',    color: 'var(--text-muted)',   bg: 'var(--parchment)' },
  learning:     { label: 'In progress',    color: '#2563eb',              bg: '#eff6ff' },
  needs_review: { label: 'Review due',     color: '#d97706',              bg: '#fffbeb' },
  mastered:     { label: 'Mastered ✓',     color: '#059669',              bg: '#f0fdf4' },
};

export default function PathTracker({ path }: { path: SkillPath }) {
  const { user } = useAuth();
  const [progress,     setProgress]     = useState<Record<string, SkillProgress>>({});
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [loadingSkill, setLoadingSkill] = useState<string | null>(null);

  // Load user's progress from Supabase
  const loadProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('skill_progress')
      .select('skill_id, status, review_count, next_review_at, last_reviewed_at')
      .eq('user_id', user.id)
      .eq('path_id', path.id);
    if (data) {
      const map: Record<string, SkillProgress> = {};
      data.forEach(r => { map[r.skill_id] = r; });
      setProgress(map);
    }
  }, [user, path.id]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  // Check for overdue reviews on mount
  useEffect(() => {
    if (!user || Object.keys(progress).length === 0) return;
    const now = new Date();
    const overdue = Object.entries(progress).filter(
      ([, p]) => p.status === 'learning' && p.next_review_at && new Date(p.next_review_at) <= now
    );
    if (overdue.length === 0) return;

    // Batch update overdue to needs_review
    Promise.all(overdue.map(([skill_id]) =>
      supabase.from('skill_progress')
        .update({ status: 'needs_review' })
        .eq('user_id', user.id)
        .eq('path_id', path.id)
        .eq('skill_id', skill_id)
    )).then(() => loadProgress());
  }, [progress, user, path.id, loadProgress]);

  const getStatus = (skillId: string): Status =>
    progress[skillId]?.status ?? 'not_started';

  const markStarted = async (skillId: string) => {
    if (!user) return;
    setLoadingSkill(skillId);
    const next = getNextReviewDate(0);
    await supabase.from('skill_progress').upsert({
      user_id: user.id, path_id: path.id, skill_id: skillId,
      status: 'learning', started_at: new Date().toISOString(),
      next_review_at: next.toISOString(), review_count: 0,
    });
    await loadProgress();
    setLoadingSkill(null);
  };

  const markReviewed = async (skillId: string) => {
    if (!user) return;
    setLoadingSkill(skillId);
    const current = progress[skillId];
    const reviewCount = (current?.review_count ?? 0) + 1;
    const mastered = reviewCount >= 5;
    const next = mastered ? null : getNextReviewDate(reviewCount);

    await supabase.from('skill_progress').upsert({
      user_id: user.id, path_id: path.id, skill_id: skillId,
      status: mastered ? 'mastered' : 'learning',
      last_reviewed_at: new Date().toISOString(),
      next_review_at: next?.toISOString() ?? null,
      review_count: reviewCount,
    });
    await loadProgress();
    setLoadingSkill(null);
  };

  const resetSkill = async (skillId: string) => {
    if (!user) return;
    await supabase.from('skill_progress')
      .delete()
      .eq('user_id', user.id).eq('path_id', path.id).eq('skill_id', skillId);
    await loadProgress();
  };

  // Stats
  const allSkills = path.phases.flatMap(ph => ph.skills);
  const total     = allSkills.length;
  const mastered  = allSkills.filter(s => getStatus(s.id) === 'mastered').length;
  const inProgress = allSkills.filter(s => ['learning', 'needs_review'].includes(getStatus(s.id))).length;
  const dueToday  = allSkills.filter(s => {
    const p = progress[s.id];
    return p?.status === 'needs_review' ||
      (p?.status === 'learning' && p.next_review_at && new Date(p.next_review_at) <= new Date());
  });

  const pct = total ? Math.round((mastered / total) * 100) : 0;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>

      {/* Back */}
      <div style={{ paddingTop: '2.5rem', marginBottom: '2rem' }}>
        <Link href="/learn" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← All paths
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '2rem' }}>{path.emoji}</span>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, color: 'var(--brown-dark)' }}>
            {path.title}
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '56ch', lineHeight: 1.7 }}>
          {path.description}
        </p>

        {/* Progress bar */}
        <div style={{ background: 'var(--parchment)', borderRadius: '99px', height: '8px', marginBottom: '0.6rem' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: '99px',
            background: pct === 100 ? '#10b981' : 'var(--terracotta)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span>{pct}% complete</span>
          <span style={{ color: '#059669' }}>{mastered} mastered</span>
          <span style={{ color: '#2563eb' }}>{inProgress} in progress</span>
          <span>{total - mastered - inProgress} not started</span>
        </div>
      </div>

      {/* Auth gate */}
      {!user && (
        <div style={{
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderRadius: '14px', padding: '1.4rem', marginBottom: '2.5rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem', fontSize: '0.92rem' }}>
            <Link href="/login" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            {' '}to track your progress, get review reminders, and save your learning history.
          </p>
        </div>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '14px', padding: '1.2rem 1.4rem', marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <span>⏰</span>
            <strong style={{ color: '#92400e', fontSize: '0.92rem' }}>
              {dueToday.length} skill{dueToday.length > 1 ? 's' : ''} due for review today
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {dueToday.map(s => (
              <button key={s.id} onClick={() => {
                setExpanded(s.id);
                document.getElementById(`skill-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }} style={{
                background: '#fef3c7', border: '1px solid #fde68a',
                borderRadius: '99px', padding: '0.25rem 0.8rem',
                fontSize: '0.8rem', cursor: 'pointer', color: '#92400e',
              }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase sections */}
      {path.phases.map(phase => (
        <section key={phase.id} style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
                {phase.title}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--parchment)', padding: '0.15em 0.65em', borderRadius: '99px' }}>
                {phase.duration}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{phase.summary}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {phase.skills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                status={getStatus(skill.id)}
                progress={progress[skill.id]}
                isExpanded={expanded === skill.id}
                isLoading={loadingSkill === skill.id}
                hasUser={!!user}
                onToggle={() => setExpanded(expanded === skill.id ? null : skill.id)}
                onStart={() => markStarted(skill.id)}
                onReview={() => markReviewed(skill.id)}
                onReset={() => resetSkill(skill.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Skill Card ───────────────────────────────────────────────
function SkillCard({
  skill, status, progress, isExpanded, isLoading, hasUser,
  onToggle, onStart, onReview, onReset,
}: {
  skill:      Skill;
  status:     Status;
  progress?:  SkillProgress;
  isExpanded: boolean;
  isLoading:  boolean;
  hasUser:    boolean;
  onToggle:   () => void;
  onStart:    () => void;
  onReview:   () => void;
  onReset:    () => void;
}) {
  const meta = STATUS_META[status];

  return (
    <div
      id={`skill-${skill.id}`}
      style={{
        background: 'var(--warm-white)',
        border: `1px solid ${status === 'needs_review' ? '#fde68a' : status === 'mastered' ? '#86efac' : 'var(--parchment)'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Card header */}
      <div
        onClick={onToggle}
        style={{
          padding: '1.1rem 1.4rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          cursor: 'pointer',
          background: isExpanded ? 'var(--parchment)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
          background: meta.color, opacity: status === 'not_started' ? 0.3 : 1,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.97rem', color: 'var(--brown-dark)' }}>
              {skill.name}
            </span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '0.15em 0.65em',
              borderRadius: '99px', background: meta.bg, color: meta.color,
            }}>
              {meta.label}
            </span>
            {progress?.next_review_at && status === 'learning' && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Next review: {new Date(progress.next_review_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.5 }}>
            {skill.description}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~{skill.estimatedDays}d</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>

          {/* Why */}
          <div style={{ marginTop: '1.1rem', marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
              Why this gets you hired
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, background: 'var(--parchment)', padding: '0.8rem 1rem', borderRadius: '8px', borderLeft: '3px solid var(--terracotta)' }}>
              {skill.why}
            </p>
          </div>

          {/* Topics */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
              What to learn
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {skill.topics.map(t => (
                <li key={t} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
              Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {skill.resources.map(r => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.86rem', color: 'var(--terracotta)', textDecoration: 'none',
                }}>
                  <span style={{
                    fontSize: '0.68rem', padding: '0.1em 0.5em', borderRadius: '4px',
                    background: r.free ? '#f0fdf4' : '#fff7ed',
                    color: r.free ? '#059669' : '#c2410c',
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {r.type.toUpperCase()} · {r.free ? 'FREE' : 'PAID'}
                  </span>
                  {r.title} ↗
                </a>
              ))}
            </div>
          </div>

          {/* Project */}
          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
              Build this project
            </div>
            <p style={{
              fontSize: '0.88rem', color: 'var(--brown-mid)', lineHeight: 1.65,
              background: '#f5f3ff', border: '1px solid #ddd6fe',
              padding: '0.8rem 1rem', borderRadius: '8px',
            }}>
              🔨 {skill.project}
            </p>
          </div>

          {/* Spaced repetition schedule */}
          {progress && progress.review_count > 0 && (
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
                Review schedule
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[1, 3, 7, 14, 30].map((days, i) => (
                  <span key={days} style={{
                    fontSize: '0.72rem', padding: '0.2em 0.65em', borderRadius: '99px',
                    background: i < progress.review_count ? 'var(--terracotta)' : 'var(--parchment)',
                    color: i < progress.review_count ? 'white' : 'var(--text-muted)',
                    fontWeight: 500,
                  }}>
                    +{days}d
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {hasUser && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {status === 'not_started' && (
                <button onClick={onStart} disabled={isLoading} style={btnStyle('var(--terracotta)', 'white')}>
                  {isLoading ? 'Saving…' : '▶ Start learning'}
                </button>
              )}
              {(status === 'learning' || status === 'needs_review') && (
                <button onClick={onReview} disabled={isLoading} style={btnStyle('#059669', 'white')}>
                  {isLoading ? 'Saving…' : `✓ Done reviewing${progress ? ` (${getReviewLabel(progress.review_count + 1)} until next)` : ''}`}
                </button>
              )}
              {status === 'mastered' && (
                <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 600 }}>🎉 Mastered!</span>
              )}
              {status !== 'not_started' && (
                <button onClick={onReset} style={btnStyle('transparent', 'var(--text-muted)', '1px solid var(--parchment)')}>
                  Reset
                </button>
              )}
            </div>
          )}

          {!hasUser && (
            <Link href="/login" style={{ fontSize: '0.85rem', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in to track progress →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, color: string, border?: string): React.CSSProperties {
  return {
    background: bg, color, border: border ?? 'none',
    borderRadius: '8px', padding: '0.45rem 1rem',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  };
}
