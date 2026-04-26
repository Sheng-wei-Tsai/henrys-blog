import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { checkEndpointRateLimit, rateLimitResponse, recordUsage } from '@/lib/subscription';

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

interface AnalyticsSummary {
  overview: { totalViews: number; uniqueSessions: number; topDay?: { date: string; views: number } };
  topPages?: Array<{ path: string; count: number }>;
  referrers?: Array<{ source: string; count: number }>;
  countries?: Array<{ country: string; count: number }>;
  devices?: { desktop: number; mobile: number; tablet: number };
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_PAYLOAD = 50_000; // 50KB — prevents enormous analytics blobs from reaching the GPT-4o prompt

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ok = await checkEndpointRateLimit(admin.id, 'analytics/ai-insights');
  if (!ok) return rateLimitResponse();

  const raw = await req.text();
  if (raw.length > MAX_PAYLOAD) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  let summary: AnalyticsSummary;
  try { summary = JSON.parse(raw) as AnalyticsSummary; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const prompt = `You are a growth strategist for a personal tech blog called "Henry's Digital Life" by Henry Tsai — a full-stack developer in Brisbane, Australia targeting international new graduates looking for IT jobs in Australia.

Here is the last 30 days of aggregated traffic data (no personal data):

**Overview:**
- Total page views: ${summary.overview.totalViews}
- Unique sessions: ${summary.overview.uniqueSessions}
- Best day: ${summary.overview.topDay?.date} (${summary.overview.topDay?.views} views)

**Top 10 pages:**
${summary.topPages?.slice(0, 10).map((p: { path: string; count: number }) => `  ${p.path}: ${p.count} views`).join('\n')}

**Top traffic sources:**
${summary.referrers?.slice(0, 8).map((r: { source: string; count: number }) => `  ${r.source}: ${r.count} views`).join('\n')}

**Top countries:**
${summary.countries?.slice(0, 8).map((c: { country: string; count: number }) => `  ${c.country}: ${c.count} views`).join('\n')}

**Device split:**
- Desktop: ${summary.devices?.desktop ?? 0}
- Mobile: ${summary.devices?.mobile ?? 0}
- Tablet: ${summary.devices?.tablet ?? 0}

Based on this data, give 6 specific, actionable growth recommendations. Focus on:
1. Which content is performing well and should be expanded
2. Underperforming areas with clear growth potential
3. SEO or distribution improvements based on traffic sources
4. Geographic opportunities based on country data
5. Mobile/UX improvements if device split warrants it
6. One contrarian or non-obvious suggestion

Format as a JSON array of objects: { "title": "...", "insight": "...", "action": "..." }
Each object: title (5-8 words), insight (one sentence of data-backed reasoning), action (one concrete next step).
Return ONLY the JSON array, no markdown fences.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content ?? '[]';
  let suggestions: unknown[] = [];
  try {
    suggestions = JSON.parse(text);
  } catch {
    suggestions = [{ title: 'Parse error', insight: text.slice(0, 200), action: 'Check API response' }];
  }

  void recordUsage(admin.id, 'analytics/ai-insights');
  return NextResponse.json({ suggestions });
}
