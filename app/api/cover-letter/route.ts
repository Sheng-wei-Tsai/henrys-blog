import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert career coach and professional writer specialising in the Australian IT job market.
Write tailored, authentic cover letters that:
- Sound human and genuine, not generic AI fluff
- Are concise (3-4 paragraphs, under 400 words)
- Open with a compelling hook — not "I am writing to apply for..."
- Connect the candidate's specific experience to the job requirements
- Mention the company by name and show you understand what they do
- End with a confident, action-oriented closing
- Use Australian English spelling (e.g. "recognised", "organisation")
- Do NOT use buzzwords like "passionate", "synergy", "leverage", "dynamic team player"
Format: plain paragraphs only, no headers, no bullet points.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobTitle, company, jobDescription, background } = body;

  if (!jobTitle || !company || !jobDescription || !background) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const userPrompt = `Write a cover letter for this role:

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CANDIDATE BACKGROUND:
${background.slice(0, 1500)}

Write the cover letter now. Plain paragraphs only.`;

  // Stream the response so the user sees text appear word-by-word
  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 600,
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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
