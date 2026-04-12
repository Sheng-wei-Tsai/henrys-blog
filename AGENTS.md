# AGENTS.md — TechPath AU / Henry's Digital Life

This file is the single source of truth for every AI agent and developer working on this codebase.
Read it fully before writing a single line. Rules here are enforced by CI and pre-push hooks.

---

## 1. What this app is

**TechPath AU** is a production career platform for international IT graduates in Australia.
It is NOT a personal blog with some tools bolted on. The primary product is:

> Resume analyser · Interview prep · Visa tracker · Salary checker · Job search · Learning paths

The personal blog (writing, digest, githot, AI news, visa news) is a content moat that drives SEO and engagement, not the core product. When making product decisions, prioritise the career tools audience: **international students and 482/485/PR applicants in tech roles in Australia**.

**Brand:** Eastern Ink × Comic Panel. Palette is Rice Paper & Ink (light) / Night Market & Lanterns (dark).
Design language: hard-offset comic-book shadows (`var(--panel-shadow)`), `Lora` serif for headings, `Space Grotesk` for UI, `Caveat` for handwritten accents.

---

## 2. Stack & versions

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16.2** (App Router, Turbopack) | Has breaking changes vs Next 13/14 — see §3 |
| Language | TypeScript (strict) | No `any` without a comment explaining why |
| Styling | **CSS custom properties + inline styles** | No Tailwind, no CSS Modules — see §7 |
| Auth | **Supabase Auth + `@supabase/ssr`** | Cookie-based sessions via SSR client |
| Database | **Supabase (PostgreSQL)** with Row Level Security | Service role only for write-bypass |
| Payments | **Stripe** (checkout + webhooks) | Test keys in `.env.local` |
| AI | **Anthropic Claude** (`@anthropic-ai/sdk`) | Haiku for automation, Sonnet for interactive |
| Deployment | **Vercel** | Trigger via `git push origin main` |
| Content | **Markdown files** in `content/` | Read at build time via `lib/posts.ts` |

---

## 3. Next.js 16 — Breaking Changes You Must Know

> **STOP.** Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
> This version has APIs and conventions that differ significantly from training data.

Critical differences from Next.js 13/14:

- `cookies()`, `headers()`, `params`, `searchParams` are now **async** — always `await` them
- `generateMetadata` and `generateStaticParams` signatures may differ — check the docs
- Middleware uses the `@supabase/ssr` pattern — do NOT use deprecated `@supabase/auth-helpers-nextjs`
- `next/font` is the only correct font loading method — `@import` from Google Fonts is render-blocking
- `images: { unoptimized: true }` in `next.config.ts` is a known tech debt item — do not perpetuate it
- Heed all deprecation warnings in the build output

---

## 4. Pre-push Checklist — MANDATORY

**Never push to `main` without running:**

```bash
npm run check    # = npm audit --audit-level=moderate && next build
```

Enforced by:
1. `.git/hooks/pre-push` (install via `sh scripts/setup-hooks.sh`)
2. GitHub Actions `check` job in `.github/workflows/deploy.yml` — deploy is gated on it

If `npm audit` reports moderate+ vulnerabilities: fix with `npm audit fix` or add a `overrides` entry in `package.json`. **Do NOT bypass with `--no-verify`** except for content-only commits (daily posts, doc updates) where zero code changed.

---

## 5. Security Rules — Non-Negotiable

### 5.1 Every API route that calls Claude MUST have rate limiting

```ts
// ✅ Correct — every Claude-calling route must do this
const auth = await requireSubscription();        // auth + global 50/day limit
if (auth instanceof NextResponse) return auth;

const withinLimit = await checkEndpointRateLimit(auth.user.id, 'your-endpoint');
if (!withinLimit) return rateLimitResponse();
```

Use `requireSubscription()` from `lib/subscription.ts`. Register expensive endpoints in `ENDPOINT_LIMITS`.
**No exceptions.** A route without rate limiting is a billing liability.

### 5.2 Supabase client selection rules

| Context | Client | Why |
|---------|--------|-----|
| Server Components, Route Handlers (reading user data) | `createSupabaseServer()` from `lib/auth-server.ts` | Reads session from cookies |
| Route Handlers (admin/billing writes, bypassing RLS) | `createSupabaseService()` from `lib/auth-server.ts` | Service role — use sparingly |
| Client Components | `supabase` from `lib/supabase.ts` | Anon key, RLS enforced |
| Middleware | `createServerClient` from `@supabase/ssr` with request/response cookies | Only pattern that works in Edge |

**Never** use the service role client in client components or middleware.
**Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

### 5.3 Auth pattern for protected route handlers

