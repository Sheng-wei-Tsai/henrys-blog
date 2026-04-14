# DESIGN.md — TechPath AU Design System

> **Eastern Ink × Comic Panel**
> A career platform for international IT graduates in Australia, expressed through the visual language of Chinese ink brush art fused with Western comic book panels.

---

## 1. Design Philosophy

### 1.1 Brand Concept

TechPath AU lives at the intersection of two visual traditions:

| Tradition | Contribution |
|-----------|-------------|
| **Chinese ink brush art** | Warmth, texture, cultural identity. Rice paper backgrounds, aged parchment tones, ink-brushed serif headings. |
| **Western comic panels** | Energy, clarity, modernity. Hard-offset shadows, bold borders, high-contrast action states. |

The result is a platform that feels **personal and trustworthy** (not corporate SaaS) while being **sharp and functional** (not a personal blog). Every visual decision should reinforce this balance.

### 1.2 Core UX Principles

1. **Answer "what is this?" in 5 seconds** — Hero copy must be immediately legible to a new visitor who has never heard of TechPath.
2. **One primary action per screen** — Never compete for attention. Each page has one CTA that earns the most visual weight.
3. **Progress is the product** — Users return because they can see themselves advancing. Score rings, progress bars, completion dots, and XP are not decorations — they are the retention mechanism.
4. **International grad empathy** — Every micro-copy decision should acknowledge the user's context: studying in a new country, navigating visa complexity, building confidence in English. Avoid jargon. Never punish with errors.

---

## 2. Colour System

### 2.1 Light Mode — Rice Paper & Ink

| Token | Value | Usage |
|-------|-------|-------|
| `--cream` | `#fdf5e4` | Page background — aged rice paper |
| `--warm-white` | `#fffef6` | Cards, surfaces, modals |
| `--parchment` | `#e8d5a8` | Dividers, borders, subtle panels |
| `--ink` | `#140a05` | Deep brush ink — borders, panel shadows |
| `--vermilion` | `#c0281c` | 朱砂 cinnabar red — primary CTAs, links |
| `--vermilion-light` | `#e03828` | CTA hover state |
| `--gold` | `#c88a14` | 金 imperial gold — secondary accent, badges |
| `--gold-light` | `#e0a020` | Gold hover state |
| `--jade` | `#1e7a52` | 翡翠 jade green — success, positive states |
| `--text-primary` | `#140a05` | Body text |
| `--text-secondary` | `#3d1c0e` | Subtext, labels |
| `--text-muted` | `#7a5030` | Captions, hints, disabled |

### 2.2 Dark Mode — Night Market & Lanterns

| Token | Value | Usage |
|-------|-------|-------|
| `--cream` | `#07050f` | Deep night sky — page background |
| `--warm-white` | `#0f0b1a` | Cards, surfaces |
| `--parchment` | `#1a1430` | Dividers, panel borders |
| `--ink` | `#f0e6d0` | Reversed — cream "ink" on dark |
| `--vermilion` | `#e84040` | 红灯笼 lantern red, glowing |
| `--gold` | `#f0b830` | 金灯 gold lantern |
| `--jade` | `#3ec880` | Jade glow |
| `--text-primary` | `#f0e6d0` | Warm cream body text |
| `--text-secondary` | `#c8b090` | Muted warm subtext |
| `--text-muted` | `#a09080` | Captions (WCAG AA: 4.6:1 on dark bg) |
| `--panel-shadow` | `4px 4px 0 rgba(232,64,64,0.6)` | Glowing vermilion offset |
| `--glow` | `0 0 32px rgba(232,64,64,0.12), ...` | Ambient dark glow on hero cards |

### 2.3 Background Atmosphere

**Dark mode only** — the page body has a subtle radial gradient layering:
```css
background-image:
  radial-gradient(ellipse at 10% 0%,  rgba(232,64,64,0.06) 0%, transparent 50%),   /* vermilion top-left */
  radial-gradient(ellipse at 90% 100%, rgba(240,184,48,0.04) 0%, transparent 50%), /* gold bottom-right */
  radial-gradient(ellipse at 50% 50%,  rgba(62,200,128,0.02) 0%, transparent 70%); /* jade centre */
```

