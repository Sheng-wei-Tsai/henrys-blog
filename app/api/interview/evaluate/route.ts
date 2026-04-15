import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';

const SYSTEM_TEXT = `You are an expert technical interviewer for Australian IT companies. Evaluate the candidate's answer honestly and constructively.

Your response must follow this exact format — no deviations:
**Score: X/100**

[2-3 sentences of specific feedback on what was good and what was weak]

**What to improve:**
- [specific suggestion 1]
- [specific suggestion 2]

Keep it concise. Australian tone is fine. Be encouraging but honest.`;

const SYSTEM_CODE = `You are an expert technical interviewer for Australian IT companies. Evaluate the candidate's code solution honestly and constructively.

Your response must follow this exact format — no deviations:
**Score: X/100**

[2-3 sentences on correctness, code quality, and edge cases]

**What to improve:**
- [specific code suggestion 1]
- [specific code suggestion 2]

Keep it concise. Focus on correctness first, then style and efficiency.`;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'interview/evaluate');
  if (!withinLimit) return rateLimitResponse();

  let body: { question?: string; answer?: string; roleTitle?: string; questionType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const rawRoleTitle    = body.roleTitle;
  const rawQuestion     = body.question;
  const rawAnswer       = body.answer;
  const rawQuestionType = body.questionType;

  if (!rawQuestion || !rawAnswer || !rawRoleTitle) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // Truncate all user inputs before they reach the AI — prevents prompt injection
  const roleTitle    = String(rawRoleTitle).trim().slice(0, 100);
  const question     = String(rawQuestion).trim().slice(0, 500);
  const answer       = String(rawAnswer).trim().slice(0, 2000);
  const questionType = String(rawQuestionType ?? '').trim().slice(0, 20);

  const isCode = questionType === 'code';
  const userPrompt = `Role: ${roleTitle}
Question: ${question}
Candidate's ${isCode ? 'code solution' : 'answer'}: ${answer}

Evaluate this ${isCode ? 'code solution' : 'answer'} now.`;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: isCode ? SYSTEM_CODE : SYSTEM_TEXT },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 350,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    void recordUsage(auth.user.id, 'interview/evaluate');
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('OpenAI evaluate error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to evaluate answer';
    return new Response(JSON.stringify({ error: msg }), { status: 502 });
  }
}