```ts
// ✅ Correct pattern for non-AI routes that need auth
import { createSupabaseServer } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... rest of handler
}
```

### 5.4 Input validation rules

- Validate EVERY user-supplied value before it touches a database or API call
- Use allowlists for enum-style inputs (see `app/api/onboarding/route.ts` for the pattern)
- Truncate free-text strings at a known max (e.g., `.slice(0, 500)`)
- Never interpolate user input directly into SQL — use Supabase's parameterised query builder
- Validate `sessionId` format on analytics endpoints — do not accept arbitrary strings

### 5.5 Security headers

Every new `next.config.ts` change must preserve the `headers()` config with at minimum:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 5.6 What `NEXT_PUBLIC_` means

Any `NEXT_PUBLIC_` env var is shipped to the browser and visible to all users. Currently exposed (intentionally):
- `NEXT_PUBLIC_SUPABASE_URL` — safe (public anon endpoint)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe (enforces RLS)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — safe (Stripe publishable)
- `NEXT_PUBLIC_APP_URL` — safe

**Never** prefix a secret key (service role, private API key, webhook secret) with `NEXT_PUBLIC_`.

---

## 6. Performance Rules

### 6.1 Static vs Dynamic — default to static

- Homepage reads only filesystem markdown — it must be **statically generated** (or ISR)
- **Never** add `export const dynamic = 'force-dynamic'` to a page that only reads static content
- Use `export const revalidate = 3600` (ISR) for pages that need periodic freshness
- Only use `force-dynamic` for pages that read live database data per-user (dashboard, admin)

### 6.2 Font loading

**Only use `next/font`** — never `@import` from Google Fonts in CSS files.

```ts
// ✅ In app/layout.tsx
import { Space_Grotesk, Lora, Caveat } from 'next/font/google';
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
```

The CSS `@import url('https://fonts.googleapis.com/...')` in `globals.css` is **known tech debt** — do not replicate this pattern in any new file.

### 6.3 Images

- Use `<Image>` from `next/image` for ALL images — never raw `<img>` tags
- The `images: { unoptimized: true }` in `next.config.ts` is tech debt — when fixing, add `remotePatterns` for `*.googleusercontent.com` and `*.githubusercontent.com`
- Always set explicit `width` and `height` on `<Image>` to prevent CLS

### 6.4 Client vs Server Components

- Default to **Server Components** — add `'use client'` only when you need browser APIs, state, or event handlers
- Never fetch data inside a `'use client'` component on mount when a Server Component parent can pass it as props
- Do not waterfall client-side fetches — parallel fetch or use a single aggregation endpoint (see `/api/dashboard/summary`)

---

## 7. Styling Rules

This codebase uses **CSS custom properties + inline styles**. There is no Tailwind, no CSS Modules, no styled-components.

### 7.1 Always use design tokens

```ts
// ✅ Correct — uses design tokens
<div style={{ color: 'var(--text-primary)', background: 'var(--warm-white)' }}>

// ❌ Wrong — hardcoded colour breaks dark mode
<div style={{ color: '#140a05', background: '#fffef6' }}>
```

Full token reference: `app/globals.css` — all variables defined in `:root` and `[data-theme="dark"]`.

### 7.2 Core design tokens to memorise

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--cream` | `#fdf5e4` | `#07050f` | Page background |
| `--warm-white` | `#fffef6` | `#0f0b1a` | Cards, surfaces |
| `--parchment` | `#e8d5a8` | `#1a1430` | Dividers, borders |
| `--ink` | `#140a05` | `#f0e6d0` | Primary text, borders |
| `--vermilion` | `#c0281c` | `#e84040` | CTAs, accents |
| `--gold` | `#c88a14` | `#f0b830` | Secondary accent |
| `--jade` | `#1e7a52` | `#3ec880` | Success, positive |
| `--text-primary` | `#140a05` | `#f0e6d0` | Body text |
| `--text-secondary` | `#3d1c0e` | `#c8b090` | Subtext |
| `--text-muted` | `#7a5030` | `#786858` | Captions, hints |
| `--panel-shadow` | `4px 4px 0 #140a05` | `4px 4px 0 rgba(232,64,64,0.6)` | Comic card shadow |
| `--panel-border` | `3px solid #140a05` | `3px solid rgba(240,230,208,0.25)` | Hard-edge border |

