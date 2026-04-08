'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const COMPANY_SLUGS: Record<string, string> = {
  'Optiver': 'optiver',
  'Atlassian': 'atlassian',
  'Canva': 'canva',
  'SafetyCulture': 'safetyCulture',
  'Google AU': 'google-au',
  'AWS': 'amazon-aws',
  'Accenture': 'accenture',
  'Deloitte Tech': 'deloitte-digital',
  'IBM AU': 'ibm-au',
  'TCS': 'tcs',
  'CBA / CommBank': 'cba',
};

const COMPANY_DOMAINS: Record<string, string> = {
  'Palantir': 'palantir.com',
  'TGS': 'tgs.com',
  'Radix': 'radixtrading.com',
  'Optiver': 'optiver.com',
  'IMC Trading': 'imc.com',
  'Canva': 'canva.com',
  'Atlassian': 'atlassian.com',
  'Afterpay / Block': 'block.xyz',
  'Seek': 'seek.com.au',
  'Rokt': 'rokt.com',
  'SafetyCulture': 'safetyculture.com',
  'Google AU': 'google.com',
  'Meta AU': 'meta.com',
  'Apple AU': 'apple.com',
  'AWS': 'aws.amazon.com',
  'Stripe': 'stripe.com',
  'Airbnb': 'airbnb.com',
  'Uber': 'uber.com',
  'Notion': 'notion.so',
  'Discord': 'discord.com',
  'Figma': 'figma.com',
  'Spotify AU': 'spotify.com',
  'LinkedIn AU': 'linkedin.com',
  'Dropbox': 'dropbox.com',
  'Pinterest': 'pinterest.com',
  'Salesforce AU': 'salesforce.com',
  'Adobe AU': 'adobe.com',
  'Cloudflare': 'cloudflare.com',
  'GitHub': 'github.com',
  'Twilio': 'twilio.com',
  'Oracle AU': 'oracle.com',
  'IBM AU': 'ibm.com',
  'Accenture': 'accenture.com',
  'Deloitte Tech': 'deloitte.com',
  'Booking.com': 'booking.com',
  'Morgan Stanley AU': 'morganstanley.com',
  'Intel': 'intel.com',
  'TCS': 'tcs.com',
  'HCL': 'hcltech.com',
  'Infosys': 'infosys.com',
  'Citi AU ops': 'citi.com',
  'Booz Allen AU': 'boozallen.com',
  'DXC': 'dxc.com',
  'CBA / CommBank': 'commbank.com.au',
};

