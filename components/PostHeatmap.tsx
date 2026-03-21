'use client';
import { useMemo, useState, useRef } from 'react';

interface Props {
  dates: string[];
}

function cellColor(count: number): string {
  if (count === 0) return 'var(--parchment)';
  if (count === 1) return 'rgba(196,98,58,0.30)';
  if (count === 2) return 'rgba(196,98,58,0.58)';
  if (count === 3) return 'rgba(196,98,58,0.80)';
  return 'var(--terracotta)';
}

function formatDisplay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function buildGrid(dates: string[]) {
  const countMap: Record<string, number> = {};
  for (const d of dates) countMap[d] = (countMap[d] ?? 0) + 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const start = new Date(today);
  start.setDate(today.getDate() - 363 - today.getDay());

  const weeks: { date: string; count: number; isToday: boolean }[][] = [];
  const months: { label: string; col: number }[] = [];

  let cur = new Date(start);
  let lastMonth = -1;
  let col = 0;

  while (cur <= today) {
    const week: { date: string; count: number; isToday: boolean }[] = [];
    for (let day = 0; day < 7; day++) {
      const iso = cur.toISOString().split('T')[0];
      week.push({ date: iso, count: countMap[iso] ?? 0, isToday: iso === todayStr });
      if (day === 0 && cur.getMonth() !== lastMonth && cur <= today) {
        months.push({ label: cur.toLocaleDateString('en-AU', { month: 'short' }), col });
        lastMonth = cur.getMonth();
      }
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    col++;
  }

  // Compute current streak
  let streak = 0;
  const check = new Date(today);
  while (true) {
    const key = check.toISOString().split('T')[0];
    if (!countMap[key]) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return { weeks, months, todayStr, streak };
}

const CELL    = 13;
const GAP     = 3;
const STEP    = CELL + GAP;
const LABEL_W = 30;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function PostHeatmap({ dates }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string; date: string; count: number; x: number; y: number;
  } | null>(null);

  const total = dates.length;
  const { weeks, months, streak } = useMemo(() => buildGrid(dates), [dates]);

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.4rem',
      }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.35rem', color: 'var(--brown-dark)' }}>
          Writing activity
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
          {streak > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--terracotta)', fontWeight: 600 }}>
              {streak} day streak
            </span>
          )}
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {total} post{total !== 1 ? 's' : ''} in the last year
          </span>
        </div>
      </div>

      {/* Card */}
      <div ref={containerRef} style={{
        background: 'var(--warm-white)',
        border: '1px solid var(--parchment)',
        borderRadius: '14px',
        padding: '1.1rem 1.3rem 0.9rem',
        overflowX: 'auto',
        position: 'relative',
      }}>
        {/* Month labels */}
        <div style={{
          marginLeft: `${LABEL_W}px`, marginBottom: '5px',
          position: 'relative', height: '15px',
        }}>
          {months.map((m, i) => (
            <span key={i} style={{
              position: 'absolute', left: `${m.col * STEP}px`,
              fontSize: '0.67rem', color: 'var(--text-muted)', userSelect: 'none',
            }}>
              {m.label}
            </span>
          ))}
        </div>

        {/* Day labels + grid */}
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          {/* Day labels */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: `${GAP}px`,
            width: `${LABEL_W}px`, flexShrink: 0,
          }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} style={{
                height: `${CELL}px`, fontSize: '0.64rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', paddingRight: '5px', userSelect: 'none',
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div style={{ display: 'flex', gap: `${GAP}px`, flexShrink: 0 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {week.map((cell, di) => {
                  const isFuture = new Date(cell.date + 'T00:00:00') > new Date();
                  if (isFuture) {
                    return <div key={di} style={{ width: `${CELL}px`, height: `${CELL}px` }} />;
                  }

                  const hasPost = cell.count > 0;

                  return (
                    <div
                      key={di}
                      onMouseEnter={e => {
                        if (!hasPost) return;   // only tooltip on active days
                        const el    = e.currentTarget as HTMLElement;
                        const cRect = containerRef.current?.getBoundingClientRect();
                        const eRect = el.getBoundingClientRect();
                        setTooltip({
                          text:  formatDisplay(cell.date),
                          date:  cell.date,
                          count: cell.count,
                          x: eRect.left - (cRect?.left ?? 0) + CELL / 2,
                          y: eRect.top  - (cRect?.top  ?? 0) - 6,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        width:  `${CELL}px`,
                        height: `${CELL}px`,
                        borderRadius: '3px',
                        background:   cellColor(cell.count),
                        cursor:       hasPost ? 'pointer' : 'default',
                        transition:   'transform 0.1s, opacity 0.1s',
                        outline:      cell.isToday ? '2px solid var(--terracotta)' : 'none',
                        outlineOffset: '1px',
                      }}
                      onMouseOver={e => {
                        if (hasPost) (e.currentTarget as HTMLElement).style.transform = 'scale(1.35)';
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        setTooltip(null);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '4px', marginTop: '0.75rem',
        }}>
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginRight: '2px' }}>Less</span>
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} style={{
              width: '10px', height: '10px', borderRadius: '2px',
              background: cellColor(n),
            }} />
          ))}
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginLeft: '2px' }}>More</span>
        </div>

        {/* Tooltip — only shown on days with posts */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left:      `${tooltip.x}px`,
            top:       `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'var(--brown-dark)',
            color:      'var(--cream)',
            borderRadius: '7px',
            padding:   '0.35em 0.75em',
            pointerEvents: 'none',
            zIndex:    20,
            display:   'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap:       '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--terracotta)', lineHeight: 1.3 }}>
              {tooltip.count} post{tooltip.count > 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--cream)', opacity: 0.7, whiteSpace: 'nowrap' }}>
              {tooltip.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
