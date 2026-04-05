// ─── Australian creature pixel-art sprites ────────────────────────────────────
// Canvas: 48×56, displayed at 4x scale = 192×224px
// All Y coordinates accept + dy (idle bob offset)
// draw functions signature: (ctx, opts, f) where f = frame number

export interface DrawOpts {
  dy:        number;
  eyeOpenL:  number;   // 0=closed 1=open
  eyeOpenR:  number;
  pupilLX:   number;   // -1..1 horizontal shift
  pupilRX:   number;
  mouthOpen: number;   // 0=closed 1=open (eat)
  frown:     boolean;
  glow:      boolean;  // happy state sparkle
}

// ─── Shared helper ─────────────────────────────────────────────────────────────
function pr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function eye(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, sw: number,
  eyeOpen: number, pupilX: number,
  eyeWhite: string, pupilColor: string,
) {
  const eyeH = Math.round(sw * 0.85 * Math.max(0, eyeOpen));
  const eyeY = sy + Math.round(((sw * 0.85) - eyeH) / 2);
  if (eyeH <= 0) {
    pr(ctx, sx, sy + Math.round(sw * 0.42), sw, 1, pupilColor);
    return;
  }
  pr(ctx, sx, eyeY, sw, eyeH, eyeWhite);
  const pw = Math.max(1, Math.round(sw * 0.38));
  const px = sx + Math.round((sw - pw) / 2) + Math.round(pupilX * sw * 0.22);
  const py = eyeY + Math.round(eyeH * 0.22);
  pr(ctx, px, py, pw, Math.min(pw, eyeH), pupilColor);
  pr(ctx, px, py, 1, 1, '#FFFFFF');
}

// ─── 1. QUOKKA ────────────────────────────────────────────────────────────────
const Q = {
  FUR:    '#C4854A', FUR_SH: '#9A6030', FUR_HI: '#DCAA68',
  FACE:   '#E8C48C', EAR_IN: '#E87878',
  EYE_W:  '#F0E8D0', PUPIL:  '#1A0800',
  NOSE:   '#3A1808', MOUTH:  '#8A3018',
};

export function drawQuokka(ctx: CanvasRenderingContext2D, opts: DrawOpts, _f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Ears
  pr(ctx, 12, 5+d, 6, 8, Q.FUR_SH); pr(ctx, 11, 4+d, 6, 8, Q.FUR);
  pr(ctx, 13, 6+d, 3, 5, Q.EAR_IN);
  pr(ctx, 30, 5+d, 6, 8, Q.FUR_SH); pr(ctx, 30, 4+d, 6, 8, Q.FUR);
  pr(ctx, 31, 6+d, 3, 5, Q.EAR_IN);

  // Head
  pr(ctx, 12, 9+d, 24, 18, Q.FUR_SH); pr(ctx, 11, 8+d, 24, 18, Q.FUR);
  pr(ctx, 11, 8+d, 24, 1, Q.FUR_HI); pr(ctx, 11, 8+d, 1, 18, Q.FUR_HI);
  pr(ctx, 14, 11+d, 17, 13, Q.FACE); // tan face

  // Eyes
  eye(ctx, 15, 14+d, 6, opts.eyeOpenL, opts.pupilLX, Q.EYE_W, Q.PUPIL);
  eye(ctx, 26, 14+d, 6, opts.eyeOpenR, opts.pupilRX, Q.EYE_W, Q.PUPIL);

  // Nose
  pr(ctx, 21, 22+d, 5, 2, Q.FACE); pr(ctx, 22, 23+d, 3, 2, Q.NOSE);

  // Quokka smile (signature — always upward curve)
  if (opts.mouthOpen > 0.4) {
    pr(ctx, 18, 24+d, 10, 4, Q.NOSE);  // open mouth
  } else if (opts.frown) {
    pr(ctx, 17, 25+d, 2, 1, Q.MOUTH); pr(ctx, 28, 25+d, 2, 1, Q.MOUTH);
    pr(ctx, 19, 26+d, 9, 1, Q.MOUTH);
  } else {
    // The iconic quokka smile — curves upward
    pr(ctx, 17, 26+d, 2, 1, Q.MOUTH);  // left corner
    pr(ctx, 19, 25+d, 9, 1, Q.MOUTH);  // top of arc
    pr(ctx, 28, 26+d, 2, 1, Q.MOUTH);  // right corner
    pr(ctx, 18, 26+d, 11, 1, Q.MOUTH); // lower fill
  }

  // Body
  pr(ctx, 14, 28+d, 22, 18, Q.FUR_SH); pr(ctx, 13, 27+d, 22, 18, Q.FUR);
  pr(ctx, 13, 27+d, 22, 1, Q.FUR_HI); pr(ctx, 13, 27+d, 1, 18, Q.FUR_HI);
  pr(ctx, 16, 29+d, 15, 14, Q.FACE); // belly

  // Arms (small stubs)
  pr(ctx, 9, 30+d, 5, 8, Q.FUR_SH); pr(ctx, 8, 29+d, 5, 8, Q.FUR);
  pr(ctx, 35, 30+d, 5, 8, Q.FUR_SH); pr(ctx, 34, 29+d, 5, 8, Q.FUR);

  // Legs
  pr(ctx, 15, 45+d, 7, 8, Q.FUR_SH); pr(ctx, 14, 44+d, 7, 8, Q.FUR);
  pr(ctx, 27, 45+d, 7, 8, Q.FUR_SH); pr(ctx, 26, 44+d, 7, 8, Q.FUR);
  pr(ctx, 13, 51+d, 9, 3, Q.FUR_SH); pr(ctx, 12, 50+d, 9, 3, Q.FUR);
  pr(ctx, 25, 51+d, 9, 3, Q.FUR_SH); pr(ctx, 24, 50+d, 9, 3, Q.FUR);
}

