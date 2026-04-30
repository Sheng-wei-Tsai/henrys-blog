# TODO — TechPath AU Feature Backlog

**Last updated:** 2026-04-22
**Product vision:** The definitive career platform for international IT graduates entering the Australian job market.
**Single source of truth for:** what is done, what is next, and why.

> **How to use this file:** See `DOCS.md` for the full documentation management guide.
> Before building anything, add it here first (AGENTS.md §16). After shipping, mark ✅ Done and date it.

---

## ✅ Done — Full Feature Inventory

### Infrastructure & CI/CD
- **Auth** — GitHub OAuth + Supabase SSR, RLS everywhere
- **Stripe** — checkout, portal, webhook, subscription gate
- **Pre-push quality gate** — `npm run check` (audit + build), GitHub Actions CI
- **Sitemap + robots.txt** — SEO ready
- **RSS feed** — `/feed.xml` — blog + digests + githot, auto-discovered
- **OG images** — site-wide + per blog post (`next/og`, 1200×630)
- **Analytics** — `/admin/analytics` — page views, countries, devices, AI growth suggestions
- **Test suite** — Vitest + 41 tests (8 files): API route auth, component behaviour, localStorage isolation ✅ *2026-04-20*
- **CI pipeline fix** — Node 22, missing icon files committed, TS errors in test files resolved, Vercel deploy unblocked ✅ *2026-04-21*

### Design System
- **Company Logo System** — `lib/companies.ts` (70 companies + aliases), `components/CompanyLogo.tsx` (4-tier fallback: Simple Icons → Logo.dev → Google favicons → initials), click-to-website on bare variant ✅ *2026-04-20*
- **CitySelector** — animated city dropdown with landmark subtitle fade, city-specific border/tint on hover, custom dropdown with CityIcon per option ✅ *2026-04-21*
- **EIcon / CityIcon** — `components/icons/EIcon.tsx` (34 ink-brush icons), `components/icons/CityIcon.tsx` (8 city mascot SVGs) ✅ *2026-04-21*
- **Yin-Yang Dark Mode Toggle** — smooth 180° spin, cross-fade fill colours, comic panel shadow ✅
- **Reading Progress Bar** — pure CSS `animation-timeline: scroll()` on blog posts ✅

### Blog & Content
- **Blog** — MDX posts, reading time, tag chips, AI badge on auto-generated posts
- **Daily AI Digest** — `/digest` — auto-generated daily summaries
- **GitHub Hot** — `/githot` — trending repos daily
- **Blog search + filters** — client-side, title + tag
- **Comments** — auth-gated, per-post, admin moderation

### Career Tools
- **Resume Analyser** — PDF upload, Claude AU recruiter prompt, score ring, radar chart, action items
- **Cover Letter Generator** — GPT-4o, 4-paragraph AU structure, streaming, inline edit
- **Job Search** — JSearch + Adzuna + Jora scraper, working rights filter, freshness colours, save/apply, animated CitySelector
- **Job Scraper** — `scripts/scrape-au-jobs.ts` — Jora HTML scraping, 9 keywords × 5 cities, daily GitHub Actions cron 6am AEST
- **Interview Prep v2** — Universal Questions, Reality Check (6-stage), Company Intel (10 companies), Post-Interview Toolkit (Summary/Email/Rejection/Negotiation tabs), Networking Hub at `/interview-prep/networking`
- **Gap Engine** — pgvector skill extraction from JDs, match % ring per job card, cached 7d in Supabase + localStorage, rate-limited 5/day ✅ *2026-04*
- **YouTube Learning** — 20 channels, Gemini study guide, quiz, transcript smart sampling

### AU Insights (all 10 tabs)
- **Company Tiers** — 8 tiers, scroll entrance, hover lift, CompanyLogo chips, ghost logo watermark ✅ *updated 2026-04-20*
- **IT Ecosystem** — Framer Motion redesign: scroll entrance, expandable analysis cards, animated money-flow arrows, 🇦🇺/🌏 company split ✅ *2026-04-21*
- **Visa Sponsors** — top 20 companies by 482 volume, CompanyLogo in rankings table ✅ *2026-04-20*
- **Company Compare** — multi-select, 8-row table, SVG radar chart, CompanyLogo in selector + table headers + legend ✅ *2026-04-20*
- **Grad Programs** — live status, deadlines, CompanyLogo, direct application links ✅ *2026-04-20*
- **Career Guide**, **Job Market Charts**, **Salary Checker**, **Skill Map**, **Visa Guide** — all live

