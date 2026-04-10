'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ReadinessScore from '@/components/ReadinessScore';
import GettingStartedChecklist from '@/components/GettingStartedChecklist';
import type { User } from '@supabase/supabase-js';
import { supabase, type SavedJob, type JobApplication } from '@/lib/supabase';

interface JobAlert {
  id: string;
  keywords: string;
  location: string;
  full_time: boolean;
  frequency: string;
  created_at: string;
}

// Maps onboarding_role → interview prep path slug
const ROLE_TO_PREP: Record<string, string> = {
  'frontend':      'junior-frontend',
  'fullstack':     'junior-fullstack',
  'backend':       'junior-backend',
  'data-engineer': 'junior-data',
  'devops':        'junior-devops',
  'mobile':        'junior-mobile',
  'qa':            'junior-qa',
};

// Maps job title keywords → nearest interview prep role
function inferPrepRole(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('devops') || t.includes('cloud') || t.includes('infrastructure')) return 'junior-devops';
  if (t.includes('data') && (t.includes('engineer') || t.includes('analyst')))    return 'junior-data';
  if (t.includes('mobile') || t.includes('ios') || t.includes('android'))         return 'junior-mobile';
  if (t.includes('qa') || t.includes('test') || t.includes('quality'))            return 'junior-qa';
  if (t.includes('back') || t.includes('node') || t.includes('python') || t.includes('java')) return 'junior-backend';
  return 'junior-fullstack';
}

const STATUS_COLORS: Record<string, string> = {
  applied:   '#3b82f6',
  interview: '#f59e0b',
  offer:     '#10b981',
  rejected:  '#ef4444',
  withdrawn: '#6b7280',
};
const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied', interview: 'Interview', offer: 'Offer 🎉', rejected: 'Rejected', withdrawn: 'Withdrawn',
};

