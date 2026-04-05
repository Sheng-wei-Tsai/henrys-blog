/**
 * TamaAussie sprite renderer — all pixel art drawn via Canvas 2D API.
 * Scale: 1 logical pixel = S actual pixels (default S=4 → 128×128 canvas).
 *
 * Canvas layout (32×32 logical, 128×128 actual):
 *   rows  0–3  : icon bar (8 icons × 4 cols each)
 *   row   4    : divider
 *   rows  5–23 : pet area (sprite centered around col 16, row 14)
 *   rows  24–27: hearts bar (hunger left, happiness right)
 *   rows  28–31: message line
 */

import { MenuIcon, MENU_ICONS, AnimState, SpeciesId, TamaState } from './types';

// ─── LCD palette ───────────────────────────────────────────────────────────────
export const LCD = {
  bg:  '#9aba6c',  // screen off-state (lightest)
  lt:  '#8bac0f',  // light shade
  md:  '#306230',  // mid shade
  dk:  '#0f380f',  // darkest (main sprite color)
};

type Ctx = CanvasRenderingContext2D;
const S = 4; // scale factor

// ─── Pixel helpers ─────────────────────────────────────────────────────────────
const p = (ctx: Ctx, x: number, y: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x * S, y * S, S, S);
};
const r = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x * S, y * S, w * S, h * S);
};
const line = (ctx: Ctx, x: number, y: number, len: number, vertical: boolean, c: string) => {
  ctx.fillStyle = c;
  if (vertical) ctx.fillRect(x * S, y * S, S, len * S);
  else          ctx.fillRect(x * S, y * S, len * S, S);
};

// ─── Icon bar ──────────────────────────────────────────────────────────────────
const ICON_PIXELS: Record<MenuIcon, [number, number][]> = {
  food:       [[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3]],
  light:      [[2,0],[1,1],[2,1],[3,1],[2,2],[2,3]],
  game:       [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[2,2],[4,2],[0,3],[2,3],[4,3]],
  medicine:   [[2,0],[0,1],[1,1],[2,1],[3,1],[4,1],[2,2],[2,3]],
  toilet:     [[1,0],[3,0],[0,1],[2,1],[4,1],[1,2],[2,2],[3,2],[2,3]],
  status:     [[4,0],[3,1],[4,1],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3],[4,3]],
  discipline: [[2,0],[2,1],[2,2],[2,4]], // exclamation
  call:       [[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3]],
};

function drawIcon(ctx: Ctx, icon: MenuIcon, ox: number, oy: number, selected: boolean) {
  if (selected) {
    r(ctx, ox, oy, 4, 4, LCD.dk);
    const pixels = ICON_PIXELS[icon];
    pixels.forEach(([x, y]) => p(ctx, ox + x, oy + y, LCD.bg));
  } else {
    const pixels = ICON_PIXELS[icon];
    pixels.forEach(([x, y]) => p(ctx, ox + x, oy + y, LCD.dk));
  }
}

function drawIconBar(ctx: Ctx, selectedIdx: number, callFlash: boolean, frame: number) {
  MENU_ICONS.forEach((icon, i) => {
    const ox = i * 4;
    const isCall = icon === 'call';
    const showSelected = i === selectedIdx;
    if (isCall && callFlash && Math.floor(frame / 8) % 2 === 0) {
      // Flash call icon when attention pending
      drawIcon(ctx, icon, ox, 0, true);
    } else {
      drawIcon(ctx, icon, ox, 0, showSelected);
    }
  });
  // Selection cursor below selected icon
  line(ctx, selectedIdx * 4 + 1, 4, 2, false, LCD.dk);
}

// ─── Hearts ────────────────────────────────────────────────────────────────────
function drawHeart(ctx: Ctx, x: number, y: number, filled: boolean) {
  if (filled) {
    p(ctx, x, y, LCD.dk);
    p(ctx, x + 1, y, LCD.dk);
    p(ctx, x + 2, y, LCD.dk);
    p(ctx, x - 1, y + 1, LCD.dk);
    p(ctx, x, y + 1, LCD.dk);
    p(ctx, x + 1, y + 1, LCD.dk);
    p(ctx, x + 2, y + 1, LCD.dk);
    p(ctx, x + 3, y + 1, LCD.dk);
    p(ctx, x, y + 2, LCD.dk);
    p(ctx, x + 1, y + 2, LCD.dk);
    p(ctx, x + 2, y + 2, LCD.dk);
    p(ctx, x + 1, y + 3, LCD.dk);
  } else {
    p(ctx, x, y, LCD.md);
    p(ctx, x + 2, y, LCD.md);
    p(ctx, x - 1, y + 1, LCD.md);
    p(ctx, x + 3, y + 1, LCD.md);
    p(ctx, x, y + 2, LCD.md);
    p(ctx, x + 2, y + 2, LCD.md);
    p(ctx, x + 1, y + 3, LCD.md);
  }
}

