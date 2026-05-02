import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/auth-server';

const RATE_LIMIT_PER_DAY = 5;

export async function GET() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('network_messages')
    .select(`
      id, content, read_at, created_at, sender_id, recipient_id,
      sender_profile:sender_profile_id ( role_title, city, visa_type )
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Sender must have an anonymous profile in the network
  const { data: senderProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!senderProfile) {
    return NextResponse.json(
      { error: 'You must join the network before sending messages' },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const recipientProfileId = typeof body.recipient_profile_id === 'string'
    ? body.recipient_profile_id.trim()
    : '';
  const content = typeof body.content === 'string'
    ? body.content.trim().slice(0, 500)
    : '';

  if (!recipientProfileId || !/^[0-9a-f-]{36}$/.test(recipientProfileId)) {
    return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
  }
  if (!content || content.length < 1) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  // Look up the recipient's user_id from their anonymous profile
  const { data: recipientProfile } = await sb
    .from('anonymous_profiles')
    .select('user_id')
    .eq('id', recipientProfileId)
    .maybeSingle();

  if (!recipientProfile) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  if (recipientProfile.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  // Rate limit: max RATE_LIMIT_PER_DAY messages sent in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb
    .from('network_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', since);

  if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
    return NextResponse.json(
      { error: `You can send at most ${RATE_LIMIT_PER_DAY} messages per day` },
      { status: 429 },
    );
  }

  const { data: message, error } = await sb
    .from('network_messages')
    .insert({
      sender_id:         user.id,
      recipient_id:      recipientProfile.user_id,
      sender_profile_id: senderProfile.id,
      content,
    })
    .select('id, content, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  return NextResponse.json({ message }, { status: 201 });
}
