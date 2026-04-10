'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  onComplete: () => void;
}

// step 0 = welcome screen, steps 1-3 = questions
type Step = 0 | 1 | 2 | 3;

const ROLES = [
  { value: 'frontend',      label: 'Frontend',      emoji: '🎨' },
  { value: 'fullstack',     label: 'Full Stack',     emoji: '⚡' },
  { value: 'backend',       label: 'Backend',        emoji: '🔧' },
  { value: 'data-engineer', label: 'Data Engineer',  emoji: '📊' },
  { value: 'devops',        label: 'DevOps / Cloud', emoji: '☁️' },
  { value: 'mobile',        label: 'Mobile',         emoji: '📱' },
  { value: 'qa',            label: 'QA Engineer',    emoji: '🧪' },
  { value: 'other',         label: 'Something else', emoji: '💼' },
];

const VISA_OPTIONS = [
  { value: 'outside',  label: "I'm outside Australia, planning to move" },
  { value: 'student',  label: 'Student visa (500)' },
  { value: 'graduate', label: 'Graduate visa (485)' },
  { value: 'working',  label: 'Working visa (482 / skilled)' },
  { value: 'resident', label: 'Australian resident or citizen' },
  { value: 'unsure',   label: 'Not sure / prefer not to say' },
];

const STAGE_OPTIONS = [
  { value: 'building',   label: 'Just starting out — building skills' },
  { value: 'applying',   label: 'Actively applying — no offers yet' },
  { value: 'interviews', label: 'Have interviews lined up' },
  { value: 'offer',      label: 'Just received an offer / navigating visa' },
];

const QUESTION_TITLES: Record<1 | 2 | 3, string> = {
  1: 'What IT role are you targeting?',
  2: "What's your current situation in Australia?",
  3: 'Where are you in your job search?',
};

