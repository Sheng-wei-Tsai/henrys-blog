'use client';
import { useState, useMemo } from 'react';
import { SALARIES_BY_ROLE, JSA_ICT_OCCUPATIONS } from '../data/job-market';

const EXPERIENCE_BANDS = [
  { id: 'junior', label: '0–2 yrs (Graduate)', key: 'junior' as const },
  { id: 'mid',    label: '2–5 yrs (Mid-level)', key: 'mid' as const },
  { id: 'senior', label: '5+ yrs (Senior)',     key: 'senior' as const },
];

const COMPANY_TIER_MULTIPLIERS: Record<string, number> = {
  'faang':       1.20,
  'product':     1.05,
  'bank':        0.95,
  'consulting':  0.85,
  'it-services': 0.72,
};

const COMPANY_TIER_LABELS: Record<string, string> = {
  'faang':       'FAANG / Top Product (Google, Atlassian, Canva)',
  'product':     'Product Company (SafetyCulture, WiseTech etc.)',
  'bank':        'Big Bank (CBA, ANZ, NAB, Westpac)',
  'consulting':  'Big Consulting (Accenture, Deloitte, IBM)',
  'it-services': 'IT Services (TCS, Infosys, Wipro)',
};

// Map JSA roles to salary roles by keyword
const JSA_SHORTAGE_ROLES = new Set(
  JSA_ICT_OCCUPATIONS
    .filter(o => o.status2024 === 'Shortage' || o.status2024 === 'Regional')
    .map(o => o.role.toLowerCase())
);

function isInShortage(role: string): boolean {
  const lower = role.toLowerCase();
  return JSA_SHORTAGE_ROLES.has(lower) ||
    Array.from(JSA_SHORTAGE_ROLES).some(r => lower.includes(r.split(' ')[0].toLowerCase()));
}

const NEGOTIATION_SCRIPTS: Record<'above' | 'fair' | 'below' | 'low', string> = {
  above: `Thank you so much for the offer — I'm really excited about this opportunity. The compensation looks strong and I'm happy to accept.`,
  fair:  `Thank you for the offer. I'm very interested in the role. Based on market data I've reviewed, I was hoping we could get to [counter-offer]. Is there any flexibility on the base salary?`,
  below: `Thank you for the offer — I'm genuinely excited about this opportunity. Based on ACS salary data for [role] at [experience] level, the market median sits around [median]. Could we revisit the base to get closer to [counter]? I'm confident I can deliver strong results from day one.`,
  low:   `I appreciate the offer and I'm very interested in the role. However, the base salary is below the market range for this role in Australia. ACS data shows [role] at [experience] level typically ranges from [min]k to [max]k. Would the team be able to come up to [counter]? Without that, I'd need to continue my search.`,
};

