export type Phase = 'playing' | 'latching' | 'sending' | 'falling' | 'unlocking';

export interface Hold {
  id: number;
  x: number;
  y: number;
  grade: number;
  isRoute: boolean;
  isStart: boolean;
  isTop: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number; // 0–1
}

export interface Climber {
  holdId: number;
  x: number;         // lerp current
  y: number;
  targetX: number;
  targetY: number;
  frame: number;     // sprite frame 0–3
  frameTimer: number;
  direction: 'left' | 'right';
}

export interface GameState {
  phase: Phase;
  holds: Hold[];
  climber: Climber;

  // Aim sweep — the rotating radar line
  aimAngle: number;    // current sweep angle in radians (0 = right, CCW positive)
  aimSpeed: number;    // rad/s — grade-dependent
  litHoldId: number | null; // hold currently highlighted by sweep
  hitWindow: number;   // rad — how wide the highlight window is (grade-dependent)

  // Timers
  gripTimer: number;   // seconds remaining
  gripMax: number;
  latchTimer: number;  // brief animation after landing (0.2s)
  sendTimer: number;
  fallTimer: number;
  unlockTimer: number;

  // Feedback
  badPressFlash: number; // timer for "missed" red flash (0.3s)

  particles: Particle[];
  attempts: number;
  sendTimeStart: number;
  grade: number;
  routeIndex: number;
}

export interface BoulderingSave {
  currentGrade: number;
  sendsPerGrade: number[];
  bestTimes: (number | null)[];
  totalAttempts: number;
  totalSends: number;
  dailySendDate: string;
  dailySendTime: number | null;
}
