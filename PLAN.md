# TechPath AU — Product Roadmap
Last updated: 2026-04-12

## What was just shipped (Interview Prep v2)

All 5 features from the interview prep deep enhancement are live:

1. **Australian Universal Questions** — 8 hardcoded AU-specific questions at `/interview-prep/universal`. No OpenAI call, handcrafted visa/salary/culture content. Card appears first in the role grid with "Start here" badge.
2. **Reality Check stage** — 6-stage flow (scene → why → guide → **reality** → practice → debrief). Alex warns about common mistakes international candidates make.
3. **Follow-up question in debrief** — After AI feedback streams, Alex generates a probing follow-up question simulating what a real interviewer would ask next.
4. **Company Interview Intel** — COMPANY_INTEL data for 10 companies (Atlassian, Canva, REA, CBA, ANZ, Telstra, Xero, Seek, Afterpay, NAB) — expandable on role cards, injected into mentor prompts.
5. **Post-Interview Toolkit** — Session complete now has 4 tabs: Summary (score breakdown), Follow-up Email (AU-etiquette template), Rejection Handling (feedback request template + stats), Offer Negotiation (AU salary benchmarks + what's negotiable + scripts).
6. **Networking Hub** — `/interview-prep/networking` — LinkedIn templates, GitHub checklist, AU tech meetup map (4 cities), 15 AU workplace culture tips, 30-day action plan with localStorage-backed checkboxes.

---

## Next priority order

### P1 — Retention engine (highest leverage)

These three features together create a "sticky loop" that brings users back daily:

#### 1. Smart Onboarding Flow
**File:** `docs/feature-onboarding.md` (TBD)
- 3-question modal on first login: target role, visa status, job search stage
- Persist to `profiles` table (`onboarding_profile` JSONB column)
- Used by personalised dashboard + learning path pre-selection
- **Why first:** Without this, every other personalisation feature lacks the signal it needs

#### 2. Personalised Dashboard + Readiness Score
**Files:** `components/PersonalisedHero.tsx`, `components/ReadinessScore.tsx`, `app/dashboard/page.tsx`
- Readiness score 0–100 (resume quality 25% + skills 25% + quiz scores 25% + interview sessions 25%)
- "Your next action" card — one prioritised daily suggestion
- Score stored as daily snapshot in Supabase
- **Why second:** The score gives users a number to chase. Drives daily return.

#### 3. Job-to-Gap Engine
**Files:** `app/api/gap-analysis/route.ts` (new), `supabase/016_pgvector.sql` (new)
- pgvector: embed JD → cosine similarity vs resume → missing skills → linked to learning paths
- "Analyse this job" button on every job card
- **Why third:** Ties resume, skills, jobs, and interview prep into one coherent workflow

---

### P2 — AI quality improvements

#### 4. Gemini Multimodal for YouTube
Replace transcript scraping + OpenAI with Gemini 1.5 Flash video URL input. Gains: visual content (slides, code on screen), diagrams, no caption dependency.

#### 5. Integration Test Suite
Vitest + 8 API route tests + 3 component tests. CI gates on test pass before build. Critical for credibility on the GitHub portfolio.

---

### P3 — Growth

#### 6. B2B Job Posting ($99 AUD/listing)
`/post-a-role` → Stripe checkout → `job_listings` table → "Featured" badge in `/jobs`. First B2B revenue lever.

#### 7. Navigation Restructure
Three zones: **Prepare** · **Search** · **Track**. Mobile bottom nav. Breadcrumbs.

#### 8. Interview Session Share Card
PNG share card on session complete (role, score, "Alex certified"). One-click LinkedIn share.

---

### P4 — Community

#### 9. Anonymous Job Seeker Network
Opt-in anonymous profiles + city/role map. Referral matching. The moat feature.

---

## Active tech debt to track

| Issue | File | Status |
|-------|------|--------|
| `@import` Google Fonts | `app/globals.css:1` | Not yet fixed — render-blocking |
| `images: { unoptimized: true }` | `next.config.ts:4` | Partially fixed (remotePatterns added for YouTube) |
| No integration tests | — | Planned in P2 |
| `<a href>` for internal nav | Various components | Mostly fixed; audit occasionally |
| No middleware auth guard | `proxy.ts` handles it | Confirmed: `proxy.ts` covers dashboard + admin |