// ─── 2. WOMBAT ────────────────────────────────────────────────────────────────
const W = {
  FUR:    '#7A6A58', FUR_SH: '#5A4A3A', FUR_HI: '#9A8A72',
  FACE:   '#8A7A66', NOSE_PL:'#B89C82', CLAW:   '#C8B898',
  EYE_W:  '#DDD0B8', PUPIL:  '#160A00', OUT:    '#2A1E10',
};

export function drawWombat(ctx: CanvasRenderingContext2D, opts: DrawOpts, _f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Tiny ear bumps
  pr(ctx, 12, 7+d, 5, 4, W.FUR_SH); pr(ctx, 11, 6+d, 5, 4, W.FUR);
  pr(ctx, 31, 7+d, 5, 4, W.FUR_SH); pr(ctx, 30, 6+d, 5, 4, W.FUR);

  // Head (notably wide — 28px)
  pr(ctx, 11, 8+d, 28, 18, W.FUR_SH); pr(ctx, 10, 7+d, 28, 18, W.FUR);
  pr(ctx, 10, 7+d, 28, 1, W.FUR_HI); pr(ctx, 10, 7+d, 1, 18, W.FUR_HI);
  pr(ctx, 13, 10+d, 22, 13, W.FACE);

  // Wide flat nose plate (signature wombat feature)
  pr(ctx, 17, 19+d, 14, 5, W.NOSE_PL);
  pr(ctx, 20, 21+d, 3, 2, W.OUT); pr(ctx, 25, 21+d, 3, 2, W.OUT); // nostrils

  // Eyes (wide-set)
  eye(ctx, 13, 13+d, 6, opts.eyeOpenL, opts.pupilLX, W.EYE_W, W.PUPIL);
  eye(ctx, 29, 13+d, 6, opts.eyeOpenR, opts.pupilRX, W.EYE_W, W.PUPIL);

  // Stoic mouth
  if (opts.mouthOpen > 0.4) {
    pr(ctx, 19, 23+d, 10, 4, W.OUT);
  } else if (opts.frown) {
    pr(ctx, 19, 24+d, 4, 1, W.OUT); pr(ctx, 27, 24+d, 4, 1, W.OUT);
    pr(ctx, 20, 23+d, 8, 1, W.OUT);
  } else {
    pr(ctx, 19, 24+d, 10, 1, W.OUT); // straight neutral line
  }

  // Body (barrel — very wide 28px)
  pr(ctx, 11, 27+d, 28, 22, W.FUR_SH); pr(ctx, 10, 26+d, 28, 22, W.FUR);
  pr(ctx, 10, 26+d, 28, 1, W.FUR_HI); pr(ctx, 10, 26+d, 1, 22, W.FUR_HI);
  pr(ctx, 14, 29+d, 20, 17, W.FACE); // belly

  // Squat legs (very short)
  pr(ctx, 12, 48+d, 8, 6, W.FUR_SH); pr(ctx, 11, 47+d, 8, 6, W.FUR);
  pr(ctx, 29, 48+d, 8, 6, W.FUR_SH); pr(ctx, 28, 47+d, 8, 6, W.FUR);
  // Claws
  for (let i = 0; i < 3; i++) {
    pr(ctx, 11 + i*3, 52+d, 2, 2, W.CLAW);
    pr(ctx, 28 + i*3, 52+d, 2, 2, W.CLAW);
  }
}

