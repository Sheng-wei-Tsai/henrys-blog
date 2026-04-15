import { NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseService } from '@/lib/auth-server';

export interface DashboardSummary {
  onboardingCompleted:  boolean;
  onboardingRole:       string | null;
  onboardingVisaStatus: string | null;
  onboardingJobStage:   string | null;
  visaStep:             { step: number; status: string; startedAt: string | null } | null;
  reviewDue:            { skillId: string; pathId: string } | null;
  resumeStaleDays:      number | null;  // null = never analysed
  applicationCount:     number;
  interviewCount:       number;
}

export async function GET() {
  // Auth via SSR cookie session (not Bearer token — tokens can leak in logs/referrers)
  const authSb = await createSupabaseServer();
  const { data: { user } } = await authSb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;
  // Service role for cross-table reads — all queries scoped to uid
  const sb = createSupabaseService();

  const [profile, visaRow, reviewRow, resumeRow, apps] = await Promise.all([
    sb.from('profiles')
      .select('onboarding_completed, onboarding_role, onboarding_visa_status, onboarding_job_stage')
      .eq('id', uid)
      .maybeSingle(),

    sb.from('visa_tracker')
      .select('steps, started_at')
      .eq('user_id', uid)
      .maybeSingle(),

    sb.from('skill_progress')
      .select('skill_id, path_id')
      .eq('user_id', uid)
      .lte('next_review_at', new Date().toISOString())
      .limit(1)
      .maybeSingle(),

    sb.from('resume_analyses')
      .select('analysed_at')
      .eq('user_id', uid)
      .order('analysed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    sb.from('job_applications')
      .select('status')
      .eq('user_id', uid)
      .limit(500),
  ]);

  // Find current in-progress visa step
  let visaStep: DashboardSummary['visaStep'] = null;
  if (visaRow.data?.steps) {
    const steps = visaRow.data.steps as Record<string, { status: string }>;
    const inProgressKey = Object.keys(steps).find(k => steps[k].status === 'in_progress');
    if (inProgressKey) {
      visaStep = {
        step:      parseInt(inProgressKey),
        status:    'in_progress',
        startedAt: visaRow.data.started_at ?? null,
      };
    }
  }

  const resumeStaleDays = resumeRow.data
    ? Math.floor((Date.now() - new Date(resumeRow.data.analysed_at).getTime()) / 86_400_000)
    : null;

  const applicationList = apps.data ?? [];
  const summary: DashboardSummary = {
    onboardingCompleted:  profile.data?.onboarding_completed ?? false,
    onboardingRole:       profile.data?.onboarding_role ?? null,
    onboardingVisaStatus: profile.data?.onboarding_visa_status ?? null,
    onboardingJobStage:   profile.data?.onboarding_job_stage ?? null,
    visaStep,
    reviewDue:           reviewRow.data
      ? { skillId: reviewRow.data.skill_id, pathId: reviewRow.data.path_id }
      : null,
    resumeStaleDays,
    applicationCount:    applicationList.length,
    interviewCount:      applicationList.filter(a => a.status === 'interview').length,
  };

  return NextResponse.json(summary);
}
