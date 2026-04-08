'use client';
import { useState } from 'react';

interface VisaStep {
  number: number;
  title: string;
  who: 'You' | 'Employer' | 'DHA';
  timeRange: string;
  cost: string;
  description: string;
  tips: string[];
  watchOuts: string[];
  documents: string[];
}

const STEPS: VisaStep[] = [
  {
    number: 1,
    title: 'Skills Assessment (ACS)',
    who: 'You',
    timeRange: '8–12 weeks',
    cost: '~$530',
    description: 'The Australian Computer Society (ACS) assesses whether your qualifications and experience meet the standard for your nominated occupation. This is required before lodging most skilled visa applications.',
    tips: [
      'Apply for the right ANZSCO code — most ICT roles map to codes starting with 261 or 262.',
      'Gather qualification transcripts, employment evidence, and reference letters early.',
      'RPL (Recognition of Prior Learning) is available if your degree is not in IT.',
    ],
    watchOuts: [
      'ACS assessments have a 12-month validity period — time your application carefully.',
      'A negative assessment can be appealed but takes additional months.',
      'Contractors and freelancers need to prove substantial ICT content in their work.',
    ],
    documents: ['Degree transcripts + English translation if applicable', 'Employment reference letters (on company letterhead)', 'Position descriptions for each role claimed', 'Passport copies'],
  },
  {
    number: 2,
    title: 'Employer Becomes Standard Business Sponsor',
    who: 'Employer',
    timeRange: '1–8 weeks',
    cost: '~$420 (employer pays)',
    description: 'Your employer must be approved as a Standard Business Sponsor (SBS) by the Department of Home Affairs before they can nominate you. Many large AU companies are already accredited sponsors.',
    tips: [
      'Ask HR early whether the company is already a Standard Business Sponsor — most tier-1 companies are.',
      'The employer\'s business must be "actively operating" — startups may face extra scrutiny.',
    ],
    watchOuts: [
      'SBS approval is not transferable — your visa is tied to the specific employer.',
      'Sponsors must meet training benchmarks (currently met by paying the Skilling Australians Fund levy).',
    ],
    documents: ['Business registration documents', 'Financial statements', 'Evidence of operating business'],
  },
  {
    number: 3,
    title: 'Nomination',
    who: 'Employer',
    timeRange: '4–12 weeks',
    cost: '~$330 (employer pays) + SAF levy',
    description: 'The employer nominates you for a specific position. The role must be on the Skills in Demand (SID) occupation list or Short-Term Skilled Occupation List (STSOL). The Skilling Australians Fund (SAF) levy applies.',
    tips: [
      'SAF levy is $1,200/year for small businesses or $1,800/year for larger — paid upfront for visa duration.',
      'The position must genuinely exist and the salary must meet the Temporary Skilled Migration Income Threshold (TSMIT — $73,150 AUD as of 2025).',
    ],
    watchOuts: [
      'Labour Market Testing (LMT) may be required — employer must advertise locally first for some roles.',
      'The nominated occupation must match your ACS skills assessment.',
    ],
    documents: ['Position description', 'Organisation chart', 'Evidence of advertising (if LMT required)', 'SAF levy payment'],
  },
  {
    number: 4,
    title: 'Visa Application Lodgement',
    who: 'You',
    timeRange: 'Same day',
    cost: '~$3,115',
    description: 'Once the nomination is approved (or simultaneously under priority processing), you lodge your 482 / Skills in Demand visa application through ImmiAccount. Pay the visa application charge at lodgement.',
    tips: [
      'Include all family members in the same application to avoid separate fees.',
      'Bridging visa A is granted immediately upon lodgement if you\'re already in Australia.',
    ],
    watchOuts: [
      'The $3,115 fee is non-refundable even if the visa is refused.',
      'Secondary applicants (family members) each incur additional charges (~$1,040 per adult).',
    ],
    documents: ['ACS skills assessment', 'Nomination approval (if sequential)', 'Passport', 'Relationship evidence (if including family)', 'English test results (IELTS/PTE/TOEFL)'],
  },
  {
    number: 5,
    title: 'Health & Character Checks',
    who: 'You',
    timeRange: '2–4 weeks',
    cost: '~$300–$500',
    description: 'The Department will request health examinations (via a panel physician) and police clearance certificates from all countries you\'ve lived in for 12+ months in the past 10 years.',
    tips: [
      'Book a panel physician appointment as soon as health is requested — popular clinics book out 2–3 weeks ahead.',
      'Results upload directly to ImmiAccount — no need to send documents to DHA separately.',
    ],
    watchOuts: [
      'Police certificates from some countries can take 6–8 weeks — request early.',
      'Undisclosed health conditions can lead to refusal; declare everything accurately.',
    ],
    documents: ['Health examination results', 'Police clearance certificates (all applicable countries)', 'Chest X-ray results'],
  },
  {
    number: 6,
    title: 'Visa Grant',
    who: 'DHA',
    timeRange: '4–24 weeks (median ~8 weeks ICT)',
    cost: 'No additional cost',
    description: 'The Department of Home Affairs reviews your complete application and grants the visa. ICT occupations on the Skills in Demand list typically receive priority processing. Accredited sponsor applications process faster.',
    tips: [
      'ICT roles often receive priority processing under the Skills in Demand stream.',
      'Applications sponsored by accredited sponsors typically process in ~8 weeks.',
      'You can work for the sponsoring employer on your bridging visa while waiting.',
    ],
    watchOuts: [
      'Complex cases (health, character, or missing docs) can extend to 6+ months.',
      'Do not resign from current employer before visa is granted.',
    ],
    documents: ['No new documents typically required at this stage'],
  },
];

