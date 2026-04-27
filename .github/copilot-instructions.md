# Copilot Instructions — TechPath AU / Henry's Blog

> **Read `AGENTS.md` first.** This file is a condensed summary for GitHub Copilot's PR
> suggestions and code review. `AGENTS.md` is the full source of truth — when there is any
> doubt, defer to it.

## Product context

This is **TechPath AU** — a career platform for international IT graduates in Australia
(resume analyser, interview prep, visa tracker, salary checker, job search, learning paths).
The blog/digest/githot/AI news/visa news content drives SEO, but the career tools are the
product. Audience: international students and 482/485/PR applicants in Australian tech roles.

Brand: **Eastern Ink × Comic Panel**. Hard-offset comic shadows (`var(--panel-shadow)`),
`Lora` for headings, `Space Grotesk` for UI, `Caveat` for handwritten accents. Australian English.

## Stack (Next.js 16.2 — async APIs)

- **Next.js 16.2 App Router + Turbopack** — `cookies()`, `headers()`, `params`, `searchParams` are **async**, always `await`
- TypeScript strict — no `any` without a comment explaining why
- **Styling: CSS custom properties + inline styles** — no Tailwind, no CSS Modules, no styled-components
- Auth: **Supabase + `@supabase/ssr`** (cookie sessions). Never use deprecated `@supabase/auth-helpers-nextjs`
- DB: Supabase Postgres with **RLS on every table**
- Payments: Stripe (test keys in `.env.local`)
- AI: Anthropic Claude (`claude-haiku-4-5-20251001` for automation, `claude-sonnet-4-6` interactive, `claude-opus-4-7` heavy reasoning)
- Deploy: Vercel via `git push origin main`
- Content: Markdown in `content/` (read at build time via `lib/posts.ts`)

## Non-negotiable rules

### Security

- **Every API route that calls Claude MUST rate-limit.** Use `requireSubscription()` + `checkEndpointRateLimit()` from `lib/subscription.ts`. Register expensive endpoints in `ENDPOINT_LIMITS`. A route without rate limiting is a billing liability.
- **Supabase client selection:**
  - `createSupabaseServer()` (server components, RLS-respecting reads of user data)
  - `createSupabaseService()` (server-only, bypasses RLS — use sparingly, never in client/middleware)
  - `supabase` from `lib/supabase.ts` (client components, anon key, RLS enforced)
- **Never** prefix a secret key with `NEXT_PUBLIC_`. Currently safe public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- Validate every user input. Allowlist enums, truncate free-text (`.slice(0, N)`), never interpolate user input into SQL — use Supabase's parameterised query builder.
- Sanitise HTML by **iterative tag stripping** (loop until stable) — single-pass regex misses nested injection like `<scr<script>ipt>`. Pattern: `stripHtmlTags()` in `app/api/jobs/route.ts` and `scripts/scrape-au-jobs.ts`.
- Preserve `headers()` config in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### Performance

- Default to **Server Components**. Add `'use client'` only when you need browser APIs/state/events.
- Default to **static generation / ISR**. Never add `export const dynamic = 'force-dynamic'` to a page that only reads filesystem markdown.
- Use `next/font` (already wired via `Space_Grotesk`, `Lora`, `Caveat`). Do **not** add new `@import` from Google Fonts in CSS.
- Use `<Image>` from `next/image` for all images — never raw `<img>`.
- Use `<Link>` from `next/link` for all internal routes — never `<a href="/...">`.
- Don't waterfall client-side fetches. Aggregate via a single endpoint (e.g. `/api/dashboard/summary`).

### Styling — design tokens only

