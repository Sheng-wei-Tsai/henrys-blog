'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import CompanyTiers from './CompanyTiers';
import ITEcosystem from './ITEcosystem';
import CareerGuide from './CareerGuide';
import Sponsorship from './Sponsorship';

const JobMarketCharts = dynamic(() => import('./JobMarketCharts'), { ssr: false });
const SalaryChecker = dynamic(() => import('./salary-checker/SalaryChecker'), { ssr: false });
const GradProgramsContent = dynamic(
  () => import('./grad-programs/page').then(m => ({ default: m.GradProgramsContent })),
  { ssr: false }
);
const SkillMap = dynamic(() => import('./SkillMap'), { ssr: false });
const VisaGuide = dynamic(() => import('./VisaGuide'), { ssr: false });
const CompanyCompare = dynamic(() => import('./CompanyCompare'), { ssr: false });

type Tab = 'tiers' | 'ecosystem' | 'guide' | 'sponsorship' | 'market' | 'salary' | 'gradprograms' | 'skillmap' | 'visa' | 'compare';

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'tiers',        label: 'Company Tiers',     icon: '🏆', desc: 'From God Tier to Avoid — ranked by eng culture, growth & comp. Click any company for a full profile.' },
  { id: 'ecosystem',    label: 'IT Ecosystem',      icon: '🗂',  desc: 'How the 4 layers of AU IT connect — and which one to target.' },
  { id: 'sponsorship',  label: 'Visa Sponsors',     icon: '🛂', desc: 'Top 20 IT companies ranked by 482 visa sponsorship volume — with data sources.' },
  { id: 'guide',        label: 'Career Guide',      icon: '🚀', desc: 'Grad programs, resume rules, job market, offers & career path.' },
  { id: 'market',       label: 'Job Market',        icon: '📊', desc: 'ABS vacancy trends, ACS salary benchmarks, QILT graduate outcomes, and JSA skills shortage data — all in one place.' },
  { id: 'salary',       label: 'Salary Checker',    icon: '💰', desc: 'Paste your job offer — get an instant verdict against ACS market data and a negotiation script you can send today.' },
  { id: 'gradprograms', label: 'Grad Programs',     icon: '🎓', desc: 'Every major AU IT graduate program in one place — with live status, deadlines, and direct application links.' },
  { id: 'skillmap',     label: 'Skill Map',         icon: '🗺', desc: 'Select your skills and instantly see which AU IT roles you qualify for, salary ranges, and what to learn next.' },
{ id: 'visa',         label: 'Visa Guide',        icon: '🛂', desc: '482 / Skills in Demand visa — all 6 steps explained with timelines, costs, tips, and watch-outs for ICT workers.' },
  { id: 'compare',      label: 'Compare',           icon: '⚖️', desc: 'Pick 2–3 AU IT companies and compare them side-by-side across comp, culture, WFH, interview difficulty, and visa.' },
];

export default function AUInsightsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tiers');

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Header */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.9rem',
        }}>
          Australian IT Career Insights
        </h1>
        <p style={{
          color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '55ch',
        }}>
          Practical, opinionated guides to landing and growing an IT career in Australia —
          the things your university didn't teach you.
        </p>
      </section>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '99px',
              background: activeTab === tab.id ? 'var(--terracotta)' : 'var(--warm-white)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: activeTab === tab.id ? 'none' : '1px solid var(--parchment)',
              fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === tab.id ? '2px 2px 0 rgba(20,10,5,0.25)' : 'none',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab description */}
      {TABS.filter(t => t.id === activeTab).map(tab => (
        <p key={tab.id} style={{
          fontSize: '0.88rem', color: 'var(--text-muted)',
          marginBottom: '1.5rem', lineHeight: 1.6,
          borderLeft: '3px solid var(--terracotta)', paddingLeft: '0.9rem',
        }}>
          {tab.desc}
        </p>
      ))}

      {/* Tab content */}
      {activeTab === 'tiers'        && <CompanyTiers />}
      {activeTab === 'ecosystem'    && <ITEcosystem />}
      {activeTab === 'sponsorship'  && <Sponsorship />}
      {activeTab === 'guide'        && <CareerGuide />}
      {activeTab === 'market'       && <JobMarketCharts />}
      {activeTab === 'salary'       && (
        <div style={{ paddingBottom: '4rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem', lineHeight: 1.5 }}>
            International grads accept offers 15–30% below market on average. Don't be one of them.
          </p>
          <SalaryChecker />
          <div style={{
            marginTop: '3rem', background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '8px', padding: '0.9rem 1rem',
            fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            <strong>Data sources:</strong> Salary ranges from ACS / Think & Grow Australian Tech Salary Guide 2025
            and ACS Information Age (ia.acs.org.au). Company tier adjustments based on ACS sector premium data.
            All figures are base salary in AUD — superannuation (11.5%) is additional.
            Verify current rates on{' '}
            <a href="https://www.seek.com.au/career-advice/salary-insights" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
              SEEK Salary Insights
            </a>{' '}before negotiating.
          </div>
        </div>
      )}
      {activeTab === 'gradprograms' && <GradProgramsContent />}
      {activeTab === 'skillmap'    && <SkillMap />}
      {activeTab === 'visa'        && <VisaGuide />}
      {activeTab === 'compare'     && <CompanyCompare />}

    </div>
  );
}
