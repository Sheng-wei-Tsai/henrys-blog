import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, unauthorizedResponse } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/network/messages/[profileId] — fetch thread with a specific profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  if (!UUID_RE.test(profileId ?? '')) {
    return NextResponse.json({ error: 'Invalid profileId' }, { status: 400 });
  }

  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return unauthorizedResponse();

  const { data: myProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myProfile) {
    return NextResponse.json({ error: 'You must join the network first' }, { status: 403 });
  }

  const myId = myProfile.id as string;

  const { data: rows, error } = await sb
    .from('dm_messages')
    .select('id, sender_profile_id, recipient_profile_id, content, created_at, read_at, deleted_by_sender, deleted_by_recipient')
    .or(
      `and(sender_profile_id.eq.${myId},recipient_profile_id.eq.${profileId}),` +
      `and(sender_profile_id.eq.${profileId},recipient_profile_id.eq.${myId})`,
    )
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: 'Failed to load thread' }, { status: 500 });
  }

  const visible = (rows ?? []).filter(m => {
    const isSender = m.sender_profile_id === myId;
    if (isSender && m.deleted_by_sender) return false;
    if (!isSender && m.deleted_by_recipient) return false;
    return true;
  });

  return NextResponse.json(visible);
}

// PATCH /api/network/messages/[profileId] — mark all messages from that profile as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  if (!UUID_RE.test(profileId ?? '')) {
    return NextResponse.json({ error: 'Invalid profileId' }, { status: 400 });
  }

  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return unauthorizedResponse();

  const { data: myProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  await sb
    .from('dm_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_profile_id', profileId)
    .eq('recipient_profile_id', myProfile.id)
    .is('read_at', null);

  return NextResponse.json({ ok: true });
}
