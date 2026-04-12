import { NextRequest, NextResponse } from 'next/server';

const HOST = 'youtube138.p.rapidapi.com';

function rapidHeaders(apiKey: string) {
  return {
    'Content-Type':    'application/json',
    'x-rapidapi-host': HOST,
    'x-rapidapi-key':  apiKey,
  };
}

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId');
  const cursor    = req.nextUrl.searchParams.get('cursor') ?? '';

  if (!channelId) return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RapidAPI key not configured' }, { status: 503 });

  const res = await fetch(`https://${HOST}/channel/videos/`, {
    method: 'POST',
    headers: rapidHeaders(apiKey),
    body: JSON.stringify({
      id:     channelId,
      filter: 'videos_latest',
      cursor,
      hl:     'en',
      gl:     'AU',
    }),
    // Only cache the first page — cursor pages must never be cached (POST body
    // is not part of the Next.js fetch cache key, so all pages would return
    // the same first-page response from cache).
    ...(cursor ? { cache: 'no-store' } : { next: { revalidate: 3600 } }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  const data = await res.json();

  // youtube138 returns { contents: [{ video: { videoId, title, thumbnails, publishedTimeText, ... } }], continuation }
  const items: Array<{ video?: {
    videoId:            string;
    title:              string;
    thumbnails:         Array<{ url: string }>;
    publishedTimeText?: string;
    descriptionSnippet?: string;
    author?:            { title: string };
  }}> = data.contents ?? [];

  const videos = items
    .filter(i => i.video?.videoId)
    .map(i => {
      const v = i.video!;
      const thumbs = v.thumbnails ?? [];
      const thumbnail = thumbs[Math.floor(thumbs.length / 2)]?.url ?? thumbs[0]?.url ?? '';
      return {
        id:           v.videoId,
        title:        v.title ?? '',
        channelTitle: v.author?.title ?? '',
        thumbnail,
        // RapidAPI returns relative text like "3 days ago" — convert to a sortable string
        publishedAt:  v.publishedTimeText ?? '',
        description:  v.descriptionSnippet ?? '',
      };
    });

  return NextResponse.json({
    videos,
    // RapidAPI uses a cursor string for pagination (empty string = no more pages)
    nextPageToken: data.continuation ?? null,
  });
}
