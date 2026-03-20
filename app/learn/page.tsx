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
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Header */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '3rem' }}>
        <p className="animate-fade-up font-handwritten" style={{
          fontSize: '1.1rem', color: 'var(--terracotta)', marginBottom: '0.6rem',
        }}>
          Your roadmap to employment 🗺️
        </p>
        <h1 className="animate-fade-up delay-1" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '1.1rem',
        }}>
          IT Career Pathways
        </h1>
        <p className="animate-fade-up delay-2" style={{
          color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, maxWidth: '55ch',
        }}>
          Curated skill roadmaps for landing your first IT job in Australia. Each path uses
          spaced repetition — a scientifically proven method to actually remember what you learn.
        </p>
      </section>

      {/* How it works */}
      <section className="animate-fade-up" style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '16px', padding: '1.5rem 1.8rem', marginBottom: '3rem',
      }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '1rem' }}>
          🧠 The science behind the learning plan
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { step: '1', label: 'Learn a skill', desc: 'Study the topic using the curated resources' },
            { step: '2', label: 'Build a project', desc: 'Solidify knowledge by actually building something' },
            { step: '3', label: 'Mark as learned', desc: 'Your first review is scheduled for tomorrow' },
            { step: '4', label: 'Spaced reviews', desc: 'Day 1 → 3 → 7 → 14 → 30 → Mastered ✓' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '0.8rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--terracotta)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, marginTop: '0.1rem',
              }}>{item.step}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '0.15rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', borderTop: '1px solid var(--parchment)', paddingTop: '0.8rem' }}>
          Based on the <strong style={{ color: 'var(--text-secondary)' }}>Ebbinghaus forgetting curve</strong> — research from the 1880s shows memory decays exponentially unless reviewed at increasing intervals. Anki, Duolingo, and medical schools all use this principle.
        </p>
      </section>

      {/* Path cards */}
      <section style={{ paddingBottom: '5rem' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.3rem', color: 'var(--brown-dark)', marginBottom: '1.2rem' }}>
          Choose your path
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SKILL_PATHS.map(path => {
            const totalSkills = path.phases.flatMap(p => p.skills).length;
            return (
              <Link key={path.id} href={`/learn/${path.id}`} className="path-card-link" style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  background: 'var(--warm-white)', border: '1px solid var(--parchment)',
                  borderRadius: '16px', padding: '1.5rem 1.8rem',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>{path.emoji}</span>
                        <div>
                          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.1rem' }}>
                            {path.title}
                          </h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: demandColor[path.demand], background: `${demandColor[path.demand]}18`, padding: '0.15em 0.6em', borderRadius: '99px' }}>
                            {path.demand} Demand
                          </span>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                        {path.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Timeline',   value: path.timeline },
                          { label: 'Avg Salary', value: path.avgSalary },
                          { label: 'Skills',     value: `${totalSkills} skills` },
                          { label: 'Phases',     value: `${path.phases.length} phases` },
                        ].map(stat => (
                          <div key={stat.label}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--terracotta)', fontWeight: 500, flexShrink: 0 }}>
                      Start path →
                    </div>
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
