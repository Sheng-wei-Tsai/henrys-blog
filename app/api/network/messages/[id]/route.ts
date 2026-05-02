import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/auth-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
  }

  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // RLS ensures only the recipient can update read_at
  const { error } = await sb
    .from('network_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.id)
    .is('read_at', null);

  if (error) return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
