import type { GameState } from './types';
import { drawSprite } from './sprite';
import { reachableHolds } from './physics';
import { CW, CH } from './routes';

const GRADE_COLORS = ['#2D6A4F', '#1D6FA4', '#C8922A', '#C0281C', '#1A0A05'];

function drawBackground(ctx: CanvasRenderingContext2D, badFlash: number): void {
  // Base rice paper
  const flashAlpha = Math.min(1, badFlash / 0.3) * 0.25;
  ctx.fillStyle = flashAlpha > 0
    ? `rgb(${Math.round(253 - flashAlpha * 60)},${Math.round(245 - flashAlpha * 200)},${Math.round(228 - flashAlpha * 200)})`
    : '#FDF5E4';
  ctx.fillRect(0, 0, CW, CH);

  // Halftone dots
  ctx.fillStyle = 'rgba(20,10,5,0.07)';
  for (let x = 8; x < CW; x += 8) {
    for (let y = 8; y < CH - 60; y += 8) {
      ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
    }
  }

  // Vertical panel seams
  ctx.strokeStyle = 'rgba(20,10,5,0.06)';
  ctx.lineWidth = 1;
  for (let x = 24; x < CW; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CH - 60);
    ctx.stroke();
  }
}

// Rotating radar sweep line
function drawAimSweep(ctx: CanvasRenderingContext2D, state: GameState, reachable: Set<number>): void {
  if (state.phase !== 'playing' && state.phase !== 'latching') return;

  const cx = state.climber.x;
  const cy = state.climber.y - 16; // draw from climber centre (not feet)

  // Compute reach radius for display
  const DISPLAY_REACH = 130;

  // Soft glow trail behind sweep (arc 0.5 rad behind)
  const TRAIL = 0.55;

  // Draw as a series of fading arcs
  for (let i = 0; i < 12; i++) {
    const trailAngle = state.aimAngle - (i / 12) * TRAIL;
    const alpha = (1 - i / 12) * 0.12;
    const ex = cx + Math.cos(-trailAngle) * DISPLAY_REACH;
    const ey = cy + Math.sin(-trailAngle) * DISPLAY_REACH;
    ctx.strokeStyle = `rgba(192,40,28,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Main sweep line
  const ex = cx + Math.cos(-state.aimAngle) * DISPLAY_REACH;
  const ey = cy + Math.sin(-state.aimAngle) * DISPLAY_REACH;
  ctx.strokeStyle = 'rgba(192,40,28,0.85)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dot at end of sweep line
  ctx.fillStyle = '#C0281C';
  ctx.beginPath();
  ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fill();

  // Reachable hold connection dots (faint)
  for (const id of reachable) {
    const h = state.holds[id];
    ctx.strokeStyle = 'rgba(20,10,5,0.12)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(h.x, h.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  grade: number,
  isRoute: boolean,
  isStart: boolean,
  isTop: boolean,
  isReachable: boolean,
  isLit: boolean,
  isCurrent: boolean,
  litPulse: number, // 0–1, for pulsing brightness
): void {
  const SIZE = isTop ? 10 : 8;
  const color = GRADE_COLORS[Math.min(grade, GRADE_COLORS.length - 1)];
  const alpha = isCurrent ? 0 : isReachable ? (isRoute ? 1 : 0.5) : (isRoute ? 0.4 : 0.2);

  if (alpha <= 0) return;

  ctx.globalAlpha = alpha;

  // Lit glow
  if (isLit) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 1;
  } else if (isReachable && isRoute) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
  }

  // Hold fill
  ctx.fillStyle = isLit
    ? `hsl(${holdHue(color)}, 80%, ${50 + litPulse * 20}%)`
    : color;
  ctx.beginPath();
  ctx.roundRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE, 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = isLit ? '#FFFFFF' : '#1A0A05';
  ctx.lineWidth = isLit ? 2 : 1.5;
  ctx.stroke();

  // Highlight pixel
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x - SIZE / 2 + 1, y - SIZE / 2 + 1, 2, 2);

  // Start ring
  if (isStart) {
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - SIZE / 2 - 3, y - SIZE / 2 - 3, SIZE + 6, SIZE + 6, 4);
    ctx.stroke();
  }

  // Top bell marker
  if (isTop) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#C8922A';
    ctx.beginPath();
    ctx.moveTo(x, y - SIZE / 2 - 7);
    ctx.lineTo(x - 5, y - SIZE / 2 - 1);
    ctx.lineTo(x + 5, y - SIZE / 2 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1A0A05';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

// Extract hue from hex (rough, good enough for tinting)
function holdHue(hex: string): number {
  const map: Record<string, number> = {
    '#2D6A4F': 152, '#1D6FA4': 207, '#C8922A': 35, '#C0281C': 5, '#1A0A05': 20,
  };
  return map[hex] ?? 0;
}

// Grip bar
function drawGripBar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  grip: number, gripMax: number,
): void {
  const total = 8;
  const filled = Math.ceil((grip / gripMax) * total);
  const BAR_W = 6, BAR_H = 4, gap = 2;
  const totalW = total * (BAR_W + gap) - gap;
  const ox = cx - totalW / 2;
  const oy = cy + 6;

  for (let i = 0; i < total; i++) {
    const bx = ox + i * (BAR_W + gap);
    const pct = grip / gripMax;
    ctx.fillStyle = i < filled
      ? pct > 0.5 ? '#2D6A4F' : pct > 0.25 ? '#C8922A' : '#C0281C'
      : 'rgba(20,10,5,0.15)';
    ctx.fillRect(bx, oy, BAR_W, BAR_H);
    ctx.strokeStyle = '#1A0A05';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, oy, BAR_W, BAR_H);
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  grade: number,
  attempts: number,
  bestMs: number | null,
): void {
  const y = CH - 56;
  ctx.fillStyle = 'rgba(253,245,228,0.95)';
  ctx.fillRect(0, y, CW, 56);

  ctx.strokeStyle = 'rgba(20,10,5,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(CW, y);
  ctx.stroke();

  const gradeName = ['V0', 'V1', 'V2', 'V3', 'V4+'][Math.min(grade, 4)];
  const color = GRADE_COLORS[Math.min(grade, GRADE_COLORS.length - 1)];

  // Grade badge — comic panel style
  ctx.fillStyle = '#1A0A05';
  ctx.fillRect(18, y + 14, 36, 28);
  ctx.fillStyle = color;
  ctx.fillRect(16, y + 12, 36, 28);
  ctx.strokeStyle = '#1A0A05';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, y + 12, 36, 28);
  ctx.fillStyle = '#FDF5E4';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(gradeName, 34, y + 31);

  ctx.fillStyle = '#5A3E28';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Attempts: ${attempts}`, 62, y + 24);
  const bestStr = bestMs !== null ? `Best: ${(bestMs / 1000).toFixed(1)}s` : 'Best: —';
  ctx.fillText(bestStr, 62, y + 40);

  ctx.fillStyle = 'rgba(20,10,5,0.35)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('SPACE to grab lit hold  •  ← → ↑ ↓ nudge aim  •  R restart', CW - 12, y + 30);
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function drawSendOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const t = 1 - state.sendTimer / 2.0;
  const alpha = t < 0.5 ? t * 2 : (1 - t) * 2;
  if (alpha <= 0) return;

  ctx.fillStyle = `rgba(253,245,228,${alpha * 0.65})`;
  ctx.fillRect(0, 0, CW, CH - 60);

  const gradeName = ['V0', 'V1', 'V2', 'V3', 'V4+'][Math.min(state.grade, 4)];
  const color = GRADE_COLORS[Math.min(state.grade, GRADE_COLORS.length - 1)];
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1A0A05';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`SENT! ${gradeName}`, CW / 2 + 3, CH / 2 - 57);
  ctx.fillStyle = color;
  ctx.fillText(`SENT! ${gradeName}`, CW / 2, CH / 2 - 60);
  ctx.globalAlpha = 1;
}

function drawUnlockOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const progress = 1 - state.unlockTimer / 1.5;
  if (progress <= 0) return;
  const scale = 0.6 + progress * 0.6;
  const alpha = progress < 0.8 ? 1 : (1 - progress) / 0.2;
  const nextGrade = ['V1', 'V2', 'V3', 'V4', 'V4+'][Math.min(state.grade, 4)];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(CW / 2, (CH - 60) / 2);
  ctx.scale(scale, scale);
  ctx.rotate(-0.08);

  ctx.fillStyle = '#C0281C';
  ctx.strokeStyle = '#1A0A05';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-80, -40, 160, 80, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDF5E4';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UNLOCKED', 0, -10);
  ctx.font = 'bold 28px monospace';
  ctx.fillText(nextGrade, 0, 24);
  ctx.restore();
}

// --- Main draw call ---
export function draw(canvas: HTMLCanvasElement, state: GameState, bestMs: number | null): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawBackground(ctx, state.badPressFlash);

  const reachable = reachableHolds(state);

  // Lit hold pulse (oscillates based on time, driven from sweep)
  const litPulse = Math.sin(Date.now() / 80) * 0.5 + 0.5;

  // Draw aim sweep before holds
  drawAimSweep(ctx, state, reachable);

  for (const h of state.holds) {
    drawHold(
      ctx,
      h.x, h.y, h.grade, h.isRoute, h.isStart, h.isTop,
      reachable.has(h.id),
      h.id === state.litHoldId,
      h.id === state.climber.holdId,
      litPulse,
    );
  }

  drawSprite(ctx, state.climber.frame, state.climber.x, state.climber.y);

  if (state.phase === 'playing') {
    drawGripBar(ctx, state.climber.x, state.climber.y, state.gripTimer, state.gripMax);
  }

  drawParticles(ctx, state);
  if (state.phase === 'sending')   drawSendOverlay(ctx, state);
  if (state.phase === 'unlocking') drawUnlockOverlay(ctx, state);

  drawHUD(ctx, state.grade, state.attempts, bestMs);
}
