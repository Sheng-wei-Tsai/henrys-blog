import OpenAI from 'openai';
import type { FeedItem } from './fetch-digest';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DigestEntry {
  source: string;
  title: string;
  link: string;
  summary: string;
  diagram?: string;
  keyTakeaways: string[];
}

const SYSTEM_PROMPT = `You are a senior software engineer and AI researcher writing a weekly digest for developers.
Your job is to summarize content clearly, extract practical insights, and when the topic has a concept worth visualizing, generate a Mermaid diagram.

Rules:
- Keep summaries to 2-3 short paragraphs, plain language
- Extract exactly 3 key takeaways as short bullet points
- Only generate a Mermaid diagram if the concept is architectural, a workflow, or a comparison (skip for news/announcements)
- Mermaid diagrams must use: graph TD, sequenceDiagram, or flowchart LR only
- Return valid JSON only, no markdown wrapper`;

const userPrompt = (item: FeedItem) => `
Summarize this for a developer audience:

Source: ${item.source}
Title: ${item.title}
Content: ${item.summary.slice(0, 2000)}

Return JSON in this exact shape:
{
  "summary": "2-3 paragraph summary",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "diagram": "mermaid code here OR null"
}
`;

export async function summarizeItem(item: FeedItem): Promise<DigestEntry> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',   // cheap + fast, good quality for summaries
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt(item) },
    ],
    response_format: { type: 'json_object' },  // forces valid JSON output
    max_tokens: 1024,
  });

  const raw = response.choices[0].message.content ?? '{}';

  let parsed: { summary: string; keyTakeaways: string[]; diagram: string | null };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { summary: item.summary.slice(0, 300), keyTakeaways: [], diagram: null };
  }

  return {
    source: item.source,
    title: item.title,
    link: item.link,
    summary: parsed.summary,
    keyTakeaways: parsed.keyTakeaways ?? [],
    diagram: parsed.diagram ?? undefined,
  };
}

export async function summarizeAll(items: FeedItem[]): Promise<DigestEntry[]> {
  console.log(`\n🤖 Summarizing ${items.length} items with GPT-4o-mini...`);
  const results: DigestEntry[] = [];

  for (const item of items) {
    process.stdout.write(`   → [${item.source}] ${item.title.slice(0, 60)}... `);
    const entry = await summarizeItem(item);
    results.push(entry);
    console.log('✓');
  }

  return results;
}
