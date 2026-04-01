# Feature: Learning Platform — Supabase Sync + Enhancements

**Priority:** 🔴 High (Supabase sync) · 🟡 Medium (% complete, more paths) · 🟢 Nice to have (streak)
**Status:** 🔲 Not started
**Branch:** `feature/learning-platform` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

The learning platform (`/learn`) currently stores all progress in `localStorage`, meaning progress is lost when the user switches devices or clears storage. Sync progress to the `skill_progress` Supabase table (already migrated) and add quality-of-life improvements.

---

## Acceptance Criteria

### Supabase Progress Sync (High — do first)
- [ ] `PathTracker.tsx` reads initial progress from Supabase on mount (if user is logged in)
- [ ] Progress updates are written to Supabase `skill_progress` table on each interaction
- [ ] `localStorage` kept as offline/guest fallback — not removed
- [ ] Logged-in user's progress syncs across devices

### Completion % on Learn Index (Medium)
- [ ] `/learn` page shows % complete for each path (e.g. "3 / 12 topics — 25%")
- [ ] % calculated from Supabase progress (if logged in) or localStorage (if not)

### More Career Paths (Medium)
- [ ] Data Engineer path added to `lib/skill-paths.ts`
- [ ] DevOps/Cloud path added to `lib/skill-paths.ts`
- [ ] ML Engineer path added to `lib/skill-paths.ts`
- [ ] Each new path has at least 8 topics with content in `lib/skill-content.ts`

### Learning Streak (Nice to have)
- [ ] Streak indicator shown on `/learn/[path]` — consecutive days with activity
- [ ] Streak stored in Supabase (new column on `skill_progress` or `profiles`)

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/learn/[path]/PathTracker.tsx` | Modify | Add Supabase read/write on top of localStorage |
| `app/learn/page.tsx` | Modify | Add % complete per path |
| `lib/skill-paths.ts` | Modify | Add Data Engineer, DevOps/Cloud, ML Engineer paths |
| `lib/skill-content.ts` | Modify | Add content for new paths |

---

## Implementation Notes

- `skill_progress` table already exists (migration 003 applied)
- Schema: `user_id`, `path_id`, `topic_id`, `completed`, `last_reviewed_at`
- Use `useAuth()` from `AuthProvider` to check if user is logged in before Supabase calls
- Upsert pattern: `supabase.from('skill_progress').upsert({ user_id, path_id, topic_id, completed: true })`
- Do not load all paths' progress at once — load only the current path's progress on that path page
- `lib/skill-paths.ts` and `lib/skill-content.ts` are large — read fully before editing

---

## Senior Dev Test Checklist

### Functional

- [ ] Logged-in: completing a topic saves to Supabase (verify in Supabase dashboard)
- [ ] Logged-in: refreshing the page restores progress from Supabase (not reset)
- [ ] Logged-in: completing a topic on device A shows as complete on device B
- [ ] Logged-out: progress still works via localStorage (no errors thrown)
- [ ] Learn index shows correct % complete per path for logged-in user
- [ ] Learn index shows localStorage % for logged-out user
- [ ] New career paths (Data Engineer etc.) are navigable and have content

### Auth & Data

- [ ] `skill_progress` rows are scoped to `user_id` — no cross-user data leakage
- [ ] Upsert does not create duplicate rows for the same `(user_id, path_id, topic_id)`
- [ ] Unauthenticated users cannot trigger Supabase writes (client handles this gracefully)

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] New path definitions in `lib/skill-paths.ts` satisfy the `SkillPath` type
- [ ] No `any` types added

### Performance

- [ ] Supabase progress query runs once on path mount — not on every render
- [ ] Learn index does not fetch all progress upfront — deferred or lazy per path
- [ ] No visible layout shift as progress loads

---

## Post-Ship Checklist

- [ ] Tested Supabase sync with a real account on live Vercel URL
- [ ] Verified progress persists after logout/login cycle
- [ ] New paths navigable on live site
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
