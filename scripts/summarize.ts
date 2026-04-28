import { claudeMessage, ClaudeQuotaError } from './llm-claude';
import type { FeedItem } from './fetch-digest';

export interface DigestEntry {
  source:       string;
  title:        string;
  link:         string;
  summary:      string;
  whyItMatters: string;
  whatYouCanBuild: string;
  keyTakeaways: string[];
}

const SYSTEM_PROMPT = `You are a senior AI engineer writing a digest of the most valuable AI research and essays for developers building real products.

For each piece, you write:
- A clear, honest summary (what was done, how, what was found) — 2 tight paragraphs
- Why it matters to a developer building AI products today
- One concrete, specific project idea they can start this week using this research
- Exactly 3 key takeaways — specific facts or lessons, not vague platitudes

Your writing is direct, precise, and treats the reader as an expert.
Never use the phrases "delve into", "it's worth noting", "in conclusion", or "exciting".
No hype. No marketing language. Just the substance.

Return valid JSON only.`;

const userPrompt = (item: FeedItem) => `
Summarize this research/essay for a senior developer audience:

Source: ${item.source}
Title: ${item.title}
URL: ${item.link}
Content: ${item.summary.slice(0, 3000)}

Return JSON in this exact shape:
{
  "summary": "2-paragraph summary of what was done and what was found",
  "whyItMatters": "1 paragraph — why does this matter for developers building AI products right now",
  "whatYouCanBuild": "1 specific, concrete project idea a developer can start this week using insights from this paper/essay",
  "keyTakeaways": ["specific takeaway 1", "specific takeaway 2", "specific takeaway 3"]
}
`;

export async function summarizeItem(item: FeedItem): Promise<DigestEntry> {
  const raw = await claudeMessage({
    model:  'claude-sonnet-4-6',
    system: SYSTEM_PROMPT,
    prompt: userPrompt(item),
  });

  let parsed: {
    summary: string;
    whyItMatters: string;
    whatYouCanBuild: string;
    keyTakeaways: string[];
  };

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
    if (!parsed?.summary) throw new Error('bad parse');
  } catch {
    parsed = {
      summary:         item.summary.slice(0, 400),
      whyItMatters:    '',
      whatYouCanBuild: '',
      keyTakeaways:    [],
    };
  }

  return {
    source:          item.source,
    title:           item.title,
    link:            item.link,
    summary:         parsed.summary,
    whyItMatters:    parsed.whyItMatters,
    whatYouCanBuild: parsed.whatYouCanBuild,
    keyTakeaways:    parsed.keyTakeaways ?? [],
  };
}

function plainEntry(item: FeedItem): DigestEntry {
  return {
    source:          item.source,
    title:           item.title,
    link:            item.link,
    summary:         item.summary.slice(0, 400),
    whyItMatters:    '',
    whatYouCanBuild: '',
    keyTakeaways:    [],
  };
}

export async function summarizeAll(items: FeedItem[]): Promise<DigestEntry[]> {
  console.log(`\n🤖 Summarizing ${items.length} items with Claude Sonnet...`);
  const results: DigestEntry[] = [];
  let quotaExhausted = false;

  for (const item of items) {
    process.stdout.write(`   → [${item.source}] ${item.title.slice(0, 60)}... `);
    if (quotaExhausted) {
      results.push(plainEntry(item));
      console.log('plain (quota exhausted)');
      continue;
    }
    try {
      const entry = await summarizeItem(item);
      results.push(entry);
      console.log('✓');
    } catch (err) {
      if (err instanceof ClaudeQuotaError) {
        console.log('quota hit — remaining items as plain');
        quotaExhausted = true;
        results.push(plainEntry(item));
      } else {
        console.log(`✗ skipped (${(err as Error).message.slice(0, 50)})`);
      }
    }
  }

  return results;
}
