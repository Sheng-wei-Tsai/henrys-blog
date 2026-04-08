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
  readonly questionCount: 10;
  readonly color:         string;
};

export const INTERVIEW_ROLES: readonly InterviewRole[] = [
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

// XP awarded when the user completes each stage (stages: scene → why → guide → practice → debrief)
export const STAGE_XP_VALUES: Record<string, number> = {
  scene:    5,
  why:      10,
  guide:    10,
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
