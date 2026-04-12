# TechPath AU — Henry's Digital Life

A production career platform for international IT graduates entering the Australian job market. Built with Next.js 16 App Router, Supabase, and Anthropic Claude.

Live at [henrys-blog.vercel.app](https://henrys-blog.vercel.app)

---

## What it is

**TechPath AU** is not a blog with tools bolted on. The primary product is a suite of AI-powered career tools designed specifically for international students and 482/485/PR applicants in Australian tech roles:

| Tool | What it does |
|------|-------------|
| **Resume Analyser** | PDF upload → Claude AU recruiter prompt → score ring + action items |
| **Cover Letter Generator** | GPT-4.1 streaming, 4-paragraph AU structure, inline edit |
| **Interview Prep** | AI mentor Alex Chen, 8 tech roles + Universal Questions bank, 6-stage flow (scene → why → guide → reality → practice → debrief), XP gamification, post-interview toolkit |
| **Job Search** | JSearch API, working rights filter, save/apply, freshness colours |
| **Visa Journey Tracker** | Personal 482 step tracker, doc checklists, auto-save |
| **AU Insights** | 10 tabs: company tiers, salary checker, grad programs, skill map, visa guide, company compare |
| **Learning Paths** | 5 skill paths (Frontend, Fullstack, Backend, Data Eng, DevOps), spaced repetition, YouTube study guides |
| **Claude Code Lab** | 4-level interactive guide (Foundation → Core → Power User → Master), 20+ lessons, localStorage progress |
| **Readiness Score** | 0–100 composite score: resume (25%) + skills (25%) + interview XP (25%) + quiz scores (25%) |
| **Onboarding Flow** | 3-question modal on first login → personalises dashboard, learning paths, and interview prep |

The personal blog (writing, AI digest, GitHub Hot, visa news) is a content moat that drives SEO — not the core product.

---

## Design system

**Eastern Ink × Comic Panel** — Rice Paper & Ink (light mode) / Night Market & Lanterns (dark mode).

- Hard-offset comic-book shadows (`var(--panel-shadow)`)
- `Lora` serif headings · `Space Grotesk` UI · `Caveat` handwritten accents
- CSS custom properties throughout — zero Tailwind, zero CSS Modules
- Yin-yang SVG dark mode toggle with smooth 180° CSS rotation

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | **Next.js 16.2** — App Router, Turbopack, TypeScript strict |
| Auth & DB | **Supabase** — PostgreSQL + Row-Level Security + GitHub OAuth |
| AI | **Anthropic Claude** (Haiku for pipelines, Sonnet for interactive) |
| Animations | **Framer Motion** — `whileHover`, `whileTap`, `AnimatePresence` |
| Styling | CSS custom properties + inline styles (no Tailwind) |
| Content | Markdown in `content/` — `gray-matter`, `rehype-pretty-code` |
| Payments | **Stripe** — checkout, portal, webhook, subscription gate |
| Deploy | **Vercel** + GitHub Actions CI gate (`npm audit` + `next build`) |

---

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Required environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI
ANTHROPIC_API_KEY
OPENAI_API_KEY

# Job search
JSEARCH_API_KEY

# Stripe (optional — needed for subscription features)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# App
NEXT_PUBLIC_APP_URL
```

---

## Content pipelines

```bash
npm run digest   # fetch + Claude-filter + summarise AI research → publishes post
npm run githot   # fetch + Claude-analyse trending GitHub repos → publishes post
```

Both auto-commit and push to trigger a Vercel deploy.

---

## Quality gate

```bash
npm run check   # npm audit --audit-level=moderate && next build
```

Enforced by:
1. `.git/hooks/pre-push` — install via `sh scripts/setup-hooks.sh`
2. GitHub Actions `check` job in `.github/workflows/deploy.yml` — deploy is gated on it

---

## Database

Migrations live in `supabase/` — numbered, append-only.

Key tables: `profiles` (onboarding, XP, readiness), `resume_analyses`, `job_applications`, `cover_letters`, `skill_progress`, `visa_tracker`, `api_usage`, `readiness_snapshots`, `video_progress`, `comments`.

All user tables have RLS enabled — users can only read and write their own rows.

---

## Project structure

```
app/
  page.tsx                  — Homepage (personalised hero for logged-in, public hero for guests)
  dashboard/                — Saved jobs, applications pipeline, readiness score
  interview-prep/           — Landing page + [role] session + networking hub
  learn/                    — 5 skill paths + YouTube study + Claude Code Lab
  au-insights/              — 10 AU market intelligence tabs
  jobs/                     — Job search + save/apply
  resume/                   — Cover letter generator

components/
  OnboardingModal.tsx       — 3-step first-login flow
  PersonalisedHero.tsx      — Logged-in homepage: next action + today strip
  PublicHero.tsx            — Logged-out homepage: targeted AU IT grad hero
  ReadinessScore.tsx        — SVG ring + breakdown bars + daily snapshot
  ThemeToggle.tsx           — Yin-yang SVG toggle, smooth CSS rotation

lib/
  interview-roles.ts        — Role definitions, company intel, XP values
  universal-questions.ts    — 8 hardcoded AU-specific interview questions
  subscription.ts           — Rate limiting, usage recording

supabase/
  001–016_*.sql             — Append-only migrations
```

---

## Employer-impressiveness checklist

- [x] SSR with streaming AI responses
- [x] Row-Level Security on all user data
- [x] Pre-push CI gate (audit + build)
- [x] Proper auth pattern (no client-side secrets)
- [x] Analytics without third-party trackers
- [x] Rate limiting on all AI endpoints
- [x] Spaced repetition algorithm
- [x] Supabase RLS + service-role separation
- [ ] Integration test suite (Vitest — next priority)
- [ ] pgvector embeddings for job-to-skill gap analysis
- [ ] Edge caching strategy (Vercel KV)
