'use client';
import { useState } from 'react';

const SECTIONS = [
  {
    id: 'pathways',
    icon: '🗺',
    title: 'IT Career Pathways',
    subtitle: 'CS grads have more doors than software engineering',
    content: (
      <div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          Australia's IT market has deep demand across seven distinct pathways. The AU market is roughly
          1/10th the size of the US — fewer total roles, but also less competition for international applicants.
          Specialise earlier than you think you need to.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--parchment)' }}>
                {['Pathway', 'AU Demand', 'Entry Roles'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.7rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Software Engineering', 'Very High', 'Graduate Developer, Junior SWE'],
                ['Data / Analytics',     'High',      'Data Analyst, Junior Data Engineer'],
                ['DevOps / Cloud',       'High',      'Cloud Support, Junior DevOps'],
                ['IT Consulting',        'High',      'Technology Analyst, Graduate Consultant'],
                ['Cybersecurity',        'Growing',   'SOC Analyst, Security Consultant'],
                ['Business Analysis',    'Medium',    'Graduate BA, Systems Analyst'],
                ['QA / Test',            'Medium',    'Test Analyst, Graduate QA'],
              ].map(([path, demand, roles], i) => (
                <tr key={path} style={{ borderBottom: '1px solid var(--parchment)', background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,235,0.4)' }}>
                  <td style={{ padding: '0.6rem 0.7rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{path}</td>
                  <td style={{ padding: '0.6rem 0.7rem', color: demand === 'Very High' ? 'var(--jade)' : demand === 'High' ? 'var(--gold)' : demand === 'Growing' ? 'var(--terracotta)' : 'var(--text-muted)' }}>{demand}</td>
                  <td style={{ padding: '0.6rem 0.7rem', color: 'var(--text-secondary)' }}>{roles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'grad-programs',
    icon: '🎓',
    title: 'Graduate Program Overview',
    subtitle: 'The most structured entry point into Australian IT',
    content: (
      <div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          Grad programs run 12–24 months with rotations across 2–4 teams. Applications open
          March–May for Feb/July starts; some open again in August. Most government programs require PR/citizenship.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
          {[
            { category: 'Product (Best eng culture)', companies: 'Atlassian, Canva, Seek, SafetyCulture', comp: '$90k – $110k' },
            { category: 'Banking (Stability + scale)', companies: 'CBA, ANZ, NAB, Westpac', comp: '$75k – $90k' },
            { category: 'Consulting (Variety + structure)', companies: 'Deloitte, Accenture, KPMG, PwC', comp: '$65k – $80k' },
            { category: 'Government (PR/Citizenship req.)', companies: 'ATO, Service NSW, DHS', comp: '$70k – $85k' },
          ].map(g => (
            <div key={g.category} style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '8px', padding: '0.8rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.3rem' }}>{g.category}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{g.companies}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{g.comp}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(30,122,82,0.06)', border: '1px solid rgba(30,122,82,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.5rem' }}>How to stand out</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {[
              'Apply before September — most programs fill early',
              'Cover letters that reference specific teams/products, not generic "passionate about technology"',
              'ICPC, hackathons, and personal projects matter more than GPA at product companies',
              'Communication skills heavily assessed at consulting firms — practice case interviews',
            ].map(tip => (
              <li key={tip} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'resume',
    icon: '📄',
    title: 'How to Write a Good Resume (AU Format)',
    subtitle: 'AU resumes differ from US and UK — know the rules',
    content: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div style={{ background: 'rgba(30,122,82,0.06)', border: '1px solid rgba(30,122,82,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.5rem' }}>✓ AU-Specific Rules</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {[
                '2 pages max for grads (1 page for internships)',
                'Include LinkedIn, GitHub, portfolio — NOT a photo',
                'No objective statement — lead with 3-line technical summary',
                'List projects before work experience if limited work history',
                'Quantify impact: "reduced API response time by 40%"',
              ].map(rule => (
                <li key={rule} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{rule}</li>
              ))}
            </ul>
          </div>
          <div style={{ background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem' }}>✗ Common Mistakes</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {[
                '"Team player", "Hard worker", "Fast learner" — replace with evidence',
                'Tables or multi-column layouts (fail ATS parsing)',
                'Custom fonts or excessive design (ATS strips it)',
                '"Microsoft Office" in skills section',
                'No keywords matching the job description',
              ].map(rule => (
                <li key={rule} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ background: 'rgba(200,138,20,0.07)', border: '1px solid rgba(200,138,20,0.25)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brown-mid)', marginBottom: '0.5rem' }}>Tailoring for AU Companies</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {[
              'Use the job description\'s exact keywords for ATS matching',
              'Applying to consultancy? Add client-facing or communication experience',
              'Applying to a bank? Mention security awareness, compliance, or financial domain if relevant',
              'Use "SEEK" for mid-tier roles — LinkedIn is better for product company roles',
            ].map(tip => (
              <li key={tip} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'market',
    icon: '📊',
    title: 'Australia Job Market Overview',
    subtitle: 'What the AU IT market actually looks like in 2025–2026',
    content: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
          {[
            { label: 'Sydney IT workers',    value: '~80,000',    color: 'var(--terracotta)' },
            { label: 'Melbourne IT workers', value: '~60,000',    color: 'var(--brown-mid)' },
            { label: 'AU vs US market size', value: '~1/10th',    color: 'var(--gold)' },
            { label: 'Avg. grad base (SWE)', value: '$75k–$100k', color: 'var(--jade)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>In-demand skills (2025–2026)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {['AWS', 'Azure', 'React / Next.js', 'TypeScript', 'Python', 'Kubernetes', 'Docker', 'Terraform', 'Cybersecurity', 'Data Engineering'].map(skill => (
              <span key={skill} style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '99px', background: 'rgba(192,40,28,0.06)', border: '1px solid rgba(192,40,28,0.2)', color: 'var(--terracotta)' }}>{skill}</span>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem' }}>Common misconceptions</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {[
              '"Just apply on LinkedIn" — most AU roles fill via referral or recruiter; direct apps have low conversion',
              '"I need 3 years experience" — grad programs explicitly hire 0 experience; apply anyway',
              'SEEK is more relevant than LinkedIn for AU mid-tier roles',
              'Most large AU companies sponsor 482 visas; smaller companies rarely do',
            ].map(m => (
              <li key={m} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'offer',
    icon: '📝',
    title: 'Typical IT Job Offer Components',
    subtitle: 'What to check before you sign — many grads miss these',
    content: (
      <div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          AU salaries include superannuation (11% employer contribution on top of base salary). Always
          compare "base + super" not just base. Ask explicitly: "Is this inclusive or exclusive of super?"
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
          {[
            { item: 'Base salary',       check: 'Inclusive or exclusive of super? Always ask explicitly' },
            { item: 'Superannuation',    check: '11% (2024) employer contribution — confirm it\'s on top of base' },
            { item: 'Bonus',             check: 'Discretionary vs guaranteed; what % of base; last year\'s payout rate' },
            { item: 'Equity / RSUs',     check: 'Vesting schedule (4yr / 1yr cliff standard); what happens if you leave early' },
            { item: 'Leave',             check: '20 days annual is standard; some companies offer 25+' },
            { item: 'Flexible work',     check: 'WFH days per week; core hours; flexible start/finish policy' },
            { item: 'Visa sponsorship',  check: '482/GTE support if on student visa — confirm in writing before accepting' },
            { item: 'Probation period',  check: 'Usually 3–6 months; limited redundancy protection during this period' },
            { item: 'L&D budget',        check: 'Annual training/certification budget ($1k–$5k at good companies)' },
          ].map(row => (
            <div key={row.item} style={{ display: 'flex', gap: '1rem', background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '8px', padding: '0.6rem 0.9rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '140px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--brown-dark)' }}>{row.item}</div>
              <div style={{ flex: 1, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{row.check}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(192,40,28,0.05)', border: '1px solid rgba(192,40,28,0.2)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem' }}>Red flags in offers</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {[
              'Salary quoted without clarifying super inclusion',
              '"Base + super" total below market rate for your level',
              'No WFH flexibility mentioned at all post-2022',
              'Bonus "at manager\'s discretion" with no documented history',
            ].map(flag => (
              <li key={flag} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{flag}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'career-path',
    icon: '🚀',
    title: 'How to Build Your Career Path',
    subtitle: 'The difference between $85k and $150k at 30 is rarely technical skill',
    content: (
      <div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          It&apos;s career management. Here's the compounding early-career strategy that works in Australia.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' }}>
          {[
            { years: 'Year 1–2', title: 'Learn deeply',          body: 'Choose a company that teaches fundamentals, not just ticket-resolution. Avoid body shops unless there is no other option.' },
            { years: 'Year 2–3', title: 'Demonstrate scope',     body: 'Take on something outside your job description. Lead a small project. Mentor an intern. Scope expansion is what triggers promotion.' },
            { years: 'Year 3–4', title: 'First job switch',      body: 'This is where the salary jump happens in AU. Staying past year 4 as a junior/mid usually means being underpaid vs market rate.' },
            { years: 'Year 4–6', title: 'Develop a specialisation', body: 'T-shaped skills: broad enough to work across the stack, deep in one area (distributed systems, ML infra, security, etc).' },
            { years: 'Year 6+',  title: 'Technical leadership',  body: 'Staff/principal IC track, or engineering management. Start building in public — GitHub, blog, conference talks.' },
          ].map((step) => (
            <div key={step.years} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                minWidth: '80px', textAlign: 'center', fontWeight: 700,
                fontSize: '0.75rem', color: 'var(--terracotta)',
                background: 'rgba(192,40,28,0.06)', border: '1px solid rgba(192,40,28,0.18)',
                borderRadius: '6px', padding: '0.4rem 0.5rem',
              }}>
                {step.years}
              </div>
              <div style={{ flex: 1, background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderLeft: '3px solid var(--gold)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brown-mid)', marginBottom: '0.5rem' }}>AU-Specific Advice</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {[
              'The AU network is small — treat every colleague as a future reference or hiring manager',
              'Canva, Atlassian, and CBA Tech all publish eng content — engage with it or contribute',
              'PR pathways: IT roles qualify under ANZSCO codes for 189/190/491 visas. Plan from year 1.',
              'CSIRO ON accelerator and Tech Council of Australia for those interested in the AU startup ecosystem',
            ].map(tip => (
              <li key={tip} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
];

export default function CareerGuide() {
  const [open, setOpen] = useState<string | null>('pathways');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', paddingBottom: '4rem' }}>
      <div style={{
        background: 'rgba(30,122,82,0.06)', border: '1px solid rgba(30,122,82,0.2)',
        borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '0.5rem',
        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <strong>Salary note:</strong> All figures are estimates for 2025–2026. Verify on SEEK Salary Insights
        or LinkedIn Salary before negotiating. Superannuation (11%) is on top of base unless stated otherwise.
      </div>

      {SECTIONS.map(section => (
        <div key={section.id} style={{
          background: 'var(--warm-white)',
          border: open === section.id ? '1.5px solid var(--terracotta)' : '1px solid var(--parchment)',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.15s ease',
        }}>
          <button
            id={section.id}
            onClick={() => setOpen(o => o === section.id ? null : section.id)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.8rem',
              padding: '1rem 1.2rem', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: '1rem', color: 'var(--brown-dark)' }}>
                {section.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {section.subtitle}
              </div>
            </div>
            <span style={{
              fontSize: '0.9rem', color: 'var(--text-muted)',
              transform: open === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
            }}>▾</span>
          </button>

          {open === section.id && (
            <div style={{ padding: '0 1.2rem 1.2rem' }}>
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
