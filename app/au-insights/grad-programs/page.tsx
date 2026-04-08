'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GRAD_PROGRAMS, computeStatus, daysUntilClose, type GradProgram, type ProgramStatus } from '../data/grad-programs';

const STATUS_CONFIG: Record<ProgramStatus, { label: string; bg: string; text: string; border: string }> = {
  'open':          { label: '🟢 Open',          bg: 'rgba(30,122,82,0.08)',   text: 'var(--jade)',       border: 'rgba(30,122,82,0.25)' },
  'closing-soon':  { label: '🟡 Closing Soon',  bg: 'rgba(200,138,20,0.08)',  text: 'var(--gold)',       border: 'rgba(200,138,20,0.25)' },
  'closed':        { label: '🔴 Closed',         bg: 'rgba(192,40,28,0.06)',   text: 'var(--terracotta)', border: 'rgba(192,40,28,0.2)' },
  'not-yet-open':  { label: '🔵 Not Yet Open',  bg: 'var(--warm-white)',      text: 'var(--text-muted)', border: 'var(--parchment)' },
  'rolling':       { label: '⚪ Rolling Intake', bg: 'var(--warm-white)',      text: 'var(--text-muted)', border: 'var(--parchment)' },
};

const ALL_ROLES = Array.from(new Set(GRAD_PROGRAMS.flatMap(p => p.program.roles))).sort();
const ALL_CITIES = Array.from(new Set(GRAD_PROGRAMS.flatMap(p => p.program.locations))).sort();

const COMPANY_DOMAINS: Record<string, string> = {
  'Atlassian':               'atlassian.com',
  'Canva':                   'canva.com',
  'Google AU':               'google.com',
  'Amazon / AWS AU':         'amazon.com',
  'Commonwealth Bank (CBA)': 'commbank.com.au',
  'Accenture AU':            'accenture.com',
  'Deloitte Digital AU':     'deloitte.com',
  'IBM AU':                  'ibm.com',
  'Optiver':                 'optiver.com',
  'TCS AU':                  'tcs.com',
  'Westpac':                 'westpac.com.au',
  'ANZ Bank':                'anz.com.au',
  'NAB':                     'nab.com.au',
};