// ─── 3. PLATYPUS (profile, faces left) ───────────────────────────────────────
const PL = {
  BODY:   '#4A3020', BODY_SH:'#30180C', BODY_HI:'#6A4830',
  BELLY:  '#D8C8A0', BILL:   '#7A8A60', BILL_SH:'#5A6A40',
  TAIL:   '#3A2018', FT:     '#8A7050',
  EYE_W:  '#D8C890', PUPIL:  '#100800',
};

export function drawPlatypus(ctx: CanvasRenderingContext2D, opts: DrawOpts, _f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Broad flat tail (bottom center)
  pr(ctx, 17, 42+d, 16, 10, PL.TAIL);
  for (let i = 0; i < 3; i++) pr(ctx, 17, 44+d + i*3, 16, 1, PL.BODY_HI);

  // Body (oval — layered rects)
  pr(ctx, 9, 19+d, 30, 16, PL.BODY_SH); pr(ctx, 8, 18+d, 30, 16, PL.BODY);  // widest
  pr(ctx, 12, 11+d, 24, 8, PL.BODY_SH); pr(ctx, 11, 10+d, 24, 8, PL.BODY);  // upper
  pr(ctx, 12, 35+d, 24, 8, PL.BODY_SH); pr(ctx, 11, 34+d, 24, 8, PL.BODY);  // lower
  pr(ctx, 14, 17+d, 20, 24, PL.BELLY);  // cream belly

  // Duck bill (extends left, platypus faces left)
  pr(ctx, 7, 22+d, 14, 5, PL.BILL_SH); pr(ctx, 6, 21+d, 14, 5, PL.BILL);
  pr(ctx, 5, 22+d, 3, 3, PL.BILL_SH);  // rounded tip
  pr(ctx, 6, 21+d, 14, 1, PL.BILL);    // top highlight

  // Single eye (profile — right side of head)
  const eyeH = Math.round(4 * Math.max(0, opts.eyeOpenL));
  const eyeY = 14 + d + Math.round((4 - eyeH) / 2);
  pr(ctx, 26, 13+d, 6, 6, PL.BODY_SH);
  if (eyeH > 0) {
    pr(ctx, 27, eyeY, 4, eyeH, PL.EYE_W);
    const px = 28 - Math.round(opts.pupilLX * 1.5); // negate: looking forward (toward bill)
    pr(ctx, px, eyeY + Math.round(eyeH * 0.25), 2, Math.min(2, eyeH), PL.PUPIL);
    pr(ctx, px, eyeY + Math.round(eyeH * 0.25), 1, 1, '#FFFFFF');
  } else {
    pr(ctx, 27, 16+d, 4, 1, PL.BODY_SH);
  }

  // Small webbed feet
  pr(ctx, 10, 41+d, 8, 5, PL.FT); pr(ctx, 10, 47+d, 8, 5, PL.FT);
  // Web line texture
  for (let i = 0; i < 3; i++) {
    pr(ctx, 12 + i*2, 41+d, 1, 5, PL.BODY_SH);
    pr(ctx, 12 + i*2, 47+d, 1, 5, PL.BODY_SH);
  }
}

// ─── 4. KOOKABURRA ────────────────────────────────────────────────────────────
const KK = {
  HEAD:   '#E8D8B0', HEAD_SH:'#C8B888',
  BACK:   '#6A5030', BACK_SH:'#4A3018',
  WING:   '#4870A8', WING_SH:'#284878',
  BEAK_U: '#3A2808', BEAK_L: '#6A5030',
  STRIPE: '#2A1808',
  EYE_W:  '#F0E8C8', PUPIL:  '#100800',
};

