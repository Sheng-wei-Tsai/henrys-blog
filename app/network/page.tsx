import { Metadata } from 'next';
import { createSupabaseServer } from '@/lib/auth-server';
import NetworkPageClient from './NetworkPageClient';

export const metadata: Metadata = {
  title: 'Job Seeker Network — TechPath AU',
  description:
    'Browse anonymous profiles of international IT job seekers in Australia. Connect with others in your city searching for the same roles.',
};

export const revalidate = 60;

export default async function NetworkPage() {
  const sb = await createSupabaseServer();

  const [{ data: { user } }, { data: profiles }, { data: referrers }] = await Promise.all([
    sb.auth.getUser(),
    sb
      .from('anonymous_profiles')
      .select('id, role_title, visa_type, skills, city, created_at')
      .order('updated_at', { ascending: false })
      .limit(200),
    sb
      .from('anonymous_profiles')
      .select('id, hired_company, hired_skills, hired_message, city, visa_type, created_at')
      .eq('is_hired', true)
      .order('updated_at', { ascending: false })
      .limit(100),
  ]);

  let hasProfile      = false;
  let currentProfileId: string | null = null;
  let currentProfile: { skills: string[]; visa_type: string; role_title: string } | null = null;
  let unreadCount     = 0;

  if (user) {
    const { data } = await sb
      .from('anonymous_profiles')
      .select('id, skills, visa_type, role_title')
      .eq('user_id', user.id)
      .maybeSingle();
    hasProfile       = !!data;
    currentProfileId = data?.id ?? null;
    currentProfile   = data ? { skills: data.skills, visa_type: data.visa_type, role_title: data.role_title } : null;

    const { count } = await sb
      .from('network_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null);
    unreadCount = count ?? 0;
  }

  return (
    <NetworkPageClient
      initialProfiles={profiles ?? []}
      initialReferrers={referrers ?? []}
      isLoggedIn={!!user}
      hasProfile={hasProfile}
      currentProfile={currentProfile}
      currentProfileId={currentProfileId}
      unreadCount={unreadCount}
    />
  );
}