### Dashboard & Tracking
- **Personalised Dashboard** — `PersonalisedHero`, readiness score widget, "Your next action" priority logic ✅
- **Visa Journey Tracker** — `/dashboard/visa-tracker` — 6-step 482 tracker, doc checklists, auto-save ✅
- **Readiness Score** — 0–100 ring (resume 25% + skills 25% + quiz 25% + interviews 25%), daily Supabase snapshot ✅

### Learning
- **5 skill paths** — Frontend, Fullstack, Backend, Data Engineer, DevOps/Cloud
- **Spaced repetition** — review intervals, browser notifications, Supabase cross-device sync
- **IBM Learning** — `/learn/ibm` curated content

### Admin
- **Admin panel** — `/admin` — users, comments, job applications stats
- **Admin analytics** — 30-day trends, top pages, countries, devices, AI growth suggestions

### Security (completed)
- Cookie-based session auth on all protected routes (replaced Bearer tokens) ✅ *2026-04-15*
- Fail-closed owner email (no hardcoded fallback) ✅ *2026-04-15*
- Input truncation on all AI routes: `roleTitle` (100 chars), `question` (500), `userAnswer` (800) ✅ *2026-04-21*
- `tsconfig.json` excludes `__tests__` — test type errors cannot block production builds ✅ *2026-04-21*

---

## 🔴 Priority 0 — Blocking Launch

### Stripe Production Launch + ABN Registration
**Blocked on:** external manual steps only. Code is 100% done.

**ABN (do first):**
- [ ] Check visa eligibility — 485/PR/Citizen = OK; 482/Student = check first
- [ ] Gather TFN + passport → apply at abr.gov.au (free, ~15 min)
- [ ] Open separate AU bank account (CommBank / Up / Wise) for business income

**Stripe activation (after ABN):**
- [ ] Activate live mode at dashboard.stripe.com — paste ABN, upload passport, add bank BSB
- [ ] Wait for "Charges enabled" + "Payouts enabled" (1–2 days)
- [ ] Create live product: `TechPath AU Pro` — `$14.99 AUD / month` → copy `price_…` ID
- [ ] Create live webhook → 5 events (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed)
- [ ] Swap 4 Vercel env vars to live keys (Production scope only, keep test for Preview)
- [ ] Smoke test: real card → verify `subscription_tier = 'pro'` in Supabase → refund yourself

**Files already done:** `app/api/stripe/webhook/route.ts`, `lib/subscription.ts`, `app/pricing/page.tsx`

### Remaining Security Items
- [x] 2026-04-29 Add `.limit()` to unbounded queries in `app/api/comments/route.ts` + `app/api/alerts/route.ts`
- [x] 2026-04-29 Fix async `cookies()` in `alerts/route.ts` (Next.js 16 breaking change)
- [x] 2026-04-29 Stripe webhook signature validation tests — `app/api/stripe/webhook/route.test.ts`

---

## 🔴 Priority 1 — Retention Engine

### Readiness Score on Profile Page
- [x] 2026-04-29 Show the 0–100 score ring + breakdown on `/dashboard/profile`
- Small effort (S) — widget already exists as `ReadinessScore` component

### B2B Recruiter / Company Job Posting — `features/recruiter-portal.md`
**Why:** First B2B revenue lever. AU companies pay thousands to reach qualified international IT grads.
- [ ] `/post-a-role` landing page
- [ ] Stripe checkout: $99 AUD per 30-day listing
- [ ] `job_listings` Supabase table — company, role, description, url, expires_at
- [ ] Featured listings at top of `/jobs` page with "Featured" badge
- [ ] Admin approval queue + auto-expiry via Resend email
- **Effort:** M (3–5 days)

---

## 🔴 Priority 2 — AI Quality & Infrastructure

### Gemini Multimodal for YouTube — `features/gemini-multimodal.md`
**Why:** Current YouTube study guides fail on videos without captions. Gemini watches the video directly.
- [ ] Replace `youtube-transcript` + OpenAI with Gemini 1.5 Flash direct video URL input
- [ ] Gains: visual content (slides, code on screen), architecture diagrams, no caption dependency
- [ ] Error handling for long videos (>2h) and music-only content
- **Effort:** S (1–2 days)

### Vercel KV / Redis Caching — `features/vercel-kv-cache.md`
**Why:** AI calls hit Supabase for cache checks. Redis is 50× faster for hot-path lookups.
- [ ] Vercel KV set up via Marketplace (free tier: 256MB)
- [ ] Study guide cache: KV → Supabase fallback
- [ ] Interview questions shared pool cache (same role = same questions, not per-user)
- [ ] Cover letter fragment cache by company+role key
- **Effort:** S (1–2 days)

