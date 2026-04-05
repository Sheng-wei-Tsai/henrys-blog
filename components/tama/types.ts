export type LifeStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'old' | 'angel';

export type SpeciesId =
  | 'egg' | 'blob' | 'joey'
  | 'quokka_teen' | 'wallaby_teen' | 'casso_teen'
  | 'quokka' | 'platypus' | 'kookaburra' | 'wombat' | 'possum' | 'thylacine'
  | 'elder' | 'angel';

export type MenuIcon = 'food' | 'light' | 'game' | 'medicine' | 'toilet' | 'status' | 'discipline' | 'call';

export const MENU_ICONS: MenuIcon[] = [
  'food', 'light', 'game', 'medicine', 'toilet', 'status', 'discipline', 'call',
];

export type AnimState =
  | 'idle' | 'happy' | 'eating' | 'sleeping' | 'sick'
  | 'pooping' | 'attention' | 'dead'
  | 'game_prompt' | 'game_result_win' | 'game_result_lose';

export interface TamaState {
  name:          string;
  stage:         LifeStage;
  species:       SpeciesId;
  ageMs:         number;
  weight:        number;       // oz 5–99
  hunger:        number;       // 0–4 hearts
  happiness:     number;       // 0–4 hearts
  discipline:    number;       // 0–100
  poopCount:     number;       // 0–3
  poopTimerMs:   number;
  sick:          boolean;
  medicineGiven: number;       // doses this sickness (needs 2)
  sleeping:      boolean;
  xp:            number;       // lifetime XP from posts
  postsRead:     number;       // lifetime posts fed
  careScore:     number;       // 0–100 running avg
  totalPets:     number;
  lastTick:      number;       // Date.now()
  lastEvolveAt:  number;       // Date.now() at last stage change
  callPending:   boolean;
  callIsReal:    boolean;      // true = real need, false = misbehaving
  nextCallMs:    number;       // countdown (ms) until next attention call
  muted:         boolean;
}

export const DEFAULT_TAMA: TamaState = {
  name:          'Buddy',
  stage:         'egg',
  species:       'egg',
  ageMs:         0,
  weight:        10,
  hunger:        4,
  happiness:     4,
  discipline:    50,
  poopCount:     0,
  poopTimerMs:   0,
  sick:          false,
  medicineGiven: 0,
  sleeping:      false,
  xp:            0,
  postsRead:     0,
  careScore:     80,
  totalPets:     0,
  lastTick:      0,
  lastEvolveAt:  0,
  callPending:   false,
  callIsReal:    true,
  nextCallMs:    90 * 60_000,  // 90 min first call
  muted:         false,
};

export const STAGE_LABEL: Record<LifeStage, string> = {
  egg: 'Egg', baby: 'Baby', child: 'Child', teen: 'Teen',
  adult: 'Adult', old: 'Senior', angel: 'Angel',
};

export const SPECIES_NAME: Record<SpeciesId, string> = {
  egg: 'Egg', blob: 'Blobby', joey: 'Little Joey',
  quokka_teen: 'Quokka Jr.', wallaby_teen: 'Wallaby Jr.', casso_teen: 'Cassowary Jr.',
  quokka: 'Quokka', platypus: 'Platypus',
  kookaburra: 'Kookaburra', wombat: 'Wombat',
  possum: 'Possum', thylacine: '† Thylacine',
  elder: 'Wise Elder', angel: 'Angel',
};

// Posts-read gates for evolution eligibility
export const POSTS_GATE: Partial<Record<LifeStage, number>> = {
  teen:  3,
  adult: 10,
};

// Minimum time at each stage before evolution check
export const TIME_GATE_MS: Partial<Record<LifeStage, number>> = {
  egg:   5  * 60_000,
  baby:  10 * 60_000,
  child: 60 * 60_000,
  teen:  24 * 60 * 60_000,
  adult: 5  * 24 * 60 * 60_000,
};