function drawHearts(ctx: Ctx, hunger: number, happiness: number) {
  // Hunger hearts — left side (4 hearts, each 5px wide with 1px gap)
  for (let i = 0; i < 4; i++) {
    drawHeart(ctx, 1 + i * 5, 24, i < hunger);
  }
  // Happiness hearts — right side
  for (let i = 0; i < 4; i++) {
    drawHeart(ctx, 11 + i * 5, 24, i < happiness);
  }
}

// ─── Poop sprites ──────────────────────────────────────────────────────────────
function drawPoop(ctx: Ctx, ox: number, oy: number) {
  r(ctx, ox + 1, oy + 0, 2, 1, LCD.md);
  r(ctx, ox + 0, oy + 1, 4, 1, LCD.dk);
  r(ctx, ox + 0, oy + 2, 4, 1, LCD.dk);
  p(ctx, ox + 1, oy + 1, LCD.md);
}

// ─── ZZZ overlay ───────────────────────────────────────────────────────────────
function drawZzz(ctx: Ctx, ox: number, oy: number, frame: number) {
  const y = oy - Math.floor(frame / 20) % 3;
  ctx.fillStyle = LCD.md;
  ctx.font = `${S * 2}px monospace`;
  ctx.fillText('z', ox * S, y * S);
  ctx.font = `${S * 3}px monospace`;
  ctx.fillText('Z', (ox + 2) * S, (y - 1) * S);
}

