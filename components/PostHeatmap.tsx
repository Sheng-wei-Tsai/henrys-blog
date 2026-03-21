'use client';
import { useMemo, useState, useEffect, useRef } from 'react';

interface Props { dates: string[] }

const CELL        = 11;
const GAP         = 2;
const STEP        = CELL + GAP;
const DAY_LABEL_W = 28;
const MONTH_H     = 16;
const DAY_LABELS  = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

type Cell = {
  date: string; count: number;
  isToday: boolean; isFuture: boolean; isOutOfRange: boolean;
};

function cellColor(count: number, isFuture: boolean, isOutOfRange: boolean): string {
  if (isFuture || isOutOfRange) return 'rgba(196,98,58,0.04)';
  if (count === 0) return 'rgba(196,98,58,0.09)';
  if (count === 1) return 'rgba(196,98,58,0.28)';
  if (count === 2) return 'rgba(196,98,58,0.55)';
  if (count === 3) return 'rgba(196,98,58,0.78)';
  return '#c4623a';
}

function formatDisplay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function buildYearGrid(dates: string[], year: number) {
  const countMap: Record<string, number> = {};
  for (const d of dates) countMap[d] = (countMap[d] ?? 0) + 1;

  const jan1 = new Date(year, 0, 1);
  const start = new Date(jan1);
  start.setDate(jan1.getDate() - jan1.getDay());
  const end = new Date(year, 11, 31);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const weeks: Cell[][] = [];
  const months: { label: string; col: number }[] = [];
  let cur = new Date(start), lastMonth = -1, col = 0;

  while (cur <= end) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().split('T')[0];
      const isOutOfRange = cur.getFullYear() !== year;
      if (d === 0 && !isOutOfRange && cur.getMonth() !== lastMonth) {
        months.push({ label: cur.toLocaleDateString('en-AU', { month: 'short' }), col });
        lastMonth = cur.getMonth();
      }
      week.push({ date: iso, count: countMap[iso] ?? 0, isToday: iso === todayStr, isFuture: cur > today, isOutOfRange });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week); col++;
  }
  return { weeks, months };
}

// Mobile: prev month + current month + next month
function buildMonthGrid(dates: string[]) {
  const countMap: Record<string, number> = {};
  for (const d of dates) countMap[d] = (countMap[d] ?? 0) + 1;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const rangeEnd   = new Date(today.getFullYear(), today.getMonth() + 2, 0); // last day of next month

  // back to Sunday
  const start = new Date(rangeStart);
  start.setDate(rangeStart.getDate() - rangeStart.getDay());

  const weeks: Cell[][] = [];
  const months: { label: string; col: number }[] = [];
  let cur = new Date(start), lastMonth = -1, col = 0;

  while (cur <= rangeEnd) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().split('T')[0];
      const isOutOfRange = cur < rangeStart || cur > rangeEnd;
      if (d === 0 && !isOutOfRange && cur.getMonth() !== lastMonth) {
        months.push({ label: cur.toLocaleDateString('en-AU', { month: 'long' }), col });
        lastMonth = cur.getMonth();
      }
      week.push({ date: iso, count: countMap[iso] ?? 0, isToday: iso === todayStr, isFuture: cur > today, isOutOfRange });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week); col++;
  }
  return { weeks, months };
}

function computeStats(dates: string[], year: number) {
  const countMap: Record<string, number> = {};
  for (const d of dates) countMap[d] = (countMap[d] ?? 0) + 1;

  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const check = new Date(today);
  while (countMap[check.toISOString().split('T')[0]]) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  const totalYear = Object.entries(countMap)
    .filter(([d]) => d.startsWith(String(year)))
    .reduce((s, [, c]) => s + c, 0);

  return { streak, totalYear };
}

export default function PostHeatmap({ dates }: Props) {
  const year = new Date().getFullYear();
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string; count: number; x: number; y: number;
  } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { weeks, months } = useMemo(
    () => isMobile ? buildMonthGrid(dates) : buildYearGrid(dates, year),
    [dates, year, isMobile]
  );
  const { streak, totalYear } = useMemo(() => computeStats(dates, year), [dates, year]);

  const svgW = DAY_LABEL_W + weeks.length * STEP;
  const svgH = MONTH_H + 7 * STEP;

  function showTooltip(e: React.MouseEvent | React.TouchEvent, cell: Cell) {
    if (!cell.count || cell.isFuture || cell.isOutOfRange) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip({
      text: formatDisplay(cell.date),
      count: cell.count,
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    // Auto-dismiss on mobile after 2s
    if ('touches' in e) {
      tooltipTimeout.current = setTimeout(() => setTooltip(null), 2000);
    }
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem',
      }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.35rem', color: 'var(--brown-dark)', margin: 0 }}>
          Writing activity
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
          {streak > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--terracotta)', fontWeight: 600 }}>
              {streak} day streak
            </span>
          )}
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {totalYear} post{totalYear !== 1 ? 's' : ''} in {year}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} style={{ position: 'relative' }} onClick={() => setTooltip(null)}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          {/* Month labels */}
          {months.map((m, i) => (
            <text key={i} x={DAY_LABEL_W + m.col * STEP} y={MONTH_H - 3}
              fontSize={isMobile ? 8 : 9} fill="var(--text-muted)">
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text key={i} x={DAY_LABEL_W - 4} y={MONTH_H + i * STEP + CELL - 1}
                fontSize={9} fill="var(--text-muted)" textAnchor="end">
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((cell, di) => (
              <rect
                key={`${wi}-${di}`}
                x={DAY_LABEL_W + wi * STEP}
                y={MONTH_H + di * STEP}
                width={CELL} height={CELL} rx={2}
                fill={cellColor(cell.count, cell.isFuture, cell.isOutOfRange)}
                stroke={cell.isToday ? '#c4623a' : 'none'}
                strokeWidth={cell.isToday ? 1.5 : 0}
                style={{ cursor: cell.count > 0 ? 'pointer' : 'default' }}
                onMouseEnter={e => { e.stopPropagation(); showTooltip(e, cell); }}
                onMouseLeave={() => { if (!('ontouchstart' in window)) setTooltip(null); }}
                onTouchStart={e => { e.stopPropagation(); showTooltip(e, cell); }}
              />
            ))
          )}
        </svg>

        {/* HTML tooltip — large enough to read on mobile */}
        {tooltip && (
          <div
            style={{
              position:      'absolute',
              left:          `${tooltip.x}px`,
              top:           `${tooltip.y - 56}px`,
              transform:     'translateX(-50%)',
              background:    'var(--brown-dark)',
              color:         'var(--cream)',
              borderRadius:  '8px',
              padding:       '0.4em 0.85em',
              pointerEvents: 'none',
              zIndex:        30,
              textAlign:     'center',
              whiteSpace:    'nowrap',
              boxShadow:     '0 4px 16px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--terracotta)', lineHeight: 1.3 }}>
              {tooltip.count} post{tooltip.count > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.75, lineHeight: 1.3 }}>
              {tooltip.text}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '4px', marginTop: '0.3rem',
        }}>
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginRight: '2px' }}>Less</span>
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} style={{
              width: '10px', height: '10px', borderRadius: '2px',
              background: cellColor(n, false, false),
            }} />
          ))}
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginLeft: '2px' }}>More</span>
        </div>
      </div>
    </div>
  );
}
