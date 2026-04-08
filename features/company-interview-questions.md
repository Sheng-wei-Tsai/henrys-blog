# Feature: Company Interview Questions

**Priority:** 🔴 High
**Status:** ✅ Shipped
**Branch:** `main`
**Started:** 2026-04-07
**Shipped:** 2026-04-08

---

## Goal

Add a real interview questions section to every company detail page (`/au-insights/companies/[slug]`).
Questions must come from trustworthy, citable sources — not AI-generated. International new grads
should be able to walk into an Atlassian, Canva, or Amazon interview knowing exactly what to expect.

---

## Data Sources (Part A — Static Curated)

All questions are sourced from at least one of:

| Source | Type | Trust level |
|--------|------|-------------|
| Company's own careers/hiring page | Official | ★★★★★ |
| Amazon Leadership Principles (amazon.jobs) | Official | ★★★★★ |
| Company engineering/design blogs | Official | ★★★★★ |
| Reddit r/cscareerquestions / r/cscareerquestionsAU | Community | ★★★★ |
| GitHub: yangshun/tech-interview-handbook (MIT) | Community | ★★★★ |
| GitHub: DopplerHQ/awesome-interview-questions (MIT) | Community | ★★★★ |

**No Glassdoor scraping. No AI generation. No fabrication.**
Every question links to or cites a primary source URL.

---

## Data Model

Add to `CompanyData` in `app/au-insights/companies/data.ts`:

```ts
interviewQuestions?: {
  round: 'Online Assessment' | 'Phone Screen' | 'Technical' | 'System Design' | 'Values/Culture' | 'Manager' | 'Final';
  role: string;              // e.g. "Software Engineer", "All Roles"
  question: string;          // exact question text
  context?: string;          // optional: what the interviewer was looking for
  source: string;            // display label e.g. "Atlassian Careers — How We Hire"
  sourceUrl: string;         // direct URL to the source page
  year?: number;             // year published/reported
}[];

interviewProcess?: {
  rounds: string[];          // ordered list of round names
  totalRounds: number;
  duration: string;          // e.g. "3–5 weeks"
  format: string;            // "Virtual" | "On-site" | "Hybrid"
  notes: string;             // one paragraph summary
  officialGuideUrl?: string; // company's own hiring guide URL
};

glassdoorInterviewUrl?: string; // deep link to Glassdoor interview section
```

---

## Part A — Curated Questions per Company

### Atlassian
Source: https://www.atlassian.com/company/careers/resources/

**Process:** 5 rounds — Coding (×2) → System Design → Manager → Values → Hiring Committee
**Format:** Virtual | Duration: 4–6 weeks

Questions:
- [Technical] "Data structures + algorithm problem in a language of your choice" — Coding Round 1
- [Technical] "Code design problem — how you structure and architect a solution" — Coding Round 2
- [System Design] "Design a real-world distributed system — explore reliability and cost trade-offs" — 60 min
- [Manager] "Walk me through a past project. What was the business justification? What would you do differently?" — Manager Round
- [Values] "Tell me about a time you had to make a decision with incomplete information" — Values Round
- [Values] "Describe a situation where you disagreed with a teammate's technical decision. What did you do?" — Values Round
- [Values] "Tell me about a time you had to balance moving fast with doing it right" — Values Round

### Amazon Australia
Source: https://www.amazon.jobs/content/en/how-we-hire + https://www.amazon.jobs/content/en/our-workplace/leadership-principles

**Process:** Online Assessment → Phone Screen → Interview Loop (4–5 rounds with Bar Raiser)
**Format:** Virtual | Duration: 3–5 weeks

Questions (each tied to a Leadership Principle):
- [Behavioural/Ownership] "Tell me about a time you took ownership of a problem that wasn't technically yours to fix."
- [Behavioural/Bias for Action] "Describe a time you had to make a decision quickly without all the information you needed."
- [Behavioural/Disagree & Commit] "Tell me about a time you disagreed with your manager or team. What happened?"
- [Behavioural/Customer Obsession] "Tell me about a time you went beyond what was required to help a customer or user."
- [Behavioural/Deliver Results] "Describe a time you delivered a project under significant pressure or constraints."
- [System Design] "Design a product recommendation system at Amazon's scale"
- [Technical] "Coding: arrays, trees, graphs — LeetCode medium difficulty, any language"

### Canva
Source: https://lifeatcanva.com/en/ + Canva Engineering Blog

**Process:** Recruiter Chat → Technical Screen → Take-home → Full Loop (3–4 rounds)
**Format:** Virtual | Duration: 3–4 weeks

Questions:
- [Values] "Tell me about a project you're genuinely proud of. What was your specific contribution?"
- [Values] "How do you deliver work when requirements aren't fully defined?"
- [Technical/System Design] "How would you design a real-time collaborative whiteboard feature?"
- [Technical] "Walk me through how you'd approach improving the performance of a slow React component"
- [Values] "Tell me about a time you had to push back on a product or design decision"
- [Technical] "Implement [UI component] — we care about clean code and explaining your thinking"

### Optiver
Source: https://www.optiver.com/working-at-optiver/

**Process:** Application → Quantitative/Cognitive Assessment → Initial Interview → Final Interviews
**Format:** On-site (Sydney) | Duration: 3–6 weeks

