# Feature: [Feature Name]

**Priority:** 🔴 High / 🟡 Medium / 🟢 Nice to have
**Status:** 🔲 Not started / 🟡 In progress / ✅ Done
**Branch:** `feature/[name]`
**Started:** —
**Shipped:** —

---

## Goal

One paragraph. What problem does this solve? Who benefits?

---

## Acceptance Criteria

These are the conditions that must ALL be true before this feature is considered done.

- [ ] ...
- [ ] ...
- [ ] ...

---

## Affected Files

List every file that will be created or modified.

| File | Action | Notes |
|------|--------|-------|
| `app/...` | Create / Modify | ... |

---

## Implementation Notes

Key decisions, constraints, or non-obvious things to know before building.

---

## Senior Dev Test Checklist

Work through this before marking the feature as ready to ship.

### Functional

- [ ] Happy path tested end-to-end in browser
- [ ] Edge case: empty / no data state
- [ ] Edge case: loading state visible
- [ ] Edge case: error state (API down, network timeout)
- [ ] Mobile layout tested at 375px (Chrome DevTools)
- [ ] Desktop layout tested at 1280px+

### Auth & Data

- [ ] Unauthenticated users redirected (if auth-gated)
- [ ] Authenticated flow works correctly
- [ ] Supabase queries scoped to `user.id` — no cross-user data leakage
- [ ] API routes return 401 for missing/invalid session

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript `any` or `@ts-ignore` added
- [ ] No unused imports

### Security

- [ ] No hardcoded secrets or API keys
- [ ] User input never rendered as raw HTML
- [ ] No sensitive data exposed in API response beyond what's needed

### Performance

- [ ] No unnecessary re-renders observed in React DevTools
- [ ] Supabase queries select only required columns

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL (not just localhost)
- [ ] Vercel Function logs clean (no runtime errors)
- [ ] Supabase migration applied (if any)
- [ ] `context/current-feature.md` updated
- [ ] `context/feature-roadmap.md` item checked off
- [ ] This file updated with ship date

---

## Notes / History

- **[date]** — ...
