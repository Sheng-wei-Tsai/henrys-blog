import OpenAI from 'openai';
import type { FeedItem } from './fetch-digest';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Rule-based pre-filter (free, instant) ─────────────────────

// Patterns that signal low-quality / pure marketing content
const NOISE_PATTERNS = [
  /excited to (announce|introduce|share)/i,
  /proud to (introduce|present|launch)/i,
  /we('re| are) (thrilled|delighted|pleased)/i,
  /introducing [A-Z][a-z]+:/i,           // "Introducing Foo: A new..."
  /^\s*(announcing|launched?|new:)/i,
  /check out our (new|latest)/i,
  /available (now|today) (in|on|for)/i,
  /sign up (now|today|for free)/i,
  /join (our|the) (waitlist|beta)/i,
  /terms of (service|use)|privacy policy/i,
];

// Technical keywords that signal real substance
const QUALITY_SIGNALS = [
  /benchmark|evaluat/i,
  /experiment|ablat/i,
  /architecture|model|training|fine.?tun/i,
  /dataset|corpus|annotation/i,
  /accuracy|precision|recall|f1|perplexity/i,
  /paper|research|study|findings/i,
  /outperform|state.of.the.art|sota/i,
  /open.source|released|code available/i,
  /workflow|pipeline|system design/i,
  /lesson|learned|mistake|tradeoff/i,
];

function scoreItem(item: FeedItem): number {
  const text = `${item.title} ${item.summary}`;
  let score = 0;

  // Penalize noise
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(text)) score -= 3;
  }

  // Reward quality signals
  for (const pattern of QUALITY_SIGNALS) {
    if (pattern.test(text)) score += 2;
  }

  // Penalize very short summaries (likely just a title re-stated)
  if (item.summary.length < 80)  score -= 4;
  if (item.summary.length < 200) score -= 1;
  if (item.summary.length > 400) score += 1;

  // ArXiv papers get a small boost — peer-reviewed by definition
  if (item.source === 'ArXiv') score += 2;

  return score;
}

export function ruleBasedFilter(items: FeedItem[]): FeedItem[] {
  const scored = items
    .map(item => ({ item, score: scoreItem(item) }))
    .filter(({ score }) => score > -2)          // drop obvious noise
    .sort((a, b) => b.score - a.score);

  console.log(`\n📊 Rule filter: ${items.length} → ${scored.length} items kept`);
  scored.forEach(({ item, score }) =>
    console.log(`   [${score > 0 ? '+' : ''}${score}] [${item.source}] ${item.title.slice(0, 70)}`)
  );

  return scored.map(s => s.item);
}

// ── Claude quality gate (catches what rules miss) ─────────────

const QUALITY_GATE_PROMPT = `You are a senior engineer curating a weekly digest for developers who want deep, substantive content.

Given this list of articles/papers, return ONLY the indices (0-based) of items worth including.

Exclude:
- Pure product announcements with no technical depth
- Marketing fluff ("We're excited to...")
- Content that doesn't teach or explain anything
- Duplicate topics (keep the best one)
- Anything that reads like AI-generated filler

Include:
- Technical deep-dives and architecture explanations
- Research papers with novel contributions
- Practical engineering lessons and postmortems
- Meaningful benchmark results or comparisons
- Thoughtful opinion pieces backed by evidence

Return JSON only: { "keep": [0, 2, 4, ...] }

Items:
`;

export async function claudeQualityGate(items: FeedItem[]): Promise<FeedItem[]> {
  if (items.length === 0) return [];

  const itemList = items
    .map((item, i) => `${i}. [${item.source}] ${item.title}\n   ${item.summary.slice(0, 200)}`)
    .join('\n\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',   // cheapest model — just scoring, not summarizing
    max_tokens: 256,
    messages: [{ role: 'user', content: QUALITY_GATE_PROMPT + itemList }],
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';

  let indices: number[] = [];
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { keep: [] };
    indices = parsed.keep ?? [];
  } catch {
    // If parsing fails, keep all items (don't drop anything on error)
    return items;
  }

  const filtered = indices
    .filter(i => i >= 0 && i < items.length)
    .map(i => items[i]);

  console.log(`\n🤖 Claude gate: ${items.length} → ${filtered.length} items kept`);
  return filtered;
}

// ── Combined filter pipeline ───────────────────────────────────

export async function filterItems(items: FeedItem[], useClaudeGate = true): Promise<FeedItem[]> {
  // Stage 1: fast rule-based filter
  const afterRules = ruleBasedFilter(items);

  // Stage 2: Claude quality gate (optional, costs ~$0.001)
  if (useClaudeGate && afterRules.length > 0) {
    return claudeQualityGate(afterRules);
  }

  return afterRules;
}
