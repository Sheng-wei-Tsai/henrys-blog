// Company data for AU Insights detail pages.
// Glassdoor ratings sourced April 2026 from glassdoor.com.au
// Sponsorship sourced from: Department of Home Affairs FOI FA-230900293 (Sep 2023),
// data.gov.au Temporary Work (Skilled) Visa Program dataset, and
// github.com/geshan/au-companies-providing-work-visa-sponsorship

export interface CompanyData {
  slug: string;
  name: string;
  tier: string;
  tierLabel: string;
  tagline: string;
  website: string;
  auCity: string;
  auHeadcount: string;
  founded: string;

  glassdoor: {
    rating: number;
    reviews: number;
    recommendPct: number | null;
    url: string;
    workLifeBalance?: number;
    cultureValues?: number;
    careerOpportunities?: number;
    divInclusion?: number;
    compBenefits?: number;
  };

  wfh: string;

  culture: {
    vibe: string;
    pros: string[];
    cons: string[];
    interviewStyle: string;
  };

  compensation: {
    gradRange: string;
    midRange: string;
    seniorRange: string;
    notes: string;
  };

  techStack: string[];
  roles: string[];

  sponsorship: {
    sponsors482: boolean;
    accreditedSponsor: boolean;
    notes: string;
  };

  recentNews: { date: string; headline: string }[];
}

