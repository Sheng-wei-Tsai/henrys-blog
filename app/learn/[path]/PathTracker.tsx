'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { SkillPath, Skill, getNextReviewDate } from '@/lib/skill-paths';
import {
  scheduleReview, clearReview, requestPermission, fireIfDue,
} from '@/lib/review-notifications';

type Status = 'not_started' | 'learning' | 'needs_review' | 'mastered';

interface SkillProgress {
  skill_id:         string;
  status:           Status;
  review_count:     number;
  next_review_at:   string | null;
  last_reviewed_at: string | null;
}

export default function PathTracker({ path }: { path: SkillPath }) {
  const { user } = useAuth();
  const [progress,     setProgress]     = useState<Record<string, SkillProgress>>({});
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [busy,         setBusy]         = useState<string | null>(null);
  const [notifAsked,   setNotifAsked]   = useState(false);

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

  // Fire any due notifications on mount
  useEffect(() => { fireIfDue(); }, []);

  // Mark overdue learning → needs_review
  useEffect(() => {
    if (!user || Object.keys(progress).length === 0) return;
    const now = new Date();
    const overdue = Object.entries(progress).filter(
      ([, p]) => p.status === 'learning' && p.next_review_at && new Date(p.next_review_at) <= now
    );
    if (!overdue.length) return;
    Promise.all(overdue.map(([skill_id]) =>
      supabase.from('skill_progress')
        .update({ status: 'needs_review' })
        .eq('user_id', user.id).eq('path_id', path.id).eq('skill_id', skill_id)
    )).then(loadProgress);
  }, [progress, user, path.id, loadProgress]);

  const getStatus = (id: string): Status => progress[id]?.status ?? 'not_started';

  const toggleCheck = async (skill: Skill) => {
    if (!user) return;
    const status = getStatus(skill.id);

    // Ask for notification permission once
    if (!notifAsked) {
      setNotifAsked(true);
      await requestPermission();
    }

    setBusy(skill.id);

    if (status === 'not_started') {
      // Mark as started / learned — schedule reminders
      const next = getNextReviewDate(0);
      await supabase.from('skill_progress').upsert({
        user_id: user.id, path_id: path.id, skill_id: skill.id,
        status: 'learning',
        started_at: new Date().toISOString(),
        next_review_at: next.toISOString(),
        review_count: 0,
      });
      scheduleReview(path.id, skill.id, skill.name);
    } else if (status === 'learning' || status === 'needs_review') {
      // Mark reviewed
      const current    = progress[skill.id];
      const reviewCount = (current?.review_count ?? 0) + 1;
      const mastered    = reviewCount >= 5;
      const next        = mastered ? null : getNextReviewDate(reviewCount);

      await supabase.from('skill_progress').upsert({
        user_id: user.id, path_id: path.id, skill_id: skill.id,
        status: mastered ? 'mastered' : 'learning',
        last_reviewed_at: new Date().toISOString(),
        next_review_at: next?.toISOString() ?? null,
        review_count: reviewCount,
      });

      if (mastered) clearReview(path.id, skill.id);
    } else if (status === 'mastered') {
      // Reset
      await supabase.from('skill_progress')
        .delete()
        .eq('user_id', user.id).eq('path_id', path.id).eq('skill_id', skill.id);
      clearReview(path.id, skill.id);
    }

    await loadProgress();
    setBusy(null);
  };

  const allSkills   = path.phases.flatMap(ph => ph.skills);
  const total       = allSkills.length;
  const mastered    = allSkills.filter(s => getStatus(s.id) === 'mastered').length;
  const inProgress  = allSkills.filter(s => ['learning', 'needs_review'].includes(getStatus(s.id))).length;
  const reviewsDue  = allSkills.filter(s => getStatus(s.id) === 'needs_review');
  const pct         = total ? Math.round((mastered / total) * 100) : 0;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>

      {/* Back */}
      <div style={{ paddingTop: '2.5rem', marginBottom: '2.5rem' }}>
        <Link href="/learn" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← All paths
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.5rem',
        }}>
          {path.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '56ch', marginBottom: '1.8rem' }}>
          {path.description}
        </p>

        {/* Progress */}
        <div style={{ background: 'var(--parchment)', borderRadius: '99px', height: '6px', marginBottom: '0.5rem' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: '99px',
            background: pct === 100 ? '#10b981' : 'var(--terracotta)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>{pct}% done</span>
          <span>{mastered} of {total} mastered</span>
          {inProgress > 0 && <span style={{ color: 'var(--terracotta)' }}>{inProgress} in progress</span>}
        </div>
      </div>

      {/* Review due banner */}
      {reviewsDue.length > 0 && (
        <div style={{
          border: '1px solid var(--parchment)',
          borderLeft: '3px solid var(--amber)',
          background: 'var(--warm-white)',
          borderRadius: '10px', padding: '0.9rem 1.2rem',
          marginBottom: '2rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.8rem',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
              {reviewsDue.length} skill{reviewsDue.length > 1 ? 's' : ''} waiting for review
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Revisiting these now will lock them into long-term memory. It takes about 10 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Auth nudge */}
      {!user && (
        <div style={{
          border: '1px solid var(--parchment)', borderRadius: '10px',
          padding: '0.9rem 1.2rem', marginBottom: '2rem',
          fontSize: '0.88rem', color: 'var(--text-secondary)',
        }}>
          <Link href="/login" style={{ color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          {' '}to check off skills and get review reminders on your computer.
        </div>
      )}

      {/* Phase sections */}
      {path.phases.map((phase, phaseIndex) => (
        <section key={phase.id} style={{ marginBottom: '3.5rem' }}>

          {/* Phase label */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '0.75rem',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--parchment)',
          }}>
            <span style={{
              fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--brown-dark)',
            }}>
              Phase {phaseIndex + 1} — {phase.title}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {phase.duration}
            </span>
          </div>

          {/* Skill list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {phase.skills.map((skill, i) => {
              const status = getStatus(skill.id);
              const isOpen = expanded === skill.id;
              const isBusy = busy === skill.id;
              const isDone = status === 'mastered';
              const isDue  = status === 'needs_review';

              return (
                <div key={skill.id} style={{
                  borderBottom: i < phase.skills.length - 1 ? '1px solid var(--parchment)' : 'none',
                }}>
                  {/* Row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.85rem 0',
                  }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCheck(skill)}
                      disabled={isBusy || !user}
                      aria-label={isDone ? `Reset ${skill.name}` : `Mark ${skill.name} as learned`}
                      style={{
                        width: '20px', height: '20px',
                        borderRadius: '5px', flexShrink: 0,
                        border: isDone
                          ? 'none'
                          : isDue
                            ? '2px solid var(--amber)'
                            : status === 'learning'
                              ? '2px solid var(--terracotta)'
                              : '2px solid var(--brown-light)',
                        background: isDone
                          ? 'var(--terracotta)'
                          : status === 'learning'
                            ? 'rgba(196,98,58,0.1)'
                            : 'transparent',
                        cursor: user ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        opacity: isBusy ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      {isDone && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {status === 'learning' && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--terracotta)' }} />
                      )}
                      {isDue && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)' }} />
                      )}
                    </button>

                    {/* Skill name + meta */}
                    <div
                      style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                      onClick={() => setExpanded(isOpen ? null : skill.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.95rem', fontWeight: 500,
                          color: isDone ? 'var(--text-muted)' : 'var(--brown-dark)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          textDecorationColor: 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}>
                          {skill.name}
                        </span>
                        {isDue && (
                          <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', padding: '0.1em 0.5em', borderRadius: '4px', fontWeight: 500 }}>
                            review due
                          </span>
                        )}
                        {isDone && (
                          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 500 }}>
                            done
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {skill.estimatedDays} days
                        {progress[skill.id]?.last_reviewed_at && (
                          <span style={{ marginLeft: '0.6rem' }}>
                            · reviewed {new Date(progress[skill.id].last_reviewed_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {progress[skill.id]?.next_review_at && status === 'learning' && (
                          <span style={{ marginLeft: '0.6rem' }}>
                            · next review {new Date(progress[skill.id].next_review_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : skill.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '0.75rem',
                        padding: '0.25rem', flexShrink: 0,
                      }}
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{
                      paddingLeft: '2.9rem', paddingBottom: '1.4rem',
                      borderTop: '1px solid var(--parchment)',
                      paddingTop: '1.1rem',
                    }}>

                      {/* Why */}
                      <p style={{
                        fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                        marginBottom: '1.2rem',
                        borderLeft: '2px solid var(--parchment)',
                        paddingLeft: '0.9rem',
                      }}>
                        {skill.why}
                      </p>

                      {/* Topics */}
                      <div style={{ marginBottom: '1.2rem' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                          What to learn
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {skill.topics.map(t => (
                            <li key={t} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Resources */}
                      <div style={{ marginBottom: '1.2rem' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                          Resources
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {skill.resources.map(r => (
                            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                              <span style={{
                                fontSize: '0.65rem', padding: '0.1em 0.45em', borderRadius: '3px',
                                background: r.free ? 'var(--parchment)' : '#fff7ed',
                                color: r.free ? 'var(--text-secondary)' : '#c2410c',
                                fontWeight: 600, flexShrink: 0, textTransform: 'uppercase',
                              }}>
                                {r.free ? 'free' : 'paid'}
                              </span>
                              <span style={{ fontSize: '0.86rem', color: 'var(--terracotta)' }}>
                                {r.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Project */}
                      <div style={{ marginBottom: '1.2rem' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                          Project to build
                        </p>
                        <p style={{ fontSize: '0.87rem', color: 'var(--brown-mid)', lineHeight: 1.65 }}>
                          {skill.project}
                        </p>
                      </div>

                      {/* Review count dots */}
                      {progress[skill.id]?.review_count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reviews:</span>
                          {[0,1,2,3,4].map(i => (
                            <div key={i} style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              background: i < (progress[skill.id]?.review_count ?? 0)
                                ? 'var(--terracotta)' : 'var(--parchment)',
                            }} />
                          ))}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {progress[skill.id]?.review_count}/5 to master
                          </span>
                        </div>
                      )}

                      {/* Action */}
                      {user && status !== 'not_started' && (
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                          {(status === 'learning' || status === 'needs_review') && (
                            <button onClick={() => toggleCheck(skill)} disabled={isBusy} style={{
                              background: 'var(--terracotta)', color: 'white', border: 'none',
                              borderRadius: '7px', padding: '0.4rem 1rem',
                              fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                            }}>
                              {isBusy ? 'Saving…' : 'Mark as reviewed'}
                            </button>
                          )}
                          <button onClick={async () => {
                            clearReview(path.id, skill.id);
                            await supabase.from('skill_progress')
                              .delete()
                              .eq('user_id', user.id).eq('path_id', path.id).eq('skill_id', skill.id);
                            await loadProgress();
                          }} style={{
                            background: 'none', border: '1px solid var(--parchment)',
                            borderRadius: '7px', padding: '0.4rem 0.8rem',
                            fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer',
                          }}>
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
