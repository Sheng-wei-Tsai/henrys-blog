# TODO — Henry Blog Feature Backlog

Last updated: 2026-04-08

---

## 🏃 In Progress / Next Up

### 2. ~~Upgrade cover letter model~~ ✅
- Upgraded both `cover-letter` and `resume-match` routes from `gpt-4o` → `gpt-4.1`
- Tightened system prompts: 4-paragraph structure, AU English rules, banned buzzwords, scoring guide
- Inline editing + copy-edits already built

### 3. ~~Learning platform — Supabase sync~~ ✅
- Already fully implemented: PathTracker reads/writes `skill_progress` on mount + every tick
- localStorage fallback for guests in both PathTracker and PathProgress
- `/learn` index shows `X / Y topics` via PathProgress component

---

## 🔨 AU Insights — Remaining Work

### 4. Framer Motion — extend animations beyond Company Tiers ✅ (Tiers done)
- [ ] Skill Map — animate match bars with `motion` on `whileInView`
- [ ] Company Compare — radar chart draws in on load (SVG `pathLength` animation)
- [ ] Visa Guide — step expand/collapse with `AnimatePresence`
- [ ] Grad Programs — card entrance stagger on tab reveal

### 5. Visa Journey Tracker — `features/visa-journey-tracker.md`
**Why:** Public VisaGuide tab is built. Personal auth-gated tracker is the logical next step.
- [ ] `supabase/007_visa_tracker.sql` — user progress table
- [ ] `app/api/visa-tracker/route.ts` — save/load progress
- [ ] `app/dashboard/visa-tracker/page.tsx` — step-by-step tracker with date inputs + doc checklists
- [ ] Dashboard card linking to it
- [ ] Link from VisaGuide tab: "Track your journey →"

### 6. Framer — Company Tiers chip interaction polish
- [ ] Ghost logo: increase size on high-res displays (srcset or `sz=128`)
- [ ] Tier card: add subtle gradient shimmer on hover for God/S+ tiers

---

## 🚀 New Features (High Impact)

### 7. Open Graph images — `features/site-ux.md`
**Why:** LinkedIn shares show blank preview. LinkedIn = primary growth channel for AU dev blog.
- [ ] `app/opengraph-image.tsx` — site-wide OG (name + tagline + palette)
- [ ] `app/blog/[slug]/opengraph-image.tsx` — per-post OG with title + date

### 8. Blog search + filters — `features/blog-content.md`
**Why:** Growing content library with no way to navigate it.
- [ ] Client-side search/filter on `/blog` (title + tag, no backend)
- [ ] "AI-generated" badge on digest/githot posts
- [ ] Estimated reading time (package already installed)

### 9. Learning streaks + new paths — `features/learning-platform.md`
Depends on #3 (Supabase sync) first.
- [ ] Daily streak counter (`last_active_date` + `streak_days` in Supabase)
- [ ] Streak display on `/learn` index
- [ ] Data Engineer path (8+ topics)
- [ ] DevOps/Cloud path (8+ topics)

### 10. Jobs — working rights filter — `features/job-search.md`
**Why:** 485 visa holders need sponsorship-friendly roles.
- [ ] "Full Working Rights Only" toggle in job search
- [ ] Persist filter to localStorage

### 11. Interview prep — company career links — `features/interview-prep.md`
- [ ] Map companies → AU careers page URLs in `lib/interview-roles.ts`
- [ ] Company pills → `<a target="_blank">` links

### 12. YouTube Video Learning — `features/learn-youtube.md`
**Why:** Already partially built (`/learn/youtube` route exists). Gemini integration pending.
- [ ] Wire Gemini 1.5 Flash to analyse YouTube videos directly (multimodal URL support)
- [ ] Study guide streaming: summary, key concepts, AU market context, study tips
- [ ] Quiz generation from video content
- [ ] "Open in NotebookLM" escape hatch button
- [ ] Progress tracking per video

---

## 🌏 Showcase Features (When Foundations Are Solid)

