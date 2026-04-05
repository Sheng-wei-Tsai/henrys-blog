import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireSubscription, recordUsage } from '@/lib/subscription';

const SYSTEM_PROMPT = `You are an expert career coach and professional writer specialising in the Australian IT job market.

Write tailored, authentic cover letters that:
- Sound human and genuine — write like a real person, not a template
- Are concise: 3-4 tight paragraphs, 300-380 words total
- Open with a specific, compelling hook tied to the role or company — never "I am writing to apply for..."
- Connect the candidate's concrete experience directly to 2-3 key requirements from the JD
- Mention the company by name and reference something specific about what they build or do
- Close with confidence and a clear next-step ask — not "I look forward to hearing from you"
- Use Australian English spelling throughout: recognised, organised, colour, behaviour, programme
- Avoid all buzzwords: passionate, synergy, leverage, dynamic, team player, self-starter, motivated, excited

Tone: direct, warm, professional. The candidate should sound like a competent developer who respects the reader's time.
Format: plain paragraphs only — no headers, no bullet points, no bold text.`;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const userPrompt = `Write a cover letter for this role.

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CANDIDATE BACKGROUND:
${background.slice(0, 1500)}

Write the cover letter now. 3-4 paragraphs, plain text only, no headers or bullet points.`;

  // Model: gpt-4o gives noticeably better prose than gpt-4o-mini.
  // If you have access to a newer model (e.g. gpt-4.1), swap the string below.
  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 700,
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

  void recordUsage(auth.user.id, 'cover-letter');
  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
