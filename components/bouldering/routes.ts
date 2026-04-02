import type { Hold } from './types';

// Canvas dimensions
export const CW = 480;
export const CH = 520;

// Grid: 7 cols × 8 rows of hold slots
const COLS = 7;
const ROWS = 8;
const PAD_X = 40;
const PAD_Y = 40;

const GRADE_CONFIG = [
  { reach: 80,  decoys: 0,  gripMax: 4.0 }, // V0
  { reach: 90,  decoys: 4,  gripMax: 3.5 }, // V1
  { reach: 105, decoys: 8,  gripMax: 3.0 }, // V2
  { reach: 120, decoys: 12, gripMax: 2.5 }, // V3
  { reach: 140, decoys: 16, gripMax: 2.0 }, // V4+
];

// Mulberry32 — fast, seeded PRNG
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Slot index → canvas px
function slotPos(col: number, row: number): { x: number; y: number } {
  const cellW = (CW - PAD_X * 2) / (COLS - 1);
  const cellH = (CH - PAD_Y * 2 - 60) / (ROWS - 1); // 60px bottom for HUD
  return {
    x: Math.round(PAD_X + col * cellW),
    y: Math.round(PAD_Y + row * cellH),
  };
}

// BFS: can climber reach topHoldId from startHoldIds within reach radius?
function bfsReachable(
  holds: Hold[],
  startIds: number[],
  topId: number,
  reach: number,
): boolean {
  const visited = new Set<number>(startIds);
  const queue = [...startIds];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === topId) return true;
    const ch = holds[cur];
    for (let i = 0; i < holds.length; i++) {
      if (visited.has(i)) continue;
      const h = holds[i];
      const dist = Math.hypot(h.x - ch.x, h.y - ch.y);
      if (dist <= reach) {
        visited.add(i);
        queue.push(i);
      }
    }
  }
  return false;
}

export function generateRoute(grade: number, seed: number): Hold[] {
  const cfg = GRADE_CONFIG[Math.min(grade, GRADE_CONFIG.length - 1)];

  for (let attempt = 0; attempt < 20; attempt++) {
    const rng = mulberry32(seed + attempt);
    const holds: Hold[] = [];
    let idCounter = 0;

    // Build a zigzag path from bottom row to top row
    const pathCols: number[] = [];
    let col = Math.floor(rng() * COLS);
    pathCols.push(col);
    for (let row = ROWS - 1; row >= 0; row--) {
      const delta = Math.floor(rng() * 3) - 1; // -1, 0, +1
      col = Math.max(0, Math.min(COLS - 1, col + delta));
      pathCols.push(col);
    }

    // Place route holds along the path (bottom → top = row ROWS-1 → 0)
    const routeHolds: Hold[] = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      const c = pathCols[ROWS - 1 - row];
      const pos = slotPos(c, row);
      routeHolds.push({
        id: idCounter++,
        x: pos.x,
        y: pos.y,
        grade,
        isRoute: true,
        isStart: row === ROWS - 1,
        isTop: row === 0,
      });
    }
    holds.push(...routeHolds);

    const startIds = routeHolds.filter(h => h.isStart).map(h => h.id);
    const topId    = routeHolds.find(h => h.isTop)!.id;

    // Add decoy holds (off-route, off-grid positions)
    const occupied = new Set(routeHolds.map(h => `${Math.round(h.x)},${Math.round(h.y)}`));
    let decoyCount = 0;
    let safety = 0;
    while (decoyCount < cfg.decoys && safety < 200) {
      safety++;
      const dx = Math.round(PAD_X + rng() * (CW - PAD_X * 2));
      const dy = Math.round(PAD_Y + rng() * (CH - PAD_Y * 2 - 80));
      const key = `${dx},${dy}`;
      if (occupied.has(key)) continue;
      // Keep decoy away from route holds (min 20px gap)
      const tooClose = holds.some(h => Math.hypot(h.x - dx, h.y - dy) < 20);
      if (tooClose) continue;
      occupied.add(key);
      holds.push({ id: idCounter++, x: dx, y: dy, grade, isRoute: false, isStart: false, isTop: false });
      decoyCount++;
    }

    // Validate path exists
    if (bfsReachable(holds, startIds, topId, cfg.reach)) {
      return holds;
    }
  }

  // Fallback: simple straight-up route that always works
  return generateFallback(grade, seed);
}

function generateFallback(grade: number, _seed: number): Hold[] {
  const holds: Hold[] = [];
  const midCol = Math.floor(COLS / 2);
  for (let row = ROWS - 1; row >= 0; row--) {
    const pos = slotPos(midCol, row);
    holds.push({
      id: ROWS - 1 - row,
      x: pos.x,
      y: pos.y,
      grade,
      isRoute: true,
      isStart: row === ROWS - 1,
      isTop: row === 0,
    });
  }
  return holds;
}

export function reachRadius(grade: number): number {
  return GRADE_CONFIG[Math.min(grade, GRADE_CONFIG.length - 1)].reach;
}

export function gripMax(grade: number): number {
  return GRADE_CONFIG[Math.min(grade, GRADE_CONFIG.length - 1)].gripMax;
}

// Build seed from grade + route rotation index (0–2)
export function routeSeed(grade: number, routeIndex: number): number {
  return grade * 1000 + routeIndex * 17 + 42;
}

// Daily problem seed (V2) seeded by date
export function dailySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}
