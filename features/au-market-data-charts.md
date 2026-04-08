# Feature: AU IT Market Data Visualisations

**Priority:** 🔴 High
**Status:** 🔲 Not started
**Branch:** `feature/au-market-charts`
**Started:** —
**Shipped:** —

---

## Goal

Add four new data-driven interactive chart panels to `/au-insights`, each backed by a
distinct authoritative government or industry data source. The combined dashboard gives
any Australian IT job seeker a single place to answer:

- "Is demand for my skills growing?" (ABS Vacancy Index)
- "What salary should I be targeting?" (ACS Digital Pulse)
- "What do CS grads actually earn in their first year?" (QILT Graduate Outcomes)
- "Which skills have the biggest supply–demand gap?" (Jobs & Skills Australia)

All data must be sourced from the primary URL, version-labelled, and displayed with a
clear citation inside the component. No fabricated numbers.

---

## Data Sources & Implementation Plan

### 1. ABS Internet Vacancy Index (IVI)

**Source:** https://www.abs.gov.au/statistics/labour/employment-and-unemployment/internet-vacancy-index
**Format:** Monthly CSV download (`IVI_timeseries.csv`) — free, no API key
**Coverage:** Jan 2006 – present, monthly, by occupation (ANZSCO) and state

**Data to extract:**
- Series ID `A85223554T` — ICT Professionals, Total Australia, monthly index
- Compare against All Occupations baseline
- Year-over-year % change per month

**Charts:**
- **Line chart** — ICT vacancy index vs All Occupations (2019–2025), monthly
  - Annotate COVID crash (Apr 2020), tech hiring surge (2021–22), AI-driven demand shift (2024)
  - Hover → show exact index value + YoY % change for that month
- **Bar chart** — ICT vacancy index by state (NSW, VIC, QLD, WA, SA) latest month

**Implementation:**
1. Download `IVI_timeseries.csv` at build time from ABS (or embed a snapshot in `/app/au-insights/data/`)
2. Parse with `d3.csvParse` — filter rows for ANZSCO "ICT Professionals"
3. Render `ABSVacancyCharts` client component in new tab or section

**Files:**
| File | Action |
|------|--------|
| `app/au-insights/data/abs-ivi-ict.json` | Create — pre-processed snapshot of ABS data |
| `app/au-insights/ABSVacancyCharts.tsx` | Create — D3 line + bar charts |
| `scripts/fetch-abs-ivi.ts` | Create — optional refresh script |

---

### 2. ACS Digital Pulse Salary Survey

**Source:** https://www.acs.org.au/insightsandpublications/reports-publications/digital-pulse.html
**Format:** Annual PDF report — key salary tables extractable manually
**Coverage:** Annual (2020, 2021, 2022, 2023, 2024), salary by role, state, gender, experience

**Data to extract (from PDF tables):**
- Median salary by IT role (SWE, DevOps, Data Engineer, BA, PM, Cyber, QA)
- Salary by years of experience (0–2, 2–5, 5–10, 10+)
- Gender pay gap per role
- Salary by state
- Year-over-year salary growth rate per role (2020–2024)

**Charts:**
- **Grouped bar** — median salary by role, 2022 vs 2023 vs 2024 (shows which roles are growing fastest)
- **Dot/dumbbell chart** — salary by experience band per role (shows ROI of experience)
- **Heatmap** — salary by role × state (colour intensity = $ value)
- **Small delta bars** — gender pay gap per role (highlight where gap is widest/narrowest)

**Implementation:**
1. Extract salary tables from ACS Digital Pulse 2024 PDF manually → embed as JSON in `/app/au-insights/data/acs-salary.json`
2. Cite PDF source URL + year + page number inside the component
3. Render `ACSalaryCharts.tsx` client component

**Files:**
| File | Action |
|------|--------|
| `app/au-insights/data/acs-salary.json` | Create — extracted from ACS Digital Pulse 2024 |
| `app/au-insights/ACSalaryCharts.tsx` | Create — grouped bar + dumbbell + heatmap |

---

### 3. QILT Graduate Outcomes Survey

**Source:** https://www.qilt.edu.au/surveys/graduate-outcomes-survey-(gos)
**Format:** Excel/CSV download — free, no login required
**Coverage:** Annual (2018–2024), employment outcomes by field of study, institution, state

**Data to extract:**
- Full-time employment rate for IT/Computer Science graduates, 4 months after graduation
- Median starting salary for IT graduates by year (2018–2024 trend)
- Employment rate by university (top 20 AU unis)
- Full-time employment rate: IT vs Engineering vs Business vs Health (comparison)

**Charts:**
- **Line chart** — IT grad employment rate over time (2018–2024), vs all-disciplines average
  - Annotate COVID dip + recovery