export const COMPANIES: CompanyData[] = [
  {
    slug: 'atlassian',
    name: 'Atlassian',
    tier: 'S',
    tierLabel: 'S+ / S — Premium Product',
    tagline: 'Sydney-born software giant behind Jira, Confluence & Trello',
    website: 'atlassian.com',
    auCity: 'Sydney (HQ)',
    auHeadcount: '~4,000–5,000 AU employees (post-2026 layoffs)',
    founded: '2002',
    glassdoor: {
      rating: 3.1,
      reviews: 3370,
      recommendPct: 42,
      url: 'https://www.glassdoor.com.au/Reviews/Atlassian-Reviews-E115699.htm',
      workLifeBalance: 2.8,
      cultureValues: 2.4,
      careerOpportunities: 3.0,
      divInclusion: 3.3,
      compBenefits: 3.2,
    },
    wfh: 'Team Anywhere — fully distributed. Work from anywhere Atlassian has a legal entity. 0 required office days. Up to 90 days/year from another country. No return-to-office mandate as of April 2026.',
    culture: {
      vibe: 'Once a beloved AU tech success story with a values-driven culture, Atlassian has undergone significant culture shifts since 2022 following leadership changes and a pivot to enterprise sales. The Team Anywhere remote policy remains best-in-class, but the work environment has become more competitive and performance-managed.',
      pros: [
        'Industry-leading remote work policy — work anywhere, no RTO mandate',
        'Strong brand on resume, globally recognised product suite',
        'Good parental leave (26 weeks primary carer)',
        'Interesting technical scale — millions of users on your code',
        'Diverse and globally distributed teams',
      ],
      cons: [
        'Stack ranking performance reviews introduced post-2022 leadership change',
        'Significant 10% layoff in March 2026 — morale hit across AU offices',
        'Highly political environment at senior levels',
        'Career progression slow unless you navigate internal politics',
        'Only 42% of Glassdoor reviewers would recommend — below AU tech average',
      ],
      interviewStyle: 'Multiple rounds: recruiter screen → technical (LeetCode medium/hard) → system design → values/behavioural (STAR method). Hiring managers test directly for Atlassian\'s 5 values. Process takes 4–6 weeks.',
    },
    compensation: {
      gradRange: '$95k – $115k base + equity',
      midRange: '$130k – $165k base + equity',
      seniorRange: '$180k – $230k+ base + equity',
      notes: 'Equity (RSUs) is a significant portion of total comp. 4-year vesting, 1-year cliff. Market competitive but not top-of-range for Sydney.',
    },
    techStack: ['Java', 'Python', 'React', 'TypeScript', 'Kotlin', 'Kubernetes', 'AWS', 'Micros (internal PaaS)'],
    roles: ['Software Engineer', 'SRE', 'Product Manager', 'Designer', 'Data Engineer', 'Security Engineer'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Active accredited sponsor for 482/Skills in Demand visa. Well-known for sponsoring senior engineering roles. AU citizenship/PR not required for most engineering positions.',
    },
    recentNews: [
      { date: 'Mar 2026', headline: 'Atlassian cuts 10% of global workforce (~1,600 jobs), citing AI shift. 30% of cuts in Australia.' },
      { date: 'Aug 2025', headline: 'HBR profile: Atlassian anchors remote flexibility in structured daily practices — cited as global model for async work.' },
      { date: 'Apr 2025', headline: 'Fortune Best Companies to Work For — Atlassian stands by WFH philosophy despite corporate RTO push.' },
    ],
  },
  {
    slug: 'canva',
    name: 'Canva',
    tier: 'S',
    tierLabel: 'S+ / S — Premium Product',
    tagline: 'Sydney-based design unicorn valued at $26B+, used by 180M+ people',
    website: 'canva.com',
    auCity: 'Sydney (HQ)',
    auHeadcount: '~2,000+ AU employees',
    founded: '2012',
    glassdoor: {
      rating: 3.9,
      reviews: 341,
      recommendPct: 68,
      url: 'https://www.glassdoor.com.au/Reviews/Canva-Sydney-Reviews-EI_IE1013251.0,5_IL.6,12_IM962.htm',
      workLifeBalance: 3.7,
      cultureValues: 3.7,
      careerOpportunities: 3.5,
      divInclusion: 4.0,
    },
    wfh: 'Hybrid — work from office as needed, strong WFH flexibility. No strict RTO policy. Flexi start/finish times. International relocation support for AU-based roles.',
    culture: {
      vibe: 'Fast-moving, mission-driven culture with strong AU identity. The "be a good human" value is genuinely felt at team level. Growth has created some friction — management layer has thickened and office politics have emerged in some teams. Still one of the best AU product company cultures for early-career devs.',
      pros: [
        'Genuine mission — "empowering the world to design" resonates with staff',
        'Strong technical scope — problems at real scale (180M+ users)',
        'Excellent food, office amenities, and social culture at Sydney HQ',
        'Trusted to own problems and experiment independently',
        'Diversity and inclusion consistently rated 4.0 in AU',
      ],
      cons: [
        'Office politics emerging as headcount grew — cliquey management in some orgs',
        'Projects cancelled at short notice due to changing priorities',
        'Compensation (3.x/5) lags behind FAANG equivalents',
        'Career opportunities (3.5) — promotion pathway unclear for many ICs',
        'Some reviews cite poor senior leadership transparency post-2023',
      ],
      interviewStyle: 'Take-home project or live coding → system design → values interview with hiring panel. Strong emphasis on product thinking and cross-functional communication. 3–5 rounds typical.',
    },
    compensation: {
      gradRange: '$90k – $110k base',
      midRange: '$120k – $155k base + equity',
      seniorRange: '$165k – $220k+ base + equity',
      notes: 'Pre-IPO equity (options) is a major draw. IPO expected; current equity could be highly valuable post-listing. Cash comp slightly below FAANG but equity upside is significant.',
    },
    techStack: ['React', 'TypeScript', 'Go', 'Java', 'Kotlin', 'Python', 'GCP', 'Kubernetes', 'GraphQL'],
    roles: ['Software Engineer', 'Frontend Engineer', 'Data Scientist', 'Product Designer', 'ML Engineer'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Known for sponsoring international engineers and designers. Strong relocation support. Actively recruits globally for Sydney HQ roles.',
    },
    recentNews: [
      { date: '2025', headline: 'Canva revenue reportedly exceeds $2.5B AUD ARR, maintains strong growth without layoffs.' },
      { date: '2024', headline: 'Canva expands Melbourne engineering office to 300+ staff.' },
      { date: '2024', headline: 'Canva introduces AI-powered design tools; significant ML hiring wave across AU.' },
    ],
  },
  {
    slug: 'google-au',
    name: 'Google AU',
    tier: 'A+',
    tierLabel: 'A+ — FAANG-adjacent',
    tagline: 'Google\'s Australian hub — 1,000+ engineers across Sydney and Melbourne',
    website: 'careers.google.com',
    auCity: 'Sydney (primary), Melbourne',
    auHeadcount: '~1,000–1,500 AU employees',
    founded: '2002 (AU office)',
    glassdoor: {
      rating: 4.3,
      reviews: 487,
      recommendPct: 94,
      url: 'https://www.glassdoor.com/Reviews/Google-Sydney-Reviews-EI_IE9079.0,6_IL.7,13_IM962.htm',
      workLifeBalance: 4.3,
      cultureValues: 4.3,
      careerOpportunities: 4.3,
      divInclusion: 4.5,
      compBenefits: 4.6,
    },
    wfh: 'Hybrid — 3 days in office per week (enforced from 2023). Sydney office at Darling Island is considered one of Google\'s best globally. Flexibility varies by team and manager.',
    culture: {
      vibe: 'Google AU has among the highest Glassdoor scores in Australian tech — 94% of Sydney employees would recommend it to a friend. The AU office runs high-impact engineering work (Maps, Search infrastructure, Cloud). Culture is collaborative and intellectually stimulating, though the RTO mandate and rising managerial pressure have caused some friction in recent reviews.',
      pros: [
        '94% of Sydney employees recommend it — highest in AU tech for an A+ company',
        'Exceptional compensation and benefits (4.6/5) — meals, health, travel stipend',
        'Intellectually challenging work on products used by billions',
        'World-class colleagues — peer quality is consistently cited as a pro',
        'Strong internal mobility across teams and geographies',
        'AU office atmosphere rated higher than global Google average',
      ],
      cons: [
        'RTO mandate (3 days/week) since 2023 — friction for remote workers',
        'Slower promotion pace vs early-career expectations',
        'Increasing political environment as headcount grew post-pandemic',
        'Some teams reduced to "maintenance mode" for legacy products',
        'Managers "forced to hit targets with less headcount"',
      ],
      interviewStyle: 'Google\'s standard 5-6 round process: phone screen → coding (LeetCode hard) → system design → behavioural (Googleyness). Highly rigorous. Takes 2–3 months. Strongly recommend Neetcode 150 + system design primer.',
    },
    compensation: {
      gradRange: '$130k – $160k base + RSUs + bonus',
      midRange: '$170k – $220k base + RSUs',
      seniorRange: '$220k – $300k+ total comp (base + RSU + bonus)',
      notes: 'Total comp includes base + annual bonus (15–20% target) + RSU grants (4yr vesting). One of the highest TC packages available in AU. Comp and benefits rated 4.6/5 — best of any company in AU tech.',
    },
    techStack: ['C++', 'Go', 'Python', 'Java', 'TypeScript', 'Kubernetes', 'Spanner', 'BigQuery', 'internal tooling'],
    roles: ['Software Engineer', 'SRE', 'Cloud Solutions Architect', 'Data Engineer', 'Research Scientist'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Active 482/Skills in Demand sponsor. Sponsors globally-hired engineers for Sydney office. Strong relocation packages. One of the most reliable sponsors in AU.',
    },
    recentNews: [
      { date: '2025', headline: 'Google AU expands Maps and Search infrastructure team in Sydney — 200+ new engineering roles.' },
      { date: '2024', headline: 'Google enforces hybrid 3-day RTO globally, including AU offices.' },
      { date: '2024', headline: 'Google AU invests in AI/ML research team at Sydney — new partnership with CSIRO.' },
    ],
  },
  {
    slug: 'amazon-aws',
    name: 'Amazon / AWS AU',
    tier: 'A+',
    tierLabel: 'A+ — FAANG-adjacent',
    tagline: 'AWS\'s AU headquarters and Amazon\'s largest APAC engineering hub',
    website: 'amazon.jobs',
    auCity: 'Sydney (primary), Melbourne, Perth',
    auHeadcount: '~2,000+ AU employees',
    founded: '2004 (AU office)',
    glassdoor: {
      rating: 3.4,
      reviews: 534,
      recommendPct: 62,
      url: 'https://www.glassdoor.com/Reviews/Amazon-Sydney-Reviews-EI_IE6036.0,6_IL.7,13_IM962.htm',
      workLifeBalance: 3.1,
      cultureValues: 3.3,
      careerOpportunities: 3.5,
      divInclusion: 3.8,
      compBenefits: 3.9,
    },
    wfh: '5-day RTO (return to office) policy mandated from January 2025 globally. Amazon is one of the most aggressive RTO enforcers — no hybrid flexibility. Sydney CBD office.',
    culture: {
      vibe: 'Results-oriented, intense, LP-driven (Leadership Principles). Work is genuinely meaningful at scale — AWS powers a significant portion of the internet. However, the 5-day RTO mandate and "not the same company it was pre-2024" reviews indicate significant culture changes. Sydney office has better ratings than global Amazon average due to smaller, more autonomous AU teams.',
      pros: [
        'Massive scope — work on infrastructure used by millions of companies globally',
        'Strong career trajectory for those who stay and level up',
        'Compensation competitive, especially RSU vesting after year 1 cliff',
        'AU team culture more autonomous than US counterparts',
        'Strong brand — "worked at Amazon" opens doors globally',
      ],
      cons: [
        '5-day RTO mandate from Jan 2025 — no WFH flexibility whatsoever',
        'Performance Improvement Plans (PIPs) used aggressively — ranked in peer group',
        'Work-life balance rated only 3.1 in Sydney',
        'High churn — many engineers leave after vesting cliff at year 1–2',
        '"Pre-2024 culture was better" — a common theme in recent reviews',
      ],
      interviewStyle: 'Amazon LP (Leadership Principles) interviews are mandatory for every role. 4–5 rounds: online assessment → phone screen → loop (coding + system design + LP behavioural). Prepare STAR stories for ALL 16 LPs. Coding is LeetCode medium/hard.',
    },
    compensation: {
      gradRange: '$110k – $135k base + RSU + signing bonus',
      midRange: '$150k – $190k base + RSU',
      seniorRange: '$200k – $280k total comp',
      notes: 'RSU vesting: 5% yr1, 15% yr2, 40% yr3, 40% yr4. Large signing bonus offsets low first-year RSU vest. Total comp significantly back-loaded toward years 3–4.',
    },
    techStack: ['Java', 'Python', 'C++', 'TypeScript', 'AWS (all services)', 'DynamoDB', 'CDK', 'Kotlin'],
    roles: ['SDE', 'SDE II', 'SDE III (Senior)', 'SRE', 'Solutions Architect', 'Data Engineer', 'TPM'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'One of the highest-volume 482 visa sponsors in AU IT. Active accredited sponsor. Regularly hires internationally for Sydney AWS engineering roles. Strong relocation support.',
    },
    recentNews: [
      { date: 'Jan 2025', headline: 'Amazon enforces 5-day RTO globally, including Sydney office — significant pushback from AU employees.' },
      { date: '2024', headline: 'AWS AU expands data centre presence — new Sydney region availability zone launched.' },
      { date: '2024', headline: 'Amazon AU announces 1,000 new tech roles across Sydney and Melbourne over 3 years.' },
    ],
  },
  {
    slug: 'optiver',
    name: 'Optiver',
    tier: 'SSS',
    tierLabel: 'God Tier / SSS',
    tagline: 'Global market maker with one of the most competitive grad programs in AU',
    website: 'optiver.com',
    auCity: 'Sydney',
    auHeadcount: '~150–200 AU employees',
    founded: '1986 (Amsterdam), Sydney office 2008',
    glassdoor: {
      rating: 3.7,
      reviews: 561,
      recommendPct: null,
      url: 'https://www.glassdoor.com.au/Reviews/Optiver-Reviews-E243355.htm',
    },
    wfh: 'Limited — trading floors require physical presence. Very limited WFH. Core hours 7am–5pm aligned to market open. Some flexibility for non-trading roles.',
    culture: {
      vibe: 'Elite quantitative trading environment — extremely high-performing, well-compensated, and demanding. The work is genuinely intellectually stimulating and the comp is market-leading. Culture is described as homogeneous and can be unwelcoming for those outside the dominant demographic. Not for everyone, but for the right person, it\'s the best starting salary in Australia.',
      pros: [
        'Best graduate compensation in AU — significantly above market ($120k–$180k+ for grads)',
        'Intellectually stimulating work — real-time systems, quantitative research, trading algorithms',
        'Learn from world-class quantitative researchers and engineers',
        'Small team — high ownership and responsibility from day one',
        'Direct meritocracy — performance is measurable and rewarded',
      ],
      cons: [
        'Toxic culture reports — high-stress, ruthless performance management',
        'Homogeneous workforce — limited diversity in practice',
        'Very limited WFH — essentially no remote work',
        'Long hours normalised — 50–60hr weeks common',
        'Culture described as "unwelcoming" for those outside dominant demographic',
        'Very high pressure environment — burnout is a real risk',
      ],
      interviewStyle: 'Highly selective — rejection rate >95%. Rounds: aptitude tests (mental maths, probability) → trading game simulation → technical (C++, algorithms, probability) → senior quant interview. No LeetCode — focus on numerical reasoning, game theory, and probability under pressure.',
    },
    compensation: {
      gradRange: '$120k – $180k+ base (trading floor bonuses on top)',
      midRange: '$200k – $350k+ total comp',
      seniorRange: '$400k – $1M+ total comp',
      notes: 'Comp is exceptional and one of the main draws. Bonuses are tied to desk profitability. Top performers can earn 2–3x base in bonus. Significantly higher than any software product company in AU.',
    },
    techStack: ['C++', 'Python', 'FPGA', 'Linux', 'Custom trading infrastructure', 'Numerical computing'],
    roles: ['Software Developer (Trading)', 'Quantitative Researcher', 'Hardware Engineer', 'Risk Analyst'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Sponsors elite international candidates. Very selective — sponsorship offered only after passing rigorous hiring process. Small intake, high quality bar.',
    },
    recentNews: [
      { date: '2025', headline: 'Capital Brief profiles AU HFT firms — Optiver among "secretive high-frequency trading firms printing money in Australia".' },
      { date: '2024', headline: 'Optiver expands Sydney quant research team — key hires from top AU universities and global HFT firms.' },
    ],
  },
  {
    slug: 'safetyCulture',
    name: 'SafetyCulture',
    tier: 'S',
    tierLabel: 'S+ / S — Premium Product',
    tagline: 'Townsville-born, Sydney-based SaaS unicorn — workplace safety platform for 1M+ users',
    website: 'safetyculture.com',
    auCity: 'Sydney (HQ)',
    auHeadcount: '~800 AU employees',
    founded: '2004 (Townsville), grew into Sydney startup',
    glassdoor: {
      rating: 3.7,
      reviews: 322,
      recommendPct: 71,
      url: 'https://www.glassdoor.com.au/Reviews/SafetyCulture-Reviews-E1094632.htm',
      workLifeBalance: 3.7,
      cultureValues: 3.9,
      careerOpportunities: 3.5,
      compBenefits: 3.3,
    },
    wfh: 'Hybrid — flexible WFH with office in Surry Hills, Sydney. No strict RTO mandate.',
    culture: {
      vibe: 'One of Australia\'s most genuine product-first startups — the mission (making workplaces safer) resonates strongly. Culture was exceptional in earlier stages, but rapid growth and leadership changes in 2023–2024 have eroded some of the early magic. Still a strong employer for early-career devs who want real product ownership.',
      pros: [
        'Genuine mission — improving workplace safety has clear real-world impact',
        'Great Sydney office (Surry Hills) — amazing colleagues and social culture',
        'Real product ownership — not a ticket resolution factory',
        '71% recommend to friend — above AU average for startups',
        'Flexible hybrid work',
      ],
      cons: [
        'Compensation rated 3.3/5 — below market vs comparable AU SaaS companies',
        'Culture declining per recent reviews — leadership changes in 2023–2024',
        'Layoffs in 2023–2024 affected team dynamics and workload distribution',
        'Career opportunities (3.5) — promotion pathway unclear',
        'Pay has not kept pace with AU tech market inflation',
      ],
      interviewStyle: 'Values-led interviews alongside technical assessment. Product engineers do take-home coding challenge + live technical interview + cultural values interview. Less LeetCode-intensive than FAANG — more focus on practical problem-solving.',
    },
    compensation: {
      gradRange: '$80k – $100k base',
      midRange: '$105k – $135k base',
      seniorRange: '$140k – $175k base + equity',
      notes: 'Equity (options) available. Comp below market versus similarly-sized AU SaaS companies. Pre-IPO equity could be a draw if company lists.',
    },
    techStack: ['React', 'TypeScript', 'Node.js', 'Go', 'AWS', 'PostgreSQL', 'React Native'],
    roles: ['Software Engineer', 'Frontend Engineer', 'iOS/Android Developer', 'Data Engineer', 'Product Manager'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Listed in community-verified AU visa sponsorship database. Sponsors senior engineers and specialised roles. Less consistent than large companies — confirm during offer stage.',
    },
    recentNews: [
      { date: '2024', headline: 'SafetyCulture lays off approximately 100 staff as it refocuses on core product and profitability.' },
      { date: '2024', headline: 'SafetyCulture expands into HR software — new "Heads Up" platform for team wellbeing.' },
    ],
  },
  {
    slug: 'accenture',
    name: 'Accenture AU',
    tier: 'B',
    tierLabel: 'B — Traditional Enterprise & Consulting',
    tagline: 'Global consulting giant — $3B+ AU revenue, 10,000+ AU employees',
    website: 'accenture.com/au-en',
    auCity: 'Sydney, Melbourne, Canberra, Brisbane, Perth',
    auHeadcount: '~10,000+ AU employees',
    founded: '1951 (AU presence since 1960s)',
    glassdoor: {
      rating: 3.5,
      reviews: 1789,
      recommendPct: 73,
      url: 'https://www.glassdoor.com/Reviews/Accenture-Australia-Reviews-EI_IE4138.0,9_IL.10,19_IN16.htm',
      compBenefits: 3.3,
    },
    wfh: 'Hybrid — typically client-site when on engagement. Varies by project. WFH between engagements. Many government and bank clients require on-site presence.',
    culture: {
      vibe: 'Accenture AU is one of the largest employers of IT professionals in Australia. The experience varies enormously by project and team — you can be on a cutting-edge cloud transformation or a boring legacy maintenance gig. For grads it provides unmatched variety and structured career development. Comp is below product companies but breadth of experience is high.',
      pros: [
        '73% recommend — above average for large consulting firms',
        'Excellent structured graduate program — strong onboarding and mentorship',
        'Variety — exposure to multiple industries and technologies across projects',
        'Clear promotion ladder with defined levelling',
        'Strong AU network — largest tech consulting employer in the country',
      ],
      cons: [
        'Billable-hours culture — your value is how many hours you can bill clients',
        'Compensation (3.3/5) — significantly below product companies for equivalent experience',
        'Risk of getting "stuck" in a project and not building core engineering skills',
        'Client requirements drive technology choices — often outdated stacks',
        'Work-life balance inconsistent — can be intense on large transformation programs',
      ],
      interviewStyle: 'Case interview style for consulting roles. Technical roles: competency-based STAR interviews + technical assessment. Emphasis on communication and client-facing skills. Less LeetCode-heavy than product companies.',
    },
    compensation: {
      gradRange: '$65k – $78k base',
      midRange: '$90k – $120k base',
      seniorRange: '$130k – $180k (manager+)',
      notes: 'Below product company market rates. Annual reviews with defined bands. Significant bonus potential at senior levels but variable. Total comp improves substantially at Manager+ levels.',
    },
    techStack: ['Java', 'SAP', 'Salesforce', 'ServiceNow', 'Azure', 'AWS', 'Pega', 'MuleSoft'],
    roles: ['Technology Analyst', 'Software Engineer', 'Cloud Engineer', 'SAP Consultant', 'Business Analyst', 'Cyber Security Analyst'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'One of the highest-volume 482 visa sponsors in AU IT. Regularly named in Department of Home Affairs sponsorship data. Strong track record — particularly for SAP, Salesforce, and cloud specialists. Good option for visa pathway.',
    },
    recentNews: [
      { date: '2025', headline: 'Accenture AU pushes toward $3B in annual AU revenues — major expansion in Canberra government practice.' },
      { date: '2024', headline: 'Accenture AU wins $200M+ government digital transformation contracts.' },
      { date: '2024', headline: 'Accenture AU launches AI practice — significant hiring in Sydney and Melbourne.' },
    ],
  },
  {
    slug: 'ibm-au',
    name: 'IBM AU',
    tier: 'B',
    tierLabel: 'B — Traditional Enterprise & Consulting',
    tagline: 'Legacy technology giant — cloud, AI (Watson), and services in Australia since 1930',
    website: 'ibm.com/au-en',
    auCity: 'Sydney, Melbourne, Canberra',
    auHeadcount: '~2,000 AU employees',
    founded: '1930 (AU presence)',
    glassdoor: {
      rating: 3.9,
      reviews: 1019,
      recommendPct: null,
      url: 'https://www.glassdoor.com/Reviews/IBM-Australia-Reviews-EI_IE354.0,3_IL.4,13_IN16.htm',
      compBenefits: 3.6,
    },
    wfh: 'Hybrid — flexible work arrangements. IBM was one of the first companies to go fully remote in the 1990s and has historically been progressive on WFH. Varies by role and client engagement.',
    culture: {
      vibe: 'IBM AU has a surprisingly high Glassdoor rating (3.9) which exceeds many more "exciting" companies. The culture is stable, professional and respectful. Not a high-growth startup environment — but for engineers who want to work on genuinely interesting enterprise problems (AI, quantum computing research, hybrid cloud) without the burnout of a startup, IBM is underrated.',
      pros: [
        '3.9/5 Glassdoor — highest rated among traditional enterprise employers in AU',
        'Excellent work-life balance reputation — 9-5 culture respected',
        'Genuinely interesting technical work on AI (Watson, watsonx), quantum, and cloud',
        'Strong internal training and certification programs (IBM Skills Build)',
        'Global internal mobility — can move to US, India, UK, EU offices',
      ],
      cons: [
        'Comp (3.6/5) below market for product engineers',
        'Legacy business lines can lead to maintaining COBOL and older stacks',
        'Slow promotion cycles — tenure-driven more than merit-driven at lower levels',
        'IBM has been shrinking AU headcount over the past decade via outsourcing',
        'Some teams are purely client services with limited engineering depth',
      ],
      interviewStyle: 'Structured competency interviews using IBM\'s behavioural framework. Technical roles include coding assessment (less intense than FAANG). Values and communication skills equally weighted. Multiple HR screen stages.',
    },
    compensation: {
      gradRange: '$70k – $85k base',
      midRange: '$100k – $130k',
      seniorRange: '$140k – $180k',
      notes: 'Comp has improved since 2022 but remains below product companies. Annual variable pay component. Strong non-cash benefits (hardware discounts, internal courses).',
    },
    techStack: ['Java', 'Python', 'Red Hat OpenShift', 'watsonx AI', 'IBM Cloud', 'Z Systems', 'Ansible'],
    roles: ['Software Engineer', 'Cloud Architect', 'AI Engineer', 'Security Consultant', 'Data Scientist'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Major 482 visa sponsor — particularly for cloud, AI, and mainframe specialists. Strong track record in AU government and financial services sectors.',
    },
    recentNews: [
      { date: '2025', headline: 'IBM AU expands watsonx AI practice — new partnerships with major AU banks and government agencies.' },
      { date: '2024', headline: 'IBM AU wins NDIS technology contract — large hybrid cloud and AI implementation project.' },
    ],
  },
  {
    slug: 'tcs',
    name: 'TCS AU',
    tier: 'B-',
    tierLabel: 'B− — Body Shops & Bank IT',
    tagline: 'Tata Consultancy Services — India\'s largest IT firm with significant AU operations',
    website: 'tcs.com',
    auCity: 'Sydney, Melbourne, Canberra, Brisbane',
    auHeadcount: '~3,000–4,000 AU employees',
    founded: '1968 (India), AU since 1990s',
    glassdoor: {
      rating: 3.5,
      reviews: 577,
      recommendPct: null,
      url: 'https://www.glassdoor.com/Reviews/Tata-Consultancy-Services-Australia-Reviews-EI_IE13461.0,25_IL.26,35_IN16.htm',
      compBenefits: 2.8,
    },
    wfh: 'Varies by project — client-site driven. Most AU projects require significant on-site presence at client offices (banks, government). WFH when bench (between projects).',
    culture: {
      vibe: 'TCS AU operates as a body shop model — staffing IT teams for AU\'s large banks, telcos, and government. The experience depends heavily on the client you\'re placed with. On a good project with a progressive client, it can be a solid first job with visa sponsorship. The comp is below market and advancement is slow, but it is one of the easiest paths to a 482 visa in AU IT.',
      pros: [
        'Very reliable 482 visa sponsor — one of the highest volumes in AU',
        'Exposure to enterprise clients (ANZ, NAB, Telstra, government agencies)',
        'Structured onboarding — TCS Initial Learning Program (ILP) is comprehensive',
        'Large AU network — easy to find internal references and switch projects',
        'Stable employment — low layoff risk during economic downturns',
      ],
      cons: [
        'Compensation (2.8/5) — significantly below AU market rates',
        'Billable hours culture — advancement based on utilisation and seniority, not merit',
        'Limited technical depth — often implementing, not designing or architecting',
        'High-utilisation expectations — overtime expected on many projects',
        'Treated as a resource, not a colleague by many AU clients',
      ],
      interviewStyle: 'Relatively accessible — coding test (HackerRank, moderate difficulty) + HR interview. For experienced hires, technical interview aligned to project skills. Not highly selective compared to product companies.',
    },
    compensation: {
      gradRange: '$60k – $72k base',
      midRange: '$80k – $100k',
      seniorRange: '$110k – $140k (tech lead+)',
      notes: 'Comp is well below AU market rates. Annual increments are modest (2–4%). Use TCS as a 2-year foothold, then move to a product company for a significant salary jump.',
    },
    techStack: ['Java', 'SAP', '.NET', 'Python', 'Mainframe (COBOL)', 'Oracle', 'Salesforce', 'Azure'],
    roles: ['Software Engineer', 'Java Developer', 'SAP Consultant', 'Test Analyst', 'Business Analyst'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'One of the highest-volume 482 visa sponsors in AU. TCS, Infosys, and Wipro collectively account for a significant share of all IT 482 sponsorships in Australia. Best option if your priority is getting a visa pathway quickly.',
    },
    recentNews: [
      { date: '2024', headline: 'TCS AU wins contract extension with Commonwealth Bank of Australia — multi-year technology services engagement.' },
      { date: '2024', headline: 'TCS AU headcount grows to 3,500+ as Australian banks outsource more IT operations.' },
    ],
  },
  {
    slug: 'cba',
    name: 'Commonwealth Bank of Australia (CBA)',
    tier: 'B+',
    tierLabel: 'B+ — Large Tech / Well-run Enterprise',
    tagline: 'Australia\'s largest bank with a 4,000+ person technology team running modern cloud infrastructure',
    website: 'commbank.com.au/careers',
    auCity: 'Sydney (HQ), Melbourne',
    auHeadcount: '~4,000+ in technology division',
    founded: '1911 (technology team rebuilt from 2015)',
    glassdoor: {
      rating: 3.8,
      reviews: 7829,
      recommendPct: null,
      url: 'https://www.glassdoor.com/Reviews/Commonwealth-Bank-of-Australia-Reviews-E7922.htm',
    },
    wfh: 'Hybrid — 50% office attendance target. Flexible working arrangements available but being gradually tightened. Core hours 9–3pm. Some roles requiring more on-site.',
    culture: {
      vibe: 'CBA has invested heavily in modernising its technology stack and culture since 2015. The tech team operates more like a product company than a traditional bank IT department — cloud-native, with modern engineering practices. Pay and career mobility are better than most banks, but IT is still a cost centre and advancement is slower than product companies. Good option for stability + decent comp.',
      pros: [
        'Modern technology stack — AWS, React/Node.js, Kubernetes — not legacy COBOL',
        'Scale — working on systems used by 16M+ Australians',
        'Stability — layoff risk very low for tech roles',
        'Hybrid work with meaningful WFH days',
        'Strong graduate program and internal L&D',
      ],
      cons: [
        'IT is still a cost centre — slower innovation and longer ship cycles than product companies',
        'Career progression slow — many layers of management',
        'Low morale cited broadly across the organisation',
        'WFH flexibility being reduced over time',
        'Expected to work long hours on critical projects with reduced resourcing',
      ],
      interviewStyle: 'Structured behavioural interviews (STAR) + technical assessment. Graduate program uses group exercises and case studies. Senior roles require technical panel interview with engineering managers. No LeetCode — practical skills and communication are primary.',
    },
    compensation: {
      gradRange: '$75k – $90k base',
      midRange: '$110k – $145k base',
      seniorRange: '$155k – $200k base',
      notes: 'Superannuation is on top of base. CBA pays better than most AU banks for technical roles. Annual performance bonus 5–15% for tech. No equity — cash-only compensation.',
    },
    techStack: ['Java', 'Python', 'React', 'Node.js', 'AWS', 'Kubernetes', 'Kafka', 'Terraform'],
    roles: ['Software Engineer', 'Cloud Engineer', 'Data Engineer', 'Cyber Security Analyst', 'DevOps Engineer'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Major 482 visa sponsor — one of the largest employers of internationally-sponsored IT workers in AU. Strong preference for local candidates but actively sponsors for specialist roles (cloud architecture, cybersecurity, data).',
    },
    recentNews: [
      { date: '2025', headline: 'CBA invests $3B in technology over 3 years — major cloud and AI modernisation program.' },
      { date: '2024', headline: 'CBA tech team wins multiple AU IT industry awards for cloud transformation work.' },
    ],
  },
  {
    slug: 'deloitte-digital',
    name: 'Deloitte Digital AU',
    tier: 'B',
    tierLabel: 'B — Traditional Enterprise & Consulting',
    tagline: 'Big-4 consulting\'s digital/tech arm — 3,000+ AU tech professionals',
    website: 'deloittedigital.com/au',
    auCity: 'Sydney, Melbourne, Brisbane, Canberra, Perth',
    auHeadcount: '~3,000+ in digital/tech practice',
    founded: '2012 (Digital brand launched)',
    glassdoor: {
      rating: 4.0,
      reviews: 14000,
      recommendPct: null,
      url: 'https://www.glassdoor.com/Reviews/Deloitte-Australia-Reviews-EI_IE2763.0,8_IL.9,18_IN16.htm',
    },
    wfh: 'Hybrid — flexible, client-dependent. Non-client-facing periods allow 2–3 days WFH. Consulting roles often require on-site presence at client offices.',
    culture: {
      vibe: 'Deloitte is one of the more progressive Big-4 consulting firms in Australia. The Digital practice specifically attracts engineers who want consulting variety with better technical depth than traditional IT outsourcers. The graduate program is highly regarded and the structured promotion ladder gives clear visibility. Comp is below product companies but above other consulting firms.',
      pros: [
        '4.0/5 Glassdoor — highest among Big-4 AU consulting firms',
        'Well-regarded graduate program with structured rotation',
        'Variety — exposure to multiple industries and transformation programs',
        'Better technical depth than competitors (Accenture, KPMG)',
        'Strong alumni network — ex-Deloitte network is highly active in AU',
      ],
      cons: [
        'Billable-hours culture — utilisation rates tracked and performance-managed',
        'Comp below product companies — grad salaries competitive with consulting, not tech',
        'Client work can limit technical depth (customise vs build)',
        'Up-or-out culture at higher levels',
        'Work-life balance inconsistent during peak project phases',
      ],
      interviewStyle: 'Case interview for consulting-adjacent roles + structured competency (STAR) + technical for engineering roles. Emphasis on commercial awareness, communication, and problem structuring. Less technical rigour than product companies.',
    },
    compensation: {
      gradRange: '$68k – $80k base',
      midRange: '$95k – $130k',
      seniorRange: '$140k – $200k (senior manager+)',
      notes: 'Comp improves significantly at manager level. Annual bonus component. Strong non-cash benefits. Comp competitive within consulting but lags product company equivalents by 20–30%.',
    },
    techStack: ['Salesforce', 'Azure', 'SAP', 'ServiceNow', 'AWS', 'React', 'Mulesoft', 'Adobe Experience'],
    roles: ['Technology Consultant', 'Software Developer', 'Cloud Architect', 'Business Analyst', 'Cyber Analyst'],
    sponsorship: {
      sponsors482: true,
      accreditedSponsor: true,
      notes: 'Active 482 sponsor — particularly for Salesforce, SAP, and cloud specialists. Strong track record sponsoring international consulting professionals.',
    },
    recentNews: [
      { date: '2025', headline: 'Deloitte Digital AU wins major federal government cyber security transformation contract.' },
      { date: '2024', headline: 'Deloitte AU AI practice doubles headcount — 200+ new AI/ML roles across Sydney and Melbourne.' },
    ],
  },
];

