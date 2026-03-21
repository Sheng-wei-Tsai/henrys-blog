'use client';
import { useMemo, useState } from 'react';

interface Props {
  dates: string[];   // all post dates as "YYYY-MM-DD"
}

// Terracotta intensity scale (0–4+)
function cellColor(count: number): string {
  if (count === 0) return 'var(--parchment)';
  if (count === 1) return 'rgba(196,98,58,0.28)';
  if (count === 2) return 'rgba(196,98,58,0.55)';
  if (count === 3) return 'rgba(196,98,58,0.78)';
  return 'var(--terracotta)';
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Build 52-week grid starting from the Sunday 52 weeks ago
function buildGrid(dates: string[]) {
  const countMap: Record<string, number> = {};
  for (const d of dates) countMap[d] = (countMap[d] ?? 0) + 1;

  // Start on the Sunday 52 weeks ago
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const start   = new Date(today);
  start.setDate(today.getDate() - 363 - today.getDay()); // go back 52 weeks, align to Sunday

  const weeks: { date: string; count: number }[][] = [];
  const months: { label: string; col: number }[]   = [];

  let cur       = new Date(start);
  let lastMonth = -1;
  let col       = 0;

  while (cur <= today) {
    const week: { date: string; count: number }[] = [];

    for (let day = 0; day < 7; day++) {
      const iso = cur.toISOString().split('T')[0];
      week.push({ date: iso, count: countMap[iso] ?? 0 });

      // Track month label position (show when month changes, on first row)
      if (day === 0 && cur.getMonth() !== lastMonth && cur <= today) {
        months.push({
          label: cur.toLocaleDateString('en-AU', { month: 'short' }),
          col,
        });
        lastMonth = cur.getMonth();
      }

      cur.setDate(cur.getDate() + 1);
    }

    weeks.push(week);
    col++;
  }

  return { weeks, months };
}

export default function PostHeatmap({ dates }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const total = dates.length;

  const { weeks, months } = useMemo(() => buildGrid(dates), [dates]);

  const CELL  = 12;
  const GAP   = 3;
  const STEP  = CELL + GAP;
  const LABEL_W = 28;  // left label column width

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: '0.9rem',
      }}>
        <h2 style={{
          fontFamily: "'Lora', serif", fontSize: '1.35rem', color: 'var(--brown-dark)',
        }}>
          Writing activity
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {total} post{total !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      {/* Grid */}
      <div data-heatmap style={{
        background: 'var(--warm-white)',
        border: '1px solid var(--parchment)',
        borderRadius: '14px',
        padding: '1.2rem 1.4rem 1rem',
        overflowX: 'auto',
        position: 'relative',
      }}>
        {/* Month labels */}
        <div style={{
          display: 'flex', marginLeft: `${LABEL_W}px`,
          marginBottom: '6px', position: 'relative',
          height: '16px',
        }}>
          {months.map((m, i) => (
            <span key={i} style={{
              position: 'absolute',
              left: `${m.col * STEP}px`,
              fontSize: '0.68rem', color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {m.label}
            </span>
          ))}
        </div>

        {/* Day labels + cells */}
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          {/* Day-of-week labels */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: `${GAP}px`,
            width: `${LABEL_W}px`, flexShrink: 0,
          }}>
            {dayLabels.map((label, i) => (
              <div key={i} style={{
                height: `${CELL}px`,
                fontSize: '0.65rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', paddingRight: '4px',
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: 'flex', gap: `${GAP}px`, flexShrink: 0 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {week.map((cell, di) => {
                  const isFuture = new Date(cell.date + 'T00:00:00') > new Date();
                  return (
                    <div
                      key={di}
                      onMouseEnter={e => {
                        if (isFuture) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const container = (e.target as HTMLElement).closest('[data-heatmap]') as HTMLElement;
                        const cRect = container?.getBoundingClientRect();
                        setTooltip({
                          text: cell.count === 0
                            ? `No posts on ${formatDisplay(cell.date)}`
                            : `${cell.count} post${cell.count > 1 ? 's' : ''} on ${formatDisplay(cell.date)}`,
                          x: rect.left - (cRect?.left ?? 0) + CELL / 2,
                          y: rect.top  - (cRect?.top  ?? 0) - 8,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        width:  `${CELL}px`,
                        height: `${CELL}px`,
                        borderRadius: '3px',
                        background: isFuture ? 'transparent' : cellColor(cell.count),
                        cursor: cell.count > 0 ? 'default' : 'default',
                        transition: 'opacity 0.1s',
                        opacity: isFuture ? 0 : 1,
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
          gap: '5px', marginTop: '0.8rem',
        }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} style={{
              width: '10px', height: '10px', borderRadius: '2px',
              background: cellColor(n),
            }} />
          ))}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>More</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.x}px`,
              top:  `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              background: 'var(--brown-dark)',
              color: 'var(--cream)',
              fontSize: '0.72rem',
              padding: '0.3em 0.7em',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}
