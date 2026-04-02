import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { GameState, BoulderingSave } from './types';
import { draw } from './renderer';
import { tickAim, tickClimber, tickGrip, tickParticles } from './physics';

interface Options {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stateRef:  RefObject<GameState>;
  saveRef:   RefObject<BoulderingSave>;
  onSend:    () => void;
  onFall:    () => void;
}

export function useGameLoop({ canvasRef, stateRef, saveRef, onSend, onFall }: Options) {
  const prevTimeRef = useRef<number>(0);
  const pausedRef   = useRef(false);

  useEffect(() => {
    function onVisibility() { pausedRef.current = document.hidden; }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    let rafId: number;

    function loop(now: number) {
      rafId = requestAnimationFrame(loop);

      if (pausedRef.current) { prevTimeRef.current = now; return; }

      const dt = Math.min((now - (prevTimeRef.current || now)) / 1000, 0.1);
      prevTimeRef.current = now;

      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Decay feedback flash
      if (state.badPressFlash > 0) state.badPressFlash -= dt;

      switch (state.phase) {
        case 'playing':
          tickAim(state, dt);
          tickClimber(state, dt);
          if (tickGrip(state, dt)) {
            state.phase = 'falling';
            state.fallTimer = 0.4;
          }
          break;

        case 'latching':
          tickClimber(state, dt);
          state.latchTimer -= dt;
          if (state.latchTimer <= 0) {
            state.phase = 'playing';
          }
          break;

        case 'sending':
          tickClimber(state, dt);
          tickParticles(state, dt);
          state.sendTimer -= dt;
          if (state.sendTimer <= 0) onSend();
          break;

        case 'falling':
          state.fallTimer -= dt;
          if (state.fallTimer <= 0) onFall();
          break;

        case 'unlocking':
          tickParticles(state, dt);
          state.unlockTimer -= dt;
          if (state.unlockTimer <= 0) state.phase = 'playing';
          break;
      }

      draw(canvas, state, saveRef.current.bestTimes[state.grade] ?? null);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [canvasRef, stateRef, saveRef, onSend, onFall]);
}
