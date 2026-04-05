'use client';

import { useEffect, useState, useRef } from 'react';

// ─── Terminal palette ──────────────────────────────────────────────────────────
const T = {
  bg:        '#050A05',
  bgInner:   '#080F08',
  green:     '#33FF00',
  greenMid:  '#1A9900',
  greenDim:  '#0B5200',
  dim:       '#082800',
  border:    '#144A0A',
  amber:     '#FFB000',
  red:       '#FF2222',
  redDim:    '#660000',
  redBorder: '#3A0808',
};

const LOG_POOL = [
  'companion_daemon: running  [ok]',
  'hunger_tick: -0.07        [monitoring]',
  'session.keepalive()       [200ms]',
  'syncing with claude.ai    [ok]',
  'personality_matrix loaded [curious]',
  'petting_streak: active    [+xp]',
  'happiness_monitor: idle   [watching]',
  'memory.persist()          [ok]',
  'companion.status()        → idle',
  'awaiting interaction...',
  'uptime_tracker: running',
  'streak_bonus applied      [+xp]',
  'event_loop: 60fps         [ok]',
  'hunger: decaying          [natural]',
  'companion.wave()          [friendly]',
];

interface HabitatTheme { primary: string; mid: string; dim: string; }

interface Props {
  children?:     React.ReactNode;
  petName?:      string;
  hunger?:       number;
  isCritical?:   boolean;
  habitatTheme?: HabitatTheme;
}

export default function HabitatScene({
  children,
  petName      = 'buddy',
  hunger       = 80,
  isCritical   = false,
  habitatTheme,
}: Props) {
  const [logs, setLogs]       = useState<string[]>([]);
  const [cursor, setCursor]   = useState(true);
  const [flash, setFlash]     = useState(false);
  const logIdxRef             = useRef(Math.floor(Math.random() * LOG_POOL.length));

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  // Rotating log messages
  useEffect(() => {
    const push = () => {
      const msg = LOG_POOL[logIdxRef.current % LOG_POOL.length];
      logIdxRef.current++;
      setLogs(prev => [...prev.slice(-6), msg]);
    };
    push();
    const id = setInterval(push, 2600 + Math.random() * 1400);
    return () => clearInterval(id);
  }, []);

  // Critical screen flash
  useEffect(() => {
    if (!isCritical) { setFlash(false); return; }
    const id = setInterval(() => setFlash(f => !f), 700);
    return () => clearInterval(id);
  }, [isCritical]);

  const theme        = habitatTheme;
  const primaryColor = isCritical ? (flash ? T.red : T.redDim)  : (theme?.primary ?? T.green);
  const dimColor     = isCritical ? T.redDim                     : (theme?.dim     ?? T.greenDim);
  const borderColor  = isCritical ? T.redBorder                  : (theme ? '#1A2A18' : T.border);
  const modeLabel    = isCritical ? '⚠ CRITICAL — NEEDS FOOD'
    : hunger < 40   ? '⚠ HUNGRY'
    : '● ONLINE';
  const modeColor    = isCritical ? T.red : hunger < 40 ? T.amber : (theme?.mid ?? T.greenMid);

  return (
    <div style={{
      position:   'relative',
      width:      '100%',
      background: T.bg,
      border:     `2px solid ${borderColor}`,
      borderRadius: '6px',
      overflow:   'hidden',
      fontFamily: '"Courier New", Courier, monospace',
      boxShadow:  isCritical
        ? `0 0 18px ${T.red}22, inset 0 0 32px #00000090`
        : `0 0 14px ${T.greenDim}22, inset 0 0 32px #00000080`,
      transition: 'box-shadow 0.4s, border-color 0.4s',
    }}>

      {/* ── Title bar ─────────────────────────────────────── */}
      <div style={{
        padding:      '5px 10px',
        borderBottom: `1px solid ${borderColor}`,
        background:   '#030603',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        userSelect:   'none',
      }}>
        {/* macOS traffic lights */}
        {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
          <div key={i} style={{
            width: 9, height: 9,
            borderRadius: '50%',
            background: c,
            opacity: 0.65,
          }} />
        ))}
        <span style={{ color: dimColor, fontSize: '0.58rem', marginLeft: '6px', letterSpacing: '0.06em' }}>
          {petName.toLowerCase()}@claude — companion v1.0
        </span>
        <span style={{ marginLeft: 'auto', color: modeColor, fontSize: '0.58rem', fontWeight: 700 }}>
          {modeLabel}
        </span>
      </div>

      {/* ── Main screen ───────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Phosphor glow background */}
        <div style={{
          position:   'absolute',
          inset:      0,
          background: isCritical
            ? `radial-gradient(ellipse at 50% 40%, #180505 0%, ${T.bg} 65%)`
            : `radial-gradient(ellipse at 50% 40%, ${T.bgInner} 0%, ${T.bg} 65%)`,
          transition: 'background 0.4s',
        }} />

        {/* Scanlines */}
        <div style={{
          position:        'absolute',
          inset:           0,
          pointerEvents:   'none',
          zIndex:          10,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0.10) 4px)',
        }} />

        {/* Corner info */}
        <div style={{
          position:    'absolute',
          top:         '6px',
          left:        '8px',
          fontSize:    '0.52rem',
          color:       dimColor,
          fontFamily:  'monospace',
          opacity:     0.7,
          pointerEvents: 'none',
          zIndex:      6,
        }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{
          position:    'absolute',
          top:         '6px',
          right:       '8px',
          fontSize:    '0.52rem',
          color:       hunger < 15 ? T.red : hunger < 40 ? T.amber : dimColor,
          fontFamily:  'monospace',
          opacity:     0.85,
          pointerEvents: 'none',
          zIndex:      6,
        }}>
          {hunger < 1 ? 'STARVING' : `HNG:${Math.round(hunger)}%`}
        </div>

        {/* Pet sprite centered */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          paddingTop:     '20px',
          paddingBottom:  '4px',
          position:       'relative',
          zIndex:         5,
        }}>
          {children}
        </div>

        {/* Scrolling log lines */}
        <div style={{
          padding:    '2px 8px 6px',
          fontSize:   '0.54rem',
          lineHeight: 1.55,
          position:   'relative',
          zIndex:     6,
          background: `linear-gradient(transparent, ${T.bg}E0)`,
          minHeight:  '56px',
        }}>
          {logs.slice(-3).map((l, i, arr) => (
            <div key={`${i}-${l}`} style={{
              opacity:     0.25 + (i / Math.max(arr.length - 1, 1)) * 0.55,
              color:       i === arr.length - 1 ? primaryColor : dimColor,
              overflow:    'hidden',
              whiteSpace:  'nowrap',
              textOverflow:'ellipsis',
            }}>
              {'> '}{l}
            </div>
          ))}
          <div style={{ color: primaryColor, opacity: 0.9, marginTop: '1px' }}>
            {petName.toLowerCase()}@claude:~${cursor ? '█' : ' '}
          </div>
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────── */}
      <div style={{
        padding:      '3px 10px',
        borderTop:    `1px solid ${borderColor}`,
        background:   '#030603',
        display:      'flex',
        justifyContent: 'space-between',
        fontSize:     '0.52rem',
        color:        dimColor,
        fontFamily:   'monospace',
        userSelect:   'none',
      }}>
        <span style={{ color: isCritical ? T.red : T.greenMid }}>
          {isCritical ? '▲ URGENT' : '▶ RUNNING'}
        </span>
        <span>companion.ts</span>
        <span>UTF-8  LF</span>
      </div>
    </div>
  );
}
