'use client';
import { useState, useEffect, useCallback } from 'react';

type Severity = 'critical' | 'warning' | 'info' | 'pass';

interface Rule {
  id: string;
  severity: Severity;
  label: string;
  fix: string;
  check: (t: string) => boolean | string[];
}

const RULES: Rule[] = [
  {
    id: 'photo',
    severity: 'critical',
    label: 'Photo detected',
    fix: 'Remove any photo. AU anti-discrimination law means photos are not expected and can hurt you.',
    check: (t) => /\bphoto\b|\bheadshot\b|\bprofile picture\b/i.test(t),
  },
  {
    id: 'dob',
    severity: 'critical',
    label: 'Date of birth detected',
    fix: "Never include DOB on an AU resume. It's not required and cannot legally be used in hiring decisions.",
    check: (t) => /\b(dob|date of birth|born\s*:|\bage\s*:)/i.test(t),
  },
  {
    id: 'address',
    severity: 'warning',
    label: 'Full street address detected',
    fix: 'Use city/suburb only (e.g. "Sydney, NSW"). Full address is unnecessary and a privacy risk.',
    check: (t) => /\b\d{1,4}\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/.test(t),
  },
  {
    id: 'length',
    severity: 'critical',
    label: 'Resume may be too long',
    fix: 'AU standard is 2 pages max for graduates. Trim ruthlessly — recruiters spend ~6 seconds.',
    check: (t) => t.trim().split(/\s+/).length > 900,
  },
  {
    id: 'spelling',
    severity: 'warning',
    label: 'US spelling detected',
    fix: 'Use AU/British spelling.',
    check: (t) => {
      const US_AU: [string, string][] = [
        ['analyze', 'analyse'], ['color', 'colour'], ['honor', 'honour'],
        ['behavior', 'behaviour'], ['organize', 'organise'], ['recognize', 'recognise'],
        ['defense', 'defence'], ['traveled', 'travelled'], ['modeling', 'modelling'],
        ['center', 'centre'], ['fulfill', 'fulfil'],
      ];
      return US_AU
        .filter(([us]) => new RegExp(`\\b${us}`, 'i').test(t))
        .map(([us, au]) => `"${us}" → "${au}"`);
    },
  },
  {
    id: 'references',
    severity: 'info',
    label: '"References available on request" found',
    fix: "Remove this phrase. It's assumed and wastes space.",
    check: (t) => /references available on request/i.test(t),
  },
  {
    id: 'objective',
    severity: 'info',
    label: 'Objective statement detected',
    fix: 'Replace with a 3-line professional summary. "Objective" statements are outdated in AU.',
    check: (t) => /\bcareer objective\b|\bobjective\s*:/i.test(t),
  },
  {
    id: 'tfn',
    severity: 'critical',
    label: 'Sensitive number detected (TFN/passport/Medicare)',
    fix: 'NEVER include TFN, Medicare, or passport numbers on a resume.',
    check: (t) => /\b\d{3}\s?\d{3}\s?\d{3}\b|\bTFN\b|\bMedicare\b/i.test(t),
  },
  {
    id: 'quantified',
    severity: 'pass',
    label: 'Quantified achievements found',
    fix: '',
    check: (t) => /\b\d+\s*(%|percent|x\b|times|\$|users|customers|requests|ms\b|seconds)/i.test(t),
  },
  {
    id: 'github',
    severity: 'pass',
    label: 'GitHub / portfolio link found',
    fix: '',
    check: (t) => /github\.com|portfolio|gitlab\.com/i.test(t),
  },
];

interface RuleResult {
  rule: Rule;
  fired: boolean;
  detail?: string;
}

function analyse(text: string): RuleResult[] {
  return RULES.map(rule => {
    const result = rule.check(text);
    if (Array.isArray(result)) {
      return { rule, fired: result.length > 0, detail: result.join(', ') };
    }
    return { rule, fired: result as boolean };
  });
}

function computeScore(results: RuleResult[]): number {
  let score = 10;
  for (const r of results) {
    if (!r.fired) continue;
    if (r.rule.severity === 'critical') score -= 2;
    else if (r.rule.severity === 'warning') score -= 1;
    else if (r.rule.severity === 'info') score -= 0.5;
  }
  return Math.max(0, score);
}

