import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/auth-server';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages — TechPath AU Network',
  description: 'Direct messages with other anonymous network members.',
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const sb = await createSupabaseServer();
  const [{ data: { user } }, resolved] = await Promise.all([
    sb.auth.getUser(),
    searchParams,
  ]);

  if (!user) redirect('/login');

  const { data: myProfile } = await sb
    .from('anonymous_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myProfile) redirect('/network');

  const initialPartnerId = resolved.with ?? null;

  return (
    <MessagesClient
      myProfileId={myProfile.id as string}
      initialPartnerId={initialPartnerId}
    />
  );
}
