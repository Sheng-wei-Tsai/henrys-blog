# Interview Prep v2 — Deep Enhancement Feature Spec
**Status:** Planned
**Author:** Henry
**Date:** 2026-04-11

---

## 1. Problem

The interview prep tool has a solid 5-stage flow but misses the real challenges international IT graduates face in Australia:

- **Universal questions** (visa, salary, "why Australia") are not covered by any role — yet these are the questions that actually trip candidates up
- **Mentor engagement is shallow** — Alex narrates 3 stages but doesn't warn about common mistakes or ask follow-up questions
- **No company-specific intel** — users don't know what an Atlassian interview looks like vs a CBA interview
- **Session completion is a dead end** — users get XP and 2 links, no actionable post-interview resources
- **Networking is the #1 gap** for international grads and the platform ignores it entirely

## 2. Goals

- Add an **Australian Universal Questions** role with 8 handcrafted questions every international grad needs
- Deepen mentor interaction with a **Reality Check stage** and **follow-up questions** in debrief
- Add **Company Interview Intel** data for top 10 AU tech companies
- Replace thin session completion with a **Post-Interview Toolkit** (email templates, rejection handling, offer negotiation)
- Create a **Networking Hub** page with LinkedIn templates, GitHub checklist, AU meetup map, and a 30-day action plan

## 3. Non-Goals

- Not building a CRM or contact tracker for networking
- Not adding video/audio interview simulation (future iteration)
- Not changing the core XP/gamification system
- Not adding new AI models — using existing OpenAI integration for mentor stages

---

## 4. Features

### F1: Australian Universal Questions Bank

**New role** in `INTERVIEW_ROLES` with `id: 'universal'`, 8 hardcoded questions covering:
1. "Tell me about yourself" (AU context pitch)
2. "Why did you choose Australia?"
3. "What's your visa status and availability?"
4. "Where do you see yourself in 5 years?"
5. "What are your salary expectations?" (AU market rates)
6. "Tell me about a cross-cultural team experience"
7. "How do you handle feedback from someone more senior?"
8. "Do you have any questions for us?"

Questions are **not AI-generated** — they include curated AU-specific scenarios, frameworks, and mentor guidance. Stored in `lib/universal-questions.ts`.

### F2: Reality Stage + Follow-up Questions

**New stage** `'reality'` inserted between `guide` and `practice`:
- Alex warns about common mistakes, especially ones international candidates make
- Cultural assumptions, over-qualification anxiety, underselling patterns
- Ends with a memorizable recovery phrase

**Follow-up questions** in debrief:
- After AI feedback, Alex generates 1 probing follow-up question
- Simulates real interviewer behavior — "Can you go deeper on..."

Flow: `scene → why → guide → reality → practice → debrief (+ follow-up)`

### F3: Company Interview Intel

**Static data** for top 10 AU tech companies: Atlassian, Canva, REA Group, CBA, ANZ, Telstra, Xero, Seek, Afterpay, NAB.

Each entry: process overview, interview style, insider tip, typical timeline.

Displayed on role cards as expandable section. Injected into mentor prompts for context.

### F4: Post-Interview Toolkit

**Replaces session complete screen** with tabbed interface:
- **Summary** — Score breakdown per question, weak areas, XP earned
- **Follow-up Email** — Template with fill-in-the-blanks, AU etiquette notes
- **Rejection Handling** — Feedback request template, reapplication guide, normalizing stats
- **Offer Negotiation** — AU salary benchmarks, negotiable items (super is fixed, salary/WFH/budget are not), scripts

All static content, no API calls. Renders instantly.

### F5: Networking Hub

**New page** at `/interview-prep/networking` with 5 sections:
1. LinkedIn Optimisation (AU-specific, templates)
2. GitHub Portfolio Checklist (what AU hiring managers check)
3. AU Tech Meetup Map (Sydney, Melbourne, Brisbane, Perth, Adelaide)
4. "15 Things Nobody Tells New Grads" (AU workplace culture)
5. 30-Day Networking Action Plan (week-by-week checklist, localStorage-backed)

---

## 5. Files

| File | Action | Feature |
|------|--------|---------|
| `lib/interview-roles.ts` | Modify — add universal role, `COMPANY_INTEL`, `reality` XP | F1, F2, F3 |
| `lib/universal-questions.ts` | Create — 8 hardcrafted questions | F1 |
| `app/api/interview/questions/route.ts` | Modify — universal role bypass | F1 |
| `app/api/interview/mentor/route.ts` | Modify — reality + followup stages, company intel in prompts | F2, F3 |
| `app/interview-prep/[role]/InterviewSession.tsx` | Modify — reality stage, follow-up in debrief, toolkit tabs | F2, F4 |
| `app/interview-prep/page.tsx` | Modify — universal card placement, company intel display, networking link | F1, F3, F5 |
| `app/interview-prep/networking/page.tsx` | Create — networking hub page | F5 |

## 6. Implementation Order

1. F1 (Universal Questions) → F3 (Company Intel) → F2 (Reality Stage) → F4 (Toolkit) → F5 (Networking Hub)

## 7. Verification

- `npm run check` passes
- Universal Questions loads without OpenAI call, shows 8 questions
- 6-stage flow works: scene → why → guide → reality → practice → debrief
- Follow-up question streams in debrief after AI feedback
- Company Intel sections expand/collapse on role cards
- Session complete shows 4-tab toolkit
- `/interview-prep/networking` renders all 5 sections
- Dark mode and mobile responsive on all new UI
