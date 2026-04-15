import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseService } from '@/lib/auth-server';

const VALID_ROLES = ['frontend', 'fullstack', 'backend', 'data-engineer', 'devops', 'mobile', 'qa', 'other'];
const VALID_VISA  = ['outside', 'student', 'graduate', 'working', 'resident', 'unsure'];
const VALID_STAGE = ['building', 'applying', 'interviews', 'offer'];

export async function POST(req: NextRequest) {
  // Auth via SSR cookie session (not Bearer token — tokens can leak in logs/referrers)
  const authSb = await createSupabaseServer();
  const { data: { user } } = await authSb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { role, visaStatus, jobStage } = body as Record<string, string | undefined>;

  // Validate values (allow null/undefined to persist as null for skipped questions)
  if (role       && !VALID_ROLES.includes(role))       return NextResponse.json({ error: 'Invalid role' },       { status: 400 });
  if (visaStatus && !VALID_VISA.includes(visaStatus))  return NextResponse.json({ error: 'Invalid visaStatus' }, { status: 400 });
  if (jobStage   && !VALID_STAGE.includes(jobStage))   return NextResponse.json({ error: 'Invalid jobStage' },   { status: 400 });

  // Service role for the write (profiles table needs service role to bypass RLS on upsert)
  const sb = createSupabaseService();
  const { error } = await sb.from('profiles').upsert({
    id:                      user.id,
    onboarding_role:         role          ?? null,
    onboarding_visa_status:  visaStatus    ?? null,
    onboarding_job_stage:    jobStage      ?? null,
    onboarding_completed:    true,
    onboarding_completed_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: 'Failed to save onboarding' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
