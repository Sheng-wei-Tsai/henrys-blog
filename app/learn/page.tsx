import { Metadata } from 'next';
import Link from 'next/link';
import { SKILL_PATHS } from '@/lib/skill-paths';

export const metadata: Metadata = { title: 'IT Career Pathways' };

const demandColor: Record<string, string> = {
  'Very High': '#10b981',
  'High':      '#f59e0b',
  'Medium':    '#6b7280',
};

export default function LearnPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Header */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '3rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '1rem',
        }}>
          IT Career Pathways
        </h1>
        <p className="animate-fade-up delay-1" style={{
          color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '52ch',
        }}>
          Skill roadmaps for landing your first IT job in Australia. Each path is a checklist —
          tick off what you know, and the system reminds you to review it at the right intervals
          so it actually sticks.
        </p>
      </section>

      {/* How it works */}
      <section className="animate-fade-up" style={{
        borderTop: '1px solid var(--parchment)',
        borderBottom: '1px solid var(--parchment)',
        padding: '1.5rem 0', marginBottom: '3rem',
      }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.2rem' }}>
          {[
            { n: '1', label: 'Tick a skill',      body: 'Check it off when you feel confident with the material.' },
            { n: '2', label: 'Build the project', body: 'Each skill has a small project. Building is how you really learn.' },
            { n: '3', label: 'Get reminded',      body: 'You\'ll get a browser notification at day 3 and day 7 to review.' },
            { n: '4', label: 'Review five times', body: 'After five reviews spread over 30 days, it\'s marked as mastered.' },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{
                fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 700,
                color: 'var(--terracotta)',
              }}>
                {item.n}.
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{item.label}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.body}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.2rem', lineHeight: 1.6 }}>
          This is based on the Ebbinghaus forgetting curve — memory fades fast unless revisited at increasing intervals.
          The same method is used by Anki, Duolingo, and medical students worldwide.
        </p>
      </section>

      {/* Path list */}
      <section style={{ paddingBottom: '5rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.2rem' }}>
          Choose a path
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
          {SKILL_PATHS.map((path, i) => {
            const totalSkills = path.phases.flatMap(p => p.skills).length;
            return (
              <Link key={path.id} href={`/learn/${path.id}`} className="path-card-link" style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  background: 'var(--warm-white)',
                  padding: '1.4rem 1.6rem',
                  borderBottom: i < SKILL_PATHS.length - 1 ? '1px solid var(--parchment)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
                          {path.title}
                        </h3>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700,
                          color: demandColor[path.demand],
                          background: `${demandColor[path.demand]}15`,
                          padding: '0.15em 0.55em', borderRadius: '4px',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {path.demand} Demand
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.6, marginBottom: '0.9rem' }}>
                        {path.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1.4rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Timeline',   value: path.timeline },
                          { label: 'Avg salary', value: path.avgSalary },
                          { label: 'Skills',     value: `${totalSkills} total` },
                        ].map(stat => (
                          <div key={stat.label}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.2rem' }}>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
