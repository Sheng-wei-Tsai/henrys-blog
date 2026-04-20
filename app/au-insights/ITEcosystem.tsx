'use client';
import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import CompanyLogo from '@/components/CompanyLogo';

const LAYERS = [
  {
    number: 1,
    id: 'vendors',
    role: 'Who Builds',
    label: 'Software Vendors',
    color: 'var(--terracotta)',
    borderColor: 'rgba(192,40,28,0.3)',
    bgColor: 'rgba(192,40,28,0.04)',
    dotColor: 'var(--terracotta)',
    description: 'Companies that create the software products — SaaS platforms sold to enterprises worldwide. They capture the most margin because they own the IP.',
    auExamples: ['Atlassian', 'Canva', 'SafetyCulture', 'Rokt', 'Envato'],
    globalAU: ['Workday', 'Salesforce', 'ServiceNow', 'SAP'],
    roles: ['Product Engineer', 'Platform Engineer', 'SRE', 'R&D Engineer'],
    comp: '$110k – $180k AUD',
    upside: 'Highest ownership, greenfield work, best long-term comp',
    watchOut: 'Most competitive — requires strong portfolio and fundamentals',
    forYou: 'Want to build actual product and see your code in production',
    moneyTag: 'Highest margin',
  },
  {
    number: 2,
    id: 'integrators',
    role: 'Who Connects',
    label: 'System Integrators',
    color: '#b45309',
    borderColor: 'rgba(180,83,9,0.3)',
    bgColor: 'rgba(180,83,9,0.04)',
    dotColor: '#b45309',
    description: 'Companies that wire vendor software into enterprise environments. They don\'t build — they connect. Revenue comes from implementation services.',
    auExamples: ['Datacom', 'DXC', 'Fujitsu AU'],
    globalAU: ['HPE', 'IBM AU', 'Capgemini'],
    roles: ['Cloud / Infra Engineer', 'Integration Architect', 'Migration Specialist'],
    comp: '$80k – $130k AUD',
    upside: 'Broad enterprise architecture exposure; great cloud / solutions architect path',
    watchOut: 'Can drift into maintenance mode; advancement via certifications + tenure',
    forYou: 'Want AWS / Azure certs, enterprise scale, and a path to cloud architect',
    moneyTag: 'Service margin',
  },
  {
    number: 3,
    id: 'consultancies',
    role: 'Who Customises',
    label: 'Consultancies',
    color: '#7c3aed',
    borderColor: 'rgba(124,58,237,0.3)',
    bgColor: 'rgba(124,58,237,0.04)',
    dotColor: '#7c3aed',
    description: 'Companies hired to customise vendor software for clients and run technology transformation programs. They bill by the day and manage risk through frameworks.',
    auExamples: ['Accenture', 'Deloitte Tech', 'PwC'],
    globalAU: ['EY', 'KPMG', 'Capgemini AU'],
    roles: ['Graduate Analyst', 'Technology Consultant', 'Business Analyst', 'Developer'],
    comp: '$70k – $110k AUD',
    upside: 'Multiple clients per year; fast commercial awareness; structured grad programs',
    watchOut: 'Billable-hours culture; risk of only knowing how to customise, not build',
    forYou: 'Want variety, client exposure, and a structured grad program on your first job',
    moneyTag: 'Consulting fees',
  },
  {
    number: 4,
    id: 'consumers',
    role: 'Who Buys',
    label: 'End Consumers',
    color: 'var(--text-secondary)',
    borderColor: 'var(--parchment)',
    bgColor: 'var(--warm-white)',
    dotColor: 'var(--text-secondary)',
    description: 'Large non-tech organisations with internal IT teams that buy and operate software. IT is a cost centre here — stable but slower-paced.',
    auExamples: ['Medibank', 'CBA / CommBank', 'Woolworths', 'Telstra', 'AGL'],
    globalAU: ['Queensland Government', 'ATO', 'Service NSW', 'Department of Defence'],
    roles: ['Internal Developer', 'DevOps Engineer', 'Business Analyst', 'Data Analyst'],
    comp: '$75k – $110k AUD',
    upside: 'Stability, work-life balance, visa-friendly; good base while upskilling',
    watchOut: 'IT is a cost centre; long ship cycles; innovation is slow',
    forYou: 'Want stability while building skills or navigating a visa pathway',
    moneyTag: 'Largest headcount',
  },
];

const DECISION_ROWS = [
  { goal: 'Build real product with high ownership', layer: 'Layer 1 — Vendors', color: 'var(--terracotta)' },
  { goal: 'Cloud certifications + infrastructure career', layer: 'Layer 2 — Integrators', color: '#b45309' },
  { goal: 'Variety, client exposure, fast structured promotion', layer: 'Layer 3 — Consultancies', color: '#7c3aed' },
  { goal: 'Stability while on a visa or upskilling', layer: 'Layer 4 — End Consumers', color: 'var(--text-secondary)' },
];

// ── Animated money-flow arrow between layers ───────────────────────────────
function LayerArrow({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
      transition={{ duration: 0.35, delay: Math.min(index * 0.1, 0.2) + 0.2, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.1rem 0', transformOrigin: 'top' }}
    >
      <motion.span
        initial={{ opacity: 0, y: -4 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: Math.min(index * 0.1, 0.2) + 0.45 }}
        style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.15rem' }}
      >
        💰 money flows up
      </motion.span>
      <div style={{ width: '2px', height: '22px', background: 'var(--parchment)', position: 'relative' }}>
        <div style={{
          position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '6px solid var(--parchment)',
        }} />
      </div>
    </motion.div>
  );
}

// ── Company chip with logo ─────────────────────────────────────────────────
function CompanyChip({ name, color, borderColor }: { name: string; color: string; borderColor: string }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        fontSize: '0.77rem', fontWeight: 600,
        padding: '0.2rem 0.5rem 0.2rem 0.35rem', borderRadius: '5px',
        background: 'var(--warm-white)', border: `1px solid ${borderColor}`,
        color, cursor: 'pointer', boxShadow: '1px 1px 0 rgba(20,10,5,0.05)',
      }}
    >
      <CompanyLogo name={name} size={16} variant="bare" />
      {name}
    </motion.span>
  );
}

