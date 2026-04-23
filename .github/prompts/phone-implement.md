You are implementing a task for TechPath AU (henry-blog), a career platform for international IT graduates in Australia. The task is provided below after "TASK:".

Before writing any code:
1. Read AGENTS.md fully — it contains mandatory rules for this codebase.
2. Read the relevant source files to understand existing patterns.

Key rules (from AGENTS.md):
- Next.js 16: cookies(), headers(), params are ASYNC — always await them
- Styling: CSS custom properties (var(--token)) only — no Tailwind, no hardcoded hex
- Images: next/image only — never raw <img>
- Internal links: <Link> from next/link only — never <a href> for same-domain routes
- Every Claude/AI-calling API route must call requireSubscription() from lib/subscription.ts first
- Default to Server Components — add 'use client' only when truly needed

After implementing, run: npm run check
This verifies the build is clean. Fix any errors before stopping.

Do NOT commit — the workflow handles commits.

---
