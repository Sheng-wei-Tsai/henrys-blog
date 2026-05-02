'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Profile {
  id: string;
  role_title: string;
  visa_type: string;
  skills: string[];
  city: string;
  created_at: string;
}

interface ReferrerProfile {
  id: string;
  hired_company: string | null;
  hired_skills: string[];
  hired_message: string | null;
  city: string;
  visa_type: string;
  created_at: string;
}

interface CurrentProfile {
  skills: string[];
  visa_type: string;
  role_title: string;
}

interface Props {
  initialProfiles: Profile[];
  initialReferrers: ReferrerProfile[];
  isLoggedIn: boolean;
  hasProfile: boolean;
  currentProfile: CurrentProfile | null;
  currentProfileId: string | null;
  unreadCount: number;
}

const VISA_LABELS: Record<string, string> = {
  '485': '485 Graduate',
  '482':  '482 Sponsored',
  student: 'Student 500',
  pr:      'Permanent Resident',
  citizen: 'Citizen / NZ',
  other:   'Other Visa',
};

const CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Other'];
const VISAS  = ['485', '482', 'student', 'pr', 'citizen', 'other'];

function lookingDuration(createdAt: string): string {
  const ms    = Date.now() - new Date(createdAt).getTime();
  const days  = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 7)  return `${days} day${days !== 1 ? 's' : ''}`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

function skillsMatch(userSkills: string[], referrerSkills: string[]): number {
  const lower = userSkills.map(s => s.toLowerCase());
  return referrerSkills.filter(s => lower.includes(s.toLowerCase())).length;
}

