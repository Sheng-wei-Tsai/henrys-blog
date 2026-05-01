import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/auth-server';

export async function GET() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('job_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  return NextResponse.json({ alerts: data });
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const keywords  = String(body.keywords  ?? '').trim().slice(0, 200);
  const location  = String(body.location  ?? 'Brisbane').trim().slice(0, 100);
  const full_time = Boolean(body.full_time);
  const frequency = ['daily', 'weekly'].includes(body.frequency) ? body.frequency : 'weekly';

  if (!keywords) return NextResponse.json({ error: 'keywords required' }, { status: 400 });

  const { data, error } = await sb
    .from('job_alerts')
    .insert({ user_id: user.id, keywords, location, full_time, frequency })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  return NextResponse.json({ alert: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { error, count } = await sb
    .from('job_alerts')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id); // ownership check — user cannot delete another user's alert

  if (error) return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  if (!count) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