// Sponsorship rankings — based on Department of Home Affairs data, FOI documents,
// and community-sourced AU visa sponsorship database
export const SPONSORSHIP_RANKINGS = [
  { rank: 1, company: 'Accenture', category: 'Consulting', volume: 'Very High', topRoles: ['SAP Consultant', 'Software Engineer', 'Cloud Engineer'], source: 'DoHA / community data' },
  { rank: 2, company: 'Tata Consultancy Services (TCS)', category: 'IT Services', volume: 'Very High', topRoles: ['Java Developer', 'SAP Consultant', 'Test Analyst'], source: 'DoHA / community data' },
  { rank: 3, company: 'Infosys', category: 'IT Services', volume: 'Very High', topRoles: ['Software Engineer', 'Business Analyst', 'SAP Consultant'], source: 'DoHA / community data' },
  { rank: 4, company: 'Wipro', category: 'IT Services', volume: 'High', topRoles: ['Software Developer', 'Cloud Engineer', 'QA Analyst'], source: 'DoHA / community data' },
  { rank: 5, company: 'Amazon / AWS', category: 'Product', volume: 'High', topRoles: ['SDE', 'Solutions Architect', 'Data Engineer'], source: 'DoHA / community data' },
  { rank: 6, company: 'IBM', category: 'Enterprise Tech', volume: 'High', topRoles: ['Cloud Architect', 'AI Engineer', 'Security Consultant'], source: 'DoHA / community data' },
  { rank: 7, company: 'Deloitte', category: 'Consulting', volume: 'High', topRoles: ['Salesforce Consultant', 'Cloud Architect', 'Cyber Analyst'], source: 'DoHA / community data' },
  { rank: 8, company: 'Atlassian', category: 'Product', volume: 'Medium-High', topRoles: ['Software Engineer', 'SRE', 'Product Manager'], source: 'Community verified' },
  { rank: 9, company: 'EY', category: 'Consulting', volume: 'Medium-High', topRoles: ['Technology Consultant', 'Data Analyst', 'Cyber Analyst'], source: 'DoHA / community data' },
  { rank: 10, company: 'Commonwealth Bank (CBA)', category: 'Finance', volume: 'Medium-High', topRoles: ['Software Engineer', 'Cloud Engineer', 'Cyber Security Analyst'], source: 'DoHA / community data' },
  { rank: 11, company: 'ANZ Bank', category: 'Finance', volume: 'Medium', topRoles: ['Software Engineer', 'Data Engineer', 'DevOps Engineer'], source: 'DoHA / community data' },
  { rank: 12, company: 'Cognizant', category: 'IT Services', volume: 'Medium', topRoles: ['Java Developer', '.NET Developer', 'QA Engineer'], source: 'Community verified' },
  { rank: 13, company: 'DXC Technology', category: 'IT Services', volume: 'Medium', topRoles: ['Cloud Engineer', 'SAP Consultant', 'Infrastructure Engineer'], source: 'Community verified' },
  { rank: 14, company: 'Google AU', category: 'Product', volume: 'Medium', topRoles: ['Software Engineer', 'SRE', 'Data Scientist'], source: 'Community verified' },
  { rank: 15, company: 'Canva', category: 'Product', volume: 'Medium', topRoles: ['Software Engineer', 'Frontend Engineer', 'ML Engineer'], source: 'Community verified' },
  { rank: 16, company: 'Westpac', category: 'Finance', volume: 'Medium', topRoles: ['Software Engineer', 'Data Engineer', 'Security Analyst'], source: 'Community verified' },
  { rank: 17, company: 'Capgemini', category: 'Consulting', volume: 'Medium', topRoles: ['Cloud Engineer', 'SAP Consultant', 'DevOps Engineer'], source: 'Community verified' },
  { rank: 18, company: 'KPMG', category: 'Consulting', volume: 'Medium', topRoles: ['Technology Consultant', 'Data Analyst', 'Cyber Engineer'], source: 'Community verified' },
  { rank: 19, company: 'Datacom', category: 'IT Services', volume: 'Low-Medium', topRoles: ['Infrastructure Engineer', 'Cloud Engineer', 'Help Desk Manager'], source: 'Community verified' },
  { rank: 20, company: 'WiseTech Global', category: 'Product', volume: 'Low-Medium', topRoles: ['Software Engineer', 'Data Engineer', 'Product Manager'], source: 'Community verified' },
];
