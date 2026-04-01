# Feature: Gamified Interview Prep — Mentor-Led UX

**Priority:** 🔴 High
**Status:** 🟡 In progress
**Branch:** `feature/brand-redesign` (current working branch)
**Started:** 2026-03-28
**Shipped:** —

---

## Goal

Replace the static Q&A card deck with a streaming AI mentor character (Alex) who guides the user through real-world Australian IT interview scenarios. Modelled on Brilliant.org — conversational, immersive, and directly tied to local companies like Atlassian and Canva.

---

## Acceptance Criteria

- [ ] Role selector page (`/interview-prep`) shows 8 Australian IT roles
- [ ] Each question flows through 5 stages: SCENE → WHY → GUIDE → PRACTICE → DEBRIEF
- [ ] Alex's narration streams word-by-word for SCENE, WHY, GUIDE, DEBRIEF stages
- [ ] User can type their answer in the PRACTICE stage
- [ ] DEBRIEF scores the answer and shows an improved version
- [ ] XP is awarded per stage; level-up shown when threshold crossed
- [ ] Progress saved to Supabase `interview_progress` table
- [ ] Floating free-form chatbot available on every question
- [ ] Question sidebar shows status dot per question (not started / in progress / complete)
- [ ] Unauthenticated users are blocked at the DEBRIEF stage (auth wall)
- [ ] Mobile layout usable at 375px

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/api/interview/questions/route.ts` | Create | Leaner shape — includes `scenario` field |
| `app/api/interview/mentor/route.ts` | Create | Streaming stage narration by Alex |
| `app/api/interview/chat/route.ts` | Create | Free-form mentor chat (no auth) |
| `app/interview-prep/page.tsx` | Create | Role selector grid (server component) |
| `app/interview-prep/[role]/page.tsx` | Create | Route wrapper + metadata |
| `app/interview-prep/[role]/InterviewSession.tsx` | Create | Full mentor UX (client component) |
| `components/Header.tsx` | Modify | Add Interview Prep nav link |
| `app/learn/page.tsx` | Modify | Add cross-promo banner |
| `lib/interview-roles.ts` | Done | 8 roles + XP helpers |
| `supabase/004_interview_prep.sql` | Done | DB migration (run in Supabase dashboard) |

---

## Implementation Notes

- Questions ordered: 3 Easy → 5 Medium → 2 Hard, always
- Mentor persona: Alex Chen, Senior Dev, ex-Atlassian, 8 years exp, Australian context
- `gpt-4o-mini` for all mentor streaming (cost-effective, fast enough for streaming)
- `scene/why/guide` stages: no auth required. `debrief`: auth required
- No new npm packages
- CSS custom properties only — inline styles, no Tailwind
- The `scenario` field in the question seeds Alex's SCENE narration — Alex expands on it

---

## Senior Dev Test Checklist

### Functional

- [ ] Can select a role and reach the first question
- [ ] SCENE stage: Alex's text streams in (not all at once)
- [ ] "Alex is thinking..." dots appear before stream starts
- [ ] WHY and GUIDE stages advance on button click
- [ ] PRACTICE: can type answer, submit button enabled only when input non-empty
- [ ] DEBRIEF: streaming feedback appears, score shown, improved version shown
- [ ] XP total updates after each DEBRIEF
- [ ] Level-up animation/indicator triggers at correct XP thresholds
- [ ] Question sidebar dot turns green after DEBRIEF completed
- [ ] Floating chatbot opens and accepts free-form questions
- [ ] Empty state: what does `/interview-prep` show when not logged in?
- [ ] Error state: what happens if OpenAI API call fails during streaming?
- [ ] Back navigation from question view returns to role selector

### Auth & Data

- [ ] DEBRIEF stage prompts login for unauthenticated user
- [ ] `interview_progress` row created/updated in Supabase on DEBRIEF completion
- [ ] `interview_xp` updated in `profiles` table
- [ ] Progress persists on page refresh (loaded from Supabase on mount)
- [ ] Two different users cannot see each other's progress

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript `any` added
- [ ] All stage type unions are exhaustive

### Security

- [ ] `/api/interview/evaluate` (DEBRIEF) returns 401 without session
- [ ] User answer is not reflected back without sanitisation
- [ ] `OPENAI_API_KEY` not exposed to client bundle

### Performance

- [ ] Streaming starts within 1s on fast connection
- [ ] Sidebar does not re-render entire session on each XP update
- [ ] Supabase progress query uses `user_id` + `role` index

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL
- [ ] Vercel Function logs clean
- [ ] `supabase/004_interview_prep.sql` migration confirmed applied
- [ ] `context/current-feature.md` marked complete
- [ ] `context/feature-roadmap.md` item checked off
- [ ] This file updated with ship date

---

## Notes / History

- **2026-03-28** — Spec written; `lib/interview-roles.ts` and `supabase/004_interview_prep.sql` created
- **2026-03-30** — UX redesign: static card deck replaced with mentor-led streaming flow (Alex persona)
