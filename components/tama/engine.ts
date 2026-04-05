import {
  TamaState, LifeStage, SpeciesId, DEFAULT_TAMA,
  POSTS_GATE, TIME_GATE_MS,
} from './types';

const HOUR = 3_600_000;

// ─── Tick ──────────────────────────────────────────────────────────────────────
/** Apply offline decay based on real elapsed time. Call every second in-tab. */
export function tick(state: TamaState, now: number): TamaState {
  const dt  = Math.max(0, Math.min(now - state.lastTick, 12 * HOUR));
  const hrs = dt / HOUR;

  let {
    hunger, happiness, weight,
    poopCount, poopTimerMs,
    sick, medicineGiven,
    careScore, nextCallMs, ageMs,
    callPending, callIsReal,
  } = state;

  const alive  = state.stage !== 'egg' && state.stage !== 'angel';
  const active = alive && !state.sleeping;

  if (active) {
    hunger       = Math.max(0, hunger    - hrs * 2);       // -1 heart / 30 min
    happiness    = Math.max(0, happiness - hrs * 0.5);     // -1 heart / 2 hrs
    weight       = Math.max(5, weight    - hrs * 0.25);

    poopTimerMs += dt;
    while (poopTimerMs >= 3 * HOUR && poopCount < 3) {
      poopCount++;
      poopTimerMs -= 3 * HOUR;
    }

    if ((poopCount >= 3 || hunger === 0) && !sick) {
      sick          = true;
      medicineGiven = 0;
    }

    nextCallMs = Math.max(0, nextCallMs - dt);
    if (nextCallMs === 0 && !callPending) {
      callPending = true;
      callIsReal  = Math.random() > 0.3;
      nextCallMs  = (60 + Math.random() * 120) * 60_000; // 1–3 hrs until next
    }

    const c   = ((hunger / 4) + (happiness / 4)) / 2 * 100;
    careScore = careScore * 0.99 + c * 0.01;
  }

  if (alive) ageMs += dt;

  return {
    ...state,
    hunger, happiness, weight,
    poopCount, poopTimerMs,
    sick, medicineGiven,
    careScore, nextCallMs, ageMs,
    callPending, callIsReal,
    lastTick: now,
  };
}

// ─── Evolution ─────────────────────────────────────────────────────────────────
export function canEvolve(state: TamaState, now: number): boolean {
  if (state.stage === 'old' || state.stage === 'angel') return false;
  const timeGate = TIME_GATE_MS[state.stage];
  if (timeGate === undefined) return false;
  if (now - state.lastEvolveAt < timeGate) return false;

  const postsGate = POSTS_GATE[state.stage] ?? 0;
  return state.postsRead >= postsGate;
}

export function evolve(state: TamaState, now: number): TamaState {
  const nextStage = advanceStage(state.stage);
  const species   = pickSpecies(nextStage, state.careScore, state.postsRead, state.discipline);
  return {
    ...state,
    stage:        nextStage,
    species,
    lastEvolveAt: now,
    hunger:       Math.min(4, state.hunger + 2),
    happiness:    Math.min(4, state.happiness + 1),
    sick:         false,
    poopCount:    0,
    poopTimerMs:  0,
    callPending:  false,
  };
}

function advanceStage(s: LifeStage): LifeStage {
  const order: LifeStage[] = ['egg', 'baby', 'child', 'teen', 'adult', 'old'];
  const i = order.indexOf(s);
  return order[Math.min(i + 1, order.length - 1)];
}

function pickSpecies(
  stage: LifeStage,
  care: number,
  posts: number,
  disc: number,
): SpeciesId {
  switch (stage) {
    case 'baby':  return 'blob';
    case 'child': return 'joey';
    case 'teen':
      if (disc >= 60 && care >= 70) return 'quokka_teen';
      if (care >= 50)               return 'wallaby_teen';
      return 'casso_teen';
    case 'adult':
      if (care >= 85 && posts >= 15) return 'quokka';
      if (care >= 75 && posts >= 12) return 'platypus';
      if (care >= 65)                return 'kookaburra';
      if (care >= 50)                return 'wombat';
      if (disc < 30 && Math.random() < 0.5) return 'thylacine';
      return 'possum';
    case 'old':   return 'elder';
    case 'angel': return 'angel';
    default:      return 'blob';
  }
}

