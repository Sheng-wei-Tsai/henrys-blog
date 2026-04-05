'use client';

import { useRef, useEffect } from 'react';
import { TamaState, AnimState } from './types';
import { drawScene, DrawParams, GameDrawState, LCD } from './sprites';

interface Props {
  state:        TamaState;
  anim:         AnimState;
  selectedMenu: number;
  showStatus:   boolean;
  gameState?:   GameDrawState;
  message?:     string;
}

export default function TamaScreen({ state, anim, selectedMenu, showStatus, gameState, message }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const rafRef    = useRef<number>(0);

  // Keep a ref to latest props so the rAF loop always sees current values
  const propsRef  = useRef<Props>({ state, anim, selectedMenu, showStatus, gameState, message });
  propsRef.current = { state, anim, selectedMenu, showStatus, gameState, message };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let lastTime = 0;

    const loop = (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (time - lastTime < 33) return; // cap at ~30fps
      lastTime = time;

      frameRef.current = (frameRef.current + 1) % 3600;

      const p = propsRef.current;
      const params: DrawParams = {
        state:        p.state,
        anim:         p.anim,
        frame:        frameRef.current,
        selectedMenu: p.selectedMenu,
        showStatus:   p.showStatus,
        gameState:    p.gameState,
        message:      p.message,
      };
      drawScene(ctx, params);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      style={{
        width:           '100%',
        imageRendering:  'pixelated',
        display:         'block',
        background:      LCD.bg,
      }}
    />
  );
}
