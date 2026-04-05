'use client';

import { useRef, useEffect, useCallback } from 'react';
import { AnimationState, PetState } from './types';
import { drawCreature, DrawOpts } from './creatures';
import { getCreatureIdx } from './evolution';

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const CW    = 48;
const CH    = 56;
const SCALE = 4;

// ─── Robot color palette ──────────────────────────────────────────────────────
const C = {
  ORANGE:    '#D44E2C', ORANGE_SH: '#A83B1E', ORANGE_HI: '#E8693D',
  OUTLINE:   '#1C0800',
  EYE_WHITE: '#EEE4CE', EYE_SH:    '#C8BA98',
  PUPIL:     '#140800', PUPIL_HI:  '#FFFFFF',
  INNER:     '#8A3018', ANTENNA:   '#F0A030',
};

function pr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ─── Robot sprite ─────────────────────────────────────────────────────────────
function drawRobot(ctx: CanvasRenderingContext2D, opts: DrawOpts) {
  ctx.clearRect(0, 0, CW, CH);
  const dy = Math.round(opts.dy);

  // Antenna bumps
  pr(ctx, 13, 4+dy, 4, 4, C.ORANGE_SH); pr(ctx, 14, 3+dy, 3, 4, C.ORANGE);
  pr(ctx, 31, 4+dy, 4, 4, C.ORANGE_SH); pr(ctx, 31, 3+dy, 3, 4, C.ORANGE);
  const tipColor = opts.glow ? C.ANTENNA : C.ORANGE_SH;
  pr(ctx, 15, 2+dy, 2, 2, tipColor); pr(ctx, 31, 2+dy, 2, 2, tipColor);

  // Head
  pr(ctx, 11, 8+dy, 26, 20, C.ORANGE_SH); pr(ctx, 10, 7+dy, 26, 20, C.ORANGE);
  pr(ctx, 10, 7+dy, 26, 1, C.ORANGE_HI); pr(ctx, 10, 7+dy, 1, 20, C.ORANGE_HI);

  // Eye sockets
  pr(ctx, 13, 11+dy, 8, 8, C.ORANGE_SH); pr(ctx, 25, 11+dy, 8, 8, C.ORANGE_SH);

  // Eyes
  const eyeH  = Math.round(7 * Math.max(0, opts.eyeOpenL));
  const eyeHR = Math.round(7 * Math.max(0, opts.eyeOpenR));
  const eyeYL = 12 + dy + Math.round((7 - eyeH)  / 2);
  const eyeYR = 12 + dy + Math.round((7 - eyeHR) / 2);

  if (eyeH > 0) {
    pr(ctx, 14, eyeYL, 6, eyeH, C.EYE_WHITE);
    const pxL = 15 + Math.round(opts.pupilLX * 1.5);
    pr(ctx, pxL, eyeYL + Math.round(eyeH * 0.25), 3, Math.min(3, eyeH), C.PUPIL);
    pr(ctx, pxL, eyeYL + Math.round(eyeH * 0.25), 1, 1, C.PUPIL_HI);
  } else { pr(ctx, 14, 15+dy, 6, 1, C.ORANGE_SH); }

  if (eyeHR > 0) {
    pr(ctx, 26, eyeYR, 6, eyeHR, C.EYE_WHITE);
    const pxR = 27 + Math.round(opts.pupilRX * 1.5);
    pr(ctx, pxR, eyeYR + Math.round(eyeHR * 0.25), 3, Math.min(3, eyeHR), C.PUPIL);
    pr(ctx, pxR, eyeYR + Math.round(eyeHR * 0.25), 1, 1, C.PUPIL_HI);
  } else { pr(ctx, 26, 15+dy, 6, 1, C.ORANGE_SH); }

  // Mouth
  if (opts.mouthOpen > 0.3) {
    const mw = Math.round(opts.mouthOpen * 5); const mh = Math.round(opts.mouthOpen * 3);
    pr(ctx, 22 - Math.floor(mw / 2), 22+dy, mw, mh, C.INNER);
  } else if (opts.frown) {
    pr(ctx, 19, 22+dy, 2, 1, C.INNER); pr(ctx, 25, 22+dy, 2, 1, C.INNER);
    pr(ctx, 21, 23+dy, 4, 1, C.INNER);
  } else {
    pr(ctx, 19, 22+dy, 2, 1, C.INNER); pr(ctx, 25, 22+dy, 2, 1, C.INNER);
    pr(ctx, 20, 23+dy, 6, 1, C.INNER);
  }

  // Body
  pr(ctx, 12, 28+dy, 24, 14, C.ORANGE_SH); pr(ctx, 11, 27+dy, 24, 14, C.ORANGE);
  pr(ctx, 11, 27+dy, 24, 1, C.ORANGE_HI); pr(ctx, 11, 27+dy, 1, 14, C.ORANGE_HI);
  pr(ctx, 15, 29+dy, 16, 9, C.ORANGE_SH); pr(ctx, 16, 30+dy, 14, 7, C.ORANGE);
  pr(ctx, 22, 32+dy, 2, 2, opts.glow ? C.ANTENNA : C.ORANGE_SH); // chest indicator

  // Legs
  pr(ctx, 13, 42+dy, 8, 9, C.ORANGE_SH); pr(ctx, 12, 41+dy, 8, 9, C.ORANGE);
  pr(ctx, 12, 41+dy, 1, 9, C.ORANGE_HI);
  pr(ctx, 27, 42+dy, 8, 9, C.ORANGE_SH); pr(ctx, 26, 41+dy, 8, 9, C.ORANGE);
  pr(ctx, 26, 41+dy, 1, 9, C.ORANGE_HI);
  pr(ctx, 11, 50+dy, 10, 3, C.ORANGE_SH); pr(ctx, 10, 49+dy, 10, 3, C.ORANGE);
  pr(ctx, 25, 50+dy, 10, 3, C.ORANGE_SH); pr(ctx, 24, 49+dy, 10, 3, C.ORANGE);
}

