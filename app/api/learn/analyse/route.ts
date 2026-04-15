import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { YoutubeTranscript } from 'youtube-transcript';
import { requireSubscription, recordUsage, checkEndpointRateLimit } from '@/lib/subscription';
import { rateLimitResponse } from '@/lib/auth-server';

// Full schema — used for videos < 45 min
const SCHEMA_FULL = `{
  "summary": "3-4 sentence plain-English overview of what this video teaches and who it is for",
  "essay": "250-300 word professional summary written as flowing prose — no bullet points, no headers. Wrap the 6-8 most important technical terms or concepts in **double asterisks** so they render as bold. Structure: (1) opening sentence stating what the video is and who it is for, (2) body covering the 3-4 most important points with evidence from the transcript, (3) closing sentence on why this matters for a developer's career. Write like a high-quality technical blog post introduction.",
  "keyConcepts": [
    {
      "term": "concept name",
      "definition": "clear 1-sentence definition",
      "example": "one concrete real-world example of this in action",
      "whyMatters": "why an Australian developer should care — job ads, companies, use cases"
    }
  ],
  "sections": [
    {
      "title": "section title",
      "timestamp": "e.g. 0:00 – 3:20",
      "summary": "1-2 sentence description of what is covered in this section"
    }
  ],
  "useCases": [
    {
      "scenario": "a real-world scenario title",
      "description": "2-3 sentences explaining how the topic is applied in this scenario",
      "industry": "e.g. Fintech, E-commerce, Government, Healthcare"
    }
  ],
  "coreInsights": ["most important insight", "second", "third", "fourth", "fifth"],
  "architectureNote": "describe any system architecture or technical concept explained — or null",
  "australianContext": "1-2 sentences on how this appears in AU IT job ads or enterprise tech",
  "studyTips": ["specific tip 1", "tip 2", "tip 3"],
  "videoType": "tutorial | explainer | deep-dive | talk | demo",
  "audioScript": "A ~750 word spoken-word summary written as natural narration (no headers, no bullet points). Cover: what the topic is, why it matters, the 3-4 most important concepts explained simply, a real-world example, and a closing takeaway. Aim for 5 minutes at normal speaking pace."
}`;

// Lean schema — used for long videos (45+ min) to reduce output tokens
const SCHEMA_LEAN = `{
  "summary": "3-4 sentence plain-English overview of what this video teaches and who it is for",
  "essay": "250-300 word professional summary written as flowing prose — no bullet points, no headers. Wrap the 5-6 most important technical terms in **double asterisks**. Structure: opening + body (3-4 key points) + why it matters for a developer's career.",
  "keyConcepts": [
    {
      "term": "concept name",
      "definition": "clear 1-sentence definition",
      "example": "one concrete real-world example",
      "whyMatters": "why an Australian developer should care"
    }
  ],
  "sections": [
    {
      "title": "section title",
      "timestamp": "approximate range e.g. 0:00 – 15:00",
      "summary": "1-2 sentence description"
    }
  ],
  "useCases": [
    {
      "scenario": "real-world scenario title",
      "description": "2 sentences on how this topic is applied",
      "industry": "e.g. Fintech, E-commerce, Government"
    }
  ],
  "coreInsights": ["insight 1", "insight 2", "insight 3"],
  "architectureNote": "describe any architecture concept explained — or null",
  "australianContext": "1-2 sentences on AU IT job ads or enterprise tech",
  "studyTips": ["tip 1", "tip 2"],
  "videoType": "tutorial | explainer | deep-dive | talk | demo"
}`;

const SCHEMA_LONG_CAVEAT =
  'Note: This is a long video — the study guide is based on sampled excerpts (intro, distributed middle sections, and conclusion).';

// ── Smart transcript sampling ──────────────────────────────────────────────
// For long videos, naive slice(0, N) only captures the first few minutes.
// Instead, sample: 30% intro + 50% distributed middle (5 windows) + 20% outro.
const TRANSCRIPT_TARGET = 12_000; // ~3K tokens — leaves room for prompt + output

interface TranscriptSegment { text: string; offset?: number; duration?: number }

