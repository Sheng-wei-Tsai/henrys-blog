/**
 * fetch-au-sponsors.ts
 *
 * Downloads the Home Affairs 482 Temporary Skill Shortage visa employer list
 * and writes data/au-sponsors.json for sponsor_signal cross-referencing.
 *
 * Run manually or monthly cron:
 *   npx tsx scripts/fetch-au-sponsors.ts
 *
 * Output: data/au-sponsors.json  (~150KB, ~3,500 entries)
 */

import * as fs    from 'fs';
import * as path  from 'path';
import * as http  from 'http';
import * as https from 'https';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
type PdfData = { text: string; numpages: number };
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfParse: (buf: Buffer) => Promise<PdfData> = _require('pdf-parse');

const PDF_URL  = 'https://immi.homeaffairs.gov.au/support-subsite/files/482-employers-list.pdf';
const OUT_PATH = path.join(process.cwd(), 'data', 'au-sponsors.json');

export interface Sponsor {
  name:       string;
  abn:        string | null;
  normalised: string;
}

// Strip legal suffixes so "Atlassian Pty Ltd" matches "Atlassian"
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bpty\s*\.?\s*ltd\.?/gi, '')
    .replace(/\bproprietary\s+limited\b/gi, '')
    .replace(/\blimited\b/gi, '')
    .replace(/\bltd\.?\b/gi, '')
    .replace(/\binc\.?\b/gi, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const ABN_RE = /^\d{11}$/;

function extractSponsors(text: string): Sponsor[] {
  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sponsors: Sponsor[] = [];

  for (let i = 0; i < lines.length; i++) {
    const curr = lines[i];
    const next = lines[i + 1] ?? '';

    // Skip obvious non-company lines: page numbers, headers
    if (/^\d{1,4}$/.test(curr)) continue;
    if (/^(employer|abn|name|page|list of)/i.test(curr)) continue;

    const currIsABN = ABN_RE.test(curr.replace(/\s/g, ''));
    const nextIsABN = ABN_RE.test(next.replace(/\s/g, ''));

    if (currIsABN) {
      // ABN then company name
      if (next && !nextIsABN && next.length > 2) {
        sponsors.push({ name: next, abn: curr.replace(/\s/g, ''), normalised: normaliseName(next) });
        i++;
      }
    } else if (nextIsABN) {
      // Company name then ABN
      if (curr.length > 2) {
        sponsors.push({ name: curr, abn: next.replace(/\s/g, ''), normalised: normaliseName(curr) });
        i++;
      }
    }
  }

  return sponsors.filter(s => s.name.length > 2 && s.normalised.length > 0);
}

async function main() {
  console.log('Downloading 482 employer list PDF from Home Affairs...');
  const buf = await downloadBuffer(PDF_URL);
  console.log(`Downloaded ${Math.round(buf.length / 1024)}KB`);

  const data     = await pdfParse(buf);
  const sponsors = extractSponsors(data.text);
  console.log(`Extracted ${sponsors.length} sponsors`);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(sponsors, null, 2));
  console.log(`Written to ${OUT_PATH}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
