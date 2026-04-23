import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

async function getUser(sb: Awaited<ReturnType<typeof getClient>>) {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET() {
  const sb   = await getClient();
  const user = await getUser(sb);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await sb
    .from('visa_tracker')
    .select('employer, occupation, started_at, steps')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json(data ?? { employer: '', occupation: '', started_at: null, steps: {} });
}

export async function POST(req: NextRequest) {
  const sb   = await getClient();
  const user = await getUser(sb);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { employer?: string; occupation?: string; started_at?: string; steps?: Record<string, unknown> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  // Truncate inputs to prevent unbounded DB writes
  const employer   = body.employer?.slice(0, 100) ?? null;
  const occupation = body.occupation?.slice(0, 100) ?? null;

  // Validate ISO date format for started_at
  let started_at = body.started_at ?? null;
  if (started_at && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(started_at)) {
    started_at = null;  // Invalid date — silently reject instead of erroring
  }

  // Cap steps JSON size (stringify to check total size)
  let steps = body.steps ?? {};
  if (typeof steps === 'object' && JSON.stringify(steps).length > 10000) {
    return NextResponse.json({ error: 'Steps data too large' }, { status: 400 });
  }

  const { error } = await sb.from('visa_tracker').upsert(
    {
      user_id:    user.id,
      employer,
      occupation,
      started_at,
      steps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
