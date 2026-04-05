'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const W  = 700;
const H  = 260;
const GY = 210;  // ground y — Tom's feet rest here

// ─── Colour palette (matched to reference) ───────────────────────────────────
const C = {
  BG:       '#A8B0BA',   // grey-blue studio backdrop
  BG2:      '#90989F',   // darker horizon strip
  GROUND:   '#86888A',   // flat ground plane
  ROCK:     '#7A7E84',   // rock base
  ROCK_HL:  '#9C9EA0',   // rock highlight facet
  ROCK_SH:  '#5A5C60',   // rock shadow under
  GREEN:    '#5EAE7A',   // Tom's body
  GREEN_D:  '#4A9068',   // shadow side
  GREEN_L:  '#78CC94',   // lit highlight
  BELLY:    '#B8EECE',   // pale belly / underjaw
  OUTLINE:  '#243028',   // dark contour
  EYE:      '#E0DECE',   // eye white (warm)
  EYE_RIM:  '#4A9068',   // coloured iris ring around pupil
  PUPIL:    '#161616',
  MOUTH_IN: '#7A1828',   // mouth cavity
  TONGUE:   '#D04060',
  TONGUE_D: '#A02040',
  SHADOW:   'rgba(20,28,24,0.18)',
};

// ─── Rock data ────────────────────────────────────────────────────────────────
interface Rock { cx: number; ry: number; rx: number; }
const ROCKS: Rock[] = [
  { cx: 110, rx: 62, ry: 36 },
  { cx: 340, rx: 44, ry: 24 },
  { cx: 580, rx: 68, ry: 40 },
];

