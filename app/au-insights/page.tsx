'use client';
import { useState } from 'react';
import CompanyTiers from './CompanyTiers';
import ITEcosystem from './ITEcosystem';
import CareerGuide from './CareerGuide';
import Sponsorship from './Sponsorship';

type Tab = 'tiers' | 'ecosystem' | 'guide' | 'sponsorship';

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'tiers',       label: 'Company Tiers',  icon: '🏆', desc: 'From God Tier to Avoid — ranked by eng culture, growth & comp. Click any company for a full profile.' },
  { id: 'ecosystem',   label: 'IT Ecosystem',   icon: '🗂',  desc: 'How the 4 layers of AU IT connect — and which one to target' },
  { id: 'sponsorship', label: 'Visa Sponsors',  icon: '🛂', desc: 'Top 20 IT companies ranked by 482 visa sponsorship volume — with data sources' },
  { id: 'guide',       label: 'Career Guide',   icon: '🚀', desc: 'Grad programs, resume rules, job market, offers & career path' },
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
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
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
      {activeTab === 'tiers'       && <CompanyTiers />}
      {activeTab === 'ecosystem'   && <ITEcosystem />}
      {activeTab === 'sponsorship' && <Sponsorship />}
      {activeTab === 'guide'       && <CareerGuide />}

    </div>
  );
}