// ── Individual layer card ──────────────────────────────────────────────────
function LayerCard({ layer, index }: { layer: typeof LAYERS[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.1, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 6px 24px rgba(20,10,5,0.09)' }}
      style={{
        background: layer.bgColor,
        border: `1px solid ${layer.borderColor}`,
        borderLeft: `3px solid ${layer.color}`,
        borderRadius: '12px',
        padding: '1.2rem 1.4rem',
        willChange: 'transform',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {/* Animated dot — same pattern as tier dot */}
        <motion.span
          animate={isInView ? { scale: [0.5, 1.2, 1], opacity: [0, 1, 1] } : {}}
          transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.3) + 0.15 }}
          style={{
            display: 'inline-block', width: '10px', height: '10px',
            borderRadius: '2px', background: layer.dotColor, flexShrink: 0,
          }}
        />
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, color: layer.color,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          background: 'rgba(255,255,255,0.55)', border: `1px solid ${layer.borderColor}`,
          padding: '0.12rem 0.5rem', borderRadius: '99px', whiteSpace: 'nowrap',
        }}>
          Layer {layer.number} — {layer.role}
        </span>
        <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1.05rem', color: layer.color }}>
          {layer.label}
        </span>
        {/* Margin / comp badge */}
        <span style={{
          marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700,
          padding: '0.12rem 0.5rem', borderRadius: '99px',
          background: `${layer.borderColor}`, color: layer.color,
          whiteSpace: 'nowrap',
        }}>
          {layer.moneyTag}
        </span>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.9rem', lineHeight: 1.55 }}>
        {layer.description}
      </p>

      {/* Companies — split AU vs Global */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.9rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
            🇦🇺 AU-native
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {layer.auExamples.map(c => (
              <CompanyChip key={c} name={c} color={layer.color} borderColor={layer.borderColor} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
            🌏 Global presence
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {layer.globalAU.map(c => (
              <CompanyChip key={c} name={c} color={layer.color} borderColor={layer.borderColor} />
            ))}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
          Typical roles
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {layer.roles.map((r, ri) => (
            <motion.span
              key={r}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.25, delay: Math.min(index * 0.1, 0.3) + 0.3 + ri * 0.05 }}
              style={{
                fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px',
                background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                color: 'var(--text-secondary)',
              }}
            >
              {r}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Toggle button for facts */}
      <button
        onClick={() => setDetailOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.75rem', fontWeight: 700, color: layer.color,
          padding: '0.2rem 0', marginBottom: detailOpen ? '0.7rem' : 0,
          fontFamily: 'inherit',
        }}
      >
        <motion.span
          animate={{ rotate: detailOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ display: 'inline-block', fontSize: '0.9rem' }}
        >
          ▶
        </motion.span>
        {detailOpen ? 'Hide analysis' : 'Show analysis'}
      </button>

      {/* Expandable facts grid — same structure as TierCard quick facts */}
      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              {[
                { label: 'Typical comp', value: layer.comp },
                { label: '✓ Upside',     value: layer.upside },
                { label: '⚠ Watch out',  value: layer.watchOut },
                { label: '→ Best if you…', value: layer.forYou },
              ].map((fact, fi) => (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: fi * 0.06 }}
                  style={{
                    background: 'var(--warm-white)', borderRadius: '6px',
                    padding: '0.5rem 0.7rem', border: '1px solid var(--parchment)',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: layer.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                    {fact.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {fact.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ITEcosystem() {
  const tableRef = useRef<HTMLDivElement>(null);
  const tableInView = useInView(tableRef, { once: true, margin: '-60px 0px' });

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* Header callout — matches CompanyTiers "How to use this" style */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(200,138,20,0.06)', border: '1px solid rgba(200,138,20,0.25)',
          borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '1.5rem',
          fontSize: '0.85rem', color: 'var(--brown-mid)', lineHeight: 1.6,
        }}
      >
        <strong>The money flows upward:</strong> End consumers pay consultancies to implement
        vendor software through system integrators. Each layer takes margin.
        Knowing which layer you work in shapes your entire career trajectory —
        click <strong>Show analysis</strong> on any card to see comp, upsides, and red flags.
      </motion.div>

      {/* Layer stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => (
          <div key={layer.id}>
            <LayerCard layer={layer} index={i} />
            {i < LAYERS.length - 1 && <LayerArrow index={i} />}
          </div>
        ))}
      </div>

      {/* Decision table */}
      <div ref={tableRef} style={{ marginTop: '2rem' }}>
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={tableInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35 }}
          style={{
            fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--brown-dark)', marginBottom: '0.9rem',
          }}
        >
          Which layer should you target?
        </motion.h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DECISION_ROWS.map((row, i) => (
            <motion.div
              key={row.goal}
              initial={{ opacity: 0, x: -16 }}
              animate={tableInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              whileHover={{ x: 4 }}
              style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                borderLeft: `3px solid ${row.color}`,
                borderRadius: '8px', padding: '0.75rem 1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 2, minWidth: '160px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {row.goal}
              </div>
              <div style={{ flex: 1, minWidth: '160px', fontSize: '0.85rem', fontWeight: 700, color: row.color }}>
                → {row.layer}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