function sampleTranscript(segments: TranscriptSegment[]): {
  text: string;
  durationMins: number;
  wasSampled: boolean;
} {
  const allText = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();
  const totalChars = allText.length;

  const lastSeg = segments[segments.length - 1];
  const durationSecs = lastSeg?.offset
    ? Math.floor((lastSeg.offset + (lastSeg.duration ?? 0)) / 1000)
    : 0;
  const durationMins = Math.round(durationSecs / 60);

  if (totalChars <= TRANSCRIPT_TARGET) {
    return { text: allText, durationMins, wasSampled: false };
  }

  // Budget: 30% intro | 50% middle (5 windows) | 20% outro
  const introChars  = Math.floor(TRANSCRIPT_TARGET * 0.30);
  const middleChars = Math.floor(TRANSCRIPT_TARGET * 0.50);
  const outroChars  = TRANSCRIPT_TARGET - introChars - middleChars;
  const winSize     = Math.floor(middleChars / 5);

  const intro = allText.slice(0, introChars);
  const outro = allText.slice(-outroChars);

  const midBodyStart = introChars;
  const midBodyEnd   = totalChars - outroChars;
  const step         = Math.floor((midBodyEnd - midBodyStart) / 6);

  const midWindows: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const pos = midBodyStart + i * step;
    midWindows.push(allText.slice(pos, pos + winSize));
  }

  const approxMinsPerChar = durationMins / totalChars;
  const midStartMin = Math.round(midBodyStart * approxMinsPerChar);
  const midEndMin   = Math.round(midBodyEnd   * approxMinsPerChar);

  const text = [
    intro,
    `\n\n[... ${midStartMin}–${midEndMin} min sampled in 5 windows below ...]\n\n`,
    midWindows.join('\n\n[... cut ...]\n\n'),
    `\n\n[... conclusion (last ~${Math.round(outroChars * approxMinsPerChar)} min) ...]\n\n`,
    outro,
  ].join('');

  return { text, durationMins, wasSampled: true };
}

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  // Per-endpoint daily limit (20 calls — most expensive route at ~$0.035/call)
  if (!(await checkEndpointRateLimit(auth.user.id, 'learn/analyse'))) return rateLimitResponse();

  let body: { videoId?: string; videoTitle?: string; channelTitle?: string };
  try { body = await req.json(); }
  catch { return new Response('Bad request', { status: 400 }); }

  const { videoId, videoTitle, channelTitle } = body;
  if (!videoId) return new Response('Missing videoId', { status: 400 });

  if (!process.env.OPENAI_API_KEY) return new Response('OpenAI API not configured', { status: 503 });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Service client — bypasses RLS for the shared video_content cache
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ── Check global video cache first ─────────────────────────────────
  const { data: cached } = await sb
    .from('video_content')
    .select('study_guide')
    .eq('video_id', videoId)
    .single();

  if (cached?.study_guide && (cached.study_guide.essay || cached.study_guide.summary)) {
    return new Response(JSON.stringify(cached.study_guide), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Fetch transcript — try multiple language/format options ─────────
  let transcript        = '';
  let videoDurationMins = 0;
  let transcriptSampled = false;

  const langAttempts = [undefined, 'en', 'en-US', 'a.en', 'en-GB', 'en-AU'];
  for (const lang of langAttempts) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(
        videoId,
        lang ? { lang } : undefined,
      );
      const { text, durationMins, wasSampled } = sampleTranscript(segments);
      if (text.length > 50) {
        transcript        = text;
        videoDurationMins = durationMins;
        transcriptSampled = wasSampled;
        break;
      }
    } catch { /* try next language */ }
  }

  // ── Build prompt — use transcript if available, fall back to title ───
  const hasTranscript = transcript.length > 50;
  const isLongVideo   = videoDurationMins >= 45;
  const SCHEMA        = isLongVideo ? SCHEMA_LEAN : SCHEMA_FULL;

  const durationNote = videoDurationMins > 0
    ? `\nVideo duration: approximately ${videoDurationMins} minutes.`
    : '';

  const prompt = hasTranscript
    ? `You are an expert technical educator helping an Australian developer learn from YouTube videos.

Video title: "${videoTitle || videoId}"${channelTitle ? `\nChannel: ${channelTitle}` : ''}${durationNote}
${transcriptSampled ? `\n${SCHEMA_LONG_CAVEAT}` : ''}
Here is the transcript${transcriptSampled ? ' (sampled — intro, distributed middle sections, conclusion)' : ''}:
---
${transcript}
---

Based on this transcript, extract maximum learning value.

Return ONLY valid JSON matching this exact schema (no markdown fences, no preamble):
${SCHEMA}

Rules:
- Base all content strictly on what is in the transcript.
- essay: flowing prose, **bold** key terms, 250-300 words.
- keyConcepts: ${isLongVideo ? '5' : '5-8'} terms actually mentioned in the transcript.
- sections: infer logical chapters from topic shifts in the transcript.${isLongVideo ? ' Include approximate timestamps (e.g. "0:00 – 15:00").' : ''}
- useCases: 3-4 real-world applications discussed or implied by the transcript.${isLongVideo ? '' : '\n- audioScript: podcast-style narration, natural and conversational, ~750 words.'}
- Do not fabricate claims not supported by the transcript.`

    : `You are an expert technical educator helping an Australian developer learn from YouTube videos.

The video "${videoTitle || videoId}"${channelTitle ? ` from ${channelTitle}` : ''} has no accessible transcript (captions are disabled or unavailable).

Generate a comprehensive study guide for the TOPIC implied by the title. This is a topic overview, not a summary of the specific video.

Return ONLY valid JSON matching this exact schema (no markdown fences, no preamble):
${SCHEMA_FULL}

Rules:
- essay: start with "This guide covers [topic] — note: no captions were available so this is a topic overview rather than a specific video summary." Then write 250-300 words of flowing prose **bolding** key terms.
- keyConcepts: 5-8 core concepts someone would learn studying this topic.
- sections: write 3-5 logical learning sections for this topic area.
- useCases: 3-4 real-world applications in Australian tech companies.
- audioScript: podcast-style narration about the topic, ~750 words.
- australianContext: how this topic appears in AU IT job ads and enterprise tech.`;

  const encoder = new TextEncoder();
  let accumulated = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_completion_tokens: 4096,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            accumulated += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        const msg = (err as Error).message ?? 'Analysis failed';
        console.error('[analyse] OpenAI error:', msg);
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })));
      }
      controller.close();

      void recordUsage(auth.user.id, 'learn/analyse');

      // ── Save to global cache ────────────────────────────────────────
      const match = accumulated.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const guide = JSON.parse(match[0]);
          if (!guide.error && (guide.essay || guide.summary)) {
            await sb.from('video_content').upsert({
              video_id: videoId,
              video_title: videoTitle || videoId,
              channel_title: channelTitle ?? null,
              study_guide: guide,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'video_id' });
          }
        } catch { /* skip cache write on parse error */ }
      }
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