const TIERS = [
  {
    label: 'God Tier / SSS',
    color: 'var(--gold)',
    borderColor: 'rgba(200,138,20,0.35)',
    bgColor: 'rgba(200,138,20,0.05)',
    description: 'Elite quant trading and deep-tech product companies. Extremely selective — top 1% CS only.',
    companies: ['Palantir', 'TGS', 'Radix', 'Optiver', 'IMC Trading'],
    comp: '$150k – $250k+ AUD (grad)',
    culture: 'Small teams, research-heavy, performance-driven',
    growth: 'Fastest track to principal / researcher roles',
    thrive: 'Competitive programming backgrounds, top-ranked grads',
  },
  {
    label: 'S+ / S — Premium Product',
    color: 'var(--amber)',
    borderColor: 'rgba(200,138,20,0.25)',
    bgColor: 'rgba(200,138,20,0.04)',
    description: 'AU-native unicorns and high-growth global scaleups with genuine engineering culture.',
    companies: ['Canva', 'Atlassian', 'Afterpay / Block', 'Seek', 'Rokt', 'SafetyCulture'],
    comp: '$100k – $160k AUD',
    culture: 'Strong eng culture, internal mobility, good L&D',
    growth: 'Clear IC ladder; meaningful product ownership from year 1',
    thrive: 'Strong fundamentals grads who want to build real product',
  },
  {
    label: 'A+ — FAANG-adjacent',
    color: 'var(--terracotta)',
    borderColor: 'rgba(192,40,28,0.3)',
    bgColor: 'rgba(192,40,28,0.05)',
    description: 'Globally recognised brands with strong AU engineering presence and RSU packages.',
    companies: ['Google AU', 'Meta AU', 'Apple AU', 'AWS', 'Stripe', 'Airbnb', 'Uber'],
    comp: '$120k – $180k + RSUs',
    culture: 'Structured, process-heavy at scale; excellent brand on resume',
    growth: 'Excellent — huge scope to move teams internally',
    thrive: 'Grads who want FAANG brand + solid distributed systems exposure',
  },
  {
    label: 'A — Strong Mid-tier',
    color: 'var(--brown-mid)',
    borderColor: 'rgba(61,28,14,0.2)',
    bgColor: 'rgba(61,28,14,0.04)',
    description: 'Good companies that don\'t get enough credit. More relaxed than FAANG, still product-focused.',
    companies: ['Notion', 'Discord', 'Figma', 'Spotify AU', 'LinkedIn AU', 'Dropbox', 'Pinterest'],
    comp: '$90k – $130k AUD',
    culture: 'Flexible, collaborative, product-depth focus',
    growth: 'Good — cross-team movement common',
    thrive: 'Grads who prefer product depth over raw prestige',
  },
  {
    label: 'B+ — Large Tech / Enterprise',
    color: 'var(--brown-light)',
    borderColor: 'var(--parchment)',
    bgColor: 'var(--warm-white)',
    description: 'Solid engineering orgs with structured career ladders. Slower culture than product cos.',
    companies: ['Salesforce AU', 'Adobe AU', 'Cloudflare', 'GitHub', 'Twilio', 'Oracle AU'],
    comp: '$85k – $120k AUD',
    culture: 'Bureaucratic at times; structured promotion paths',
    growth: 'Predictable — clear levelling system',
    thrive: 'Grads who want structure and a clear promotion timeline',
  },
  {
    label: 'B — Traditional Enterprise',
    color: 'var(--text-muted)',
    borderColor: 'var(--parchment)',
    bgColor: 'var(--warm-white)',
    description: 'Large companies where IT is a cost centre. Good for stability and visa sponsorship.',
    companies: ['IBM AU', 'Accenture', 'Deloitte Tech', 'Booking.com', 'Morgan Stanley AU', 'Intel'],
    comp: '$70k – $100k AUD',
    culture: 'Slower pace, legacy codebases, political promotions',
    growth: 'Slow — tenure + certifications drive advancement',
    thrive: 'Grads prioritising stability or 482 visa sponsorship',
  },
  {
    label: 'B− — Body Shops & Bank IT',
    color: 'var(--text-muted)',
    borderColor: 'var(--parchment)',
    bgColor: 'var(--warm-white)',
    description: 'Outsourcers, big-4 banks\' internal IT arms, and second-tier consultancies. Go in eyes open.',
    companies: ['TCS', 'HCL', 'Infosys', 'Citi AU ops', 'Booz Allen AU', 'DXC'],
    comp: '$60k – $85k AUD',
    culture: 'High utilisation, limited ownership, contractor churn',
    growth: 'Limited — plan to use as a 2-year foothold then move',
    thrive: 'Grads needing an immediate visa pathway or first-job foothold',
  },
  {
    label: 'Avoid',
    color: 'var(--text-muted)',
    borderColor: 'var(--parchment)',
    bgColor: 'var(--warm-white)',
    description: 'Watch for these warning signs regardless of company name.',
    companies: [] as string[],
    comp: 'Often below market, verify carefully',
    culture: '"Work hard play hard" on Glassdoor; no code review culture',
    growth: 'Minimal — high burnout, high turnover',
    thrive: 'Nobody — move on quickly if you land here',
    warnings: [
      'No public engineering blog or tech content',
      'No L&D budget or training support',
      '"Unlimited PTO" with no one taking it',
      'Majority contractor / outsourced workforce',
      'Salary quoted inclusive of super without disclosure',
    ],
  },
];