export function drawKookaburra(ctx: CanvasRenderingContext2D, opts: DrawOpts, f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Wings (behind body)
  pr(ctx, 8, 28+d, 10, 16, KK.BACK_SH); pr(ctx, 7, 27+d, 10, 16, KK.BACK);
  pr(ctx, 8, 30+d, 7, 10, KK.WING_SH); pr(ctx, 7, 29+d, 7, 10, KK.WING); // blue patch
  pr(ctx, 31, 28+d, 10, 16, KK.BACK_SH); pr(ctx, 31, 27+d, 10, 16, KK.BACK);
  pr(ctx, 32, 30+d, 7, 10, KK.WING_SH); pr(ctx, 32, 29+d, 7, 10, KK.WING);

  // Head (big round — 24px wide)
  pr(ctx, 14, 6+d, 24, 20, KK.HEAD_SH); pr(ctx, 13, 5+d, 24, 20, KK.HEAD);
  pr(ctx, 13, 5+d, 24, 1, KK.HEAD); // top highlight
  // Crown stripe (brown)
  pr(ctx, 16, 5+d, 16, 5, KK.BACK_SH); pr(ctx, 15, 5+d, 16, 4, KK.BACK);
  // Dark eye stripe through face
  pr(ctx, 13, 15+d, 24, 3, KK.STRIPE);

  // Eyes (in the dark stripe)
  eye(ctx, 15, 14+d, 6, opts.eyeOpenL, opts.pupilLX, KK.EYE_W, KK.PUPIL);
  eye(ctx, 27, 14+d, 6, opts.eyeOpenR, opts.pupilRX, KK.EYE_W, KK.PUPIL);

  // Long beak (14px, laugh jaw drops on eat/happy)
  const jawDrop = opts.mouthOpen > 0.3 ? Math.round(opts.mouthOpen * 4) : (f % 35 < 4 && opts.glow ? 2 : 0);
  pr(ctx, 22, 20+d, 15, 3, KK.BEAK_U); pr(ctx, 21, 19+d, 15, 3, KK.BEAK_U); // upper
  pr(ctx, 23, 22+d + jawDrop, 12, 3, KK.BEAK_L); pr(ctx, 22, 21+d + jawDrop, 12, 3, KK.BEAK_L); // lower
  pr(ctx, 35, 20+d, 1, 4, KK.BEAK_U); // tip hook

  // Body (compact)
  pr(ctx, 16, 27+d, 18, 18, KK.BACK_SH); pr(ctx, 15, 26+d, 18, 18, KK.BACK);
  pr(ctx, 17, 28+d, 14, 14, KK.HEAD); // cream breast

  // Tail
  pr(ctx, 20, 42+d, 8, 14, KK.BACK_SH); pr(ctx, 19, 41+d, 8, 14, KK.BACK);
  for (let i = 0; i < 3; i++) pr(ctx, 19, 43+d + i*4, 8, 2, KK.BACK_SH);

  // Feet (perch grip)
  pr(ctx, 13, 51+d, 3, 4, KK.BACK_SH); pr(ctx, 16, 51+d, 3, 4, KK.BACK_SH);
  pr(ctx, 10, 53+d, 4, 2, KK.BACK_SH);
  pr(ctx, 33, 51+d, 3, 4, KK.BACK_SH); pr(ctx, 36, 51+d, 3, 4, KK.BACK_SH);
  pr(ctx, 36, 53+d, 4, 2, KK.BACK_SH);
}

// ─── 5. SUGAR GLIDER ──────────────────────────────────────────────────────────
const SG = {
  BODY:   '#788090', BODY_SH:'#505868', BODY_HI:'#98A0B0',
  BELLY:  '#D8D0C0', MEM:    '#607080', // gliding membrane
  STRIPE: '#2A2830', EAR:    '#304050',
  NOSE:   '#C87880',
  EYE_W:  '#F0ECD8', PUPIL:  '#080808',
};