### Expand Test Coverage
**Current:** 41 tests. Target: critical paths covered.
- [ ] `track` API route (currently swallows errors silently)
- [ ] `gap-analysis` route (pgvector path)
- [ ] `cover-letter` route (streaming)
- [ ] Stripe webhook events (checkout, renewal, cancellation)
- [ ] `AuthProvider` component
- **Effort:** M (3–5 days)

### Phone Remote Control (GitHub mobile + Telegram)
**Why:** Owner needs to dispatch tasks, trigger pipelines, and review status from their phone even when the Mac is off.
- **Files created:** `.github/workflows/phone-task.yml` — free-text task → Claude → PR (implement) or GitHub Issue (investigate); dispatched from GitHub mobile app Actions tab ✅ *2026-04-24*
- **Telegram:** existing plugin (`~/.claude/channels/telegram/`) verified live for interactive control when Mac is on ✅ *2026-04-24*
- **Bookmark targets (phone):** GitHub iOS → henrys-blog → Actions → "Phone Task (Claude on demand)", "Claude Daily Developer", "Daily Posts", "Scrape AU IT Jobs"

---

## 🟡 Priority 3 — Growth

### Navigation Restructure — `features/navigation-redesign.md`
- [ ] Three zones: **Prepare** · **Search** · **Track** (group by user intent, not feature name)
- [ ] Mega-dropdown on desktop, mobile bottom nav (4 icons)
- [ ] Breadcrumbs on all nested pages
- **Effort:** M

### Mobile-First Job Search Redesign — `features/mobile-jobs.md`
- [ ] Swipe-to-save gesture on job cards
- [ ] Sticky search bar with filter bottom-drawer on mobile
- [ ] Minimum 44px touch targets on all action buttons
- [ ] Job detail full-screen modal on mobile
- **Effort:** M

---

## 🟡 Priority 4 — Community & Moat

### Anonymous Job Seeker Network — `features/community-network.md`
**Why:** The feature that makes the platform defensible against AI aggregators.
- [ ] Opt-in anonymous profiles: role, visa type, skills, city
- [ ] `/network` — map/list of active seekers (city + role, no names)
- [ ] Referral matching: "3 people from your background were hired at Atlassian via referral"
- [ ] Direct message (auth-gated, anti-spam)
- **Effort:** XL (2–4 weeks)

### Company Research AI — `features/company-research-ai.md`
- [ ] `/companies/[slug]/research` — AI company brief (culture, news, tech stack, interview style)
- [ ] "Interview battle card" — printable 1-pager per company
- **Effort:** L (1–2 weeks)

---

## 🟢 Priority 5 — Polish

### Traditional Chinese (zh-TW) — `features/i18n-zh-tw.md`
- [ ] `next-intl` installed, ~80 strings: nav, CTAs, onboarding, AU Insights key labels
- [ ] Language toggle in Header (persists to localStorage)
- **Effort:** S (2–3 days)

### Claude Lab — Interactive Terminal — `features/learn-anthropic-claude.md`
- [ ] `@xterm/xterm` terminal at `/learn/claude-lab`
- [ ] 15 missions: Claude Code CLI, API, hooks, tool use
- [ ] XP + badge system
- **Effort:** L (1–2 weeks)

### Known Tech Debt
| Issue | Location | Impact |
|-------|----------|--------|
| `@import` Google Fonts | `app/globals.css:1` | Render-blocking — replace with `next/font` |
| `--text-muted` dark mode contrast | `globals.css:75` | 3.5:1 (fails WCAG) — target `#a09080` |
| No CSP `nonce` | `next.config.ts` | Static CSP — upgrade to dynamic nonce-based |
| Accessible components (ARIA) | Multiple | Keyboard nav, focus rings, `aria-expanded` |
| Core Web Vitals budget | `/jobs`, `/learn` | LCP and CLS not measured yet |

---

## 🛡 Daily Analyst Findings — 2026-04-21

> Small, actionable items surfaced by the daily Opus codebase scan. Grouped by tag.
> Every Priority 0 "Security Hardening Sprint" item above is now complete in code — leaving them unchecked is stale; these new items are the next tier of real risk.