// ─── Death check ───────────────────────────────────────────────────────────────
export function isDying(state: TamaState): boolean {
  return (
    state.stage !== 'egg' &&
    state.stage !== 'angel' &&
    state.hunger === 0 &&
    state.sick &&
    state.medicineGiven === 0 &&
    state.poopCount >= 3
  );
}

export function die(state: TamaState): TamaState {
  return {
    ...DEFAULT_TAMA,
    name:         state.name,
    stage:        'angel',
    species:      'angel',
    postsRead:    state.postsRead, // keep lifetime records
    xp:           state.xp,
    totalPets:    state.totalPets,
    lastTick:     Date.now(),
    lastEvolveAt: Date.now(),
  };
}

// ─── Actions ───────────────────────────────────────────────────────────────────
export function feedMeal(state: TamaState): TamaState {
  if (state.sleeping || state.stage === 'egg') return state;
  return {
    ...state,
    hunger: Math.min(4, state.hunger + 2),
    weight: Math.min(99, state.weight + 1),
  };
}

export function feedSnack(state: TamaState): TamaState {
  if (state.sleeping || state.stage === 'egg') return state;
  return {
    ...state,
    happiness: Math.min(4, state.happiness + 1),
    weight:    Math.min(99, state.weight + 2),
  };
}

/** Called from blog FeedButton — primary XP source */
export function feedPost(state: TamaState, nutrition: number, isNewPost: boolean): TamaState {
  const xpGain    = isNewPost ? nutrition : Math.floor(nutrition / 2);
  const hungerGain = isNewPost ? Math.min(2, nutrition) : 1;
  return {
    ...state,
    hunger:    Math.min(4, state.hunger + hungerGain),
    happiness: Math.min(4, state.happiness + (isNewPost ? 0.5 : 0)),
    xp:        state.xp + xpGain,
    postsRead: isNewPost ? state.postsRead + 1 : state.postsRead,
  };
}

export function toggleLight(state: TamaState): TamaState {
  return { ...state, sleeping: !state.sleeping };
}

export function administerMedicine(state: TamaState): TamaState {
  if (!state.sick) return state;
  const medicineGiven = state.medicineGiven + 1;
  return { ...state, medicineGiven, sick: medicineGiven < 2 };
}

export function cleanToilet(state: TamaState): TamaState {
  return { ...state, poopCount: 0, poopTimerMs: 0 };
}

export function discipline(state: TamaState): TamaState {
  if (!state.callPending) return state;
  const delta = state.callIsReal ? -5 : 10; // disciplining real call = mistake
  return {
    ...state,
    discipline:  Math.max(0, Math.min(100, state.discipline + delta)),
    callPending: false,
  };
}

export function answerCall(state: TamaState): TamaState {
  if (!state.callPending) return state;
  const delta     = state.callIsReal ? 0 : -5;
  const happiness = state.callIsReal
    ? Math.min(4, state.happiness + 0.5)
    : state.happiness;
  return {
    ...state,
    discipline:  Math.max(0, Math.min(100, state.discipline + delta)),
    happiness,
    callPending: false,
  };
}

export function petThePet(state: TamaState): TamaState {
  if (state.sleeping || state.stage === 'egg') return state;
  return {
    ...state,
    happiness: Math.min(4, state.happiness + 0.2),
    totalPets: state.totalPets + 1,
  };
}

export function applyGameResult(state: TamaState, won: boolean): TamaState {
  return {
    ...state,
    happiness: won
      ? Math.min(4, state.happiness + 1)
      : Math.max(0, state.happiness - 0.25),
  };
}
