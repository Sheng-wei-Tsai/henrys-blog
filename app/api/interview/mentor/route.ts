import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';

type MentorStage = 'scene' | 'why' | 'guide';

const ALEX_SYSTEM = `You are Alex Chen, a senior software developer with 8 years of experience at Australian tech companies including Atlassian. You're helping someone prepare for Australian IT job interviews.

Your style:
- First person, warm but direct
- Concise — never more than 130 words per response
- Mention real Australian companies naturally where relevant
- No bullet points — conversational prose only
- Never restate the interview question word-for-word — build on it`;

interface MentorData {
  stage: MentorStage;
  question: string;
  scenario?: string;
  focus?: string;
  concepts?: string[];
  framework?: string;
  roleTitle: string;
  companyExample?: string;
}

function buildPrompt(d: MentorData): string {
  switch (d.stage) {
    case 'scene':
      return `You are coaching someone preparing for a ${d.roleTitle} interview. The question is: "${d.question}"

Context: ${d.scenario ?? 'a real-world team at an Australian tech company'}

In 2-3 short sentences, paint a vivid picture of when this situation actually comes up in Australian tech teams. Be concrete and specific — not generic advice. End with why nailing this answer matters for getting the job.`;

    case 'why':
      return `Interview question: "${d.question}"
What it tests: ${d.focus ?? '(see question)'}
Key concepts: ${d.concepts?.join(', ') ?? '(see question)'}

In 2-3 sentences, tell the candidate exactly what the interviewer at a company like ${d.companyExample ?? 'Atlassian'} is looking for. Be direct about what separates a good answer from a great one.`;

    case 'guide':
      return `Interview question: "${d.question}"
Answer framework: ${d.framework ?? '(structure a clear, relevant response)'}

In 3-4 sentences, give your personal take on structuring the perfect answer. Share one specific tip you'd whisper to a junior dev right before they walked in. Make it actionable.`;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'interview/mentor');
  if (!withinLimit) return rateLimitResponse();

  let body: MentorData;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { stage, question, roleTitle } = body;
  if (!stage || !question || !roleTitle) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!['scene', 'why', 'guide'].includes(stage)) {
    return new Response(JSON.stringify({ error: 'Invalid stage' }), { status: 400 });
  }

  const userPrompt = buildPrompt(body);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ALEX_SYSTEM },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 200,
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

    void recordUsage(auth.user.id, 'interview/mentor');
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('OpenAI mentor error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate narration';
    return new Response(JSON.stringify({ error: msg }), { status: 502 });
  }
}
