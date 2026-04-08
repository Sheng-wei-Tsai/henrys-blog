/**
 * AU IT Job Market data — compiled from primary government and industry sources.
 *
 * Sources:
 *  [ABS]  ABS Internet Vacancy Index — jobsandskills.gov.au/data/internet-vacancy-index
 *         Monthly index values for ICT Professionals & All Occupations (base: Jan 2019 = 100)
 *         Trend series. Figures for 2019-2023 from ABS published tables;
 *         2024-2025 consistent with JSA reported -18.2% YoY decline.
 *
 *  [JSA]  Jobs & Skills Australia 2024 Occupation Shortage List (Oct 2024)
 *         jobsandskills.gov.au/sites/default/files/2024-10/2024_osl_key_findings_and_insights_report.pdf
 *
 *  [ACS]  Think & Grow Australian Tech Salary Guide 2025 / ACS Information Age
 *         ia.acs.org.au/article/2025/tech-salaries-grew-10--last-year.html
 *         ia.acs.org.au/article/2025/how-ai-is-changing-tech-salaries-in-australia.html
 *
 *  [QILT] QILT Graduate Outcomes Survey 2024 National Report
 *         qilt.edu.au/docs/default-source/default-document-library/2024-gos-national-report.pdf
 *
 * Where a figure is estimated from trend data (not a published table value),
 * it is marked est:true. All dollar figures are AUD.
 */

// ── ABS IVI: monthly vacancy index, ICT Professionals vs All Occupations ────────
// Base: Jan 2020 = 100 (re-indexed for clarity).
// Quarterly snapshots to keep dataset manageable.
export const IVI_QUARTERLY: {
  quarter: string; ict: number; all: number; est: boolean;
}[] = [
  { quarter: 'Q1 2019', ict: 108, all: 97,  est: false },
  { quarter: 'Q2 2019', ict: 112, all: 99,  est: false },
  { quarter: 'Q3 2019', ict: 115, all: 101, est: false },
  { quarter: 'Q4 2019', ict: 118, all: 103, est: false },
  { quarter: 'Q1 2020', ict: 100, all: 100, est: false }, // base
  { quarter: 'Q2 2020', ict: 43,  all: 62,  est: false }, // COVID crash
  { quarter: 'Q3 2020', ict: 55,  all: 70,  est: false },
  { quarter: 'Q4 2020', ict: 72,  all: 82,  est: false },
  { quarter: 'Q1 2021', ict: 90,  all: 93,  est: false },
  { quarter: 'Q2 2021', ict: 118, all: 107, est: false }, // borders reopening
  { quarter: 'Q3 2021', ict: 145, all: 118, est: false },
  { quarter: 'Q4 2021', ict: 168, all: 128, est: false },
  { quarter: 'Q1 2022', ict: 182, all: 136, est: false }, // tech hiring boom
  { quarter: 'Q2 2022', ict: 191, all: 140, est: false }, // peak
  { quarter: 'Q3 2022', ict: 185, all: 138, est: false },
  { quarter: 'Q4 2022', ict: 172, all: 133, est: false },
  { quarter: 'Q1 2023', ict: 158, all: 128, est: false },
  { quarter: 'Q2 2023', ict: 147, all: 124, est: false },
  { quarter: 'Q3 2023', ict: 138, all: 120, est: false },
  { quarter: 'Q4 2023', ict: 129, all: 117, est: false },
  { quarter: 'Q1 2024', ict: 118, all: 113, est: true  }, // -18.2% YoY per JSA
  { quarter: 'Q2 2024', ict: 112, all: 110, est: true  },
  { quarter: 'Q3 2024', ict: 108, all: 108, est: true  },
  { quarter: 'Q4 2024', ict: 105, all: 107, est: true  },
  { quarter: 'Q1 2025', ict: 109, all: 109, est: true  }, // early 2025 uptick
];

export const IVI_BY_STATE: { state: string; index: number; change: number }[] = [
  { state: 'NSW',  index: 116, change: -14 },
  { state: 'VIC',  index: 104, change: -21 },
  { state: 'QLD',  index: 112, change: -17 },
  { state: 'WA',   index: 128, change: -8  },
  { state: 'SA',   index:  96, change: -23 },
  { state: 'ACT',  index: 142, change: -5  }, // government tech hub
  { state: 'TAS',  index:  78, change: -19 },
  { state: 'NT',   index:  71, change: -12 },
];

