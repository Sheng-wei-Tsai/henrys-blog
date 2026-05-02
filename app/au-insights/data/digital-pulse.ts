/**
 * ACS Digital Pulse 2025 — headline workforce statistics
 *
 * Source: Australian Computer Society (ACS) Digital Pulse 2025 Annual Report
 * URL:    https://www.acs.org.au/insightsandpublications/reports-publications/digital-pulse.html
 * Published: November 2024 (2025 edition covers FY2023–24 data)
 *
 * Figures extracted from the executive summary and key findings sections.
 * Update this file annually when ACS publishes the next edition (typically Q4).
 */

export const DIGITAL_PULSE_META = {
  _year: 2025,
  _edition: 'ACS Digital Pulse 2025',
  _accessed: '2026-04-07',
  _url: 'https://www.acs.org.au/insightsandpublications/reports-publications/digital-pulse.html',
};

export const DIGITAL_PULSE_STATS: {
  label: string;
  value: string;
  subtext: string;
  color: string;
  trend?: 'up' | 'down' | 'flat';
}[] = [
  {
    label: 'Tech workforce',
    value: '935,000',
    subtext: 'AU tech professionals (+4.2% YoY)',
    color: 'var(--jade)',
    trend: 'up',
  },
  {
    label: 'Median tech salary',
    value: '$130k',
    subtext: 'AUD, across all IT roles',
    color: 'var(--vermilion)',
    trend: 'up',
  },
  {
    label: 'Salary growth',
    value: '+10%',
    subtext: 'YoY — highest in 5 years',
    color: 'var(--jade)',
    trend: 'up',
  },
  {
    label: 'AI skills premium',
    value: '+18%',
    subtext: 'Salary uplift for AI-skilled workers',
    color: 'var(--gold)',
    trend: 'up',
  },
  {
    label: 'Women in tech',
    value: '29%',
    subtext: 'Of total tech workforce (+1pp YoY)',
    color: 'var(--gold)',
    trend: 'up',
  },
  {
    label: 'Jobs by 2030',
    value: '1.1M',
    subtext: 'Projected AU tech workforce',
    color: 'var(--text-secondary)',
    trend: 'up',
  },
];

export const DIGITAL_PULSE_TOP_SKILLS: { skill: string; growth: number; category: string }[] = [
  { skill: 'AI / Machine Learning',   growth: 38, category: 'Data & AI' },
  { skill: 'Cloud & DevOps',          growth: 29, category: 'Infrastructure' },
  { skill: 'Cybersecurity',           growth: 24, category: 'Security' },
  { skill: 'Data Engineering',        growth: 21, category: 'Data & AI' },
  { skill: 'Software Engineering',    growth: 14, category: 'Engineering' },
  { skill: 'Business Analysis',       growth: 9,  category: 'Consulting' },
];

export const DIGITAL_PULSE_INSIGHTS: string[] = [
  'Australia needs 653,000 additional digital workers by 2030 to meet projected demand.',
  'AI-skilled professionals earn 18% more on average than peers without AI capabilities.',
  'Cloud & DevOps is the fastest-growing infrastructure skill for the third consecutive year.',
  'The gender pay gap in tech narrowed to 8.3% — down from 11.2% in 2022.',
  'Only 29% of tech roles are held by women; representation drops to 18% at executive level.',
];
