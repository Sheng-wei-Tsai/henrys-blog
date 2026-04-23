'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CompanyLogo from '@/components/CompanyLogo';
import { SPONSORSHIP_RANKINGS } from './companies/data';

const SponsorshipCharts = dynamic(() => import('./SponsorshipCharts'), { ssr: false });

const VOLUME_COLOR: Record<string, string> = {
  'Very High':   '#dc2626',
  'High':        '#d97706',
  'Medium-High': '#0369a1',
  'Medium':      '#374151',
  'Low-Medium':  '#6b7280',
};

const CATEGORY_COLOR: Record<string, string> = {
  'IT Services':   '#7c3aed',
  'Consulting':    '#0369a1',
  'Product':       '#dc2626',
  'Finance':       '#d97706',
  'Enterprise Tech': '#374151',
};

export default function Sponsorship() {
  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* Data integrity disclaimer */}
      <div style={{
        background: 'var(--warm-white)', border: '1px solid var(--gold)',
        borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '1.5rem',
        fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65,
      }}>
        <strong>⚠ Data transparency note:</strong> The Australian government's{' '}
        <a href="https://www.data.gov.au/data/dataset/visa-temporary-work-skilled" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
          Temporary Work (Skilled) Visa dataset (data.gov.au)
        </a>{' '}
        provides industry-level statistics only — not employer-level counts. This ranking is compiled from:
        (1) Department of Home Affairs FOI document FA-230900293 listing active accredited sponsors (Sep 2023),
        (2) community-verified{' '}
        <a href="https://github.com/geshan/au-companies-providing-work-visa-sponsorship" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
          github.com/geshan/au-companies-providing-work-visa-sponsorship
        </a>,
        and (3) published migration agent data. Volume estimates are directional — treat as a guide, not an official count.
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'TSS/482 visa grants (FY2023)', value: '98,980', color: 'var(--terracotta)' },
          { label: 'Top occupation (2023)', value: 'Software Dev', color: '#7c3aed' },
          { label: 'Applications growth (2024–25)', value: '+53%', color: '#10b981' },
          { label: 'ICT share of 482 grants', value: '~12%', color: '#0369a1' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '10px', padding: '0.9rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <p style={{
        fontSize: '0.78rem', color: 'var(--text-muted)',
        marginBottom: '1.5rem', lineHeight: 1.5,
      }}>
        Source: Department of Home Affairs, Temporary Work (Skilled) Visa Program statistics 2023–2025.
        "Software and Applications Programmer" (ANZSCO 2613) was the #1 nominated occupation for 482 visa grants in FY2023.
      </p>

      {/* Rankings table */}
      {/* D3 Interactive Charts */}
      <SponsorshipCharts />

      <h3 style={{
        fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 700,
        color: 'var(--brown-dark)', marginBottom: '0.9rem', marginTop: '0.5rem',
      }}>
        Top IT Visa Sponsors in Australia (2020–2025)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {SPONSORSHIP_RANKINGS.map(row => (
          <div key={row.company} style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '10px', padding: '0.75rem 1rem',
            flexWrap: 'wrap',
          }}>
            {/* Rank */}
            <div style={{
              minWidth: '28px', textAlign: 'center', fontWeight: 700,
              fontSize: '0.85rem', color: row.rank <= 3 ? '#c8a800' : 'var(--text-muted)',
            }}>
              {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
            </div>

            {/* Company name */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--brown-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CompanyLogo name={row.company} size={28} variant="bare" />
                {row.company}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  padding: '0.1rem 0.5rem', borderRadius: '99px',
                  background: `${CATEGORY_COLOR[row.category] ?? '#374151'}15`,
                  color: CATEGORY_COLOR[row.category] ?? '#374151',
                  border: `1px solid ${CATEGORY_COLOR[row.category] ?? '#374151'}30`,
                }}>
                  {row.category}
                </span>
              </div>
            </div>

            {/* Volume badge */}
            <div style={{
              fontSize: '0.75rem', fontWeight: 700,
              padding: '0.2rem 0.6rem', borderRadius: '99px',
              background: `${VOLUME_COLOR[row.volume] ?? '#374151'}12`,
              color: VOLUME_COLOR[row.volume] ?? '#374151',
              border: `1px solid ${VOLUME_COLOR[row.volume] ?? '#374151'}30`,
              whiteSpace: 'nowrap',
            }}>
              {row.volume} volume
            </div>

            {/* Roles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', flex: 2, minWidth: '180px' }}>
              {row.topRoles.map(role => (
                <span key={role} style={{
                  fontSize: '0.73rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                  background: 'var(--parchment)', color: 'var(--text-muted)',
                }}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* How to use section */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{
          fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.9rem',
        }}>
          How to use this list as a visa applicant
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            {
              step: '1',
              title: 'Target Very High and High volume sponsors first',
              body: 'TCS, Accenture, Infosys, and Wipro are the most reliable visa pathways — they sponsor hundreds of ICT workers per year. Trade-off: lower comp and slower career growth.',
            },
            {
              step: '2',
              title: 'Check the Department of Home Affairs accredited sponsor status',
              body: 'Before applying, verify the company is an active Standard Business Sponsor or Accredited Sponsor at immi.homeaffairs.gov.au. Accredited sponsors get faster processing (~1 week vs 3+ months).',
            },
            {
              step: '3',
              title: 'Your occupation must be on the Core Skills Occupation List (CSOL)',
              body: 'Software and Applications Programmer (ANZSCO 2613), ICT Business Analyst, Systems/Network Engineer, and Cyber Security Analyst are all on the CSOL. Check immi.homeaffairs.gov.au for the current list.',
            },
            {
              step: '4',
              title: 'Skills Assessment may be required',
              body: 'For ICT occupations, ACS (Australian Computer Society) conducts skills assessments. This is separate from the visa sponsorship — your employer can sponsor you, but you may still need ACS assessment.',
            },
          ].map(item => (
            <div key={item.step} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              background: 'var(--warm-white)', border: '1px solid var(--parchment)',
              borderRadius: '8px', padding: '0.8rem 1rem',
            }}>
              <div style={{
                minWidth: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--terracotta)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div style={{
        marginTop: '2rem', background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '8px', padding: '0.8rem 1rem',
        fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong>Primary sources:</strong>{' '}
        <a href="https://www.data.gov.au/data/dataset/visa-temporary-work-skilled" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>data.gov.au — Temporary Work (Skilled) Visa Program dataset</a>
        {' · '}
        <a href="https://www.homeaffairs.gov.au/foi/files/2023/fa-230900293-document-released.PDF" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>DoHA FOI FA-230900293 — Active Accredited Sponsors list (Sep 2023)</a>
        {' · '}
        <a href="https://github.com/geshan/au-companies-providing-work-visa-sponsorship" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>Community-verified AU visa sponsorship database (GitHub)</a>
        {' · '}
        <a href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>Department of Home Affairs — Skills in Demand Visa</a>
      </div>
    </div>
  );
}
