// ─── Web Audio synthesis engine ───────────────────────────────────────────────
// All sounds are synthesized — no external audio files needed.

type Ac = AudioContext;

// ─── Creature interaction sounds ──────────────────────────────────────────────

function playQuokka(ctx: Ac, out: AudioNode) {
  // High chirp-click: triangle 1400→1800→1200Hz, 90ms
  const t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(1800, t + 0.04);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.09);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  osc.start(t); osc.stop(t + 0.09);
  // Second chirp
  const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
  o2.connect(g2); g2.connect(out);
  o2.type = 'triangle';
  o2.frequency.setValueAtTime(1600, t + 0.12);
  o2.frequency.exponentialRampToValueAtTime(2000, t + 0.16);
  o2.frequency.exponentialRampToValueAtTime(1400, t + 0.20);
  g2.gain.setValueAtTime(0, t + 0.12);
  g2.gain.linearRampToValueAtTime(0.22, t + 0.13);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
  o2.start(t + 0.12); o2.stop(t + 0.21);
}

function playWombat(ctx: Ac, out: AudioNode) {
  // Low grunt: sawtooth 90→70Hz, 220ms
  const t = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
  gain.gain.setValueAtTime(0.35, t + 0.14);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.start(t); osc.stop(t + 0.23);
}

function playPlatypus(ctx: Ac, out: AudioNode) {
  // Soft purring growl: two detuned sine waves
  const t = ctx.currentTime;
  [65, 72].forEach((freq, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.setValueAtTime(freq * 0.96, t + 0.15);
    osc.frequency.setValueAtTime(freq, t + 0.30);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18 - i * 0.04, t + 0.06);
    gain.gain.setValueAtTime(0.18 - i * 0.04, t + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);
    osc.start(t); osc.stop(t + 0.41);
  });
}

function playKookaburra(ctx: Ac, out: AudioNode) {
  // Iconic laugh: "koo-koo-koo-ka-ka-ka-ka" — 8 burst sequence
  const t = ctx.currentTime;
  const freqs   = [500, 600, 700, 800, 880, 820, 740, 640];
  const durs    = [0.13, 0.13, 0.13, 0.10, 0.10, 0.10, 0.10, 0.10];
  const gaps    = [0.05, 0.05, 0.05, 0.03, 0.03, 0.03, 0.03, 0.03];
  let offset = 0;
  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freqs[i] * 0.85, t + offset);
    osc.frequency.exponentialRampToValueAtTime(freqs[i], t + offset + 0.025);
    gain.gain.setValueAtTime(0, t + offset);
    gain.gain.linearRampToValueAtTime(0.14, t + offset + 0.015);
    gain.gain.setValueAtTime(0.14, t + offset + durs[i] - 0.02);
    gain.gain.linearRampToValueAtTime(0, t + offset + durs[i]);
    osc.start(t + offset); osc.stop(t + offset + durs[i] + 0.01);
    offset += durs[i] + gaps[i];
  }
}

function playSugarGlider(ctx: Ac, out: AudioNode) {
  // Sharp yap/bark: sawtooth 800→350Hz, 130ms
  const t = ctx.currentTime;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(350, t + 0.13);
  gain.gain.setValueAtTime(0.32, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  osc.start(t); osc.stop(t + 0.14);
}

function playEchidna(ctx: Ac, out: AudioNode) {
  // Soft snuffle: filtered noise burst, bandpass ~450Hz
  const t = ctx.currentTime;
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const bp   = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf;
  src.connect(bp); bp.connect(gain); gain.connect(out);
  bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 2;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.04);
  gain.gain.setValueAtTime(0.14, t + 0.16);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  src.start(t);
}

function playTazDevil(ctx: Ac, out: AudioNode) {
  // Screech: sawtooth 280→1400Hz sweep, 650ms, then sharp drop
  const t = ctx.currentTime;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(1400, t + 0.45);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.65);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.40, t + 0.03);
  gain.gain.setValueAtTime(0.40, t + 0.44);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
  osc.start(t); osc.stop(t + 0.66);
}

function playNumbat(ctx: Ac, out: AudioNode) {
  // Soft hiss: high-pass filtered noise, 200ms
  const t = ctx.currentTime;
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const hp   = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf;
  src.connect(hp); hp.connect(gain); gain.connect(out);
  hp.type = 'highpass'; hp.frequency.value = 2200;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
  gain.gain.setValueAtTime(0.18, t + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  src.start(t);
}

// ─── Level-up jingle ──────────────────────────────────────────────────────────
function playLevelUp(ctx: Ac, out: AudioNode) {
  const t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const st = t + i * 0.12;
    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(0.22, st + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.20);
    osc.start(st); osc.stop(st + 0.21);
  });
}

// ─── Ambient habitat soundscapes ──────────────────────────────────────────────
type StopFn = () => void;

function ambientBushland(ctx: Ac, out: AudioNode): StopFn {
  // Cicadas: 6 oscillators ~4100-4500Hz with amplitude LFO
  const nodes: AudioNode[] = [];
  const freqs = [4100, 4200, 4300, 4180, 4380, 4250];
  const lfoRates = [9, 10.5, 8.5, 11, 9.8, 10.2];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    osc.connect(gain); gain.connect(out);
    osc.type = 'sine'; osc.frequency.value = freq;
    lfo.type = 'sine'; lfo.frequency.value = lfoRates[i];
    lfoGain.gain.value = 0.025;
    gain.gain.value = 0.028;
    osc.start(); lfo.start();
    nodes.push(osc, lfo, gain, lfoGain);
  });
  return () => nodes.forEach(n => { try { (n as OscillatorNode).stop?.(); n.disconnect(); } catch {} });
}