function SeekerCard({ profile, canMessage, onMessage }: {
  profile: Profile;
  canMessage: boolean;
  onMessage: (profileId: string, label: string) => void;
}) {
  const duration = lookingDuration(profile.created_at);
  const visaLabel = VISA_LABELS[profile.visa_type] ?? profile.visa_type;

  return (
    <div
      className="comic-card"
      style={{
        background: 'var(--warm-white)',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div>
          <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
            {profile.role_title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {profile.city} · looking for {duration}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2em 0.7em',
            borderRadius: '4px',
            border: '1.5px solid var(--parchment)',
            color: 'var(--text-secondary)',
            background: 'var(--cream)',
            whiteSpace: 'nowrap',
          }}
        >
          {visaLabel}
        </span>
      </div>

      {profile.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {profile.skills.slice(0, 8).map(skill => (
            <span
              key={skill}
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                padding: '0.18em 0.65em',
                borderRadius: '4px',
                background: 'rgba(30,122,82,0.08)',
                color: 'var(--jade)',
                border: '1.5px solid rgba(30,122,82,0.25)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {canMessage && (
        <button
          className="network-dm-btn"
          onClick={() => onMessage(profile.id, `${profile.role_title} in ${profile.city}`)}
        >
          Message
        </button>
      )}
    </div>
  );
}

function ReferrerCard({ referrer, matchCount, canMessage, onMessage }: {
  referrer: ReferrerProfile;
  matchCount: number;
  canMessage: boolean;
  onMessage: (profileId: string, label: string) => void;
}) {
  const visaLabel = VISA_LABELS[referrer.visa_type] ?? referrer.visa_type;

  return (
    <div
      className="comic-card"
      style={{
        background: 'var(--warm-white)',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div>
          <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
            {referrer.hired_company ?? 'Undisclosed company'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {referrer.city}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2em 0.7em',
              borderRadius: '4px',
              border: '1.5px solid var(--parchment)',
              color: 'var(--text-secondary)',
              background: 'var(--cream)',
              whiteSpace: 'nowrap',
            }}
          >
            {visaLabel}
          </span>
          {matchCount > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.18em 0.6em',
                borderRadius: '4px',
                background: 'rgba(200,138,20,0.1)',
                color: 'var(--gold)',
                border: '1.5px solid rgba(200,138,20,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              {matchCount} skill{matchCount !== 1 ? 's' : ''} match
            </span>
          )}
        </div>
      </div>

      {referrer.hired_message && (
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            margin: 0,
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          &ldquo;{referrer.hired_message}&rdquo;
        </p>
      )}

      {referrer.hired_skills.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Looking for
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {referrer.hired_skills.slice(0, 8).map(skill => (
              <span
                key={skill}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  padding: '0.18em 0.65em',
                  borderRadius: '4px',
                  background: 'rgba(200,138,20,0.08)',
                  color: 'var(--gold)',
                  border: '1.5px solid rgba(200,138,20,0.25)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {canMessage ? (
        <button
          className="network-dm-btn"
          onClick={() => onMessage(referrer.id, `${referrer.hired_company ?? 'Referrer'} in ${referrer.city}`)}
        >
          Message
        </button>
      ) : (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            padding: '0.6rem 0.8rem',
            background: 'var(--cream)',
            borderRadius: '6px',
            border: '1px solid var(--parchment)',
          }}
        >
          <Link href="/login" style={{ color: 'var(--vermilion)', fontWeight: 600 }}>Sign in</Link> to send a message.
        </div>
      )}
    </div>
  );
}

export default function NetworkPageClient({
  initialProfiles,
  initialReferrers,
  isLoggedIn,
  hasProfile,
  currentProfile,
  currentProfileId,
  unreadCount,
}: Props) {
  const [tab, setTab]               = useState<'seekers' | 'referrers'>('seekers');
  const [cityFilter, setCityFilter]  = useState('');
  const [visaFilter, setVisaFilter]  = useState('');
  const [roleSearch, setRoleSearch]  = useState('');

  // Compose modal state
  const [composeTarget, setComposeTarget]   = useState<{ profileId: string; label: string } | null>(null);
  const [draftContent, setDraftContent]     = useState('');
  const [sending, setSending]               = useState(false);
  const [sendError, setSendError]           = useState('');
  const [sendSuccess, setSendSuccess]       = useState(false);

  function openCompose(profileId: string, label: string) {
    setComposeTarget({ profileId, label });
    setDraftContent('');
    setSendError('');
    setSendSuccess(false);
  }

  function closeCompose() {
    setComposeTarget(null);
    setDraftContent('');
    setSendError('');
    setSendSuccess(false);
  }

  async function handleSend() {
    if (!composeTarget || !draftContent.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/network/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          recipient_profile_id: composeTarget.profileId,
          content:              draftContent.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setSendError(err.error ?? 'Failed to send. Please try again.');
      } else {
        setSendSuccess(true);
        setTimeout(closeCompose, 2000);
      }
    } catch {
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const filteredSeekers = useMemo(() => {
    return initialProfiles.filter(p => {
      if (cityFilter && p.city !== cityFilter) return false;
      if (visaFilter && p.visa_type !== visaFilter) return false;
      if (roleSearch && !p.role_title.toLowerCase().includes(roleSearch.toLowerCase())) return false;
      return true;
    });
  }, [initialProfiles, cityFilter, visaFilter, roleSearch]);

  const filteredReferrers = useMemo(() => {
    return initialReferrers.filter(r => {
      if (cityFilter && r.city !== cityFilter) return false;
      if (visaFilter && r.visa_type !== visaFilter) return false;
      return true;
    });
  }, [initialReferrers, cityFilter, visaFilter]);

  // Referrers that match the current user's skills (at least 1 overlap)
  const matchingReferrers = useMemo(() => {
    if (!currentProfile) return [];
    return filteredReferrers.filter(r => skillsMatch(currentProfile.skills, r.hired_skills) > 0);
  }, [filteredReferrers, currentProfile]);

  // Group matching referrers by company for the insight banner
  const matchByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of matchingReferrers) {
      const company = r.hired_company ?? 'Undisclosed';
      map[company] = (map[company] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [matchingReferrers]);

  const activeFilters = [cityFilter, visaFilter, roleSearch].filter(Boolean).length;

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.1rem',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer' as const,
    border: 'none',
    borderBottom: active ? '2px solid var(--vermilion)' : '2px solid transparent',
    background: 'none',
    color: active ? 'var(--vermilion)' : 'var(--text-muted)',
    fontFamily: 'inherit',
    transition: 'color 0.15s',
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: 'var(--ink)', marginBottom: '0.5rem' }}>
          The AU IT Job Seeker Network
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 540, marginBottom: '1.25rem' }}>
          Connect with international IT graduates in your city who are in the same situation.
          All profiles are anonymous — no names, no emails.
        </p>

        {!hasProfile && (
          <Link
            href="/dashboard/profile"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.4rem',
              background: 'var(--vermilion)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--panel-shadow)',
              textDecoration: 'none',
            }}
          >
            Join the network →
          </Link>
        )}
        {hasProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.25em 0.75em', borderRadius: '4px', background: 'rgba(30,122,82,0.1)', color: 'var(--jade)', border: '1.5px solid rgba(30,122,82,0.3)' }}>
              ✓ Your profile is active
            </span>
            <Link href="/dashboard/profile" style={{ fontSize: '0.85rem', color: 'var(--vermilion)', textDecoration: 'underline' }}>
              Edit
            </Link>
            <Link
              href="/network/messages"
              style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Inbox
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1em 0.5em', borderRadius: '10px', background: 'var(--vermilion)', color: 'white' }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--parchment)', marginBottom: '1.25rem' }}>
        <button
          style={tabStyle(tab === 'seekers')}
          onClick={() => setTab('seekers')}
          aria-selected={tab === 'seekers'}
          role="tab"
        >
          Active Seekers
          <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', opacity: 0.7 }}>
            ({initialProfiles.length})
          </span>
        </button>
        <button
          style={tabStyle(tab === 'referrers')}
          onClick={() => setTab('referrers')}
          aria-selected={tab === 'referrers'}
          role="tab"
        >
          Referral Board
          <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', opacity: 0.7 }}>
            ({initialReferrers.length})
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="search-panel" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          {tab === 'seekers' && (
            <input
              type="text"
              className="search-input"
              placeholder="Search role…"
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
              style={{ flex: '1', minWidth: 160 }}
              aria-label="Search by role"
            />
          )}
          <select
            className="search-select search-select-lg"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            aria-label="Filter by city"
          >
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="search-select search-select-lg"
            value={visaFilter}
            onChange={e => setVisaFilter(e.target.value)}
            aria-label="Filter by visa"
          >
            <option value="">All visas</option>
            {VISAS.map(v => <option key={v} value={v}>{VISA_LABELS[v]}</option>)}
          </select>
          {activeFilters > 0 && (
            <button
              onClick={() => { setCityFilter(''); setVisaFilter(''); setRoleSearch(''); }}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                background: 'none',
                border: '1.5px solid var(--parchment)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              Clear ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* ── Seekers tab ─────────────────────────────────────────── */}
      {tab === 'seekers' && (
        <>
          <div style={{ marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {filteredSeekers.length === 0
              ? 'No active seekers match your filters'
              : `Showing ${filteredSeekers.length} active seeker${filteredSeekers.length !== 1 ? 's' : ''}${cityFilter ? ` in ${cityFilter}` : ''}`
            }
          </div>

          {filteredSeekers.length > 0 ? (
            <div className="network-seeker-grid">
              {filteredSeekers.map(p => (
                <SeekerCard
                  key={p.id}
                  profile={p}
                  canMessage={hasProfile && p.id !== currentProfileId}
                  onMessage={openCompose}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                border: '2px dashed var(--parchment)',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>No seekers found</div>
              <div style={{ fontSize: '0.88rem' }}>Try adjusting your filters, or be the first to join!</div>
              {!isLoggedIn && (
                <Link
                  href="/login"
                  style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--vermilion)', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Sign in to join →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Referral Board tab ──────────────────────────────────── */}
      {tab === 'referrers' && (
        <>
          {/* Matching insight banner */}
          {currentProfile && matchByCompany.length > 0 && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.9rem 1.1rem',
                background: 'rgba(200,138,20,0.07)',
                border: '1.5px solid rgba(200,138,20,0.3)',
                borderRadius: '10px',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--gold)' }}>
                {matchingReferrers.length} referrer{matchingReferrers.length !== 1 ? 's' : ''} match your background
              </strong>
              {matchByCompany.slice(0, 3).map(([company, count]) => (
                <span key={company} style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  · {count} {count === 1 ? 'person' : 'people'} at {company} {count === 1 ? 'shares' : 'share'} your skills
                </span>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {filteredReferrers.length === 0
              ? 'No referrers yet — be the first to post when you get hired!'
              : `${filteredReferrers.length} referrer${filteredReferrers.length !== 1 ? 's' : ''} available${cityFilter ? ` in ${cityFilter}` : ''}`
            }
          </div>

          {filteredReferrers.length > 0 ? (
            <div className="network-seeker-grid">
              {filteredReferrers.map(r => (
                <ReferrerCard
                  key={r.id}
                  referrer={r}
                  matchCount={currentProfile ? skillsMatch(currentProfile.skills, r.hired_skills) : 0}
                  canMessage={hasProfile && r.id !== currentProfileId}
                  onMessage={openCompose}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                border: '2px dashed var(--parchment)',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>No referrers yet</div>
              <div style={{ fontSize: '0.88rem' }}>
                Got hired? Help others by posting a referral card from your{' '}
                <Link href="/dashboard/profile" style={{ color: 'var(--vermilion)', fontWeight: 700 }}>
                  profile settings
                </Link>
                .
              </div>
            </div>
          )}

          {/* CTA for non-logged-in users */}
          {!isLoggedIn && filteredReferrers.length > 0 && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'var(--warm-white)',
                border: 'var(--panel-border)',
                borderRadius: '12px',
                boxShadow: 'var(--panel-shadow)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>
                Want to connect with referrers?
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Create a free account to see which referrers match your skills.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '0.65rem 1.4rem',
                  background: 'var(--vermilion)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--panel-shadow)',
                  textDecoration: 'none',
                }}
              >
                Get started for free →
              </Link>
            </div>
          )}
        </>
      )}

      {/* CTA footer for seekers tab */}
      {tab === 'seekers' && !isLoggedIn && filteredSeekers.length > 0 && (
        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.5rem',
            background: 'var(--warm-white)',
            border: 'var(--panel-border)',
            borderRadius: '12px',
            boxShadow: 'var(--panel-shadow)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>
            Want to appear here?
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Create a free account and opt-in to the network. Your real name is never shown.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.4rem',
              background: 'var(--vermilion)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--panel-shadow)',
              textDecoration: 'none',
            }}
          >
            Get started for free →
          </Link>
        </div>
      )}

      {/* ── Compose modal ──────────────────────────────────────────── */}
      {composeTarget && (
        <div
          className="network-compose-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Send a message"
          onClick={e => { if (e.target === e.currentTarget) closeCompose(); }}
        >
          <div className="network-compose-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                  Send a message
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  To: {composeTarget.label}
                </div>
              </div>
              <button
                className="network-compose-close"
                onClick={closeCompose}
                aria-label="Close compose"
              >
                ✕
              </button>
            </div>

            {sendSuccess ? (
              <div style={{ padding: '1rem', background: 'rgba(30,122,82,0.08)', border: '1.5px solid rgba(30,122,82,0.3)', borderRadius: '8px', color: 'var(--jade)', fontWeight: 600, textAlign: 'center' }}>
                Message sent!
              </div>
            ) : (
              <>
                <textarea
                  className="network-compose-textarea"
                  value={draftContent}
                  onChange={e => setDraftContent(e.target.value.slice(0, 500))}
                  placeholder="Introduce yourself and explain why you're reaching out…"
                  rows={5}
                  aria-label="Message content"
                  disabled={sending}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: draftContent.length > 450 ? 'var(--vermilion)' : 'var(--text-muted)' }}>
                    {draftContent.length}/500
                  </span>
                  {sendError && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--vermilion)', flex: 1 }}>{sendError}</span>
                  )}
                  <button
                    className="network-compose-send"
                    onClick={handleSend}
                    disabled={sending || !draftContent.trim()}
                    aria-busy={sending}
                  >
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
                <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                  Your message is anonymous — the recipient sees only your role and city, not your name or email. Max 5 messages per day.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
