import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const HOST = 'youtube138.p.rapidapi.com';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

  // ── Check Supabase cache first — avoids RapidAPI call on repeat visits ────
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: cached } = await sb
    .from('video_content')
    .select('video_title, channel_title')
    .eq('video_id', videoId)
    .maybeSingle();

  if (cached?.video_title) {
    return NextResponse.json({
      id:           videoId,
      title:        cached.video_title,
      channelTitle: cached.channel_title ?? '',
      thumbnail:    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration:     '',
      description:  '',
    });
  }

  // ── Fallback: fetch from RapidAPI ─────────────────────────────────────────
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RapidAPI key not configured' }, { status: 503 });

  const res = await fetch(`https://${HOST}/video/details/`, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-rapidapi-host': HOST,
      'x-rapidapi-key':  apiKey,
    },
    body: JSON.stringify({ id: videoId, hl: 'en', gl: 'AU' }),
    cache: 'no-store', // POST body not part of Next.js cache key — never cache
  });

  if (!res.ok) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const data = await res.json();
  if (!data?.id) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const thumbs: Array<{ url: string }> = data.thumbnails ?? [];
  const thumbnail = thumbs[Math.floor(thumbs.length / 2)]?.url ?? thumbs[0]?.url ?? '';

  return NextResponse.json({
    id:           data.id,
    title:        data.title ?? '',
    channelTitle: data.author?.title ?? '',
    thumbnail,
    duration:     data.lengthSeconds ? `PT${Math.floor(data.lengthSeconds / 60)}M${data.lengthSeconds % 60}S` : '',
    description:  (data.description ?? '').slice(0, 300),
  });
}
