# Feature: "Is This Salary Fair?" Checker

**Priority:** 🔴 High
**Status:** 🔲 Not started
**Branch:** `feature/salary-checker`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Give international new grads an instant, data-backed verdict on whether a salary offer is
fair for the Australian IT market — and a negotiation script if it isn't.

The single most financially impactful tool on the site. International grads routinely accept
first offers 15–30% below market because they have no AU reference point.

---

## User Story

> "I just got an offer from Accenture for $72k as a grad Software Engineer in Sydney.
> Is that fair? Should I negotiate?"

The tool returns:
- Market median for that role + experience level: **$76k**
- Their offer vs market: **5% below median (28th percentile)**
- Verdict: 🟡 **Below Market — negotiate**
- Suggested counter-offer: **$78–80k**
- One-line negotiation script ready to copy

---

## Data Sources

All data already exists in the codebase — no new sources needed:

| Dataset | File | Used for |
|---------|------|---------|
| `SALARIES_BY_ROLE` | `app/au-insights/data/job-market.ts` | Junior/mid/senior ranges per role |
| `SALARY_BY_SECTOR` | `app/au-insights/data/job-market.ts` | Sector premium/discount vs national avg |
| `DIGITAL_PULSE_STATS` | `app/au-insights/data/digital-pulse.ts` | National median ($130k) as anchor |
| `JSA_ICT_OCCUPATIONS` | `app/au-insights/data/job-market.ts` | Shortage status (affects negotiating power) |

---

## UI Flow

```
Step 1 — Role & Experience
  ┌──────────────────────────────┐
  │ What role were you offered?  │
  │ [Dropdown — 12 IT roles]     │
  │                              │
  │ Years of experience?         │
  │ [0–2 yrs] [2–5 yrs] [5+ yrs]│
  └──────────────────────────────┘

Step 2 — Offer Details
  ┌──────────────────────────────┐
  │ Your offered salary (AUD)    │
  │ [$_______ per year]          │
  │                              │
  │ Company type (optional)      │
  │ [FAANG] [Product] [Bank]     │
  │ [Consulting] [IT Services]   │
  └──────────────────────────────┘

Step 3 — Verdict (instant, no submit needed)
  ┌──────────────────────────────────────────┐
  │ 🟡 Below Market                          │
  │                                          │
  │ Your offer:      $72,000                 │
  │ Market median:   $76,000  ████████░░ 47% │
  │ Your percentile: 28th                    │
  │                                          │
  │ For Software Engineer (0–2 yrs) in AU,   │
  │ the typical range is $70k–$85k.          │
  │                                          │
  │ Suggested counter: $78,000–$80,000       │
  │                                          │
  │ ┌─────────────────────────────────────┐  │
  │ │ Negotiation script (copy)           │  │
  │ │ "Thank you for the offer. Based on  │  │
  │ │ market data, I was expecting        │  │
  │ │ $78–80k for this role. Is there     │  │
  │ │ flexibility on the base salary?"    │  │
  │ └─────────────────────────────────────┘  │
  │                                          │
  │ ⚠ Shortage note: Software Developers    │
  │ are in national shortage (JSA 2024) —   │
  │ your negotiating position is strong.    │
  └──────────────────────────────────────────┘
```

---

## Verdict Logic

```ts
const pct = (offer / marketMedian) * 100;

if (pct >= 110)  → 🟢 Above Market — strong offer
if (pct >= 95)   → 🟢 Fair — accept or small counter
if (pct >= 85)   → 🟡 Below Market — negotiate
if (pct < 85)    → 🔴 Significantly Below — push back hard
```

Percentile calculation:
- Assume salary is normally distributed between `junior` and `senior` values
- `(offer - junior) / (senior - junior)` → linear percentile within band

Counter-offer suggestion:
- Target = market median × 1.05 (5% above median is a reasonable ask)
- Range = ±$2k around target

Negotiation script templates (4 variants based on verdict):
- Above Market: "Confirming acceptance" script
- Fair: "Soft counter" script
- Below Market: "Market data counter" script
- Significantly Below: "Strong counter with walkaway signal" script

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/salary-checker/page.tsx` | Create — main page |
| `app/au-insights/salary-checker/SalaryChecker.tsx` | Create — interactive client component |

---

## Page Integration

- Add link from `/au-insights` Career Guide tab: "Check if your offer is fair →"
- Add link from each company detail page salary section: "Check your offer →"
- Add to homepage tools section

---

## Acceptance Criteria

- [ ] Role dropdown covers all 12 roles in `SALARIES_BY_ROLE`
- [ ] Verdict updates instantly as user types salary (no submit button)
- [ ] All 4 verdict states render correctly with correct colours
- [ ] Negotiation script is copyable (clipboard API)
- [ ] Shortage status shown when role is in JSA shortage
- [ ] Responsive at 375px — single column, no horizontal scroll
- [ ] No external API calls — all local data
- [ ] `npm run build` passes