### 13. Claude Lab — interactive terminal learning — `features/learn-anthropic-claude.md`
**Why:** Flagship showpiece. Gamified xterm.js terminal with 15 missions covering Claude Code + AI workflows.
- [ ] `@xterm/xterm` + `@xterm/addon-fit` installed
- [ ] `ClaudeLab.tsx` — xterm mount in Client Component
- [ ] `commandParser.ts` + `missions.ts` + `fakeFs.ts`
- [ ] `/api/learn/claude-lab` — Claude API proxy, rate-limited
- [ ] XP / badges / streak system

### 14. Traditional Chinese translation — `features/i18n-zh-tw.md`
**Why:** Serves Taiwanese/HK Brisbane community.
- [ ] `next-intl` installed
- [ ] `messages/en.json` + `messages/zh-TW.json` (~80 strings)
- [ ] `LangToggle.tsx` in header

---

## 🟢 Nice to Have

### 15. Interview session share card
- [ ] PNG share card on session complete (role, score, date) → LinkedIn share

### 16. RSS feed
- [ ] `app/feed.xml/route.ts` → RSS 2.0 for blog + digests

### 17. Reading progress bar
- [ ] Thin scroll-progress bar at top of blog post pages

### 18. AI pipeline — ArXiv digest + GitHub Hot nav
- [ ] `scripts/run-digest.ts` — add ArXiv same-day papers
- [ ] GitHub Hot added to header nav

### 19. Post cover images — `features/post-cover-images.md`
- [ ] Auto-select or generate cover images for blog posts in feed

---

## ✅ Done

### AU Insights
- **Company Interview Questions** — all 11 companies seeded with 5-7 real sourced questions, round chips, Glassdoor deeplinks (`interviewProcess` + `interviewQuestions` in data.ts, rendered on company detail pages)
- **Company Tiers** — all 8 tiers, Framer scroll entrance + hover lift, favicon chips, ghost logo watermark
- **IT Ecosystem** — 4-layer AU IT map
- **Career Guide** — full guide, all palette-themed
- **Visa Sponsors** — top 20 companies by 482 volume
- **Job Market Charts** — ABS/ACS/QILT data
- **Salary Checker** — AI verdict vs ACS benchmarks + negotiation script
- **Grad Programs** — live status, deadlines, favicons, direct application links
- **Skill Map** — OR-group skill matching, animated match bars, company chips
- **Visa Guide** — 6-step 482/SID stepper (public, read-only)
- **Company Compare** — multi-select, 8-row table, SVG radar chart
- **Company detail pages** — `/au-insights/companies/[slug]` with website links, tier colours, culture data

### Resume & Career
- **Resume Analyser** — auth-gated, PDF upload, Claude AU recruiter prompt, score ring, action items, dashboard card

### Dashboard
- **Career Tools section** — Resume Analyser + Interview Prep + AU Insights cards
- **Saved jobs** — save, unsave, add to tracker
- **Application tracker** — status pipeline, "Prep for interview" CTA on interview status
- **Job alerts** — saved searches, delete

### Core
- **Auth** — GitHub OAuth + Supabase SSR
- **Stripe** — checkout + portal + webhook
- **Job search** — JSearch API, filters, freshness colours, save/apply
- **Interview prep** — streaming Alex mentor, question sidebar, score debrief
- **Cover letter** — streaming generation, resume match scoring (gpt-4o-mini)
- **Learning paths** — Frontend / Fullstack / Backend, checkbox progress, localStorage
- **YouTube learning** — `/learn/youtube` route + video session page (Gemini integration pending)
- **IBM learning** — `/learn/ibm` curated content
- **Comments** — auth-gated, per-post, admin moderation
- **Admin panel** — `/admin` stats, users, comment moderation
- **Sitemap + robots.txt** — SEO ready
- **Pre-push quality gate** — `npm run check` (audit + build)
- **Mobile nav** — Jobs, Me/avatar, More sheet
- **Theme** — light default, yin-yang toggle animation
- **About page** — Petcho virtual pet

---

## Priority Rationale

| # | Item | Why now |
|---|------|---------|
| 1 | Interview questions on company pages | Unique AU data, high SEO value, low complexity |
| 2 | Cover letter model upgrade | Immediate quality win for paying users |
| 3 | Learning Supabase sync | Trust — progress loss = churn |
| 4 | OG images | LinkedIn share = free distribution |
| 5 | Visa Journey Tracker | Natural follow-on to VisaGuide, high value for target users |
