# Feature: AU Grad Program Deadline Tracker

**Priority:** 🔴 High
**Status:** 🔲 Not started
**Branch:** `feature/grad-program-tracker`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Show international new grads exactly which AU IT grad programs are open, closing soon, or
coming up — with live countdowns. Miss the window and you wait a full year.

Most international grads don't know these programs exist, let alone their exact deadlines.
This is unique to AU and not covered anywhere else in a single place.

---

## User Story

> "I'm graduating in November 2026. Which grad programs should I apply to right now,
> and when do they close?"

The tracker shows:
- Atlassian: 🟢 Open — closes in 34 days
- CBA: 🟡 Closing Soon — closes in 8 days
- Google AU: 🔴 Closed — opens again July 2026
- AWS: 🔵 Not Yet Open — opens August 2026

---

## Data Model

```ts
interface GradProgram {
  company: string;
  slug: string;           // links to /au-insights/companies/[slug]
  tier: string;
  logoColor: string;      // brand accent colour for the card

  program: {
    name: string;         // e.g. "Atlassian Graduate Program"
    url: string;          // direct link to apply
    roles: string[];      // roles available in this intake
    locations: string[];  // AU cities
    intakeMonth: string;  // e.g. "February 2027"
    headcount: string;    // e.g. "~50 graduates" or "Not disclosed"
  };

  applicationWindow: {
    opensDate: string | null;   // ISO date or null if unknown
    closesDate: string | null;  // ISO date or null if unknown
    status: 'open' | 'closing-soon' | 'closed' | 'not-yet-open' | 'rolling';
  };

  requirements: string[];   // key eligibility criteria
  salaryRange: string;      // e.g. "$80k – $95k base"
  sponsorsVisa: boolean;
  notes: string;
}
```

---

## Companies & Data (2026 intake cycle)

| Company | Program | Status | Closes | Roles |
|---------|---------|--------|--------|-------|
| Atlassian | Graduate Program | Open Jul–Oct | Oct | SWE, PM, Design |
| Canva | Graduate Program | Open Jul–Sep | Sep | SWE, Data, Design |
| Google AU | STEP / Grad | Open Aug–Nov | Nov | SWE, PM |
| Amazon / AWS | New Grad SDE | Rolling | Rolling | SDE, Solutions Arch |
| CBA | Graduate Program | Open Mar–May | May | SWE, Data, Cyber |
| Accenture | Technology Associate | Open Mar–Jun | Jun | Tech Analyst, Cloud |
| Deloitte | Graduate Program | Open Mar–Jun | Jun | Tech Consultant |
| IBM | Graduate Hire | Open Mar–May | May | Cloud, AI, Cyber |
| Optiver | Graduate Software Dev | Open Apr–Jun | Jun | SWE, Quant |
| TCS | TCS NQT | Rolling | Rolling | SWE, BA, Test |
| Westpac | Technology Graduate | Open Mar–May | May | SWE, Data |
| ANZ | Technology Graduate | Open Mar–May | May | SWE, DevOps |
| NAB | Technology Graduate | Open Mar–May | May | SWE, Cloud |

---

## UI Design

### Status badge colours
- 🟢 `open` — green, countdown in days
- 🟡 `closing-soon` — amber, countdown in days (< 14 days remaining)
- 🔴 `closed` — red, "Opens [month]"
- 🔵 `not-yet-open` — blue, "Opens [month]"
- ⚪ `rolling` — grey, "Rolling intake"

### Page layout
```
/au-insights/grad-programs

Filter bar: [All Cities ▾] [All Roles ▾] [Visa Sponsors only □] [Open only □]

Summary strip: 3 open · 2 closing soon · 5 closed · 3 not yet open

Cards grid (2 col desktop, 1 col mobile):
┌─────────────────────────────┐
│ 🟢 OPEN                     │
│ Atlassian Graduate Program  │
│ Sydney · Feb 2027 intake    │
│ SWE · PM · Design           │
│ $90k–$110k · ✅ Visa        │
│ Closes in 34 days           │
│ [Apply Now →]               │
└─────────────────────────────┘
```

### Countdown logic
```ts
const daysLeft = Math.ceil(
  (new Date(closesDate).getTime() - Date.now()) / 86400000
);
status = daysLeft <= 0 ? 'closed'
       : daysLeft <= 14 ? 'closing-soon'
       : 'open';
```

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/grad-programs/page.tsx` | Create — server component, static render |
| `app/au-insights/grad-programs/GradProgramCard.tsx` | Create — individual card with countdown |
| `app/au-insights/data/grad-programs.ts` | Create — all program data |

---

## Page Integration

- New tab in `/au-insights`: add "Grad Programs" tab with 🎓 icon
- Link from each company detail page: "View grad program →"
- Link from Career Guide tab

---

## Acceptance Criteria

- [ ] All 13 companies have program data
- [ ] Status badge auto-updates based on current date (no manual update needed for status)
- [ ] Countdown shows days remaining for open/closing-soon programs
- [ ] Filter by city, role, and visa-sponsor works client-side
- [ ] "Open only" toggle hides closed/not-yet-open programs
- [ ] Each card links to official application URL
- [ ] Visa sponsor indicator visible on each card
- [ ] Responsive at 375px
- [ ] `npm run build` passes

---

## Maintenance Notes

- Update `applicationWindow` dates annually (July each year for most programs)
- CBA / bank programs open March each year — earlier than tech companies
- Amazon/TCS are truly rolling — no fixed window
- Optiver opens April for June intake — matches university semester end