export function drawSugarGlider(ctx: CanvasRenderingContext2D, opts: DrawOpts, f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);
  const spread = opts.glow ? 2 : 0; // membrane spreads wider when happy/gliding

  // Gliding membrane (draw behind everything)
  const memW = 10 + spread;
  [
    [8, 16+d, memW, 2], [7, 18+d, memW-2, 3], [7, 21+d, memW-4, 4],
    [8, 25+d, memW-5, 5], [9, 30+d, 4, 6], [10, 36+d, 3, 5],
  ].forEach(([x, y, w, h]) => pr(ctx, x, y, w, h, SG.MEM));
  [
    [30, 16+d, memW, 2], [33, 18+d, memW-2, 3], [35, 21+d, memW-4, 4],
    [35, 25+d, memW-5, 5], [35, 30+d, 4, 6], [35, 36+d, 3, 5],
  ].forEach(([x, y, w, h]) => pr(ctx, x, y, w, h, SG.MEM));

  // Dorsal stripe (runs full body)
  pr(ctx, 22, 8+d, 4, 34, SG.STRIPE);

  // Body (slender)
  pr(ctx, 19, 24+d, 14, 20, SG.BODY_SH); pr(ctx, 18, 23+d, 14, 20, SG.BODY);
  pr(ctx, 20, 25+d, 10, 16, SG.BELLY);
  pr(ctx, 22, 23+d, 4, 20, SG.STRIPE); // dorsal on body

  // Pointed ears (tall)
  pr(ctx, 12, 5+d, 5, 8, SG.BODY_SH); pr(ctx, 11, 4+d, 5, 8, SG.EAR);
  pr(ctx, 12, 4+d, 3, 2, SG.EAR);    // pointed tip
  pr(ctx, 32, 5+d, 5, 8, SG.BODY_SH); pr(ctx, 32, 4+d, 5, 8, SG.EAR);
  pr(ctx, 33, 4+d, 3, 2, SG.EAR);

  // Head (small, round)
  pr(ctx, 17, 10+d, 18, 14, SG.BODY_SH); pr(ctx, 16, 9+d, 18, 14, SG.BODY);
  pr(ctx, 18, 11+d, 14, 10, SG.BELLY); // lighter face

  // HUGE eyes (8×8 sockets — signature feature)
  const pupilWander = Math.sin(f * 0.04) * 1.5;
  const ehL = Math.round(7 * Math.max(0, opts.eyeOpenL));
  const eyeYL = 12 + d + Math.round((7 - ehL) / 2);
  pr(ctx, 14, 12+d, 9, 8, SG.BODY_SH); // left socket
  if (ehL > 0) {
    pr(ctx, 15, eyeYL, 7, ehL, SG.EYE_W);
    const px = 17 + Math.round((opts.pupilLX + pupilWander) * 1.5);
    pr(ctx, px, eyeYL + Math.round(ehL * 0.25), 3, Math.min(3, ehL), SG.PUPIL);
    pr(ctx, px, eyeYL + Math.round(ehL * 0.25), 1, 1, '#FFFFFF');
    pr(ctx, px + 2, eyeYL + Math.round(ehL * 0.25) + 2, 1, 1, '#FFFFFF'); // 2nd sparkle
  } else {
    pr(ctx, 15, 16+d, 7, 1, SG.BODY_SH);
  }

  const ehR = Math.round(7 * Math.max(0, opts.eyeOpenR));
  const eyeYR = 12 + d + Math.round((7 - ehR) / 2);
  pr(ctx, 26, 12+d, 9, 8, SG.BODY_SH); // right socket
  if (ehR > 0) {
    pr(ctx, 27, eyeYR, 7, ehR, SG.EYE_W);
    const px = 29 + Math.round((opts.pupilRX + pupilWander) * 1.5);
    pr(ctx, px, eyeYR + Math.round(ehR * 0.25), 3, Math.min(3, ehR), SG.PUPIL);
    pr(ctx, px, eyeYR + Math.round(ehR * 0.25), 1, 1, '#FFFFFF');
    pr(ctx, px + 2, eyeYR + Math.round(ehR * 0.25) + 2, 1, 1, '#FFFFFF');
  } else {
    pr(ctx, 27, 16+d, 7, 1, SG.BODY_SH);
  }

  // Pink nose
  pr(ctx, 22, 20+d, 4, 2, SG.NOSE);

  // Long bushy tail (sweeps right/upward)
  const tw = [8, 7, 7, 6, 6, 5, 4];
  const tx = [21, 22, 23, 24, 25, 26, 27];
  tw.forEach((w, i) => {
    pr(ctx, tx[i]+1, 42+d + i*2, w, 2, SG.BODY_SH);
    pr(ctx, tx[i],   41+d + i*2, w, 2, SG.BODY);
  });
}

// ─── 6. ECHIDNA ───────────────────────────────────────────────────────────────
const EC = {
  BODY:   '#3A2E20', BODY_SH:'#221808',
  SPINE:  '#D8C890', SPINE_T:'#B89A60',
  BELLY:  '#786050', SNOUT:  '#4A3828',
  CLAW:   '#B8A870', NOSE:   '#1A1008',
  EYE_W:  '#C8B888', PUPIL:  '#0A0800',
};