- **Bar chart** — median starting salary by university (horizontal, sorted)
  - Shows which unis produce the highest-earning grads
- **Grouped bar** — IT vs other disciplines: employment rate + starting salary side by side

**Implementation:**
1. Download GOS Excel from QILT, extract IT-related rows → `app/au-insights/data/qilt-grad.json`
2. Render `QILTGradCharts.tsx` client component

**Files:**
| File | Action |
|------|--------|
| `app/au-insights/data/qilt-grad.json` | Create — extracted from QILT GOS 2024 |
| `app/au-insights/QILTGradCharts.tsx` | Create — line + bar + grouped bar |

---

### 4. Jobs & Skills Australia (JSA) — Skills Priority List

**Source:** https://www.jobsandskills.gov.au/data/skills-priority-list
**Format:** Excel download — free, updated annually
**Coverage:** 2022, 2023, 2024 — shortage/surplus rating per occupation (ANZSCO), national + state

**Data to extract:**
- ICT occupations rated "Shortage" vs "Shortage in some regions" vs "Balanced" vs "Surplus"
- Year-over-year change in shortage status per ICT role
- Which ICT roles went from balanced → shortage (best upskilling signal)
- State-by-state variation (e.g. Cyber Security Analyst: shortage nationally but balanced in SA)

**Charts:**
- **Matrix/grid** — ICT occupations × year (2022/2023/2024), colour = shortage status
  - Red = shortage, amber = regional shortage, green = balanced, grey = surplus
  - Instantly shows which roles are becoming more/less in demand over time
- **Bubble chart** — ICT roles by shortage level (x) vs median salary (y), bubble = number of job ads
  - Quadrant labels: "Target" (high shortage, high pay), "Avoid" (surplus, low pay)
- **State map** — choropleth of shortage level for a selected ICT occupation across AU states

**Implementation:**
1. Download JSA Skills Priority List 2024 Excel → extract ICT rows → `app/au-insights/data/jsa-skills.json`
2. Build matrix grid without D3 (pure CSS grid) — simpler and faster
3. Bubble chart with D3
4. State map with D3 (AU GeoJSON from aus-topo or similar)

**Files:**
| File | Action |
|------|--------|
| `app/au-insights/data/jsa-skills.json` | Create — extracted from JSA Skills Priority List 2024 |
| `app/au-insights/JSASkillsCharts.tsx` | Create — matrix + bubble chart |

---

## Page Integration

All four panels added as a new **"Job Market"** tab in `/au-insights/page.tsx`:

```
Tabs: Company Tiers | IT Ecosystem | Visa Sponsors | Career Guide | Job Market (new)
```

Each data section within the tab has:
- A clear heading with the data source name and year
- A one-line insight ("what this means for you")
- The chart(s)
- A citation footer with the exact URL + date accessed

---

## Acceptance Criteria

- [ ] ABS IVI line chart renders with real monthly data (min 3 years)
- [ ] ACS salary grouped bar renders with real ACS Digital Pulse 2024 figures
- [ ] QILT line chart shows real employment rate trend (min 5 years)
- [ ] JSA skills matrix renders all ICT ANZSCO codes for 2022–2024
- [ ] Every chart has a source citation footer with exact URL
- [ ] All charts responsive via ResizeObserver (same pattern as SponsorshipCharts)
- [ ] No fabricated data — all numbers traceable to a primary source
- [ ] `npm run build` passes
- [ ] New "Job Market" tab added to `/au-insights`

---

## Implementation Order

1. **Data collection first** — download/extract all four datasets, save as JSON in `app/au-insights/data/`
2. **ABS IVI** — most visual impact (monthly trend), implement first
3. **ACS Salary** — most directly useful to job seekers, implement second
4. **QILT** — smaller dataset, quick to implement
5. **JSA Skills** — most complex (matrix + bubble), implement last

---

## Senior Dev Test Checklist

- [ ] Data source URLs cited inside every component (not just in this doc)
- [ ] JSON data files include `_source` and `_accessed` metadata fields
- [ ] Charts handle missing data gracefully (no crash on sparse series)
- [ ] Mobile layout tested at 375px — no horizontal scroll
- [ ] Hover interactions work on both mouse and touch

---

## Notes / History

- **2026-04-07** — Feature spec written. Data download + extraction is the first required step before any code.
- ABS IVI CSV: Series A85223554T is the ICT Professionals index. Filter `Data Type = FLOW`, `Frequency = Month`.
- ACS Digital Pulse 2024 PDF: salary tables on pp. 34–52. Gender gap table p. 61.
- QILT GOS 2024: filter `Field of Education = Information Technology`. Download "National Results" Excel.
- JSA Skills Priority List 2024: filter `ANZSCO Major Group = 2 — Professionals`, `Sub-Major = 26 — ICT`.
