import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { requireSubscription, recordUsage, checkEndpointRateLimit } from '@/lib/subscription';
import { rateLimitResponse } from '@/lib/auth-server';

const SCHEMA_FULL = `{
  "summary": "3-4 sentence plain-English overview of what this video teaches and who it is for",
  "essay": "250-300 word professional summary written as flowing prose — no bullet points, no headers. Wrap the 6-8 most important technical terms or concepts in **double asterisks** so they render as bold. Structure: (1) opening sentence stating what the video is and who it is for, (2) body covering the 3-4 most important points with evidence from the video, (3) closing sentence on why this matters for a developer's career. Write like a high-quality technical blog post introduction.",
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
  "codeExamples": [
    {
      "language": "e.g. Python, TypeScript, bash, SQL, YAML — or 'diagram' for visual-only",
      "snippet": "the exact or representative code/command shown on screen (max 20 lines)",
      "context": "1 sentence explaining what this code demonstrates and where in the video it appears"
    }
  ],
  "architectureNote": "describe any system architecture diagrams, flow charts, or infrastructure visuals shown on screen — reference what was drawn or displayed, not just mentioned — or null",
  "australianContext": "1-2 sentences on how this appears in AU IT job ads or enterprise tech",
  "studyTips": ["specific tip 1", "tip 2", "tip 3"],
  "videoType": "tutorial | explainer | deep-dive | talk | demo",
  "audioScript": "A ~750 word spoken-word summary written as natural narration (no headers, no bullet points). Cover: what the topic is, why it matters, the 3-4 most important concepts explained simply, a real-world example, and a closing takeaway. Aim for 5 minutes at normal speaking pace."
}`;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  // Per-endpoint daily limit (20 calls — most expensive route at ~$0.035/call)
  if (!(await checkEndpointRateLimit(auth.user.id, 'learn/analyse'))) return rateLimitResponse();

  let body: { videoId?: string; videoTitle?: string; channelTitle?: string; durationSeconds?: number };
  try { body = await req.json(); }
  catch { return new Response('Bad request', { status: 400 }); }

  const { videoId, videoTitle, channelTitle, durationSeconds } = body;
  if (!videoId) return new Response('Missing videoId', { status: 400 });

  if (typeof durationSeconds === 'number' && durationSeconds > 7200) {
    return NextResponse.json(
      { error: 'This video is over 2 hours long. Gemini cannot reliably analyse videos this long. Try a shorter video, or open it in NotebookLM instead.' },
      { status: 422 },
    );
  }

  if (!process.env.GEMINI_API_KEY) return new Response('Gemini API not configured', { status: 503 });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

  const prompt = `You are an expert technical educator helping an Australian developer learn from YouTube videos.

Video title: "${videoTitle || videoId}"${channelTitle ? `\nChannel: ${channelTitle}` : ''}

Analyse this video using your full multimodal capabilities — watch the video frames directly. Do NOT rely solely on audio or captions. Pay close attention to:
- Slides, presentation text, and diagrams displayed on screen
- Code, terminal output, configuration files, or SQL shown on screen
- Architecture diagrams, flowcharts, and infrastructure visuals drawn or displayed
- Any text that appears on screen but may not be spoken aloud

Return ONLY valid JSON matching this exact schema (no markdown fences, no preamble):
${SCHEMA_FULL}

Rules:
- Base all content strictly on what is shown in the video — visual frames take precedence over inferred meaning.
- essay: flowing prose, **bold** key terms, 250-300 words.
- keyConcepts: 5-8 terms actually covered in the video.
- sections: infer logical chapters from topic shifts; include accurate timestamps (e.g. "0:00 – 3:20").
- useCases: 3-4 real-world applications discussed or implied by the video.
- codeExamples: extract every distinct code snippet, command, or configuration visible on screen. Return [] if no code appears on screen. Use "diagram" as the language for visual-only content (e.g. a drawn flowchart).
- architectureNote: describe diagrams or architecture visuals shown on screen in detail — what boxes, arrows, services, or layers are drawn. Set null only if no visual diagram is shown.
- audioScript: podcast-style narration, natural and conversational, ~750 words.
- Do not fabricate claims not supported by the video.`;

  const encoder = new TextEncoder();
  let accumulated = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream([
          {
            fileData: {
              mimeType: 'video/mp4',
              fileUri: `https://www.youtube.com/watch?v=${videoId}`,
            },
          },
          { text: prompt },
        ]);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            accumulated += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        const raw = (err as Error).message ?? 'Analysis failed';
        console.error('[analyse] Gemini error:', raw);
        const lower = raw.toLowerCase();
        let friendly: string;
        if (lower.includes('too long') || lower.includes('too large') || lower.includes('exceed') || lower.includes('duration') || lower.includes('resource_exhausted') || lower.includes('token')) {
          friendly = 'This video is too long for AI analysis (Gemini supports up to ~2 hours). Try a shorter video, or open it in NotebookLM.';
        } else if (lower.includes('audio') || lower.includes('no speech') || lower.includes('music') || lower.includes('sound only') || lower.includes('unsupported')) {
          friendly = 'This appears to be a music or audio-only video. AI analysis works best on tech tutorials with spoken explanations and on-screen content.';
        } else {
          friendly = raw;
        }
        controller.enqueue(encoder.encode(JSON.stringify({ error: friendly })));
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
