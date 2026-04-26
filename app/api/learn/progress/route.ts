import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoId?: string; videoTitle?: string; quizScore?: number; completed?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  const { videoId, videoTitle, quizScore, completed } = body;
  if (!videoId || !videoTitle) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const update: Record<string, unknown> = {
    user_id:     user.id,
    video_id:    videoId,
    video_title: videoTitle,
    updated_at:  new Date().toISOString(),
  };
  if (quizScore !== undefined) { update.quiz_score = quizScore; update.quiz_taken = true; }
  if (completed !== undefined) update.completed = completed;

  const { error } = await sb
    .from('video_progress')
    .upsert(update, { onConflict: 'user_id,video_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ progress: [] });

  const channel = req.nextUrl.searchParams.get('channel');
  let query = sb
    .from('video_progress')
    .select('video_id, quiz_score, quiz_taken, completed')
    .eq('user_id', user.id);
  if (channel) query = query.eq('channel_name', channel);
  const { data } = await query.limit(500);

  return NextResponse.json({ progress: data ?? [] });
}