Use CSS variables defined in `app/globals.css` (`:root` + `[data-theme="dark"]`). Never hardcode colours.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--cream` | `#fdf5e4` | `#07050f` | Page background |
| `--warm-white` | `#fffef6` | `#0f0b1a` | Cards, surfaces |
| `--ink` | `#140a05` | `#f0e6d0` | Primary text, borders |
| `--vermilion` | `#c0281c` | `#e84040` | CTAs |
| `--gold` | `#c88a14` | `#f0b830` | Secondary accent |
| `--jade` | `#1e7a52` | `#3ec880` | Success |
| `--text-primary` / `--text-secondary` / `--text-muted` | — | — | Body / sub / caption |
| `--panel-shadow` | `4px 4px 0 #140a05` | `4px 4px 0 rgba(232,64,64,0.6)` | Comic card shadow |
| `--panel-border` | `3px solid #140a05` | `3px solid rgba(240,230,208,0.25)` | Hard-edge border |

Hover/focus/active states require a CSS class in `globals.css`. Do **not** use `onMouseEnter/Leave` JS to fake hover — breaks on touch.

Mobile breakpoint: `@media (max-width: 640px)` only. Never hardcode column counts without a mobile override.

### API route patterns

**Paid AI endpoint:**
```ts
const auth = await requireSubscription();
if (auth instanceof NextResponse) return auth;
const ok = await checkEndpointRateLimit(auth.user.id, 'your-endpoint');
if (!ok) return rateLimitResponse();
// ... handler ...
await recordUsage(auth.user.id, 'your-endpoint');
```

**Free authed endpoint:**
```ts
const sb = await createSupabaseServer();
const { data: { user } } = await sb.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Database

- Add new migration files (e.g. `supabase/021_description.sql`) — never modify existing migrations
- Always include: table create, `enable row level security`, RLS policies, indexes on FKs and `.eq()` columns
- Always `.limit(N)` queries; use `.maybeSingle()` not `.single()` when row may be absent; `.select('only,needed,columns')` not `select('*')`

### Components

- Server/client split: `app/foo/page.tsx` (server) → `app/foo/FooPageClient.tsx` (client)
- Every fetching client component shows a **skeleton shimmer** (match `components/PersonalisedHero.tsx`) — never spinner-only or blank
- Never silently swallow fetch errors — show a degraded fallback
- WCAG 2.1 AA: keyboard accessible, visible focus rings (`:focus-visible`), `aria-expanded`/`aria-haspopup` on dropdowns, descriptive `alt` (or `alt=""` for decorative), 4.5:1 contrast for body text

## Tech debt — DO NOT replicate these patterns

| Anti-pattern | Where it currently exists |
|--------------|---------------------------|
| `@import` Google Fonts in CSS | `app/globals.css:1` |
| `images: { unoptimized: true }` | `next.config.ts` |
| `export const dynamic = 'force-dynamic'` on static pages | `app/page.tsx` |
| `<img>` instead of `<Image>` | `PersonalisedHero.tsx`, `Header.tsx` |
| `<a href>` for internal routes | `PersonalisedHero.tsx`, `GettingStartedChecklist.tsx` |
| `--text-muted: #786858` in dark (3.5:1, fails WCAG) | `globals.css` — target `#a09080` |
| `onMouseEnter/Leave` simulating hover | multiple components |

## Workflow

1. **Document feature in `TODO.md`** before implementing — describe what, why, file list
2. Implement
3. `npm run check` (audit + build) must pass clean
4. Mark ✅ in TODO.md
5. Atomic commits — one logical change per commit, format: `type(scope): summary` (types: feat/fix/perf/security/refactor/docs/chore/style)
6. Co-author trailer on every commit: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`

## Requires human review (do not merge autonomously)

- `app/api/stripe/**` — billing logic
- `supabase/*.sql` migrations that **drop** tables/columns
- `lib/auth-server.ts`, `lib/subscription.ts`
- New `NEXT_PUBLIC_*` env vars
- `.github/workflows/deploy.yml`

## Content automation

CI scripts in `scripts/` shell out to the `claude` CLI authenticated via `CLAUDE_CODE_OAUTH_TOKEN` (Claude Code Pro quota), not the pay-as-you-go `ANTHROPIC_API_KEY`. The shared helper is `scripts/llm-claude.ts` — use it for any new automation that needs LLM calls.