// ── Company chip with favicon + ghost logo watermark on hover ──────────────
function CompanyChip({ name, tierColor, borderColor }: { name: string; tierColor: string; borderColor: string }) {
  const [hovered, setHovered] = useState(false);
  const slug = COMPANY_SLUGS[name];
  const domain = COMPANY_DOMAINS[name];
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  const inner = (
    <motion.span
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        padding: '0.22rem 0.6rem',
        borderRadius: '4px',
        background: 'var(--warm-white)',
        border: `1px solid ${borderColor}`,
        color: tierColor,
        textDecoration: 'none',
        cursor: slug ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Ghost logo watermark */}
      <AnimatePresence>
        {hovered && faviconUrl && (
          <motion.img
            key="ghost"
            src={faviconUrl}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.12, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '52px',
              height: '52px',
              filter: 'blur(3px) saturate(0)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Favicon badge */}
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          aria-hidden="true"
          width={13}
          height={13}
          style={{ borderRadius: '2px', flexShrink: 0, objectFit: 'contain' }}
        />
      )}

      <span style={{ position: 'relative', zIndex: 1 }}>
        {name}{slug ? ' →' : ''}
      </span>
    </motion.span>
  );

  return slug ? (
    <Link key={name} href={`/au-insights/companies/${slug}`} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  ) : inner;
}

// ── Tier card with scroll-triggered entrance ───────────────────────────────
function TierCard({ tier, index }: { tier: typeof TIERS[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 6px 24px rgba(20,10,5,0.09)' }}
      style={{
        background: tier.bgColor,
        border: `1px solid ${tier.borderColor}`,
        borderLeft: `3px solid ${tier.color}`,
        borderRadius: '12px',
        padding: '1.2rem 1.4rem',
        cursor: 'default',
        willChange: 'transform',
      }}
    >
      {/* Tier label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <motion.span
          animate={isInView ? { scale: [0.5, 1.2, 1], opacity: [0, 1, 1] } : {}}
          transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.3) + 0.15 }}
          style={{
            display: 'inline-block', width: '10px', height: '10px',
            borderRadius: '2px', background: tier.color, flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1rem', color: tier.color }}>
          {tier.label}
        </span>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', lineHeight: 1.55 }}>
        {tier.description}
      </p>

      {/* Companies */}
      {tier.companies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
          {tier.companies.map(c => (
            <CompanyChip key={c} name={c} tierColor={tier.color} borderColor={tier.borderColor} />
          ))}
        </div>
      )}

      {/* Avoid warnings */}
      {'warnings' in tier && tier.warnings && (
        <ul style={{ margin: '0 0 0.9rem 0', paddingLeft: '1.2rem' }}>
          {tier.warnings.map(w => (
            <li key={w} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{w}</li>
          ))}
        </ul>
      )}

      {/* Quick facts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: 'Comp',       value: tier.comp },
          { label: 'Culture',    value: tier.culture },
          { label: 'Growth',     value: tier.growth },
          { label: 'Who thrives', value: tier.thrive },
        ].map((fact, fi) => (
          <motion.div
            key={fact.label}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay: Math.min(index * 0.07, 0.3) + 0.25 + fi * 0.05 }}
            style={{
              background: 'var(--warm-white)', borderRadius: '6px',
              padding: '0.5rem 0.7rem', border: '1px solid var(--parchment)',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
              {fact.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {fact.value}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function CompanyTiers() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingBottom: '4rem' }}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(200,138,20,0.06)', border: '1px solid rgba(200,138,20,0.25)',
          borderRadius: '10px', padding: '1rem 1.2rem',
          fontSize: '0.85rem', color: 'var(--brown-mid)', lineHeight: 1.6,
        }}
      >
        <strong>How to use this:</strong> Tiers reflect engineering culture, growth potential, and comp — not just brand prestige.
        A B+ company where you own a real product beats an A+ company where you resolve tickets for 3 years.
        Context matters.
      </motion.div>

      {TIERS.map((tier, i) => (
        <TierCard key={tier.label} tier={tier} index={i} />
      ))}
    </div>
  );
}