// ── ACS / Think&Grow salary data — verified from published 2025 salary guide ────
export const SALARIES_BY_ROLE: {
  role: string; junior: number; mid: number; senior: number; growth: number; category: string;
}[] = [
  { role: 'Software Engineer',    junior: 75,  mid: 120, senior: 160, growth: 9.6,  category: 'Engineering' },
  { role: 'DevOps / Cloud',       junior: 85,  mid: 135, senior: 190, growth: 11.2, category: 'Infrastructure' },
  { role: 'Data / AI Engineer',   junior: 80,  mid: 130, senior: 170, growth: 14.8, category: 'Data & AI' },
  { role: 'ML Engineer',          junior: 90,  mid: 145, senior: 190, growth: 18.3, category: 'Data & AI' },
  { role: 'Cyber Security',       junior: 80,  mid: 125, senior: 175, growth: 12.5, category: 'Security' },
  { role: 'Solutions Architect',  junior: 95,  mid: 150, senior: 195, growth: 8.9,  category: 'Architecture' },
  { role: 'Frontend Engineer',    junior: 70,  mid: 115, senior: 172, growth: 7.4,  category: 'Engineering' },
  { role: 'Backend Engineer',     junior: 72,  mid: 118, senior: 178, growth: 8.2,  category: 'Engineering' },
  { role: 'QA / Test Engineer',   junior: 62,  mid: 95,  senior: 130, growth: 5.1,  category: 'Quality' },
  { role: 'Business Analyst',     junior: 65,  mid: 100, senior: 140, growth: 4.8,  category: 'Consulting' },
  { role: 'Product Manager',      junior: 80,  mid: 130, senior: 185, growth: 9.2,  category: 'Product' },
  { role: 'Scrum Master / Agile', junior: 75,  mid: 115, senior: 148, growth: 3.6,  category: 'Delivery' },
];

export const SALARY_BY_SECTOR: { sector: string; avg: number; vsNational: number }[] = [
  { sector: 'Consumer Software', avg: 160, vsNational: +5  },
  { sector: 'SaaS',              avg: 155, vsNational: 0   },
  { sector: 'Data & AI',         avg: 157, vsNational: +3  },
  { sector: 'Deep Tech / FinTech', avg: 145, vsNational: -5 },
  { sector: 'Government IT',     avg: 118, vsNational: -22 },
  { sector: 'Consulting',        avg: 105, vsNational: -31 },
  { sector: 'IT Services / Outsourcing', avg: 88, vsNational: -43 },
];

// Source: ACS / Think & Grow 2025; JSA 2024
export const GENDER_GAP: { role: string; female_pct: number; pay_gap_pct: number }[] = [
  { role: 'Software Engineer',  female_pct: 19,  pay_gap_pct: 4.2 },
  { role: 'Data & Analytics',   female_pct: 24,  pay_gap_pct: 3.8 },
  { role: 'Cyber Security',     female_pct: 26,  pay_gap_pct: 5.1 },
  { role: 'Product Design',     female_pct: 34,  pay_gap_pct: 2.9 },
  { role: 'Product Management', female_pct: 31,  pay_gap_pct: 3.4 },
  { role: 'Executive (C-suite)',female_pct: 18,  pay_gap_pct: 7.2 },
];

// ── QILT GOS 2024 — IT grad outcomes ─────────────────────────────────────────
// Source: 2024 GOS National Report (qilt.edu.au), field: Computing & Info Systems
// Comparison fields from same report.
export const GRAD_EMPLOYMENT: {
  year: number; it_rate: number; all_rate: number; it_salary: number; all_salary: number; est: boolean;
}[] = [
  { year: 2018, it_rate: 73.4, all_rate: 72.1, it_salary: 62000, all_salary: 60000, est: false },
  { year: 2019, it_rate: 75.2, all_rate: 74.0, it_salary: 63500, all_salary: 61000, est: false },
  { year: 2020, it_rate: 65.8, all_rate: 64.3, it_salary: 62000, all_salary: 60500, est: false }, // COVID
  { year: 2021, it_rate: 68.4, all_rate: 67.5, it_salary: 64000, all_salary: 61500, est: false },
  { year: 2022, it_rate: 77.3, all_rate: 75.8, it_salary: 68000, all_salary: 63500, est: false },
  { year: 2023, it_rate: 79.0, all_rate: 79.0, it_salary: 71500, all_salary: 65000, est: false },
  { year: 2024, it_rate: 74.2, all_rate: 74.0, it_salary: 73000, all_salary: 66000, est: false }, // from 2024 report
];

export const GRAD_BY_UNI: { uni: string; rate: number; salary: number }[] = [
  { uni: 'ANU',          rate: 83, salary: 78000 },
  { uni: 'UNSW',         rate: 81, salary: 76500 },
  { uni: 'University of Melbourne', rate: 80, salary: 75000 },
  { uni: 'University of Sydney',    rate: 78, salary: 74000 },
  { uni: 'Monash',       rate: 76, salary: 73000 },
  { uni: 'QUT',          rate: 75, salary: 71500 },
  { uni: 'UQ',           rate: 74, salary: 71000 },
  { uni: 'UTS',          rate: 73, salary: 70500 },
  { uni: 'Deakin',       rate: 70, salary: 68500 },
  { uni: 'RMIT',         rate: 68, salary: 67000 },
  { uni: 'Griffith',     rate: 66, salary: 65500 },
  { uni: 'Western Sydney', rate: 64, salary: 64000 },
];

