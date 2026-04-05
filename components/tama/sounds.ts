/**
 * TamaAussie sound engine — all sounds synthesised via Web Audio API.
 * No external audio files.
 */

type SoundId =
  | 'btn'
  | 'happy'
  | 'eat'
  | 'evolve'
  | 'call'
  | 'sick'
  | 'die'
  | 'game_win'
  | 'game_lose'
  | 'feed_post';

class TamaSounds {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => null);
    return this.ctx;
  }

  setMuted(v: boolean) { this.muted = v; }

  private beep(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, delay = 0) {
    const ctx = this.getCtx();
    if (!ctx || this.muted) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    } catch {}
  }

  play(id: SoundId) {
    if (this.muted) return;
    switch (id) {
      case 'btn':
        this.beep(800, 0.05, 'square', 0.2);
        break;
      case 'happy':
        this.beep(523, 0.08, 'square', 0.3, 0);
        this.beep(659, 0.08, 'square', 0.3, 0.09);
        this.beep(784, 0.12, 'square', 0.3, 0.18);
        break;
      case 'eat':
        this.beep(400, 0.06, 'square', 0.25, 0);
        this.beep(300, 0.06, 'square', 0.2,  0.07);
        break;
      case 'evolve':
        [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => {
          this.beep(f, 0.1, 'square', 0.35, i * 0.1);
        });
        break;
      case 'call':
        this.beep(880, 0.1, 'square', 0.3, 0);
        this.beep(880, 0.1, 'square', 0.3, 0.2);
        this.beep(880, 0.1, 'square', 0.3, 0.4);
        break;
      case 'sick':
        this.beep(300, 0.15, 'sawtooth', 0.25, 0);
        this.beep(250, 0.15, 'sawtooth', 0.25, 0.2);
        break;
      case 'die':
        [400, 350, 300, 250].forEach((f, i) => {
          this.beep(f, 0.25, 'sine', 0.3, i * 0.3);
        });
        break;
      case 'game_win':
        this.beep(659, 0.07, 'square', 0.3, 0);
        this.beep(784, 0.07, 'square', 0.3, 0.08);
        this.beep(988, 0.12, 'square', 0.35, 0.16);
        break;
      case 'game_lose':
        this.beep(300, 0.1, 'sawtooth', 0.25, 0);
        this.beep(220, 0.15, 'sawtooth', 0.2,  0.12);
        break;
      case 'feed_post':
        this.beep(523, 0.08, 'square', 0.25, 0);
        this.beep(659, 0.08, 'square', 0.25, 0.09);
        this.beep(784, 0.08, 'square', 0.25, 0.18);
        this.beep(1047, 0.15, 'square', 0.3, 0.27);
        break;
    }
  }
}

export const TamaAudio = new TamaSounds();
