// Hardcoded universal questions for international IT graduates in Australia.
// These are NOT AI-generated — accuracy matters for visa and salary advice.

export type UniversalQuestion = {
  id:           string;
  text:         string;
  scenario:     string;
  focus:        string;
  concepts:     string[];
  framework:    string;
  questionType: 'text';
};

export const UNIVERSAL_QUESTIONS: UniversalQuestion[] = [
  {
    id:       'uq1',
    text:     'Tell me about yourself.',
    scenario: 'This is almost always the opening question at every Australian tech interview — phone screen, first round, or final panel. You have 60–90 seconds to position yourself as the right candidate.',
    focus:    'Can you tell a clear, confident story that connects your background to THIS role in Australia? Interviewers want to know: who are you, what have you done, and why are you here.',
    concepts: ['60-second pitch', 'Present-Past-Future structure', 'Australian context', 'Relevance to role'],
    framework: 'Use Present–Past–Future: "I\'m currently [relevant background/degree]. Before that, I [key experience or project]. I\'m excited about [this company/role] because [specific, genuine reason]. I moved to Australia because [brief, positive framing]." Keep it under 90 seconds. End with an invitation: "I\'d love to learn more about the team."',
    questionType: 'text',
  },
  {
    id:       'uq2',
    text:     'Why did you choose Australia — and why do you want to work here specifically?',
    scenario: 'Australian hiring managers ask this more often than you\'d expect. They want to know if you\'re here long-term, genuinely interested in the AU market, and not just using the job as a stepping stone.',
    focus:    'Authenticity and commitment. The interviewer is partly doing a visa/stability risk assessment — they want to invest in someone who\'s planning to stay.',
    concepts: ['Long-term commitment', 'AU tech ecosystem knowledge', 'Cultural fit', 'Genuine motivation'],
    framework: 'Be honest but strategic. Mention 1–2 genuine reasons (quality of life, tech opportunities, career growth in a specific sector). Show you\'ve done research on Australia\'s tech market specifically — mention the company\'s growth or a specific AU product. Avoid: "I came for the visa." Frame it as a deliberate career choice, not migration convenience.',
    questionType: 'text',
  },
  {
    id:       'uq3',
    text:     'What is your current visa status, and when are you available to start?',
    scenario: 'This comes up in almost every AU phone screen. Interviewers need to know if sponsorship is required, when you can start, and whether there are any restrictions on hours or location.',
    focus:    'Transparency and preparedness. There is no shame in needing sponsorship — but you must answer clearly and confidently, not evasively.',
    concepts: ['Visa types (485, 482, PR, Citizen)', 'Sponsorship requirements', 'Work rights', 'Start date negotiation'],
    framework: 'State your visa type plainly: "I\'m on a [485/482/student/PR] visa with [full/limited] work rights until [date]." If you need sponsorship: "I would need 482 sponsorship, which I understand is something [company] has supported before." Then pivot to availability: "I can start [2 weeks/immediately/date]. Are there any visa-related concerns I can address directly?" Don\'t wait to be asked — bring it up proactively.',
    questionType: 'text',
  },
  {
    id:       'uq4',
    text:     'Where do you see yourself in 5 years?',
    scenario: 'A standard question in Australian interviews, but it carries extra weight for international grads — the interviewer is partly assessing whether you plan to stay in Australia and whether you have realistic expectations of the local career ladder.',
    focus:    'Ambition balanced with realism. Show growth mindset and commitment to Australia without sounding like you\'re planning to leave.',
    concepts: ['Career progression in AU', 'Technical depth vs management', 'Company loyalty', 'Realistic benchmarking'],
    framework: 'Structure: "[1-2 years goal within this role] → [3-5 year growth aspiration]. I see Australia as a long-term base — the tech ecosystem here, particularly in [fintech/SaaS/etc], is where I want to build my career." Be specific about technical or leadership growth. Tie it back to the company: "I\'d hope to [contribute to X / grow into Y] here." Avoid: vague goals, mentioning other countries, or ambitions clearly outside the role.',
    questionType: 'text',
  },
  {
    id:       'uq5',
    text:     'What are your salary expectations?',
    scenario: 'Australian employers often ask this early — sometimes in the job ad itself. International graduates frequently undersell themselves by anchoring to their home country\'s rates or being afraid to name a number.',
    focus:    'Market awareness and confidence. Knowing your worth in the AU market and being able to state it without apologizing.',
    concepts: ['AU salary benchmarks', 'Superannuation (11.5% on top)', 'Total remuneration vs base', 'Anchoring and negotiation'],
    framework: 'Always quote a range based on research, not feelings. "Based on my research and roles at this level in [city], I\'m targeting $[X]–$[Y] base, exclusive of super." Key fact: Australian salaries are quoted exclusive of superannuation (11.5% employer contribution on top). Sources: SEEK Salary Insights, LinkedIn Salary, the role\'s listed range if visible. Don\'t lowball to seem humble — Australian interviewers expect you to know your worth. If pushed below your range, ask what flexibility exists in other benefits.',
    questionType: 'text',
  },
  {
    id:       'uq6',
    text:     'Tell me about a time you worked in a cross-cultural or diverse team.',
    scenario: 'Australian tech teams are genuinely diverse — you\'ll work with colleagues from India, China, Eastern Europe, South America, and Australia. This question tests whether you can collaborate effectively across cultural differences without friction.',
    focus:    'Collaboration, communication, and cultural intelligence. The STAR method (Situation, Task, Action, Result) is the expected structure.',
    concepts: ['STAR method', 'Cultural intelligence', 'Communication across cultures', 'Conflict resolution', 'Inclusive teamwork'],
    framework: 'Use STAR: Situation (describe the team diversity — nationalities, timezones, communication styles), Task (what needed to be accomplished), Action (specifically what YOU did to bridge differences — communication style adjustments, active listening, creating clarity), Result (outcome + what you learned). Bonus: mention something culturally specific about Australia you\'ve observed and adapted to. Avoid: making the story about problems others caused — keep YOU as the active problem-solver.',
    questionType: 'text',
  },
  {
    id:       'uq7',
    text:     'How do you handle feedback — especially from someone more senior than you?',
    scenario: 'Australian workplace culture is relatively flat — junior devs are expected to engage with feedback directly and professionally, not just say "yes" to everything. But there\'s also a fine line between confidence and appearing defensive.',
    focus:    'Self-awareness, coachability, and assertiveness. AU interviewers want someone who can receive feedback gracefully AND push back respectfully when they disagree.',
    concepts: ['Growth mindset', 'AU workplace culture (flat hierarchy)', 'Psychological safety', 'Professional assertiveness'],
    framework: 'Give a real example using STAR. Show that you: (1) listened without defensiveness, (2) asked clarifying questions to understand the feedback, (3) acted on valid points, (4) respectfully raised concerns when you disagreed with your reasoning. Key AU cultural note: "I try to understand the reasoning first, then discuss if I see it differently — Australian teams I\'ve observed value directness as long as it\'s respectful." Avoid: "I always accept feedback" (sounds passive) or stories where you argued back without resolution.',
    questionType: 'text',
  },
  {
    id:       'uq8',
    text:     'Do you have any questions for us?',
    scenario: 'This closes almost every Australian interview. Candidates who say "No, I think you\'ve covered everything" immediately signal low engagement. The questions you ask here shape the interviewer\'s final impression as much as your answers.',
    focus:    'Genuine curiosity, research, and strategic positioning. The best questions demonstrate you\'ve done homework AND help you evaluate whether this is the right role for you.',
    concepts: ['Thoughtful questions', 'Company research', 'Role clarity', 'Team culture', 'Growth signals'],
    framework: 'Prepare 4–5 questions, expect to ask 2–3. Great categories: (1) Role/team: "What does success look like in the first 6 months?" (2) Culture: "How does the team handle disagreements about technical direction?" (3) Growth: "What\'s the typical career progression from this role?" (4) Company-specific: reference something real you read about the company. Avoid: salary (you\'ve discussed it), leave entitlements (too early), or questions easily answered by their website. End with: "Is there anything about my background I can clarify or expand on?" — this gives you a second chance to address any concerns.',
    questionType: 'text',
  },
];
