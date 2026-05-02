import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getRoleById } from '@/lib/interview-roles';
import { UNIVERSAL_QUESTIONS } from '@/lib/universal-questions';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';
import { kvGet, kvSet } from '@/lib/kv';

// Interview questions are stable — cache for 7 days
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'interview/questions');
  if (!withinLimit) return rateLimitResponse();

  let body: { roleId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { roleId } = body;
  if (!roleId) {
    return new Response(JSON.stringify({ error: 'Missing roleId' }), { status: 400 });
  }

  const role = getRoleById(roleId);
  if (!role) {
    return new Response(JSON.stringify({ error: 'Unknown role' }), { status: 400 });
  }

  // Universal questions are hardcoded — no AI call, no cache needed
  if (roleId === 'universal') {
    void recordUsage(auth.user.id, 'interview/questions');
    return new Response(JSON.stringify({ questions: UNIVERSAL_QUESTIONS }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `interview-questions:${roleId}`;

  // Service client — bypasses RLS for the shared interview_questions_cache table
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ── 1. KV fast path ────────────────────────────────────────────────
  const kvHit = await kvGet(cacheKey);
  if (kvHit) {
    try {
      const parsed = JSON.parse(kvHit) as { questions?: unknown[] };
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        void recordUsage(auth.user.id, 'interview/questions');
        return new Response(kvHit, { headers: { 'Content-Type': 'application/json' } });
      }
    } catch { /* corrupt KV entry — fall through to Supabase */ }
  }

  // ── 2. Supabase fallback ────────────────────────────────────────────
  const { data: cached } = await sb
    .from('interview_questions_cache')
    .select('questions')
    .eq('role_id', roleId)
    .maybeSingle();

  if (cached?.questions && Array.isArray(cached.questions) && cached.questions.length > 0) {
    const payload = JSON.stringify({ questions: cached.questions });
    void kvSet(cacheKey, payload, CACHE_TTL_SECONDS);
    void recordUsage(auth.user.id, 'interview/questions');
    return new Response(payload, { headers: { 'Content-Type': 'application/json' } });
  }

  // ── 3. Generate fresh questions ─────────────────────────────────────
  const prompt = `Generate the 10 most commonly asked interview questions for a ${role.title} role in Australia at companies like ${role.companies.slice(0, 3).join(', ')}.

Topics to cover: ${role.topics.join(', ')}.

Each question must have a "questionType": choose the best fit:
- "mcq"  — conceptual / knowledge check. Add "options" (exactly 4 strings), "correctIndex" (0-3), "explanation" (1-2 sentences: why the correct option is right).
- "code" — implementation or debugging task. Add "starterCode" (5-10 lines of starter code with a TODO comment where they write the solution, use the relevant language for the role).
- "text" — behavioural / system design / open-ended. No extra fields.

Aim for: 3 mcq, 3 code, 4 text across the 10 questions.

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "id": "q1",
      "text": "The interview question here?",
      "questionType": "mcq",
      "scenario": "A brief real-world scenario at an Australian tech company where this question would come up (1-2 sentences, specific and concrete)",
      "focus": "What this question is really testing (one sentence)",
      "concepts": ["key concept 1", "key concept 2", "key concept 3"],
      "framework": "How to structure a strong answer (2-3 sentences describing the approach)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why the correct answer is right (1-2 sentences)",
      "starterCode": ""
    }
  ]
}

Requirements:
- Mix technical and behavioural questions (60% technical, 40% behavioural)
- Realistic questions that Australian tech companies actually ask at ${role.difficulty} level
- Exactly 10 questions
- For mcq: options must be plausible (not obviously wrong)
- For code: starterCode must be runnable with a clear TODO
- For text: leave options, explanation, starterCode as empty strings`;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content ?? '{"questions":[]}';

    // Write to both caches (fire-and-forget — failures must not block the response)
    void kvSet(cacheKey, raw, CACHE_TTL_SECONDS);
    try {
      const parsed = JSON.parse(raw) as { questions?: unknown[] };
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        void sb.from('interview_questions_cache').upsert(
          { role_id: roleId, questions: parsed.questions, updated_at: new Date().toISOString() },
          { onConflict: 'role_id' },
        );
      }
    } catch { /* ignore JSON parse errors for caching */ }

    void recordUsage(auth.user.id, 'interview/questions');
    return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('OpenAI questions error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate questions';
    return new Response(JSON.stringify({ error: msg }), { status: 502 });
  }
}
