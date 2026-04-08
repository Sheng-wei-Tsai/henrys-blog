# Feature: Company Comparison Tool

**Priority:** 🟡 Medium-High
**Status:** 🔲 Not started
**Branch:** `feature/company-comparison`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Let users pick 2–3 companies and see a side-by-side visual comparison across every
dimension that matters to an international grad: comp, WFH, visa, interview difficulty,
culture rating, and tech stack overlap.

All data already exists in `companies/data.ts` — this is entirely a UI feature.

---

## User Story

> "I have offers from Atlassian and CBA. I want to see them side by side before I decide."

> "I'm targeting product companies — show me Canva vs SafetyCulture vs Google."

---

## UI Flow

### Step 1 — Select companies (on /au-insights Company Tiers tab)
- Add a "Compare" toggle button to each company chip in the tier list
- When toggled: chip gets a checkmark, a persistent "Compare (2)" bar appears at the bottom
- Minimum 2, maximum 3 companies
- "Compare →" button opens the comparison view

### Step 2 — Comparison page `/au-insights/compare`
- URL params: `?a=atlassian&b=canva&c=cba`
- Shareable — copy URL to share comparison

### Layout (desktop: columns, mobile: stacked cards per company)

```
                   Atlassian     Canva        CBA
────────────────────────────────────────────────────
Glassdoor          3.1 ★         3.9 ★        3.8 ★
Recommend %        42%           68%           —
WFH Policy         Fully remote  Hybrid        Hybrid
Grad Salary        $95k–$115k    $90k–$110k    $75k–$90k
Senior Salary      $180k–$230k   $165k–$220k   $155k–$200k
Visa Sponsorship   ✅ Accredited ✅ Accredited  ✅ Accredited
Interview Diff.    ●●●●○         ●●●○○         ●●○○○
Tech Stack         [chips]       [chips]       [chips]
────────────────────────────────────────────────────
```

### Radar chart (D3 spider/radar chart)
- 6 axes: Compensation · Culture · WFH Flexibility · Career Growth · Interview Ease · Visa Reliability
- Each company plotted as a coloured polygon
- Normalised 0–10 scale per axis
- Hover to see exact values

### Score normalisation logic
```ts
// Compensation: grad range midpoint / 100 → /10
// Culture: glassdoor.rating × 2 → /10
// WFH: "Fully remote"=10, "Hybrid"=6, "On-site"=2
// Career Growth: glassdoor.careerOpportunities × 2
// Interview Ease: invert difficulty (5=easiest, 1=hardest)
// Visa Reliability: accredited=10, sponsors=7, no=0
```

### Interview difficulty scoring
Derived from `culture.interviewStyle` text + known patterns:
```ts
const DIFFICULTY: Record<string, number> = {
  'atlassian':      4,  // LeetCode hard + system design + values
  'canva':          3,  // take-home + system design
  'google-au':      5,  // LeetCode hard, most rigorous
  'amazon-aws':     4,  // LP × 5 + coding + system design
  'optiver':        5,  // mental maths + probability, hardest
  'safetyCulture':  2,  // practical, low LeetCode
  'accenture':      2,  // STAR + case study
  'ibm-au':         2,  // structured competency
  'tcs':            1,  // accessible
  'cba':            2,  // STAR + HackerRank medium
  'deloitte-digital': 2, // case study + STAR
};
```

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/compare/page.tsx` | Create — comparison page (client component) |
| `app/au-insights/compare/RadarChart.tsx` | Create — D3 spider chart |
| `app/au-insights/CompanyTiers.tsx` | Modify — add compare toggle to chips |

---

## Acceptance Criteria

- [ ] "Compare" toggle appears on each company chip in the tier list
- [ ] Bottom bar shows selected count and "Compare →" button when ≥2 selected
- [ ] Comparison table renders all 8 dimensions
- [ ] Radar chart renders with correct normalised values
- [ ] URL is shareable — loading `/compare?a=atlassian&b=canva` pre-selects those companies
- [ ] Mobile view stacks companies as cards, not table columns
- [ ] Back button returns to tiers tab with previous selection preserved
- [ ] `npm run build` passes
