'use client';
import Link from 'next/link';

// Map company display name → detail page slug
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

const TIERS = [
  {
    label: 'God Tier / SSS',
    color: '#c8a800',
    bg: '#fffbeb',
    border: '#fcd34d',
    description: 'Elite quant trading and deep-tech product companies. Extremely selective — top 1% CS only.',
    companies: ['Palantir', 'TGS', 'Radix', 'Optiver', 'IMC Trading'],
    comp: '$150k – $250k+ AUD (grad)',
    culture: 'Small teams, research-heavy, performance-driven',
    growth: 'Fastest track to principal / researcher roles',
    thrive: 'Competitive programming backgrounds, top-ranked grads',
  },
  {
    label: 'S+ / S — Premium Product',
    color: '#d97706',
    bg: '#fff7ed',
    border: '#fed7aa',
    description: 'AU-native unicorns and high-growth global scaleups with genuine engineering culture.',
    companies: ['Canva', 'Atlassian', 'Afterpay / Block', 'Seek', 'Rokt', 'SafetyCulture'],
    comp: '$100k – $160k AUD',
    culture: 'Strong eng culture, internal mobility, good L&D',
    growth: 'Clear IC ladder; meaningful product ownership from year 1',
    thrive: 'Strong fundamentals grads who want to build real product',
  },
  {
    label: 'A+ — FAANG-adjacent',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    description: 'Globally recognised brands with strong AU engineering presence and RSU packages.',
    companies: ['Google AU', 'Meta AU', 'Apple AU', 'AWS', 'Stripe', 'Airbnb', 'Uber'],
    comp: '$120k – $180k + RSUs',
    culture: 'Structured, process-heavy at scale; excellent brand on resume',
    growth: 'Excellent — huge scope to move teams internally',
    thrive: 'Grads who want FAANG brand + solid distributed systems exposure',
  },
  {
    label: 'A — Strong Mid-tier',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#c4b5fd',
    description: 'Good companies that don\'t get enough credit. More relaxed than FAANG, still product-focused.',
    companies: ['Notion', 'Discord', 'Figma', 'Spotify AU', 'LinkedIn AU', 'Dropbox', 'Pinterest'],
    comp: '$90k – $130k AUD',
    culture: 'Flexible, collaborative, product-depth focus',
    growth: 'Good — cross-team movement common',
    thrive: 'Grads who prefer product depth over raw prestige',
  },
  {
    label: 'B+ — Large Tech / Enterprise',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    description: 'Solid engineering orgs with structured career ladders. Slower culture than product cos.',
    companies: ['Salesforce AU', 'Adobe AU', 'Cloudflare', 'GitHub', 'Twilio', 'Oracle AU'],
    comp: '$85k – $120k AUD',
    culture: 'Bureaucratic at times; structured promotion paths',
    growth: 'Predictable — clear levelling system',
    thrive: 'Grads who want structure and a clear promotion timeline',
  },
  {
    label: 'B — Traditional Enterprise',
    color: '#374151',
    bg: '#f9fafb',
    border: '#d1d5db',
    description: 'Large companies where IT is a cost centre. Good for stability and visa sponsorship.',
    companies: ['IBM AU', 'Accenture', 'Deloitte Tech', 'Booking.com', 'Morgan Stanley AU', 'Intel'],
    comp: '$70k – $100k AUD',
    culture: 'Slower pace, legacy codebases, political promotions',
    growth: 'Slow — tenure + certifications drive advancement',
    thrive: 'Grads prioritising stability or 482 visa sponsorship',
  },
  {
    label: 'B− — Body Shops & Bank IT',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    description: 'Outsourcers, big-4 banks\' internal IT arms, and second-tier consultancies. Go in eyes open.',
    companies: ['TCS', 'HCL', 'Infosys', 'Citi AU ops', 'Booz Allen AU', 'DXC'],
    comp: '$60k – $85k AUD',
    culture: 'High utilisation, limited ownership, contractor churn',
    growth: 'Limited — plan to use as a 2-year foothold then move',
    thrive: 'Grads needing an immediate visa pathway or first-job foothold',
  },
  {
    label: 'Avoid',
    color: '#9ca3af',
    bg: '#f9fafb',
    border: '#e5e7eb',
    description: 'Watch for these warning signs regardless of company name.',
    companies: [],
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

export default function CompanyTiers() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingBottom: '4rem' }}>

      <div style={{
        background: '#fffbeb', border: '1px solid #fcd34d',
        borderRadius: '10px', padding: '1rem 1.2rem',
        fontSize: '0.85rem', color: '#92400e', lineHeight: 1.6,
      }}>
        <strong>How to use this:</strong> Tiers reflect engineering culture, growth potential, and comp — not just brand prestige.
        A B+ company where you own a real product beats an A+ company where you resolve tickets for 3 years.
        Context matters.
      </div>

      {TIERS.map(tier => (
        <div key={tier.label} style={{
          background: tier.bg,
          border: `1.5px solid ${tier.border}`,
          borderRadius: '12px',
          padding: '1.2rem 1.4rem',
        }}>
          {/* Tier label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-block', width: '10px', height: '10px',
              borderRadius: '2px', background: tier.color, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'Lora', serif", fontWeight: 700,
              fontSize: '1rem', color: tier.color,
            }}>
              {tier.label}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', lineHeight: 1.55 }}>
            {tier.description}
          </p>

          {/* Companies */}
          {tier.companies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
              {tier.companies.map(c => {
                const slug = COMPANY_SLUGS[c];
                const chipStyle = {
                  fontSize: '0.78rem', fontWeight: 600,
                  padding: '0.2rem 0.6rem', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.7)', border: `1px solid ${tier.border}`,
                  color: tier.color,
                  textDecoration: 'none',
                  display: 'inline-block',
                  cursor: slug ? 'pointer' : 'default',
                  transition: 'background 0.1s ease',
                };
                return slug ? (
                  <Link key={c} href={`/au-insights/companies/${slug}`} style={chipStyle}>
                    {c} →
                  </Link>
                ) : (
                  <span key={c} style={chipStyle}>{c}</span>
                );
              })}
            </div>
          )}

          {/* Avoid warnings */}
          {'warnings' in tier && tier.warnings && (
            <ul style={{ margin: '0 0 0.9rem 0', paddingLeft: '1.2rem' }}>
              {tier.warnings.map(w => (
                <li key={w} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {w}
                </li>
              ))}
            </ul>
          )}

          {/* Quick facts grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.6rem',
          }}>
            {[
              { label: 'Comp', value: tier.comp },
              { label: 'Culture', value: tier.culture },
              { label: 'Growth', value: tier.growth },
              { label: 'Who thrives', value: tier.thrive },
            ].map(fact => (
              <div key={fact.label} style={{
                background: 'rgba(255,255,255,0.6)', borderRadius: '6px',
                padding: '0.5rem 0.7rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                  {fact.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {fact.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
