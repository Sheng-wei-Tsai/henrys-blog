# Feature: Pixel Bouldering Gym — About Page Mini-Game

**Priority:** 🟡 Medium
**Status:** 🔲 Not started
**Branch:** `feature/pixel-bouldering-game`
**Started:** —
**Shipped:** —

---

## Goal

Replace the `<AIUsage />` widget on the About page with a self-contained 2D pixel bouldering gym game. The game is a pure canvas component — no game engine, no new dependencies. It serves as a conversation piece ("wait, there's a game on his portfolio?"), keeps visitors on the page longer, and metaphorically represents the same persistence-and-progression mindset Henry brings to coding. Addictive loop: attempt a route → fall → try again → eventually send it → crave the next grade.

---

## Gameplay — Core Loop

```
Spawn climber at START hold
  → Player reaches for holds using arrow/WASD keys
  → Gravity pulls climber down constantly (must keep moving)
  → Reach the TOP hold = "Send!" (route complete)
  → Fall = restart route from bottom (no punishment, instant retry)
  → Send 3 routes → unlock next grade
  → Leaderboard of best send time per grade (localStorage)
```

### What makes it addictive

| Mechanic | Why it works |
|----------|-------------|
| Instant retry on fall (no loading) | Zero friction to try again |
| "One more attempt" — visible next hold | Always feels reachable |
| Send animation + sound cue | Dopamine hit on success |
| Grade unlock (V0 → V1 → V2 …) | Clear progression ladder |
| Best-time per grade (localStorage) | Self-competition, replay incentive |
| Daily Problem (seeded by date) | Reason to return each day |
| Hidden V-grade Easter Egg route | Discovery reward |

---

## Visual Design — Pixel Bouldering Gym

### Scene layout (fixed 480×520px canvas, scales to container)

```
┌─────────────────────────────────────────┐  ← gym ceiling / top-out ledge
│  🪨 🔵        🟠      🔴   🟢    🔵 🪨 │
│        🟠  🔵      🟠         🔴       │  ← holds (colored by route)
│  🔵        🔴   🟢      🔵      🟠     │
│       🟢       🔵    🔴      🟢  🔵    │
│  🔴  🟠             🔴  🟢      🔴     │
│        🔵  🟠  🔵        🟠  🔵  🟢   │
│  🟢       🔵      🔴  🟠      🔵       │
│                  🧗 ← climber            │  ← start holds (bottom row)
└─────────────────────────────────────────┘
  [Grade: V0]  [Best: 12.4s]  [Attempts: 3]
```