export function drawEchidna(ctx: CanvasRenderingContext2D, opts: DrawOpts, f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Body base (dome/mound)
  pr(ctx, 12, 29+d, 26, 18, EC.BODY_SH); pr(ctx, 11, 28+d, 26, 18, EC.BODY);
  pr(ctx, 14, 21+d, 22, 10, EC.BODY_SH); pr(ctx, 13, 20+d, 22, 10, EC.BODY);
  pr(ctx, 17, 17+d, 16, 5,  EC.BODY_SH); pr(ctx, 16, 16+d, 16, 5,  EC.BODY);
  pr(ctx, 14, 33+d, 20, 12, EC.BELLY); // belly

  // Spines (drawn on top of body) — 3 rows with subtle frame drift
  const rows = [
    { xs: [12,15,18,21,24,27,30], baseY: 8+d,  len: 12 },
    { xs: [13,16,19,22,25,28],    baseY: 14+d, len: 9  },
    { xs: [14,17,20,23,26],       baseY: 18+d, len: 6  },
  ];
  rows.forEach((row, ri) => {
    row.xs.forEach((x, xi) => {
      const drift = Math.round(Math.sin(f * 0.06 + xi * 0.9 + ri * 0.4) * 1);
      pr(ctx, x+1+drift, row.baseY+1, 2, row.len, EC.SPINE_T);
      pr(ctx, x+drift,   row.baseY,   2, row.len, EC.SPINE);
    });
  });

  // Face / head (low, partially under spines)
  pr(ctx, 11, 24+d, 15, 10, EC.BODY_SH); pr(ctx, 10, 23+d, 15, 10, EC.BODY);

  // Long narrow snout (faces left)
  pr(ctx, 6, 27+d, 12, 4, EC.SNOUT); pr(ctx, 5, 26+d, 12, 4, EC.SNOUT);
  pr(ctx, 4, 27+d, 3, 2, EC.NOSE);    // dark nose tip

  // Single small eye
  const ehS = Math.round(4 * Math.max(0, opts.eyeOpenL));
  const eyeYS = 25 + d + Math.round((4 - ehS) / 2);
  pr(ctx, 20, 24+d, 5, 5, EC.BODY_SH);
  if (ehS > 0) {
    pr(ctx, 21, eyeYS, 3, ehS, EC.EYE_W);
    pr(ctx, 22, eyeYS + Math.round(ehS * 0.3), 1, Math.min(1, ehS), EC.PUPIL);
    pr(ctx, 22, eyeYS + Math.round(ehS * 0.3), 1, 1, '#FFFFFF');
  } else {
    pr(ctx, 21, 27+d, 3, 1, EC.BODY_SH);
  }

  // Legs + claws
  pr(ctx, 10, 43+d, 7, 8, EC.BODY_SH); pr(ctx, 9, 42+d, 7, 8, EC.BODY);
  pr(ctx, 31, 43+d, 7, 8, EC.BODY_SH); pr(ctx, 30, 42+d, 7, 8, EC.BODY);
  for (let i = 0; i < 3; i++) {
    pr(ctx, 9 + i*3,  49+d, 2, 1, EC.CLAW);
    pr(ctx, 30 + i*3, 49+d, 2, 1, EC.CLAW);
  }
}

// ─── 7. TASMANIAN DEVIL ───────────────────────────────────────────────────────
const TD = {
  BODY:   '#1E1818', BODY_SH:'#0A0808', BODY_HI:'#302828',
  CHEST:  '#D8C8B0', EAR_IN: '#D86868',
  JAW:    '#C85840', TEETH:  '#F0ECD8',
  EYE_W:  '#E8D8C0', PUPIL:  '#080408',
  NOSE:   '#1A0808',
};

