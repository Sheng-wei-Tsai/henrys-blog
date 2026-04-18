'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const FREE_FEATURES = [
  'Browse all job listings',
  'Save & track applications',
  'Read blog posts',
  'Job alerts',
  'Comments',
];

const PRO_FEATURES = [
  'Everything in Free',
  'AI cover letter generator',
  'AI resume match & gap analysis',
  'Interview prep (questions, coach, mentor)',
  'YouTube video study guide + flashcards',
  'AI-generated quiz per video',
  '100 AI calls per day',
  'Priority support',
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const subscribe = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.code === 'UNAUTHENTICATED') {
        router.push('/login?next=/pricing');
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      // Redirect to Stripe Checkout
      router.push(data.url);
    } catch {
      toast.error('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '2.2rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.75rem' }}>
          Simple, honest pricing
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
          All AI features for one flat monthly price.
          Cancel anytime — no lock-ins, no surprises.
        </p>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem', marginBottom: '2.5rem' }}>

        {/* Free */}
        <div style={{ border: '1px solid var(--parchment)', borderRadius: '16px',
          padding: '2rem', background: 'var(--warm-white)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Free
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brown-dark)' }}>$0</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/ month</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {FREE_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--brown-dark)' }}>
                <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          <Link href="/login" style={{
            display: 'block', textAlign: 'center', padding: '0.65rem',
            borderRadius: '10px', border: '1px solid var(--parchment)',
            color: 'var(--brown-dark)', fontSize: '0.9rem', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Get started free
          </Link>
        </div>

        {/* Pro */}
        <div style={{ border: '2px solid var(--terracotta)', borderRadius: '16px',
          padding: '2rem', background: 'var(--warm-white)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--terracotta)', color: 'white', fontSize: '0.68rem',
            fontWeight: 700, padding: '0.2em 0.8em', borderRadius: '99px',
            textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
            Most popular
          </div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--terracotta)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Pro
          </p>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brown-dark)' }}>$9.99</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>USD / month</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Billed monthly. Cancel anytime.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {PRO_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--brown-dark)' }}>
                <span style={{ color: 'var(--terracotta)', flexShrink: 0 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          <button onClick={subscribe} disabled={loading} style={{
            display: 'block', width: '100%', padding: '0.75rem',
            borderRadius: '10px', border: 'none',
            background: loading ? '#ccc' : 'var(--terracotta)',
            color: 'white', fontSize: '0.95rem', fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>
            {loading ? 'Redirecting…' : 'Subscribe — $9.99 / mo'}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '1.25rem', textAlign: 'center' }}>
          Common questions
        </h2>
        {[
          ['Can I cancel anytime?', 'Yes. Cancel from your dashboard and you keep access until the end of the billing period. No questions asked.'],
          ['What payment methods are accepted?', 'All major credit/debit cards via Stripe. Your payment info is handled entirely by Stripe — we never see your card details.'],
          ['Is my data private?', 'Your generated content (cover letters, study guides) is tied to your account only. We never share or sell user data.'],
          ['What happens if I exceed 100 calls/day?', 'You get a friendly message and your limit resets on a rolling 24-hour window. This limit is generous — most users use fewer than 20 calls/day.'],
        ].map(([q, a]) => (
          <div key={q} style={{ borderBottom: '1px solid var(--parchment)', padding: '1rem 0' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--brown-dark)', marginBottom: '0.4rem' }}>{q}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
