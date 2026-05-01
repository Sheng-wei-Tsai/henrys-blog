'use client';

import { useState } from 'react';

const LOCATIONS = ['Sydney', 'Melbourne', 'Brisbane', 'Remote', 'Hybrid'] as const;
const JOB_TYPES = ['Full-time', 'Contract', 'Graduate'] as const;

type Location = (typeof LOCATIONS)[number];
type JobType  = (typeof JOB_TYPES)[number];

interface FormFields {
  company:      string;
  title:        string;
  location:     Location;
  jobType:      JobType;
  description:  string;
  applyUrl:     string;
  salary:       string;
  contactEmail: string;
}

const FIELD: React.CSSProperties = {
  width:       '100%',
  padding:     '0.65rem 0.85rem',
  border:      '2px solid var(--parchment)',
  borderRadius: '8px',
  background:  'var(--cream)',
  color:       'var(--text-primary)',
  fontSize:    '0.9rem',
  fontFamily:  "'Space Grotesk', sans-serif",
  boxSizing:   'border-box',
};

const LABEL: React.CSSProperties = {
  display:      'block',
  fontSize:     '0.82rem',
  fontWeight:   600,
  color:        'var(--text-secondary)',
  marginBottom: '0.35rem',
};

export default function PostARoleClient() {
  const [form, setForm] = useState<FormFields>({
    company:      '',
    title:        '',
    location:     'Sydney',
    jobType:      'Full-time',
    description:  '',
    applyUrl:     '',
    salary:       '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = <K extends keyof FormFields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/job-listing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="post-form" style={{ marginBottom: '4rem', scrollMarginTop: '5rem' }}>
      <h2 style={{
        fontFamily: "'Lora', serif", fontSize: '1.5rem', fontWeight: 700,
        color: 'var(--brown-dark)', marginBottom: '0.5rem', textAlign: 'center',
      }}>
        Post your role — $99 AUD
      </h2>
      <p style={{
        textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem',
        marginBottom: '1.75rem',
      }}>
        30-day featured listing · Direct applications · Live within 24 hours
      </p>

      <form onSubmit={handleSubmit} style={{
        maxWidth: '560px', margin: '0 auto',
        padding: '2rem',
        background: 'var(--warm-white)',
        border: 'var(--panel-border)',
        borderRadius: '16px',
        boxShadow: 'var(--panel-shadow)',
        display: 'flex', flexDirection: 'column', gap: '1.1rem',
      }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={LABEL}>Company name *</label>
            <input
              required style={FIELD} value={form.company}
              onChange={set('company')} placeholder="Canva" maxLength={100}
            />
          </div>
          <div>
            <label style={LABEL}>Job title *</label>
            <input
              required style={FIELD} value={form.title}
              onChange={set('title')} placeholder="Senior Data Engineer" maxLength={200}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={LABEL}>Location *</label>
            <select required style={FIELD} value={form.location} onChange={set('location')}>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Role type *</label>
            <select required style={FIELD} value={form.jobType} onChange={set('jobType')}>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={LABEL}>
            Description *{' '}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
              ({form.description.length}/2000)
            </span>
          </label>
          <textarea
            required
            style={{ ...FIELD, minHeight: '160px', resize: 'vertical' }}
            value={form.description} maxLength={2000} onChange={set('description')}
            placeholder="Tell candidates about the role, requirements, and what makes your team great…"
          />
        </div>

        <div>
          <label style={LABEL}>Application URL *</label>
          <input
            required type="url" style={FIELD} value={form.applyUrl}
            onChange={set('applyUrl')}
            placeholder="https://company.com/careers/role" maxLength={500}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={LABEL}>Salary range <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input
              style={FIELD} value={form.salary} onChange={set('salary')}
              placeholder="$80k–$110k AUD" maxLength={100}
            />
          </div>
          <div>
            <label style={LABEL}>Contact email *</label>
            <input
              required type="email" style={FIELD} value={form.contactEmail}
              onChange={set('contactEmail')} placeholder="hiring@company.com" maxLength={200}
            />
          </div>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--vermilion)', fontSize: '0.85rem', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="post-role-submit-btn"
          style={{
            padding:      '0.85rem',
            background:   'var(--vermilion)',
            color:        'var(--warm-white)',
            borderRadius: '10px',
            fontWeight:   700,
            fontSize:     '0.95rem',
            border:       'none',
            cursor:       loading ? 'not-allowed' : 'pointer',
            opacity:      loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Redirecting to payment…' : 'Post for $99 AUD →'}
        </button>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Secure checkout via Stripe · No recurring charges
        </p>
      </form>
    </section>
  );
}
