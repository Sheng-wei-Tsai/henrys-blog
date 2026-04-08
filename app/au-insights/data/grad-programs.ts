/**
 * AU IT Graduate Program data — 2026 intake cycle
 *
 * Application windows sourced from official company careers pages.
 * Update annually each July for tech companies, March for bank programs.
 *
 * Sources:
 * - Atlassian: atlassian.com/company/careers/early-careers
 * - Canva:     lifeatcanva.com/en/graduates
 * - Google:    careers.google.com/students/
 * - Amazon:    amazon.jobs/content/en/teams/university-programs
 * - CBA:       commbank.com.au/about-us/careers/graduate-program.html
 * - Accenture: accenture.com/au-en/careers/local/graduate-program
 * - Deloitte:  deloitte.com/au/en/pages/careers/articles/graduate-program.html
 * - IBM:       ibm.com/au-en/employment/students.html
 * - Optiver:   optiver.com/working-at-optiver/career-opportunities/
 * - TCS:       tcs.com/careers/tcs-nqt
 * - Westpac:   westpac.com.au/about-westpac/careers/graduates/
 * - ANZ:       anz.com.au/about-us/careers/graduates/
 * - NAB:       nab.com.au/about-us/careers/students-graduates
 */

export type ProgramStatus = 'open' | 'closing-soon' | 'closed' | 'not-yet-open' | 'rolling';

export interface GradProgram {
  company: string;
  slug: string;
  tier: string;
  accentColor: string;

  program: {
    name: string;
    url: string;
    roles: string[];
    locations: string[];
    intakeMonth: string;
    headcount: string;
  };

  applicationWindow: {
    opensDate: string | null;
    closesDate: string | null;
    status: ProgramStatus;
  };

  requirements: string[];
  salaryRange: string;
  sponsorsVisa: boolean;
  notes: string;
}

// Helper: compute status from dates relative to today
export function computeStatus(prog: GradProgram): ProgramStatus {
  if (prog.applicationWindow.status === 'rolling') return 'rolling';
  const now = Date.now();
  const opens = prog.applicationWindow.opensDate ? new Date(prog.applicationWindow.opensDate).getTime() : null;
  const closes = prog.applicationWindow.closesDate ? new Date(prog.applicationWindow.closesDate).getTime() : null;

  if (closes && now > closes) return 'closed';
  if (opens && now < opens) return 'not-yet-open';
  if (closes) {
    const daysLeft = (closes - now) / 86400000;
    if (daysLeft <= 14) return 'closing-soon';
    return 'open';
  }
  return prog.applicationWindow.status;
}

