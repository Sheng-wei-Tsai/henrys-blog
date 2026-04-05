import { Metadata } from 'next';
import TamaSection from '@/components/tama/TamaSection';

export const metadata: Metadata = { title: 'About — Henry Tsai' };

const stack = [
  'TypeScript', 'React', 'Next.js', 'React Native',
  'Node.js', 'Python', 'PostgreSQL', 'Supabase',
  'Docker', 'OpenAI API', 'Claude API',
];

const sectionMarker = (color: string) => (
  <span style={{
    display: 'inline-block', width: '12px', height: '12px',
    background: color, borderRadius: '2px',
    border: '2px solid var(--ink)', boxShadow: '1px 1px 0 var(--ink)',
    flexShrink: 0,
  }} />
);

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.5rem' }}>

      {/* Hero */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '3rem' }}>
        <p className="animate-fade-up font-handwritten" style={{
          fontSize: '1.25rem', color: 'var(--vermilion)', marginBottom: '0.8rem',
        }}>
          嗨，我是 Henry 👋
        </p>
        <h1 className="animate-fade-up delay-1" style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          color: 'var(--brown-dark)',
          lineHeight: 1.1,
          marginBottom: '0.6rem',
          letterSpacing: '-0.03em',
        }}>
          Full Stack Developer<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--vermilion), var(--gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>based in Brisbane</span>
        </h1>
        <div style={{
          width: '48px', height: '4px', borderRadius: '2px',
          background: 'var(--vermilion)',
          boxShadow: '2px 2px 0 rgba(20,10,5,0.2)',
          marginBottom: '1.2rem',
        }} />
        <p className="animate-fade-up delay-2" style={{
          color: 'var(--text-secondary)', fontSize: '1.05rem',
          lineHeight: 1.8, maxWidth: '50ch',
        }}>
          I graduated with a Master of Computer Science from QUT in 2024 and have been building
          real-world products ever since — from AI-powered tools to mobile apps.
        </p>
      </section>

      {/* TamaAussie virtual pet */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{
          fontFamily: "'Lora', serif", fontSize: '1.4rem',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '0.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {sectionMarker('var(--jade)')}
          TamaAussie
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          A 90s-style virtual pet handheld. Hatch an egg, feed it by reading posts,
          play mini-games, and evolve it into an Australian native — Quokka, Platypus,
          Kookaburra and more. Neglect it at your peril.
        </p>
        <TamaSection />
      </div>

      {/* My Story */}
      <section className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <h2 style={{
          fontFamily: "'Lora', serif", fontSize: '1.4rem',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {sectionMarker('var(--vermilion)')}
          My story
        </h2>
        <div style={{
          background: 'var(--warm-white)',
          border: 'var(--panel-border)',
          borderRadius: '8px',
          boxShadow: 'var(--panel-shadow)',
          padding: '1.6rem',
          color: 'var(--text-secondary)', lineHeight: 1.85,
          display: 'flex', flexDirection: 'column', gap: '1.1rem',
          fontSize: '1rem',
        }}>
          <p style={{ margin: 0 }}>
            I came to Brisbane from Taiwan to study computer science, and somewhere between late-night
            debugging sessions and building my first full-stack app, I realised this is exactly what I
            want to do with my life.
          </p>
          <p style={{ margin: 0 }}>
            These days I&apos;m deeply interested in AI integration — not just calling APIs, but thinking
            about how LLMs can genuinely improve the tools developers and job-seekers use. This site
            itself is a live experiment: it has a job search engine, an AI cover letter generator, and
            an automated weekly digest of AI research. All built by me, all running in production.
          </p>
          <p style={{ margin: 0 }}>
            I&apos;m actively looking for junior or graduate developer roles in Brisbane (or remote).
            I have full Australian work rights on a 485 Graduate Visa. If you&apos;re hiring, I&apos;d love to chat. ☕
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <h2 style={{
          fontFamily: "'Lora', serif", fontSize: '1.4rem',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {sectionMarker('var(--gold)')}
          What I work with
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {stack.map(s => (
            <span key={s} style={{
              background:   'var(--warm-white)',
              border:       'var(--panel-border)',
              boxShadow:    '2px 2px 0 var(--ink)',
              padding:      '0.32em 0.85em',
              borderRadius: '4px',
              fontSize:     '0.86rem',
              color:        'var(--brown-mid)',
              fontWeight:   600,
              transition:   'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s ease',
            }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Connect */}
      <section className="animate-fade-up" style={{ marginBottom: '5rem' }}>
        <h2 style={{
          fontFamily: "'Lora', serif", fontSize: '1.4rem',
          fontWeight: 700, color: 'var(--brown-dark)',
          marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {sectionMarker('var(--jade)')}
          Let&apos;s connect
        </h2>
        <div style={{
          background:   'var(--warm-white)',
          border:       'var(--panel-border)',
          borderRadius: '8px',
          boxShadow:    'var(--panel-shadow)',
          padding:      '2rem',
        }}>
          <p className="font-handwritten" style={{
            fontSize: '1.3rem', color: 'var(--vermilion)', marginBottom: '0.5rem',
          }}>
            Open to work in Brisbane 🇦🇺
          </p>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.95rem',
            marginBottom: '1.5rem', lineHeight: 1.7,
          }}>
            Whether you have a role in mind, want to collaborate, or just want to talk tech
            — my inbox is open.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a href="https://github.com/Sheng-wei-Tsai" target="_blank" rel="noopener noreferrer"
              style={outlineBtn}>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/henry-tsai-973438294" target="_blank" rel="noopener noreferrer"
              style={outlineBtn}>
              LinkedIn
            </a>
            <a href="mailto:henrytsaiqut@gmail.com"
              style={{ ...outlineBtn, background: 'var(--vermilion)', color: 'white', borderColor: 'var(--ink)' }}>
              Email me →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const outlineBtn: React.CSSProperties = {
  background:     'var(--warm-white)',
  color:          'var(--brown-mid)',
  border:         'var(--panel-border)',
  boxShadow:      '3px 3px 0 var(--ink)',
  padding:        '0.5em 1.2em',
  borderRadius:   '4px',
  textDecoration: 'none',
  fontSize:       '0.88rem',
  fontWeight:     700,
  transition:     'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s ease',
  display:        'inline-block',
};
