import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireSubscription, recordUsage, checkEndpointRateLimit, rateLimitResponse } from '@/lib/subscription';

const SYSTEM = `You are a friendly interview coach helping someone prepare for Australian IT job interviews.
You give concise, practical advice. Keep responses under 150 words.
Be encouraging, direct, and use an Australian-friendly tone.
If asked about a specific interview question, give a brief tip on how to approach it — don't write the full answer for them.`;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const withinLimit = await checkEndpointRateLimit(auth.user.id, 'interview/chat');
  if (!withinLimit) return rateLimitResponse();

  let body: { messages?: ChatMessage[]; roleTitle?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { messages, roleTitle } = body;
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 });
  }

  const systemContent = roleTitle
    ? `${SYSTEM}\nThe user is currently practising for a ${roleTitle} interview.`
    : SYSTEM;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        ...messages.slice(-10),
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

    void recordUsage(auth.user.id, 'interview/chat');
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('OpenAI chat error:', err);
    const msg = err instanceof Error ? err.message : 'Chat failed';
    return new Response(JSON.stringify({ error: msg }), { status: 502 });
  }
}
