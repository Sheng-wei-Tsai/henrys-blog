// Company interview intel — curated process/style data for top AU tech companies
export const COMPANY_INTEL: Record<string, {
  process:         string;
  style:           string;
  tip:             string;
  interviewLength: string;
}> = {
  'Atlassian':         { process: '4 rounds: recruiter screen → technical (take-home or live coding) → system design → values/culture', style: 'Collaborative — they encourage thinking aloud; no trick questions; strong focus on STAR behavioural answers', tip: 'Reference their products (Jira, Confluence, Bitbucket) with genuine detail; they love hearing how you\'ve actually used them', interviewLength: '3–5 weeks' },
  'Canva':             { process: '3–4 rounds: recruiter call → technical challenge (48h take-home) → tech interview → culture fit', style: 'Fast-paced, design-aware; expect questions about scale and user impact', tip: 'Show you care about the end user experience, not just the code; mention Canva features you\'ve used personally', interviewLength: '2–3 weeks' },
  'REA Group':         { process: '3 rounds: phone screen → technical pair programming → team interview', style: 'Pair programming is real and collaborative — they want to see how you communicate while coding, not just solve it solo', tip: 'Talk through your thinking constantly during the pair exercise; silence is your biggest risk', interviewLength: '2–3 weeks' },
  'Commonwealth Bank': { process: '4 rounds: HR screen → technical assessment → panel interview → senior stakeholder', style: 'More formal than pure-tech startups; expect competency-based questions and structured STAR answers', tip: 'Research CBA\'s tech transformation narrative — they invest heavily in cloud and data; reference their digital banking initiatives', interviewLength: '4–6 weeks' },
  'ANZ':               { process: '3–4 rounds: recruiter → technical → panel → sometimes a final with a senior leader', style: 'Structured and process-driven; values alignment is weighted as heavily as technical ability', tip: 'Emphasise security awareness and risk thinking — financial services care deeply about data handling practices', interviewLength: '4–6 weeks' },
  'Telstra':           { process: '3 rounds: recruiter screen → technical assessment → hiring manager panel', style: 'Mix of technical and behavioural; expect questions about working at scale and enterprise systems', tip: 'Frame your experience around reliability and scale — Telstra deals with millions of customers; show you understand production consequences', interviewLength: '3–5 weeks' },
  'Xero':              { process: '3 rounds: recruiter call → technical interview (live coding) → values interview', style: 'Relaxed and conversational; strong emphasis on Xero\'s values (human, team, beautiful, ownership)', tip: 'Read their engineering blog before the interview; they respect candidates who know what their teams are building', interviewLength: '2–3 weeks' },
  'Seek':              { process: '3 rounds: recruiter → technical (take-home + review) → team culture', style: 'Data-informed culture; expect questions about metrics, A/B testing, and decisions backed by evidence', tip: 'Mention how you\'d measure the success of features you\'ve built — Seek values outcome thinking over output thinking', interviewLength: '2–4 weeks' },
  'Afterpay':          { process: '3 rounds: recruiter screen → technical challenge → team + leadership panel', style: 'Fast-moving; they value speed of delivery and pragmatism alongside quality', tip: 'Show experience with high-traffic systems or financial data; fraud and payment reliability come up frequently', interviewLength: '2–3 weeks' },
  'NAB':               { process: '3–4 rounds: HR → technical assessment → behavioural panel → final leader interview', style: 'Structured; risk and compliance awareness is weighted highly alongside technical skills', tip: 'Demonstrate understanding of agile delivery within enterprise constraints — they\'re mid-transformation and want people comfortable with both worlds', interviewLength: '4–6 weeks' },
};

// AU careers page URLs for companies shown on interview prep cards
export const COMPANY_CAREERS_URLS: Record<string, string> = {
  'Atlassian':          'https://www.atlassian.com/company/careers',
  'Canva':              'https://www.canva.com/careers/',
  'REA Group':          'https://www.rea-group.com/about-us/careers/',
  'Seek':               'https://www.seek.com.au/work-for-seek/',
  'Afterpay':           'https://careers.afterpay.com/',
  'Xero':               'https://www.xero.com/careers/',
  'MYOB':               'https://www.myob.com/au/about/careers',
  'Envato':             'https://envato.com/careers/',
  'Culture Amp':        'https://www.cultureamp.com/about/careers',
  'Commonwealth Bank':  'https://www.commbank.com.au/about-us/careers.html',
  'ANZ':                'https://www.anz.com.au/about-us/careers/',
  'Telstra':            'https://careers.telstra.com/',
  'AWS':                'https://www.amazon.jobs/en/teams/aws',
  'NAB':                'https://www.nab.com.au/about-us/careers',
  'Optus':              'https://www.optus.com.au/about/careers',
  'Deloitte':           'https://www2.deloitte.com/au/en/pages/careers/articles/home.html',
  'Domain':             'https://domainholdings.com.au/careers/',
  'Zip Co':             'https://zip.co/au/careers',
  'Coles Digital':      'https://careers.colesgroup.com.au/',
  'Datadog':            'https://www.datadoghq.com/careers/',
  'HashiCorp':          'https://www.hashicorp.com/careers',
  'Salesforce':         'https://careers.salesforce.com/',
  'IBM':                'https://www.ibm.com/au-en/employment/',
  'WiseTech Global':    'https://www.wisetechglobal.com/careers/',
  'Macquarie Group':    'https://www.macquarie.com/au/en/careers.html',
};

