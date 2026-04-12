import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Score bands
const BANDS = [
  { min: 85, label: 'Job Ready',           color: '#10b981' },
  { min: 70, label: 'Strong Candidate',    color: '#22c55e' },
  { min: 55, label: 'Getting There',       color: '#f59e0b' },
  { min: 40, label: 'Building Foundation', color: '#f97316' },
  { min:  0, label: 'Early Stage',         color: '#ef4444' },
];

function getBand(score: number) {
  return BANDS.find(b => score >= b.min) ?? BANDS[BANDS.length - 1];
}

// ── Component: Resume (0–100) ─────────────────────────────────
async function resumeScore(userId: string): Promise<{ score: number; detail: string }> {
  const { data } = await sb
    .from('resume_analyses')
    .select('overall_score, analysed_at')
    .eq('user_id', userId)
    .order('analysed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { score: 0, detail: 'No resume analysed yet' };

  const days = Math.floor((Date.now() - new Date(data.analysed_at).getTime()) / 86_400_000);
  let score: number = data.overall_score;
  if (days > 60) score = Math.min(score, 40);
  else if (days > 30) score = Math.min(score, 60);

  const detail = days === 0 ? 'Analysed today' : `Analysed ${days}d ago`;
  return { score, detail };
}

// ── Component: Skills (0–100) ─────────────────────────────────
async function skillsScore(userId: string, role: string | null): Promise<{ score: number; detail: string }> {
  const { data: rows } = await sb
    .from('skill_progress')
    .select('path_id, review_count, status')
    .eq('user_id', userId);

  if (!rows || rows.length === 0) return { score: 0, detail: 'No skills started yet' };

  // Use the target path from onboarding, or the one with most rows
  const pathCounts: Record<string, number> = {};
  for (const r of rows) pathCounts[r.path_id] = (pathCounts[r.path_id] ?? 0) + 1;

  const targetPath = role
    ? (Object.keys(pathCounts).find(p => p.includes(role.replace('fullstack', 'fullstack').replace('data-engineer', 'data'))) ?? Object.keys(pathCounts)[0])
    : Object.entries(pathCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const pathRows = rows.filter(r => r.path_id === targetPath);
  const total = pathRows.length;
  if (total === 0) return { score: 0, detail: 'No skills started yet' };

  const mastered  = pathRows.filter(r => r.review_count >= 3).length;
  const completed = pathRows.filter(r => r.status === 'completed' && r.review_count < 3).length;
  const score = Math.round(((mastered + completed * 0.6) / total) * 100);

  return { score, detail: `${mastered} of ${total} mastered` };
}

// ── Component: Interview (0–100) ──────────────────────────────
// Derived from profiles.interview_xp + interview_level (set by InterviewSession.tsx)
function interviewScore(xp: number, level: number): { score: number; detail: string } {
  if (xp === 0) return { score: 0, detail: 'No sessions yet' };

  // XP thresholds: level 1 starts at 0, each ~150 XP = +1 level (rough)
  // Map to 0–100: 500 XP ≈ solid practitioner
  const score = Math.min(100, Math.round((xp / 500) * 100));
  const detail = level > 1 ? `Level ${level} · ${xp} XP` : `${xp} XP earned`;
  return { score, detail };
}

// ── Component: Quizzes (0–100) ────────────────────────────────
async function quizScore(userId: string): Promise<{ score: number; detail: string }> {
  const { data: rows } = await sb
    .from('video_progress')
    .select('quiz_score, quiz_taken')
    .eq('user_id', userId)
    .eq('quiz_taken', true);

  if (!rows || rows.length === 0) return { score: 0, detail: 'No quizzes taken yet' };

  const count = rows.length;
  let base = count >= 6 ? 70 : count >= 3 ? 55 : count >= 1 ? 30 : 0;

  const scores = rows.map(r => r.quiz_score ?? 0).filter(s => s > 0);
  if (scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    base = Math.min(100, base + Math.round((avg / 100) * 30));
  }

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const detail = `${count} video${count !== 1 ? 's' : ''}${avg ? `, avg ${avg}%` : ''}`;
  return { score: base, detail };
}

// ── Boost suggestion ──────────────────────────────────────────
function boostAction(components: Record<string, { score: number; detail: string }>, role: string | null) {
  const sorted = Object.entries(components).sort((a, b) => a[1].score - b[1].score);
  const lowest = sorted[0][0];

  const path = role ? `junior-${role}` : 'junior-fullstack';
  const map: Record<string, { label: string; href: string; gain: string }> = {
    resume:    { label: 'Analyse your resume',          href: '/dashboard/resume-analyser', gain: '+8 pts' },
    skills:    { label: 'Complete next skill topic',    href: `/learn/${path}`,             gain: '+6 pts' },
    interview: { label: 'Practice an interview session', href: '/interview-prep',            gain: '+10 pts' },
    quiz:      { label: 'Take a YouTube learning quiz', href: '/learn/youtube',             gain: '+5 pts' },
  };
  return map[lowest] ?? map.resume;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch profile + all independent scores in one parallel round-trip
  const [{ data: profile }, resume, quiz] = await Promise.all([
    sb.from('profiles')
      .select('onboarding_role, interview_xp, interview_level')
      .eq('id', user.id)
      .maybeSingle(),
    resumeScore(user.id),
    quizScore(user.id),
  ]);

  const role      = profile?.onboarding_role ?? null;
  const xp        = profile?.interview_xp    ?? 0;
  const lvl       = profile?.interview_level ?? 1;

  // Skills needs the role — fetch after profile; interview is computed locally
  const skillsFinal = await skillsScore(user.id, role);
  const interview   = interviewScore(xp, lvl);

  const components = { resume, skills: skillsFinal, interview, quiz };
  const score = Math.round(
    (resume.score + skillsFinal.score + interview.score + quiz.score) / 4
  );

  const band = getBand(score);
  const boost = boostAction(components, role);

  // Upsert daily snapshot (fire-and-forget)
  sb.from('readiness_snapshots').upsert(
    {
      user_id:         user.id,
      score,
      resume_score:    resume.score,
      skills_score:    skillsFinal.score,
      interview_score: interview.score,
      quiz_score:      quiz.score,
      recorded_at:     new Date().toISOString().slice(0, 10),
    },
    { onConflict: 'user_id,recorded_at', ignoreDuplicates: false },
  ).then(() => {});

  return NextResponse.json({ score, components, band: band.label, bandColor: band.color, boostAction: boost });
}