export function drawTazDevil(ctx: CanvasRenderingContext2D, opts: DrawOpts, f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Ears (pink inner)
  pr(ctx, 13, 5+d, 7, 9, TD.BODY_SH); pr(ctx, 12, 4+d, 7, 9, TD.BODY);
  pr(ctx, 14, 6+d, 4, 6, TD.EAR_IN);
  pr(ctx, 29, 5+d, 7, 9, TD.BODY_SH); pr(ctx, 28, 4+d, 7, 9, TD.BODY);
  pr(ctx, 30, 6+d, 4, 6, TD.EAR_IN);

  // Upper head (narrower)
  pr(ctx, 15, 9+d, 22, 10, TD.BODY_SH); pr(ctx, 14, 8+d, 22, 10, TD.BODY);
  pr(ctx, 14, 8+d, 22, 1, TD.BODY_HI);

  // Jaw zone (WIDE — signature feature)
  pr(ctx, 11, 19+d, 28, 10, TD.BODY_SH); pr(ctx, 10, 18+d, 28, 10, TD.BODY);
  pr(ctx, 10, 18+d, 28, 1, TD.BODY_HI);

  // Menacing brow ridges
  pr(ctx, 16, 11+d, 7, 1, TD.BODY_SH);
  pr(ctx, 28, 11+d, 7, 1, TD.BODY_SH);

  // Eyes
  eye(ctx, 17, 12+d, 6, opts.eyeOpenL, opts.pupilLX, TD.EYE_W, TD.PUPIL);
  eye(ctx, 29, 12+d, 6, opts.eyeOpenR, opts.pupilRX, TD.EYE_W, TD.PUPIL);

  // Nose
  pr(ctx, 22, 17+d, 4, 2, TD.NOSE);

  // Jaw — idle: small clack every 60 frames; eat/hungry: open wide
  const idleClack = (f % 60 < 4) ? 2 : 0;
  const jawOpen = opts.mouthOpen > 0.1
    ? Math.round(opts.mouthOpen * 9)
    : opts.frown ? 3 : idleClack;

  if (jawOpen > 0) {
    pr(ctx, 11, 24+d, 26, jawOpen + 2, TD.JAW); // red mouth interior
    // Upper teeth
    for (let i = 0; i < 5; i++) pr(ctx, 13 + i*4, 24+d, 3, 2, TD.TEETH);
    // Lower teeth
    for (let i = 0; i < 5; i++) pr(ctx, 13 + i*4, 24+d + jawOpen, 3, 2, TD.TEETH);
  } else {
    // Closed jaw seam + teeth hint
    pr(ctx, 13, 24+d, 22, 2, TD.BODY);
    pr(ctx, 15, 24+d, 18, 2, TD.TEETH); // peek of teeth
  }

  // Body (stocky)
  pr(ctx, 13, 28+d, 22, 18, TD.BODY_SH); pr(ctx, 12, 27+d, 22, 18, TD.BODY);
  pr(ctx, 12, 27+d, 22, 1, TD.BODY_HI);
  pr(ctx, 16, 28+d, 16, 14, TD.CHEST); // white chest patch

  // Legs
  pr(ctx, 14, 46+d, 8, 8, TD.BODY_SH); pr(ctx, 13, 45+d, 8, 8, TD.BODY);
  pr(ctx, 27, 46+d, 8, 8, TD.BODY_SH); pr(ctx, 26, 45+d, 8, 8, TD.BODY);
  pr(ctx, 12, 52+d, 10, 3, TD.BODY_SH); pr(ctx, 11, 51+d, 10, 3, TD.BODY);
  pr(ctx, 26, 52+d, 10, 3, TD.BODY_SH); pr(ctx, 25, 51+d, 10, 3, TD.BODY);
}

// ─── 8. NUMBAT ────────────────────────────────────────────────────────────────
const NB = {
  BODY:   '#B05828', BODY_SH:'#804018', BODY_HI:'#D07838',
  STRIPE: '#F0E8C8', STRIPE_D:'#2A1808',
  BELLY:  '#E8C888', SNOUT:  '#6A3818',
  TAIL:   '#C8A060', TAIL_SH:'#907040',
  EYE_W:  '#EDE0C0', PUPIL:  '#100800',
  EYE_STR:'#2A1000', NOSE:   '#3A1808',
};

