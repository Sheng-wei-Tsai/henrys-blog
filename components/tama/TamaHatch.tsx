'use client';

import { useState } from 'react';

interface Props {
  onDone: (name: string) => void;
}

export default function TamaHatch({ onDone }: Props) {
  const [step, setStep] = useState<'intro' | 'name'>('intro');
  const [name, setName] = useState('');

  const btn: React.CSSProperties = {
    background:   '#c44c1c',
    color:        'white',
    border:       '2px solid #0f1228',
    borderRadius: '4px',
    boxShadow:    '3px 3px 0 #0f1228',
    padding:      '0.5em 1.4em',
    fontSize:     '0.9rem',
    fontWeight:   700,
    cursor:       'pointer',
    fontFamily:   "'Space Grotesk', sans-serif",
  };

  const panel: React.CSSProperties = {
    background:   'var(--warm-white)',
    border:       '2px solid var(--ink)',
    borderRadius: '10px',
    boxShadow:    '4px 4px 0 var(--ink)',
    padding:      '2rem 1.75rem',
    maxWidth:     '320px',
    margin:       '0 auto',
    display:      'flex',
    flexDirection: 'column',
    gap:          '1.25rem',
    textAlign:    'center',
  };

  if (step === 'intro') return (
    <div style={panel}>
      {/* Pixel egg drawn in CSS */}
      <div style={{
        margin:     '0 auto',
        width:      '48px',
        height:     '56px',
        background: '#9aba6c',
        borderRadius: '50% 50% 45% 45% / 55% 55% 45% 45%',
        border:     '3px solid #0f380f',
        position:   'relative',
        boxShadow:  '2px 2px 0 #0f380f',
        animation:  'eggWobble 1.6s ease-in-out infinite',
      }}>
        <div style={{
          position:     'absolute',
          top:          '30%',
          left:         '15%',
          width:        '25%',
          height:       '35%',
          background:   '#8bac0f',
          borderRadius: '50%',
          opacity:      0.6,
        }} />
        <style>{`
          @keyframes eggWobble {
            0%,100% { transform: rotate(-4deg); }
            50%      { transform: rotate(4deg); }
          }
        `}</style>
      </div>

      <h3 style={{
        fontFamily: "'Lora', serif",
        fontSize:   '1.3rem',
        color:      'var(--brown-dark)',
        margin:     0,
      }}>
        Something is hatching…
      </h3>
      <p style={{
        color:      'var(--text-secondary)',
        fontSize:   '0.88rem',
        lineHeight: 1.7,
        margin:     0,
      }}>
        A virtual Aussie creature is waiting inside this egg.
        Keep it fed by reading posts. Pet it, play with it, keep it happy.
        Neglect it and it will evolve into… something unfortunate.
      </p>
      <button style={btn} onClick={() => setStep('name')}>
        Hatch it →
      </button>
    </div>
  );

  return (
    <div style={panel}>
      <h3 style={{
        fontFamily: "'Lora', serif",
        fontSize:   '1.2rem',
        color:      'var(--brown-dark)',
        margin:     0,
      }}>
        Name your creature
      </h3>
      <input
        type="text"
        value={name}
        maxLength={12}
        autoFocus
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && onDone(name.trim())}
        placeholder="e.g. Quokky"
        style={{
          border:       '2px solid var(--ink)',
          borderRadius: '4px',
          padding:      '0.5em 0.8em',
          fontSize:     '1.1rem',
          fontFamily:   "'Lora', serif",
          background:   'var(--cream)',
          color:        'var(--brown-dark)',
          outline:      'none',
          boxShadow:    '2px 2px 0 var(--ink)',
          textAlign:    'center',
        }}
      />
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
        <button
          style={{ ...btn, background: 'var(--warm-white)', color: 'var(--brown-mid)', boxShadow: '2px 2px 0 var(--ink)' }}
          onClick={() => setStep('intro')}
        >
          ← Back
        </button>
        <button
          style={{ ...btn, opacity: name.trim() ? 1 : 0.5 }}
          disabled={!name.trim()}
          onClick={() => onDone(name.trim())}
        >
          Hatch! 🥚
        </button>
      </div>
    </div>
  );
}
