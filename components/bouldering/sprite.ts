// 10×16 pixel art climber — 4 frames
// Each frame is a 10×16 array of color strings ('' = transparent)

const _ = '';          // transparent
const B = '#1A0A05';   // ink / body
const S = '#F4C07A';   // skin
const R = '#C0281C';   // vermilion shirt
const G = '#2D6A4F';   // jade pants
const W = '#FFFFFF';   // chalk / white

// Frame 0: neutral hang (arms up, feet dangling)
const F0: string[][] = [
  [_,_,_,S,S,S,S,_,_,_],
  [_,_,S,S,S,S,S,S,_,_],
  [_,_,S,B,S,S,B,S,_,_],
  [_,_,_,S,S,S,S,_,_,_],
  [B,_,_,R,R,R,R,_,_,B],
  [B,_,R,R,R,R,R,R,_,B],
  [_,W,R,R,R,R,R,R,W,_],
  [_,_,R,R,R,R,R,R,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,_,_,_,_,G,_,_],
  [_,_,B,_,_,_,_,B,_,_],
  [_,_,B,B,_,_,B,B,_,_],
  [_,_,_,B,_,_,B,_,_,_],
  [_,_,_,_,_,_,_,_,_,_],
];

// Frame 1: reach left
const F1: string[][] = [
  [_,_,_,S,S,S,S,_,_,_],
  [_,_,S,S,S,S,S,S,_,_],
  [_,_,S,B,S,S,B,S,_,_],
  [_,_,_,S,S,S,S,_,_,_],
  [B,B,_,R,R,R,R,_,_,_],
  [B,_,R,R,R,R,R,R,_,_],
  [_,W,R,R,R,R,R,R,W,_],
  [_,_,R,R,R,R,R,R,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,G,G,_,_,_,_,G,_,_],
  [_,G,_,_,_,_,_,G,_,_],
  [_,B,_,_,_,_,_,B,_,_],
  [B,B,_,_,_,_,B,B,_,_],
  [_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_],
];

// Frame 2: reach right
const F2: string[][] = [
  [_,_,_,S,S,S,S,_,_,_],
  [_,_,S,S,S,S,S,S,_,_],
  [_,_,S,B,S,S,B,S,_,_],
  [_,_,_,S,S,S,S,_,_,_],
  [_,_,_,R,R,R,R,_,B,B],
  [_,_,R,R,R,R,R,R,_,B],
  [_,W,R,R,R,R,R,R,W,_],
  [_,_,R,R,R,R,R,R,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,_,G,_,_,_,_,G,G,_],
  [_,_,G,_,_,_,_,_,G,_],
  [_,_,B,_,_,_,_,_,B,_],
  [_,_,B,B,_,_,_,B,B,B],
  [_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_],
];

// Frame 3: feet smear (crouched)
const F3: string[][] = [
  [_,_,_,_,_,_,_,_,_,_],
  [_,_,_,S,S,S,S,_,_,_],
  [_,_,S,S,S,S,S,S,_,_],
  [_,_,S,B,S,S,B,S,_,_],
  [_,_,_,S,S,S,S,_,_,_],
  [B,_,_,R,R,R,R,_,_,B],
  [B,_,R,R,R,R,R,R,_,B],
  [_,W,R,R,R,R,R,R,W,_],
  [_,_,R,R,R,R,R,R,_,_],
  [_,_,G,G,_,_,G,G,_,_],
  [_,G,G,_,_,_,_,G,G,_],
  [_,G,_,_,_,_,_,_,G,_],
  [_,B,B,_,_,_,_,B,B,_],
  [_,_,B,B,_,_,B,B,_,_],
  [_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_],
];

export const FRAMES = [F0, F1, F2, F3];
export const SPRITE_W = 10;
export const SPRITE_H = 16;

// Draw a single sprite frame at (cx, cy) — centre-x, bottom-y
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: number,
  cx: number,
  cy: number,
  scale = 2,
): void {
  const f = FRAMES[frame % FRAMES.length];
  const ox = cx - (SPRITE_W * scale) / 2;
  const oy = cy - SPRITE_H * scale;
  for (let row = 0; row < SPRITE_H; row++) {
    for (let col = 0; col < SPRITE_W; col++) {
      const color = f[row][col];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + col * scale, oy + row * scale, scale, scale);
    }
  }
}