export function daysUntilClose(prog: GradProgram): number | null {
  if (!prog.applicationWindow.closesDate) return null;
  const diff = new Date(prog.applicationWindow.closesDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export const GRAD_PROGRAMS: GradProgram[] = [
  {
    company: 'Atlassian',
    slug: 'atlassian',
    tier: 'S',
    accentColor: '#0052cc',
    program: {
      name: 'Atlassian Graduate Program',
      url: 'https://www.atlassian.com/company/careers/early-careers',
      roles: ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst'],
      locations: ['Sydney'],
      intakeMonth: 'February 2027',
      headcount: '~50–80 graduates',
    },
    applicationWindow: {
      opensDate: '2026-07-01',
      closesDate: '2026-10-31',
      status: 'not-yet-open',
    },
    requirements: [
      'Final year or recently graduated (within 12 months)',
      'Bachelor\'s degree in Computer Science, Engineering, or related field',
      'Australian citizen, PR, or eligible for working visa',
    ],
    salaryRange: '$95k – $115k base + equity',
    sponsorsVisa: true,
    notes: 'One of the most competitive AU grad programs. Includes equity (RSUs). Team Anywhere remote policy applies from day one. Online coding test required.',
  },
  {
    company: 'Canva',
    slug: 'canva',
    tier: 'S',
    accentColor: '#8b3dff',
    program: {
      name: 'Canva Graduate Program',
      url: 'https://lifeatcanva.com/en/',
      roles: ['Software Engineer', 'Data Scientist', 'Frontend Engineer', 'ML Engineer'],
      locations: ['Sydney', 'Melbourne'],
      intakeMonth: 'January 2027',
      headcount: '~40–60 graduates',
    },
    applicationWindow: {
      opensDate: '2026-07-01',
      closesDate: '2026-09-30',
      status: 'not-yet-open',
    },
    requirements: [
      'Final year or recently graduated',
      'Degree in Computer Science, Software Engineering, Mathematics, or related',
      'Strong problem-solving skills',
    ],
    salaryRange: '$90k – $110k base + pre-IPO equity',
    sponsorsVisa: true,
    notes: 'Pre-IPO equity is a significant draw. Strong mission-driven culture. Take-home or pair programming assessment. Closes early — apply as soon as it opens.',
  },
  {
    company: 'Google AU',
    slug: 'google-au',
    tier: 'A+',
    accentColor: '#4285f4',
    program: {
      name: 'Google University Graduate (New Grad SWE)',
      url: 'https://careers.google.com/students/',
      roles: ['Software Engineer', 'Site Reliability Engineer', 'Product Manager'],
      locations: ['Sydney', 'Melbourne'],
      intakeMonth: 'January or July 2027',
      headcount: 'Not disclosed (~20–40 AU)',
    },
    applicationWindow: {
      opensDate: '2026-08-01',
      closesDate: '2026-11-30',
      status: 'not-yet-open',
    },
    requirements: [
      'Bachelor\'s, Master\'s, or PhD in Computer Science or related technical field',
      'Graduating within 12 months or recently graduated',
      'Strong algorithms and data structures fundamentals',
    ],
    salaryRange: '$130k – $160k base + RSU + bonus',
    sponsorsVisa: true,
    notes: 'Highest paying grad program in AU. Rigorous 5-round process (LeetCode hard). Prepare with Neetcode 150. Process takes 2–3 months so apply early.',
  },
  {
    company: 'Amazon / AWS AU',
    slug: 'amazon-aws',
    tier: 'A+',
    accentColor: '#ff9900',
    program: {
      name: 'Amazon New Grad SDE / AWS Graduate',
      url: 'https://www.amazon.jobs/content/en/teams/university-programs',
      roles: ['SDE (Software Development Engineer)', 'Solutions Architect', 'Data Engineer'],
      locations: ['Sydney', 'Melbourne'],
      intakeMonth: 'Rolling (Jan & Jul intakes)',
      headcount: 'Rolling',
    },
    applicationWindow: {
      opensDate: null,
      closesDate: null,
      status: 'rolling',
    },
    requirements: [
      'Bachelor\'s degree in Computer Science, Engineering, or equivalent',
      'Must have work authorisation in Australia',
      'Strong coding skills (LeetCode medium/hard)',
    ],
    salaryRange: '$110k – $135k base + RSU + signing bonus',
    sponsorsVisa: true,
    notes: 'Rolling intake — apply whenever you\'re ready. LP (Leadership Principles) preparation is mandatory. 5-day RTO policy applies from January 2025.',
  },
  {
    company: 'Commonwealth Bank (CBA)',
    slug: 'cba',
    tier: 'B+',
    accentColor: '#ffd200',
    program: {
      name: 'CBA Technology Graduate Program',
      url: 'https://www.commbank.com.au/about-us/careers/graduate-program.html',
      roles: ['Software Engineer', 'Cloud Engineer', 'Data Engineer', 'Cyber Security Analyst', 'DevOps Engineer'],
      locations: ['Sydney', 'Melbourne'],
      intakeMonth: 'February 2027',
      headcount: '~100–150 graduates (all streams)',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-05-31',
      status: 'closed',
    },
    requirements: [
      'Australian citizen or permanent resident (preferred for most roles)',
      'Bachelor\'s degree — Computer Science, IT, Engineering, or related',
      'Graduating in 2026 or 2027',
    ],
    salaryRange: '$75k – $90k base + super',
    sponsorsVisa: true,
    notes: 'Bank grad programs open March — much earlier than tech companies. Set a reminder. CBA offers structured rotation across multiple technology teams. HackerRank assessment required.',
  },
  {
    company: 'Accenture AU',
    slug: 'accenture',
    tier: 'B',
    accentColor: '#a100ff',
    program: {
      name: 'Accenture Technology Associate Program',
      url: 'https://www.accenture.com/au-en/careers/local/graduate-program',
      roles: ['Technology Analyst', 'Cloud Engineer', 'Cyber Security Analyst', 'Business Analyst'],
      locations: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra', 'Perth'],
      intakeMonth: 'February 2027',
      headcount: '~200–300 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-06-30',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s degree in any field (technology, business, science, arts)',
      'Graduating in 2026 or 2027',
      'Australian work authorisation',
    ],
    salaryRange: '$65k – $78k base',
    sponsorsVisa: true,
    notes: 'Largest intake of any AU IT graduate program. Excellent for breadth of experience and career mobility. Lower comp vs product companies. HireVue video interview required.',
  },
  {
    company: 'Deloitte Digital AU',
    slug: 'deloitte-digital',
    tier: 'B',
    accentColor: '#86bc25',
    program: {
      name: 'Deloitte Technology Graduate Program',
      url: 'https://www2.deloitte.com/au/en/pages/careers/articles/graduate-program.html',
      roles: ['Technology Consultant', 'Cloud Engineer', 'Cyber Analyst', 'Business Analyst'],
      locations: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Canberra'],
      intakeMonth: 'February 2027',
      headcount: '~150–200 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-06-30',
      status: 'closed',
    },
    requirements: [
      'Any bachelor\'s degree',
      'Graduating in 2026 or 2027',
      'Strong communication and analytical skills',
    ],
    salaryRange: '$68k – $80k base',
    sponsorsVisa: true,
    notes: 'Highest rated Big-4 AU employer (4.0/5). Good career progression. Case study interview component. Strong alumni network.',
  },
  {
    company: 'IBM AU',
    slug: 'ibm-au',
    tier: 'B',
    accentColor: '#0f62fe',
    program: {
      name: 'IBM Early Professional Program',
      url: 'https://www.ibm.com/au-en/employment/students.html',
      roles: ['Software Engineer', 'Cloud Architect', 'AI Engineer', 'Cyber Security Consultant'],
      locations: ['Sydney', 'Melbourne', 'Canberra'],
      intakeMonth: 'February 2027',
      headcount: '~50–80 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-05-31',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s degree in Computer Science, IT, Engineering, or related',
      'Graduating 2026 or 2027',
      'Australian work rights',
    ],
    salaryRange: '$70k – $85k base',
    sponsorsVisa: true,
    notes: 'Strong training program via IBM Skills Build. Interesting technical work on watsonx AI, quantum, and hybrid cloud. Good work-life balance reputation.',
  },
  {
    company: 'Optiver',
    slug: 'optiver',
    tier: 'SSS',
    accentColor: '#e31837',
    program: {
      name: 'Optiver Graduate Software Developer',
      url: 'https://optiver.com/working-at-optiver/career-opportunities/',
      roles: ['Graduate Software Developer', 'Graduate Quantitative Researcher', 'Graduate Trader'],
      locations: ['Sydney'],
      intakeMonth: 'February 2027',
      headcount: '~10–20 graduates (very selective)',
    },
    applicationWindow: {
      opensDate: '2026-04-01',
      closesDate: '2026-06-30',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s or Master\'s in CS, Mathematics, Physics, Engineering, or Statistics',
      'Top academic record — typically top 10% of cohort',
      'Strong numerical reasoning and probability skills',
    ],
    salaryRange: '$120k – $180k+ base + performance bonus',
    sponsorsVisa: true,
    notes: 'Best paying grad program in AU by a significant margin. Rejection rate >95%. Prepare mental maths and probability intensively for 6+ weeks. Not a traditional tech interview.',
  },
  {
    company: 'TCS AU',
    slug: 'tcs',
    tier: 'B-',
    accentColor: '#0071b5',
    program: {
      name: 'TCS National Qualifier Test (NQT)',
      url: 'https://www.tcs.com/careers/tcs-nqt',
      roles: ['Software Engineer', 'Test Analyst', 'Business Analyst', 'Java Developer'],
      locations: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'],
      intakeMonth: 'Rolling',
      headcount: 'Large — rolling intake',
    },
    applicationWindow: {
      opensDate: null,
      closesDate: null,
      status: 'rolling',
    },
    requirements: [
      'Bachelor\'s degree in any engineering or science stream',
      'Minimum 60% aggregate throughout academic career',
      'Australian work rights or willing to apply for 482 visa',
    ],
    salaryRange: '$60k – $72k base',
    sponsorsVisa: true,
    notes: 'Most accessible grad pathway for 482 visa. Lower comp but reliable sponsorship. TCS Initial Learning Program (ILP) provides structured onboarding. Use as a 2-year foothold then move to product companies.',
  },
  {
    company: 'Westpac',
    slug: 'westpac',
    tier: 'B+',
    accentColor: '#da1710',
    program: {
      name: 'Westpac Technology Graduate Program',
      url: 'https://www.westpac.com.au/about-westpac/careers/graduates/',
      roles: ['Software Engineer', 'Data Engineer', 'Cloud Engineer', 'Security Analyst'],
      locations: ['Sydney', 'Melbourne'],
      intakeMonth: 'February 2027',
      headcount: '~50–80 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-05-31',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s degree in IT, Computer Science, or Engineering',
      'Australian citizen or permanent resident',
      'Graduating 2026 or 2027',
    ],
    salaryRange: '$72k – $88k base + super',
    sponsorsVisa: false,
    notes: 'Bank program — opens March, closes May. Good stability and structured rotation. Limited visa sponsorship — best for AU citizens/PR.',
  },
  {
    company: 'ANZ Bank',
    slug: 'anz',
    tier: 'B+',
    accentColor: '#007dba',
    program: {
      name: 'ANZ Technology Graduate Program',
      url: 'https://www.anz.com.au/about-us/careers/graduates/',
      roles: ['Software Engineer', 'DevOps Engineer', 'Data Engineer', 'Agile Coach'],
      locations: ['Melbourne', 'Sydney'],
      intakeMonth: 'February 2027',
      headcount: '~60–100 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-05-31',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s degree in any field — technical preferred',
      'Australian citizen or permanent resident',
      'Graduating 2026 or 2027',
    ],
    salaryRange: '$72k – $88k base + super',
    sponsorsVisa: false,
    notes: 'Strong structured program with rotation across engineering, data, and agile delivery. Modern stack (AWS, Kubernetes). Limited visa sponsorship.',
  },
  {
    company: 'NAB',
    slug: 'nab',
    tier: 'B+',
    accentColor: '#c00',
    program: {
      name: 'NAB Technology Graduate Program',
      url: 'https://www.nab.com.au/about-us/careers/students-graduates',
      roles: ['Software Engineer', 'Cloud Engineer', 'Data Analyst', 'Cyber Security'],
      locations: ['Melbourne', 'Sydney'],
      intakeMonth: 'February 2027',
      headcount: '~80–120 graduates',
    },
    applicationWindow: {
      opensDate: '2026-03-01',
      closesDate: '2026-05-31',
      status: 'closed',
    },
    requirements: [
      'Bachelor\'s degree — technology, engineering, science, or business',
      'Australian citizen or permanent resident',
      'Graduating 2026 or 2027',
    ],
    salaryRange: '$72k – $87k base + super',
    sponsorsVisa: false,
    notes: 'Large intake across multiple streams. Good for structured career start. Cloud and data engineering tracks are strongest for technical growth.',
  },
];