export function drawNumbat(ctx: CanvasRenderingContext2D, opts: DrawOpts, f: number) {
  ctx.clearRect(0, 0, 48, 56);
  const d = Math.round(opts.dy);

  // Bushy tail (held upright, sweeps right) — draw first
  const tailSway = Math.round(Math.sin(f * 0.07) * 2);
  const tSegs = [[8,2],[7,3],[6,4],[6,5],[5,5],[5,5],[4,5]];
  tSegs.forEach(([w, h], i) => {
    const tx = 27 + tailSway + Math.round(i * 0.6);
    const ty = 35+d - i * 3;
    pr(ctx, tx+1, ty+1, w, h, NB.TAIL_SH);
    pr(ctx, tx, ty, w, h, NB.TAIL);
  });

  // Body (slender 14px wide)
  pr(ctx, 15, 22+d, 16, 20, NB.BODY_SH); pr(ctx, 14, 21+d, 16, 20, NB.BODY);
  pr(ctx, 14, 21+d, 16, 1, NB.BODY_HI);
  pr(ctx, 17, 22+d, 10, 18, NB.BELLY); // pale belly

  // White stripe pattern on rump (4 stripes)
  for (let i = 0; i < 4; i++) {
    pr(ctx, 14, 28+d + i*4, 14, 2, NB.STRIPE);
    pr(ctx, 14, 30+d + i*4, 14, 2, NB.STRIPE_D);
  }

  // Head (slender 16px)
  pr(ctx, 16, 8+d, 16, 14, NB.BODY_SH); pr(ctx, 15, 7+d, 16, 14, NB.BODY);
  pr(ctx, 15, 7+d, 16, 1, NB.BODY_HI);

  // Dark eye stripe
  pr(ctx, 15, 13+d, 16, 3, NB.EYE_STR);

  // Small eyes (in the stripe, 4px wide)
  const nehL = Math.round(4 * Math.max(0, opts.eyeOpenL));
  const eyeYnL = 13 + d + Math.round((4 - nehL) / 2);
  pr(ctx, 16, 13+d, 5, 5, NB.BODY_SH);
  if (nehL > 0) {
    pr(ctx, 17, eyeYnL, 3, nehL, NB.EYE_W);
    const px = 18 + Math.round(opts.pupilLX);
    pr(ctx, px, eyeYnL + Math.round(nehL * 0.3), 1, Math.min(1, nehL), NB.PUPIL);
    pr(ctx, px, eyeYnL + Math.round(nehL * 0.3), 1, 1, '#FFFFFF');
  } else { pr(ctx, 17, 15+d, 3, 1, NB.BODY_SH); }

  const nehR = Math.round(4 * Math.max(0, opts.eyeOpenR));
  const eyeYnR = 13 + d + Math.round((4 - nehR) / 2);
  pr(ctx, 24, 13+d, 5, 5, NB.BODY_SH);
  if (nehR > 0) {
    pr(ctx, 25, eyeYnR, 3, nehR, NB.EYE_W);
    const px = 26 + Math.round(opts.pupilRX);
    pr(ctx, px, eyeYnR + Math.round(nehR * 0.3), 1, Math.min(1, nehR), NB.PUPIL);
    pr(ctx, px, eyeYnR + Math.round(nehR * 0.3), 1, 1, '#FFFFFF');
  } else { pr(ctx, 25, 15+d, 3, 1, NB.BODY_SH); }

  // Pointed snout (extends right)
  const snoutTwitch = f % 90 < 6 ? 1 : 0;
  pr(ctx, 30, 15+d, 10 + snoutTwitch, 4, NB.SNOUT);
  pr(ctx, 29, 14+d, 10 + snoutTwitch, 4, NB.SNOUT);
  pr(ctx, 38 + snoutTwitch, 15+d, 2, 2, NB.NOSE); // dark tip

  // Tongue flick (happy state — "rare animation")
  if (opts.glow && f % 20 < 8) {
    pr(ctx, 37 + snoutTwitch, 16+d, 4, 2, '#D84060');
  }

  // Legs
  pr(ctx, 15, 42+d, 6, 10, NB.BODY_SH); pr(ctx, 14, 41+d, 6, 10, NB.BODY);
  pr(ctx, 22, 42+d, 6, 10, NB.BODY_SH); pr(ctx, 21, 41+d, 6, 10, NB.BODY);
  pr(ctx, 13, 50+d, 7, 3, NB.BODY_SH); pr(ctx, 12, 49+d, 7, 3, NB.BODY);
  pr(ctx, 20, 50+d, 7, 3, NB.BODY_SH); pr(ctx, 19, 49+d, 7, 3, NB.BODY);
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
const DRAWERS = [
  drawQuokka, drawWombat, drawPlatypus, drawKookaburra,
  drawSugarGlider, drawEchidna, drawTazDevil, drawNumbat,
];

export function drawCreature(
  idx: number,
  ctx: CanvasRenderingContext2D,
  opts: DrawOpts,
  f: number,
) {
  const fn = DRAWERS[idx % DRAWERS.length];
  if (fn) fn(ctx, opts, f);
}