This simulates the warm, atmospheric glow of a night market — vermilion lanterns above, gold reflections below.

**Both modes** — a fixed halftone dot texture at 2.5% opacity sits behind all content:
```css
body::before {
  background-image: radial-gradient(var(--ink) 0.8px, transparent 0.8px);
  background-size: 18px 18px;
  opacity: 0.025;
}
```

### 2.4 Semantic Colour Usage

| Meaning | Token | Use case |
|---------|-------|---------|
| Primary action | `--vermilion` | "Start for free", "Analyse resume", "Generate" buttons |
| Destructive / warning | `--vermilion` at reduced opacity | Delete confirmations, rate limit errors |
| Success / complete | `--jade` | Mastered skills, completed steps, passing scores |
| Informational | `--gold` | Badges, "Featured", subscription tier labels |
| Disabled | `--text-muted` | Locked features, unavailable states |
| Progress | `--jade` fill on `--parchment` track | Score rings, progress bars |

### 2.5 Contrast Ratios (WCAG 2.1 AA)

| Combination | Ratio | Pass |
|-------------|-------|------|
| `--text-primary` on `--cream` (light) | 15.8:1 | ✅ AAA |
| `--text-secondary` on `--cream` (light) | 9.4:1 | ✅ AAA |
| `--text-muted` on `--cream` (light) | 4.7:1 | ✅ AA |
| `--text-primary` on `--warm-white` (dark) | 12.1:1 | ✅ AAA |
| `--text-muted` on `--warm-white` (dark) | 4.6:1 | ✅ AA |
| `--vermilion` on `--cream` (light) | 5.9:1 | ✅ AA |
| `--jade` on `--cream` (light) | 4.8:1 | ✅ AA |

> ⚠️ Known issue (resolved): `--text-muted` was `#786858` in dark mode (3.5:1 — fail). Fixed to `#a09080`. Do not revert.

---

## 3. Typography

### 3.1 Type Stack

| Role | Font | Variable | Usage |
|------|------|----------|-------|
| Editorial headings | **Lora** (serif) | `var(--font-lora)` | H1, H2, blockquotes, hero eyebrows |
| UI / body | **Space Grotesk** (sans) | `var(--font-space)` | All UI text, H3, H4, buttons, labels |
| Handwritten accent | **Caveat** (handwriting) | `var(--font-caveat)` | Pull quotes, annotation-style labels |
| Code | JetBrains Mono / Courier New | — | `<code>`, `<pre>`, technical strings |

All fonts loaded via `next/font/google` in `app/layout.tsx`. **Never** use `@import` from Google Fonts in CSS — it is render-blocking.

### 3.2 Type Scale

| Element | Size | Weight | Font | Notes |
|---------|------|--------|------|-------|
| Page H1 | `clamp(2rem, 5vw, 3.2rem)` | 700 | Lora | One per page |
| Section H2 | `1.6–2rem` | 700 | Lora | Marks major page sections |
| Card H3 | `1.1–1.3rem` | 600 | Space Grotesk | Card and widget titles |
| Label / eyebrow | `0.7rem` | 700 | Space Grotesk | Uppercase, 0.08em letter-spacing |
| Body | `17px` / `1rem` | 400 | Space Grotesk | `body` base; prose uses Lora |
| Prose body | `1rem` | 400 | Lora | Blog posts, long-form content |
| Caption | `0.75–0.8rem` | 400 | Space Grotesk | Timestamps, source labels |
| Button | `0.9–1rem` | 600 | Space Grotesk | Always inherit body font |

### 3.3 Line Heights

| Context | Value |
|---------|-------|
| Headlines | `1.1–1.15` |
| UI body text | `1.5–1.6` |
| Long-form prose | `1.7` |
| Tight labels / pills | `1.0` |

### 3.4 Eyebrow Labels

