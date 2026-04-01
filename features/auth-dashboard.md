# Feature: Auth & Dashboard Improvements

**Priority:** 🔴 High (notes field) · 🟡 Medium (profile edit, nav links)
**Status:** 🔲 Not started
**Branch:** `feature/auth-dashboard` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Surface the `notes` field that already exists in the `job_applications` schema but has no UI. Add a profile edit page for `display_name` and `location` (added in migration 003 but unused). Clean up navigation to include Jobs, Dashboard, and Interview links.

---

## Acceptance Criteria

### Notes Field on Job Applications (High)
- [ ] Each application row on `/dashboard` shows a notes field (textarea or inline edit)
- [ ] Notes can be added, edited, and saved to `job_applications.notes` column
- [ ] Notes persist on page reload

### Profile Edit Page (Medium)
- [ ] New page at `/profile` (or `/settings`) with editable `display_name` and `location`
- [ ] Saves to `profiles` table via Supabase upsert
- [ ] Link to profile page in dashboard or header

### Header Nav Updates (Medium)
- [ ] Jobs, Dashboard, and Interview Prep links added to `components/Header.tsx`
- [ ] Correct icons used — follow existing nav pattern
- [ ] Mobile bottom bar updated if needed (may need to put some links in "More" sheet)

### CSV Export (Nice to have)
- [ ] "Export as CSV" button on `/dashboard` downloads all job applications
- [ ] CSV includes: title, company, status, applied date, notes

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/dashboard/page.tsx` | Modify | Notes field, CSV export |
| `app/profile/page.tsx` | Create | Profile edit form |
| `components/Header.tsx` | Modify | Add Jobs, Dashboard, Interview links |

---

## Implementation Notes

- `notes` column already in `job_applications` — no migration needed
- `display_name` and `location` already in `profiles` — no migration needed
- Read `components/Header.tsx` fully before editing — the mobile bottom bar has a 5-item limit
- Items beyond 5 in mobile nav go into a "More" sheet — check existing pattern
- CSV export: use `URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }))` — no library needed

---

## Senior Dev Test Checklist

### Functional

- [ ] Can add a note to a job application and it saves
- [ ] Can edit a note — change persists on reload
- [ ] Empty note is allowed (not required field)
- [ ] Profile page loads with current `display_name` and `location`
- [ ] Editing profile and saving shows success feedback
- [ ] Profile changes persist on reload
- [ ] Jobs, Dashboard, Interview links all navigate correctly on desktop
- [ ] Jobs, Dashboard, Interview links all navigate correctly on mobile
- [ ] CSV export downloads a valid CSV with correct data

### Auth & Data

- [ ] Notes are scoped to the correct `job_applications.id` + `user_id`
- [ ] Profile edits scoped to the logged-in user's `profiles` row
- [ ] All routes redirect to login if unauthenticated
- [ ] Dashboard page does not show another user's applications

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript errors in new profile page
- [ ] CSV generation has no runtime errors for empty applications list

### Performance

- [ ] Notes save without full page reload (optimistic update or local state)
- [ ] Dashboard does not re-fetch all applications on each note save
- [ ] Header does not flash or reflow on mobile when More sheet opens

---

## Post-Ship Checklist

- [ ] Tested notes, profile, and nav on live Vercel URL
- [ ] Vercel Function logs clean
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
