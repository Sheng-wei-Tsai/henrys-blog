'use client';
import { useState } from 'react';
import { SKILL_CATEGORIES, ROLE_REQUIREMENTS, ROLE_COMPANY_MAP } from './data/skill-requirements';

function scoreRole(selectedSkills: Set<string>, role: (typeof ROLE_REQUIREMENTS)[0]) {
  const requiredGroups = role.required;
  let matchedRequired = 0;
  let anyGroupZero = false;

  for (const group of requiredGroups) {
    const options = group.split('|');
    const hit = options.some(opt => selectedSkills.has(opt));
    if (hit) matchedRequired++;
    else anyGroupZero = true;
  }

  const requiredScore = requiredGroups.length > 0 ? matchedRequired / requiredGroups.length : 0;

  const bonusSkills = role.bonus;
  let matchedBonus = 0;
  for (const b of bonusSkills) {
    if (selectedSkills.has(b)) matchedBonus++;
  }
  const bonusScore = bonusSkills.length > 0 ? matchedBonus / bonusSkills.length : 0;

  let final = Math.round((requiredScore * 0.7 + bonusScore * 0.3) * 100);
  if (anyGroupZero) final = Math.min(final, 30);

  return final;
}

function getUnlockSkills(selectedSkills: Set<string>, roles: typeof ROLE_REQUIREMENTS, scores: number[]): string[] {
  // Find the highest scoring unmatched (score < 10) role
  let bestUnmatched: (typeof ROLE_REQUIREMENTS)[0] | null = null;
  let bestScore = -1;
  for (let i = 0; i < roles.length; i++) {
    if (scores[i] < 10 && scores[i] > bestScore) {
      bestScore = scores[i];
      bestUnmatched = roles[i];
    }
  }
  if (!bestUnmatched) return [];

  const missing: string[] = [];
  for (const group of bestUnmatched.required) {
    const options = group.split('|');
    const hit = options.some(opt => selectedSkills.has(opt));
    if (!hit) missing.push(options[0]);
  }
  for (const b of bestUnmatched.bonus) {
    if (!selectedSkills.has(b) && missing.length < 3) missing.push(b);
  }
  return missing.slice(0, 3);
}

export default function SkillMap() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSkill(skill: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  const scores = ROLE_REQUIREMENTS.map(r => scoreRole(selected, r));
  const sorted = ROLE_REQUIREMENTS
    .map((r, i) => ({ ...r, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const topRole = sorted[0];
  const companySlugs = topRole ? (ROLE_COMPANY_MAP[topRole.role] ?? []) : [];
  const unlockSkills = selected.size > 0 ? getUnlockSkills(selected, ROLE_REQUIREMENTS, scores) : [];

  const pillBase: React.CSSProperties = {
    padding: '0.35rem 0.85rem',
    borderRadius: '99px',
    border: '1px solid var(--parchment)',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    transition: 'all 0.12s ease',
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Skill toggle grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--brown-dark)', margin: 0 }}>
            Your Skills
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--warm-white)', padding: '0.2rem 0.6rem', borderRadius: '99px', border: '1px solid var(--parchment)' }}>
            {selected.size} selected
          </span>
        </div>

        {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {skills.map(skill => {
                const active = selected.has(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      ...pillBase,
                      background: active ? 'var(--terracotta)' : 'var(--parchment)',
                      color: active ? 'white' : 'var(--brown-dark)',
                      borderColor: active ? 'var(--terracotta)' : 'var(--parchment)',
                      boxShadow: active ? '1px 1px 0 rgba(192,40,28,0.3)' : 'none',
                    }}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {selected.size > 0 && (
        <>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.9rem' }}>
            Your Matches
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' }}>
            {sorted.map(role => {
              const dimmed = role.score < 10;
              return (
                <div
                  key={role.role}
                  style={{
                    background: dimmed ? 'var(--warm-white)' : 'var(--parchment)',
                    border: '1px solid var(--parchment)',
                    borderRadius: '8px',
                    padding: '0.8rem 1rem',
                    opacity: dimmed ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brown-dark)', fontSize: '0.95rem' }}>{role.role}</span>
                      {role.shortage && (
                        <span style={{ background: 'var(--terracotta)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                          Shortage
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{role.salaryRange}</span>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: role.score >= 70 ? 'var(--jade)' : role.score >= 40 ? 'var(--gold)' : 'var(--text-muted)',
                      }}>
                        {role.score}%
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.06)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${role.score}%`,
                      height: '100%',
                      background: role.score >= 70
                        ? 'var(--jade)'
                        : role.score >= 40
                        ? 'var(--gold)'
                        : 'var(--terracotta)',
                      borderRadius: '99px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlock skills */}
          {unlockSkills.length > 0 && (
            <div style={{
              background: 'rgba(30,122,82,0.06)',
              border: '1px solid rgba(30,122,82,0.2)',
              borderRadius: '8px',
              padding: '0.9rem 1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--jade)', marginBottom: '0.5rem' }}>
                🔓 Skills to unlock more roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {unlockSkills.map(s => (
                  <span key={s} style={{
                    background: 'rgba(30,122,82,0.1)',
                    color: 'var(--jade)',
                    border: '1px solid rgba(30,122,82,0.25)',
                    borderRadius: '99px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best companies */}
          {companySlugs.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.55rem' }}>
                Best companies for {topRole?.role}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {companySlugs.map(slug => (
                  <a
                    key={slug}
                    href={`/au-insights/companies/${slug}`}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '99px',
                      background: 'var(--warm-white)',
                      border: '1px solid var(--parchment)',
                      color: 'var(--terracotta)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {slug}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selected.size === 0 && (
        <div style={{
          background: 'var(--warm-white)',
          border: '1px dashed var(--parchment)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}>
          Select your skills above to see which AU IT roles you match
        </div>
      )}
    </div>
  );
}
