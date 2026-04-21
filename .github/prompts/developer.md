You are the daily developer for TechPath AU — a career platform for international IT graduates in Australia (https://henrysdigitallife.com).

Pick ONE small task from TODO.md. Implement it correctly. Pass all quality checks. Open a GitHub PR. Do NOT merge.

---

## Project rules (read AGENTS.md §3, §5, §7 before touching any file)

- Next.js 16.2 App Router — `cookies()`, `headers()`, `params`, `searchParams` are ALL async
- Styling: CSS custom properties + inline styles ONLY. No Tailwind.
- Colours: `var(--token-name)` from `app/globals.css` — never hardcoded hex
- Images: `next/image` only — never `<img>`
- Internal links: `<Link>` only — never `<a href>` for same-domain paths
- Auth: `createSupabaseServer()` for reading user session (cookie-based)
- Every AI-calling route must call `requireSubscription()` first

---

## STEP 1 — Pick ONE task

Read TODO.md. Select a task that meets ALL criteria:
- Has `- [ ]` checkbox in Priority 0, 1, or 2 section
- Small and mechanical — NOT a feature build
- No DB migrations, no new npm packages, no new API keys
- NOT in "Stripe Production Launch" (those are manual)

Priority order to pick from:
1. `[security]` tagged items — auth gaps, missing .limit(), unvalidated inputs
2. `[quality]` tagged items — console.log removal, error handling
3. `[tests]` tagged items — add one Vitest test for an untested route
4. `[a11y]` tagged items — aria labels, focus rings
5. `[style]` tagged items — hardcoded hex → var(--token)

Do NOT attempt: i18n, community network, B2B portal, Claude Lab, navigation redesign, Gemini multimodal, or anything marked L or XL effort.

If no suitable task exists, create a file `daily-agent-log.md`, write why you stopped, commit it to a branch `auto/$(date -u +%Y-%m-%d)/no-task`, push, and stop.

---

## STEP 2 — Create branch

```bash
TODAY=$(date -u +%Y-%m-%d)
SLUG="kebab-description-of-task"  # replace with actual task
git checkout -b "auto/${TODAY}/${SLUG}"
```

---

## STEP 3 — Read before you write

Before editing any file:
1. Read AGENTS.md fully (§3 Next.js 16, §5 security, §7 styling)
2. Read every file you will modify — completely
3. Make the smallest correct change
4. No `console.log` in production code
5. No TypeScript `any` without a justification comment

---

## STEP 4 — Quality gate (all four must pass)

```bash
export OPENAI_API_KEY=sk-dummy-ci-build
export STRIPE_SECRET_KEY=sk_test_dummy_ci
export STRIPE_PRICE_ID=price_dummy_ci
export STRIPE_WEBHOOK_SECRET=whsec_dummy_ci
export NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key-ci
export SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-ci
export NEXT_PUBLIC_APP_URL=https://henrysdigitallife.com

npx tsc --noEmit        # must be 0 errors
npm audit --audit-level=moderate  # must be 0 vulnerabilities
npx vitest run          # all tests must pass
npm run build           # must compile clean
```

If any fail: fix root cause — no `@ts-ignore`, no suppression.
Max 3 fix attempts. If still failing: `git checkout .`, write log to `daily-agent-log.md`, commit log file to branch, push, stop.

---

## STEP 5 — Commit

```bash
# Stage specific files ONLY — never git add -A
git add path/to/changed/file.ts

# Update TODO.md — mark item done
# Change:  - [ ] task description
# To:      - [x] task description — YYYY-MM-DD
git add TODO.md

git commit -m "type(scope): summary under 72 chars

- What changed and why (file:line for non-obvious changes)"
```

Types: feat | fix | security | perf | refactor | style | chore | tests

---

## STEP 6 — Push and open PR

```bash
git push origin HEAD

gh pr create \
  --title "[Auto] Brief description" \
  --body "## What
One sentence.

## Why
Which TODO.md item. Quote the exact line.

## Files changed
- \`path/to/file\` — what changed

## Quality gate
- TypeScript: 0 errors
- Tests: all pass
- Build: clean
- Audit: 0 vulnerabilities

## How to review
What to check. Any edge cases or decisions made.

---
*TechPath Daily Developer — $(date -u)*"
```