### Pixel art style guide
- **Canvas background:** rice-paper texture (#FDF5E4) with subtle ink-dot halftone pattern (every 8px grid, 1px dots at 10% opacity)
- **Holds:** 8×8px rounded pixel squares, coloured by route:
  - V0 = jade green `#2D6A4F`
  - V1 = sky blue `#1D6FA4`
  - V2 = gold `#C8922A`
  - V3 = vermilion `#C0281C`
  - V4+ = dark ink `#1A0A05` with white dot (secret)
- **Hold active (reachable):** glows with a 2px white outline + pulsing 4px shadow
- **Climber sprite:** 10×16px pixel art figure, 4-frame walk cycle:
  - Frame 0: neutral hang (arms up)
  - Frame 1: reach left
  - Frame 2: reach right
  - Frame 3: feet smear
- **Wall texture:** thin vertical ink lines every 24px (panel seam effect)
- **Top-out:** bell icon pixel art at summit; rings on send
- **Grade badge:** comic-book ink panel bottom-left, bold font `var(--brown-dark)`

### Send celebration
- Full canvas flash (white → transparent, 3 frames)
- Confetti burst: 20 tiny 4×4px squares in vermilion/gold/jade, physics-flung upward
- Text overlay: `"SENT! V0"` in pixel font, 2px ink shadow, fades after 2s
- Climber does a 4-frame victory dance at top

---

## Controls

| Input | Action |
|-------|--------|
| `←` / `A` | Reach left (move to nearest hold on left) |
| `→` / `D` | Reach right (move to nearest hold on right) |
| `↑` / `W` | Reach up (nearest hold above) |
| `↓` / `S` | Down-climb / lower (hold below) |
| `Space` | Dyno — jump to the closest highlighted hold (risky) |
| `R` | Restart current route |
| `N` | Next route (skip, no send recorded) |
| Mobile | Tap on a hold to move toward it (pathfind 1 step at a time) |

### Movement model
- Climber occupies exactly one hold at a time (no free movement)
- On keypress: highlight all holds reachable from current position (within reach radius ~80px)
- If target hold is in direction pressed: animate climber moving to it (200ms lerp)
- If no hold in that direction within reach: climber wobbles (visual feedback, no penalty)
- **Gravity timer:** climber's grip fades over 4 seconds of inaction — animated grip bar under climber. Grip resets on every move. Grip at 0 = fall.

---

## Route Generation

Routes are procedurally generated from a seeded random function so they are:
- Deterministic per grade + date (Daily Problem)
- Always climbable (validated: path must exist from start to top)

### Algorithm
```
1. Divide canvas into 6×8 grid of hold slots (48 slots)
2. For grade V0–V2: generate a "ladder" path (random column zigzag, max 1 hold apart)
3. For V3+: add dead-end holds (decoys) at same density as route holds
4. Mark START holds (bottom row, 2 holds), TOP hold (top row, 1 hold)
5. Validate: BFS from START → TOP exists within reach radius
6. Assign route colour to path holds; decoy holds get random off-route colour
```

### Grade definitions

| Grade | Hold spacing | Decoys | Grip timer | Dyno required |
|-------|-------------|--------|------------|---------------|
| V0 | ≤60px | 0 | 4s | No |
| V1 | ≤75px | 4 | 3.5s | No |
| V2 | ≤90px | 8 | 3s | Maybe |
| V3 | ≤110px | 12 | 2.5s | Yes (1) |
| V4+ | ≤130px | 16 | 2s | Yes (2+) |

---

## Progression & Persistence

All stored in `localStorage` (no Supabase — no auth required, no server cost):

```ts
interface BoulderingSave {
  currentGrade: number;        // 0 = V0
  sendsPerGrade: number[];     // [3, 2, 0, ...] — 3 sends unlocks next
  bestTimes: number[];         // best send time (ms) per grade
  totalAttempts: number;
  totalSends: number;
  dailySendDate: string;       // ISO date of last daily problem send
  dailySendTime: number | null;
}
```

### Unlock flow
- Start at V0. Need **3 sends** (not necessarily fast) to unlock V1.
- Each grade has 3 different route seeds (rotates each send).
- Grade label animates in with an ink-stamp effect on unlock.
- "Daily Problem" is a fixed V2 route seeded by today's date — always available, best time shown with 🗓️ badge.

---

## Component Architecture

```
components/
  BoulderingGame.tsx        ← 'use client', main game component
  bouldering/
    useGameLoop.ts          ← requestAnimationFrame loop, delta time
    renderer.ts             ← all canvas draw calls (pure functions)
    physics.ts              ← gravity timer, reachability, fall detection
    routes.ts               ← seeded route generator + BFS validator
    sprite.ts               ← climber pixel art frames as Uint8ClampedArray
    storage.ts              ← localStorage read/write with safe fallback
    types.ts                ← Hold, Climber, GameState interfaces
```

### `BoulderingGame.tsx` outline
```tsx
'use client';
export default function BoulderingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<GameState>(initialState());   // mutable, no re-render
  const saveRef   = useRef<BoulderingSave>(loadSave());

  // Input → update stateRef (no setState, no re-render during gameplay)
  useEffect(() => { /* keyboard listeners */ }, []);

  // Game loop — only React re-renders the grade/score UI overlay
  useEffect(() => {
    const id = requestAnimationFrame(function loop(t) {
      tick(stateRef.current, t);
      draw(canvasRef.current!, stateRef.current);
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <canvas ref={canvasRef} width={480} height={520}
        style={{ width: '100%', imageRendering: 'pixelated', borderRadius: '8px',
                 border: '2.5px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)' }} />
      {/* Grade badge, send counter, best time — React-rendered overlay, updates on send */}
      <GameOverlay save={saveRef.current} />
      {/* Mobile tap controls */}
      <MobileDpad onPress={handleDpad} />
    </div>
  );
}
```

### Key constraint: no setState inside the game loop
All per-frame mutable state lives in `stateRef.current`. React state only updates on discrete events (send, fall, grade unlock) to avoid re-render during animation.

---

## Integration — About Page

```tsx
// app/about/page.tsx — replace <AIUsage /> with:
import dynamic from 'next/dynamic';
const BoulderingGame = dynamic(() => import('@/components/BoulderingGame'), { ssr: false });

// In JSX, same slot:
<div style={{ marginBottom: '3rem' }}>
  <h2 style={{ /* same sectionMarker style as rest of page */ }}>
    {sectionMarker('var(--jade)')}
    Try a problem
  </h2>
  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
    Arrow keys or tap to climb. Send 3 problems to unlock the next grade.
  </p>
  <BoulderingGame />
</div>
```

`dynamic(..., { ssr: false })` — canvas APIs are browser-only; prevents server render errors.

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/about/page.tsx` | Modify | Replace `<AIUsage />` with `<BoulderingGame />` |
| `components/BoulderingGame.tsx` | Create | Main client component |
| `components/bouldering/useGameLoop.ts` | Create | rAF loop with delta time |
| `components/bouldering/renderer.ts` | Create | Canvas draw functions |
| `components/bouldering/physics.ts` | Create | Gravity, reach, fall |
| `components/bouldering/routes.ts` | Create | Seeded generator + BFS |
| `components/bouldering/sprite.ts` | Create | Climber pixel frames |
| `components/bouldering/storage.ts` | Create | localStorage persistence |
| `components/bouldering/types.ts` | Create | Shared TypeScript types |

No new npm packages. No Supabase migrations.

---

## Implementation Notes

- **No new dependencies.** Everything is raw Canvas 2D API + React hooks.
- **`imageRendering: 'pixelated'`** on the canvas element keeps pixel art crisp on retina screens.
- **Seeded random:** use a simple mulberry32 PRNG — pass `(grade * 1000 + dateInt)` as seed. No crypto needed.
- **BFS validation:** run during route generation, not at runtime. If no valid path found, reseed with `seed + 1` and retry (max 10 attempts).
- **Mobile tap:** on `touchend`, find the hold closest to tap coordinates and call the same `moveToward(hold)` function the keyboard uses.
- **Grip bar:** drawn as a row of 8 tiny pixel squares below climber feet, turns red as timer depletes. Pure canvas, no DOM element.
- **Confetti:** array of 20 particles with `{x, y, vx, vy, color, life}`, updated in the game loop for 1.5s after send, then cleared.
- **`prefers-reduced-motion`:** check `window.matchMedia('(prefers-reduced-motion: reduce)')` — if true, skip all animations, draw static "solved" state immediately.
- **Canvas size:** internal resolution always 480×520. CSS `width: 100%` + `imageRendering: pixelated` scales it. Never read `canvas.offsetWidth` inside the game loop.

---

## Acceptance Criteria

- [ ] Game renders on About page in place of AIUsage widget
- [ ] Climber moves hold-to-hold on arrow/WASD key press
- [ ] Grip timer depletes on inaction → fall → instant route restart
- [ ] Reaching TOP hold triggers send animation + confetti
- [ ] 3 sends on a grade → next grade unlocks with stamp animation
- [ ] Best send times persisted in localStorage across page reloads
- [ ] Daily Problem available at V2, seeded by current date
- [ ] Mobile tap-to-move works at 375px viewport
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `prefers-reduced-motion` respected (no animation, no rAF loop)
- [ ] Canvas renders crisp pixel art on retina (no blur)

---

## Senior Dev Test Checklist

### Functional
- [ ] Happy path: V0 → V1 → V2 → V3 unlock chain works
- [ ] Edge case: localStorage unavailable (private browsing) — graceful fallback to in-memory save
- [ ] Edge case: window resize doesn't break canvas scaling
- [ ] Edge case: tab hidden (`visibilitychange`) — pause grip timer so player doesn't fall while away
- [ ] Mobile layout tested at 375px
- [ ] Desktop layout tested at 1280px+

### Build & Types
- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript `any` or `@ts-ignore`
- [ ] No unused imports

### Security
- [ ] No hardcoded secrets
- [ ] All localStorage reads wrapped in try/catch (JSON.parse can throw)
- [ ] No user input rendered as HTML

### Performance
- [ ] `cancelAnimationFrame` called on component unmount (no loop leak)
- [ ] No `setState` called inside the rAF loop
- [ ] Canvas cleared and redrawn each frame (no stale pixels)

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL
- [ ] Tested on iOS Safari (canvas + touch events)
- [ ] `context/current-feature.md` updated
- [ ] `context/feature-roadmap.md` item checked off
- [ ] This file updated with ship date

---

## Notes / History

- **2026-04-02** — Spec written. Replaces AIUsage widget on About page. No dependencies, no Supabase, localStorage only.
- Design metaphor: bouldering routes ≡ coding problems — both require persistence, reading the sequence, and committing to a move.
