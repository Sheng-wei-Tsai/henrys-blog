import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRoleById } from '@/lib/interview-roles';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';

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
    void recordUsage(auth.user.id, 'interview/questions');
    return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('OpenAI questions error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate questions';
    return new Response(JSON.stringify({ error: msg }), { status: 502 });
  }
}
