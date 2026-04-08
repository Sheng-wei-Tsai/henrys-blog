export const SKILL_CATEGORIES: Record<string, string[]> = {
  'Languages':     ['Python', 'Java', 'TypeScript', 'Go', 'C++', 'SQL'],
  'Frontend':      ['React', 'Vue', 'Angular', 'CSS/Tailwind', 'Next.js'],
  'Backend':       ['Node.js', 'Django/FastAPI', 'Spring Boot', '.NET'],
  'Cloud & Infra': ['AWS', 'Azure', 'GCP', 'Docker/Kubernetes', 'Terraform', 'Linux'],
  'Data & AI':     ['Machine Learning', 'Data Engineering', 'Spark/Kafka', 'SQL Analytics'],
  'Security':      ['Penetration Testing', 'GRC / Compliance', 'SIEM', 'Network Security'],
};

export interface RoleRequirement {
  role: string;
  required: string[];   // skill names (pipe-separated = OR groups e.g. "Python|Java|Go")
  bonus: string[];
  salaryRange: string;
  salaryMid: number;    // AUD thousands, for sorting
  shortage: boolean;    // JSA national shortage
}

export const ROLE_REQUIREMENTS: RoleRequirement[] = [
  { role: 'Software Engineer',   required: ['Python|Java|TypeScript|Go'],            bonus: ['Docker/Kubernetes', 'AWS'],               salaryRange: '$95k – $160k', salaryMid: 127, shortage: true },
  { role: 'Frontend Engineer',   required: ['React|Vue|Angular', 'TypeScript|CSS/Tailwind'], bonus: ['Next.js', 'SQL'],               salaryRange: '$90k – $145k', salaryMid: 117, shortage: false },
  { role: 'Backend Engineer',    required: ['Python|Java|Node.js|Go'],               bonus: ['Docker/Kubernetes', 'SQL'],               salaryRange: '$100k – $155k', salaryMid: 127, shortage: false },
  { role: 'DevOps / Cloud',      required: ['AWS|Azure|GCP', 'Docker/Kubernetes'],   bonus: ['Terraform', 'Linux', 'Python'],           salaryRange: '$115k – $175k', salaryMid: 145, shortage: true },
  { role: 'Data / AI Engineer',  required: ['Python', 'SQL Analytics|Spark/Kafka'],  bonus: ['Machine Learning', 'AWS'],               salaryRange: '$110k – $165k', salaryMid: 137, shortage: true },
  { role: 'ML Engineer',         required: ['Python', 'Machine Learning'],            bonus: ['Data Engineering', 'AWS', 'Spark/Kafka'], salaryRange: '$120k – $180k', salaryMid: 150, shortage: true },
  { role: 'Cyber Security',      required: ['Network Security|SIEM|Penetration Testing'], bonus: ['Python', 'GRC / Compliance'],       salaryRange: '$105k – $165k', salaryMid: 135, shortage: true },
  { role: 'Solutions Architect', required: ['AWS|Azure|GCP', 'Python|Java'],         bonus: ['Terraform', 'Docker/Kubernetes'],         salaryRange: '$140k – $200k', salaryMid: 170, shortage: false },
];

// Company slugs that hire each role
export const ROLE_COMPANY_MAP: Record<string, string[]> = {
  'Software Engineer':   ['atlassian', 'canva', 'google-au', 'amazon-aws', 'safetyCulture'],
  'Frontend Engineer':   ['canva', 'atlassian', 'safetyCulture'],
  'Backend Engineer':    ['atlassian', 'canva', 'amazon-aws'],
  'DevOps / Cloud':      ['amazon-aws', 'google-au', 'ibm-au', 'cba'],
  'Data / AI Engineer':  ['canva', 'google-au', 'cba', 'ibm-au'],
  'ML Engineer':         ['google-au', 'canva', 'amazon-aws'],
  'Cyber Security':      ['cba', 'ibm-au', 'accenture', 'deloitte-digital'],
  'Solutions Architect': ['amazon-aws', 'ibm-au', 'accenture'],
};