### Security
- [x] Truncate visa-tracker inputs — add `.slice(0,100)` to employer/occupation and ISO-date check on started_at in app/api/visa-tracker/route.ts:45-48 [security] ✅ *2026-04-26*
- [x] Add `.limit(500)` to video_progress select in app/api/learn/progress/route.ts:55 — grows unbounded per user [security] ✅ *2026-04-26*
- [x] Cap `req.json()` payload at 50KB before interpolating into GPT-4o prompt in app/api/analytics/ai-insights/route.ts:24 [security] ✅ 2026-04-27
- [x] Add `checkEndpointRateLimit(admin.id, 'analytics/ai-insights')` to app/api/analytics/ai-insights/route.ts — GPT-4o call is unmetered [security] ✅ 2026-04-27

### Performance / A11y
- [ ] Replace raw `<img>` with `next/image` in components/Comments.tsx:20 — user avatar CLS + bandwidth [perf]

### Style (dark-mode breakage)
- [ ] Replace `#fffbeb` / `#fcd34d` / `#92400e` / `#b45309` with design tokens (var(--gold), var(--parchment), var(--text-secondary)) in app/au-insights/Sponsorship.tsx:31-42 — disclaimer box unreadable in dark mode [style]
- [ ] Replace `background:'#f9fafb'` with `var(--warm-white)` in app/au-insights/Sponsorship.tsx:202 [style]
- [ ] Replace `background:'#fff3f0'` with `var(--warm-white)` and hardcoded colours in app/jobs/page.tsx:208-210 — saved-job pill [style]

### Code Quality
- [ ] Type `loadFromHistory(item: any)` — define CoverLetterHistoryItem interface in app/cover-letter/page.tsx:128 [quality]
- [ ] Replace `status as any` with `Application['status']` union in app/dashboard/page.tsx:110 [quality]
- [ ] Replace `catch (e: any)` with `catch (e)` (or `e: unknown` + narrowing) in app/jobs/page.tsx:399 [quality]
- [ ] Gate `console.log` behind `NODE_ENV !== 'production'` in app/api/jobs/route.ts:259 — leaks job-source counts on every request [quality]
- [ ] Remove duplicated `serverSupabase()` helpers in app/api/comments/route.ts:5 and app/api/comments/[id]/route.ts:5 — use `createSupabaseServer()` from lib/auth-server.ts per AGENTS.md §5.2 [quality]
- [ ] Remove unused .env.example entries: `GEMINI_API_KEY`, `SCRAPERAPI_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_LOGO_DEV_TOKEN` (logo-dev is referenced but token never read server-side) — cross-check against actual `process.env` usage [quality]

### Tests
- [ ] Add Vitest test for /api/gap-analysis — 401 without session, 429 after 5 calls (daily cap), cached response on duplicate jobId [tests]
- [ ] Add Vitest test for /api/cover-letter — 401 without session, 403 SUBSCRIPTION_REQUIRED without active plan [tests]
- [ ] Add Vitest test for /api/visa-tracker — GET 401 without auth, POST rejects oversized employer/occupation strings [tests]

---

## 🛡 Daily Analyst Findings — 2026-04-22

> Fresh items from today's Opus scan — items already in TODO.md are not duplicated here.
> `npm run audit` = 0 vulns; `tsc --noEmit` = clean. Major surface areas now: dark-mode hex leakage in `/dashboard` + `/jobs`, untyped `any` drift in API routes, and several route handlers still wiring their own Supabase client (AGENTS §5.2 violation).

### Security
- [x] Validate YouTube videoId with `/^[A-Za-z0-9_-]{11}$/` before Supabase lookup + RapidAPI POST in app/api/learn/video-meta/route.ts:7-8 — currently any string is accepted [security] ✅ *2026-04-26*
- [x] 2026-04-30 Truncate `videoTitle` (`.slice(0,200)`) and `studyGuide.summary/coreInsights/keyConcepts` before OpenAI prompt in app/api/learn/quiz/route.ts:23,48-49,51 — untrusted strings interpolated raw [security] ✅
- [ ] Add `frame-ancestors 'none'` and `form-action 'self'` to CSP in next.config.ts:42-52 — defense-in-depth against clickjacking + form hijack beyond X-Frame-Options [security]
- [ ] Check error return on `post_comments.delete()` and `profiles.update()` in app/api/admin/users/[id]/route.ts:57-58 — ban currently silent-fails if either statement errors [security]

