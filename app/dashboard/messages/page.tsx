import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/auth-server';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages — TechPath AU',
  description: 'Your direct messages from the TechPath AU community network.',
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await sb
    .from('network_messages')
    .select(`
      id, content, read_at, created_at, sender_id, recipient_id,
      sender_profile:sender_profile_id ( role_title, city, visa_type )
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  // Normalise sender_profile from Supabase join (may be returned as array)
  const messages = (data ?? []).map(m => {
    const sp = m.sender_profile;
    const sender_profile = Array.isArray(sp)
      ? (sp[0] ?? null)
      : sp ?? null;
    return { ...m, sender_profile };
  });

  return <MessagesClient messages={messages} userId={user.id} />;
}
