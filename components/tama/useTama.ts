'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TamaState, DEFAULT_TAMA } from './types';
import {
  tick, canEvolve, evolve, isDying, die,
  feedMeal, feedSnack, feedPost, toggleLight,
  administerMedicine, cleanToilet, discipline,
  answerCall, petThePet, applyGameResult,
} from './engine';
import { TamaAudio } from './sounds';

export const STORAGE_KEY  = 'tama_pet';
export const FED_KEY      = 'tama_fed';

function loadState(): TamaState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TamaState) : null;
  } catch { return null; }
}

function saveState(s: TamaState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function useTama() {
  const [pet, setPetRaw]    = useState<TamaState>({ ...DEFAULT_TAMA, lastTick: Date.now(), lastEvolveAt: Date.now() });
  const [ready, setReady]   = useState(false);
  const [isNew, setIsNew]   = useState(false);
  const [evolved, setEvolved] = useState<string | null>(null); // species name on evolution

  // Update + persist atomically
  const setPet = useCallback((updater: (p: TamaState) => TamaState) => {
    setPetRaw(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // ── Hydrate on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = loadState();
    if (!saved) {
      setIsNew(true);
      setReady(true);
      return;
    }
    const now     = Date.now();
    const decayed = tick(saved, now);
    setPetRaw(decayed);
    saveState(decayed);
    setReady(true);
  }, []);

  // ── Listen for feed events from blog posts ────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue) as TamaState;
          setPetRaw(updated);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [ready]);

  // ── Tick every second ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setPet(prev => {
        const now  = Date.now();
        let next   = tick(prev, now);

        // Check for evolution
        if (canEvolve(next, now)) {
          const evolvd = evolve(next, now);
          setEvolved(evolvd.species);
          TamaAudio.play('evolve');
          return evolvd;
        }

        // Check for death
        if (isDying(next)) {
          TamaAudio.play('die');
          return die(next);
        }

        // Alert on call
        if (next.callPending && !prev.callPending) {
          TamaAudio.play('call');
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ready, setPet]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const doFeedMeal = useCallback(() => {
    TamaAudio.play('eat');
    setPet(feedMeal);
  }, [setPet]);

  const doFeedSnack = useCallback(() => {
    TamaAudio.play('eat');
    setPet(feedSnack);
  }, [setPet]);

  const doToggleLight = useCallback(() => {
    TamaAudio.play('btn');
    setPet(toggleLight);
  }, [setPet]);

  const doMedicine = useCallback(() => {
    TamaAudio.play('btn');
    setPet(administerMedicine);
  }, [setPet]);

  const doCleanToilet = useCallback(() => {
    TamaAudio.play('btn');
    setPet(cleanToilet);
  }, [setPet]);

  const doDiscipline = useCallback(() => {
    TamaAudio.play('btn');
    setPet(discipline);
  }, [setPet]);

  const doAnswerCall = useCallback(() => {
    TamaAudio.play('happy');
    setPet(answerCall);
  }, [setPet]);

  const doPet = useCallback(() => {
    TamaAudio.play('happy');
    setPet(petThePet);
  }, [setPet]);

  const doGameResult = useCallback((won: boolean) => {
    TamaAudio.play(won ? 'game_win' : 'game_lose');
    setPet(p => applyGameResult(p, won));
  }, [setPet]);

  const doFeedPost = useCallback((slug: string, nutrition: number) => {
    const fedRaw = typeof window !== 'undefined' ? localStorage.getItem(FED_KEY) : null;
    const fedSet: string[] = fedRaw ? JSON.parse(fedRaw) : [];
    const isNew2 = !fedSet.includes(slug);
    if (isNew2) {
      fedSet.push(slug);
      localStorage.setItem(FED_KEY, JSON.stringify(fedSet));
    }
    TamaAudio.play('feed_post');
    setPet(p => feedPost(p, nutrition, isNew2));
  }, [setPet]);

  const toggleMute = useCallback(() => {
    setPet(p => {
      const muted = !p.muted;
      TamaAudio.setMuted(muted);
      return { ...p, muted };
    });
  }, [setPet]);

  const initPet = useCallback((name: string) => {
    const now  = Date.now();
    const fresh: TamaState = {
      ...DEFAULT_TAMA,
      name,
      lastTick:     now,
      lastEvolveAt: now,
    };
    saveState(fresh);
    setPetRaw(fresh);
    setIsNew(false);
  }, []);

  const dismissEvolved = useCallback(() => setEvolved(null), []);

  return {
    pet, ready, isNew, evolved,
    doFeedMeal, doFeedSnack, doToggleLight, doMedicine,
    doCleanToilet, doDiscipline, doAnswerCall, doPet,
    doGameResult, doFeedPost, toggleMute, initPet, dismissEvolved,
  };
}