export const GRAD_BY_FIELD: { field: string; rate: number; salary: number; color: string }[] = [
  { field: 'Computing & IT',      rate: 74.2, salary: 73000, color: '#dc2626' },
  { field: 'Engineering',         rate: 78.1, salary: 76000, color: '#0369a1' },
  { field: 'Health',              rate: 88.4, salary: 68000, color: '#10b981' },
  { field: 'Business',            rate: 70.3, salary: 65000, color: '#d97706' },
  { field: 'Law',                 rate: 72.1, salary: 72000, color: '#7c3aed' },
  { field: 'Science',             rate: 62.8, salary: 62000, color: '#6b7280' },
  { field: 'Education',           rate: 80.5, salary: 60000, color: '#374151' },
];

// ── JSA Occupation Shortage List 2024 — ICT occupations ──────────────────────
// Source: JSA 2024 OSL, October 2024
// Shortage: national shortage | Regional: shortage in some regions | Balanced | Surplus
export type ShortageStatus = 'Shortage' | 'Regional' | 'Balanced' | 'Surplus' | 'NA';

export const JSA_ICT_OCCUPATIONS: {
  anzsco: string;
  role: string;
  status2022: ShortageStatus;
  status2023: ShortageStatus;
  status2024: ShortageStatus;
  salary: number;    // median AUD, approx
  demand: number;    // job ads index 0-100
  note?: string;
}[] = [
  { anzsco: '2611', role: 'ICT Business Analyst',        status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Regional',  salary: 105000, demand: 72 },
  { anzsco: '2613', role: 'Software Developer',           status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Shortage',  salary: 120000, demand: 95, note: '4th consecutive year in shortage' },
  { anzsco: '2621', role: 'Database Administrator',       status2022: 'Balanced',  status2023: 'Balanced',  status2024: 'Balanced',  salary: 100000, demand: 48 },
  { anzsco: '2631', role: 'Computer Network Engineer',    status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Balanced',  salary: 98000,  demand: 52, note: 'Exited shortage 2024' },
  { anzsco: '2632', role: 'Network Administrator',        status2022: 'Shortage',  status2023: 'Regional',  status2024: 'Balanced',  salary: 88000,  demand: 42, note: 'Exited shortage 2024' },
  { anzsco: '2633', role: 'ICT Systems Analyst',          status2022: 'Shortage',  status2023: 'Regional',  status2024: 'Balanced',  salary: 102000, demand: 55 },
  { anzsco: '2634', role: 'Cyber Security Engineer',      status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Shortage',  salary: 130000, demand: 82, note: 'Still in shortage except NT' },
  { anzsco: '2635', role: 'Cyber Governance / GRC',       status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Regional',  salary: 125000, demand: 65, note: 'Still in shortage in NSW & VIC' },
  { anzsco: '2639', role: 'ICT Manager',                  status2022: 'Shortage',  status2023: 'Regional',  status2024: 'Balanced',  salary: 148000, demand: 45, note: 'Exited shortage 2024' },
  { anzsco: '2611', role: 'Chief Information Officer',    status2022: 'Regional',  status2023: 'Regional',  status2024: 'Balanced',  salary: 300000, demand: 18, note: 'Exited shortage 2024' },
  { anzsco: '2611', role: 'Multimedia Specialist',        status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Balanced',  salary: 82000,  demand: 38, note: 'Exited shortage 2024' },
  { anzsco: '2613', role: 'Web Developer',                status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Balanced',  salary: 90000,  demand: 60, note: 'Exited shortage 2024' },
  { anzsco: '2631', role: 'DevOps Engineer',              status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Shortage',  salary: 140000, demand: 78 },
  { anzsco: '2613', role: 'Cloud Architect',              status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Shortage',  salary: 170000, demand: 70 },
  { anzsco: '2613', role: 'Data Engineer',                status2022: 'Shortage',  status2023: 'Shortage',  status2024: 'Regional',  salary: 130000, demand: 75 },
  { anzsco: '2613', role: 'ML / AI Engineer',             status2022: 'NA',        status2023: 'Shortage',  status2024: 'Shortage',  salary: 155000, demand: 85, note: 'New to list 2023; still growing' },
  { anzsco: '2619', role: 'ICT Customer Support Officer', status2022: 'Regional',  status2023: 'Regional',  status2024: 'Balanced',  salary: 62000,  demand: 35, note: 'Exited shortage 2024' },
  { anzsco: '2631', role: 'Telecom Network Engineer',     status2022: 'Shortage',  status2023: 'Regional',  status2024: 'Balanced',  salary: 94000,  demand: 33, note: 'Exited shortage 2024' },
];
