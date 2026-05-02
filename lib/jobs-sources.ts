export const SOURCE_PRECEDENCE = [
  'greenhouse', 'lever', 'workday', 'ashby',
  'smartrec', 'apsjobs', 'hatch',
  'apify',
  'adzuna', 'googlejobs', 'google_jobs', 'jsearch',
  '80kh', 'jora', 'acs',
  'remotive', 'jobicy',
] as const;

export type KnownSource = typeof SOURCE_PRECEDENCE[number];

const SOURCE_LABELS: Record<string, string> = {
  greenhouse:  'Greenhouse',
  lever:       'Lever',
  workday:     'Workday',
  ashby:       'Ashby',
  apify:       'Apify',
  adzuna:      'Adzuna',
  googlejobs:  'Google Jobs',
  google_jobs: 'Google Jobs',
  jsearch:     'Google Jobs',
  '80kh':      '80,000 Hours',
  jora:        'Jora',
  acs:         'ACS',
  remotive:    'Remotive',
  jobicy:      'Jobicy',
  indeed:      'Indeed',
  seek:        'Seek',
  linkedin:    'LinkedIn',
  smartrec:    'Smartrecruiters',
  apsjobs:     'APS Jobs',
  hatch:       'Hatch',
};

export function sourceLabel(name: string): string {
  return SOURCE_LABELS[name] ?? name;
}

export interface SourceRef {
  name:      string;
  label:     string;
  apply_url: string;
}

export function formatAttribution(sources: SourceRef[]): string {
  if (!sources.length) return '';
  const primary = sources[0];
  const extra   = sources.length - 1;
  return extra > 0 ? `via ${primary.label} + ${extra} ↗` : `via ${primary.label}`;
}

export function pickPrimarySource(sources: SourceRef[]): string {
  for (const p of SOURCE_PRECEDENCE) {
    if (sources.some(s => s.name === p)) return p;
  }
  return sources[0]?.name ?? 'unknown';
}

export function makeSingleSource(name: string, url: string): SourceRef[] {
  return [{ name, label: sourceLabel(name), apply_url: url }];
}
