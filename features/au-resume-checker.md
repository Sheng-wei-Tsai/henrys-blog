# Feature: AU Resume Rules Checker

**Priority:** 🟡 Medium
**Status:** 🔲 Not started
**Branch:** `feature/au-resume-checker`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Instantly flag resume formatting mistakes that cause AU recruiters to bin international
grad applications — before they apply.

International grads submit resumes in US or Asian formats. AU has specific unwritten
rules that differ significantly. No tool on the market addresses these AU-specific rules.

---

## User Story

> "I just copied my US resume. Will AU recruiters accept it?"

The checker returns a score and flags specific issues:
- ❌ Remove your photo — AU law prohibits requiring photos, and including one signals you don't know AU norms
- ❌ Remove your date of birth — never required in AU
- ❌ Your resume is 4 pages — AU standard is 2 pages max for grads
- ⚠ "Analyze" should be "Analyse" — use AU English spelling
- ✅ No home address — correct (city only is standard)
- ✅ Reverse chronological order — correct

---

## AU-Specific Rules Checked

| Rule | Severity | What to look for |
|------|----------|-----------------|
| No photo | ❌ Critical | Presence of image embed, "Photo:", profile picture |
| No date of birth | ❌ Critical | "DOB:", "Date of Birth:", "Born:", age |
| No nationality/citizenship (unless relevant) | ⚠ Warning | "Nationality:", "Citizenship:" (visa status OK) |
| Max 2 pages | ❌ Critical | Word/character count proxy |
| No full home address | ⚠ Warning | Street address detected |
| AU English spelling | ⚠ Warning | US spellings: analyze/analyse, color/colour, organize/organise, etc. |
| No "References available on request" | ℹ Info | Redundant phrase — remove it |
| No objective statement | ℹ Info | Outdated in AU — replace with professional summary |
| Quantified achievements | ✅ Check | Detect presence of numbers/% in bullet points |
| Action verbs | ✅ Check | First word of each bullet point |
| TFN / Medicare / passport numbers | ❌ Critical | Should never be on a resume |

---

## Input Methods

1. **Paste text** — paste resume as plain text into a textarea
2. **Upload .txt or .docx** — parse client-side using browser File API
   - `.txt` — read directly
   - `.docx` — use `mammoth.js` (MIT license) to extract text client-side, no server upload

No resume content ever leaves the browser — privacy by design.

---

## Scoring

```
AU Resume Score: X / 10

Critical issues (❌): -2 points each (max -6)
Warnings (⚠):        -1 point each (max -3)
Info (ℹ):             -0.5 points each (max -1)

Base score: 10
Floor: 0
```

Score bands:
- 9–10: 🟢 AU-Ready
- 7–8:  🟡 Minor fixes needed
- 5–6:  🟠 Significant issues
- 0–4:  🔴 Not AU-ready — major revision needed

---

## Detection Logic

All client-side text analysis — no AI, no API:

```ts
function checkPhoto(text: string): boolean {
  return /\bphoto\b|\bheadshot\b|\bprofile picture\b/i.test(text);
}

function checkDOB(text: string): boolean {
  return /\b(dob|date of birth|born|age)\s*[:.]?\s*\d/i.test(text);
}

function checkFullAddress(text: string): boolean {
  // Detect street number + street name pattern
  return /\b\d{1,4}\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/.test(text);
}

function checkUSSpelling(text: string): string[] {
  const US_TO_AU: Record<string, string> = {
    'analyze': 'analyse', 'analyze': 'analyse',
    'color': 'colour', 'honor': 'honour', 'behavior': 'behaviour',
    'organize': 'organise', 'recognize': 'recognise',
    'defense': 'defence', 'offense': 'offence',
    'program': 'programme', // (note: "program" OK in IT context)
    'traveled': 'travelled', 'modeling': 'modelling',
  };
  return Object.entries(US_TO_AU)
    .filter(([us]) => new RegExp(`\\b${us}\\b`, 'i').test(text))
    .map(([us, au]) => `"${us}" → "${au}"`);
}

function estimatePageCount(text: string): number {
  // ~500 words per page
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / 500);
}
```

---

## UI Design

```
┌─────────────────────────────────────────────────────┐
│ AU Resume Checker                                   │
│ Paste your resume text below — nothing is uploaded  │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ Paste your resume here...                     │   │
│ │                                               │   │
│ └───────────────────────────────────────────────┘   │
│ [Upload .txt or .docx instead]                      │
└─────────────────────────────────────────────────────┘

→ (results appear instantly as text is entered)

┌─────────────────────────────────────────────────────┐
│ 🟡 AU Resume Score: 6 / 10                         │
│ Minor fixes needed                                  │
│                                                     │
│ ❌ Photo detected — remove it                      │
│    AU anti-discrimination law means photos are     │
│    not expected and can actually hurt you.         │
│                                                     │
│ ❌ 4 pages detected — trim to 2 pages max          │
│    AU recruiters spend ~6 seconds on a resume.     │
│                                                     │
│ ⚠  US spelling: "analyze" → "analyse" (×3)         │
│    "color" → "colour" (×1)                         │
│                                                     │
│ ✅ No date of birth                                 │
│ ✅ No full home address                             │
│ ✅ Reverse chronological order detected             │
└─────────────────────────────────────────────────────┘
```

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/resume-checker/page.tsx` | Create — page |
| `app/au-insights/resume-checker/ResumeChecker.tsx` | Create — client component |
| `app/au-insights/resume-checker/rules.ts` | Create — all detection logic |

---

## Dependencies

| Package | License | Purpose |
|---------|---------|---------|
| `mammoth` | MIT | Extract text from .docx client-side |

---

## Page Integration

- Link from `/resume` page: "Check AU formatting →"
- Link from Career Guide tab in `/au-insights`
- Add to homepage tools section

---

## Privacy Note

Display prominently: "Your resume is analysed entirely in your browser. Nothing is sent to a server."

---

## Acceptance Criteria

- [ ] Paste text input works — results update within 300ms
- [ ] .docx upload extracts text correctly via mammoth
- [ ] All 11 rules implemented and tested
- [ ] Score calculates correctly for all severity levels
- [ ] US spelling detection catches at least 10 common variants
- [ ] Page count estimation works reasonably (within ±1 page)
- [ ] Privacy statement visible above input
- [ ] Mobile-friendly at 375px
- [ ] `npm run build` passes
