import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireSubscription, recordUsage } from '@/lib/subscription';

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

  const stream = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 800,
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