Used above section headings to add context without visual weight:
```tsx
<p style={{
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 0.4rem',
}}>
  Your learning roadmap
</p>
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

The project does not use a utility class spacing scale. Instead, use `rem` values from this reference:

| Usage | Value | Approx px |
|-------|-------|-----------|
| Micro gap | `0.25rem` | 4px |
| Tight gap | `0.5rem` | 8px |
| Component padding | `0.75–1rem` | 12–16px |
| Card padding | `1.25–1.5rem` | 20–24px |
| Section gap | `2–3rem` | 32–48px |
| Page section | `4–6rem` | 64–96px |

### 4.2 Grid & Max Widths

| Context | Max width |
|---------|-----------|
| Full-page content | `1100px` |
| Reading column (prose) | `68ch` |
| Dashboard sidebar widget | `360px` |
| Narrow form / modal | `480px` |

### 4.3 Breakpoint

There is exactly **one global breakpoint**: `640px`.

```css
@media (max-width: 640px) { ... }
```

Do not add new breakpoints. Use `clamp()` for fluid sizing between mobile and desktop. Define responsive overrides as named CSS classes in `globals.css` — never inline `@media` in component `style={}` props.

### 4.4 Page Shell

Every page uses the `<Header>` + `<Footer>` shell from `app/layout.tsx`. Content sits between in a `<main>` tag. No page should stretch full-bleed beyond `1100px` without explicit design intent (e.g., hero banners).

---

## 5. Component Patterns

### 5.1 The Comic Panel Card

The signature visual element of TechPath AU. Used for all primary content cards.

```tsx
<div style={{
  background:    'var(--warm-white)',
  border:        'var(--panel-border)',       /* 3px solid --ink */
  boxShadow:     'var(--panel-shadow)',        /* 4px 4px 0 --ink */
  borderRadius:  '12px',
  padding:       '1.5rem',
}}>
```

**Hover state** (must be a CSS class, not inline JS):
```css
.comic-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--panel-shadow-lg);   /* 6px 6px 0 --ink */
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
```

**Never** simulate hover with `onMouseEnter`/`onMouseLeave`. It breaks on touch devices and is unnecessary JS.

### 5.2 Primary Button

```tsx
<button className="btn-primary">
  Label
</button>
```

```css
.btn-primary {
  background:    var(--vermilion);
  color:         var(--warm-white);
  border:        var(--panel-border);
  box-shadow:    var(--panel-shadow);
  padding:       0.65rem 1.4rem;
  border-radius: 8px;
  font-family:   inherit;
  font-size:     0.95rem;
  font-weight:   600;
  cursor:        pointer;
  transition:    transform 0.1s ease, box-shadow 0.1s ease;
}
.btn-primary:hover {
  background:  var(--vermilion-light);
  transform:   translateY(-2px);
  box-shadow:  var(--panel-shadow-lg);
}
.btn-primary:active {
  transform:   translateY(1px);
  box-shadow:  2px 2px 0 var(--ink);
}
.btn-primary:focus-visible {
  outline:        3px solid var(--gold);
  outline-offset: 3px;
}
```

### 5.3 Ghost / Secondary Button

```css
.btn-ghost {
  background:    transparent;
  color:         var(--vermilion);
  border:        2px solid var(--vermilion);
  padding:       0.6rem 1.2rem;
  border-radius: 8px;
  font-family:   inherit;
  font-weight:   600;
  cursor:        pointer;
}
.btn-ghost:hover {
  background: rgba(192, 40, 28, 0.06);
}
```

### 5.4 Dashed / Generate Button

Used for AI generation actions (diagrams, roadmaps, cover letters):

```tsx
<button style={{
  background:    'rgba(192,40,28,0.05)',
  border:        '1px dashed var(--parchment)',
  borderRadius:  '8px',
  padding:       '0.6rem 1rem',
  color:         'var(--terracotta)',
  fontWeight:    600,
  fontSize:      '0.85rem',
  cursor:        'pointer',
  fontFamily:    'inherit',
}}>
  ✨ Generate diagram
