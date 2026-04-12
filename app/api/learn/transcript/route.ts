import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

const TRANSCRIPT_TARGET = 12_000; // ~3K tokens

interface TranscriptSegment { text: string; offset?: number; duration?: number }

function sampleTranscript(segments: TranscriptSegment[]): string {
  const allText = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();
  if (allText.length <= TRANSCRIPT_TARGET) return allText;

  const introChars  = Math.floor(TRANSCRIPT_TARGET * 0.30);
  const middleChars = Math.floor(TRANSCRIPT_TARGET * 0.50);
  const outroChars  = TRANSCRIPT_TARGET - introChars - middleChars;
  const winSize     = Math.floor(middleChars / 5);

  const intro = allText.slice(0, introChars);
  const outro = allText.slice(-outroChars);

  const midBodyStart = introChars;
  const midBodyEnd   = allText.length - outroChars;
  const step         = Math.floor((midBodyEnd - midBodyStart) / 6);

  const midWindows: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const pos = midBodyStart + i * step;
    midWindows.push(allText.slice(pos, pos + winSize));
  }

  return [intro, midWindows.join(' [...] '), outro].join(' [...] ');
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

  const langAttempts = [undefined, 'en', 'en-US', 'a.en', 'en-GB', 'en-AU'];
  for (const lang of langAttempts) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(
        videoId,
        lang ? { lang } : undefined,
      );
      const transcript = sampleTranscript(segments);
      if (transcript.length > 50) {
        return NextResponse.json({ transcript });
      }
    } catch { /* try next language */ }
  }

  return NextResponse.json({ error: 'Transcript unavailable for this video' }, { status: 404 });
}