> ⚠️ `--text-muted` in dark mode (#786858) is known to have insufficient contrast (3.5:1 vs required 4.5:1). Target value is `#a09080`. Fix when touching affected components.

### 7.3 Hover states — CSS class required

Inline styles cannot express `:hover`. Use a CSS class defined in `globals.css` for hover, focus, and active states. Do NOT use `onMouseEnter`/`onMouseLeave` JavaScript to simulate hover — it breaks on touch devices.

```css
/* In globals.css */
.my-button:hover { background: var(--vermilion-light); }
```

### 7.4 Responsive design

There is exactly one global breakpoint: `@media (max-width: 640px)`. For mobile-responsive behaviour:
- Add a CSS class (e.g., `className="tools-grid"`) and define the responsive override in `globals.css`
- Do NOT hardcode column counts like `gridTemplateColumns: 'repeat(3, 1fr)'` without a mobile override
- Use `clamp()` for font sizes that scale across viewport widths

### 7.5 Typography hierarchy

- **H1 section titles:** `fontFamily: "'Lora', serif"`, `fontWeight: 700`, `color: var(--brown-dark)`
- **UI text:** `fontFamily: "'Space Grotesk', sans-serif"` (inherited via body)
- **Handwritten accents:** `className="font-handwritten"` (Caveat, pre-defined class)
- **Code/mono:** `fontFamily: '"Courier New", monospace'`

---

## 8. Internal Navigation — Always `<Link>`

Use `<Link>` from `next/link` for ALL internal routes. Never `<a href="...">` for same-domain paths.

```ts
// ✅ Client-side navigation
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>

// ❌ Full page reload — never do this for internal routes
<a href="/dashboard">Dashboard</a>
```

The only exception: `<a href="#anchor">` for same-page hash scrolling.

---

## 9. API Route Patterns

### 9.1 Paid AI endpoints — full template

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireSubscription, checkEndpointRateLimit, recordUsage, rateLimitResponse } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  // 1. Auth + global rate limit
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  // 2. Per-endpoint rate limit (register in ENDPOINT_LIMITS if expensive)
  const ok = await checkEndpointRateLimit(auth.user.id, 'your-endpoint');
  if (!ok) return rateLimitResponse();

  // 3. Parse + validate input
  const body = await req.json().catch(() => null);
  if (!body?.requiredField) {
    return NextResponse.json({ error: 'requiredField is required' }, { status: 400 });
  }

  // 4. Call Claude (always claude-haiku-4-5-20251001 for cost efficiency unless quality is critical)
  // 5. Record usage
  await recordUsage(auth.user.id, 'your-endpoint');

  return NextResponse.json(result);
}
```

### 9.2 Free authenticated endpoints

```ts
const sb = await createSupabaseServer();
const { data: { user } } = await sb.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### 9.3 Public endpoints (analytics, visa-news, jobs)

These are intentionally unauthenticated. Still validate and sanitise ALL inputs.
Use anon key client where database access is needed (not service role).

### 9.4 Model selection

| Use case | Model |
|----------|-------|
| Automated pipelines (fetch-ai-news, fetch-visa-news, quizzes) | `claude-haiku-4-5-20251001` |
| Interactive user-facing features (interview, analysis, mentor) | `claude-sonnet-4-6` |
| Complex multi-step reasoning | `claude-opus-4-6` |

---

## 10. Database Rules

### 10.1 Migration files

Every schema change gets a new numbered migration: `supabase/017_description.sql`.
Never modify existing migration files — only add new ones.
Always include: table create, RLS enable, RLS policies, and indexes.

### 10.2 RLS pattern

```sql
-- ✅ Standard RLS pattern
alter table public.my_table enable row level security;
create policy "Users can read own rows" on public.my_table
  for select using (auth.uid() = user_id);
create policy "Users can insert own rows" on public.my_table
  for insert with check (auth.uid() = user_id);
```

### 10.3 Query hygiene

- Always add `.limit(N)` — never run unbounded queries
- Use `.maybeSingle()` instead of `.single()` when the row might not exist (avoids throwing)
- Index foreign keys and any column used in `.eq()` filters in production tables
- Use `.select('only,the,columns,you,need')` — never `select('*')` in production queries

---

## 11. Content System

Content lives in `content/` as markdown files. The data layer is `lib/posts.ts`.

| Directory | Source type | Reader function |
|-----------|------------|-----------------|
| `content/posts/` | `'blog'` | `getAllPosts()` |
| `content/digest/` | `'digest'` | `getAllDigests()` |
| `content/githot/` | `'githot'` | `getAllGithot()` |
| `content/ai-news/` | `'ai-news'` | `getAllAINews()` |
| `content/visa-news/` | `'visa-news'` | `getAllVisaNews()` |

Frontmatter schema for each source type is defined in `lib/posts.ts`. Match it exactly.
Auto-generated content scripts: `scripts/fetch-ai-news.ts`, `scripts/fetch-visa-news.ts`.

---

## 12. Component Architecture Rules

### 12.1 Server vs Client split

