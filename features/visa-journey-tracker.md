# Feature: Visa Journey Tracker

**Priority:** 🟡 Medium
**Status:** 🔲 Not started
**Branch:** `feature/visa-journey-tracker`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Give international grads a personal, step-by-step tracker for the 482 / Skills in Demand
visa process — the most stressful and opaque part of working in Australia.

The process has 6+ stages, takes 3–18 months, and costs $5,000–$15,000. There is no
single resource that explains what to do, in what order, with realistic timelines.

---

## User Story

> "My employer said they'll sponsor me. What do I do next and how long will it take?"

The tracker shows:
- ✅ Step 1: Skills Assessment (ACS) — completed
- ✅ Step 2: Employer becomes Standard Business Sponsor — completed
- 🔄 Step 3: Nomination lodged — in progress, avg 4–8 weeks
- ⬜ Step 4: Visa Application — not started
- ⬜ Step 5: Health + Character checks — not started
- ⬜ Step 6: Visa Grant — not started

---

## Visa Pathway Data

### 482 / Skills in Demand Visa (primary pathway for IT workers)

```ts
interface VisaStep {
  id: string;
  number: number;
  title: string;
  description: string;
  who: 'You' | 'Employer' | 'Both';
  avgTimeWeeks: { min: number; max: number };
  cost: string;
  officialUrl: string;
  tips: string[];
  documents: string[];
  watchOuts: string[];
}
```

### Steps

**Step 1 — Skills Assessment (ACS)**
- Who: You
- Time: 8–12 weeks
- Cost: ~$530 AUD
- Documents: degree certificates, transcripts, employment references (each role), identity docs
- Tips: Submit all documents in English. If translated, must be by NAATI-certified translator.
- Watch out: ACS assesses your highest degree + relevant experience. If your degree isn't IT, you need 4+ years of experience.

**Step 2 — Employer becomes Standard Business Sponsor**
- Who: Employer
- Time: 1–8 weeks (accredited sponsors: ~1 week; new sponsors: 4–8 weeks)
- Cost: ~$420 AUD (employer pays)
- Tips: Ask if your employer is already an accredited sponsor — dramatically speeds up processing.
- Watch out: Some small companies have never sponsored before — this step can add months.

**Step 3 — Nomination**
- Who: Employer
- Time: 4–12 weeks (accredited: ~1 week)
- Cost: ~$330 AUD (employer pays)
- Documents: Labour Market Testing evidence (job ads must have run 4 weeks), employment contract
- Tips: Employer must pay you at least the Temporary Skilled Migration Income Threshold (TSMIT) — $73,150 AUD in 2025.
- Watch out: Your occupation MUST be on the Core Skills Occupation List (CSOL) — confirm before starting.

**Step 4 — Visa Application Lodgement**
- Who: You
- Time: same day
- Cost: ~$3,115 AUD (primary applicant) + ~$1,040 per additional family member
- Documents: passport, ACS assessment letter, employment contract, health insurance
- Tips: Lodge as soon as nomination is approved — bridging visa starts automatically.

**Step 5 — Health & Character Checks**
- Who: You
- Time: 2–4 weeks
- Cost: ~$300–$500 (medical examination)
- Documents: complete medical at an approved BUPA/IME clinic, police clearances from each country lived in 12+ months
- Watch out: Some countries' police clearances take 3–6 months — start early.

**Step 6 — Visa Grant**
- Who: Department of Home Affairs
- Time: 4–24 weeks (median ~8 weeks for ICT roles as of 2025)
- Cost: nil (already paid)
- Tips: If employer is an accredited sponsor, processing is typically 1–2 weeks.
- Watch out: Don't resign from current employer until visa is granted, not just lodged.

---

## UI Design

### Personal tracker (requires auth)

```
/dashboard/visa-tracker   (sub-section of existing dashboard)

My 482 Visa Journey
───────────────────
Started: [date picker]
Employer: [text input]
Occupation: [ANZSCO picker]

Progress:
Step 1  ✅ Skills Assessment      Completed 14 Mar 2026
Step 2  ✅ Employer Sponsorship   Completed 28 Mar 2026
Step 3  🔄 Nomination             In progress — lodged 2 Apr 2026
                                  Avg wait: 4–8 weeks
                                  Est. completion: May 2026
Step 4  ⬜ Visa Lodgement         Not started
Step 5  ⬜ Health & Character     Not started
Step 6  ⬜ Visa Grant             Not started

Estimated visa grant: Jul–Aug 2026 (based on your start date)
Total estimated cost: ~$3,965 AUD (you) + ~$750 (employer)
```

### Step detail panel (click any step)
- Full description + what to do
- Documents checklist (checkable)
- Official DoHA link
- Tips and watch-outs
- "Mark as complete" button

### Public reference page (no auth needed)
`/au-insights/visa-guide` — read-only version of all 6 steps with timeline and costs.
No personal tracking. Useful for anyone researching before they start.

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/visa-guide/page.tsx` | Create — public reference page |
| `app/dashboard/visa-tracker/page.tsx` | Create — personal tracker (auth required) |
| `app/au-insights/data/visa-steps.ts` | Create — all 6 step data |
| `supabase/007_visa_tracker.sql` | Create — user progress table |
| `app/api/visa-tracker/route.ts` | Create — save/load progress |

---

## Database Schema

```sql
CREATE TABLE visa_tracker (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users NOT NULL,
  employer    text,
  occupation  text,
  started_at  date,
  steps       jsonb DEFAULT '{}',  -- { "step1": { completed: true, date: "2026-03-14", notes: "" } }
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE visa_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tracker" ON visa_tracker
  FOR ALL USING (auth.uid() = user_id);
```

---

## Page Integration

- Link from `/au-insights` Visa Sponsors tab: "Track your visa journey →"
- Link from each company page sponsorship section
- Link from `/dashboard` as a new card: "Visa Journey Tracker"

---

## Acceptance Criteria

- [ ] Public visa guide at `/au-insights/visa-guide` renders all 6 steps with timeline
- [ ] Personal tracker requires auth — redirects to login if not authenticated
- [ ] Step completion persists to Supabase per user
- [ ] Document checklist items are individually checkable and persisted
- [ ] Estimated completion date updates dynamically based on completed steps
- [ ] Total cost estimate shown (splits your cost vs employer cost)
- [ ] Mobile-friendly at 375px
- [ ] `npm run build` passes