// ─── Message line ──────────────────────────────────────────────────────────────
function drawMessage(ctx: Ctx, msg: string) {
  if (!msg) return;
  ctx.fillStyle = LCD.dk;
  ctx.font      = `${S * 2}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(msg, 64, 29 * S, 126);
  ctx.textAlign = 'left';
}

// ─── Sprite: EGG ───────────────────────────────────────────────────────────────
function drawEgg(ctx: Ctx, cx: number, cy: number, frame: number) {
  const b = frame % 2 === 1 ? 1 : 0; // gentle bob
  const ox = cx - 4; const oy = cy - 4 + b;
  r(ctx, ox+1, oy+0, 6, 1, LCD.dk);
  r(ctx, ox+0, oy+1, 8, 5, LCD.dk);
  r(ctx, ox+1, oy+6, 6, 1, LCD.dk);
  r(ctx, ox+2, oy+7, 4, 1, LCD.dk);
  // Highlight
  p(ctx, ox+1, oy+1, LCD.md);
  p(ctx, ox+2, oy+1, LCD.md);
  p(ctx, ox+1, oy+2, LCD.md);
  // Crack (after frame 30)
  if (frame > 30) {
    p(ctx, ox+4, oy+3, LCD.bg);
    p(ctx, ox+3, oy+4, LCD.bg);
    p(ctx, ox+5, oy+4, LCD.bg);
    p(ctx, ox+4, oy+5, LCD.bg);
  }
}

// ─── Sprite: BLOB (baby) ───────────────────────────────────────────────────────
function drawBlob(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 20 < 10 ? 0 : 1;
  const ox = cx - 4; const oy = cy - 4 + b;

  r(ctx, ox+1, oy+0, 6, 1, LCD.dk);
  r(ctx, ox+0, oy+1, 8, 5, LCD.dk);
  r(ctx, ox+1, oy+6, 6, 1, LCD.dk);
  // Eyes (2×2 each)
  p(ctx, ox+1, oy+2, LCD.bg);
  p(ctx, ox+2, oy+2, LCD.bg);
  p(ctx, ox+5, oy+2, LCD.bg);
  p(ctx, ox+6, oy+2, LCD.bg);
  p(ctx, ox+1, oy+3, LCD.bg);
  p(ctx, ox+2, oy+3, LCD.bg);
  p(ctx, ox+5, oy+3, LCD.bg);
  p(ctx, ox+6, oy+3, LCD.bg);
  // Pupils
  p(ctx, ox+1, oy+2, LCD.dk);
  p(ctx, ox+5, oy+2, LCD.dk);
  // Mouth
  if (anim === 'happy') {
    p(ctx, ox+2, oy+5, LCD.bg); p(ctx, ox+3, oy+4, LCD.bg);
    p(ctx, ox+4, oy+4, LCD.bg); p(ctx, ox+5, oy+5, LCD.bg);
  } else if (anim === 'eating') {
    r(ctx, ox+2, oy+4, 4, 2, LCD.bg);
  } else {
    p(ctx, ox+3, oy+5, LCD.bg); p(ctx, ox+4, oy+5, LCD.bg);
  }
  // Feet
  p(ctx, ox+1, oy+7, LCD.dk); p(ctx, ox+6, oy+7, LCD.dk);
}

// ─── Sprite: JOEY (child kangaroo) ─────────────────────────────────────────────
function drawJoey(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 20 < 10 ? 0 : 1;
  const ox = cx - 5; const oy = cy - 6 + b;

  // Ears
  p(ctx, ox+1, oy+0, LCD.dk); p(ctx, ox+2, oy+0, LCD.dk);
  p(ctx, ox+7, oy+0, LCD.dk); p(ctx, ox+8, oy+0, LCD.dk);
  r(ctx, ox+1, oy+1, 2, 2, LCD.dk);
  r(ctx, ox+7, oy+1, 2, 2, LCD.dk);
  p(ctx, ox+2, oy+1, LCD.md);  p(ctx, ox+7, oy+1, LCD.md);
  // Head
  r(ctx, ox+2, oy+2, 6, 5, LCD.dk);
  // Eyes
  p(ctx, ox+3, oy+3, LCD.bg); p(ctx, ox+6, oy+3, LCD.bg);
  p(ctx, ox+3, oy+4, LCD.bg); p(ctx, ox+6, oy+4, LCD.bg);
  p(ctx, ox+3, oy+3, LCD.dk); p(ctx, ox+6, oy+3, LCD.dk);
  // Nose
  p(ctx, ox+4, oy+5, LCD.md); p(ctx, ox+5, oy+5, LCD.md);
  // Body
  r(ctx, ox+1, oy+7, 8, 4, LCD.dk);
  // Pouch
  r(ctx, ox+3, oy+8, 4, 2, LCD.md);
  // Legs
  r(ctx, ox+1, oy+11, 3, 2, LCD.dk);
  r(ctx, ox+6, oy+11, 3, 2, LCD.dk);
  // Tail
  p(ctx, ox+9, oy+9, LCD.dk); p(ctx, ox+10, oy+10, LCD.dk);

  if (anim === 'happy') {
    // Small arms raised
    p(ctx, ox+0, oy+7, LCD.dk); p(ctx, ox+9, oy+7, LCD.dk);
  }
}

// ─── Teen sprites ──────────────────────────────────────────────────────────────
function drawQuokkaTeen(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 24 < 12 ? 0 : 1;
  const ox = cx - 5; const oy = cy - 6 + b;
  // Ears (round)
  r(ctx, ox+0, oy+1, 2, 3, LCD.dk); r(ctx, ox+8, oy+1, 2, 3, LCD.dk);
  p(ctx, ox+1, oy+1, LCD.md); p(ctx, ox+8, oy+1, LCD.md);
  // Head
  r(ctx, ox+1, oy+0, 8, 7, LCD.dk);
  // Eyes
  p(ctx, ox+2, oy+2, LCD.bg); p(ctx, ox+7, oy+2, LCD.bg);
  p(ctx, ox+2, oy+3, LCD.bg); p(ctx, ox+7, oy+3, LCD.bg);
  p(ctx, ox+2, oy+2, LCD.dk); p(ctx, ox+7, oy+2, LCD.dk);
  // Famous quokka smile
  p(ctx, ox+2, oy+5, LCD.bg); p(ctx, ox+3, oy+6, LCD.bg);
  p(ctx, ox+4, oy+6, LCD.bg); p(ctx, ox+5, oy+6, LCD.bg);
  p(ctx, ox+6, oy+6, LCD.bg); p(ctx, ox+7, oy+5, LCD.bg);
  // Body
  r(ctx, ox+2, oy+7, 6, 4, LCD.dk);
  r(ctx, ox+1, oy+8, 8, 3, LCD.dk);
  // Legs
  r(ctx, ox+2, oy+11, 2, 2, LCD.dk); r(ctx, ox+6, oy+11, 2, 2, LCD.dk);
}

function drawWallabyTeen(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 20 < 10 ? 0 : 1;
  const ox = cx - 5; const oy = cy - 7 + b;
  // Long ears
  r(ctx, ox+2, oy+0, 2, 4, LCD.dk); r(ctx, ox+6, oy+0, 2, 4, LCD.dk);
  p(ctx, ox+3, oy+0, LCD.md); p(ctx, ox+7, oy+0, LCD.md);
  // Head
  r(ctx, ox+1, oy+3, 8, 5, LCD.dk);
  p(ctx, ox+2, oy+4, LCD.bg); p(ctx, ox+7, oy+4, LCD.bg);
  p(ctx, ox+2, oy+4, LCD.dk); p(ctx, ox+7, oy+4, LCD.dk);
  p(ctx, ox+4, oy+6, LCD.md); p(ctx, ox+5, oy+6, LCD.md);
  // Body + tail
  r(ctx, ox+1, oy+8, 7, 5, LCD.dk);
  p(ctx, ox+9, oy+9, LCD.dk); p(ctx, ox+10, oy+10, LCD.dk); p(ctx, ox+10, oy+11, LCD.dk);
  // Legs
  r(ctx, ox+1, oy+13, 2, 2, LCD.dk); r(ctx, ox+6, oy+13, 2, 2, LCD.dk);
}

function drawCassoTeen(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 18 < 9 ? 0 : 1;
  const ox = cx - 4; const oy = cy - 7 + b;
  // Crest
  r(ctx, ox+2, oy+0, 4, 3, LCD.dk);
  p(ctx, ox+3, oy+0, LCD.md);
  // Small head
  r(ctx, ox+1, oy+3, 6, 4, LCD.dk);
  // Eyes (beady)
  p(ctx, ox+2, oy+4, LCD.bg); p(ctx, ox+2, oy+4, LCD.dk);
  p(ctx, ox+5, oy+4, LCD.bg); p(ctx, ox+5, oy+4, LCD.dk);
  // Tall body
  r(ctx, ox+0, oy+7, 8, 7, LCD.dk);
  // Stripe marks
  line(ctx, ox+1, oy+9, 6, false, LCD.md);
  line(ctx, ox+1, oy+11, 6, false, LCD.md);
  // Legs
  r(ctx, ox+1, oy+14, 2, 2, LCD.dk); r(ctx, ox+5, oy+14, 2, 2, LCD.dk);
}

// ─── Adult sprites ─────────────────────────────────────────────────────────────
function drawQuokka(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 24 < 12 ? 0 : 1;
  const hop = anim === 'happy' && frame % 12 < 6 ? -2 : 0;
  const ox = cx - 6; const oy = cy - 7 + b + hop;

  r(ctx, ox+0, oy+2, 3, 4, LCD.dk);  // left ear
  r(ctx, ox+9, oy+2, 3, 4, LCD.dk);  // right ear
  p(ctx, ox+1, oy+2, LCD.md); p(ctx, ox+10, oy+2, LCD.md);
  r(ctx, ox+2, oy+0, 8, 8, LCD.dk);  // head
  // Eyes
  p(ctx, ox+3, oy+3, LCD.bg); p(ctx, ox+4, oy+3, LCD.bg);
  p(ctx, ox+7, oy+3, LCD.bg); p(ctx, ox+8, oy+3, LCD.bg);
  p(ctx, ox+3, oy+4, LCD.bg); p(ctx, ox+8, oy+4, LCD.bg);
  // Quokka smile (the whole reason they're famous)
  p(ctx, ox+2, oy+6, LCD.bg); p(ctx, ox+3, oy+7, LCD.bg);
  p(ctx, ox+4, oy+7, LCD.bg); p(ctx, ox+5, oy+7, LCD.bg);
  p(ctx, ox+6, oy+7, LCD.bg); p(ctx, ox+7, oy+7, LCD.bg);
  p(ctx, ox+8, oy+6, LCD.bg); p(ctx, ox+9, oy+6, LCD.bg);
  // Body
  r(ctx, ox+2, oy+8, 8, 5, LCD.dk);
  r(ctx, ox+1, oy+9, 10, 3, LCD.dk);
  // Legs
  r(ctx, ox+2, oy+13, 3, 3, LCD.dk); r(ctx, ox+7, oy+13, 3, 3, LCD.dk);
  // Arms
  p(ctx, ox+0, oy+9, LCD.dk); p(ctx, ox+11, oy+9, LCD.dk);
  if (anim === 'happy') {
    p(ctx, ox+0, oy+8, LCD.dk); p(ctx, ox+11, oy+8, LCD.dk);
  }
}

function drawPlatypus(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 30 < 15 ? 0 : 1;
  const ox = cx - 7; const oy = cy - 5 + b;

  // Bill (left side profile)
  r(ctx, ox+0, oy+3, 5, 3, LCD.md);
  r(ctx, ox+0, oy+4, 7, 1, LCD.md);
  // Head
  r(ctx, ox+4, oy+1, 6, 6, LCD.dk);
  p(ctx, ox+5, oy+2, LCD.bg); p(ctx, ox+5, oy+2, LCD.dk);
  // Body
  r(ctx, ox+5, oy+6, 8, 5, LCD.dk);
  r(ctx, ox+4, oy+7, 10, 3, LCD.dk);
  // Flat tail
  r(ctx, ox+11, oy+7, 3, 4, LCD.md);
  r(ctx, ox+12, oy+8, 3, 2, LCD.md);
  // Webbed feet
  r(ctx, ox+5, oy+11, 3, 2, LCD.dk);
  r(ctx, ox+9, oy+11, 3, 2, LCD.dk);
  p(ctx, ox+4, oy+12, LCD.dk); p(ctx, ox+8, oy+12, LCD.dk); p(ctx, ox+12, oy+12, LCD.dk);

  if (anim === 'eating') {
    // Bill open
    p(ctx, ox+0, oy+5, LCD.bg);
  }
}

function drawKookaburra(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 20 < 10 ? 0 : 1;
  const ox = cx - 6; const oy = cy - 6 + b;

  // Large head
  r(ctx, ox+1, oy+0, 10, 8, LCD.dk);
  // Eye ring
  r(ctx, ox+7, oy+1, 4, 4, LCD.bg);
  r(ctx, ox+8, oy+2, 2, 2, LCD.dk);
  // Dark eye stripe
  line(ctx, ox+1, oy+2, 6, false, LCD.md);
  // Upper beak
  r(ctx, ox+0, oy+3, 7, 2, LCD.dk);
  // Lower beak
  if (anim === 'eating' || anim === 'happy') {
    r(ctx, ox+0, oy+6, 5, 3, LCD.dk);
  } else {
    r(ctx, ox+0, oy+5, 6, 2, LCD.md);
  }
  // Body
  r(ctx, ox+2, oy+8, 8, 5, LCD.dk);
  // Wing blue patches
  r(ctx, ox+2, oy+9, 4, 3, LCD.md);
  // Tail
  r(ctx, ox+9, oy+9, 3, 4, LCD.dk);
  // Feet/perch
  r(ctx, ox+3, oy+13, 2, 2, LCD.dk);
  r(ctx, ox+7, oy+13, 2, 2, LCD.dk);
  line(ctx, ox+1, oy+15, 10, false, LCD.md);
}

function drawWombat(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 28 < 14 ? 0 : 1;
  const ox = cx - 6; const oy = cy - 5 + b;

  // Wide flat head
  r(ctx, ox+1, oy+0, 10, 5, LCD.dk);
  // Small round ears
  r(ctx, ox+0, oy+0, 2, 2, LCD.dk); r(ctx, ox+10, oy+0, 2, 2, LCD.dk);
  // Wide flat nose
  r(ctx, ox+4, oy+3, 4, 2, LCD.md);
  // Eyes
  p(ctx, ox+2, oy+1, LCD.bg); p(ctx, ox+2, oy+1, LCD.dk);
  p(ctx, ox+9, oy+1, LCD.bg); p(ctx, ox+9, oy+1, LCD.dk);
  // Barrel body (wombats are very wide)
  r(ctx, ox+0, oy+5, 12, 6, LCD.dk);
  // Short legs
  r(ctx, ox+1, oy+11, 3, 2, LCD.dk);
  r(ctx, ox+8, oy+11, 3, 2, LCD.dk);
  r(ctx, ox+3, oy+11, 2, 3, LCD.dk);
  r(ctx, ox+7, oy+11, 2, 3, LCD.dk);
  // Claws
  p(ctx, ox+1, oy+14, LCD.dk); p(ctx, ox+3, oy+14, LCD.dk);
  p(ctx, ox+8, oy+14, LCD.dk); p(ctx, ox+10, oy+14, LCD.dk);
}

function drawPossum(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 22 < 11 ? 0 : 1;
  const ox = cx - 5; const oy = cy - 6 + b;

  // Pointed ears
  p(ctx, ox+1, oy+0, LCD.dk); p(ctx, ox+8, oy+0, LCD.dk);
  r(ctx, ox+0, oy+1, 3, 3, LCD.dk); r(ctx, ox+7, oy+1, 3, 3, LCD.dk);
  p(ctx, ox+1, oy+1, LCD.md); p(ctx, ox+8, oy+1, LCD.md);
  // Head
  r(ctx, ox+1, oy+3, 8, 6, LCD.dk);
  // Big round eyes (possums have huge eyes)
  r(ctx, ox+1, oy+4, 3, 3, LCD.bg);
  r(ctx, ox+6, oy+4, 3, 3, LCD.bg);
  p(ctx, ox+2, oy+5, LCD.dk); p(ctx, ox+7, oy+5, LCD.dk);
  p(ctx, ox+2, oy+4, LCD.md); p(ctx, ox+7, oy+4, LCD.md);
  // Pointed snout
  r(ctx, ox+3, oy+7, 4, 2, LCD.md);
  p(ctx, ox+4, oy+8, LCD.dk); p(ctx, ox+5, oy+8, LCD.dk);
  // Body
  r(ctx, ox+1, oy+9, 8, 4, LCD.dk);
  // Curling tail
  p(ctx, ox+9, oy+9, LCD.dk); p(ctx, ox+10, oy+10, LCD.dk);
  p(ctx, ox+10, oy+11, LCD.dk); p(ctx, ox+9, oy+12, LCD.dk);
  p(ctx, ox+8, oy+13, LCD.dk);
  // Legs
  r(ctx, ox+2, oy+13, 2, 2, LCD.dk); r(ctx, ox+6, oy+13, 2, 2, LCD.dk);
}

function drawThylacine(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  // Ghost form — drawn in MD (lighter) for ethereal look
  const b = frame % 16 < 8 ? 0 : 1;
  const glow = frame % 8 < 4 ? LCD.md : LCD.lt;
  const ox = cx - 6; const oy = cy - 6 + b;

  // Head (wolf-like)
  r(ctx, ox+2, oy+0, 8, 6, glow);
  // Pointed ears
  r(ctx, ox+2, oy+0, 2, 3, LCD.dk); r(ctx, ox+8, oy+0, 2, 3, LCD.dk);
  // Eyes (eerie glow)
  p(ctx, ox+3, oy+2, LCD.lt); p(ctx, ox+8, oy+2, LCD.lt);
  // Open jaw (always slightly open, menacing)
  r(ctx, ox+3, oy+4, 6, 2, LCD.md);
  p(ctx, ox+4, oy+5, LCD.bg); p(ctx, ox+5, oy+5, LCD.bg); p(ctx, ox+6, oy+5, LCD.bg);
  // Body
  r(ctx, ox+1, oy+6, 10, 5, glow);
  // Distinctive stripes (thylacine's most famous feature)
  for (let s = 0; s < 5; s++) {
    line(ctx, ox + 2 + s, oy + 7 + s % 2, 1, false, LCD.bg);
  }
  line(ctx, ox+2, oy+7, 8, false, LCD.bg);
  line(ctx, ox+2, oy+9, 8, false, LCD.bg);
  // Stiff tail
  r(ctx, ox+11, oy+7, 4, 2, glow);
  // Legs
  r(ctx, ox+1, oy+11, 2, 3, glow); r(ctx, ox+9, oy+11, 2, 3, glow);
  r(ctx, ox+3, oy+12, 2, 2, glow); r(ctx, ox+7, oy+12, 2, 2, glow);
}

function drawElder(ctx: Ctx, cx: number, cy: number, anim: AnimState, frame: number) {
  const b = frame % 40 < 20 ? 0 : 1;
  const ox = cx - 5; const oy = cy - 7 + b;

  // Same base as quokka but hunched + walking stick
  r(ctx, ox+0, oy+2, 3, 4, LCD.dk);
  r(ctx, ox+7, oy+2, 3, 4, LCD.dk);
  p(ctx, ox+1, oy+2, LCD.md); p(ctx, ox+8, oy+2, LCD.md);
  r(ctx, ox+1, oy+0, 8, 8, LCD.dk);
  // Wise eyes (slightly squinted)
  line(ctx, ox+2, oy+3, 2, false, LCD.bg);
  line(ctx, ox+6, oy+3, 2, false, LCD.bg);
  p(ctx, ox+2, oy+3, LCD.md); p(ctx, ox+6, oy+3, LCD.md);
  // Smile wrinkles
  p(ctx, ox+2, oy+6, LCD.bg); p(ctx, ox+7, oy+6, LCD.bg);
  p(ctx, ox+3, oy+7, LCD.bg); p(ctx, ox+4, oy+7, LCD.bg); p(ctx, ox+5, oy+7, LCD.bg); p(ctx, ox+6, oy+7, LCD.bg);
  // Hunched body
  r(ctx, ox+2, oy+8, 6, 4, LCD.dk);
  r(ctx, ox+1, oy+9, 8, 2, LCD.dk);
  // Walking stick
  line(ctx, ox+9, oy+9, 7, true, LCD.md);
  p(ctx, ox+10, oy+9, LCD.md);
  // Legs (slower, shuffling)
  r(ctx, ox+2, oy+12, 2, 3, LCD.dk);
  r(ctx, ox+6, oy+12, 2, 3, LCD.dk);
}

function drawAngel(ctx: Ctx, cx: number, cy: number, frame: number) {
  const fl = frame % 12 < 6 ? -1 : 1; // float
  const ox = cx - 5; const oy = cy - 7 + fl;

  // Halo
  r(ctx, ox+2, oy+0, 6, 1, LCD.md);
  p(ctx, ox+1, oy+1, LCD.md); p(ctx, ox+8, oy+1, LCD.md);
  r(ctx, ox+2, oy+2, 6, 1, LCD.md);

  // Head (blob-like)
  r(ctx, ox+2, oy+3, 6, 5, LCD.dk);
  p(ctx, ox+3, oy+4, LCD.bg); p(ctx, ox+3, oy+4, LCD.dk);
  p(ctx, ox+6, oy+4, LCD.bg); p(ctx, ox+6, oy+4, LCD.dk);
  p(ctx, ox+3, oy+6, LCD.bg); p(ctx, ox+4, oy+6, LCD.bg); p(ctx, ox+5, oy+6, LCD.bg); p(ctx, ox+6, oy+6, LCD.bg);

  // Wings
  r(ctx, ox+0, oy+8, 3, 4, LCD.md);
  p(ctx, ox+0, oy+7, LCD.md); p(ctx, ox+0, oy+12, LCD.md);
  r(ctx, ox+7, oy+8, 3, 4, LCD.md);
  p(ctx, ox+9, oy+7, LCD.md); p(ctx, ox+9, oy+12, LCD.md);

  // Body
  r(ctx, ox+2, oy+8, 6, 5, LCD.dk);
  // No legs — floating
}

// ─── Overlays ──────────────────────────────────────────────────────────────────
function drawSickOverlay(ctx: Ctx, cx: number, cy: number) {
  // X marks above head
  p(ctx, cx-3, cy-10, LCD.dk); p(ctx, cx-1, cy-8, LCD.dk);
  p(ctx, cx-1, cy-10, LCD.dk); p(ctx, cx-3, cy-8, LCD.dk);
  p(ctx, cx+1, cy-10, LCD.dk); p(ctx, cx+3, cy-8, LCD.dk);
  p(ctx, cx+3, cy-10, LCD.dk); p(ctx, cx+1, cy-8, LCD.dk);
}

function drawPoopPile(ctx: Ctx, poopCount: number) {
  const positions = [[4, 19], [8, 20], [2, 21]];
  for (let i = 0; i < Math.min(poopCount, 3); i++) {
    const [px2, py] = positions[i];
    drawPoop(ctx, px2, py);
  }
}

// ─── Game mode: L/R prompt ─────────────────────────────────────────────────────
export interface GameDrawState {
  direction:  'left' | 'right';
  revealed:   boolean;
  playerGuess: 'left' | 'right' | null;
  round:      number;
  wins:       number;
}

function drawGame(ctx: Ctx, game: GameDrawState, frame: number) {
  // Clear pet area
  r(ctx, 0, 5, 32, 19, LCD.bg);

  // Score
  ctx.fillStyle = LCD.dk;
  ctx.font = `${S * 2}px "Courier New", monospace`;
  ctx.fillText(`${game.wins}/3`, 13 * S, 8 * S);
  ctx.fillText(`RD ${game.round}/5`, 13 * S, 11 * S);

  // Arrow prompt
  const flash = Math.floor(frame / 8) % 2 === 0;
  if (!game.revealed) {
    if (flash) {
      ctx.fillText('<  ?  >', 6 * S, 16 * S);
    } else {
      ctx.fillText('  ???  ', 6 * S, 16 * S);
    }
  } else {
    const arrow = game.direction === 'left' ? '<——   ' : '   ——>';
    const correct = game.playerGuess === game.direction;
    ctx.fillStyle = correct ? LCD.dk : LCD.md;
    ctx.fillText(arrow, 5 * S, 16 * S);
  }
}

// ─── Status screen ─────────────────────────────────────────────────────────────
function drawStatus(ctx: Ctx, state: TamaState) {
  r(ctx, 0, 5, 32, 19, LCD.bg);
  ctx.fillStyle = LCD.dk;
  ctx.font = `${S * 2}px "Courier New", monospace`;
  const days = Math.floor(state.ageMs / (24 * 3_600_000));
  ctx.fillText(`Age   ${String(days).padStart(3)}d`, 1 * S, 9 * S);
  ctx.fillText(`Wt    ${String(Math.round(state.weight)).padStart(3)}oz`, 1 * S, 12 * S);
  ctx.fillText(`Disc  ${String(Math.round(state.discipline)).padStart(3)}%`, 1 * S, 15 * S);
  ctx.fillText(`Posts ${String(state.postsRead).padStart(3)}`, 1 * S, 18 * S);
  ctx.fillText(`XP    ${String(state.xp).padStart(3)}`, 1 * S, 21 * S);
}

// ─── Main scene render ─────────────────────────────────────────────────────────
export interface DrawParams {
  state:         TamaState;
  anim:          AnimState;
  frame:         number;
  selectedMenu:  number;
  showStatus:    boolean;
  gameState?:    GameDrawState;
  message?:      string;
}

export function drawScene(ctx: Ctx, params: DrawParams) {
  const { state, anim, frame, selectedMenu, showStatus, gameState, message } = params;

  // Clear
  ctx.fillStyle = LCD.bg;
  ctx.fillRect(0, 0, 128, 128);

  // Icon bar
  drawIconBar(ctx, selectedMenu, state.callPending, frame);

  // Divider
  line(ctx, 0, 4, 32, false, LCD.md);

  if (showStatus) {
    drawStatus(ctx, state);
  } else if (gameState) {
    drawGame(ctx, gameState, frame);
  } else {
    // Pet sprite
    const cx = 16;
    const cy = 14;

    const sp = state.species;
    const sleeping = anim === 'sleeping';
    const eff = sleeping ? 'sleeping' : anim;

    if (sp === 'egg')         drawEgg(ctx, cx, cy, anim === 'happy' ? frame + 30 : frame);
    else if (sp === 'blob')   drawBlob(ctx, cx, cy, eff, frame);
    else if (sp === 'joey')   drawJoey(ctx, cx, cy, eff, frame);
    else if (sp === 'quokka_teen')   drawQuokkaTeen(ctx, cx, cy, eff, frame);
    else if (sp === 'wallaby_teen')  drawWallabyTeen(ctx, cx, cy, eff, frame);
    else if (sp === 'casso_teen')    drawCassoTeen(ctx, cx, cy, eff, frame);
    else if (sp === 'quokka')        drawQuokka(ctx, cx, cy, eff, frame);
    else if (sp === 'platypus')      drawPlatypus(ctx, cx, cy, eff, frame);
    else if (sp === 'kookaburra')    drawKookaburra(ctx, cx, cy, eff, frame);
    else if (sp === 'wombat')        drawWombat(ctx, cx, cy, eff, frame);
    else if (sp === 'possum')        drawPossum(ctx, cx, cy, eff, frame);
    else if (sp === 'thylacine')     drawThylacine(ctx, cx, cy, eff, frame);
    else if (sp === 'elder')         drawElder(ctx, cx, cy, eff, frame);
    else if (sp === 'angel')         drawAngel(ctx, cx, cy, frame);

    // Sick overlay
    if (state.sick && anim !== 'dead') drawSickOverlay(ctx, cx, cy);

    // Poop
    if (state.poopCount > 0) drawPoopPile(ctx, state.poopCount);

    // Sleeping ZZZ
    if (sleeping) drawZzz(ctx, cx + 3, cy - 5, frame);

    // Happy hearts floating
    if (anim === 'happy' && frame % 16 < 8) {
      p(ctx, cx + 2, cy - 7 - (frame % 16), LCD.dk);
      p(ctx, cx + 3, cy - 8 - (frame % 16), LCD.dk);
    }
  }

  // Hearts
  drawHearts(ctx, state.hunger, state.happiness);

  // Message
  if (message) drawMessage(ctx, message);
}
