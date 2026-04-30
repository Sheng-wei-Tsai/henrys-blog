import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';

interface StudyGuide {
  summary?: string;
  keyConcepts?: Array<{ term: string; definition: string; whyMatters: string }>;
  coreInsights?: string[];
}

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'learn/quiz');
  if (!withinLimit) return rateLimitResponse();

  let body: { videoId?: string; videoTitle?: string; studyGuide?: StudyGuide };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  const { videoId, videoTitle: rawTitle, studyGuide: rawGuide } = body;
  if (!videoId || !rawTitle || !rawGuide) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const videoTitle = rawTitle.slice(0, 200);
  const studyGuide: StudyGuide = {
    summary: rawGuide.summary?.slice(0, 1000),
    coreInsights: rawGuide.coreInsights?.map(s => s.slice(0, 200)),
    keyConcepts: rawGuide.keyConcepts?.map(c => ({
      term: c.term.slice(0, 100),
      definition: c.definition.slice(0, 300),
      whyMatters: c.whyMatters.slice(0, 300),
    })),
  };

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 503 });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ── Check global cache ──────────────────────────────────────────────
  const { data: cached } = await sb
    .from('video_content')
    .select('quiz_questions')
    .eq('video_id', videoId)
    .single();

  if (cached?.quiz_questions?.length) {
    return NextResponse.json({ questions: cached.quiz_questions });
  }

  // ── Generate quiz ───────────────────────────────────────────────────
  const concepts = (studyGuide.keyConcepts ?? []).map(c => `${c.term}: ${c.definition}`).join('\n');
  const insights = (studyGuide.coreInsights ?? []).join('\n');

  const prompt = `Create a 5-question multiple choice quiz about the YouTube video: "${videoTitle}"

Study guide content:
Summary: ${studyGuide.summary ?? ''}
Key concepts:
${concepts}
Core insights:
${insights}

Return JSON only (no markdown fences, no preamble):
{
  "questions": [
    {
      "q": "question text",
      "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
      "answer": 0,
      "explanation": "why this answer is correct — 1-2 sentences that reinforce the concept"
    }
  ]
}

Rules:
- 5 questions total: 2 recall (basic), 2 comprehension (understanding), 1 application (can you use this?)
- answer: 0-indexed integer (0=A, 1=B, 2=C, 3=D)
- All 4 options must be plausible — no obviously wrong distractors
- Questions must be answerable from the study guide content only
- Focus on concepts that would come up in an Australian IT job interview`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Quiz generation failed' }, { status: 500 });

    const parsed = JSON.parse(match[0]);
    const questions = parsed.questions ?? [];

    // ── Save to global cache ──────────────────────────────────────────
    if (questions.length) {
      await sb.from('video_content').upsert({
        video_id: videoId,
        video_title: videoTitle,
        quiz_questions: questions,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'video_id' });
    }

    void recordUsage(auth.user.id, 'learn/quiz');
    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
