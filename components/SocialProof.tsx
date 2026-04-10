'use client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Props {
  resumeCount:  number;
  memberCount:  number;
  contentCount: number;
}

const FEATURES = [
  {
    emoji: '📄',
    title: 'AU-specific resume feedback',
    desc:  'Scored against what Atlassian, Canva & CBA recruiters actually look for.',
  },
  {
    emoji: '🛂',
    title: '482 & SID visa tracker',
    desc:  'Every stage of your Skills in Demand visa — checklist, timeline, documents.',
  },
  {
    emoji: '🎯',
    title: 'AI interview mentor',
    desc:  'Role-specific questions + live coaching, not generic LeetCode prep.',
  },
];

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="social-proof-stat">
      <span className="social-proof-stat-value">{value}</span>
      <span className="social-proof-stat-label">{label}</span>
    </div>
  );
}

export default function SocialProof({ resumeCount, memberCount, contentCount }: Props) {
  const { user, loading } = useAuth();

  // Hide once auth resolves and user is logged in — they see PersonalisedHero instead
  if (!loading && user) return null;

  const resumeLabel = resumeCount > 0
    ? `${resumeCount}+`
    : 'Free';

  const memberLabel = memberCount > 5
    ? `${memberCount}+`
    : 'Free';

  return (
    <section className="social-proof-section">
      {/* ── Stats strip ── */}
      <div className="social-proof-stats">
        <StatPill value={resumeLabel}       label="resumes analysed" />
        <StatPill value="5"                 label="career paths" />
        <StatPill value={`${contentCount}+`} label="resources published" />
        <StatPill value="Daily"             label="AI & visa news" />
      </div>

      {/* ── Feature highlights ── */}
      <div className="social-proof-features">
        {FEATURES.map(f => (
          <div key={f.title} className="social-proof-feature">
            <span className="social-proof-feature-emoji">{f.emoji}</span>
            <div>
              <div className="social-proof-feature-title">{f.title}</div>
              <div className="social-proof-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Trust statement + CTA ── */}
      <div className="social-proof-trust">
        <p>
          Built by an international IT grad who went through it.
          Everything here exists because it didn't exist when it was needed.
        </p>
        <Link href="/login" className="hero-btn-primary" style={{ fontSize: '0.9rem' }}>
          Start for free — no credit card →
        </Link>
      </div>
    </section>
  );
}
