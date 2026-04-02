'use client';
import { useRef, useEffect, useCallback } from 'react';
import type { GameState, BoulderingSave } from './bouldering/types';
import { loadSave, writeSave } from './bouldering/storage';
import { generateRoute, routeSeed, gripMax as gradeGripMax, CW, CH } from './bouldering/routes';
import { commitMove, nudgeAim, reachableHolds } from './bouldering/physics';
import { aimConfig } from './bouldering/physics';
import { useGameLoop } from './bouldering/useGameLoop';

const CONFETTI = ['#C0281C', '#C8922A', '#2D6A4F', '#1D6FA4', '#FDF5E4'];

function spawnConfetti(state: GameState) {
  state.particles = Array.from({ length: 28 }, () => ({
    x: state.climber.x + (Math.random() - 0.5) * 20,
    y: state.climber.y - 16,
    vx: (Math.random() - 0.5) * 260,
    vy: -Math.random() * 320 - 80,
    color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    life: 1,
  }));
}

function makeState(grade: number, routeIndex: number, prevAttempts = 0): GameState {
  const holds = generateRoute(grade, routeSeed(grade, routeIndex));
  const start = holds.find(h => h.isStart) ?? holds[0];
  const cfg   = aimConfig(grade);
  const gMax  = gradeGripMax(grade);

  return {
    phase: 'playing',
    holds,
    climber: {
      holdId: start.id,
      x: start.x, y: start.y,
      targetX: start.x, targetY: start.y,
      frame: 0, frameTimer: 0,
      direction: 'right',
    },
    aimAngle: 0,
    aimSpeed: cfg.speed,
    litHoldId: null,
    hitWindow: cfg.hitWindow,
    gripTimer: gMax,
    gripMax: gMax,
    latchTimer: 0,
    sendTimer: 0,
    fallTimer: 0,
    unlockTimer: 0,
    badPressFlash: 0,
    particles: [],
    attempts: prevAttempts,
    sendTimeStart: performance.now(),
    grade,
    routeIndex,
  };
}

export default function BoulderingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const saveRef   = useRef<BoulderingSave>(loadSave());
  const stateRef  = useRef<GameState>(makeState(saveRef.current.currentGrade, 0));

  const triggerSend = useCallback((state: GameState) => {
    state.phase = 'sending';
    state.sendTimer = 2.0;
    state.climber.frame = 2;
    spawnConfetti(state);
  }, []);

  const handleFall = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'falling') return;
    const save = saveRef.current;
    save.totalAttempts++;
    writeSave(save);

    // Reset route from start
    const start = s.holds.find(h => h.isStart) ?? s.holds[0];
    const gMax  = gradeGripMax(s.grade);
    s.climber.holdId  = start.id;
    s.climber.targetX = start.x;
    s.climber.targetY = start.y;
    s.gripTimer = gMax;
    s.gripMax   = gMax;
    s.litHoldId = null;
    s.attempts++;
    s.sendTimeStart = performance.now();
    s.phase = 'playing';
  }, []);

  const handleSend = useCallback(() => {
    const s    = stateRef.current;
    const save = saveRef.current;

    const elapsed = performance.now() - s.sendTimeStart;
    const prev = save.bestTimes[s.grade];
    if (prev === null || elapsed < prev) save.bestTimes[s.grade] = elapsed;
    save.totalSends++;
    save.sendsPerGrade[s.grade] = (save.sendsPerGrade[s.grade] ?? 0) + 1;

    const sendsOnGrade = save.sendsPerGrade[s.grade];

    if (sendsOnGrade >= 3 && s.grade < 4) {
      const nextGrade = s.grade + 1;
      save.currentGrade = nextGrade;
      writeSave(save);
      const ns = makeState(nextGrade, 0, s.attempts);
      ns.phase = 'unlocking';
      ns.unlockTimer = 1.5;
      stateRef.current = ns;
    } else {
      writeSave(save);
      stateRef.current = makeState(s.grade, (s.routeIndex + 1) % 3, s.attempts);
    }
  }, []);

  // Keyboard input
  useEffect(() => {
    const NUDGE_DIRS = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
    } as const;

    function onKey(e: KeyboardEvent) {
      const state = stateRef.current;

      if (e.key === 'r' || e.key === 'R') {
        // Restart
        if (state.phase === 'playing' || state.phase === 'latching' || state.phase === 'falling') {
          const start = state.holds.find(h => h.isStart) ?? state.holds[0];
          const gMax  = gradeGripMax(state.grade);
          state.climber.holdId  = start.id;
          state.climber.targetX = start.x;
          state.climber.targetY = start.y;
          state.gripTimer = gMax;
          state.gripMax   = gMax;
          state.litHoldId = null;
          state.badPressFlash = 0;
          state.attempts++;
          state.sendTimeStart = performance.now();
          state.phase = 'playing';
          state.fallTimer = 0;
        }
        return;
      }

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (state.phase !== 'playing') return;
        commitMove(state);
        // Check if we landed on top hold
        const curHold = state.holds[state.climber.holdId];
        if (curHold?.isTop) triggerSend(state);
        return;
      }

      const dir = NUDGE_DIRS[e.key as keyof typeof NUDGE_DIRS];
      if (dir) {
        e.preventDefault();
        if (state.phase !== 'playing') return;
        nudgeAim(state, dir);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerSend]);

  // Mobile tap: find closest reachable hold to tap, attempt commit at that angle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouch(e: TouchEvent) {
      const state = stateRef.current;
      if (state.phase !== 'playing') return;
      e.preventDefault();

      const rect  = canvas!.getBoundingClientRect();
      const scaleX = CW / rect.width;
      const scaleY = CH / rect.height;
      const touch  = e.changedTouches[0];
      const tx = (touch.clientX - rect.left) * scaleX;
      const ty = (touch.clientY - rect.top)  * scaleY;

      // Find closest reachable hold to tap
      const reachable = reachableHolds(state);
      let best: number | null = null;
      let bestDist = Infinity;
      for (const id of reachable) {
        const h = state.holds[id];
        const d = Math.hypot(h.x - tx, h.y - ty);
        if (d < bestDist && d < 60) { // 60px tap tolerance
          bestDist = d;
          best = id;
        }
      }

      if (best !== null) {
        // Snap aim to this hold and commit instantly on mobile
        const cur = state.holds[state.climber.holdId];
        const h   = state.holds[best];
        state.aimAngle = Math.atan2(-(h.y - cur.y), h.x - cur.x);
        if (state.aimAngle < 0) state.aimAngle += Math.PI * 2;
        state.litHoldId = best;
        commitMove(state);
        const curHold = state.holds[state.climber.holdId];
        if (curHold?.isTop) triggerSend(state);
      }
    }

    canvas.addEventListener('touchend', onTouch, { passive: false });
    return () => canvas.removeEventListener('touchend', onTouch);
  }, [triggerSend]);

  useGameLoop({ canvasRef, stateRef, saveRef, onSend: handleSend, onFall: handleFall });

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{
          width: '100%',
          imageRendering: 'pixelated',
          borderRadius: '8px',
          border: '2.5px solid var(--ink, #1A0A05)',
          boxShadow: '4px 4px 0 var(--ink, #1A0A05)',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      <MobileDpad
        onCommit={() => {
          const state = stateRef.current;
          if (state.phase !== 'playing') return;
          commitMove(state);
          const h = state.holds[state.climber.holdId];
          if (h?.isTop) triggerSend(state);
        }}
        onNudge={(dir) => {
          const state = stateRef.current;
          if (state.phase === 'playing') nudgeAim(state, dir);
        }}
        onRestart={() => {
          const state = stateRef.current;
          if (state.phase !== 'playing' && state.phase !== 'latching') return;
          const start = state.holds.find(h => h.isStart) ?? state.holds[0];
          const gMax  = gradeGripMax(state.grade);
          state.climber.holdId  = start.id;
          state.climber.targetX = start.x;
          state.climber.targetY = start.y;
          state.gripTimer = gMax;
          state.litHoldId = null;
          state.attempts++;
          state.phase = 'playing';
        }}
      />
    </div>
  );
}