</button>
```

### 5.5 Tag / Pill

```tsx
<span style={{
  display:       'inline-block',
  background:    'var(--parchment)',
  color:         'var(--text-secondary)',
  border:        '1px solid rgba(20,10,5,0.1)',
  borderRadius:  '20px',
  padding:       '0.15rem 0.65rem',
  fontSize:      '0.75rem',
  fontWeight:    600,
  whiteSpace:    'nowrap',
}}>
  React
</span>
```

### 5.6 Score Ring

Used for Readiness Score and sub-scores. SVG `stroke-dasharray` pattern:

```tsx
const circumference = 2 * Math.PI * radius;
const offset = circumference * (1 - score / 100);

<svg width={size} height={size}>
  {/* Track */}
  <circle cx={cx} cy={cy} r={radius} fill="none"
    stroke="var(--parchment)" strokeWidth={stroke} />
  {/* Fill */}
  <circle cx={cx} cy={cy} r={radius} fill="none"
    stroke="var(--jade)" strokeWidth={stroke}
    strokeDasharray={circumference}
    strokeDashoffset={offset}
    strokeLinecap="round"
    transform={`rotate(-90 ${cx} ${cy})`} />
</svg>
```

Animate with `transition: stroke-dashoffset 0.8s ease`.

### 5.7 Skeleton Shimmer

Every client component that fetches async data must show a skeleton while loading. Match the exact dimensions of the real content to prevent CLS.

```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--parchment) 25%,
    #f5ece0 50%,
    var(--parchment) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
}
```

### 5.8 Section Eyebrow + Heading Pair

Standard section header used across dashboard, learn page, and insights:

```tsx
<div>
  <p style={{
    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.35rem',
  }}>
    Eyebrow label
  </p>
  <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.5rem', margin: 0 }}>
    Section heading
  </h2>
</div>
```

---

## 6. Motion & Animation

### 6.1 Principles

- **Purposeful** — animation should communicate state change or guide attention. Never animate for decoration alone.
- **Fast** — entrance animations: `0.3–0.5s`. Hover transitions: `0.1–0.15s`. Long animations erode trust.
- **Interruptible** — all transitions should be cancellable. Never lock the UI during animation.
- **Performance** — only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left` — these trigger layout.

### 6.2 Framer Motion Presets

The project uses `framer-motion` for orchestrated entrance animations.

**Page/section entrance (stagger children):**
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.35, ease: 'easeOut' } },
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}>Card 1</motion.div>
  <motion.div variants={item}>Card 2</motion.div>
