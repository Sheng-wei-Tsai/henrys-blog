'use client';

import { useRef, useEffect, useState } from 'react';
import { PetState, LEVEL_NAMES } from './types';

function getFedCount(): number {
  try {
    const raw = localStorage.getItem('petcho_fed');
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}

function getDaysAlive(pet: PetState): number {
  // Approximate: totalPets / 3 as a rough proxy, or track creation date
  // Use lastVisit as upper bound; we don't store creation date in Phase 1-4
  return Math.max(1, Math.floor(pet.totalPets / 3 + 1));
}

interface Props {
  pet: PetState;
  onClose: () => void;
}

export default function PetShareCard({ pet, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const fedCount = getFedCount();
  const daysAlive = getDaysAlive(pet);
  const levelName = LEVEL_NAMES[pet.level] ?? 'Legend';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 480, H = 200;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#fdf5e4';
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = '#140a05';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Accent bar left
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#c0281c');
    grad.addColorStop(1, '#c88a14');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 14, 5, H - 28);

    // Lizard emoji
    ctx.font = '52px serif';
    ctx.fillText('🦎', 30, 110);

    // Name
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(pet.name, 100, 55);

    // Level badge
    ctx.fillStyle = '#e8d5a8';
    ctx.strokeStyle = '#140a05';
    ctx.lineWidth = 1.5;
    const badgeW = 110;
    roundRect(ctx, 100, 66, badgeW, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5A3820';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`Lv.${pet.level} ${levelName}`, 108, 81);

    // Stats
    const stats = [
      { label: 'Posts fed', value: String(fedCount) },
      { label: 'Times petted', value: String(pet.totalPets) },
      { label: 'Days alive', value: String(daysAlive) },
      { label: 'Hunger', value: `${Math.round(pet.hunger)}%` },
    ];
    ctx.font = '13px "Courier New", monospace';
    stats.forEach((s, i) => {
      const x = 100 + (i % 2) * 180;
      const y = 115 + Math.floor(i / 2) * 30;
      ctx.fillStyle = '#8A6840';
      ctx.fillText(s.label, x, y);
      ctx.fillStyle = '#2C1810';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillText(s.value, x, y + 14);
      ctx.font = '13px "Courier New", monospace';
    });

    // Footer
    ctx.fillStyle = '#A08060';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('henry.tsai.dev/about — Petcho', W - 210, H - 16);
  }, [pet, fedCount, daysAlive]);

  function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(() => {
          // Fallback: open in new tab
          const url = canvas.toDataURL();
          window.open(url, '_blank');
        });
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20,10,5,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(3px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--warm-white)',
          border: '2px solid var(--ink)',
          borderRadius: '10px',
          boxShadow: '6px 6px 0 var(--ink)',
          padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          maxWidth: '520px', width: '94%',
        }}
      >
        <h3 style={{ margin: 0, fontFamily: "'Lora', serif", color: 'var(--brown-dark)', fontSize: '1.15rem' }}>
          Show off {pet.name}!
        </h3>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: 'auto',
            border: '1.5px solid var(--parchment)',
            borderRadius: '4px',
            imageRendering: 'pixelated',
          }}
        />
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--warm-white)', color: 'var(--brown-mid)',
              border: '2px solid var(--ink)', borderRadius: '4px',
              boxShadow: '2px 2px 0 var(--ink)',
              padding: '0.45em 1em', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'var(--jade)' : 'var(--vermilion)',
              color: 'white', border: '2px solid var(--ink)',
              borderRadius: '4px', boxShadow: '3px 3px 0 var(--ink)',
              padding: '0.45em 1.1em', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy image'}
          </button>
        </div>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