// ── Mobile controls ───────────────────────────────────────────────────────────
type Dir = 'left' | 'right' | 'up' | 'down';

function Btn({
  label, style, onPress,
}: {
  label: string;
  style: React.CSSProperties;
  onPress: () => void;
}) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); onPress(); }}
      style={{
        position: 'absolute',
        width: '38px', height: '38px',
        background: 'rgba(253,245,228,0.88)',
        border: '2px solid rgba(20,10,5,0.28)',
        borderRadius: '6px',
        boxShadow: '2px 2px 0 rgba(20,10,5,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none', userSelect: 'none',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

function MobileDpad({
  onCommit, onNudge, onRestart,
}: {
  onCommit: () => void;
  onNudge: (dir: Dir) => void;
  onRestart: () => void;
}) {
  return (
    <div
      className="mobile-only"
      style={{ position: 'absolute', bottom: '64px', right: '6px', width: '128px', height: '168px' }}
    >
      {/* Nudge arrows */}
      <Btn label="▲" style={{ top: 0, left: '45px' }}    onPress={() => onNudge('up')} />
      <Btn label="◀" style={{ top: '44px', left: 0 }}    onPress={() => onNudge('left')} />
      <Btn label="▶" style={{ top: '44px', right: 0 }}   onPress={() => onNudge('right')} />
      <Btn label="▼" style={{ top: '88px', left: '45px' }} onPress={() => onNudge('down')} />

      {/* GRAB — centre, commit the sweep */}
      <button
        onPointerDown={e => { e.preventDefault(); onCommit(); }}
        style={{
          position: 'absolute', top: '44px', left: '45px',
          width: '38px', height: '38px',
          background: '#C0281C', color: 'white',
          border: '2px solid rgba(20,10,5,0.4)', borderRadius: '50%',
          boxShadow: '2px 2px 0 rgba(20,10,5,0.3)',
          fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none', userSelect: 'none',
        }}
      >GRAB</button>

      {/* Restart */}
      <Btn label="R" style={{ bottom: 0, right: 0, fontSize: '11px', fontWeight: 700 }}
        onPress={onRestart} />
    </div>
  );
}
