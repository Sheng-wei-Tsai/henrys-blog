'use client';
import { useState } from 'react';
import { COMPANIES } from '../au-insights/companies/data';

const DIFFICULTY: Record<string, number> = {
  'atlassian': 4, 'canva': 3, 'google-au': 5, 'amazon-aws': 4,
  'optiver': 5, 'safetyCulture': 2, 'accenture': 2, 'ibm-au': 2,
  'tcs': 1, 'cba': 2, 'deloitte-digital': 2,
};

function wfhScore(wfh: string): number {
  const lower = wfh.toLowerCase();
  if (lower.includes('remote')) return 10;
  if (lower.includes('hybrid')) return 6;
  if (lower.includes('on-site') || lower.includes('office')) return 2;
  return 5;
}

function parseSalaryMid(range: string): number {
  // Extract first number from range like "$95k – $115k"
  const match = range.match(/\$(\d+)/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

interface RadarPoint { x: number; y: number }

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): RadarPoint {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const AXIS_LABELS = ['Compensation', 'Culture', 'WFH', 'Career', 'Interview Ease', 'Visa'];
const COLORS = ['var(--terracotta)', 'var(--gold)', 'var(--jade)'];
const FILL_COLORS = ['rgba(192,40,28,0.25)', 'rgba(200,138,20,0.25)', 'rgba(30,122,82,0.25)'];

function getRadarValues(slug: string): number[] {
  const c = COMPANIES.find(x => x.slug === slug);
  if (!c) return [0, 0, 0, 0, 0, 0];

  const gradMid = parseSalaryMid(c.compensation.gradRange);
  const comp = Math.min(10, (gradMid / 15));
  const culture = Math.min(10, c.glassdoor.rating * 2);
  const wfh = wfhScore(c.wfh);
  const career = c.glassdoor.careerOpportunities != null
    ? Math.min(10, c.glassdoor.careerOpportunities * 2)
    : 6;
  const diff = DIFFICULTY[slug] ?? 3;
  const ease = Math.max(0, 10 - diff * 2);
  const visa = c.sponsorship.accreditedSponsor ? 10 : c.sponsorship.sponsors482 ? 7 : 0;

  return [comp, culture, wfh, career, ease, visa];
}

function RadarChart({ slugs }: { slugs: string[] }) {
  const cx = 100, cy = 100, r = 72;
  const n = AXIS_LABELS.length;
  const angleStep = 360 / n;

  // Grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisPoints = AXIS_LABELS.map((_, i) => polarToCartesian(cx, cy, r, i * angleStep));
  const labelPoints = AXIS_LABELS.map((_, i) => polarToCartesian(cx, cy, r + 16, i * angleStep));

  function valueToPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const ratio = v / 10;
        const pt = polarToCartesian(cx, cy, r * ratio, i * angleStep);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  }

  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: '280px', display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {gridLevels.map(level => {
        const pts = AXIS_LABELS.map((_, i) => {
          const pt = polarToCartesian(cx, cy, r * level, i * angleStep);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="var(--parchment)"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Axis lines */}
      {axisPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--parchment)" strokeWidth="0.8" />
      ))}

      {/* Data polygons */}
      {slugs.map((slug, si) => {
        const vals = getRadarValues(slug);
        return (
          <polygon
            key={slug}
            points={valueToPoints(vals)}
            fill={FILL_COLORS[si]}
            stroke={COLORS[si]}
            strokeWidth="1.5"
          />
        );
      })}

      {/* Axis labels */}
      {AXIS_LABELS.map((label, i) => {
        const pt = labelPoints[i];
        const anchor = pt.x < cx - 5 ? 'end' : pt.x > cx + 5 ? 'start' : 'middle';
        return (
          <text
            key={label}
            x={pt.x}
            y={pt.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="6.5"
            fill="var(--text-secondary)"
            fontFamily="inherit"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default function CompanyCompare() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleCompany(slug: string) {
    setSelected(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  }

  const selectedData = selected.map(slug => COMPANIES.find(c => c.slug === slug)).filter(Boolean) as typeof COMPANIES;

  function bestFor(c: typeof COMPANIES[0]): string {
    if (c.tier === 'S') return `${c.name} is best for top-tier compensation and resume prestige.`;
    if (c.tier === 'A') return `${c.name} is best for strong culture and work-life balance.`;
    if (c.tier === 'B') return `${c.name} is best for career development and structured learning.`;
    return `${c.name} is best for entry-level experience and building foundational skills.`;
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Instruction */}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
        Select 2–3 companies to compare side-by-side.
      </p>

      {/* Company chip grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {COMPANIES.map(c => {
          const active = selected.includes(c.slug);
          const disabled = !active && selected.length >= 3;
          return (
            <button
              key={c.slug}
              onClick={() => !disabled && toggleCompany(c.slug)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '99px',
                border: active ? 'none' : '1px solid var(--parchment)',
                background: active ? 'var(--terracotta)' : disabled ? 'var(--warm-white)' : 'var(--parchment)',
                color: active ? 'white' : disabled ? 'var(--text-muted)' : 'var(--brown-dark)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.12s ease',
              }}
            >
              <span>{c.name}</span>
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                borderRadius: '99px',
                padding: '0.05rem 0.4rem',
                fontSize: '0.7rem',
              }}>
                {c.tier}
              </span>
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      {selectedData.length >= 2 && (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--parchment)' }}>
                  <th style={{ padding: '0.7rem 0.9rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '130px' }}>
                    Metric
                  </th>
                  {selectedData.map((c, ci) => (
                    <th key={c.slug} style={{ padding: '0.7rem 0.9rem', textAlign: 'center', minWidth: '140px' }}>
                      <div style={{ fontWeight: 700, color: COLORS[ci], fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.1rem' }}>{c.tierLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Glassdoor Rating */}
                <TableRow
                  label="Glassdoor Rating"
                  values={selectedData.map(c => `${c.glassdoor.rating} / 5 (${c.glassdoor.reviews.toLocaleString()} reviews)`)}
                />
                {/* Recommend % */}
                <TableRow
                  label="Recommend %"
                  values={selectedData.map(c => c.glassdoor.recommendPct != null ? `${c.glassdoor.recommendPct}%` : 'N/A')}
                  alt
                />
                {/* WFH Policy */}
                <TableRow
                  label="WFH Policy"
                  values={selectedData.map(c => {
                    const lower = c.wfh.toLowerCase();
                    if (lower.includes('remote') && !lower.includes('hybrid')) return 'Remote-first';
                    if (lower.includes('hybrid')) return 'Hybrid';
                    if (lower.includes('on-site') || lower.includes('office')) return 'On-site';
                    return 'Flexible';
                  })}
                />
                {/* Grad Salary */}
                <TableRow
                  label="Grad Salary"
                  values={selectedData.map(c => c.compensation.gradRange)}
                  alt
                />
                {/* Senior Salary */}
                <TableRow
                  label="Senior Salary"
                  values={selectedData.map(c => c.compensation.seniorRange)}
                />
                {/* Visa Sponsorship */}
                <TableRow
                  label="Visa Sponsorship"
                  values={selectedData.map(c =>
                    c.sponsorship.accreditedSponsor
                      ? 'Accredited Sponsor'
                      : c.sponsorship.sponsors482
                      ? '482 Sponsor'
                      : 'None'
                  )}
                  alt
                />
                {/* Interview Difficulty */}
                <tr style={{ borderTop: '1px solid var(--parchment)' }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interview Difficulty</td>
                  {selectedData.map((c, ci) => {
                    const diff = DIFFICULTY[c.slug] ?? 3;
                    return (
                      <td key={c.slug} style={{ padding: '0.6rem 0.9rem', textAlign: 'center', background: ci % 2 === 0 ? 'transparent' : 'var(--warm-white)' }}>
                        <span style={{ color: COLORS[ci], letterSpacing: '0.1em', fontSize: '1rem' }}>
                          {'●'.repeat(diff)}{'○'.repeat(5 - diff)}
                        </span>
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{diff}/5</span>
                      </td>
                    );
                  })}
                </tr>
                {/* Tech Stack */}
                <tr style={{ borderTop: '1px solid var(--parchment)' }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--warm-white)' }}>Tech Stack</td>
                  {selectedData.map((c, ci) => (
                    <td key={c.slug} style={{ padding: '0.6rem 0.9rem', background: ci % 2 === 0 ? 'var(--warm-white)' : 'white' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center' }}>
                        {c.techStack.slice(0, 5).map(tech => (
                          <span key={tech} style={{
                            background: 'var(--parchment)',
                            borderRadius: '4px',
                            padding: '0.1rem 0.45rem',
                            fontSize: '0.75rem',
                            color: 'var(--brown-dark)',
                          }}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Radar chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.6rem', textAlign: 'center' }}>
              Radar Comparison
            </h3>
            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
              {selectedData.map((c, ci) => (
                <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: COLORS[ci], opacity: 0.8 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                </div>
              ))}
            </div>
            <RadarChart slugs={selected} />
          </div>

          {/* Best for */}
          <div>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.7rem' }}>
              Best for
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {selectedData.map((c, ci) => (
                <div key={c.slug} style={{
                  padding: '0.7rem 1rem',
                  background: 'var(--warm-white)',
                  border: '1px solid var(--parchment)',
                  borderLeft: `3px solid ${COLORS[ci]}`,
                  borderRadius: '6px',
                  fontSize: '0.87rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  {bestFor(c)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedData.length < 2 && (
        <div style={{
          background: 'var(--warm-white)',
          border: '1px dashed var(--parchment)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}>
          {selected.length === 0
            ? 'Select 2–3 companies above to compare them side-by-side'
            : 'Select one more company to start the comparison'}
        </div>
      )}
    </div>
  );
}

function TableRow({ label, values, alt }: { label: string; values: string[]; alt?: boolean }) {
  return (
    <tr style={{ borderTop: '1px solid var(--parchment)', background: alt ? 'var(--warm-white)' : 'transparent' }}>
      <td style={{ padding: '0.6rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} style={{ padding: '0.6rem 0.9rem', textAlign: 'center', color: 'var(--brown-dark)' }}>{v}</td>
      ))}
    </tr>
  );
}
