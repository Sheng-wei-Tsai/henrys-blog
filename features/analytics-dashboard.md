# Feature: Analytics Dashboard

**Priority:** 🔴 High
**Status:** ✅ Shipped
**Started:** 2026-04-08
**Shipped:** 2026-04-08

---

## Goal

Track who visits the blog server-side, store data securely (never exposed to public frontend),
and provide an admin dashboard with AI-generated growth suggestions.

International, privacy-first: no third-party cookies, no external tracking scripts.
All data lives in Supabase under admin-only RLS.

---

## What We Track (per page view)

| Field | Source |
|-------|--------|
| `path` | URL pathname |
| `referrer` | `Referer` header |
| `country` | `x-vercel-ip-country` header |
| `city` | `x-vercel-ip-city` header |
| `device` | user-agent → mobile/tablet/desktop |
| `session_id` | sessionStorage UUID (dedup within tab session) |
| `created_at` | Supabase default |

**Not stored:** IP address, full UA string, query strings, any PII.

---

## Security Model

- `page_views` table: INSERT open (no auth needed to track), SELECT admin-only via RLS
- `/api/track` — public POST, rate-limited by session_id dedup (one row per session+path)
- `/api/analytics/summary` — admin-only (profile.role = 'admin'), returns aggregated data only
- `/api/analytics/ai-insights` — admin-only, sends aggregated (not raw) data to Claude

---

## Files

| File | Action |
|------|--------|
| `supabase/010_analytics.sql` | Create — page_views table + RLS |
| `components/Analytics.tsx` | Create — client beacon component |
| `app/api/track/route.ts` | Create — insert endpoint |
| `app/api/analytics/summary/route.ts` | Create — admin aggregated stats |
| `app/api/analytics/ai-insights/route.ts` | Create — Claude growth suggestions |
| `app/admin/analytics/page.tsx` | Create — admin dashboard |
| `app/layout.tsx` | Update — add `<Analytics />` |
| `app/admin/page.tsx` | Update — add Analytics link |

---

## Dashboard Sections

1. **Overview cards**: Total views (30d), Unique sessions (30d), Top day
2. **Daily trend chart**: SVG sparkline — 30 days of view counts
3. **Top pages**: Path, view count, % of total
4. **Traffic sources**: Referrer breakdown (direct, Google, social, etc.)
5. **Countries**: Top 10 countries by visits
6. **Devices**: Mobile / Desktop / Tablet split
7. **AI Growth Suggestions**: Claude analyses aggregated data → 5-7 actionable recommendations

---

## Acceptance Criteria

- [ ] Page views tracked silently on every page load (no cookie banner needed — no PII)
- [ ] Raw data never exposed to non-admin endpoints
- [ ] Admin dashboard at `/admin/analytics` renders all 6 sections
- [ ] AI suggestions refresh on demand (separate fetch, cached 1h)
- [ ] Session dedup: navigating same page twice in a tab = 1 row
- [ ] `npm run build` passes