</motion.div>
```

**Comic card hover (Framer):**
```tsx
<motion.div
  whileHover={{ y: -6, rotate: -0.5 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
```

**SVG scale-in (radar chart, score ring):**
```tsx
<motion.polygon
  initial={{ opacity: 0, scale: 0.1 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }} /* spring-like easing */
  style={{ transformOrigin: 'centre of polygon' }}
/>
```

**`whileInView` for scroll-triggered reveals:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
```

### 6.3 CSS-Only Animations

For simple, repeated animations that don't need orchestration, prefer pure CSS:

| Animation | CSS approach |
|-----------|-------------|
| Shimmer loading | `@keyframes shimmer` + `background-position` |
| Reading progress bar | `animation-timeline: scroll()` (no JS) |
| Dot pulse (notification) | `@keyframes pulse` + `border-radius: 50%` |
| Theme toggle spin | `transform: rotate(Ndeg)` with `transition` |

### 6.4 Reduced Motion

Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

For Framer Motion, use `useReducedMotion()` hook:
```tsx
const reduceMotion = useReducedMotion();
const variants = reduceMotion ? {} : animationVariants;
```

---

## 7. Iconography

The project does not use an icon library. Icons are **inline SVG** written directly in TSX or extracted as small helper components.

### 7.1 Icon Style

- **Stroke-based**, not filled (matches the ink-line aesthetic)
- `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- `fill="none"`, `stroke="currentColor"` (inherits text colour for automatic dark mode support)
- Default size: `16×16` or `20×20`. Use `width` and `height` props for sizing.

### 7.2 Emoji Usage

Emoji are used sparingly as visual anchors in section headings and empty states:
- ✅ In eyebrow labels: `🗺 Your learning roadmap`
- ✅ In empty states: `💼 No saved jobs yet`
- ✅ In status indicators: `✨ Generate diagram`
- ❌ Never in body copy or button labels (use SVG icons instead)

---

## 8. Images & Media

### 8.1 Always use `next/image`

Never use raw `<img>` tags. `<Image>` from `next/image` provides WebP conversion, lazy loading, and prevents CLS via explicit sizing.

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Company logo"
  width={48}
  height={48}
  style={{ borderRadius: '8px' }}
/>
```

### 8.2 Alt Text Rules

| Image type | Alt text |
|------------|---------|
| Informative (charts, diagrams, photos) | Descriptive: `"Bar chart showing salary distribution by city"` |
| Decorative (background textures, dividers) | `alt=""` |
| User avatar | `alt="{user.name} avatar"` |
| Logo | `alt="{Company} logo"` |
| Generated diagrams | `alt="Concept diagram for {skillName}"` |

### 8.3 Mermaid Diagrams

Generated diagrams (concept diagrams, career roadmaps) use `<MermaidDiagram chart={mermaidCode} />` from `components/MermaidDiagram.tsx`. This renders as inline SVG — scalable, accessible, and dark-mode compatible via the `neutral` Mermaid theme.

Do not attempt to render Mermaid code via `<img>` or external render services.

---

## 9. Forms & Inputs

### 9.1 Input Style

```css
.input {
  width:         100%;
  padding:       0.65rem 0.9rem;
  background:    var(--warm-white);
  color:         var(--text-primary);
  border:        2px solid var(--parchment);
  border-radius: 8px;
  font-size:     1rem;
  font-family:   inherit;
  transition:    border-color 0.15s ease;
}
.input:focus {
  outline:       none;
  border-color:  var(--vermilion);
  box-shadow:    0 0 0 3px rgba(192, 40, 28, 0.12);
}
.input::placeholder { color: var(--text-muted); }
```

### 9.2 Form Validation UX

- Validate on **blur**, not on every keystroke (reduces anxiety).
- Error messages appear **below** the field in `var(--vermilion)` at `0.82rem`.
- Success states use `var(--jade)` border and a `✓` icon, not a full colour change.
- Never disable the submit button until the user has attempted to submit — it's confusing.

### 9.3 File Upload (Resume Analyser)

```
Dashed border box → hover brightens border → drag-over: vermilion border + cream background
File accepted: border turns jade green, filename shown
Processing: shimmer skeleton + "Analysing…" copy
```

---

## 10. Navigation

### 10.1 Top Navigation (`components/Header.tsx`)

- **Logo** — left-aligned, `<Link href="/">` to homepage
- **Primary nav links** — centre or right, desktop only (hidden below `640px`)
- **Auth actions** — right-aligned: avatar + readiness mini-ring (logged in) or "Sign in" link (logged out)
- **Theme toggle** — right of auth actions, yin-yang icon

Sticky positioning: `position: sticky; top: 0; z-index: 100; backdrop-filter: blur(8px)`.

### 10.2 Internal Navigation

**Always use `<Link href="...">` from `next/link`** for same-domain navigation. Never `<a href="...">`.

Exception: `<a href="#section-id">` for same-page scroll anchors.

### 10.3 Breadcrumbs

Required on all pages three or more levels deep. Format: `Home / AU Insights / Company Compare`

```tsx
<nav aria-label="Breadcrumb" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
  <Link href="/">Home</Link>
  <span aria-hidden="true"> / </span>
  <Link href="/au-insights">AU Insights</Link>
  <span aria-hidden="true"> / </span>
  <span aria-current="page">Company Compare</span>
</nav>
```

---

## 11. Accessibility (WCAG 2.1 AA)

### 11.1 Non-Negotiable Requirements

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements reachable by Tab; Enter/Space activates buttons |
| Focus ring | `:focus-visible` outline `3px solid var(--gold)` on all focusable elements |
| Skip link | `<a href="#main-content" className="skip-link">Skip to content</a>` in `<Header>` |
| ARIA roles | Dropdowns: `role="menu"`, `aria-expanded`, `aria-haspopup="true"` |
| Form labels | Every `<input>` has an associated `<label>` or `aria-label` |
| Live regions | Toast notifications use `role="status"` or `aria-live="polite"` |
| Modal traps | Focus trapped inside open modals; Escape closes |
| Touch targets | Minimum `44×44px` for all interactive elements on mobile |

### 11.2 Colour Independence

Never convey information by colour alone. Pair colour with:
- An icon (e.g., ✅ jade green for success)
- A text label (e.g., "Mastered" not just a green dot)
- A pattern (e.g., error fields show both red border AND error message text)

---

## 12. Dark Mode

### 12.1 Toggle Mechanism

The `ThemeToggle` component (yin-yang SVG) writes `data-theme="light"` or `data-theme="dark"` to `document.documentElement`. The value is persisted to `localStorage` under `techpath-theme`.

On initial page load, a tiny inline script in `<head>` reads `localStorage` and applies the attribute before first paint — preventing flash of wrong theme (FOWT).

### 12.2 Design in Both Modes

**Every new component must be tested in both modes before shipping.** The checklist:

- [ ] Background tokens (`--cream`, `--warm-white`) used — not hardcoded hex
- [ ] Text tokens (`--text-primary`, `--text-secondary`, `--text-muted`) used — not hardcoded
- [ ] Borders use `--panel-border` or `--parchment` — not hardcoded
- [ ] Any custom `rgba()` values use low enough opacity to work in both modes
- [ ] SVG `stroke="currentColor"` — not `stroke="#140a05"`
- [ ] Images with transparent backgrounds remain legible in dark mode

### 12.3 Dark Mode Exceptions

Some elements intentionally differ between modes:

| Element | Light | Dark |
|---------|-------|------|
| `--panel-shadow` | `4px 4px 0 #140a05` (ink) | `4px 4px 0 rgba(232,64,64,0.6)` (vermilion glow) |
| Page background | Solid `#fdf5e4` | `#07050f` + radial gradients |
| `<pre>` code blocks | `#140a05` bg | `#070510` bg |
| Code `<code>` | Parchment bg, vermilion text | Vermilion tint bg, `#ff7070` text |

---

## 13. Loading & Error States

### 13.1 Loading Hierarchy

| State | Pattern |
|-------|---------|
| Page-level data (server components) | Next.js `loading.tsx` with full skeleton layout |
| Section-level async (client fetch) | Shimmer skeleton at same dimensions as real content |
| Button action in progress | Disabled button + spinner icon or "Loading…" text |
| AI generation | Shimmer + contextual message ("Generating diagram…") |

### 13.2 Error States

**Never show a blank screen or silent failure.** Every error state must:
1. Show a human-readable message (not a raw error code)
2. Offer a recovery action ("Try again" button)
3. Not block access to the rest of the page

```tsx
// ✅ Correct error state pattern
{error ? (
  <div style={{
    padding:      '1.2rem',
    background:   'var(--warm-white)',
    border:       '1px solid var(--parchment)',
    borderRadius: '12px',
    fontSize:     '0.88rem',
    color:        'var(--text-muted)',
  }}>
    Couldn't load results.{' '}
    <button onClick={retry} style={{ color: 'var(--vermilion)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
      Try again
    </button>
  </div>
) : null}
```

### 13.3 Empty States

Empty states should be warm and encouraging, not cold system messages:

| Context | Empty state copy |
|---------|-----------------|
| Saved jobs | "No saved jobs yet — browse the job board and tap ♡ to save roles." |
| Application pipeline | "Nothing here yet. Apply to a role to start tracking your progress." |
| Resume analyser | "Upload your resume to get a recruiter-grade analysis." |

Include a CTA link or button in every empty state.

---

## 14. Responsive Design Principles

### 14.1 Mobile-First Mindset

The target audience (international grads in Australia) has high mobile usage — campus, commute, job browsing on phone. Every new feature must be tested at `375px` viewport width before desktop.

### 14.2 Touch Interaction Rules

- Minimum touch target: `44×44px`
- Avoid hover-only interactions (they don't exist on touch)
- Swipe gestures: reserve horizontal swipe for deliberate features (card decks, carousels). Don't swipe-navigate between pages.
- Bottom of screen is prime real estate on mobile — high-value actions go there

### 14.3 Responsive CSS Pattern

```css
/* ✅ Define desktop layout, override for mobile */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

Never hardcode column counts in `style={}` without a paired CSS class for mobile override.

---

## 15. Writing Style (Microcopy)

### 15.1 Voice

- **Direct, not corporate** — "Analyse my resume" not "Submit document for analysis"
- **Warm, not casual** — "Your resume scored 71/100" not "Nice resume lol, 71 points"
- **Actionable** — Every CTA tells the user exactly what will happen next
- **International-student-aware** — Acknowledge complexity without condescension

### 15.2 CTA Copywriting Rules

| ❌ Avoid | ✅ Use instead |
|---------|--------------|
| "Submit" | "Analyse resume" / "Get my score" |
| "Click here" | "View all jobs" |
| "Error occurred" | "Couldn't load — try again" |
| "Loading..." (forever) | "Generating your roadmap…" + timeout fallback |
| "Sign up" | "Start for free" |

### 15.3 Number Formatting

| Value | Format |
|-------|--------|
| Salary | `$80k – $110k` (k = thousand) |
| Score | `71/100` or `71%` (not `0.71`) |
| Date | Relative for recent (`2 days ago`), absolute for far past (`12 Mar 2025`) |
| Large counts | `1,234` (comma separators) |

---

## 16. File & Component Conventions

### 16.1 Styling

- **All styles use CSS custom property tokens** — never hardcoded hex in `style={}`
- **Hover, focus, active states** — CSS classes in `globals.css`, never inline JS event handlers
- **New reusable classes** — add to `globals.css` with a comment block describing the component family
- **One-off styles** — inline `style={}` is acceptable for layout (gap, padding, flex) but not colours

### 16.2 Server vs Client Split

```
app/
  my-feature/
    page.tsx              ← Server Component (metadata, initial data)
    MyFeatureClient.tsx   ← 'use client' (interactivity, state, effects)
```

Do not put `'use client'` on `page.tsx` unless absolutely necessary. Prefer the split pattern.

### 16.3 Component Checklist Before Shipping

- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Renders skeleton while loading
- [ ] Shows error state with recovery action
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Has visible focus ring
- [ ] Mobile-tested at 375px
- [ ] Uses `<Link>` for all internal navigation
- [ ] Uses `<Image>` for all images
- [ ] No hardcoded colour hex values in `style={}`
- [ ] Respects `prefers-reduced-motion`

---

## 17. Design Anti-Patterns

These are explicitly prohibited. If you see them, fix them — do not add more.

| Anti-pattern | Why it's wrong | Fix |
|-------------|---------------|-----|
| `onMouseEnter`/`onMouseLeave` for hover | Broken on touch; unnecessary JS | CSS `:hover` class in `globals.css` |
| `<img>` instead of `<Image>` | No lazy load, no WebP, CLS risk | `import Image from 'next/image'` |
| `<a href="/internal">` | Full page reload | `import Link from 'next/link'` |
| `@import` from Google Fonts | Render-blocking | `next/font/google` in `layout.tsx` |
| Hardcoded `#hex` in `style={}` | Breaks dark mode | CSS token `var(--token)` |
| `export const dynamic = 'force-dynamic'` on static pages | Disables caching | Remove; use ISR if freshness needed |
| Silent error catch (`catch {}`) | User sees infinite spinner | Set error state, show recovery UI |
| Unbounded Supabase query (no `.limit()`) | Performance risk | Always add `.limit(N)` |
| `select('*')` in production queries | Over-fetches data | Select only needed columns |
| `images: { unoptimized: true }` (new instances) | Known tech debt | Do not replicate; fix with `remotePatterns` |