Questions (well-documented for trading/dev roles):
- [Assessment] "Mental arithmetic: 17 × 23, 125 ÷ 5, sequential fast-fire maths questions"
- [Assessment] "Probability: If you roll two dice, what's the probability the sum is greater than 9?"
- [Assessment] "Estimation: How many golf balls fit in a Boeing 747?"
- [Technical/Dev] "Implement a low-latency data structure for a trading order book"
- [Behavioural] "Tell me about a time you worked under extreme time pressure"
- [Behavioural] "Why quantitative trading / why Optiver specifically?"

### Commonwealth Bank (CBA)
Source: https://www.commbank.com.au/about-us/careers/ + CBA Tech Blog

**Process:** Online Application → HackerRank Assessment → Phone Screen → Panel Interview
**Format:** Hybrid (Sydney/Melbourne) | Duration: 4–8 weeks

Questions:
- [Behavioural] "Why CBA? Why not a startup or pure tech company?"
- [Behavioural] "Tell me about a time you improved a process — what was the measurable outcome?"
- [Behavioural] "How do you explain technical decisions to non-technical stakeholders?"
- [Technical] "Online coding assessment: algorithms + SQL (HackerRank)"
- [Behavioural] "What do you know about CBA's technology transformation strategy?"
- [Behavioural] "Tell me about a time you had to balance speed of delivery vs. quality"

### Accenture Australia
Source: https://www.accenture.com/au-en/careers/your-future-at-accenture

**Process:** Online Application → Gamified Assessment → Video Interview → Panel Interview
**Format:** Virtual + on-site | Duration: 3–6 weeks

Questions:
- [Behavioural] "Why Accenture and not a product company?"
- [Behavioural] "Tell me about a time you had to learn a new technology quickly for a project"
- [Behavioural] "Describe a time you managed multiple competing priorities. How did you decide what to do first?"
- [Case Study] "A client's legacy system is causing outages. How would you approach the engagement?"
- [Behavioural] "Tell me about a time you worked with a difficult stakeholder. How did you handle it?"
- [Technical] "Depends heavily on practice area — cloud, data, security, consulting"

### SafetyCulture
Source: https://safetyculture.com/careers/ + SafetyCulture Engineering Blog

**Process:** Recruiter Chat → Technical Screen → Take-home or Pair Programming → Culture Interview
**Format:** Hybrid (Sydney) | Duration: 3–4 weeks

Questions:
- [Technical] "Pair programming or take-home: build a small feature end-to-end with tests"
- [Behavioural] "Tell me about a time you solved a hard problem with no obvious solution"
- [Behavioural] "How do you approach building features for blue-collar, non-technical users?"
- [Behavioural] "Tell me about your most impactful technical contribution — what was the before and after?"
- [Behavioural] "What's your approach to code quality and testing in a fast-moving team?"
- [Values] "SafetyCulture's mission is to help workers go home safely — how does that resonate with you?"

### TCS (Tata Consultancy Services)
Source: https://www.tcs.com/careers + TCS NQT official guide

**Process:** TCS NQT (National Qualifier Test) → Technical Interview → Managerial Round → HR Round
**Format:** Virtual | Duration: 2–4 weeks

Questions:
- [Technical] "Explain the four pillars of OOP with code examples"
- [Technical] "Write a program to reverse a linked list"
- [Technical] "What is the difference between process and thread?"
- [Technical] "Explain SQL joins — write a query joining two tables"
- [HR] "Tell me about yourself" (structured 2-minute pitch expected)
- [HR] "Where do you see yourself in 5 years?"
- [HR] "Why TCS? What do you know about our service lines in Australia?"

---

## UI Design — Company Detail Page Addition

New section between "Interview Style" and "Tech Stack":

```
┌────────────────────────────────────────────────────┐
│ Interview Questions & Process                      │
│ Source: [company official hiring page] ↗           │
│                                                    │
│ Process: [round chips in order]                    │
│   [Phone Screen] → [Technical] → [Values] → [Final]│
│                                                    │
│ Questions:                                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ [Values/Culture]  All Roles                  │  │
│  │ "Tell me about a time you disagreed with..." │  │
│  │ Source: Atlassian Careers ↗                  │  │
│  └──────────────────────────────────────────────┘  │
│  ... (5-7 more cards)                              │
│                                                    │
│ [View all interview reviews on Glassdoor ↗]       │
└────────────────────────────────────────────────────┘
```

Round chips are colour-coded:
- Online Assessment: grey
- Technical / System Design: blue
- Values/Culture: purple
- Manager / Final: terracotta

---

## Part B — User Submissions (Future)

- Supabase table: `interview_submissions` (company_slug, role, year, round, question, outcome, user_id)
- Form on company page: "Add your interview experience"
- Admin moderation before publishing
- Builds over time into AU-IT community database

**Files (Part B — not in scope now):**
| File | Action |
|------|--------|
| `supabase/007_interview_questions.sql` | Create — submissions table |
| `app/api/interviews/submit/route.ts` | Create — submission endpoint |
| `components/InterviewSubmitForm.tsx` | Create — submission form |

---

## Part A Acceptance Criteria

- [ ] `interviewQuestions[]` and `interviewProcess` fields added to `CompanyData`
- [ ] All 8 companies have real curated questions (min 5 each)
- [ ] Every question has a `sourceUrl` pointing to the primary source
- [ ] Round chips render in correct colour per round type
- [ ] "View on Glassdoor" deeplink present for each company
- [ ] Section is responsive at 375px
- [ ] `npm run build` passes

---

## Notes

- Never fabricate questions. If a company has no public data, note "Process not publicly documented — see Glassdoor" and link out.
- Update annually — companies change their process. Add `year` field to track staleness.
- Part B (user submissions) unlocks the real long-term value. Part A seeds it with enough content to be immediately useful.
