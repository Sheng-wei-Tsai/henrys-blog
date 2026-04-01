# Feature: AI Pipelines & Content

**Priority:** 🔴 High (dedup, OpenAI removal) · 🟡 Medium (ArXiv, githot nav)
**Status:** 🔲 Not started
**Branch:** `feature/ai-pipelines` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Make the daily automated content pipelines more robust: prevent duplicate posts, add ArXiv as a same-day source for the AI digest, and remove the OpenAI dependency once all user-facing routes are on Claude.

---

## Acceptance Criteria

### Duplicate Detection — Daily Post (High)
- [ ] `scripts/run-post.ts` checks if today's MDX file already exists before generating
- [ ] If file exists: script exits with message "Post for today already exists — skipping"
- [ ] No duplicate posts created when GitHub Action runs twice in a day

### Eliminate OpenAI Dependency (High — after cover-letter + resume-match migrate)
- [ ] `OPENAI_API_KEY` is no longer used by any API route
- [ ] `openai` npm package can be removed (check it's not used elsewhere)
- [ ] GitHub Secrets: `OPENAI_API_KEY` can be archived (do not delete — coordinate with Henry)

### ArXiv Direct API (Medium)
- [ ] `scripts/run-digest.ts` fetches same-day papers from ArXiv API
- [ ] ArXiv results merged with existing sources in the digest
- [ ] Papers deduplicated by arxiv ID before inclusion

### GitHub Hot on Homepage + Nav (Medium)
- [ ] GitHub Hot section added to homepage tools grid (`app/page.tsx`)
- [ ] GitHub Hot link added to `components/Header.tsx` nav
- [ ] Follows existing nav pattern — SVG icon, correct mobile/desktop behaviour

### Duplicate Detection — Githot (Nice to have)
- [ ] `scripts/run-githot.ts` checks if today's file exists before running
- [ ] Same pattern as daily post dedup fix

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `scripts/run-post.ts` | Modify | Add file-existence check before generation |
| `scripts/run-githot.ts` | Modify | Add file-existence check (nice to have) |
| `scripts/run-digest.ts` | Modify | Add ArXiv fetch |
| `app/page.tsx` | Modify | Add GitHub Hot to tools grid |
| `components/Header.tsx` | Modify | Add GitHub Hot nav link |

---

## Implementation Notes

- ArXiv API: `https://export.arxiv.org/api/query?search_query=...&start=0&max_results=10` — free, no API key
- File existence check: `fs.existsSync(path.join(process.cwd(), 'content/posts', `${today}.mdx`))`
- `openai` package removal: only remove after confirming `app/api/interview/` routes have migrated
- Header nav: follow the exact pattern of existing nav entries — read `components/Header.tsx` first

---

## Senior Dev Test Checklist

### Functional

- [ ] Run `scripts/run-post.ts` twice in the same day — second run skips without error
- [ ] Run `scripts/run-githot.ts` twice — second run skips (if implemented)
- [ ] Digest includes ArXiv papers — at least 1 ArXiv result visible in output
- [ ] No duplicate ArXiv papers in a single digest
- [ ] GitHub Hot appears on homepage in the tools grid
- [ ] GitHub Hot nav link navigates correctly on desktop and mobile

### Build & Types

- [ ] `npm run build` passes with zero errors after OpenAI removal
- [ ] No TypeScript errors in modified scripts
- [ ] Scripts run cleanly: `npx ts-node scripts/run-post.ts` (dry run / check mode)

### Security

- [ ] ArXiv API called server-side only (it's a script — fine, but confirm no client-side leakage)
- [ ] No new env vars exposed to client bundle

### Performance

- [ ] Digest script does not hang waiting for ArXiv (add timeout: 10s)
- [ ] ArXiv fetch does not block digest if it fails (wrap in try/catch, continue without it)

---

## Post-Ship Checklist

- [ ] Run GitHub Action manually to verify no duplicate detection false positives
- [ ] Verify digest has ArXiv content in the next automated run
- [ ] GitHub Hot visible on homepage and in nav on live URL
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