// ─── Particle effects ─────────────────────────────────────────────────────────
function drawHearts(ctx: CanvasRenderingContext2D, frame: number) {
  const slots = [
    { x: CW * 0.15, phase: 0 }, { x: CW * 0.75, phase: 0.4 }, { x: CW * 0.45, phase: 0.75 },
  ];
  slots.forEach(s => {
    const t = ((frame * 0.035 + s.phase) % 1);
    if (t > 0.85) return;
    const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.7;
    const y = 14 - t * 18;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E83838';
    ctx.beginPath();
    ctx.arc(s.x - 1, y - 1, 2, 0, Math.PI * 2);
    ctx.arc(s.x + 1, y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s.x - 3, y); ctx.lineTo(s.x, y + 4); ctx.lineTo(s.x + 3, y);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawZZZ(ctx: CanvasRenderingContext2D, frame: number) {
  [0, 0.33, 0.66].forEach((phase, i) => {
    const t = ((frame * 0.022 + phase) % 1);
    if (t > 0.88) return;
    const alpha = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.76;
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = '#5878A8';
    ctx.font = `bold ${6 + i * 2}px monospace`;
    ctx.fillText('z', CW * 0.72 + i * 4, 12 - t * 18);
    ctx.globalAlpha = 1;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  animState:   AnimationState;
  pet:         PetState;
  onAnimDone?: () => void;
}

export default function HopperSprite({ animState, pet, onAnimDone }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const frameRef    = useRef(0);
  const rafRef      = useRef<number>(0);
  const stateRef    = useRef(animState);
  const onDoneRef   = useRef(onAnimDone);
  stateRef.current  = animState;
  onDoneRef.current = onAnimDone;

  // Determine if we render robot or an evolved creature
  const isEvolved   = (pet.level ?? 1) >= 2 && !!pet.evolutionSpecies;
  const creatureIdx = isEvolved ? getCreatureIdx(pet.evolutionSpecies!) : -1;

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const f     = frameRef.current++;
    const state = stateRef.current;

    const idleBob   = Math.sin(f * 0.05) * 0.8;
    const slowBlink = f % 180 > 172 ? Math.max(0, 1 - (f % 180 - 172) / 4) : 1;

    const opts: DrawOpts = {
      dy: idleBob, eyeOpenL: slowBlink, eyeOpenR: slowBlink,
      pupilLX: -0.3, pupilRX: 0.3, mouthOpen: 0, frown: false, glow: false,
    };

    if (state === 'pet') {
      const squint = Math.max(0.1, 0.5 - f * 0.012);
      opts.eyeOpenL = squint; opts.eyeOpenR = squint;
      opts.dy = idleBob + Math.sin(f * 0.25) * 0.7;

    } else if (state === 'happy') {
      opts.glow     = true;
      opts.eyeOpenL = Math.max(0.15, Math.abs(Math.sin(f * 0.3)));
      opts.eyeOpenR = Math.max(0.15, Math.abs(Math.sin(f * 0.3)));
      opts.dy       = -Math.abs(Math.sin(f * 0.25)) * 4;
      if (f >= 120 && onDoneRef.current) onDoneRef.current();

    } else if (state === 'eat') {
      const phase = (f % 30) / 30;
      opts.mouthOpen = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      opts.eyeOpenL  = 1; opts.eyeOpenR = 1;
      if (f >= 90 && onDoneRef.current) onDoneRef.current();

    } else if (state === 'hungry') {
      opts.dy       = Math.sin(f * 0.025) * 0.5;
      opts.eyeOpenL = 0.4; opts.eyeOpenR = 0.4;
      opts.frown    = true;

    } else if (state === 'sleep') {
      opts.eyeOpenL = 0; opts.eyeOpenR = 0; opts.dy = 0;
    }

    // ── Dispatch: robot (Lv1) or evolved creature ─────────
    if (isEvolved && creatureIdx >= 0) {
      drawCreature(creatureIdx, ctx, opts, f);
    } else {
      drawRobot(ctx, opts);
    }

    // Particles
    if (state === 'pet' || state === 'happy') drawHearts(ctx, f);
    if (state === 'sleep') drawZZZ(ctx, f);

    rafRef.current = requestAnimationFrame(animate);
  }, [isEvolved, creatureIdx]);

  useEffect(() => { frameRef.current = 0; }, [animState]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  void pet;

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      style={{
        imageRendering: 'pixelated',
        display:        'block',
        width:          CW * SCALE,
        height:         CH * SCALE,
        cursor:         'pointer',
      }}
    />
  );
}
