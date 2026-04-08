import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// Service role to bypass RLS for aggregation queries
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [allViews, pagesRaw, referrers, countries, devices] = await Promise.all([
    // All rows in last 30d for daily trend
    sb.from('page_views')
      .select('created_at, session_id')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true }),

    // Top pages
    sb.from('page_views')
      .select('path')
      .gte('created_at', cutoff),

    // Referrers
    sb.from('page_views')
      .select('referrer')
      .gte('created_at', cutoff)
      .not('referrer', 'is', null),

    // Countries
    sb.from('page_views')
      .select('country')
      .gte('created_at', cutoff)
      .not('country', 'is', null),

    // Devices
    sb.from('page_views')
      .select('device')
      .gte('created_at', cutoff),
  ]);

  const views = allViews.data ?? [];
  const pagesData = pagesRaw.data ?? [];
  const referrerData = referrers.data ?? [];
  const countryData = countries.data ?? [];
  const deviceData = devices.data ?? [];

  // Daily trend: group by date
  const dailyMap: Record<string, number> = {};
  const sessionSet = new Set<string>();
  for (const row of views) {
    const date = row.created_at.slice(0, 10);
    dailyMap[date] = (dailyMap[date] ?? 0) + 1;
    sessionSet.add(row.session_id);
  }

  // Fill in zeros for missing days
  const daily: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    daily.push({ date, views: dailyMap[date] ?? 0 });
  }

  // Top pages
  const pageMap: Record<string, number> = {};
  for (const row of pagesData) {
    pageMap[row.path] = (pageMap[row.path] ?? 0) + 1;
  }
  const topPagesResult = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  // Referrers
  const refMap: Record<string, number> = {};
  for (const row of referrerData) {
    const key = row.referrer ?? 'Direct';
    refMap[key] = (refMap[key] ?? 0) + 1;
  }
  const directCount = views.length - referrerData.length;
  if (directCount > 0) refMap['Direct'] = (refMap['Direct'] ?? 0) + directCount;
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Countries
  const countryMap: Record<string, number> = {};
  for (const row of countryData) {
    countryMap[row.country] = (countryMap[row.country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Devices
  const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const row of deviceData) {
    if (row.device) deviceMap[row.device] = (deviceMap[row.device] ?? 0) + 1;
  }

  const topDay = daily.reduce((best, d) => d.views > best.views ? d : best, { date: '', views: 0 });

  return NextResponse.json({
    overview: {
      totalViews:     views.length,
      uniqueSessions: sessionSet.size,
      topDay,
    },
    daily,
    topPages:    topPagesResult,
    referrers:   topReferrers,
    countries:   topCountries,
    devices:     deviceMap,
  });
}
