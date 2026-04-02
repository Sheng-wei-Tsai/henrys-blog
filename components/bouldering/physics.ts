import type { GameState } from './types';
import { reachRadius } from './routes';

// Grade-specific aim config
const AIM_CONFIG = [
  { speed: 1.4, hitWindow: 0.40 }, // V0 — slow, wide window (~23°)
  { speed: 2.0, hitWindow: 0.30 }, // V1
  { speed: 2.7, hitWindow: 0.22 }, // V2
  { speed: 3.4, hitWindow: 0.16 }, // V3 — fast, tight window (~9°)
  { speed: 4.2, hitWindow: 0.12 }, // V4+ — brutal
];

export function aimConfig(grade: number) {
  return AIM_CONFIG[Math.min(grade, AIM_CONFIG.length - 1)];
}

// Smallest angular difference between two angles (handles wrap-around)
function angleDiff(a: number, b: number): number {
  let d = ((b - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  return Math.abs(d);
}

// Advance the sweep angle; compute which hold (if any) is currently lit
export function tickAim(state: GameState, dt: number): void {
  if (state.phase !== 'playing') return;

  state.aimAngle = (state.aimAngle + state.aimSpeed * dt) % (Math.PI * 2);

  const cur = state.holds[state.climber.holdId];
  const reach = reachRadius(state.grade);

  let best: number | null = null;
  let bestDiff = Infinity;

  for (const h of state.holds) {
    if (h.id === state.climber.holdId) continue;
    const dist = Math.hypot(h.x - cur.x, h.y - cur.y);
    if (dist > reach) continue;

    // Angle from climber to this hold
    const holdAngle = Math.atan2(-(h.y - cur.y), h.x - cur.x); // y-flip for canvas
    const diff = angleDiff(state.aimAngle, holdAngle < 0 ? holdAngle + Math.PI * 2 : holdAngle);

    if (diff < state.hitWindow && diff < bestDiff) {
      bestDiff = diff;
      best = h.id;
    }
  }

  state.litHoldId = best;
}

// Player presses commit (SPACE/tap) — attempt to grab the lit hold
export function commitMove(state: GameState): void {
  if (state.phase !== 'playing') return;

  if (state.litHoldId === null) {
    // Missed — grip penalty and flash
    state.gripTimer = Math.max(0, state.gripTimer - state.gripMax * 0.2);
    state.badPressFlash = 0.3;
    return;
  }

  const targetHold = state.holds[state.litHoldId];
  state.climber.holdId  = targetHold.id;
  state.climber.targetX = targetHold.x;
  state.climber.targetY = targetHold.y;
  state.climber.direction = targetHold.x > state.climber.x ? 'right' : 'left';
  state.gripTimer = state.gripMax; // reset grip on successful move
  state.litHoldId = null;
  state.phase = 'latching';
  state.latchTimer = 0.2;
}

// Nudge aim toward a direction (arrow key assist — small push, not instant)
export function nudgeAim(state: GameState, dir: 'left' | 'right' | 'up' | 'down'): void {
  if (state.phase !== 'playing') return;
  const NUDGE = 0.25; // radians
  const angles: Record<string, number> = {
    right: 0,
    up:    Math.PI / 2,
    left:  Math.PI,
    down:  (3 * Math.PI) / 2,
  };
  const target = angles[dir];
  // Nudge aimAngle toward target direction
  let diff = ((target - state.aimAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  state.aimAngle += Math.sign(diff) * Math.min(NUDGE, Math.abs(diff));
}

// Advance climber lerp (smooth movement between holds)
export function tickClimber(state: GameState, dt: number): void {
  const LERP = 10;
  const t = Math.min(1, dt * LERP);
  state.climber.x += (state.climber.targetX - state.climber.x) * t;
  state.climber.y += (state.climber.targetY - state.climber.y) * t;

  state.climber.frameTimer += dt;
  if (state.climber.frameTimer > 0.14) {
    state.climber.frameTimer = 0;
    state.climber.frame = (state.climber.frame + 1) % 4;
  }
}

// Grip depletion — returns true if fell
export function tickGrip(state: GameState, dt: number): boolean {
  state.gripTimer -= dt;
  return state.gripTimer <= 0;
}

// Particles
export function tickParticles(state: GameState, dt: number): void {
  for (const p of state.particles) {
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += 420 * dt;
    p.life -= dt / 1.5;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

// Reachable hold ids from current hold
export function reachableHolds(state: GameState): Set<number> {
  const cur = state.holds[state.climber.holdId];
  const r = reachRadius(state.grade);
  const out = new Set<number>();
  for (const h of state.holds) {
    if (h.id !== state.climber.holdId && Math.hypot(h.x - cur.x, h.y - cur.y) <= r) {
      out.add(h.id);
    }
  }
  return out;
}
