# Feature: Resume & Cover Letter Improvements

**Priority:** 🔴 High (AI migration) · 🟡 Medium (UI edit) · 🟢 Nice to have (PDF, LinkedIn)
**Status:** 🔲 Not started
**Branch:** `feature/resume-cover-letter` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Migrate cover letter generation and resume matching from `gpt-4o-mini` to Claude Sonnet for better quality and cost balance. Optionally add a UI for editing resume data and improve PDF export.

---

## Acceptance Criteria

### Claude Migration (High — do first)
- [ ] `app/api/cover-letter/route.ts` uses `claude-sonnet-4-6` instead of `gpt-4o-mini`
- [ ] `app/api/resume-match/route.ts` uses `claude-sonnet-4-6` instead of `gpt-4o-mini`
- [ ] Streaming still works after migration (Anthropic SDK streaming pattern)
- [ ] Response quality verified manually — cover letter reads naturally

### Resume Data UI (Medium)
- [ ] User can edit their resume sections via a UI at `/profile` or `/resume/edit`
- [ ] Edits saved to Supabase (new table or extend `profiles`)
- [ ] `lib/resume-data.ts` becomes the fallback default only — do NOT modify its content

### PDF Export (Nice to have)
- [ ] PDF export uses `@react-pdf/renderer` instead of `window.print()`
- [ ] PDF is well-formatted — not just a browser print dump

### LinkedIn Deep-link (Nice to have)
- [ ] Resume page shows "Search on LinkedIn" link that deep-links to LinkedIn job search

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/api/cover-letter/route.ts` | Modify | Switch to Anthropic SDK + streaming |
| `app/api/resume-match/route.ts` | Modify | Switch to Anthropic SDK |
| `app/resume/page.tsx` | Modify | LinkedIn link (nice to have) |
| `app/profile/page.tsx` | Create | Resume data editing UI (medium priority) |
| `lib/resume-data.ts` | Do NOT edit | Source of truth — content is Henry's real CV |

---

## Implementation Notes

- Anthropic streaming pattern differs from OpenAI — use `client.messages.stream()` or the messages API with `stream: true`
- `ANTHROPIC_API_KEY` is already in env (used by scripts) — available to API routes too
- Do not remove `OPENAI_API_KEY` until ALL user-facing routes have migrated (interview prep still uses OpenAI)
- `lib/resume-data.ts` content must never change — it is Henry's actual CV

---

## Senior Dev Test Checklist

### Functional

- [ ] Cover letter generation streams correctly (text appears progressively, not all at once)
- [ ] Cover letter output quality is coherent and professional
- [ ] Resume match scoring returns a valid score (0–100) and reasoning
- [ ] Error state shown if Claude API fails (not a blank screen)
- [ ] Loading state shown while streaming
- [ ] PDF export produces a readable, well-formatted document (if implemented)

### Auth & Data

- [ ] Cover letter generation is auth-gated (existing behaviour preserved)
- [ ] Cover letter saved to `cover_letters` table after generation
- [ ] Resume edit saves to correct user's record (scoped by `user_id`)

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] Anthropic SDK response types are correct — no `any` casts
- [ ] Streaming response type is `ReadableStream` — same as before

### Security

- [ ] `ANTHROPIC_API_KEY` is server-only
- [ ] User-supplied job description not reflected as raw HTML

### Performance

- [ ] First token appears within 1.5s of submit
- [ ] No regression on cover letter page load time

---

## Post-Ship Checklist

- [ ] Tested cover letter generation on live Vercel URL
- [ ] Tested resume match scoring on live URL
- [ ] Vercel Function logs clean — no Anthropic API errors
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
