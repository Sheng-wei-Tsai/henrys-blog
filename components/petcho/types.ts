export type AnimationState = 'idle' | 'pet' | 'happy' | 'eat' | 'hungry' | 'sleep';

export type PetPersonality = 'lazy' | 'energetic' | 'curious' | 'grumpy';

export interface PetState {
  name: string;
  level: number;           // 1–5
  xp: number;
  hunger: number;          // 0–100
  happiness: number;       // 0–100
  streak: number;          // consecutive daily visits
  lastVisitDay: string;    // 'YYYY-MM-DD'
  lastVisit: number;       // timestamp ms
  totalPets: number;       // lifetime petting count
  personality: PetPersonality;
  color: number;           // creature index 0–7 (used at level 2+)
  evolutionSpecies: string | null; // CreatureId or null (still robot)
}

export const DEFAULT_PET: PetState = {
  name: 'Buddy',
  level: 1,
  xp: 0,
  hunger: 80,
  happiness: 80,
  streak: 0,
  lastVisitDay: '',
  lastVisit: Date.now(),
  totalPets: 0,
  personality: 'curious',
  color: 0,
  evolutionSpecies: null,
};

export const XP_PER_LEVEL = [0, 100, 300, 600, 1000];

export const LEVEL_NAMES = ['', 'Hatchling', 'Juvenile', 'Adult', 'Elder', 'Legend'];