function scoreBand(score: number): { label: string; color: string } {
  if (score >= 9) return { label: '🟢 AU-Ready', color: 'var(--jade)' };
  if (score >= 7) return { label: '🟡 Minor fixes needed', color: 'var(--gold)' };
  if (score >= 5) return { label: '🟠 Significant issues', color: '#c8682a' };
  return { label: '🔴 Not AU-ready', color: 'var(--terracotta)' };
}

const SEVERITY_ICON: Record<Severity, string> = {
  critical: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  pass: '✅',
};

export default function ResumeChecker() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 200);
    return () => clearTimeout(t);
  }, [text]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const results = debounced.trim().length > 0 ? analyse(debounced) : null;
  const score = results ? computeScore(results) : null;
  const band = score !== null ? scoreBand(score) : null;

  const issues = results?.filter(r => r.fired && r.rule.severity !== 'pass') ?? [];
  const passes = results?.filter(r => r.fired && r.rule.severity === 'pass') ?? [];

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Privacy note */}
      <p style={{
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginBottom: '0.6rem',
        padding: '0.5rem 0.8rem',
        background: 'rgba(30,122,82,0.06)',
        border: '1px solid rgba(30,122,82,0.15)',
        borderRadius: '6px',
        lineHeight: 1.5,
      }}>
        🔒 Your resume is analysed entirely in your browser — nothing is sent to a server.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={8}
        placeholder="Paste your resume text here..."
        style={{
          width: '100%',
          padding: '0.9rem 1rem',
          border: '1px solid var(--parchment)',
          borderRadius: '8px',
          fontFamily: 'inherit',
          fontSize: '0.88rem',
          lineHeight: 1.6,
          color: 'var(--brown-dark)',
          background: 'var(--warm-white)',
          resize: 'vertical',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      {results && score !== null && band && (
        <div style={{ marginTop: '1.5rem' }}>
          {/* Score display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '1rem 1.2rem',
            background: 'var(--parchment)',
            borderRadius: '8px',
            marginBottom: '1.2rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Lora', serif", fontSize: '2.4rem', fontWeight: 700, color: band.color, lineHeight: 1 }}>
                {score.toFixed(score % 1 === 0 ? 0 : 1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 10</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: band.color }}>{band.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {issues.length} issue{issues.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {issues.map(r => (
                <RuleRow key={r.rule.id} r={r} expanded={expanded.has(r.rule.id)} onToggle={() => toggleExpand(r.rule.id)} />
              ))}
            </div>
          )}

          {/* Passes */}
          {passes.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                Good practices found
              </div>
              {passes.map(r => (
                <RuleRow key={r.rule.id} r={r} expanded={false} onToggle={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleRow({ r, expanded, onToggle }: { r: RuleResult; expanded: boolean; onToggle: () => void }) {
  const isPass = r.rule.severity === 'pass';
  const hasFix = r.rule.fix.length > 0;

  const borderColor = r.rule.severity === 'critical'
    ? 'rgba(192,40,28,0.25)'
    : r.rule.severity === 'warning'
    ? 'rgba(200,138,20,0.25)'
    : r.rule.severity === 'info'
    ? 'rgba(0,0,0,0.1)'
    : 'rgba(30,122,82,0.2)';

  const bg = r.rule.severity === 'critical'
    ? 'rgba(192,40,28,0.04)'
    : r.rule.severity === 'warning'
    ? 'rgba(200,138,20,0.04)'
    : r.rule.severity === 'info'
    ? 'var(--warm-white)'
    : 'rgba(30,122,82,0.04)';

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      background: bg,
      marginBottom: '0.5rem',
      overflow: 'hidden',
    }}>
      <button
        onClick={hasFix ? onToggle : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.7rem 0.9rem',
          background: 'none',
          border: 'none',
          cursor: hasFix ? 'pointer' : 'default',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{SEVERITY_ICON[r.rule.severity]}</span>
        <span style={{
          fontSize: '0.88rem',
          fontWeight: 600,
          color: isPass ? 'var(--jade)' : 'var(--brown-dark)',
          flex: 1,
        }}>
          {r.rule.label}
          {r.detail && <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>— {r.detail}</span>}
        </span>
        {hasFix && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        )}
      </button>
      {expanded && hasFix && (
        <div style={{
          padding: '0 0.9rem 0.7rem 2.5rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          {r.rule.fix}
        </div>
      )}
    </div>
  );
}