export type InterviewRole = {
  readonly id:            string;
  readonly title:         string;
  readonly emoji:         string;
  readonly description:   string;
  readonly companies:     readonly string[];
  readonly salaryRange:   string;
  readonly topics:        readonly string[];
  readonly difficulty:    'Entry' | 'Mid' | 'Senior';
  readonly demand:        'Medium' | 'High' | 'Very High';
  readonly questionCount: 8 | 10;
  readonly color:         string;
  readonly badge?:        string;  // optional callout badge, e.g. "Recommended for international grads"
};

export const INTERVIEW_ROLES: readonly InterviewRole[] = [
  {
    id:            'universal',
    title:         'Australian Universal Questions',
    emoji:         '🌏',
    description:   '8 questions every international IT graduate faces in Australia — visa, salary, culture fit, and the questions that actually decide if you get the offer.',
    companies:     ['Atlassian', 'Canva', 'REA Group', 'Commonwealth Bank', 'Xero'],
    salaryRange:   'All levels',
    topics:        ['Self-introduction pitch', 'Visa & work rights', 'Salary expectations (AU)', 'Cross-cultural teamwork', 'AU workplace culture', 'Career goals in Australia', 'Handling feedback', 'Questions to ask interviewers'],
    difficulty:    'Entry',
    demand:        'Very High',
    questionCount: 8,
    color:         '#14b8a6',
    badge:         'Start here — international grads',
  },
  {
    id:            'junior-frontend',
    title:         'Junior Frontend Developer',
    emoji:         '⚛️',
    description:   'React, TypeScript, CSS, HTML, accessibility, and browser performance.',
    companies:     ['Canva', 'Atlassian', 'REA Group', 'Seek', 'Afterpay'],
    salaryRange:   '$70k – $90k AUD',
    topics:        ['React fundamentals', 'TypeScript', 'CSS & layout', 'HTML semantics', 'State management', 'Performance optimisation', 'Accessibility', 'Testing with Jest'],
    difficulty:    'Entry',
    demand:        'High',
    questionCount: 10,
    color:         '#61dafb',
  },
  {
    id:            'junior-fullstack',
    title:         'Junior Full Stack Developer',
    emoji:         '🔄',
    description:   'React, Node.js, REST APIs, PostgreSQL, and cloud deployment basics.',
    companies:     ['Xero', 'MYOB', 'Atlassian', 'Envato', 'Culture Amp'],
    salaryRange:   '$80k – $100k AUD',
    topics:        ['React & Next.js', 'Node.js & Express', 'REST API design', 'PostgreSQL & SQL', 'Authentication & JWT', 'Git workflow', 'Docker basics', 'Cloud deployment'],
    difficulty:    'Entry',
    demand:        'Very High',
    questionCount: 10,
    color:         '#68d391',
  },
  {
    id:            'junior-backend',
    title:         'Junior Backend Developer',
    emoji:         '🖥️',
    description:   'Node.js or Python, REST APIs, databases, and system design basics.',
    companies:     ['Commonwealth Bank', 'ANZ', 'Telstra', 'Seek', 'REA Group'],
    salaryRange:   '$75k – $95k AUD',
    topics:        ['REST & GraphQL APIs', 'Database design', 'Authentication & security', 'Error handling', 'Node.js / Python', 'Caching strategies', 'Message queues', 'Testing & TDD'],
    difficulty:    'Entry',
    demand:        'High',
    questionCount: 10,
    color:         '#f6ad55',
  },
  {
    id:            'devops-cloud',
    title:         'Junior DevOps / Cloud Engineer',
    emoji:         '☁️',
    description:   'AWS, Docker, Kubernetes, CI/CD pipelines, and infrastructure as code.',
    companies:     ['AWS', 'Telstra', 'NAB', 'Optus', 'Deloitte'],
    salaryRange:   '$85k – $110k AUD',
    topics:        ['Docker & containers', 'CI/CD pipelines', 'AWS core services', 'Terraform IaC', 'Linux & shell scripting', 'Monitoring & observability', 'Networking basics', 'Security & IAM'],
    difficulty:    'Mid',
    demand:        'Very High',
    questionCount: 10,
    color:         '#fc8181',
  },
  {
    id:            'data-engineer',
    title:         'Junior Data Engineer',
    emoji:         '📊',
    description:   'Python, SQL, ETL pipelines, data warehousing, and analytics platforms.',
    companies:     ['Atlassian', 'ANZ', 'Commonwealth Bank', 'Woolworths Group', 'Suncorp'],
    salaryRange:   '$80k – $105k AUD',
    topics:        ['Python for data', 'SQL & query optimisation', 'ETL pipeline design', 'Data warehousing', 'Apache Spark basics', 'dbt & data modelling', 'BigQuery / Redshift', 'Data quality & testing'],
    difficulty:    'Mid',
    demand:        'Very High',
    questionCount: 10,
    color:         '#9f7aea',
  },
  {
    id:            'qa-engineer',
    title:         'Junior QA Engineer',
    emoji:         '🧪',
    description:   'Manual & automated testing, Playwright, Selenium, and API testing.',
    companies:     ['Atlassian', 'REA Group', 'MYOB', 'Iress', 'TechnologyOne'],
    salaryRange:   '$65k – $85k AUD',
    topics:        ['Testing strategies', 'Playwright / Selenium', 'API testing with Postman', 'Bug reporting & tracking', 'Agile & Scrum', 'CI/CD integration', 'Performance testing', 'Accessibility testing'],
    difficulty:    'Entry',
    demand:        'High',
    questionCount: 10,
    color:         '#4fd1c5',
  },
  {
    id:            'ml-engineer',
    title:         'Junior ML Engineer',
    emoji:         '🤖',
    description:   'Python, PyTorch, model deployment, MLOps, and LLM integrations.',
    companies:     ['Canva', 'Atlassian', 'Commonwealth Bank', 'Cochlear', 'Appen'],
    salaryRange:   '$90k – $120k AUD',
    topics:        ['ML fundamentals & algorithms', 'Python & NumPy / pandas', 'PyTorch or TensorFlow', 'Feature engineering', 'Model evaluation metrics', 'Model deployment (FastAPI)', 'MLOps basics', 'LLMs & prompt engineering'],
    difficulty:    'Mid',
    demand:        'Very High',
    questionCount: 10,
    color:         '#f687b3',
  },
  {
    id:            'react-native',
    title:         'React Native Developer',
    emoji:         '📱',
    description:   'React Native, Expo, mobile UI patterns, iOS & Android deployment.',
    companies:     ['Afterpay', 'Seek', 'Domain', 'Zip Co', 'Coles Digital'],
    salaryRange:   '$80k – $105k AUD',
    topics:        ['React Native core', 'Expo & bare workflow', 'React Navigation', 'State management', 'Native modules', 'Performance & animations', 'Push notifications', 'App Store deployment'],
    difficulty:    'Entry',
    demand:        'High',
    questionCount: 10,
    color:         '#76e4f7',
  },
];