function ambientScrubland(ctx: Ac, out: AudioNode): StopFn {
  // Crickets: rapid 3000Hz pulses
  let running = true;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'sine'; osc.frequency.value = 3200;
  gain.gain.value = 0;
  osc.start();
  let frame = 0;
  const tick = () => {
    if (!running) return;
    const on = frame % 16 < 7;
    gain.gain.setTargetAtTime(on ? 0.018 : 0, ctx.currentTime, 0.005);
    frame++;
    setTimeout(tick, 30);
  };
  tick();
  return () => {
    running = false;
    try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch {}
  };
}

function ambientWetland(ctx: Ac, out: AudioNode): StopFn {
  // Frogs: rhythmic low pulses ~160-200Hz
  let running = true;
  const schedule = () => {
    if (!running) return;
    const freq = 160 + Math.random() * 50;
    const delay = 0.6 + Math.random() * 1.0;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out);
    osc.type = 'sine'; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.setValueAtTime(0.12, t + 0.10);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.20);
    setTimeout(schedule, (delay + 0.25) * 1000);
  };
  schedule(); schedule(); schedule(); // three overlapping frogs
  return () => { running = false; };
}

function ambientForest(ctx: Ac, out: AudioNode): StopFn {
  // Wind: filtered noise sweep + occasional bird chirp
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const bp   = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf; src.loop = true;
  src.connect(bp); bp.connect(gain); gain.connect(out);
  bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.5;
  gain.gain.value = 0.06;
  src.start();
  // Occasional bird
  let running = true;
  const chirp = () => {
    if (!running) return;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(out);
    osc.type = 'sine';
    const f = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f * 1.15, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(f * 0.9, ctx.currentTime + 0.10);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(); osc.stop(ctx.currentTime + 0.13);
    setTimeout(chirp, 2000 + Math.random() * 4000);
  };
  setTimeout(chirp, 1500);
  return () => {
    running = false;
    try { src.stop(); src.disconnect(); bp.disconnect(); gain.disconnect(); } catch {}
  };
}

function ambientWoodland(ctx: Ac, out: AudioNode): StopFn {
  // Ominous low hum (for Taz Devil / Numbat)
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(out);
  osc.type = 'sine'; osc.frequency.value = 48;
  gain.gain.value = 0.07;
  osc.start();
  // Distant rustling
  let running = true;
  const rustle = () => {
    if (!running) return;
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    const hp   = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    src.buffer = buf;
    src.connect(hp); hp.connect(g); g.connect(out);
    hp.type = 'highpass'; hp.frequency.value = 1200;
    g.gain.value = 0.04;
    src.start();
    setTimeout(rustle, 2500 + Math.random() * 3000);
  };
  setTimeout(rustle, 2000);
  return () => {
    running = false;
    try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch {}
  };
}

const AMBIENTS: Record<string, (ctx: Ac, out: AudioNode) => StopFn> = {
  bushland:  ambientBushland,
  scrubland: ambientScrubland,
  wetland:   ambientWetland,
  forest:    ambientForest,
  woodland:  ambientWoodland,
};

const SOUNDS: Record<string, (ctx: Ac, out: AudioNode) => void> = {
  quokka:     playQuokka,
  wombat:     playWombat,
  platypus:   playPlatypus,
  kookaburra: playKookaburra,
  sugarGlider:playSugarGlider,
  echidna:    playEchidna,
  tazDevil:   playTazDevil,
  numbat:     playNumbat,
  levelUp:    playLevelUp,
};

// ─── AudioEngine singleton ────────────────────────────────────────────────────
class AudioEngineClass {
  private ctx:          AudioContext | null = null;
  private master:       GainNode    | null = null;
  private stopAmbientFn: StopFn    | null = null;
  private _vol  = 0.4;
  private _mute = false;

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx    = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._mute ? 0 : this._vol;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch { return null; }
  }

  private async resume(): Promise<{ ctx: AudioContext; out: GainNode } | null> {
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return null;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { return null; }
    }
    return { ctx, out: this.master };
  }

  setVolume(v: number) {
    this._vol = Math.max(0, Math.min(1, v));
    if (this.master && !this._mute) this.master.gain.value = this._vol;
  }

  setMuted(m: boolean) {
    this._mute = m;
    if (this.master) this.master.gain.value = m ? 0 : this._vol;
  }

  get muted() { return this._mute; }

  async playSound(id: string): Promise<void> {
    const r = await this.resume();
    if (!r) return;
    SOUNDS[id]?.(r.ctx, r.out);
  }

  async startAmbient(habitat: string): Promise<void> {
    this.stopAmbient();
    const r = await this.resume();
    if (!r) return;
    const fn = AMBIENTS[habitat];
    if (fn) this.stopAmbientFn = fn(r.ctx, r.out);
  }

  stopAmbient() {
    if (this.stopAmbientFn) { this.stopAmbientFn(); this.stopAmbientFn = null; }
  }
}

export const AudioEngine = new AudioEngineClass();
