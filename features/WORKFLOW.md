# Feature Development Workflow Guide

> **This is the single source of truth for how every feature is built, tested, and shipped.**
> Read this before opening any code file. No shortcuts.

---

## The Golden Rule

**No code ships without passing every checklist item for its phase.**
If a step is skipped, the feature is not done. Period.

---

## Feature Lifecycle — 8 Phases

```
SPEC → BRANCH → BUILD → LOCAL TEST → CODE REVIEW → BUILD PASS → STAGING → SHIP
```

### Phase 1 — Spec

Before writing a single line of code:

- [ ] Feature file exists in `features/[name].md` and is filled out
- [ ] Goals are clear and scoped (no "while we're here" additions)
- [ ] All affected files are listed
- [ ] Acceptance criteria are written — specific, testable, not vague
- [ ] No new dependencies added without checking if existing packages cover it
- [ ] `context/current-feature.md` is updated with the spec

### Phase 2 — Branch

```bash
git checkout main && git pull
git checkout -b feature/[name]   # or fix/[name], chore/[name]
```

- [ ] Branch name matches `feature/[name]` convention
- [ ] Branched off the latest `main`
- [ ] Never develop directly on `main`

### Phase 3 — Build

- [ ] Follow coding conventions in `context/coding-standards.md`
- [ ] CSS custom properties only — no Tailwind
- [ ] Client components have `'use client'` at top; server components do not
- [ ] API routes follow auth pattern in `CLAUDE.md`
- [ ] Streaming endpoints follow the pattern in `app/api/cover-letter/route.ts`
- [ ] No `console.log` left in production code
- [ ] No secrets or env vars hardcoded
- [ ] Minimal change — only implement what the spec says

### Phase 4 — Local Testing (Senior Dev Checklist)

This is the most important phase. Do not rush it.

#### 4a. Functional Testing

- [ ] Happy path works end-to-end in the browser
- [ ] All user flows described in the spec have been manually tested
- [ ] Edge cases tested: empty state, loading state, error state
- [ ] Auth-gated routes redirect unauthenticated users correctly
- [ ] Auth-gated routes work correctly when authenticated
- [ ] Streaming responses stream (not batch) in the browser
- [ ] Mobile layout tested (Chrome DevTools → responsive mode, 375px width)
- [ ] Desktop layout tested (1280px+)

#### 4b. Data & API Testing

- [ ] API routes return correct status codes (200, 401, 422, 500)
- [ ] API routes handle missing/malformed request bodies gracefully
- [ ] Supabase queries are scoped to the authenticated user (no data leakage)
- [ ] No N+1 queries (check Network tab for redundant calls)
- [ ] Large payloads handled (what happens with 100 results vs 1?)

#### 4c. Error Handling

- [ ] What happens when the API is down? (User sees an error, not a blank screen)
- [ ] What happens with a slow network? (Loading state shown)
- [ ] What happens when the user is logged out mid-session?
- [ ] OpenAI/Claude API errors are caught and surfaced to the user

#### 4d. Security Review

- [ ] No SQL injection vectors (using Supabase client, not raw queries)
- [ ] No XSS vectors (no direct HTML injection with user-supplied strings)
- [ ] Auth checks exist on every protected API route
- [ ] No sensitive data in client-side code or browser storage
- [ ] Env vars are server-only unless prefixed `NEXT_PUBLIC_`
- [ ] User input is never rendered as raw HTML — use React's text rendering instead

#### 4e. Performance Check

- [ ] No unnecessary re-renders (check React DevTools Profiler)
- [ ] Images use `next/image` or have explicit dimensions
- [ ] No large imports added (`import * from` a heavy library)
- [ ] Supabase queries use `.select('col1, col2')` — not `.select('*')` unless needed

### Phase 5 — Build Pass

```bash
npm run build
```

- [ ] `npm run build` exits with **zero errors and zero warnings** (or warnings are understood/acceptable)
- [ ] TypeScript errors are zero — no `@ts-ignore` or `any` added to make it pass
- [ ] If build fails: fix root cause, never suppress

### Phase 6 — Code Review

Before committing, self-review the diff:

```bash
git diff main
```

- [ ] No unrelated files modified
- [ ] No debug code left (`console.log`, commented-out blocks, TODO without issue)
- [ ] Commit message follows `feat:` / `fix:` / `chore:` convention
- [ ] Commit message explains *why*, not just *what*
- [ ] Ask before committing — never auto-commit

### Phase 7 — Merge & Deploy

- [ ] PR reviewed (or self-approved with fresh eyes after a break)
- [ ] Branch merged into `main` via PR
- [ ] Vercel auto-deploy triggered (check Vercel dashboard)
- [ ] Feature branch deleted after merge

### Phase 8 — Post-Ship Verification

After Vercel deploy completes (usually ~2 min):

- [ ] Visit the live URL and test the happy path again
- [ ] Check Vercel Function logs for unexpected errors
- [ ] Verify any new Supabase migrations were applied
- [ ] `context/current-feature.md` marked as complete
- [ ] Item checked off in `context/feature-roadmap.md`
- [ ] Feature file in `features/[name].md` updated with completion date

---

## Commit Message Reference

```
feat: add streaming mentor narration to interview prep
fix: handle null user in job alerts API
chore: clean up unused imports in Header
docs: update interview prep spec with debrief stage
refactor: extract question sorting into utility function
```

Rules:
- Lowercase after the colon
- Present tense ("add", not "added")
- No "Generated with Claude" or AI attribution
- One logical change per commit

---

## When Something Breaks

1. Read the full error — don't skim
2. Check if it's a TypeScript error, runtime error, or build error
3. Try to fix it once with confidence
4. If stuck after 2–3 attempts: stop, document what you tried, ask for help
5. Never merge a broken build

---

## Feature File Template

Every feature in this folder follows the same structure.
See `features/_TEMPLATE.md` for the blank template.

---

*This workflow exists because rushed code costs more to fix than to build right.*
*Every skipped checkbox is technical debt with your name on it.*
