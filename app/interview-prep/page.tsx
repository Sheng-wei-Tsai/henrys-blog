import { Metadata } from 'next';
import Link from 'next/link';
import { INTERVIEW_ROLES } from '@/lib/interview-roles';
import CompanyLinks from '@/components/CompanyLinks';

export const metadata: Metadata = {
  title: 'Interview Prep — Australian IT Roles',
  description: 'Practice the most common interview questions for Australian IT roles with AI feedback and XP gamification.',
};

const demandColor: Record<string, string> = {
  'Very High': '#10b981',
  'High':      '#f59e0b',
  'Medium':    '#6b7280',
};

const difficultyColor: Record<string, string> = {
  'Entry':  '#3b82f6',
  'Mid':    '#8b5cf6',
  'Senior': '#ef4444',
};

export default function InterviewPrepPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Header */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '3rem' }}>
        <h1 className="animate-fade-up" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700,
          color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '1rem',
        }}>
          Interview Prep
        </h1>
        <p className="animate-fade-up delay-1" style={{
          color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '54ch',
        }}>
          Pick a role, work through 10 real interview questions, and get AI feedback on your answers.
          Earn XP as you progress from Beginner to Interview Ready.
        </p>
      </section>

      {/* How it works */}
      <section className="animate-fade-up" style={{
        borderTop: '1px solid var(--parchment)',
        borderBottom: '1px solid var(--parchment)',
        padding: '1.5rem 0', marginBottom: '3rem',
      }}>
        <p style={{
          fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem',
        }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.2rem' }}>
          {[
            { n: '1', label: 'Pick a role',       body: 'Choose the job type you\'re targeting in the Australian market.' },
            { n: '2', label: 'Discover & Learn',  body: 'Read each question, understand the key concepts, and see a framework.' },
            { n: '3', label: 'Practice',           body: 'Write your answer, then get streamed AI feedback with a score.' },
            { n: '4', label: 'Earn XP',            body: 'Progress through levels from Beginner to Interview Ready.' },
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
      </section>

      {/* Role grid */}
      <section style={{ paddingBottom: '5rem' }}>
        <p style={{
          fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.2rem',
        }}>
          Choose a role
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {INTERVIEW_ROLES.map(role => (
            <Link key={role.id} href={`/interview-prep/${role.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                background: 'var(--warm-white)',
                border: '1px solid var(--parchment)',
                borderRadius: '14px',
                padding: '1.4rem',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{role.emoji}</span>
                    <div>
                      <h3 style={{
                        fontFamily: "'Lora', serif", fontSize: '0.97rem', fontWeight: 700,
                        color: 'var(--brown-dark)', marginBottom: '0.2rem',
                      }}>
                        {role.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          color: difficultyColor[role.difficulty],
                          background: `${difficultyColor[role.difficulty]}15`,
                          padding: '0.15em 0.5em', borderRadius: '4px',
                        }}>
                          {role.difficulty}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          color: demandColor[role.demand],
                          background: `${demandColor[role.demand]}15`,
                          padding: '0.15em 0.5em', borderRadius: '4px',
                        }}>
                          {role.demand} Demand
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.83rem', color: 'var(--text-secondary)',
                  lineHeight: 1.6, marginBottom: '0.9rem',
                }}>
                  {role.description}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.9rem' }}>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Salary</div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{role.salaryRange}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Questions</div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{role.questionCount} questions</div>
                  </div>
                </div>

                {/* Companies */}
                <CompanyLinks companies={role.companies} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
