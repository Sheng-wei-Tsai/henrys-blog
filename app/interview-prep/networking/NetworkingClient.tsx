'use client';
import React, { useState, useEffect } from 'react';

const PLAN_KEY = 'networking-30day-checklist';

const WEEKS: Array<{
  week: number;
  title: string;
  tasks: Array<{ id: string; text: string }>;
}> = [
  {
    week: 1,
    title: 'Foundation — Polish your presence',
    tasks: [
      { id: 'w1t1', text: 'Update LinkedIn headline with AU city + visa status + tech stack' },
      { id: 'w1t2', text: 'Write or update your LinkedIn About section (250–300 words)' },
      { id: 'w1t3', text: 'Pin 2–3 best GitHub repos and write README for each' },
      { id: 'w1t4', text: 'Set GitHub contribution activity — commit something small every 2 days' },
      { id: 'w1t5', text: 'Identify 10 AU tech companies you\'d genuinely like to work for' },
      { id: 'w1t6', text: 'Follow their Engineering/Tech teams on LinkedIn' },
    ],
  },
  {
    week: 2,
    title: 'Events — Get in the room',
    tasks: [
      { id: 'w2t1', text: 'Register for at least 2 meetups in your city this month' },
      { id: 'w2t2', text: 'Attend first meetup — arrive early, introduce yourself to organiser' },
      { id: 'w2t3', text: 'Collect 2 LinkedIn connections from the event (same night)' },
      { id: 'w2t4', text: 'Send personalised connection requests referencing the meetup' },
      { id: 'w2t5', text: 'Follow up on any interesting conversations with a short message' },
    ],
  },
  {
    week: 3,
    title: 'Outreach — Start conversations',
    tasks: [
      { id: 'w3t1', text: 'Identify 5 developers at target companies to reach out to' },
      { id: 'w3t2', text: 'Send 5 personalised LinkedIn connection requests (use the template)' },
      { id: 'w3t3', text: 'Attend second meetup of the month' },
      { id: 'w3t4', text: 'Ask one person for a 20-minute virtual coffee chat' },
      { id: 'w3t5', text: 'Engage genuinely with 3 posts from people in your target companies' },
    ],
  },
  {
    week: 4,
    title: 'Momentum — Follow up and reflect',
    tasks: [
      { id: 'w4t1', text: 'Have the coffee chat you requested — prepare 3 genuine questions' },
      { id: 'w4t2', text: 'Follow up with everyone you connected with in weeks 1–3' },
      { id: 'w4t3', text: 'Write a brief summary: who you met, what you learned, what to improve' },
      { id: 'w4t4', text: 'Register for next month\'s meetups' },
      { id: 'w4t5', text: 'Ask one connection if they\'d be open to a referral if a suitable role opens' },
    ],
  },
];

const weekColors = ['#14b8a6', '#818cf8', '#f59e0b', '#10b981'];

export default function NetworkingClient() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      if (raw) setChecked(new Set(JSON.parse(raw)));
    } catch { /* */ }
    setLoaded(true);
  }, []);

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(PLAN_KEY, JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  }

  const totalTasks = WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const completed  = checked.size;
  const pct        = Math.round((completed / totalTasks) * 100);

  return (
    <details style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
      <summary style={{ padding: '1.1rem 1.4rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none', fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
        <span style={{ fontSize: '1.4rem' }}>🗓️</span>
        <span style={{ flex: 1 }}>30-Day Networking Action Plan</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#14b8a6', background: 'rgba(20,184,166,0.1)', padding: '0.2em 0.6em', borderRadius: '4px' }}>{pct}%</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▾</span>
      </summary>

      <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>
        {/* Progress bar */}
        <div style={{ marginTop: '1.1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{completed} / {totalTasks} tasks complete</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#14b8a6' }}>{pct}%</span>
          </div>
          <div style={{ background: 'var(--parchment)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: '#14b8a6', width: `${loaded ? pct : 0}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Weeks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {WEEKS.map((week, wi) => {
            const weekDone = week.tasks.filter(t => checked.has(t.id)).length;
            return (
              <div key={week.week}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${weekColors[wi]}20`, border: `2px solid ${weekColors[wi]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: weekColors[wi], flexShrink: 0 }}>
                    {week.week}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2 }}>Week {week.week}: {week.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{weekDone}/{week.tasks.length} done</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                  {week.tasks.map(task => (
                    <label key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.5rem 0.7rem', borderRadius: '8px', background: checked.has(task.id) ? 'rgba(20,184,166,0.06)' : 'var(--cream)', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <input
                        type="checkbox"
                        checked={checked.has(task.id)}
                        onChange={() => toggle(task.id)}
                        style={{ marginTop: '0.15rem', accentColor: weekColors[wi], flexShrink: 0, width: '15px', height: '15px' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: checked.has(task.id) ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.5, textDecoration: checked.has(task.id) ? 'line-through' : 'none' }}>
                        {task.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {completed === totalTasks && (
          <div style={{ marginTop: '1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.9rem 1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>🎉 30-day plan complete! Your network is now an asset.</p>
          </div>
        )}
      </div>
    </details>
  );
}