export default function SalaryChecker() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<'junior' | 'mid' | 'senior'>('junior');
  const [companyTier, setCompanyTier] = useState('');
  const [offerStr, setOfferStr] = useState('');
  const [copied, setCopied] = useState(false);

  const offer = parseInt(offerStr.replace(/[^0-9]/g, ''), 10) || 0;
  const roleData = SALARIES_BY_ROLE.find(r => r.role === role);

  const result = useMemo(() => {
    if (!roleData || offer <= 0) return null;

    const baseMedian = {
      junior: (roleData.junior + roleData.mid) / 2,
      mid:    roleData.mid,
      senior: (roleData.mid + roleData.senior) / 2,
    }[experience];

    const multiplier = companyTier ? COMPANY_TIER_MULTIPLIERS[companyTier] : 1.0;
    const adjustedMedian = Math.round(baseMedian * multiplier);

    const bandMin = roleData[experience === 'junior' ? 'junior' : experience === 'mid' ? 'junior' : 'mid'];
    const bandMax = roleData[experience === 'junior' ? 'mid' : experience === 'mid' ? 'senior' : 'senior'];
    const adjustedMin = Math.round(bandMin * multiplier);
    const adjustedMax = Math.round(bandMax * multiplier);

    const pct = (offer / adjustedMedian) * 100;
    const percentile = Math.round(Math.max(0, Math.min(100,
      ((offer - adjustedMin) / (adjustedMax - adjustedMin)) * 100
    )));

    const counterTarget = Math.round(adjustedMedian * 1.05 / 1000) * 1000;
    const counterLow  = counterTarget - 2000;
    const counterHigh = counterTarget + 2000;

    type Verdict = 'above' | 'fair' | 'below' | 'low';
    const verdict: Verdict =
      pct >= 108 ? 'above' :
      pct >= 93  ? 'fair'  :
      pct >= 80  ? 'below' : 'low';

    const verdictLabel = {
      above: '🟢 Above Market',
      fair:  '🟢 Fair Offer',
      below: '🟡 Below Market',
      low:   '🔴 Significantly Below Market',
    }[verdict];

    const verdictColor = {
      above: 'var(--jade)', fair: 'var(--jade)', below: 'var(--gold)', low: 'var(--terracotta)',
    }[verdict];
    const verdictBg = {
      above: 'rgba(30,122,82,0.07)', fair: 'rgba(30,122,82,0.07)', below: 'rgba(200,138,20,0.07)', low: 'rgba(192,40,28,0.06)',
    }[verdict];
    const verdictBorder = {
      above: 'rgba(30,122,82,0.3)', fair: 'rgba(30,122,82,0.3)', below: 'rgba(200,138,20,0.3)', low: 'rgba(192,40,28,0.25)',
    }[verdict];

    const script = NEGOTIATION_SCRIPTS[verdict]
      .replace('[role]', role)
      .replace('[experience]', EXPERIENCE_BANDS.find(e => e.key === experience)?.label ?? experience)
      .replace('[median]', `$${adjustedMedian.toLocaleString()}`)
      .replace('[counter]', `$${counterTarget.toLocaleString()}`)
      .replace('[counter-offer]', `$${counterTarget.toLocaleString()}`)
      .replace('[min]', String(adjustedMin))
      .replace('[max]', String(adjustedMax));

    const shortage = isInShortage(role);

    return {
      offer, adjustedMedian, adjustedMin, adjustedMax,
      pct, percentile, verdict, verdictLabel, verdictColor, verdictBg, verdictBorder,
      counterLow, counterHigh, counterTarget, script, shortage,
    };
  }, [roleData, offer, experience, companyTier, role]);

  function copyScript() {
    if (!result) return;
    navigator.clipboard.writeText(result.script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px',
    border: '1px solid var(--parchment)', background: 'var(--warm-white)',
    fontSize: '0.88rem', color: 'var(--brown-dark)', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>

      {/* Step 1 — Role & Experience */}
      <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.2rem' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.9rem', marginTop: 0 }}>
          Step 1 — Your Role
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brown-dark)', display: 'block', marginBottom: '0.35rem' }}>
              Role offered
            </label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
              <option value="">Select a role…</option>
              {SALARIES_BY_ROLE.map(r => (
                <option key={r.role} value={r.role}>{r.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brown-dark)', display: 'block', marginBottom: '0.35rem' }}>
              Your experience level
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {EXPERIENCE_BANDS.map(band => (
                <button
                  key={band.id}
                  onClick={() => setExperience(band.key)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: experience === band.key ? 'var(--terracotta)' : 'var(--parchment)',
                    color: experience === band.key ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {band.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 — Offer */}
      <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '12px', padding: '1.2rem' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.9rem', marginTop: 0 }}>
          Step 2 — The Offer
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brown-dark)', display: 'block', marginBottom: '0.35rem' }}>
              Offered base salary (AUD/year)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 72000"
              value={offerStr}
              onChange={e => setOfferStr(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brown-dark)', display: 'block', marginBottom: '0.35rem' }}>
              Company type <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — improves accuracy)</span>
            </label>
            <select value={companyTier} onChange={e => setCompanyTier(e.target.value)} style={inputStyle}>
              <option value="">Any / Unknown</option>
              {Object.entries(COMPANY_TIER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div style={{
          border: `2px solid ${result.verdictBorder}`,
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Verdict header */}
          <div style={{ background: result.verdictBg, padding: '1rem 1.2rem', borderBottom: `1px solid ${result.verdictBorder}` }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: result.verdictColor, marginBottom: '0.15rem' }}>
              {result.verdictLabel}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {role} · {EXPERIENCE_BANDS.find(e => e.key === experience)?.label}
              {companyTier ? ` · ${COMPANY_TIER_LABELS[companyTier].split(' (')[0]}` : ''}
            </div>
          </div>

          <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Numbers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Your offer', value: `$${result.offer.toLocaleString()}`, bold: true, color: result.verdictColor },
                { label: 'Market median', value: `$${result.adjustedMedian.toLocaleString()}`, bold: false, color: 'var(--brown-dark)' },
                { label: 'Typical range', value: `$${result.adjustedMin.toLocaleString()} – $${result.adjustedMax.toLocaleString()}`, bold: false, color: 'var(--text-muted)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: row.bold ? 700 : 500, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Percentile</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: result.verdictColor }}>{result.percentile}th</span>
              </div>
              <div style={{ height: 10, background: 'var(--parchment)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.max(2, result.percentile)}%`,
                  height: '100%', borderRadius: 99,
                  background: result.verdictColor, transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Entry</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Top</span>
              </div>
            </div>

            {/* Counter suggestion (if below) */}
            {(result.verdict === 'below' || result.verdict === 'low') && (
              <div style={{ background: 'rgba(200,138,20,0.07)', border: '1px solid rgba(200,138,20,0.25)', borderRadius: '8px', padding: '0.8rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brown-mid)', marginBottom: '0.2rem' }}>
                  Suggested counter-offer
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
                  ${result.counterLow.toLocaleString()} – ${result.counterHigh.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--brown-mid)', marginTop: '0.1rem' }}>
                  Target ${result.counterTarget.toLocaleString()} — 5% above market median
                </div>
              </div>
            )}

            {/* Shortage alert */}
            {result.shortage && (
              <div style={{ background: 'rgba(192,40,28,0.06)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--terracotta)', lineHeight: 1.55 }}>
                <strong>💪 Strong negotiating position:</strong> {role} is listed as a national shortage
                occupation by Jobs & Skills Australia (2024). Skilled candidates have leverage — don't be afraid to push back.
              </div>
            )}

            {/* Script */}
            <div style={{ border: '1px solid var(--parchment)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.8rem', background: 'var(--parchment)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Negotiation script
                </span>
                <button
                  onClick={copyScript}
                  style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                    borderRadius: '4px', border: 'none', cursor: 'pointer',
                    background: copied ? 'var(--jade)' : 'var(--terracotta)',
                    color: 'white', fontFamily: 'inherit', transition: 'background 0.2s',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '0.8rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
                "{result.script}"
              </div>
            </div>

            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              Data: ACS / Think & Grow Australian Tech Salary Guide 2025.
              Ranges adjusted by company type based on sector premium data. All figures AUD base salary (super not included).
            </p>
          </div>
        </div>
      )}

      {!result && role && offer <= 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Enter your offered salary above to see the verdict.
        </div>
      )}
    </div>
  );
}
