import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, unauthorizedResponse } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const DM_DAILY_LIMIT = 20;

interface DmRow {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
}

// GET /api/network/messages — list conversations for the authenticated user
export async function GET() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return unauthorizedResponse();

  const { data: myProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myProfile) {
    return NextResponse.json(
      { error: 'Join the network first to use messaging' },
      { status: 403 },
    );
  }

  const myId = myProfile.id as string;

  const { data: rows, error } = await sb
    .from('dm_messages')
    .select('id, sender_profile_id, recipient_profile_id, content, created_at, read_at, deleted_by_sender, deleted_by_recipient')
    .or(`sender_profile_id.eq.${myId},recipient_profile_id.eq.${myId}`)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }

  const messages = (rows ?? []) as DmRow[];

  // Count unread per partner (messages received, unread)
  const unreadByPartner = new Map<string, number>();
  for (const m of messages) {
    if (
      m.sender_profile_id !== myId &&
      m.recipient_profile_id === myId &&
      !m.read_at &&
      !m.deleted_by_recipient
    ) {
      unreadByPartner.set(m.sender_profile_id, (unreadByPartner.get(m.sender_profile_id) ?? 0) + 1);
    }
  }

  // One conversation entry per partner (first seen = latest message because sorted DESC)
  const convMap = new Map<string, {
    partnerId: string;
    lastMessage: string;
    lastAt: string;
    unreadCount: number;
  }>();

  for (const msg of messages) {
    const isSender = msg.sender_profile_id === myId;
    if (isSender && msg.deleted_by_sender) continue;
    if (!isSender && msg.deleted_by_recipient) continue;

    const partnerId = isSender ? msg.recipient_profile_id : msg.sender_profile_id;
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        lastMessage: msg.content,
        lastAt: msg.created_at,
        unreadCount: unreadByPartner.get(partnerId) ?? 0,
      });
    }
  }

  const conversations = Array.from(convMap.values())
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  const partnerIds = conversations.map(c => c.partnerId);
  let partnerProfiles: Array<{ id: string; role_title: string; city: string }> = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await sb
      .from('anonymous_profiles')
      .select('id, role_title, city')
      .in('id', partnerIds)
      .limit(100);
    partnerProfiles = (profiles ?? []) as Array<{ id: string; role_title: string; city: string }>;
  }

  const profileMap = Object.fromEntries(partnerProfiles.map(p => [p.id, p]));

  return NextResponse.json(
    conversations.map(c => ({ ...c, partner: profileMap[c.partnerId] ?? null })),
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/network/messages — send a message (auth-gated, rate-limited 20/day)
export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const recipientProfileId = typeof body.recipient_profile_id === 'string'
    ? body.recipient_profile_id.trim()
    : '';
  const content = typeof body.content === 'string'
    ? body.content.trim().slice(0, 500)
    : '';

  if (!UUID_RE.test(recipientProfileId)) {
    return NextResponse.json({ error: 'Invalid recipient_profile_id' }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const { data: senderProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!senderProfile) {
    return NextResponse.json(
      { error: 'Join the network first to send messages' },
      { status: 403 },
    );
  }

  if (senderProfile.id === recipientProfileId) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  const { data: recipientProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('id', recipientProfileId)
    .maybeSingle();

  if (!recipientProfile) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Anti-spam: cap at DM_DAILY_LIMIT outbound messages per 24 h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb
    .from('dm_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_profile_id', senderProfile.id)
    .gte('created_at', since);

  if ((count ?? 0) >= DM_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `Daily message limit of ${DM_DAILY_LIMIT} reached. Try again tomorrow.`,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 },
    );
  }

  const { data: message, error } = await sb
    .from('dm_messages')
    .insert({
      sender_profile_id: senderProfile.id,
      recipient_profile_id: recipientProfileId,
      content,
    })
    .select('id, sender_profile_id, recipient_profile_id, content, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json(message, { status: 201 });
}
