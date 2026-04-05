'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PetState, DEFAULT_PET, XP_PER_LEVEL } from './types';
import { rollCreature, getCreatureIdx } from './evolution';

const STORAGE_KEY = 'petcho_pet';
// Decay 4× faster than before — depletes in ~20h instead of 100h
const HUNGER_DECAY_PER_HOUR    = 4;
const HAPPINESS_DECAY_PER_HOUR = 2;
const VISIT_HAPPINESS_BONUS    = 8;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(pet: PetState): number {
  const today          = todayStr();
  const lastStr        = pet.lastVisitDay ?? '';
  const currentStreak  = pet.streak ?? 0;

  if (!lastStr) return 1;
  if (lastStr === today) return currentStreak;

  const daysDiff = Math.round(
    (new Date(today).getTime() - new Date(lastStr).getTime()) / 86_400_000,
  );
  return daysDiff === 1 ? currentStreak + 1 : 1; // +1 consecutive, or reset
}

function loadPet(): PetState {
  if (typeof window === 'undefined') return DEFAULT_PET;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PET, lastVisit: Date.now() };
    return JSON.parse(raw) as PetState;
  } catch {
    return { ...DEFAULT_PET, lastVisit: Date.now() };
  }
}

function applyDecay(pet: PetState): PetState {
  const now        = Date.now();
  const hoursAway  = (now - pet.lastVisit) / 3_600_000;
  const hunger     = Math.max(0, pet.hunger    - hoursAway * HUNGER_DECAY_PER_HOUR);
  const happiness  = Math.max(
    0,
    Math.min(100, pet.happiness - hoursAway * HAPPINESS_DECAY_PER_HOUR + VISIT_HAPPINESS_BONUS),
  );
  const today   = todayStr();
  const streak  = computeStreak(pet);
  // Reward consecutive-day bonus XP
  const streakBonus = streak > (pet.streak ?? 0) ? streak * 3 : 0;
  const xp      = (pet.xp ?? 0) + streakBonus;
  return { ...pet, hunger, happiness, lastVisit: now, lastVisitDay: today, streak, xp };
}

function computeLevel(xp: number): number {
  let level = 1;
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]) { level = i + 1; break; }
  }
  return Math.min(level, 5);
}

/** When level increases, roll a new creature for that tier and return updated fields */
function applyEvolution(
  prev: PetState,
  newLevel: number,
): Pick<PetState, 'evolutionSpecies' | 'color'> {
  if (newLevel <= 1 || newLevel <= (prev.level ?? 1)) {
    return { evolutionSpecies: prev.evolutionSpecies ?? null, color: prev.color };
  }
  const speciesId = rollCreature(newLevel, prev.evolutionSpecies ?? undefined);
  const idx       = getCreatureIdx(speciesId);
  return { evolutionSpecies: speciesId, color: idx };
}

export function usePetcho() {
  const [pet, setPet]   = useState<PetState>(DEFAULT_PET);
  const [ready, setReady] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const rapidPetCount   = useRef(0);
  const rapidPetTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load and apply offline decay on mount
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      setIsNew(true);
      setReady(true);
      return;
    }
    const loaded  = loadPet();
    const decayed = applyDecay(loaded);
    setPet(decayed);
    setReady(true);
  }, []);

  // Persist every state change
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pet)); } catch {}
  }, [pet, ready]);

  // Live decay ticker — runs every 5 min while tab is open
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setPet(prev => {
        const hunger    = Math.max(0, prev.hunger    - HUNGER_DECAY_PER_HOUR    / 12);
        const happiness = Math.max(0, prev.happiness - HAPPINESS_DECAY_PER_HOUR / 12);
        return { ...prev, hunger, happiness };
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready]);

  // Pet interaction — rapid clicks trigger happy burst
  const petTheLizard = useCallback((): 'pet' | 'happy' => {
    rapidPetCount.current += 1;
    if (rapidPetTimer.current) clearTimeout(rapidPetTimer.current);
    rapidPetTimer.current = setTimeout(() => { rapidPetCount.current = 0; }, 1500);

    const isHappy = rapidPetCount.current >= 5;
    if (isHappy) rapidPetCount.current = 0;

    setPet(prev => {
      const happiness  = Math.min(100, prev.happiness + (isHappy ? 12 : 3));
      const xp         = (prev.xp ?? 0) + (isHappy ? 5 : 1);
      const level      = computeLevel(xp);
      const totalPets  = prev.totalPets + 1;
      const evo        = applyEvolution(prev, level);
      return { ...prev, happiness, xp, level, totalPets, ...evo };
    });

    return isHappy ? 'happy' : 'pet';
  }, []);

  // Play — big happiness boost, no food
  const playWithBuddy = useCallback((): 'happy' => {
    setPet(prev => {
      const happiness = Math.min(100, prev.happiness + 15);
      const xp        = (prev.xp ?? 0) + 8;
      const level     = computeLevel(xp);
      const evo       = applyEvolution(prev, level);
      return { ...prev, happiness, xp, level, ...evo };
    });
    return 'happy';
  }, []);

  const feedPost = useCallback((nutrition: number) => {
    setPet(prev => {
      const hunger    = Math.min(100, prev.hunger + nutrition);
      const happiness = Math.min(100, prev.happiness + 5);
      const xp        = (prev.xp ?? 0) + nutrition;
      const level     = computeLevel(xp);
      const evo       = applyEvolution(prev, level);
      return { ...prev, hunger, happiness, xp, level, ...evo };
    });
  }, []);

  const rename = useCallback((name: string) => {
    setPet(prev => ({ ...prev, name: name.slice(0, 16) }));
  }, []);

  const initPet = useCallback((initial: PetState) => {
    const today    = todayStr();
    const withMeta = { ...initial, lastVisitDay: today, streak: 1 };
    setPet(withMeta);
    setIsNew(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(withMeta)); } catch {}
  }, []);

  return { pet, ready, isNew, petTheLizard, playWithBuddy, feedPost, rename, initPet };
}