### Style (dark-mode breakage)
- [ ] Replace hardcoded status colour map `#3b82f6`/`#f59e0b`/`#10b981`/`#ef4444`/`#6b7280` with tokens (var(--terracotta)/var(--gold)/var(--jade)/var(--vermilion)/var(--text-muted)) in app/dashboard/page.tsx:44-48 + 141-143 [style]
- [ ] Replace `#fcc`/`#fff0f0`/`#c00` Remove-pill with `var(--vermilion)` + `rgba(232,64,64,0.12)` in app/dashboard/page.tsx:270-271, 309 [style]
- [ ] Replace `#fef3c7`/`#d97706`/`#fde68a` apply-pill with `var(--gold)` + `var(--warm-white)` tokens in app/dashboard/page.tsx:351 [style]
- [ ] Replace `borderLeft: '3px solid #8b5cf6'` with a token (or `var(--gold)`) in app/dashboard/page.tsx:187 — visa-tracker card border [style]
- [ ] Replace `#fff0f0`/`#fcc`/`#c00` error alert with `var(--vermilion)` + `rgba(232,64,64,0.12)` in app/jobs/page.tsx:616 [style]
- [ ] Replace `color: '#16a34a'` with `var(--jade)` in app/jobs/page.tsx:654 (Alert saved confirmation) [style]
- [ ] Replace `color: '#fbbf24'` with `var(--gold)` in app/jobs/page.tsx:753 (Track-it link in apply toast) [style]
- [ ] Replace `#f0fdf4`/`#86efac` completed-state card with `var(--jade)` tokens in components/OnboardingModal.tsx:131 [style]

### Code Quality
- [ ] Replace `catch (err: any)` with `catch (err)` + unknown narrowing in components/Comments.tsx:225 [quality]
- [ ] Type `any[]` / `(r: any)` in app/api/jobs/route.ts:59, 185 — define AdzunaHit/JSearchHit interfaces [quality]
- [ ] Replace `Record<string, any>` result cast with a `ResumeAnalysis` interface in app/api/resume-analyse/route.ts:107 [quality]
- [ ] Consolidate local `adminSupabase()` / `getClient()` / `requireAdmin()` helpers — replace with `createSupabaseServer()` + a shared `requireAdmin()` in `lib/auth-server.ts` across app/api/admin/users/[id]/route.ts:5, app/api/visa-tracker/route.ts:5, app/api/analytics/ai-insights/route.ts:7 [quality]

### Tests
- [ ] Add Vitest test for /api/log-error — 429 after 10 POSTs from same IP in 60s, silent 200 on Supabase insert failure, 500-char truncation on message [tests]
- [ ] Add Vitest test for /api/admin/users/[id] — 403 without admin role, PATCH rejects invalid role enum, DELETE blocks self-ban [tests]
- [ ] Add Vitest test for /api/alerts — DELETE id ownership check rejects another user's alert (PGRST affected-rows = 0) [tests]
- [ ] Add Vitest test for /api/learn/progress — POST 401 without session, upsert on `(user_id, video_id)` conflict preserves prior quiz_score [tests]

---

## 📊 Priority Rationale

| # | Feature | Retention | Revenue | Differentiation | Effort |
|---|---------|-----------|---------|-----------------|--------|
| 0 | Stripe live launch | — | ★★★★★ | — | External only |
| 1 | B2B job posting | — | ★★★★★ | ★★★ | M |
| 2 | Gemini multimodal | ★★★ | — | ★★★★ | S |
| 3 | Redis caching | ★★★ | ★★ | — | S |
| 4 | Nav restructure | ★★★ | — | ★★ | M |
| 5 | Mobile jobs UX | ★★★★ | — | ★★ | M |
| 6 | Community network | ★★★★★ | ★★★★ | ★★★★★ | XL |
| 7 | Company research AI | ★★★★ | ★★★ | ★★★★ | L |

S = 1–2 days · M = 3–5 days · L = 1–2 weeks · XL = 2–4 weeks

---

## Employer-Impressiveness Checklist

- [x] SSR with streaming AI responses
- [x] Row-Level Security on all user data
- [x] CI gate (audit + tests + build) before every deploy
- [x] Proper cookie-based auth (no client-side secrets)
- [x] Analytics without third-party trackers
- [x] pgvector (gap engine)
- [x] Test suite (41 tests, 8 files)
- [ ] Test coverage on all critical paths (Stripe, streaming, auth)
- [ ] Edge caching strategy (Vercel KV)
- [ ] Accessible components (ARIA, keyboard nav)
- [ ] Core Web Vitals green (Lighthouse ≥ 90)
- [ ] TypeScript strict mode — no `any` without justification
- [ ] Error boundary on every page
