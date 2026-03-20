export const resume = {
  name:       'Henry Tsai',
  legalName:  'Sheng-Wei Tsai',
  title:      'Full Stack Developer',
  location:   'Brisbane, QLD, Australia',
  email:      'henrytsaiqut@gmail.com',
  phone:      '0449 937 959',
  linkedin:   'linkedin.com/in/henry-tsai-973438294',
  github:     'github.com/Sheng-wei-Tsai',
  portfolio:  'henrys-blog.vercel.app',
  visa:       'Full Australian work rights (485 Temporary Graduate Visa)',

  summary: `Full Stack Developer with a Master of Computer Science from QUT and a strong track record of building real-world applications independently. Proficient in TypeScript, React, Next.js, Python, and PostgreSQL, with hands-on experience integrating AI APIs (OpenAI, Anthropic) into production systems. Passionate about building tools that solve real problems — from AI-powered job search engines to mobile apps. Actively seeking a graduate or junior developer role in Brisbane or remote.`,

  skills: {
    'Frontend':     ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'React Native'],
    'Backend':      ['Node.js', 'Python', 'C#', 'Ruby on Rails', 'Django', 'REST APIs'],
    'Database':     ['PostgreSQL', 'Supabase', 'SQL', 'Appwrite'],
    'AI / ML':      ['OpenAI API', 'Anthropic Claude API', 'Prompt Engineering', 'RAG', 'Function Calling'],
    'DevOps / Tools': ['Git', 'GitHub', 'GitHub Actions', 'Docker', 'Vercel', 'CI/CD'],
  },

  projects: [
    {
      name:        'Personal Career Platform & Blog',
      url:         'https://github.com/Sheng-wei-Tsai/henrys-blog',
      demo:        'https://henrys-blog.vercel.app',
      period:      '2026 – Present',
      description: 'Full-stack personal platform combining a technical blog, AI-powered weekly digest, Australian IT job search engine, AI cover letter generator, and job application tracker.',
      highlights: [
        'Built an AI digest pipeline that fetches content from OpenAI, Google AI, DeepMind, HuggingFace, and ArXiv, applies a GPT quality filter, then auto-generates summarised MDX posts with Mermaid diagrams',
        'Integrated Adzuna API to aggregate thousands of Australian IT jobs with location/type filters, save-to-Supabase, and one-click cover letter generation',
        'Built a streaming AI cover letter generator (OpenAI GPT-4o-mini) tailored to Australian HR standards, with history saved per user in Supabase',
        'Implemented GitHub OAuth via Supabase Auth, user dashboard, and application status tracker (Applied → Interview → Offer)',
      ],
      tech: ['Next.js 16', 'TypeScript', 'Supabase (PostgreSQL)', 'OpenAI API', 'GitHub OAuth', 'Vercel', 'Tailwind CSS'],
    },
    {
      name:        'MovieFlix — Mobile Movie Discovery App',
      url:         'https://github.com/Sheng-wei-Tsai/mobile_movie_app',
      period:      '2025',
      description: 'Cross-platform mobile app for discovering and tracking movies, featuring real-time search with debouncing, a custom trending algorithm, and a light/dark theme.',
      highlights: [
        'Integrated TMDB API for live movie data and built a trending algorithm tracking user search patterns in Appwrite',
        'Implemented real-time search with debouncing to minimise API calls and improve UX',
        'Delivered consistent UI across iOS and Android using NativeWind (Tailwind CSS for React Native)',
      ],
      tech: ['React Native', 'Expo', 'TypeScript', 'TMDB API', 'Appwrite', 'NativeWind'],
    },
    {
      name:        'AI-Powered Application Tracking System',
      url:         'https://github.com/Sheng-wei-Tsai/AI-powered-application-tracking-system',
      period:      '2025',
      description: 'Full-stack job application tracker with server-side rendering, AI-assisted features, and containerised deployment targeting cloud platforms.',
      highlights: [
        'Built with React Router v7 using SSR, hot module replacement, and optimised asset bundling',
        'Containerised with Docker for deployment to AWS ECS, Google Cloud Run, and Azure',
        'Designed a clean TypeScript-first architecture with 90%+ type coverage',
      ],
      tech: ['TypeScript', 'React Router v7', 'Tailwind CSS', 'Vite', 'Docker', 'SSR'],
    },
    {
      name:        'AI Agent in Python',
      url:         'https://github.com/Sheng-wei-Tsai/build-an-ai-agent-in-python',
      period:      '2026',
      description: 'Autonomous AI agent with function-calling capabilities, able to execute Python scripts, perform file operations, and run a calculator — all orchestrated by an LLM.',
      highlights: [
        'Implemented OpenAI function calling to let the LLM decide which tools to invoke',
        'Built a modular architecture with separate modules for prompts, function registry, and config',
        'Designed the agent loop to handle multi-step reasoning and tool chaining',
      ],
      tech: ['Python', 'OpenAI API', 'Function Calling', 'uv'],
    },
    {
      name:        'Webbit — Reddit Clone',
      url:         'https://github.com/Sheng-wei-Tsai/clone_reddit',
      period:      '2023',
      description: 'A near full-featured Reddit clone with communities, posts (text/image/video/link), comments, upvotes, user messaging, and subscriptions.',
      highlights: [
        'Built core Reddit features from scratch: communities, nested comments, voting, and user subscriptions',
        'Implemented direct messaging and real-time chat between users',
        'Designed relational data models for Users, Submissions, Communities, and Comments in Rails',
      ],
      tech: ['Ruby on Rails', 'JavaScript', 'HTML', 'CSS', 'PostgreSQL'],
    },
  ],

  education: [
    {
      degree:      'Master of Computer Science',
      institution: 'Queensland University of Technology (QUT)',
      location:    'Brisbane, QLD',
      period:      '2022 – July 2024',
      notes:       'Relevant coursework: Algorithms & Data Structures, Web Application Development, Machine Learning, Software Architecture, Cloud Computing',
    },
  ],

  certifications: [] as string[],

  languages: ['English (Professional)', 'Mandarin Chinese (Native)'],
};