// XP awarded when the user completes each stage (stages: scene → why → guide → reality → practice → debrief)
export const STAGE_XP_VALUES: Record<string, number> = {
  scene:    5,
  why:      10,
  guide:    10,
  reality:  10,
  practice: 50,
  debrief:  0,
} as const;

export function getRoleById(id: string): InterviewRole | undefined {
  return INTERVIEW_ROLES.find(r => r.id === id);
}

export type XpLevel = {
  readonly level:      number;
  readonly title:      string;
  readonly xpRequired: number;
  readonly emoji:      string;
};

export type XpProgress = {
  current:  XpLevel;
  next:     XpLevel | undefined;
  progress: number; // 0–100, integer
};

export const XP_LEVELS: readonly XpLevel[] = [
  { level: 1, title: 'Beginner',        xpRequired: 0,    emoji: '🌱' },
  { level: 2, title: 'Novice',          xpRequired: 500,  emoji: '📚' },
  { level: 3, title: 'Intermediate',    xpRequired: 1500, emoji: '💻' },
  { level: 4, title: 'Advanced',        xpRequired: 3500, emoji: '🚀' },
  { level: 5, title: 'Interview Ready', xpRequired: 7000, emoji: '🏆' },
];

export function getLevelFromXp(xp: number): XpProgress {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
  }
  const next = XP_LEVELS.find(l => l.xpRequired > xp);
  const progress = next
    ? ((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100;
  return { current, next, progress: Math.round(progress) };
}
