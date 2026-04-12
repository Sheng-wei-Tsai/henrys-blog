import { Metadata } from 'next';
import Link from 'next/link';
import NetworkingClient from './NetworkingClient';

export const metadata: Metadata = {
  title:       'Networking Hub — Australian IT Career Guide | TechPath AU',
  description: 'LinkedIn templates, GitHub portfolio checklist, AU tech meetup map, and a 30-day networking action plan for international IT graduates in Australia.',
  alternates:  { canonical: 'https://henrysdigitallife.com/interview-prep/networking' },
};

export default function NetworkingPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <section style={{ paddingTop: '4.5rem', paddingBottom: '2.5rem' }}>
        <Link href="/interview-prep" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.2rem' }}>
          ← Interview Prep
        </Link>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
          🤝 Networking Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '56ch' }}>
          For international IT graduates, networking is the highest-leverage career activity in Australia — yet nobody teaches you how. This is the guide we wish existed.
        </p>
      </section>

      {/* Sections */}
      <div style={{ paddingBottom: '6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* 1. LinkedIn */}
        <details open style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
          <summary style={{ padding: '1.1rem 1.4rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none', fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
            <span style={{ fontSize: '1.4rem' }}>💼</span>
            <span style={{ flex: 1 }}>LinkedIn Optimisation for AU Market</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▾</span>
          </summary>
          <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingTop: '1.1rem' }}>

              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Headline templates</p>
                {[
                  'Junior Full Stack Developer | React · Node.js · AWS | Open to AU opportunities',
                  'Software Engineer Graduate | University of Melbourne | Seeking 2025 grad roles in Sydney',
                  'Data Engineer | Python · dbt · BigQuery | 485 Visa — Full work rights',
                ].map((t, i) => (
                  <div key={i} style={{ background: 'var(--cream)', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{t}"
                  </div>
                ))}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Tip: include your visa status in the headline if you have full work rights — it removes friction for recruiters.</p>
              </div>

              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>AU-specific profile checklist</p>
                {[
                  'Location set to your AU city (not your home country)',
                  '"Open to work" badge enabled — recruiters actively use this in AU',
                  'About section mentions AU work rights / visa status in first 2 lines',
                  'At least 3 project descriptions with measurable outcomes (not just responsibilities)',
                  'Education section includes your AU institution prominently',
                  'Skills section includes AU-relevant certifications (AWS, Azure, Google Cloud)',
                  'Recommendations from professors, classmates, or part-time supervisors',
                  'Profile photo — 400x400px, plain background, approachable expression',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#14b8a6', fontSize: '0.85rem', marginTop: '0.1rem', flexShrink: 0 }}>☐</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Cold outreach templates</p>
                <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TO A RECRUITER</p>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
                    "Hi [Name], I came across [Company] while researching AU tech companies and I'm genuinely interested in [specific team/product]. I'm a [role] graduate with [key skills] currently on a [visa type] with full work rights. Would you be open to a brief chat about any upcoming opportunities? Happy to share my resume. Thanks for your time."
                  </p>
                </div>
                <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TO A DEVELOPER YOU ADMIRE</p>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
                    "Hi [Name], I read your post about [specific thing they shared] and it really clicked for me — I've been working through a similar problem. I'm an international grad building my career in AU [stack/role]. Would you be open to a 20-minute coffee chat? I'd love to hear about your path at [Company]. No agenda beyond learning from someone doing work I admire."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* 2. GitHub */}
        <details style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
          <summary style={{ padding: '1.1rem 1.4rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none', fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
            <span style={{ fontSize: '1.4rem' }}>🐙</span>
            <span style={{ flex: 1 }}>GitHub Portfolio Checklist</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▾</span>
          </summary>
          <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '1.1rem', marginBottom: '1rem' }}>
              Australian hiring managers spend <strong>under 2 minutes</strong> on a GitHub profile. Pin 2–3 repos, make them immediately readable, and ensure the contribution graph shows recent activity.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Profile page</p>
                {[
                  'Profile README with 3-line bio, tech stack icons, and contact links',
                  '2–3 pinned repos — your best work, not your oldest',
                  'Contribution graph has activity in the last 30 days',
                  'Clear display name and location set to your AU city',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#14b8a6', fontSize: '0.85rem', flexShrink: 0 }}>☐</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Each pinned repo</p>
                {[
                  'README with what it does, why you built it, and how to run it',
                  'Screenshot or GIF of the UI / output if applicable',
                  'Tech stack badge list at the top',
                  'Clear, descriptive commit messages (not "fix" or "update")',
                  'Live demo link if deployed (Vercel, Render, fly.io)',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#14b8a6', fontSize: '0.85rem', flexShrink: 0 }}>☐</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.82rem', color: '#0f766e', lineHeight: 1.6 }}>
                <strong>What AU hiring managers actually check:</strong> They scan the README first. If it's missing or just auto-generated, they close the tab. A deployed live link instantly doubles your chances of getting a callback.
              </p>
            </div>
          </div>
        </details>

        {/* 3. AU Meetups */}
        <details style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
          <summary style={{ padding: '1.1rem 1.4rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none', fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
            <span style={{ fontSize: '1.4rem' }}>📍</span>
            <span style={{ flex: 1 }}>AU Tech Meetups</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▾</span>
          </summary>
          <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '1.1rem', marginBottom: '1rem' }}>
              Australian tech meetups are genuinely inclusive — attendees actively talk to newcomers. Arrive early, introduce yourself to the organiser, and collect 2 business cards per event.
            </p>

            {[
              {
                city: 'Sydney',
                meetups: [
                  { name: 'Sydney JS', focus: 'JavaScript & frontend', url: 'https://www.meetup.com/sydneyjs/' },
                  { name: 'AWS Sydney User Group', focus: 'AWS & cloud', url: 'https://www.meetup.com/sydney-aws-user-group/' },
                  { name: 'Sydney Python', focus: 'Python & data', url: 'https://www.meetup.com/sydney-python-user-group/' },
                  { name: 'Data Engineering Sydney', focus: 'Data pipelines & platform', url: 'https://www.meetup.com/data-engineering-au/' },
                ],
              },
              {
                city: 'Melbourne',
                meetups: [
                  { name: 'MelbJS', focus: 'JavaScript', url: 'https://www.meetup.com/melbjs/' },
                  { name: 'Melbourne AWS User Group', focus: 'AWS & cloud', url: 'https://www.meetup.com/melbourne-aws-user-group/' },
                  { name: 'Melbourne Golang', focus: 'Go programming', url: 'https://www.meetup.com/golang-mel/' },
                  { name: 'MLOps Melbourne', focus: 'ML & data', url: 'https://www.meetup.com/mlops-melbourne/' },
                ],
              },
              {
                city: 'Brisbane',
                meetups: [
                  { name: 'BrisJS', focus: 'JavaScript & web', url: 'https://www.meetup.com/brisbane-js/' },
                  { name: 'Brisbane AWS User Group', focus: 'AWS & cloud', url: 'https://www.meetup.com/aws-user-group-brisbane/' },
                  { name: 'Brisbane Python', focus: 'Python', url: 'https://www.meetup.com/brisbane-python-user-group/' },
                ],
              },
              {
                city: 'Perth & Adelaide',
                meetups: [
                  { name: 'PerthWeb', focus: 'Web dev, Perth', url: 'https://www.meetup.com/perthweb/' },
                  { name: 'AWS User Group Perth', focus: 'AWS, Perth', url: 'https://www.meetup.com/aws-user-group-perth/' },
                  { name: 'Adelaide .NET', focus: '.NET & enterprise, Adelaide', url: 'https://www.meetup.com/adelaidedotnet/' },
                ],
              },
            ].map(city => (
              <div key={city.city} style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{city.city}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {city.meetups.map(m => (
                    <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--cream)', borderRadius: '8px', textDecoration: 'none' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brown-dark)', flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.focus}</span>
                      <span style={{ fontSize: '0.75rem', color: '#14b8a6' }}>→</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ background: 'rgba(200,138,20,0.07)', border: '1px solid rgba(200,138,20,0.2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <p style={{ fontSize: '0.82rem', color: '#b45309', lineHeight: 1.6 }}>
                <strong>Meetup strategy:</strong> Don't pitch yourself. Ask questions, listen, and follow up on LinkedIn the same night while they remember you. One genuine connection beats 10 business cards.
              </p>
            </div>
          </div>
        </details>

        {/* 4. 15 things */}
        <details style={{ background: 'var(--warm-white)', border: '1px solid var(--parchment)', borderRadius: '14px', overflow: 'hidden' }}>
          <summary style={{ padding: '1.1rem 1.4rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none', fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
            <span style={{ fontSize: '1.4rem' }}>🇦🇺</span>
            <span style={{ flex: 1 }}>15 Things Nobody Tells New Grads</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▾</span>
          </summary>
          <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--parchment)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '1.1rem', marginBottom: '1rem' }}>
              Australian workplace culture is genuinely different from most other countries. These are the unspoken rules that international grads learn the hard way.
            </p>
            {[
              { n: 1, title: 'Hierarchy is flat — but seniority still matters', body: 'You\'ll call your manager by first name from day one. But "flat hierarchy" doesn\'t mean your opinion carries equal weight immediately — earn credibility before challenging direction.' },
              { n: 2, title: '"She\'ll be right" culture is real', body: 'Australians are generally more relaxed about minor problems. Don\'t over-escalate small issues — read whether something needs a Slack message or a full meeting.' },
              { n: 3, title: 'Direct but not blunt', body: 'Aussies give honest feedback, but there\'s still a softening layer. "That\'s interesting" can mean polite disagreement. Learn to read subtext.' },
              { n: 4, title: 'Team lunches and Friday drinks are informal but strategic', body: 'These are when relationships actually form. You don\'t have to drink. But showing up consistently matters for how you\'re perceived.' },
              { n: 5, title: 'Don\'t brag — let your work speak', body: 'Australian culture strongly discourages self-promotion. Describe what your team did, not what you personally achieved. Your manager notices.' },
              { n: 6, title: '"Arvo" = afternoon', body: '"Let\'s catch up this arvo" means this afternoon. You\'ll hear arvo, barbie, servo, bottle-o. Just smile and learn the vocab.' },
              { n: 7, title: 'Work-life balance is non-negotiable for most teams', body: 'In most AU tech companies, leaving at 5:30pm is normal and respected. Don\'t stay late to impress — it can signal poor time management.' },
              { n: 8, title: 'Superannuation is not optional and not a bonus', body: '11.5% super is mandatory and on top of your salary. It\'s not a perk — it\'s law. Any employer who tries to include it in your quoted salary is underpaying you.' },
              { n: 9, title: 'Asking for help is a sign of maturity, not weakness', body: 'In many cultures, asking for help feels shameful. In AU tech teams, getting unstuck quickly by asking is highly valued over silently struggling for hours.' },
              { n: 10, title: 'Your visa status shouldn\'t define how you negotiate', body: 'International candidates often accept low offers because they feel they "should be grateful." You have the same right to negotiate as any local graduate.' },
              { n: 11, title: 'Written communication is still king', body: 'Australian teams like documentation. Write good pull request descriptions. Summarise verbal decisions in Slack. It shows professionalism and builds trust.' },
              { n: 12, title: 'The two-week notice period is standard', body: 'In AU, two weeks is the minimum legal notice for most roles. Longer tenures may expect 4 weeks. This affects your start-date negotiations.' },
              { n: 13, title: 'Casual Friday is every day in tech', body: 'Most Sydney and Melbourne tech offices are jeans-and-t-shirt culture. Overdressing can signal cultural misalignment. When in doubt, match what you see on the company website.' },
              { n: 14, title: 'Coffee culture runs the relationship economy', body: '"Let\'s grab a coffee" is the primary networking mechanism in Australian professional life. One 20-minute coffee chat is worth more than 10 LinkedIn messages.' },
              { n: 15, title: 'Mentors are everywhere and generally happy to help', body: 'Australian tech professionals are unusually generous with their time. A genuine, specific ask for a career conversation has a high acceptance rate — don\'t underestimate this.' },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#0d9488', flexShrink: 0 }}>{item.n}</span>
                <div>
                  <p style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.2rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* 5. 30-day plan — client component for checklist persistence */}
        <NetworkingClient />

      </div>
    </div>
  );
}
