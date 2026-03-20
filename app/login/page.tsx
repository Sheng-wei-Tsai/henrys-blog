'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

type Tab = 'signin' | 'register';

const input: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  border: '1px solid var(--parchment)', borderRadius: '10px',
  background: 'var(--warm-white)', color: 'var(--brown-dark)',
  fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: '0.4rem',
};

export default function LoginPage() {
  const { user, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const [tab,          setTab]          = useState<Tab>('signin');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [displayName,  setDisplayName]  = useState('');
  const [location,     setLocation]     = useState('');
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) setError(error);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false); return;
    }
    const { error } = await signUpWithEmail({ email, password, displayName, location });
    setLoading(false);
    if (error) { setError(error); return; }
    setSuccess('Account created! Check your email to confirm, then sign in.');
    setTab('signin');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', padding: '5rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌿</div>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.4rem' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Sign in to track your learning, save jobs, and generate cover letters.
        </p>
      </div>

      {/* GitHub */}
      <button onClick={signInWithGithub} style={{
        width: '100%', background: 'var(--brown-dark)', color: 'var(--cream)',
        border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem',
        fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
        marginBottom: '1.4rem',
      }}>
        <svg height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Continue with GitHub
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--parchment)' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--parchment)' }} />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: 'var(--parchment)', borderRadius: '10px',
        padding: '0.25rem', marginBottom: '1.5rem',
      }}>
        {(['signin', 'register'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }} style={{
            flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
            background: tab === t ? 'var(--warm-white)' : 'transparent',
            color: tab === t ? 'var(--brown-dark)' : 'var(--text-muted)',
            fontWeight: tab === t ? 600 : 400, fontSize: '0.88rem',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: tab === t ? '0 1px 4px rgba(44,31,20,0.08)' : 'none',
          }}>
            {t === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {error   && <p style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</p>}

      {/* Sign In Form */}
      {tab === 'signin' && (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={label}>Email</label>
            <input type="email" required style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={label}>Password</label>
            <input type="password" required style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{
            background: 'var(--terracotta)', color: 'white',
            border: 'none', borderRadius: '12px', padding: '0.8rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
          }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      )}

      {/* Register Form */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={label}>Your name</label>
            <input required style={input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Henry Tsai" />
          </div>
          <div>
            <label style={label}>Where are you based?</label>
            <input style={input} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Brisbane, Australia" />
          </div>
          <div>
            <label style={label}>Email</label>
            <input type="email" required style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={label}>Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(min. 8 characters)</span></label>
            <input type="password" required style={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{
            background: 'var(--terracotta)', color: 'white',
            border: 'none', borderRadius: '12px', padding: '0.8rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
          }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
      )}
    </div>
  );
}
