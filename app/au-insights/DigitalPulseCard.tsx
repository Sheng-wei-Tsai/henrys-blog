'use client';
import {
  DIGITAL_PULSE_META,
  DIGITAL_PULSE_STATS,
  DIGITAL_PULSE_TOP_SKILLS,
  DIGITAL_PULSE_INSIGHTS,
} from './data/digital-pulse';

export default function DigitalPulseCard() {
  return (
    <div style={{ marginBottom: '2.5rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
              borderRadius: '99px', background: '#eff6ff', color: '#0369a1',
              border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              ACS Digital Pulse {DIGITAL_PULSE_META._year}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Australia's definitive tech workforce report
            </span>
          </div>
          <h3 style={{
            fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
            color: 'var(--brown-dark)', margin: 0,
          }}>
            Australian Tech Workforce — Key Findings
          </h3>
        </div>
        <a
          href={DIGITAL_PULSE_META._url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.75rem', fontWeight: 600, color: '#0369a1',
            textDecoration: 'none', whiteSpace: 'nowrap',
            padding: '0.3rem 0.75rem', borderRadius: '6px',
            border: '1px solid #bfdbfe', background: '#eff6ff',
          }}
        >
          Full report →
        </a>
      </div>

      {/* Stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.6rem',
        marginBottom: '1.25rem',
      }}>
        {DIGITAL_PULSE_STATS.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '10px', padding: '0.85rem 0.9rem',
            borderLeft: `3px solid ${stat.color}`,
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>
              {stat.value}
              {stat.trend === 'up' && (
                <span style={{ fontSize: '0.65rem', marginLeft: '0.25rem', color: '#10b981' }}>▲</span>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--brown-dark)', marginTop: '0.2rem' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.4 }}>
              {stat.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Top skills demand */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{
          fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem', marginTop: 0,
        }}>
          Fastest-Growing Skill Demand (YoY job ad growth %)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {DIGITAL_PULSE_TOP_SKILLS.map(s => (
            <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ minWidth: 140, fontSize: '0.75rem', color: 'var(--brown-dark)', fontWeight: 500 }}>
                {s.skill}
              </div>
              <div style={{ flex: 1, background: 'var(--parchment)', borderRadius: '99px', height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${(s.growth / 40) * 100}%`,
                  height: '100%', borderRadius: '99px',
                  background: s.category === 'Data & AI' ? '#7c3aed'
                    : s.category === 'Infrastructure' ? '#0369a1'
                    : s.category === 'Security' ? '#dc2626'
                    : '#374151',
                }} />
              </div>
              <div style={{ minWidth: 36, fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textAlign: 'right' }}>
                +{s.growth}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insights */}
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd',
        borderRadius: '10px', padding: '0.85rem 1rem',
        marginBottom: '0.75rem',
      }}>
        <p style={{
          fontSize: '0.68rem', fontWeight: 700, color: '#0369a1',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginTop: 0,
        }}>
          Key Insights
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {DIGITAL_PULSE_INSIGHTS.map((ins, i) => (
            <li key={i} style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.6 }}>{ins}</li>
          ))}
        </ul>
      </div>

      {/* Citation */}
      <p style={{
        fontSize: '0.71rem', color: 'var(--text-muted)', margin: 0,
        lineHeight: 1.55, borderTop: '1px solid var(--parchment)', paddingTop: '0.5rem',
      }}>
        Source:{' '}
        <a href={DIGITAL_PULSE_META._url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
          ACS Digital Pulse {DIGITAL_PULSE_META._year}
        </a>
        {' '}— Australian Computer Society annual workforce report. Data accessed {DIGITAL_PULSE_META._accessed}.
        Updated annually in Q4.
      </p>
    </div>
  );
}