export default function DashboardPage() {
  const { user, loading, reopenOnboarding } = useAuth();
  const router = useRouter();

  const [savedJobs, setSavedJobs]         = useState<SavedJob[]>([]);
  const [applications, setApplications]   = useState<JobApplication[]>([]);
  const [alerts, setAlerts]               = useState<JobAlert[]>([]);
  const [activeTab, setActiveTab]         = useState<'saved' | 'applications' | 'alerts'>('saved');
  const [dataLoading, setDataLoading]     = useState(true);
  const [onboardingRole, setOnboardingRole]     = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone]     = useState(false);
  const [hasResume, setHasResume]               = useState(false);
  const [hasSkills, setHasSkills]               = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('saved_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('job_applications').select('*').eq('user_id', user.id).order('applied_at', { ascending: false }),
      supabase.from('job_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('onboarding_role, onboarding_completed').eq('id', user.id).maybeSingle(),
      supabase.from('resume_analyses').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
      supabase.from('skill_progress').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    ]).then(([saved, apps, alts, profile, resume, skills]) => {
      setSavedJobs(saved.data ?? []);
      setApplications(apps.data ?? []);
      setAlerts(alts.data ?? []);
      setOnboardingRole(profile.data?.onboarding_role ?? null);
      setOnboardingDone(profile.data?.onboarding_completed ?? false);
      setHasResume(!!resume.data);
      setHasSkills(!!skills.data);
      setDataLoading(false);
    });
  }, [user]);

  const unsaveJob = async (jobId: string) => {
    await supabase.from('saved_jobs').delete().eq('user_id', user!.id).eq('job_id', jobId);
    setSavedJobs(prev => prev.filter(j => j.job_id !== jobId));
  };

  const addToTracker = async (job: SavedJob) => {
    const alreadyTracked = applications.some(a => a.job_id === job.job_id);
    if (alreadyTracked) return;
    const { data } = await supabase.from('job_applications').insert({
      user_id: user!.id, job_id: job.job_id,
      title: job.title, company: job.company, url: job.url, status: 'applied',
    }).select().single();
    if (data) setApplications(prev => [data, ...prev]);
  };

  const updateStatus = async (appId: string, status: string) => {
    await supabase.from('job_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: status as any } : a));
  };

  if (loading || !user) return null;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          {user.user_metadata?.avatar_url && (
            <Image src={user.user_metadata.avatar_url} alt="avatar" width={48} height={48} style={{ borderRadius: '50%' }} />
          )}
          <div>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--brown-dark)' }}>
              My Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {user.user_metadata?.full_name ?? user.email}
              {' · '}
              <button onClick={reopenOnboarding} style={{ background: 'none', border: 'none', color: 'var(--terracotta)', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>
                Edit preferences
              </button>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Saved Jobs',    value: savedJobs.length,                         color: 'var(--terracotta)' },
            { label: 'Applications',  value: applications.length,                      color: '#3b82f6' },
            { label: 'Interviews',    value: applications.filter(a => a.status === 'interview').length, color: '#f59e0b' },
            { label: 'Offers',        value: applications.filter(a => a.status === 'offer').length,     color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, minWidth: '120px', background: 'var(--warm-white)',
              border: '1px solid var(--parchment)', borderRadius: '12px',
              padding: '1rem 1.2rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Score */}
      <ReadinessScore />

      {/* Career Tools */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Career Tools
        </h2>
        <div className="career-tools-grid">
          <Link href="/dashboard/resume-analyser" className="career-tool-card" style={{ borderLeft: '3px solid var(--terracotta)' }}>
            <span style={{ fontSize: '1.6rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.92rem' }}>Resume Analyser</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>AI feedback for the AU IT job market</div>
            </div>
          </Link>
          <Link href={`/interview-prep/${onboardingRole ? (ROLE_TO_PREP[onboardingRole] ?? 'junior-fullstack') : 'junior-fullstack'}`} className="career-tool-card" style={{ borderLeft: '3px solid var(--jade)' }}>
            <span style={{ fontSize: '1.6rem' }}>🎯</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.92rem' }}>Interview Prep</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Practice with Alex, your AI mentor</div>
            </div>
          </Link>
          <Link href="/au-insights" className="career-tool-card" style={{ borderLeft: '3px solid var(--gold)' }}>
            <span style={{ fontSize: '1.6rem' }}>🗺</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.92rem' }}>AU IT Insights</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Salaries, visas, skill map & more</div>
            </div>
          </Link>
          <Link href="/dashboard/visa-tracker" className="career-tool-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
            <span style={{ fontSize: '1.6rem' }}>🛂</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.92rem' }}>Visa Journey Tracker</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Track your 482 / Skills in Demand visa</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting started checklist — shown until all steps are done */}
      {!dataLoading && (() => {
        const hasJob = applications.length > 0 || savedJobs.length > 0;
        const hasInterview = false; // no interview_sessions table yet
        const allDone = onboardingDone && hasResume && hasSkills && hasJob;
        return !allDone ? (
          <GettingStartedChecklist
            hasResume={hasResume}
            hasSkills={hasSkills}
            hasInterview={hasInterview}
            hasJob={hasJob}
            onboardingDone={onboardingDone}
          />
        ) : null;
      })()}

      {/* Tabs */}
      <div className="dashboard-tabs" style={{ marginBottom: '1.5rem' }}>
          {([
            ['saved',        `♥ Saved (${savedJobs.length})`],
            ['applications', `📋 Applications (${applications.length})`],
            ['alerts',       `🔔 Alerts (${alerts.length})`],
          ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '0.5rem 1.2rem', borderRadius: '99px',
            background: activeTab === tab ? 'var(--terracotta)' : 'var(--warm-white)',
            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            border: activeTab === tab ? 'none' : '1px solid var(--parchment)',
            fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading...</p>
      ) : (
        <>
          {/* Saved Jobs Tab */}
          {activeTab === 'saved' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '4rem' }}>
              {savedJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>♡</div>
                  <p>No saved jobs yet. <Link href="/jobs" style={{ color: 'var(--terracotta)' }}>Search for jobs →</Link></p>
                </div>
              ) : savedJobs.map(job => (
                <div key={job.id} style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.25rem' }}>
                        {job.title}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {job.company} · {job.location} {job.salary ? `· 💰 ${job.salary}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => addToTracker(job)} style={{
                        padding: '0.35rem 0.8rem', borderRadius: '99px',
                        border: '1px solid var(--parchment)', background: 'white',
                        fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)',
                      }}>
                        + Track
                      </button>
                      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                        padding: '0.35rem 0.8rem', borderRadius: '99px',
                        background: 'var(--terracotta)', color: 'white',
                        fontSize: '0.8rem', textDecoration: 'none',
                      }}>Apply →</a>
                      <button onClick={() => unsaveJob(job.job_id)} style={{
                        padding: '0.35rem 0.8rem', borderRadius: '99px',
                        border: '1px solid #fcc', background: '#fff0f0',
                        fontSize: '0.8rem', cursor: 'pointer', color: '#c00',
                      }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '4rem' }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                  <p>No saved searches yet. <Link href="/jobs" style={{ color: 'var(--terracotta)' }}>Search for jobs →</Link> and click "Save this search".</p>
                </div>
              ) : alerts.map(alert => (
                <div key={alert.id} style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.25rem' }}>
                        {alert.keywords}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {alert.location}{alert.full_time ? ' · Full-time' : ''} · {alert.frequency}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/jobs?keywords=${encodeURIComponent(alert.keywords)}&location=${encodeURIComponent(alert.location)}`}
                        style={{ padding: '0.35rem 0.8rem', borderRadius: '99px', background: 'var(--parchment)', color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>
                        Search
                      </Link>
                      <button
                        onClick={async () => {
                          await fetch(`/api/alerts?id=${alert.id}`, { method: 'DELETE' });
                          setAlerts(prev => prev.filter(a => a.id !== alert.id));
                        }}
                        style={{ padding: '0.35rem 0.8rem', borderRadius: '99px', border: '1px solid #fcc', background: '#fff0f0', fontSize: '0.8rem', cursor: 'pointer', color: '#c00' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '4rem' }}>
              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <p>No applications yet. Save a job and click "+ Track" to start.</p>
                </div>
              ) : applications.map(app => (
                <div key={app.id} style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', padding: '1.2rem 1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>
                        {app.title}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {app.company} · Applied {new Date(app.applied_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{
                        padding: '0.3rem 0.7rem', borderRadius: '99px',
                        border: `1.5px solid ${STATUS_COLORS[app.status]}`,
                        color: STATUS_COLORS[app.status], fontWeight: 600,
                        fontSize: '0.82rem', background: 'white', cursor: 'pointer',
                      }}>
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      {app.status === 'interview' && (
                        <Link href={`/interview-prep/${inferPrepRole(app.title)}`}
                          style={{ padding: '0.3rem 0.8rem', borderRadius: '99px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          🎯 Prep for interview
                        </Link>
                      )}
                      <a href={app.url} target="_blank" rel="noopener noreferrer" style={{
                        padding: '0.3rem 0.7rem', borderRadius: '99px',
                        background: 'var(--parchment)', color: 'var(--text-secondary)',
                        fontSize: '0.8rem', textDecoration: 'none',
                      }}>View</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