```
app/
  page.tsx              → Server Component (data fetching, metadata)
  MyPageClient.tsx      → 'use client' (interactivity, state, effects)
```

Use the server/client split pattern established in `app/learn/page.tsx` + `app/learn/LearnPageClient.tsx`.

### 12.2 Skeleton loading pattern

Every client component that fetches data MUST have a loading skeleton shown before data arrives. Match the pattern in `components/PersonalisedHero.tsx` — shimmer placeholders at the exact dimensions of the real content to prevent CLS.

```ts
if (loading) return <MySkeletonShimmer />;
```

### 12.3 Error states — NEVER silent failure

```ts
// ✅ Always handle errors explicitly
const [data, setData]   = useState(null);
const [error, setError] = useState(false);

useEffect(() => {
  fetch('/api/my-endpoint')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(setData)
    .catch(() => setError(true));
}, []);

if (error) return <FallbackContent />;
```

Do NOT silently swallow fetch errors — show a graceful degraded state instead of infinite loading.

### 12.4 Accessibility minimums (WCAG 2.1 AA)

- Every interactive element must be keyboard-accessible (Enter/Space to activate, Escape to dismiss)
- Buttons must have visible focus rings (`:focus-visible` outline)
- Dropdowns must use `aria-expanded`, `aria-haspopup="true"`, `role="menu"` on the panel
- Images that convey content must have descriptive `alt` text; decorative images use `alt=""`
- Contrast ratio minimums: 4.5:1 for body text, 3:1 for large text and UI components

---

## 13. Homepage & UX Principles

The homepage must answer **"what is this and why should I stay?"** within 5 seconds for a new visitor.

Rules for homepage changes:
1. **Single primary CTA** for logged-out users — "Start for free →" linking to `/login`
2. Career tools come before personal blog content for logged-out users
3. Social proof (user counts, tool stats) must appear above the fold or immediately below the hero
4. Logged-in users see `PersonalisedHero` — personalised greeting, readiness score, checklist
5. `PostHeatmap` and "Recent writing" are for returning logged-in visitors, not the hook for new users

---

## 14. Commit Message Convention

```
type(scope): short summary under 72 chars

- Bullet points for each logical change
- Reference file paths for non-obvious changes
```

Types: `feat` | `fix` | `perf` | `security` | `refactor` | `docs` | `style` | `chore`

Auto-generated content commits (daily posts) use the simplified format: `ai-news: N new articles YYYY-MM-DD`.

---

## 15. Known Tech Debt (Do Not Replicate)

These are acknowledged issues being fixed incrementally. **Do not add new instances of any of these patterns.**

| Issue | Location | Impact |
|-------|----------|--------|
| `@import` from Google Fonts | `app/globals.css:1` | Render-blocking — replace with `next/font` |
| `images: { unoptimized: true }` | `next.config.ts:4` | No image optimization — fix with `remotePatterns` |
| `export const dynamic = 'force-dynamic'` on static pages | `app/page.tsx:7` | Disables caching on static content |
| `<img>` tags (not `<Image>`) | `PersonalisedHero.tsx:119`, `Header.tsx:304,492` | No lazy loading or WebP conversion |
| `<a href>` for internal routes | `PersonalisedHero.tsx`, `GettingStartedChecklist.tsx` | Full page reloads on navigation |
| `--text-muted: #786858` in dark mode | `globals.css:75` | Fails WCAG contrast (3.5:1) — target `#a09080` |
| No `middleware.ts` | missing | Dashboard/admin routes lack server-side auth guard |
| No CSP headers | `next.config.ts` | Missing security headers |
| Inline `onMouseEnter/Leave` for hover | Multiple components | Broken on touch, unnecessary JS |

---

## 16. Feature Development Workflow — MANDATORY

**Before implementing ANY new feature or significant UI change, you MUST:**

1. Write a feature entry in `TODO.md` under the appropriate priority section — describe what will be built, why, and list the files to be created/modified
2. Only then begin implementation

This keeps the project clean, consistent, and allows the product owner to review scope before code is written.

```
// ✅ Correct order
1. Add feature to TODO.md with description + file list
2. Implement the feature
3. Mark as ✅ Done in TODO.md

// ❌ Wrong — never write code without first documenting in TODO.md
```

---

## 17. What Requires Human Review Before Merging

Flag these changes for review — do not push autonomously:

- Any change to `app/api/stripe/` (billing logic)
- Any change to `supabase/*.sql` that drops tables or columns
- Any change to `lib/auth-server.ts` or `lib/subscription.ts`
- Adding a new `NEXT_PUBLIC_` environment variable
- Any change to `.github/workflows/deploy.yml`
