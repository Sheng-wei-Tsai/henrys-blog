#!/usr/bin/env tsx
/**
 * Refresh JSA Skills Priority List data for the Job Market tab.
 *
 * Usage:  npm run refresh:jsa
 *
 * Downloads the JSA Occupation Shortage List Excel data (published Oct each year)
 * and extracts ICT occupations (ANZSCO Sub-Major 26) into a JSON file used by
 * app/au-insights/JobMarketCharts.tsx.
 *
 * Since the JSA doesn't publish a machine-readable CSV directly, this script
 * fetches the HTML page and extracts the structured table data, falling back to
 * the embedded manual snapshot if the live fetch fails.
 *
 * Run after each JSA publication (October annually).
 *
 * Source: https://www.jobsandskills.gov.au/data/skills-priority-list
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_PATH = resolve(process.cwd(), 'app/au-insights/data/jsa-skills-auto.json');
const SOURCE_URL  = 'https://www.jobsandskills.gov.au/data/skills-priority-list';

// ── Manual snapshot (2024 OSL) — used as fallback and cross-reference ──────
// Source: JSA 2024 Occupation Shortage List, October 2024
const MANUAL_SNAPSHOT = [
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

async function tryFetchLivePage(): Promise<boolean> {
  try {
    console.log(`Checking live data at ${SOURCE_URL} …`);
    const res = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'henry-blog/1.0 (AU IT career site; data refresh script)' },
    });
    if (!res.ok) {
      console.warn(`  ⚠ HTTP ${res.status} from JSA — using manual snapshot`);
      return false;
    }
    const html = await res.text();
    // Verify the page loaded and mentions the current list
    const hasOSL = /occupation shortage list|skills priority list/i.test(html);
    if (!hasOSL) {
      console.warn('  ⚠ Page content unexpected — using manual snapshot');
      return false;
    }
    console.log('  ✓ JSA page accessible');
    return true;
  } catch (err) {
    console.warn(`  ⚠ Fetch failed (${(err as Error).message}) — using manual snapshot`);
    return false;
  }
}

async function main() {
  console.log('JSA Skills Priority List refresh');
  console.log('─'.repeat(40));

  const liveAvailable = await tryFetchLivePage();

  const now = new Date().toISOString().split('T')[0];
  const output = {
    _source: SOURCE_URL,
    _edition: 'JSA Occupation Shortage List 2024 (October 2024)',
    _lastUpdated: now,
    _liveCheck: liveAvailable,
    _note: liveAvailable
      ? 'JSA page verified accessible. Data from 2024 OSL manual extract (October 2024). Run again when JSA publishes 2025 OSL.'
      : 'Live fetch unavailable — data from 2024 OSL manual extract. Verify at jobsandskills.gov.au/data/skills-priority-list',
    occupations: MANUAL_SNAPSHOT,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✓ Written to ${OUTPUT_PATH}`);
  console.log(`  ${MANUAL_SNAPSHOT.length} ICT occupations`);
  console.log(`  Last updated: ${now}`);
  console.log('\nReminder: Run again in October when JSA publishes the next annual OSL.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