const COST_BREAKDOWN = [
  { item: 'ACS Skills Assessment', payer: 'You', amount: '~$530' },
  { item: 'Visa Application Charge', payer: 'You', amount: '~$3,115' },
  { item: 'Health Examinations', payer: 'You', amount: '~$300–$500' },
  { item: 'Police Certificates', payer: 'You', amount: '~$50–$150' },
  { item: 'Standard Business Sponsor Fee', payer: 'Employer', amount: '~$420' },
  { item: 'Nomination Fee', payer: 'Employer', amount: '~$330' },
  { item: 'SAF Levy (2-yr visa)', payer: 'Employer', amount: '~$2,400–$3,600' },
];

export default function VisaGuide() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));

  function toggle(n: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header note */}
      <div style={{
        background: 'rgba(192,40,28,0.06)',
        border: '1px solid rgba(192,40,28,0.18)',
        borderRadius: '8px',
        padding: '0.9rem 1rem',
        marginBottom: '1.8rem',
        fontSize: '0.85rem',
        color: 'var(--brown-dark)',
        lineHeight: 1.6,
      }}>
        <strong>482 / Skills in Demand Visa — ICT pathway.</strong>{' '}
        Total process: <strong>3–18 months</strong> end-to-end.{' '}
        Your share of costs: <strong>~$3,965+</strong> (excludes employer-paid fees).{' '}
        This is a public reference only — always verify with a registered migration agent.
      </div>

      {/* Stepper */}
      <div style={{ position: 'relative' }}>
        {STEPS.map((step, idx) => {
          const isOpen = expanded.has(step.number);
          const isLast = idx === STEPS.length - 1;

          const whoBg = step.who === 'You'
            ? 'rgba(192,40,28,0.1)'
            : step.who === 'Employer'
            ? 'rgba(200,138,20,0.1)'
            : 'rgba(30,122,82,0.1)';
          const whoColor = step.who === 'You'
            ? 'var(--terracotta)'
            : step.who === 'Employer'
            ? 'var(--gold)'
            : 'var(--jade)';

          return (
            <div key={step.number} style={{ display: 'flex', gap: '1rem', marginBottom: isLast ? 0 : '0' }}>
              {/* Timeline column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={() => toggle(step.number)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isOpen ? 'var(--terracotta)' : 'var(--parchment)',
                    border: `2px solid ${isOpen ? 'var(--terracotta)' : 'var(--brown-light)'}`,
                    color: isOpen ? 'white' : 'var(--brown-dark)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {step.number}
                </button>
                {!isLast && (
                  <div style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '24px',
                    background: 'var(--parchment)',
                    margin: '4px 0',
                  }} />
                )}
              </div>

              {/* Content column */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : '1.2rem' }}>
                {/* Header row */}
                <button
                  onClick={() => toggle(step.number)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '0.2rem 0 0.5rem 0',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--brown-dark)', flex: 1, minWidth: '150px' }}>
                      {step.title}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        background: whoBg,
                        color: whoColor,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '99px',
                      }}>
                        {step.who}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⏱ {step.timeRange}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💰 {step.cost}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '0.9rem' }}>
                      {step.description}
                    </p>

                    {/* Tips */}
                    {step.tips.length > 0 && (
                      <div style={{
                        background: 'rgba(30,122,82,0.07)',
                        border: '1px solid rgba(30,122,82,0.18)',
                        borderRadius: '6px',
                        padding: '0.7rem 0.9rem',
                        marginBottom: '0.7rem',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Tips
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                          {step.tips.map((tip, i) => (
                            <li key={i} style={{ fontSize: '0.82rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '0.2rem' }}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Watch-outs */}
                    {step.watchOuts.length > 0 && (
                      <div style={{
                        background: 'rgba(192,40,28,0.06)',
                        border: '1px solid rgba(192,40,28,0.15)',
                        borderRadius: '6px',
                        padding: '0.7rem 0.9rem',
                        marginBottom: '0.7rem',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Watch out
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                          {step.watchOuts.map((w, i) => (
                            <li key={i} style={{ fontSize: '0.82rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '0.2rem' }}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Documents
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {step.documents.map((doc, i) => (
                          <span key={i} style={{
                            background: 'var(--warm-white)',
                            border: '1px solid var(--parchment)',
                            borderRadius: '4px',
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                          }}>
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost breakdown table */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.8rem' }}>
          Cost Breakdown
        </h3>
        <div style={{ border: '1px solid var(--parchment)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--parchment)' }}>
                <th style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontWeight: 700, color: 'var(--brown-dark)' }}>Item</th>
                <th style={{ padding: '0.6rem 0.9rem', textAlign: 'center', fontWeight: 700, color: 'var(--brown-dark)' }}>Paid by</th>
                <th style={{ padding: '0.6rem 0.9rem', textAlign: 'right', fontWeight: 700, color: 'var(--brown-dark)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {COST_BREAKDOWN.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--parchment)', background: i % 2 === 0 ? 'var(--warm-white)' : 'white' }}>
                  <td style={{ padding: '0.55rem 0.9rem', color: 'var(--brown-dark)' }}>{row.item}</td>
                  <td style={{ padding: '0.55rem 0.9rem', textAlign: 'center' }}>
                    <span style={{
                      background: row.payer === 'You' ? 'rgba(192,40,28,0.1)' : 'rgba(200,138,20,0.1)',
                      color: row.payer === 'You' ? 'var(--terracotta)' : 'var(--gold)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '99px',
                    }}>
                      {row.payer}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 0.9rem', textAlign: 'right', fontWeight: 600, color: 'var(--brown-dark)' }}>{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.5 }}>
          All fees as of 2025. Subject to change. Verify at immi.homeaffairs.gov.au before applying.
        </p>
      </div>
    </div>
  );
}