// Tom stops on a rock when close enough
const ROCK_STOPS = ROCKS.map(r => r.cx);

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function oval(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  rx: number, ry: number,
  fill: string,
  stroke?: string,
  lw = 2.5,
  rot = 0,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

// ─── Background ───────────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D) {
  // Sky backdrop gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,   '#B8C2CC');
  g.addColorStop(0.7, '#9EA8B2');
  g.addColorStop(1,   '#888E94');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Ground plane
  ctx.fillStyle = C.GROUND;
  ctx.fillRect(0, GY, W, H - GY);
  ctx.strokeStyle = C.ROCK_SH;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

  // Rocks
  ROCKS.forEach(r => {
    const { cx, rx, ry } = r;
    // Cast shadow
    oval(ctx, cx + 6, GY + 5, rx + 4, ry * 0.35, C.SHADOW, undefined, 0);
    // Rock body (half-ellipse above ground)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, GY, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = C.ROCK;
    ctx.fill();
    ctx.strokeStyle = C.ROCK_SH;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Highlight facet
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.18, GY - ry * 0.55, rx * 0.42, ry * 0.28, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.ROCK_HL;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

// ─── Eye ──────────────────────────────────────────────────────────────────────
function drawEye(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number,
  br: number,        // bump radius
  open: number,      // 0=closed 1=open
  pox: number, poy: number,
) {
  // Green dome (the raised bump)
  oval(ctx, ex, ey, br + 3.5, br + 4, C.GREEN, C.OUTLINE, 2.5);

  const ry = br * Math.max(0, open);

  if (open <= 0.08) {
    ctx.beginPath();
    ctx.moveTo(ex - br * 0.75, ey + 1);
    ctx.quadraticCurveTo(ex, ey + br * 0.4, ex + br * 0.75, ey + 1);
    ctx.strokeStyle = C.OUTLINE; ctx.lineWidth = 2; ctx.stroke();
    return;
  }

  // Eyeball
  oval(ctx, ex, ey, br, ry, C.EYE, C.OUTLINE, 1.5);

  // Iris ring
  oval(ctx, ex, ey, br * 0.6, ry * 0.6, C.EYE_RIM, undefined, 0);

  // Pupil
  const px = ex + pox * br * 0.28;
  const py = ey + poy * ry * 0.22;
  oval(ctx, px, py, br * 0.36, br * 0.36 * open, C.PUPIL, undefined, 0);

  // Specular highlight
  oval(ctx, px - br * 0.22, py - ry * 0.22, br * 0.14, br * 0.14 * open, '#fff', undefined, 0);
}

// ─── Leg ──────────────────────────────────────────────────────────────────────
function drawLeg(
  ctx: CanvasRenderingContext2D,
  lx: number, ly: number,
  swing: number,  // rotation radians
  col: string,
) {
  ctx.save();
  ctx.translate(lx, ly);
  ctx.rotate(swing);
  // Thigh
  oval(ctx, 0, 12, 7, 14, col, C.OUTLINE, 2, 0);
  // Shin
  oval(ctx, 2, 26, 6, 10, col, C.OUTLINE, 1.5, 0.15);
  // Foot
  oval(ctx, 5, 36, 12, 6, col, C.OUTLINE, 1.5, 0.25);
  ctx.restore();
}

// ─── Arm ──────────────────────────────────────────────────────────────────────
function drawArm(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  swing: number,
  col: string,
) {
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(swing);
  oval(ctx, 0, 8, 5, 13, col, C.OUTLINE, 1.5, 0);
  // Little hand/fingers
  oval(ctx, 2, 20, 7, 5, col, C.OUTLINE, 1, 0.2);
  ctx.restore();
}

// ─── Tom ──────────────────────────────────────────────────────────────────────
interface TomOpts {
  x: number;
  gy: number;
  frame: number;
  state: TomState;
  facing: 'left' | 'right';
  walkPhase: number;
  mouthOpen: number;
  eyeOpen: number;
  waveArm: boolean;
}

function drawTom(ctx: CanvasRenderingContext2D, o: TomOpts) {
  const { x, gy, frame, state, facing, walkPhase, mouthOpen, eyeOpen, waveArm } = o;

  ctx.save();
  ctx.translate(x, gy);
  if (facing === 'left') ctx.scale(-1, 1);

  // Vertical offsets
  const breathe  = Math.sin(frame * 0.044) * 1.8;
  const walkBob  = (state === 'walk-r' || state === 'walk-l')
    ? -Math.abs(Math.sin(walkPhase * 0.5)) * 3.5 : 0;
  const happyJump = state === 'happy'
    ? -Math.abs(Math.sin(frame * 0.22)) * 22 : 0;
  const dy = breathe + walkBob + happyJump;

  // Leg swing
  const legSwing = (state === 'walk-r' || state === 'walk-l')
    ? Math.sin(walkPhase) * 0.3 : 0;

  // ── Cast shadow ───────────────────────────────────────
  oval(ctx, 5, 2, 38, 10, C.SHADOW, undefined, 0);

  // ── Tail ─────────────────────────────────────────────
  const tailSway = Math.sin(frame * 0.08) * 10
    + ((state === 'walk-r' || state === 'walk-l') ? Math.sin(walkPhase * 0.6) * 14 : 0);

  ctx.beginPath();
  ctx.moveTo(-18, -32 + dy);
  ctx.bezierCurveTo(-52, -18 + dy, -88, 4 + dy + tailSway * 0.5, -110, 22 + dy + tailSway);
  ctx.lineWidth = 22; ctx.strokeStyle = C.OUTLINE; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, -32 + dy);
  ctx.bezierCurveTo(-52, -18 + dy, -88, 4 + dy + tailSway * 0.5, -110, 22 + dy + tailSway);
  ctx.lineWidth = 17; ctx.strokeStyle = C.GREEN; ctx.stroke();
  // Tail tip darkens
  oval(ctx, -110, 22 + dy + tailSway, 7, 5, C.GREEN_D, C.OUTLINE, 1.5, 0.6);

  // ── Back legs ─────────────────────────────────────────
  drawLeg(ctx, -14, -10 + dy,  legSwing + 0.1, C.GREEN_D);
  drawLeg(ctx,   8, -10 + dy, -legSwing + 0.05, C.GREEN_D);

  // ── Body ──────────────────────────────────────────────
  oval(ctx, 0, -40 + dy, 43, 32, C.GREEN, C.OUTLINE, 3);

  // Body highlight
  ctx.beginPath();
  ctx.ellipse(-10, -52 + dy, 22, 14, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = C.GREEN_L; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;

  // Belly
  ctx.beginPath();
  ctx.ellipse(8, -34 + dy, 28, 21, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = C.BELLY; ctx.globalAlpha = 0.72; ctx.fill(); ctx.globalAlpha = 1;

  // ── Back arm (behind body, partially occluded) ─────────
  drawArm(ctx, 24, -52 + dy, -legSwing * 0.8 - 0.15, C.GREEN_D);

  // ── Neck connector ─────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(10, -62 + dy);
  ctx.quadraticCurveTo(14, -55 + dy, 28, -53 + dy);
  ctx.quadraticCurveTo(42, -55 + dy, 44, -62 + dy);
  ctx.quadraticCurveTo(38, -70 + dy, 24, -70 + dy);
  ctx.quadraticCurveTo(14, -70 + dy, 10, -62 + dy);
  ctx.fillStyle = C.GREEN; ctx.fill();
  ctx.strokeStyle = C.OUTLINE; ctx.lineWidth = 2; ctx.stroke();

  // ── Head ──────────────────────────────────────────────
  // Shadow blob
  oval(ctx, 30, -78 + dy + 2, 29, 23, C.SHADOW, undefined, 0, -0.1);
  // Head fill
  oval(ctx, 29, -79 + dy, 29, 23, C.GREEN, C.OUTLINE, 3, -0.1);
  // Head highlight
  ctx.beginPath();
  ctx.ellipse(14, -87 + dy, 13, 8, -0.45, 0, Math.PI * 2);
  ctx.fillStyle = C.GREEN_L; ctx.globalAlpha = 0.28; ctx.fill(); ctx.globalAlpha = 1;

  // Under-jaw (lighter)
  ctx.beginPath();
  ctx.ellipse(29, -70 + dy, 21, 12, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = C.BELLY; ctx.globalAlpha = 0.65; ctx.fill(); ctx.globalAlpha = 1;

  // ── Mouth / smile ─────────────────────────────────────
  const mouthY = -68 + dy;
  if (mouthOpen > 0.05) {
    const gap = mouthOpen * 26;
    // Mouth interior
    ctx.beginPath();
    ctx.moveTo(8,  mouthY);
    ctx.quadraticCurveTo(28, mouthY + gap * 0.6, 50, mouthY - 2);
    ctx.lineTo(50, mouthY - 4);
    ctx.quadraticCurveTo(28, mouthY + gap * 0.1, 8,  mouthY - 2);
    ctx.fillStyle = C.MOUTH_IN; ctx.fill();
    // Forked tongue
    const ty = mouthY + gap * 0.55;
    oval(ctx, 22, ty, 6.5, 4.5, C.TONGUE_D, undefined, 0, 0);
    oval(ctx, 34, ty, 6.5, 4.5, C.TONGUE_D, undefined, 0, 0);
    oval(ctx, 23, ty - 3, 6.5, 4,   C.TONGUE, undefined, 0, 0);
    oval(ctx, 33, ty - 3, 6.5, 4,   C.TONGUE, undefined, 0, 0);
    // Lower jaw outline
    ctx.beginPath();
    ctx.moveTo(8, mouthY);
    ctx.quadraticCurveTo(28, mouthY + gap + 3, 50, mouthY - 2);
    ctx.strokeStyle = C.OUTLINE; ctx.lineWidth = 2.5; ctx.stroke();
  } else {
    // Closed smile
    ctx.beginPath();
    ctx.moveTo(10, mouthY + 1);
    ctx.quadraticCurveTo(28, mouthY + 7, 48, mouthY - 1);
    ctx.strokeStyle = C.OUTLINE; ctx.lineWidth = 2.2; ctx.stroke();
  }

  // Nostrils
  oval(ctx, 17, -76 + dy, 2.5, 2,   C.OUTLINE, undefined, 0, 0);
  oval(ctx, 24, -75 + dy, 2.5, 2,   C.OUTLINE, undefined, 0, 0);

  // ── Eyes ──────────────────────────────────────────────
  // Left eye (closer to snout, slightly lower)
  drawEye(ctx, 16, -94 + dy, 11, eyeOpen, -0.25, 0.1);
  // Right eye (back of head, a bit higher — characteristic of ref image)
  drawEye(ctx, 36, -100 + dy, 12, eyeOpen,  0.3, -0.15);

  // ── Front arm (on top of body) ─────────────────────────
  const frontArmSwing = waveArm
    ? -0.8 - Math.sin(frame * 0.22) * 0.6
    : legSwing * 0.8 + 0.2;
  drawArm(ctx, 32, -56 + dy, frontArmSwing, C.GREEN);

  ctx.restore();
}

// ─── Speech bubble ────────────────────────────────────────────────────────────
function drawBubble(
  ctx: CanvasRenderingContext2D,
  tx: number, ty: number,
  text: string,
) {
  ctx.save();
  ctx.font = 'bold 15px "Space Grotesk", sans-serif';
  const tw = ctx.measureText(text).width;
  const pw = tw + 24, ph = 34;
  const bx = Math.min(Math.max(tx - pw / 2, 8), W - pw - 8);
  const by = ty - ph - 18;

  // Bubble background (rounded rect)
  const r8 = 8;
  ctx.beginPath();
  ctx.moveTo(bx + r8, by);
  ctx.lineTo(bx + pw - r8, by);
  ctx.quadraticCurveTo(bx + pw, by, bx + pw, by + r8);
  ctx.lineTo(bx + pw, by + ph - r8);
  ctx.quadraticCurveTo(bx + pw, by + ph, bx + pw - r8, by + ph);
  ctx.lineTo(bx + r8, by + ph);
  ctx.quadraticCurveTo(bx, by + ph, bx, by + ph - r8);
  ctx.lineTo(bx, by + r8);
  ctx.quadraticCurveTo(bx, by, bx + r8, by);
  ctx.closePath();
  ctx.fillStyle = '#fffef8';
  ctx.fill();
  ctx.strokeStyle = C.OUTLINE;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Tail triangle
  ctx.beginPath();
  ctx.moveTo(tx - 8, by + ph);
  ctx.lineTo(tx,     by + ph + 14);
  ctx.lineTo(tx + 8, by + ph);
  ctx.fillStyle = '#fffef8'; ctx.fill();
  ctx.strokeStyle = C.OUTLINE; ctx.lineWidth = 2.2; ctx.stroke();
  // cover triangle seam with white rect
  ctx.fillStyle = '#fffef8';
  ctx.fillRect(tx - 7, by + ph - 2, 15, 6);

  ctx.fillStyle = '#140a05';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pw / 2, by + ph / 2);
  ctx.restore();
}

// ─── State machine ────────────────────────────────────────────────────────────
type TomState = 'idle' | 'walk-r' | 'walk-l' | 'happy' | 'wave';

interface TomInternal {
  x:          number;
  targetX:    number;
  state:      TomState;
  facing:     'left' | 'right';
  walkPhase:  number;
  stateTimer: number;
  mouthOpen:  number;
  waveArm:    boolean;
}

const GREETINGS = [
  'Hey there! 🦎', 'Heyyyy! 😄', 'Roarrr! 🦎',
  'You found me!', '!!!', 'Hissss~ 🌿',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function TomLizardScene() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const frameRef   = useRef(0);
  const rafRef     = useRef<number>(0);
  const tomRef     = useRef<TomInternal>({
    x: 340, targetX: 340,
    state: 'wave', facing: 'right',
    walkPhase: 0, stateTimer: 0,
    mouthOpen: 0, waveArm: true,
  });
  const bubbleRef  = useRef<{ text: string; ttl: number } | null>({ text: 'Hi! 👋 I\'m Tom', ttl: 180 });

  const [, forceRender] = useState(0);

  const handleClick = useCallback(() => {
    const tom = tomRef.current;
    tom.state      = 'happy';
    tom.mouthOpen  = 1;
    tom.stateTimer = 0;
    tom.waveArm    = false;
    const msg = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    bubbleRef.current = { text: msg, ttl: 150 };
    forceRender(n => n + 1);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const f   = frameRef.current++;
    const tom = tomRef.current;

    // ── Blink ─────────────────────────────────────────────────────────────────
    const bc = f % 220;
    const eyeOpen = bc > 208 ? Math.max(0, 1 - (bc - 208) / 6) : 1;

    // ── State machine ─────────────────────────────────────────────────────────
    tom.stateTimer++;

    if (tom.state === 'wave') {
      tom.waveArm = true;
      if (tom.stateTimer > 160) {
        tom.state = 'idle'; tom.stateTimer = 0; tom.waveArm = false;
      }

    } else if (tom.state === 'idle') {
      if (tom.stateTimer > 90 + Math.random() * 60) {
        // Pick a walk target: one of the rock stops or a random x
        const targets = [...ROCK_STOPS, 180, 520];
        const pick = targets[Math.floor(Math.random() * targets.length)];
        tom.targetX = Math.max(80, Math.min(W - 80, pick));
        const diff  = tom.targetX - tom.x;
        if (Math.abs(diff) < 20) { tom.stateTimer = 0; return; }
        tom.facing = diff > 0 ? 'right' : 'left';
        tom.state  = diff > 0 ? 'walk-r' : 'walk-l';
        tom.stateTimer = 0;
      }

    } else if (tom.state === 'walk-r' || tom.state === 'walk-l') {
      const spd = 2.2;
      tom.x        += tom.state === 'walk-r' ? spd : -spd;
      tom.walkPhase += 0.18;
      if (Math.abs(tom.x - tom.targetX) < spd + 1) {
        tom.x     = tom.targetX;
        tom.state = 'idle';
        tom.stateTimer = 0;
        tom.walkPhase  = 0;
      }

    } else if (tom.state === 'happy') {
      tom.mouthOpen = Math.max(0, 1 - tom.stateTimer * 0.012);
      if (tom.stateTimer > 120) {
        tom.state = 'idle'; tom.stateTimer = 0; tom.mouthOpen = 0;
      }
    }

    // ── Bubble TTL ────────────────────────────────────────────────────────────
    if (bubbleRef.current) {
      bubbleRef.current.ttl--;
      if (bubbleRef.current.ttl <= 0) bubbleRef.current = null;
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);
    drawBg(ctx);
    drawTom(ctx, {
      x:         tom.x,
      gy:        GY,
      frame:     f,
      state:     tom.state,
      facing:    tom.facing,
      walkPhase: tom.walkPhase,
      mouthOpen: tom.mouthOpen,
      eyeOpen,
      waveArm:   tom.waveArm,
    });

    if (bubbleRef.current) {
      // Bubble appears above Tom's head (~100px up from feet)
      const bx = tom.facing === 'right' ? tom.x + 28 : tom.x - 28;
      drawBubble(ctx, bx, GY - 105, bubbleRef.current.text);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div
      onClick={handleClick}
      title="Click Tom!"
      style={{
        cursor:       'pointer',
        borderRadius: '10px',
        overflow:     'hidden',
        border:       'var(--panel-border)',
        boxShadow:    'var(--panel-shadow)',
        userSelect:   'none',
        lineHeight:   0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