export default function OnboardingModal({ onComplete }: Props) {
  const router = useRouter();
  const [step,       setStep]       = useState<Step>(0);
  const [dir,        setDir]        = useState<1 | -1>(1);   // slide direction
  const [role,       setRole]       = useState<string | null>(null);
  const [visaStatus, setVisaStatus] = useState<string | null>(null);
  const [jobStage,   setJobStage]   = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [animKey,    setAnimKey]    = useState(0);  // remount content to trigger slide
  const modalRef = useRef<HTMLDivElement>(null);

  // Whether the current step has a valid selection
  const canContinue =
    step === 0 ||
    (step === 1 && role !== null) ||
    (step === 2 && visaStatus !== null) ||
    (step === 3 && jobStage !== null);

  const goTo = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setAnimKey(k => k + 1);
    setStep(next);
  };

  // ESC → skip + focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Move focus into modal on mount
    const firstFocusable = modal.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleSkip(); return; }

      // Focus trap: keep Tab within modal
      if (e.key === 'Tab') {
        const focusable = Array.from(modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, role, visaStatus, jobStage]);

  const postOnboarding = useCallback(async (r: string | null, v: string | null, s: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ role: r, visaStatus: v, jobStage: s }),
    });
  }, []);

  const submit = useCallback(async () => {
    setSaving(true);
    await postOnboarding(role, visaStatus, jobStage);
    setDone(true);
    setTimeout(() => { onComplete(); router.push('/dashboard'); }, 1200);
  }, [role, visaStatus, jobStage, postOnboarding, onComplete, router]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('onboarding_dismissed', '1');
    onComplete();
  }, [onComplete]);

  // ── Done state ─────────────────────────────────────────────
  if (done) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#f0fdf4', border: '2px solid #86efac',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.2rem', fontSize: '1.6rem',
          }}>✓</div>
          <p style={{ fontFamily: "'Lora', serif", fontSize: '1.3rem', color: 'var(--brown-dark)', fontWeight: 700, margin: 0 }}>
            You&apos;re all set!
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Taking you to your personalised dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Personalise your experience">
      <div ref={modalRef} style={modalStyle}>

        {/* ── Step 0: Welcome ────────────────────────────────── */}
        {step === 0 && (
          <div key="welcome" style={slideIn(1)}>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--brown-dark)', margin: '0 0 0.75rem' }}>
                Welcome! Let&apos;s personalise<br />your experience.
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '30ch', margin: '0 auto 2rem' }}>
                3 quick questions · 90 seconds.<br />
                We&apos;ll tailor every tool to your situation.
              </p>
              <button onClick={() => goTo(1)} style={{ ...primaryBtnStyle, width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
                Let&apos;s go →
              </button>
              <button onClick={handleSkip} style={{ ...skipBtnStyle, display: 'block', margin: '0.75rem auto 0', fontSize: '0.82rem' }}>
                I&apos;ll set this up later
              </button>
            </div>
          </div>
        )}

        {/* ── Steps 1-3: Questions ───────────────────────────── */}
        {step >= 1 && (
          <div key={animKey} style={slideIn(dir)}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.3rem', fontWeight: 500 }}>
                  Question {step} of 3
                </p>
                <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown-dark)', margin: 0 }}>
                  {QUESTION_TITLES[step as 1 | 2 | 3]}
                </h2>
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', paddingTop: '2px', flexShrink: 0 }}>
                {([1, 2, 3] as const).map(s => (
                  <div key={s} style={{
                    width: s === step ? '18px' : '7px', height: '7px',
                    borderRadius: '99px',
                    background: s <= step ? 'var(--terracotta)' : 'var(--parchment)',
                    transition: 'all 0.25s ease',
                  }} />
                ))}
              </div>
            </div>

            {/* Step 1 — Role grid */}
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)} style={optionCardStyle(role === r.value)}>
                    <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: '0.2rem' }}>{r.emoji}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: role === r.value ? 'var(--terracotta)' : 'var(--brown-dark)', lineHeight: 1.2 }}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Visa status */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                {VISA_OPTIONS.map(v => (
                  <button key={v.value} onClick={() => setVisaStatus(v.value)} style={listOptionStyle(visaStatus === v.value)}>
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 — Job stage */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                {STAGE_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => setJobStage(s.value)} style={listOptionStyle(jobStage === s.value)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Hint if nothing selected yet */}
            {!canContinue && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.75rem', textAlign: 'center' }}>
                Pick one to continue
              </p>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleSkip} style={skipBtnStyle}>
                I&apos;ll do this later
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {step > 1 && (
                  <button onClick={() => goTo((step - 1) as Step)} style={backBtnStyle}>
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => goTo((step + 1) as Step)}
                    disabled={!canContinue}
                    style={canContinue ? primaryBtnStyle : disabledBtnStyle}
                    title={canContinue ? undefined : 'Pick one to continue'}
                  >
                    Continue →
                  </button>
                ) : (
                  <button onClick={submit} disabled={saving || !canContinue} style={canContinue && !saving ? primaryBtnStyle : disabledBtnStyle}>
                    {saving ? 'Saving…' : "I'm ready →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slide animation (CSS keyframe via inline style) ──────────
function slideIn(dir: 1 | -1): React.CSSProperties {
  return {
    animation: `slideInFrom${dir > 0 ? 'Right' : 'Left'} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both`,
  };
}

// ─── Styles ───────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '1rem',
};

const modalStyle: React.CSSProperties = {
  background: 'var(--warm-white)',
  border: '1px solid var(--parchment)',
  borderRadius: '20px',
  padding: '2rem',
  width: '100%', maxWidth: '480px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  overflow: 'hidden',
};

function optionCardStyle(selected: boolean): React.CSSProperties {
  return {
    padding: '0.65rem 0.4rem',
    borderRadius: '10px',
    border: selected ? '2px solid var(--terracotta)' : '1.5px solid var(--parchment)',
    background: selected ? '#fff5f2' : 'white',
    cursor: 'pointer', textAlign: 'center',
    transition: 'border-color 0.15s, background 0.15s',
  };
}

function listOptionStyle(selected: boolean): React.CSSProperties {
  return {
    padding: '0.7rem 1rem', borderRadius: '10px',
    border: selected ? '2px solid var(--terracotta)' : '1.5px solid var(--parchment)',
    background: selected ? '#fff5f2' : 'white',
    cursor: 'pointer', textAlign: 'left',
    fontSize: '0.88rem',
    fontWeight: selected ? 600 : 400,
    color: selected ? 'var(--terracotta)' : 'var(--brown-dark)',
    transition: 'border-color 0.15s, background 0.15s',
  };
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1.3rem', borderRadius: '99px',
  background: 'var(--terracotta)', color: 'white',
  border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
};

const disabledBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'var(--parchment)', color: 'var(--text-muted)',
  cursor: 'not-allowed', opacity: 0.7,
};

const backBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1rem', borderRadius: '99px',
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1.5px solid var(--parchment)', fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer',
};

const skipBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none',
  color: 'var(--text-muted)', cursor: 'pointer',
  fontSize: '0.83rem', padding: '0.4rem',
};
