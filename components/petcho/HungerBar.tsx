'use client';

import { LEVEL_NAMES } from './types';

// ─── Terminal palette ──────────────────────────────────────────────────────────
const T = {
  bg:       '#050A05',
  green:    '#33FF00',
  greenMid: '#1A9900',
  greenDim: '#0B5200',
  dim:      '#082800',
  border:   '#144A0A',
  amber:    '#FFB000',
  red:      '#FF2222',
  blue:     '#4488FF',
  blueDim:  '#1A3A8A',
};

interface Props {
  name:         string;
  hunger:       number;
  happiness:    number;
  level:        number;
  xp:           number;
  totalPets:    number;
  streak:       number;
  speciesName?: string;
}

function AsciiBar({ value, width = 16, color, lowColor }: {
  value:     number;
  width?:    number;
  color:     string;
  lowColor?: string;
}) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * width);
  const empty  = width - filled;
  const isLow  = value < 30;
  const fc     = isLow && lowColor ? lowColor : color;
  return (
    <span style={{ fontFamily: '"Courier New", monospace', letterSpacing: '0' }}>
      <span style={{ color: fc }}>{'\u2588'.repeat(filled)}</span>
      <span style={{ color: T.dim }}>{'\u2591'.repeat(empty)}</span>
    </span>
  );
}

function statColor(val: number): string {
  if (val < 15) return T.red;
  if (val < 30) return T.amber;
  return T.green;
}

export default function HungerBar({ name, hunger, happiness, level, xp, totalPets, streak, speciesName }: Props) {
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const nextXp    = [0, 100, 300, 600, 1000][level] ?? 1000;
  const prevXp    = [0, 0, 100, 300, 600][level]    ?? 0;
  const xpPct     = level >= 5
    ? 100
    : Math.round(((xp - prevXp) / (nextXp - prevXp)) * 100);

  const isCritical = hunger < 15;
  const isHungry   = hunger < 30 && !isCritical;

  return (
    <div style={{
      background:   T.bg,
      border:       `2px solid ${isCritical ? '#3A0808' : T.border}`,
      borderRadius: '6px',
      padding:      '10px 12px 8px',
      fontFamily:   '"Courier New", Courier, monospace',
      fontSize:     '0.7rem',
      lineHeight:   1.75,
      boxShadow:    isCritical
        ? `0 0 10px #FF000018, 3px 3px 0 #1A0808`
        : `3px 3px 0 #0A1A08`,
      transition:   'border-color 0.3s, box-shadow 0.3s',
    }}>

      {/* ── Prompt header ─────────────────────────────────── */}
      <div style={{ color: T.dim, marginBottom: '2px', fontSize: '0.63rem', letterSpacing: '0.03em' }}>
        <span style={{ color: T.green }}>❯</span>{' '}
        <span style={{ color: T.greenMid }}>{name.toLowerCase()}@claude</span>
        <span style={{ color: T.dim }}>:~$</span>{' '}
        <span style={{ color: T.green }}>status --verbose</span>
        {speciesName && (
          <span style={{ color: T.greenDim, marginLeft: '8px', fontSize: '0.58rem' }}>
            [{speciesName}]
          </span>
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      {[
        {
          label: 'HUNGER',
          value: hunger,
          color: statColor(hunger),
          badge: isCritical   ? <span style={{ color: T.red,   fontWeight: 700 }}> ⚠ CRITICAL</span>
               : isHungry     ? <span style={{ color: T.amber, fontWeight: 700 }}> ⚠ LOW</span>
               : null,
        },
        {
          label: 'HAPPY',
          value: happiness,
          color: statColor(happiness),
          badge: happiness < 30
            ? <span style={{ color: T.amber, fontWeight: 700 }}> ⚠ SAD</span>
            : null,
        },
        {
          label: 'XP',
          value: xpPct,
          color: T.blue,
          badge: <span style={{ color: T.blueDim, fontSize: '0.62rem' }}> → Lv.{level} {levelName}</span>,
        },
      ].map(row => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: T.greenDim, width: '60px', flexShrink: 0 }}>{row.label}</span>
          <AsciiBar value={row.value} color={row.color} lowColor={T.red} />
          <span style={{ color: row.color, minWidth: '32px', textAlign: 'right' }}>
            {Math.round(row.value)}%
          </span>
          {row.badge}
        </div>
      ))}

      {/* ── Divider ───────────────────────────────────────── */}
      <div style={{ color: T.dim, margin: '3px 0 2px', fontSize: '0.6rem', letterSpacing: '-0.02em' }}>
        {'─'.repeat(38)}
      </div>

      {/* ── Streak + pet count ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.65rem' }}>
        <span>
          <span style={{ color: T.dim }}>STREAK </span>
          <span style={{
            color:      streak >= 7 ? '#FF8800' : streak >= 3 ? T.amber : T.green,
            fontWeight: 700,
          }}>
            {streak > 0 ? `${streak}d` : '0d'}
            {streak >= 7 ? ' 🔥🔥' : streak >= 3 ? ' 🔥' : ''}
          </span>
        </span>
        <span>
          <span style={{ color: T.dim }}>PETS </span>
          <span style={{ color: T.green }}>{totalPets.toLocaleString()}×</span>
        </span>
        {streak === 0 && (
          <span style={{ color: T.greenDim, fontSize: '0.6rem', fontStyle: 'italic' }}>
            visit daily for streak 🔥
          </span>
        )}
      </div>
    </div>
  );
}
