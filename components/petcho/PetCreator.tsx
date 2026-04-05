'use client';

import { useState } from 'react';
import { PetPersonality, DEFAULT_PET, PetState } from './types';

const PALETTE_LABELS = ['Olive Green', 'Desert Terracotta', 'Rainforest Blue'];
const PALETTE_SWATCHES = ['#6B8C2A', '#A05828', '#5A7A8A'];

const PERSONALITIES: { id: PetPersonality; emoji: string; label: string; desc: string }[] = [
  { id: 'curious',   emoji: '🔍', label: 'Curious',   desc: 'Head-tilts, watches your cursor' },
  { id: 'lazy',      emoji: '😴', label: 'Lazy',      desc: 'Long blinks, yawns a lot'        },
  { id: 'energetic', emoji: '⚡', label: 'Energetic', desc: 'Mini jumps, fast tail flicks'     },
  { id: 'grumpy',    emoji: '😤', label: 'Grumpy',    desc: 'Side-eye, occasional huffs'       },
];

interface Props {
  onDone: (pet: PetState) => void;
}

export default function PetCreator({ onDone }: Props) {
  const [step, setStep] = useState<'intro' | 'name' | 'color' | 'personality'>('intro');
  const [name, setName] = useState('Buddy');
  const [color, setColor] = useState(0);
  const [personality, setPersonality] = useState<PetPersonality>('curious');

  function finish() {
    onDone({
      ...DEFAULT_PET,
      name,
      color,
      personality,
      lastVisit: Date.now(),
    });
  }

  const panelStyle: React.CSSProperties = {
    background: 'var(--warm-white)',
    border: '2px solid var(--ink)',
    borderRadius: '10px',
    boxShadow: '4px 4px 0 var(--ink)',
    padding: '2rem 1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'var(--vermilion)',
    color: 'white',
    border: '2px solid var(--ink)',
    boxShadow: '3px 3px 0 var(--ink)',
    borderRadius: '4px',
    padding: '0.55em 1.4em',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    transition: 'transform 0.1s, box-shadow 0.1s',
  };

  return (
    <div style={panelStyle}>
      {step === 'intro' && (
        <>
          <div style={{ textAlign: 'center', fontSize: '4rem', lineHeight: 1 }}>🤖</div>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.4rem', color: 'var(--brown-dark)', margin: 0, textAlign: 'center' }}>
            Meet your Claude Code buddy!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
            A pixel robot companion living inside a tiny CLI terminal.
            Pet it, read posts to feed it, keep it happy.
            It <em>will</em> get hungry if you don&apos;t visit — fast.
          </p>
          <button style={btnPrimary} onClick={() => setStep('name')}>
            boot up →
          </button>
        </>
      )}

      {step === 'name' && (
        <>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', color: 'var(--brown-dark)', margin: 0 }}>
            Give your buddy a name
          </h3>
          <input
            type="text"
            value={name}
            maxLength={16}
            onChange={e => setName(e.target.value)}
            placeholder="Hopper"
            style={{
              border: '2px solid var(--ink)',
              borderRadius: '4px',
              padding: '0.5em 0.8em',
              fontSize: '1.1rem',
              fontFamily: "'Lora', serif",
              background: 'var(--cream)',
              color: 'var(--brown-dark)',
              outline: 'none',
              boxShadow: '2px 2px 0 var(--ink)',
            }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button style={{ ...btnPrimary, background: 'var(--warm-white)', color: 'var(--brown-mid)', boxShadow: '2px 2px 0 var(--ink)' }} onClick={() => setStep('intro')}>
              ← Back
            </button>
            <button style={btnPrimary} onClick={() => name.trim() && setStep('color')} disabled={!name.trim()}>
              Next →
            </button>
          </div>
        </>
      )}

      {step === 'color' && (
        <>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', color: 'var(--brown-dark)', margin: 0 }}>
            Pick {name}&apos;s scale colour
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {PALETTE_SWATCHES.map((hex, i) => (
              <button
                key={i}
                onClick={() => setColor(i)}
                style={{
                  width: '56px', height: '56px',
                  background: hex,
                  border: `3px solid ${color === i ? 'var(--ink)' : 'transparent'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: color === i ? '3px 3px 0 var(--ink)' : '1px 1px 0 rgba(0,0,0,0.2)',
                  outline: color === i ? '2px solid var(--vermilion)' : 'none',
                  outlineOffset: '2px',
                  transition: 'all 0.15s',
                }}
                title={PALETTE_LABELS[i]}
              />
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {PALETTE_LABELS[color]}
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button style={{ ...btnPrimary, background: 'var(--warm-white)', color: 'var(--brown-mid)', boxShadow: '2px 2px 0 var(--ink)' }} onClick={() => setStep('name')}>
              ← Back
            </button>
            <button style={btnPrimary} onClick={() => setStep('personality')}>
              Next →
            </button>
          </div>
        </>
      )}

      {step === 'personality' && (
        <>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', color: 'var(--brown-dark)', margin: 0 }}>
            {name}&apos;s personality
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PERSONALITIES.map(p => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: personality === p.id ? 'var(--parchment)' : 'var(--warm-white)',
                  border: `2px solid ${personality === p.id ? 'var(--ink)' : 'var(--parchment)'}`,
                  borderRadius: '6px',
                  padding: '0.6rem 0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: personality === p.id ? '2px 2px 0 var(--ink)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                <span>
                  <span style={{ fontWeight: 700, color: 'var(--brown-dark)', fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif" }}>{p.label}</span>
                  <br />
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{p.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button style={{ ...btnPrimary, background: 'var(--warm-white)', color: 'var(--brown-mid)', boxShadow: '2px 2px 0 var(--ink)' }} onClick={() => setStep('color')}>
              ← Back
            </button>
            <button style={btnPrimary} onClick={finish}>
              Meet {name}! 🦎
            </button>
          </div>
        </>
      )}
    </div>
  );
}