function GradCard({ prog }: { prog: GradProgram }) {
  const status = computeStatus(prog);
  const days = daysUntilClose(prog);
  const sc = STATUS_CONFIG[status];
  const domain = COMPANY_DOMAINS[prog.company];

  return (
    <div style={{
      background: 'var(--warm-white)', border: '1px solid var(--parchment)',
      borderRadius: '12px', overflow: 'hidden',
      borderTop: '3px solid var(--terracotta)',
    }}>
      <div style={{ padding: '1rem 1.1rem' }}>
        {/* Status + visa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
            borderRadius: '99px', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            whiteSpace: 'nowrap',
          }}>
            {sc.label}
          </span>
          {prog.sponsorsVisa && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem',
              borderRadius: '99px', background: 'rgba(30,122,82,0.08)', color: 'var(--jade)', border: '1px solid rgba(30,122,82,0.25)',
            }}>
              ✅ Visa
            </span>
          )}
        </div>

        {/* Company logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
          {domain && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt=""
              width={20} height={20}
              style={{ borderRadius: '4px', flexShrink: 0, objectFit: 'contain' }}
            />
          )}
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--brown-dark)' }}>
            {prog.company}
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {prog.program.name}
        </div>

        {/* Meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.7rem' }}>
          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--parchment)', color: 'var(--text-muted)' }}>
            📍 {prog.program.locations.join(' · ')}
          </span>
          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--parchment)', color: 'var(--text-muted)' }}>
            🎓 {prog.program.intakeMonth}
          </span>
          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--parchment)', color: 'var(--text-muted)' }}>
            💰 {prog.salaryRange}
          </span>
        </div>

        {/* Roles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.8rem' }}>
          {prog.program.roles.slice(0, 4).map(r => (
            <span key={r} style={{
              fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
              background: 'rgba(192,40,28,0.06)', color: 'var(--terracotta)',
              border: '1px solid rgba(192,40,28,0.18)', fontWeight: 500,
            }}>
              {r}
            </span>
          ))}
          {prog.program.roles.length > 4 && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.15rem 0' }}>
              +{prog.program.roles.length - 4} more
            </span>
          )}
        </div>

        {/* Countdown / status message */}
        {status === 'open' && days !== null && (
          <div style={{
            background: 'rgba(30,122,82,0.08)', border: '1px solid rgba(30,122,82,0.25)',
            borderRadius: '6px', padding: '0.4rem 0.7rem',
            fontSize: '0.78rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.8rem',
          }}>
            Closes in {days} day{days !== 1 ? 's' : ''}
          </div>
        )}
        {status === 'closing-soon' && days !== null && (
          <div style={{
            background: 'rgba(200,138,20,0.08)', border: '1px solid rgba(200,138,20,0.25)',
            borderRadius: '6px', padding: '0.4rem 0.7rem',
            fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '0.8rem',
          }}>
            ⚠ Closing in {days} day{days !== 1 ? 's' : ''} — apply now
          </div>
        )}
        {status === 'not-yet-open' && prog.applicationWindow.opensDate && (
          <div style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '6px', padding: '0.4rem 0.7rem',
            fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem',
          }}>
            Opens {new Date(prog.applicationWindow.opensDate).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </div>
        )}
        {status === 'closed' && prog.applicationWindow.opensDate && (
          <div style={{
            background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)',
            borderRadius: '6px', padding: '0.4rem 0.7rem',
            fontSize: '0.78rem', color: 'var(--terracotta)', marginBottom: '0.8rem',
          }}>
            Closed — next intake opens {new Date(prog.applicationWindow.opensDate).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </div>
        )}

        {/* Notes */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 0.8rem' }}>
          {prog.notes}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={prog.program.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.78rem', fontWeight: 700, padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              background: status === 'open' || status === 'closing-soon' || status === 'rolling' ? 'var(--terracotta)' : 'var(--parchment)',
              color: status === 'open' || status === 'closing-soon' || status === 'rolling' ? 'white' : 'var(--text-muted)',
              textDecoration: 'none', border: 'none',
            }}
          >
            {status === 'rolling' ? 'Apply →' : status === 'open' || status === 'closing-soon' ? 'Apply Now →' : 'View Program →'}
          </a>
          {prog.slug && (
            <Link
              href={`/au-insights/companies/${prog.slug}`}
              style={{
                fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 0.9rem',
                borderRadius: '6px', background: 'var(--warm-white)',
                color: 'var(--text-secondary)', textDecoration: 'none',
                border: '1px solid var(--parchment)',
              }}
            >
              Company profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Named export for embedding as a tab inside /au-insights
export function GradProgramsContent() {
  const [roleFilter, setRoleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [visaOnly, setVisaOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    return GRAD_PROGRAMS.filter(p => {
      const status = computeStatus(p);
      if (visaOnly && !p.sponsorsVisa) return false;
      if (openOnly && status !== 'open' && status !== 'closing-soon' && status !== 'rolling') return false;
      if (roleFilter && !p.program.roles.some(r => r === roleFilter)) return false;
      if (cityFilter && !p.program.locations.includes(cityFilter)) return false;
      return true;
    });
  }, [roleFilter, cityFilter, visaOnly, openOnly]);

  const counts = useMemo(() => {
    const all = GRAD_PROGRAMS.map(p => computeStatus(p));
    return {
      open: all.filter(s => s === 'open').length,
      closingSoon: all.filter(s => s === 'closing-soon').length,
      closed: all.filter(s => s === 'closed').length,
      notYet: all.filter(s => s === 'not-yet-open').length,
      rolling: all.filter(s => s === 'rolling').length,
    };
  }, []);

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem',
    border: '1px solid var(--parchment)', background: 'var(--warm-white)',
    color: 'var(--brown-dark)', fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Status summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { label: `${counts.open} Open`,                bg: 'rgba(30,122,82,0.08)',  color: 'var(--jade)' },
          { label: `${counts.closingSoon} Closing Soon`, bg: 'rgba(200,138,20,0.08)', color: 'var(--gold)' },
          { label: `${counts.notYet} Not Yet Open`,      bg: 'var(--warm-white)',     color: 'var(--text-muted)' },
          { label: `${counts.closed} Closed`,            bg: 'rgba(192,40,28,0.06)',  color: 'var(--terracotta)' },
          { label: `${counts.rolling} Rolling`,          bg: 'var(--warm-white)',     color: 'var(--text-muted)' },
        ].map(item => (
          <span key={item.label} style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.7rem',
            borderRadius: '99px', background: item.bg, color: item.color,
            border: '1px solid var(--parchment)',
          }}>
            {item.label}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={selectStyle}>
          <option value="">All Cities</option>
          {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
          <input type="checkbox" checked={visaOnly} onChange={e => setVisaOnly(e.target.checked)} />
          Visa sponsors only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
          <input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} />
          Open / rolling only
        </label>
        {(roleFilter || cityFilter || visaOnly || openOnly) && (
          <button
            onClick={() => { setRoleFilter(''); setCityFilter(''); setVisaOnly(false); setOpenOnly(false); }}
            style={{ fontSize: '0.75rem', color: 'var(--terracotta)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          No programs match your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map(prog => <GradCard key={prog.company} prog={prog} />)}
        </div>
      )}

      {/* Note */}
      <div style={{
        marginTop: '2.5rem', background: 'rgba(200,138,20,0.06)', border: '1px solid rgba(200,138,20,0.25)',
        borderRadius: '8px', padding: '0.8rem 1rem',
        fontSize: '0.74rem', color: 'var(--brown-mid)', lineHeight: 1.6,
      }}>
        <strong>⚠ Important:</strong> Bank programs (CBA, ANZ, NAB, Westpac) open in <strong>March</strong> — much earlier
        than tech company programs which open in July–August. Set a calendar reminder for 1 March each year.
        Dates are updated annually — verify directly on company career pages before applying.
      </div>
    </div>
  );
}

export default function GradProgramsPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [visaOnly, setVisaOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    return GRAD_PROGRAMS.filter(p => {
      const status = computeStatus(p);
      if (visaOnly && !p.sponsorsVisa) return false;
      if (openOnly && status !== 'open' && status !== 'closing-soon' && status !== 'rolling') return false;
      if (roleFilter && !p.program.roles.some(r => r === roleFilter)) return false;
      if (cityFilter && !p.program.locations.includes(cityFilter)) return false;
      return true;
    });
  }, [roleFilter, cityFilter, visaOnly, openOnly]);

  const counts = useMemo(() => {
    const all = GRAD_PROGRAMS.map(p => computeStatus(p));
    return {
      open: all.filter(s => s === 'open').length,
      closingSoon: all.filter(s => s === 'closing-soon').length,
      closed: all.filter(s => s === 'closed').length,
      notYet: all.filter(s => s === 'not-yet-open').length,
      rolling: all.filter(s => s === 'rolling').length,
    };
  }, []);

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem',
    border: '1px solid var(--parchment)', background: 'var(--warm-white)',
    color: 'var(--brown-dark)', fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem', paddingBottom: '5rem' }}>
      <div style={{ paddingTop: '2.5rem' }}>
        <Link href="/au-insights" style={{
          fontSize: '0.85rem', color: 'var(--terracotta)',
          textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        }}>
          ← AU Insights
        </Link>
      </div>
      <div style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.7rem',
        }}>
          AU IT Grad Program Tracker
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '55ch' }}>
          Every major Australian IT graduate program in one place — with live status,
          deadlines, and direct application links. Miss the window and you wait a full year.
        </p>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { label: `${counts.open} Open`,                bg: 'rgba(30,122,82,0.08)',  color: 'var(--jade)' },
          { label: `${counts.closingSoon} Closing Soon`, bg: 'rgba(200,138,20,0.08)', color: 'var(--gold)' },
          { label: `${counts.notYet} Not Yet Open`,      bg: 'var(--warm-white)',     color: 'var(--text-muted)' },
          { label: `${counts.closed} Closed`,            bg: 'rgba(192,40,28,0.06)', color: 'var(--terracotta)' },
          { label: `${counts.rolling} Rolling`,          bg: 'var(--warm-white)',     color: 'var(--text-muted)' },
        ].map(item => (
          <span key={item.label} style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.7rem',
            borderRadius: '99px', background: item.bg, color: item.color,
            border: '1px solid var(--parchment)',
          }}>
            {item.label}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={selectStyle}>
          <option value="">All Cities</option>
          {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
          <input type="checkbox" checked={visaOnly} onChange={e => setVisaOnly(e.target.checked)} />
          Visa sponsors only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
          <input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} />
          Open / rolling only
        </label>
        {(roleFilter || cityFilter || visaOnly || openOnly) && (
          <button
            onClick={() => { setRoleFilter(''); setCityFilter(''); setVisaOnly(false); setOpenOnly(false); }}
            style={{ fontSize: '0.75rem', color: 'var(--terracotta)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          No programs match your filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map(prog => <GradCard key={prog.company} prog={prog} />)}
        </div>
      )}

      {/* Note */}
      <div style={{
        marginTop: '2.5rem', background: 'rgba(200,138,20,0.06)', border: '1px solid rgba(200,138,20,0.25)',
        borderRadius: '8px', padding: '0.8rem 1rem',
        fontSize: '0.74rem', color: 'var(--brown-mid)', lineHeight: 1.6,
      }}>
        <strong>⚠ Important:</strong> Bank programs (CBA, ANZ, NAB, Westpac) open in <strong>March</strong> — much earlier
        than tech company programs which open in July–August. Set a calendar reminder for 1 March each year.
        Dates are updated annually — verify directly on company career pages before applying.
      </div>
    </div>
  );
}
