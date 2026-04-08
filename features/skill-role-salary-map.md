# Feature: Skill → Role → Salary Map

**Priority:** 🟡 Medium-High
**Status:** 🔲 Not started
**Branch:** `feature/skill-role-map`
**Started:** 2026-04-07
**Shipped:** —

---

## Goal

Answer the #1 question every new grad has: "I know these skills — what roles can I get,
what salary should I target, and what should I learn next?"

Connects three datasets already on the site (ACS salary, JSA shortage, Digital Pulse skill
demand) into a single interactive tool. No new data sources needed.

---

## User Story

> "I know Python, React, and some AWS. What jobs should I be applying for in Australia?"

Output:
- You qualify for: **Frontend Engineer** (strong), **Software Engineer** (good), **Data Engineer** (partial)
- Best match salary: **$115k–$130k** (mid-level)
- Add these 2 skills to unlock: **DevOps / Cloud Engineer** (+$20k jump)
- Highest shortage role you're close to: **Cyber Security Engineer** (national shortage)

---

## Skill List (30 AU IT skills)

Grouped into 6 categories:

```ts
const SKILLS = {
  Languages:     ['Python', 'Java', 'TypeScript', 'Go', 'C++', 'Kotlin', 'SQL'],
  Frontend:      ['React', 'Vue', 'Angular', 'CSS/Tailwind', 'Next.js'],
  Backend:       ['Node.js', 'Django/FastAPI', 'Spring Boot', '.NET', 'GraphQL'],
  Cloud & Infra: ['AWS', 'Azure', 'GCP', 'Docker/Kubernetes', 'Terraform', 'Linux'],
  Data & AI:     ['Machine Learning', 'Data Engineering', 'Spark/Kafka', 'SQL Analytics'],
  Security:      ['Penetration Testing', 'GRC / Compliance', 'SIEM', 'Network Security'],
};
```

---

## Role Matching Logic

Each role has a skill requirement profile — required skills (must have) and bonus skills (nice to have):

```ts
const ROLE_REQUIREMENTS: Record<string, { required: string[]; bonus: string[]; minMatch: number }> = {
  'Software Engineer':    { required: ['Python|Java|TypeScript|Go'], bonus: ['Docker/Kubernetes', 'AWS'], minMatch: 1 },
  'Frontend Engineer':    { required: ['React|Vue|Angular', 'TypeScript|JavaScript'], bonus: ['Next.js', 'GraphQL'], minMatch: 2 },
  'Backend Engineer':     { required: ['Python|Java|Node.js|Go'], bonus: ['Docker/Kubernetes', 'SQL'], minMatch: 1 },
  'DevOps / Cloud':       { required: ['AWS|Azure|GCP', 'Docker/Kubernetes'], bonus: ['Terraform', 'Linux'], minMatch: 2 },
  'Data / AI Engineer':   { required: ['Python', 'SQL Analytics|Spark/Kafka'], bonus: ['Machine Learning', 'AWS'], minMatch: 2 },
  'ML Engineer':          { required: ['Python', 'Machine Learning'], bonus: ['Data Engineering', 'AWS'], minMatch: 2 },
  'Cyber Security':       { required: ['Network Security|SIEM|Penetration Testing'], bonus: ['Python', 'GRC / Compliance'], minMatch: 1 },
  'Solutions Architect':  { required: ['AWS|Azure|GCP', 'Python|Java'], bonus: ['Terraform', 'Docker/Kubernetes'], minMatch: 2 },
};
```

Match score: `(matchedRequired / totalRequired) × 70 + (matchedBonus / totalBonus) × 30`

---

## "Next Skill" Recommendation

For each unqualified role, calculate which single skill addition would increase match score the most:
```ts
// For each role user doesn't qualify for:
//   Try adding each skill they don't have
//   Find which addition gives the biggest score jump
//   Recommend top 3 "unlock" skills with salary impact
```

---

## UI Design

```
┌─────────────────────────────────────────────────────┐
│ Select your current skills                          │
│                                                     │
│ Languages:                                          │
│ [Python ✓] [Java] [TypeScript ✓] [Go] [SQL ✓]     │
│                                                     │
│ Cloud & Infra:                                      │
│ [AWS ✓] [Docker/Kubernetes] [Terraform]             │
│ ...                                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Your matches                                        │
│                                                     │
│ ●●●●● Software Engineer      $120k–$160k  🔴 Shortage │
│ ●●●●○ Frontend Engineer      $115k–$172k              │
│ ●●●○○ Data / AI Engineer     $130k–$170k  🔴 Shortage │
│ ●●○○○ DevOps / Cloud         $135k–$190k  🔴 Shortage │
│                                                     │
│ 🔓 Unlock DevOps / Cloud: add Docker/Kubernetes    │
│    → +$20k salary jump, national shortage role      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Best companies to target                            │
│ Based on your top match (Software Engineer):        │
│ [Atlassian] [Canva] [Google AU] [CBA]              │
└─────────────────────────────────────────────────────┘
```

---

## Files

| File | Action |
|------|--------|
| `app/au-insights/skill-map/page.tsx` | Create — page wrapper |
| `app/au-insights/skill-map/SkillMap.tsx` | Create — interactive client component |
| `app/au-insights/data/skill-requirements.ts` | Create — role-to-skill mapping data |

---

## Page Integration

- New tab in `/au-insights` or link from Career Guide
- Link from Job Market tab: "See which roles your skills qualify for →"
- Link from company detail pages: "Do you have the skills for this company? →"

---

## Acceptance Criteria

- [ ] All 30 skills selectable across 6 categories
- [ ] Match scores update instantly as skills are toggled
- [ ] Top 5 matching roles shown with match strength bars
- [ ] Salary range shown per matched role
- [ ] JSA shortage status badge shown per role
- [ ] "Unlock" recommendation shows top 3 skills to add with salary impact
- [ ] "Best companies" section shows relevant companies for top-matched role
- [ ] `npm run build` passes
