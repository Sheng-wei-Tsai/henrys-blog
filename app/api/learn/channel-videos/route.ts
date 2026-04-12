import { NextRequest, NextResponse } from 'next/server';

// In-process cache for uploads playlist IDs — these never change so we only
// fetch them once per server instance per channel.
const playlistIdCache = new Map<string, string>();

async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
  const cached = playlistIdCache.get(channelId);
  if (cached) return cached;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
    { next: { revalidate: 86400 } }, // 24h — uploads playlist ID never changes
  );
  const data = await res.json();
  const id: string = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? '';
  if (id) playlistIdCache.set(channelId, id);
  return id;
}

export async function GET(req: NextRequest) {
  const channelId  = req.nextUrl.searchParams.get('channelId');
  const pageToken  = req.nextUrl.searchParams.get('pageToken') ?? '';   // '' = first page
  const maxResults = 30; // 30 per page — balanced between speed and quota

  if (!channelId) return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 503 });

  try {
    const playlistId = await getUploadsPlaylistId(channelId, apiKey);
    if (!playlistId) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const params = new URLSearchParams({
      part:       'snippet',
      playlistId,
      maxResults: String(maxResults),
      key:        apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
      // First page is cacheable; subsequent pages must not be (different pageToken each time)
      pageToken ? { cache: 'no-store' } : { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message ?? 'YouTube API error' }, { status: res.status });
    }

    const data = await res.json();

    const videos = (data.items ?? [])
      // Filter out private/deleted videos which show up as "Private video"
      .filter((item: { snippet: { title: string; resourceId?: { videoId?: string } } }) =>
        item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video',
      )
      .map((item: {
        snippet: {
          resourceId: { videoId: string };
          title: string;
          thumbnails: { medium?: { url: string }; high?: { url: string }; default?: { url: string } };
          publishedAt: string;
          description: string;
          videoOwnerChannelTitle?: string;
        };
      }) => ({
        id:           item.snippet.resourceId.videoId,
        title:        item.snippet.title,
        channelTitle: item.snippet.videoOwnerChannelTitle ?? '',
        thumbnail:    item.snippet.thumbnails?.medium?.url
                   ?? item.snippet.thumbnails?.high?.url
                   ?? item.snippet.thumbnails?.default?.url
                   ?? `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
        publishedAt:  item.snippet.publishedAt,   // ISO 8601 string
        description:  item.snippet.description?.slice(0, 200) ?? '',
      }));

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken ?? null, // null = no more pages
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
