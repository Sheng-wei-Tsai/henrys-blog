import fs from 'fs';
import path from 'path';
import type { DigestEntry } from './summarize';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];  // YYYY-MM-DD for filenames + sorting
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });   // "21 March 2026"
}

function entryToMd(entry: DigestEntry, index: number): string {
  const takeaways = entry.keyTakeaways.map(t => `- ${t}`).join('\n');

  const whyBlock = entry.whyItMatters
    ? `\n**Why it matters**\n\n${entry.whyItMatters}\n`
    : '';

  const buildBlock = entry.whatYouCanBuild
    ? `\n**What you can build with this**\n\n${entry.whatYouCanBuild}\n`
    : '';

  return `## ${index + 1}. [${entry.title}](${entry.link})

*${entry.source}*

${entry.summary}
${whyBlock}${buildBlock}
**Key takeaways**

${takeaways}`;
}

export function generateDigestPost(entries: DigestEntry[], date = new Date()): string {
  const dateStr    = formatDate(date);
  const displayDate = formatDisplayDate(date);
  const sources    = [...new Set(entries.map(e => e.source))].join(', ');

  const frontmatter = `---
title: "AI Research Digest — ${displayDate}"
date: "${dateStr}"
excerpt: "${entries.length} high-quality papers and essays worth reading this week, with real-world project ideas for each."
tags: ["AI Research", "Digest"]
coverEmoji: "📖"
auto_generated: true
---

*${entries.length} pieces selected from ${sources} — only the ones worth your time.*

---

`;

  const body = entries.map((e, i) => entryToMd(e, i)).join('\n\n---\n\n');

  return frontmatter + body + '\n';
}

export function writeDigestPost(entries: DigestEntry[], date = new Date()): string {
  const dateStr = formatDate(date);
  const dir     = path.join(process.cwd(), 'content', 'digests');

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${dateStr}.md`);
  const content  = generateDigestPost(entries, date);
  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`\n📝 Digest written → content/digests/${dateStr}.md`);
  return filePath;
}
