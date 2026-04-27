import { claudeMessage } from './llm-claude';
import type { FeedItem } from './fetch-digest';

// ── Rule-based pre-filter ────────────────────────────────────────
const NOISE_PATTERNS = [
  /excited to (announce|introduce|share)/i,
  /proud to (introduce|present|launch)/i,
  /we('re| are) (thrilled|delighted|pleased)/i,
  /available (now|today) (in|on|for)/i,
  /sign up (now|today|for free)/i,
  /join (our|the) (waitlist|beta)/i,
  /terms of (service|use)|privacy policy/i,
  /^[\s\S]{0,60}$/, // titles under 60 chars with no summary are likely noise
];

// Strong signals of a genuine research essay or deep technical post
const QUALITY_SIGNALS = [
  /benchmark|evaluat|experiment|ablat/i,
  /we (show|demonstrate|find|propose|introduce a (method|framework|approach))/i,
  /training|fine.?tun|pre.?train/i,
  /architecture|transformer|attention|diffusion/i,
  /dataset|corpus|annotation|human.?eval/i,
  /accuracy|precision|recall|f1|perplexity|bleu|rouge/i,
  /paper|arxiv|research|study|findings/i,
  /outperform|state.of.the.art|sota/i,
  /safety|alignment|rlhf|constitutional/i,
  /open.source|code available|github\.com/i,
  /lesson|learned|postmortem|tradeoff|analysis/i,
  /essay|long.?read|deep.?dive/i,
];

function scoreItem(item: FeedItem): number {
  const text = `${item.title} ${item.summary}`;
  let score = 0;

  for (const p of NOISE_PATTERNS)  { if (p.test(text)) score -= 4; }
  for (const p of QUALITY_SIGNALS) { if (p.test(text)) score += 2; }

  // Reward longer, more substantive summaries
  if (item.summary.length < 100)  score -= 5;
  if (item.summary.length < 300)  score -= 2;
  if (item.summary.length > 600)  score += 2;
  if (item.summary.length > 1200) score += 1;

  // Trusted curated sources get a baseline boost
  if (['The Gradient', 'Ahead of AI', 'AI Alignment Forum'].includes(item.source)) score += 4;
  if (['Hugging Face Papers', 'Papers With Code'].includes(item.source)) score += 3;
  if (['Anthropic Research', 'Google DeepMind'].includes(item.source)) score += 2;

  return score;
}

export function ruleBasedFilter(items: FeedItem[]): FeedItem[] {
  const scored = items
    .map(item => ({ item, score: scoreItem(item) }))
    .filter(({ score }) => score > 0)   // stricter threshold
    .sort((a, b) => b.score - a.score);

  console.log(`\n📊 Rule filter: ${items.length} → ${scored.length} items kept`);
  scored.slice(0, 12).forEach(({ item, score }) =>
    console.log(`   [${score > 0 ? '+' : ''}${score}] [${item.source}] ${item.title.slice(0, 70)}`)
  );
  return scored.map(s => s.item);
}

// ── Claude quality gate ──────────────────────────────────────────
// Claude reads everything and picks only the genuinely valuable ones.
const QUALITY_GATE_PROMPT = `You are curating a digest of the highest-quality AI essays, research papers, and technical writing for senior developers.

Your bar is very high. An item passes only if it meets ALL of these:
1. Teaches something non-obvious — not just "X is now available"
2. Written by a credible researcher or practitioner with domain expertise
3. Has lasting value beyond this week — not just a news item
4. Directly relevant to building AI-powered products or understanding AI deeply

Return ONLY the indices (0-based) of items that genuinely pass this bar. Aim for 4–6 items maximum.
Prefer essays and papers over blog announcements. Prefer novel findings over confirmations.

Return JSON only: { "keep": [0, 3, 5, ...], "reason": "one line why these were selected" }

Items:
`;

export async function claudeQualityGate(items: FeedItem[]): Promise<FeedItem[]> {
  if (items.length === 0) return [];

  const itemList = items
    .map((item, i) => `${i}. [${item.source}] ${item.title}\n   ${item.summary.slice(0, 300)}`)
    .join('\n\n');

  const raw = await claudeMessage({
    model:  'claude-sonnet-4-6',
    prompt: QUALITY_GATE_PROMPT + itemList,
  });

  let indices: number[] = [];
  try {
    const match  = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { keep: [] };
    indices = parsed.keep ?? [];
    if (parsed.reason) console.log(`\n🤖 Claude selected: ${parsed.reason}`);
  } catch {
    return items.slice(0, 6);
  }

  const filtered = indices
    .filter((i: number) => i >= 0 && i < items.length)
    .map((i: number) => items[i]);

  console.log(`\n🤖 Claude gate: ${items.length} → ${filtered.length} items kept`);
  return filtered;
}

export async function filterItems(items: FeedItem[]): Promise<FeedItem[]> {
  const afterRules = ruleBasedFilter(items);
  if (afterRules.length === 0) return [];
  return claudeQualityGate(afterRules);
}
