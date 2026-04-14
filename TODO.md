# TODO — Henry Blog Feature Backlog

Last updated: 2026-04-14
Product vision: The definitive career platform for international IT graduates entering the Australian job market.

---

## ✅ Done — Full Feature Inventory

### Core Infrastructure
- **Auth** — GitHub OAuth + Supabase SSR, RLS everywhere
- **Stripe** — checkout, portal, webhook, subscription gate
- **Pre-push quality gate** — `npm run check` (audit + build), GitHub Actions CI
- **Sitemap + robots.txt** — SEO ready
- **RSS feed** — `/feed.xml` — blog + digests + githot, auto-discovered
- **OG images** — site-wide + per blog post (`next/og`, 1200×630)
- **Analytics** — `/admin/analytics` — page views, countries, devices, AI growth suggestions

### Blog & Content
- **Blog** — MDX posts, reading time, tag chips, AI badge on auto-generated posts
- **Daily AI Digest** — `/digest` — auto-generated daily summaries
- **GitHub Hot** — `/githot` — trending repos daily
- **Blog search + filters** — client-side, title + tag
- **Comments** — auth-gated, per-post, admin moderation

### Career Tools
- **Resume Analyser** — PDF upload, Claude AU recruiter prompt, score ring, action items
- **Cover Letter Generator** — GPT-4.1, 4-paragraph AU structure, streaming, inline edit
- **Job Search** — JSearch API, working rights filter, freshness colours, save/apply
- **Interview Prep** — streaming Alex mentor, question sidebar, score debrief, company career links
- **Interview questions cache** — 24h localStorage cache, "New Questions" clears cache
- **Interview company pages** — AU careers URLs for 25 companies
- **Page state persistence** — jobs results 10min cache, interview questions 24h cache
- **Interview Prep v2** — Universal Questions (8 AU-specific hardcoded Qs), Reality Check stage (6-stage flow: scene→why→guide→reality→practice→debrief), follow-up question streamed in debrief, Company Intel for 10 companies (expandable on role cards + injected into mentor prompts), Post-Interview Toolkit (Summary/Email/Rejection/Negotiation tabs), Networking Hub at `/interview-prep/networking`
- **YouTube learn** — 20 channels (added WebDevSimplified, Boot.dev), pagination fix (POST body cache bug), transcript smart sampling (6-language fallback, 30/50/20% windowed sampling)
- **Jobs page** — stale closure fix, category filter in useCallback deps, `<Link>` for internal nav, quick-start pill fix
- **Performance & quality** — dark mode contrast fixed (#a09080 both blocks), YouTube thumbnails via `next/image`, video study page SSR split (instant load for cached guides)

### AU Insights (10 tabs)
- **Company Tiers** — 8 tiers, Framer scroll entrance, hover lift, favicon chips, ghost logo
- **IT Ecosystem** — 4-layer AU IT map
- **Career Guide** — full guide, palette-themed
- **Visa Sponsors** — top 20 companies by 482 volume
- **Job Market Charts** — ABS/ACS/QILT data
- **Salary Checker** — AI verdict vs ACS benchmarks + negotiation script
- **Grad Programs** — live status, deadlines, favicons, direct application links
- **Skill Map** — OR-group matching, animated bars, company chips
- **Visa Guide** — 6-step 482/SID stepper, "Track my journey →" CTA
- **Company Compare** — multi-select, 8-row table, SVG radar chart
- **Company detail pages** — `/au-insights/companies/[slug]` — tier, culture, interview questions

### Dashboard & Tracking
- **Dashboard** — saved jobs, applications pipeline, job alerts, career tools cards
- **Visa Journey Tracker** — `/dashboard/visa-tracker` — 6-step personal 482 tracker, doc checklists, auto-save
- **Career Tools cards** — Resume Analyser, Interview Prep, AU Insights, Visa Tracker

### Learning
- **5 skill paths** — Frontend, Fullstack, Backend, Data Engineer, DevOps/Cloud
- **Spaced repetition** — review intervals, browser notifications
- **Supabase progress sync** — skill_progress table, cross-device
- **YouTube Learning** — `/learn/youtube` — channel browse, Gemini study guide, quiz, NotebookLM panel
- **IBM Learning** — `/learn/ibm` curated content

### Admin
- **Admin panel** — `/admin` — users, comments, job applications stats
- **Admin analytics** — 30-day trends, top pages, countries, devices, AI growth suggestions

---

## 🔴 Priority 0 — In Progress

### ✅ 0.2 Yin-Yang Dark Mode Toggle
**What:** Circular yin-yang SVG toggle button. CSS `transition: transform` on accumulated rotation state — smooth 180° spin on click, no snap-back. Fill colours cross-fade at spin midpoint. Comic panel shadow adapts to theme.
**Files:** `components/ThemeToggle.tsx`, `app/globals.css`

---

### ✅ 0.1 Comic Book Card Animation — Interview Prep Tool Cards
**What:** 4 full-width stacked comic cards (Resume Analyser, Cover Letter, Interview Prep, Networking Hub). Hard ink border, offset box-shadow, hover tilt `rotate(-1.5deg) translateY(-9px)` + vermilion shadow. Dot halftone panel. Framer `whileTap` for mobile.
**Files:** `app/interview-prep/InterviewPrepClient.tsx`, `app/globals.css`

---

### ✅ 0. Interview Prep Landing Page Redesign + Progress Tracking
**Why now:** The `/interview-prep` page is static cards with no user context. Users have no idea how far they've come. Layout should match the polished `/learn` page pattern with Framer Motion animations.

**What gets built:**
- Split `app/interview-prep/page.tsx` into server component (metadata) + `app/interview-prep/InterviewPrepClient.tsx` (interactive)
- **Tool cards** — same dark-gradient style as `/learn` (YouTube/GitHub/Claude Code cards): Resume Analyser, Cover Letter, Interview Prep, Networking Hub. Each card shows live progress (resume count, cover letter count, XP/level, networking %).
- **Hover + touch animations** — Framer Motion `whileHover` + `whileTap` + `whileFocus` on every card. Works on mobile (touch = same animation as hover).
- **"How it works" accordion** — Framer `AnimatePresence` expand/collapse. Each step has a `CartoonArrow` component: animated dashed SVG line + bouncing arrowhead in the Eastern Ink comic style.
- **"Practice by Role" section** — Collapsed by default (compact pill list). Click/tap to reveal full role cards with stagger entrance animation. `AnimatePresence` for smooth expand. Feels like an interactive game level-select.
- **Progress data sources:** `profiles.interview_xp` + `profiles.interview_level` (Supabase), `resume_analyses` count (Supabase), `usage_records` for cover-letter (Supabase), networking % from `localStorage` key `networking-30day-checklist`.

**Files:**
- `app/interview-prep/page.tsx` — slim down to server metadata wrapper
- `app/interview-prep/InterviewPrepClient.tsx` — NEW client component (main UI)
- `app/api/dashboard/summary/route.ts` — may need new fields for interview/resume counts

**Acceptance criteria:**
- [x] Tool cards match `/learn` visual style (dark gradient, glow, progress pill)
- [x] `whileHover` scale + glow runs on desktop; same scale on mobile tap (`whileTap`)
- [x] `CartoonArrow` animates on mount: dashed line draws in, arrowhead bounces
- [x] "Practice by Role" expands/collapses with stagger animation
- [x] Progress numbers load from Supabase (skeleton while loading, graceful if unauthenticated)
- [x] `npm run check` passes clean

---

## 🔴 Priority 1 — The Connective Tissue (Retention Engine)

These features tie everything together into a coherent product. Without them, every tool is an island.

### ✅ 1. Smart Onboarding Flow — `features/onboarding-flow.md`
- [x] Onboarding modal on first login (target role, visa status, job search stage) — `components/OnboardingModal.tsx`
- [x] Persist `onboarding_profile` to `profiles` table — `app/api/onboarding/route.ts`
- [x] Triggered from `AuthProvider` on first login; never shown again after completion
- [x] `supabase/012_onboarding.sql` migration

### ✅ 2. Personalised Dashboard Homepage — `features/personalised-dashboard.md`
- [x] Logged-in `/`: `HomepageHero` → `PersonalisedHero` — greeting, next action card, today strip
- [x] Logged-out `/`: `PublicHero` — targeted hero with emotional copy + CTAs
- [x] Readiness Score widget in dashboard page + `ReadinessScoreMini` in Header
- [x] "Your next action" priority logic (visa step → review due → stale resume → jobs)

### 3. Job-to-Gap Engine — `features/gap-engine.md`
**Why now:** The single feature that makes every other feature more valuable.
- [ ] `supabase/012_embeddings.sql` — `pgvector` extension, `resume_embedding` on profiles
- [ ] `POST /api/gap-analysis` — embed JD, cosine similarity vs resume, cross-ref completed skills
- [ ] Gap results: ✅ matched skills, ❌ missing skills → linked to learning paths + YouTube
- [ ] "Analyse this job" button on every job search result card
- [ ] Saves analysis history per user

### ✅ 4. Readiness Score — `features/readiness-score.md`
**Why now:** Creates a measurable goal users chase daily. Drives retention.
- [x] Score 0–100 composed of: resume quality (25%) + skill completion (25%) + quiz scores (25%) + interview sessions (25%)
- [x] Shown on dashboard as a ring/gauge
- [x] Breakdown with detail labels per component (`ReadinessScore` widget)
- [x] Score persisted + historicised in Supabase (`readiness_snapshots` table, daily upsert)
- [x] `ReadinessScoreMini` ring around avatar in Header for logged-in users
- [ ] Displayed on profile page

---

## 🔴 Priority 2 — AI Quality & Infrastructure

### 5. Gemini Multimodal for YouTube — `features/gemini-multimodal.md`
**Why now:** Current YouTube study guides use transcript-scraping + OpenAI. Fails on videos without captions. Misses diagrams, code on screen. Gemini watches the video directly.
- [ ] Replace `youtube-transcript` + OpenAI with Gemini 1.5 Flash direct video URL input
- [ ] Remove `youtube-transcript` package
- [ ] Study guides gain: visual content (slides, code), architecture diagrams, on-screen demos
- [ ] Error handling for long videos (>2h) and music-only content

### 6. Vercel KV Caching Layer — `features/vercel-kv-cache.md`
**Why now:** Expensive AI calls (study guides, cover letters, quiz generation) hit Supabase for cache checks. Redis is 50× faster for cache lookups.
- [ ] Vercel KV set up (free tier: 256MB)
- [ ] Video study guide cache: KV → Supabase fallback
- [ ] Interview questions shared cache: same role = same questions pool (not per-user)
- [ ] Cover letter template fragments cached by company+role key
- [ ] Cache TTL management: study guides (7d), questions (24h), cover letter fragments (1h)

### 7. Integration Test Suite — `features/test-suite.md`
**Why now:** 89 source files, zero tests. One silent failure in `/api/track` already swallows errors. Critical for employer credibility.
- [ ] Vitest + @testing-library/react installed
- [ ] 8 critical API route tests: track, gap-analysis, cover-letter, interview/questions, resume-match, visa-tracker, analytics/summary
- [ ] 3 critical component tests: AuthProvider, Analytics beacon, PathTracker
- [ ] CI: test step added before build in GitHub Actions

---

## 🟡 Priority 3 — Growth & Monetisation

### 8. B2B Recruiter / Company Job Posting — `features/recruiter-portal.md`
**Why now:** First B2B revenue lever. AU companies spend thousands to reach qualified international IT grads. You have exactly that audience.
- [ ] `/post-a-role` public landing page explaining the offering
- [ ] Stripe checkout: $99 AUD per job post, 30-day listing
- [ ] `job_listings` table (Supabase) — company, role, description, url, expires_at
- [ ] Listed roles appear at top of `/jobs` page with "Featured" badge
- [ ] Admin approval queue before going live
- [ ] Auto-expiry and renewal email via Resend

### 9. Navigation Restructure — `features/navigation-redesign.md`
**Why now:** 10 AU Insights tabs + top nav + dashboard = users are lost. PM insight: group by verb.
- [ ] Three zones: **Prepare** (Resume → Skills → Interview → Cover Letter) · **Search** (Jobs → Companies → AU Insights) · **Track** (Dashboard → Visa → Applications)
- [ ] New top nav with zone groupings + mega-dropdown on desktop
- [ ] Mobile bottom nav: 4 icons (Home, Search, Prepare, Dashboard)
- [ ] Breadcrumbs on all nested pages

### 10. Mobile-First Job Search Redesign — `features/mobile-jobs.md`
**Why now:** International grads browse jobs on mobile (commute, campus). Current job cards are desktop-optimised.
- [ ] Swipe-to-save gesture on job cards
- [ ] Sticky search bar with filter sheet (bottom drawer on mobile)
- [ ] Minimum 44px touch targets on all action buttons
- [ ] Job detail full-screen modal on mobile (not new page)
- [ ] "Apply later" vs "Apply now" quick action strip

---

## 🟡 Priority 4 — Community & Network

### 11. Anonymous Job Seeker Network — `features/community-network.md`
**Why now:** International grads are isolated. LinkedIn doesn't surface "who else is looking in Brisbane right now?" The referral network is your moat.
- [ ] Opt-in anonymous profiles: role seeking, visa type, skills, city
- [ ] `/network` — map/list of active job seekers in AU (city + role, no names)
- [ ] Referral matching: "3 people from your background were hired at Atlassian via referral"
- [ ] Direct message (auth-gated, anti-spam) — connect with people in similar situations
- [ ] This is the feature that makes the platform defensible against AI aggregators

### 12. Employer / Company Research AI — `features/company-research-ai.md`
**Why now:** Users prep for interviews but don't have a way to deep-dive a company before applying.
- [ ] `/companies/[slug]/research` — AI-generated company brief (culture, recent news, tech stack, interview style)
- [ ] Pulls from: company blog RSS, LinkedIn (scraped carefully), Glassdoor deeplinks, earnings calls
- [ ] "Interview battle card" — printable 1-pager per company
- [ ] Connects to interview prep: "Prepare for your Atlassian interview →"

---

## 🟢 Priority 5 — Polish & Completeness

### ✅ 13. Framer Motion — remaining AU Insights tabs
- [x] Skill Map — animate match bars with `whileInView`
- [x] Company Compare — SVG radar `motion.polygon` scale-in on load
- [x] Grad Programs — card entrance stagger on tab reveal

### ✅ 14. Interview Session Share Card
- [x] PNG share card at `GET /api/interview/share-card` (ImageResponse, 1200×630)
- [x] Download button + LinkedIn share in summary tab

### ✅ 15. Reading Progress Bar
- [x] Thin scroll-progress bar at top of all blog post pages
- [x] Pure CSS `animation-timeline: scroll()` — no JS needed

### ✅ Visual Intelligence — AI Diagram Features
- [x] E — Resume Radar Chart (5-axis SVG, Framer Motion scale-in) in resume analyser
- [x] B — Concept Diagram Generator (GPT-4o-mini → Mermaid.js SVG, localStorage cache) in skill cards
- [x] D — Personalised Roadmap Diagram (GPT-4o-mini → Mermaid.js SVG, localStorage cache) in dashboard hero
- [x] C — Interview Score Card PNG (Next.js ImageResponse / Satori)

### ✅ Job Scraper — Expanded AU IT Job Coverage
- [x] `scraped_jobs` Supabase table — `supabase/017_scraped_jobs.sql`, 30-day TTL
- [x] `scripts/scrape-au-jobs.ts` — Jora (au.jora.com) HTML scraping, ACS RSS, Indeed best-effort
- [x] 9 IT keywords × 5 AU cities = up to 675 Jora results per run, deduplicated
- [x] Integrated into `/api/jobs` — merge priority: JSearch → scraped → Adzuna
- [x] Source badges in `/jobs` page: Jora, ACS, Indeed
- [x] Daily cron via `.github/workflows/scrape-jobs.yml` (6am AEST)
- [x] `npm run scrape:jobs` script

### ✅ Database Migrations — All Schemas Applied
- [x] `018_fix_missing_schema.sql` — applied `skill_progress` (blocked by invalid SQL in 003), `page_views` (blocked by non-IMMUTABLE index in 010)
- [x] All 18 tables verified present via Supabase CLI (`supabase db query --linked`)
- [x] Supabase CLI workflow established: `supabase db query --linked -f supabase/XXX.sql`

### 16. Traditional Chinese (zh-TW) — `features/i18n-zh-tw.md`
- [ ] `next-intl` installed
- [ ] ~80 strings translated: nav, CTAs, onboarding, AU Insights key labels
- [ ] Language toggle in header — persists to localStorage

### 17. Claude Lab — Interactive Terminal — `features/learn-anthropic-claude.md`
- [ ] `@xterm/xterm` terminal embedded in `/learn/claude-lab`
- [ ] 15 missions: Claude Code CLI, API, hooks, tool use
- [ ] XP + badge system
- [ ] The flagship "impress a recruiter" demo feature

---

## 📊 Priority Rationale

| # | Feature | Retention | Revenue | Differentiation | Effort |
|---|---------|-----------|---------|-----------------|--------|
| 1 | Onboarding flow | ★★★★★ | — | ★★★ | S |
| 2 | Personalised dashboard | ★★★★★ | — | ★★★★ | M |
| 3 | Gap Engine | ★★★★★ | ★★★ | ★★★★★ | L |
| 4 | Readiness Score | ★★★★ | — | ★★★★ | S |
| 5 | Gemini multimodal | ★★★ | — | ★★★★ | S |
| 6 | Vercel KV cache | ★★★ | ★★ | — | S |
| 7 | Test suite | — | — | ★★★★★ | M |
| 8 | B2B job posting | — | ★★★★★ | ★★★ | M |
| 9 | Nav restructure | ★★★ | — | ★★ | M |
| 10 | Mobile jobs UX | ★★★★ | — | ★★ | M |
| 11 | Community network | ★★★★★ | ★★★★ | ★★★★★ | XL |
| 12 | Company research AI | ★★★★ | ★★★ | ★★★★ | L |

S = 1–2 days · M = 3–5 days · L = 1–2 weeks · XL = 2–4 weeks

---

## Employer-Impressiveness Checklist

Things a senior engineer or hiring manager will look at:

- [x] SSR with streaming AI responses
- [x] Row-Level Security on all user data
- [x] Pre-push CI gate (audit + build)
- [x] Proper auth pattern (no client-side secrets)
- [x] Analytics without third-party trackers
- [ ] Test coverage on critical paths
- [ ] Vector embeddings (pgvector)
- [ ] Edge caching strategy
- [ ] Accessible components (ARIA, keyboard nav)
- [ ] Performance budget (Core Web Vitals green)
- [ ] TypeScript strict mode throughout
- [ ] Error boundary on every page
