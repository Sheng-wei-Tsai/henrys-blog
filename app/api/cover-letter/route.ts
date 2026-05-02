import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';
import { kvGet, kvSet } from '@/lib/kv';

// Cover letter fragments are role+company-specific — cache for 7 days
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

function normalizeCacheSegment(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
}

const SYSTEM_PROMPT = `You are a senior career coach specialising in the Australian IT job market with 15+ years placing engineers at Atlassian, Canva, CBA, and Accenture.

Write a tailored, authentic cover letter following these rules exactly:

STRUCTURE (4 paragraphs, 320–400 words total):
1. HOOK — 1–2 sentences. Reference something specific the company has shipped, announced, or is known for technically. Then state the role. Never start with "I am writing to apply".
2. EVIDENCE — 2–4 sentences. Pick the 2 strongest matches between the candidate's background and the JD requirements. Use concrete numbers or outcomes where possible (e.g. "reduced load time by 40%", "shipped to 10k users"). Name the tech stack overlap explicitly.
3. WHY THEM — 2–3 sentences. One genuine, specific reason this company over others in the same space. Reference their engineering blog, a product feature, their tech choices, or their known culture.
4. CLOSE — 2 sentences max. Confident, direct ask for the next step. Not "I look forward to hearing from you" — something like "I'd welcome a conversation about how I can contribute to [team/goal]."

RULES:
- Australian English: recognised, organised, colour, behaviour, programme, analyse, centre
- Banned words: passionate, leverage, synergy, dynamic, self-starter, motivated, excited, team player, results-driven, detail-oriented, fast-paced
- No bullet points, no headers, no bold text — plain flowing paragraphs only
- Never use the phrase "I am writing to apply for"
- The candidate must sound like a real person, not a template

OUTPUT: Plain text only. No subject line, no "Dear Hiring Manager" salutation unless the candidate provides a contact name.`;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'cover-letter');
  if (!withinLimit) return rateLimitResponse();

  let body: { jobTitle?: string; company?: string; jobDescription?: string; background?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { jobTitle, company, jobDescription, background } = body;
  if (!jobTitle || !company || !jobDescription || !background) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const cacheKey = `cover-letter-fragment:${normalizeCacheSegment(company)}:${normalizeCacheSegment(jobTitle)}`;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ── 1. KV fast path ────────────────────────────────────────────────────────
  const kvHit = await kvGet(cacheKey);
  if (kvHit && kvHit.length > 100) {
    void recordUsage(auth.user.id, 'cover-letter');
    return new Response(kvHit, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── 2. Supabase fallback ───────────────────────────────────────────────────
  const { data: cached } = await sb
    .from('cover_letter_fragments_cache')
    .select('cover_letter_text')
    .eq('cache_key', cacheKey)
    .maybeSingle();

  const cachedText = (cached as { cover_letter_text?: string } | null)?.cover_letter_text;
  if (cachedText && cachedText.length > 100) {
    void kvSet(cacheKey, cachedText, CACHE_TTL_SECONDS);
    void recordUsage(auth.user.id, 'cover-letter');
    return new Response(cachedText, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── 3. Generate fresh ──────────────────────────────────────────────────────
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userPrompt = `Write a cover letter for this role.

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CANDIDATE BACKGROUND:
${background.slice(0, 1500)}

Write the cover letter now. 3-4 paragraphs, plain text only, no headers or bullet points.`;

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 800,
    stream: true,
  });

  const encoder = new TextEncoder();
  const chunks: string[] = [];
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          controller.enqueue(encoder.encode(text));
          chunks.push(text);
        }
      }
      controller.close();
      // Write to both caches after stream completes (fire-and-forget)
      const fullText = chunks.join('');
      if (fullText.length > 100) {
        void kvSet(cacheKey, fullText, CACHE_TTL_SECONDS);
        void sb.from('cover_letter_fragments_cache').upsert(
          { cache_key: cacheKey, cover_letter_text: fullText, updated_at: new Date().toISOString() },
          { onConflict: 'cache_key' },
        );
      }
    },
  });

  void recordUsage(auth.user.id, 'cover-letter');
  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
