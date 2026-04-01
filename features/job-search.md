# Feature: Job Search — Australian Market

**Priority:** 🔴 High (Indeed + freshness) · 🟡 Medium (filters, preferences)
**Status:** 🔲 Not started
**Branch:** `feature/job-search-improvements` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Improve the Australian IT job search experience: add a second fresher data source (Indeed), surface job posting age prominently, build a job alerts UI, and add quality-of-life filters. Currently Adzuna lags by hours–days; users need same-day listings.

---

## Acceptance Criteria

### Indeed Integration
- [ ] Indeed Publisher API added as second job source alongside Adzuna
- [ ] Results merged and deduplicated in `app/api/jobs/route.ts`
- [ ] "via Indeed" badge shown on Indeed-sourced listings
- [ ] `INDEED_PUBLISHER_ID` added to `.env.example` and GitHub Secrets docs

### Job Freshness
- [ ] Posting age displayed on every job card (e.g. "2 hours ago", "3 days ago")
- [ ] Age colour: green < 24h · amber 1–3 days · red > 3 days
- [ ] Uses `formatDistanceToNow` from `date-fns` (already installed)

### Job Alerts UI
- [ ] "Save this search" button on `/jobs` saves criteria to `job_alerts` table
- [ ] "Alerts" tab visible on `/dashboard` with saved alerts listed
- [ ] Alerts can be deleted from the dashboard
- [ ] Email digests sent via Supabase Edge Function or GitHub Action (schedule TBD)

### Filters (medium priority — can ship in follow-up)
- [ ] Salary range filter (Adzuna `salary_min` / `salary_max` params)
- [ ] IT sub-category filter: All / Developer / DevOps / Data / QA
- [ ] Search preferences persist to localStorage across sessions
- [ ] One-click "Apply" creates a `job_applications` row (status: applied)

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/api/jobs/route.ts` | Modify | Merge Adzuna + Indeed results |
| `app/jobs/page.tsx` | Modify | Freshness display, filters, "Save search" |
| `app/dashboard/page.tsx` | Modify | Alerts tab |
| `app/api/alerts/route.ts` | Create | CRUD for job alerts |
| `.env.example` | Create/Modify | Add `INDEED_PUBLISHER_ID` |

---

## Implementation Notes

- Indeed Publisher API: `https://ads.indeed.com/jobroll/xmlfeed` — free tier
- Deduplication: match on job title + company name (fuzzy) or URL
- `job_alerts` schema already exists in `supabase/schema.sql` — no migration needed
- `date-fns` is already installed — use `formatDistanceToNow`
- Do not use OpenAI or Claude for any part of this feature (Adzuna/Indeed data is structured)

---

## Senior Dev Test Checklist

### Functional

- [ ] Jobs page loads with results from both Adzuna and Indeed
- [ ] "via Indeed" badge visible on Indeed results
- [ ] No duplicate listings for the same job (deduplication works)
- [ ] Freshness labels show correct relative time ("2 hours ago")
- [ ] Green/amber/red colour applied correctly based on age thresholds
- [ ] Salary filter narrows results correctly
- [ ] Category filter shows only matching jobs
- [ ] "Save search" saves to Supabase and shows success feedback
- [ ] Dashboard Alerts tab shows saved searches
- [ ] Deleting an alert removes it from the list immediately
- [ ] Preferences survive page reload (localStorage)
- [ ] One-click Apply creates an entry visible on /dashboard

### Auth & Data

- [ ] Saving alerts requires login — unauthenticated user sees prompt
- [ ] Alerts are user-scoped — users cannot see each other's alerts
- [ ] API routes return 401 without session where required

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] Indeed XML response parsed without TypeScript errors
- [ ] No `any` types added to merged job result shape

### Security

- [ ] `INDEED_PUBLISHER_ID` is server-only (not prefixed `NEXT_PUBLIC_`)
- [ ] Job listing content is displayed as text — not injected as HTML

### Performance

- [ ] Jobs page initial load under 3s on average connection
- [ ] Parallel fetch for Adzuna + Indeed (not sequential)
- [ ] localStorage access does not block render

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL with real job results
- [ ] Vercel Function logs clean
- [ ] Indeed API key added to production environment variables
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
