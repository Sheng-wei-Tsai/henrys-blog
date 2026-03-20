// ─────────────────────────────────────────────────────────────
// IT Skill Pathways — curated learning paths for job seekers
// Each skill uses spaced repetition: review at day 1, 3, 7, 14, 30
// ─────────────────────────────────────────────────────────────

export type Resource = {
  title: string;
  url:   string;
  type:  'docs' | 'course' | 'video' | 'article' | 'practice';
  free:  boolean;
};

export type Skill = {
  id:             string;
  name:           string;
  description:    string;
  why:            string;   // why this gets you hired
  topics:         string[]; // concrete things to learn
  resources:      Resource[];
  project:        string;   // mini project to solidify the skill
  estimatedDays:  number;
};

export type Phase = {
  id:       string;
  title:    string;
  duration: string;
  summary:  string;
  skills:   Skill[];
};

export type SkillPath = {
  id:          string;
  title:       string;
  emoji:       string;
  description: string;
  timeline:    string;
  avgSalary:   string;
  demand:      'High' | 'Very High' | 'Medium';
  phases:      Phase[];
};

// ─── Spaced Repetition Schedule ───────────────────────────────
// Based on the Ebbinghaus forgetting curve + Leitner system
// Review count → days until next review
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]; // days

export function getNextReviewDate(reviewCount: number): Date {
  const days = REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)];
  const next = new Date();
  next.setDate(next.getDate() + days);
  next.setHours(9, 0, 0, 0); // remind at 9am
  return next;
}

export function getReviewLabel(reviewCount: number): string {
  const labels = ['1 day', '3 days', '7 days', '2 weeks', '30 days → Mastered!'];
  return labels[Math.min(reviewCount, labels.length - 1)];
}

// ─── PATH 1: Junior Frontend Developer ────────────────────────
const frontendPath: SkillPath = {
  id:          'junior-frontend',
  title:       'Junior Frontend Developer',
  emoji:       '🎨',
  description: 'Build beautiful, interactive web interfaces. The most in-demand entry-level path in Australia right now.',
  timeline:    '16 weeks',
  avgSalary:   'AUD $65,000–$85,000',
  demand:      'Very High',
  phases: [
    {
      id:       'phase-1',
      title:    'Web Foundations',
      duration: 'Weeks 1–4',
      summary:  'The non-negotiable basics. Every interviewer will test these.',
      skills: [
        {
          id: 'html-basics',
          name: 'HTML & Semantic Markup',
          description: 'The skeleton of every webpage. HTML defines structure and meaning — not just visual layout.',
          why: 'Interviewers check if you write semantic HTML (nav, main, article, section) rather than div soup. Affects accessibility and SEO.',
          topics: ['Document structure', 'Semantic elements', 'Forms & inputs', 'Accessibility attributes (alt, aria-label)', 'Meta tags & SEO basics'],
          resources: [
            { title: 'MDN HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', type: 'docs', free: true },
            { title: 'HTML Full Course — freeCodeCamp', url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE', type: 'video', free: true },
            { title: 'HTML Reference', url: 'https://htmlreference.io', type: 'docs', free: true },
          ],
          project: 'Build a personal profile page with semantic HTML — include a nav, main content sections, a contact form, and proper heading hierarchy. No CSS yet.',
          estimatedDays: 3,
        },
        {
          id: 'css-fundamentals',
          name: 'CSS Fundamentals',
          description: 'Styling, typography, colours, box model, and the cascade. The skill that separates developers from good developers.',
          why: 'CSS is constantly tested in interviews. Most junior devs can\'t explain specificity or the box model — knowing this makes you stand out.',
          topics: ['Box model', 'Selectors & specificity', 'Colours & typography', 'Units (rem, em, %, px, vw)', 'Pseudo-classes & pseudo-elements', 'CSS variables', 'Transitions & animations'],
          resources: [
            { title: 'CSS Tricks — Complete Guide', url: 'https://css-tricks.com/guides/', type: 'docs', free: true },
            { title: 'Kevin Powell YouTube', url: 'https://www.youtube.com/@KevinPowell', type: 'video', free: true },
            { title: 'CSS Diner (selectors game)', url: 'https://flukeout.github.io', type: 'practice', free: true },
          ],
          project: 'Style your HTML profile page. Match a design from Dribbble as closely as possible. Focus on typography, spacing, and colour.',
          estimatedDays: 4,
        },
        {
          id: 'css-layout',
          name: 'CSS Layout (Flexbox + Grid)',
          description: 'The two modern systems for arranging elements on a page. Essential for building any real UI.',
          why: 'Nearly every frontend job listing mentions Flexbox and Grid. They\'re tested in coding assessments.',
          topics: ['Flexbox: axes, justify-content, align-items, flex-wrap', 'Grid: template columns/rows, grid-area, auto-fill', 'Responsive layout patterns', 'Position: relative, absolute, sticky, fixed'],
          resources: [
            { title: 'Flexbox Froggy (game)', url: 'https://flexboxfroggy.com', type: 'practice', free: true },
            { title: 'Grid Garden (game)', url: 'https://cssgridgarden.com', type: 'practice', free: true },
            { title: 'CSS Grid — Kevin Powell', url: 'https://www.youtube.com/watch?v=rg7Fvvl3taU', type: 'video', free: true },
          ],
          project: 'Build a responsive 3-column card layout (like a blog grid) that stacks to 1 column on mobile. Use CSS Grid for the layout and Flexbox inside each card.',
          estimatedDays: 4,
        },
        {
          id: 'javascript-basics',
          name: 'JavaScript Fundamentals',
          description: 'The programming language of the web. Makes pages interactive and handles logic.',
          why: 'The most tested topic in junior frontend interviews. You will be asked to reverse a string, filter an array, or explain closures.',
          topics: ['Variables (let, const)', 'Functions & arrow functions', 'Arrays & array methods (map, filter, reduce)', 'Objects & destructuring', 'DOM manipulation', 'Events & event listeners', 'Async/await & Promises', 'ES6+ features'],
          resources: [
            { title: 'JavaScript.info', url: 'https://javascript.info', type: 'docs', free: true },
            { title: 'Eloquent JavaScript (free book)', url: 'https://eloquentjavascript.net', type: 'course', free: true },
            { title: 'freeCodeCamp JS Algorithms', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', type: 'course', free: true },
          ],
          project: 'Build a to-do list app: add/remove/complete tasks, filter by status, persist to localStorage. No frameworks.',
          estimatedDays: 10,
        },
        {
          id: 'git-basics',
          name: 'Git & GitHub',
          description: 'Version control — how all professional developers manage code. Every job requires it.',
          why: 'Day 1 skill at any company. Not knowing Git is an immediate red flag to interviewers.',
          topics: ['init, add, commit, push, pull', 'Branching & merging', 'Pull requests', 'Resolving merge conflicts', '.gitignore', 'Writing good commit messages'],
          resources: [
            { title: 'Git — The Simple Guide', url: 'https://rogerdudler.github.io/git-guide/', type: 'docs', free: true },
            { title: 'Oh My Git! (game)', url: 'https://ohmygit.org', type: 'practice', free: true },
            { title: 'GitHub Skills', url: 'https://skills.github.com', type: 'course', free: true },
          ],
          project: 'Push all your previous projects to GitHub with clean commits. Write a README for each. Practice creating a branch, making changes, and merging via a pull request.',
          estimatedDays: 3,
        },
      ],
    },
    {
      id:       'phase-2',
      title:    'Modern Stack',
      duration: 'Weeks 5–10',
      summary:  'The tools Australian companies actually hire for. React + TypeScript is the dominant stack.',
      skills: [
        {
          id: 'react-fundamentals',
          name: 'React',
          description: 'The most popular JavaScript library for building UIs. Used by ~40% of all frontend jobs in Australia.',
          why: '9 out of 10 frontend job listings in Brisbane mention React. This is the single highest-leverage skill to learn.',
          topics: ['JSX syntax', 'Components (functional)', 'Props & state (useState)', 'useEffect', 'Lists & keys', 'Forms & controlled inputs', 'Component composition', 'React DevTools'],
          resources: [
            { title: 'React Docs (official)', url: 'https://react.dev/learn', type: 'docs', free: true },
            { title: 'Full React Course — Dave Gray', url: 'https://www.youtube.com/watch?v=RVFAyFWO4go', type: 'video', free: true },
            { title: 'Scrimba React Course', url: 'https://scrimba.com/learn/learnreact', type: 'course', free: false },
          ],
          project: 'Rebuild your to-do list in React. Add a weather widget using a free API. Deploy to Vercel.',
          estimatedDays: 10,
        },
        {
          id: 'typescript-basics',
          name: 'TypeScript',
          description: 'JavaScript with types. Catches bugs before they happen and makes code easier to read.',
          why: 'TypeScript is now expected in most professional React roles. Knowing it vs not knowing it is a $5–10k salary difference.',
          topics: ['Basic types (string, number, boolean, array)', 'Interfaces & type aliases', 'Optional properties', 'Union types', 'Generics basics', 'TypeScript with React (props typing)'],
          resources: [
            { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'docs', free: true },
            { title: 'Total TypeScript — free lessons', url: 'https://www.totaltypescript.com/tutorials', type: 'course', free: true },
            { title: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play', type: 'practice', free: true },
          ],
          project: 'Convert your React to-do list to TypeScript. Define interfaces for all your data shapes. Fix all type errors.',
          estimatedDays: 5,
        },
        {
          id: 'tailwind-css',
          name: 'Tailwind CSS',
          description: 'A utility-first CSS framework. Write styles directly in HTML classnames. Extremely fast once you know it.',
          why: 'Tailwind is mentioned in 40%+ of junior frontend job listings. It\'s now the default choice for new projects.',
          topics: ['Utility classes', 'Responsive prefixes (sm: md: lg:)', 'Dark mode (dark:)', 'Custom configuration', 'Component extraction with @apply'],
          resources: [
            { title: 'Tailwind Docs', url: 'https://tailwindcss.com/docs', type: 'docs', free: true },
            { title: 'Tailwind CSS Full Course', url: 'https://www.youtube.com/watch?v=lCxcTsOHrjo', type: 'video', free: true },
          ],
          project: 'Rebuild your profile page using Tailwind CSS only. Add dark mode support.',
          estimatedDays: 4,
        },
        {
          id: 'rest-apis',
          name: 'REST APIs & Data Fetching',
          description: 'How to communicate with backend services. Fetching, displaying, and handling data from external sources.',
          why: 'Every real app fetches data. You will absolutely be asked about this in interviews and coding assessments.',
          topics: ['HTTP methods (GET, POST, PUT, DELETE)', 'fetch() API', 'async/await patterns', 'Error handling', 'Loading states', 'JSON parsing', 'Environment variables for API keys'],
          resources: [
            { title: 'MDN Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', type: 'docs', free: true },
            { title: 'REST API Tutorial', url: 'https://restapitutorial.com', type: 'docs', free: true },
            { title: 'Public APIs list', url: 'https://github.com/public-apis/public-apis', type: 'practice', free: true },
          ],
          project: 'Build a movie search app using the TMDB free API. Show results with a loading spinner and handle errors gracefully.',
          estimatedDays: 4,
        },
        {
          id: 'react-hooks-advanced',
          name: 'React Hooks (Advanced)',
          description: 'The more powerful hooks that make React components clean and efficient.',
          why: 'useCallback, useMemo, and useContext are commonly asked in interviews. Understanding them shows you\'re above average.',
          topics: ['useContext (global state)', 'useReducer', 'useCallback & useMemo (performance)', 'Custom hooks', 'useRef'],
          resources: [
            { title: 'React Hooks Deep Dive — Kent C. Dodds', url: 'https://kentcdodds.com/blog/react-hooks-pitfalls', type: 'article', free: true },
            { title: 'Official React Hooks Reference', url: 'https://react.dev/reference/react', type: 'docs', free: true },
          ],
          project: 'Build a multi-step form with useReducer. Add a theme toggle using useContext. Extract the form logic into a custom hook.',
          estimatedDays: 5,
        },
      ],
    },
    {
      id:       'phase-3',
      title:    'Production Ready',
      duration: 'Weeks 11–16',
      summary:  'The skills that separate candidates who get hired from those who don\'t.',
      skills: [
        {
          id: 'nextjs',
          name: 'Next.js',
          description: 'The React framework for production. Server-side rendering, routing, API routes, and deployment.',
          why: 'Most Brisbane companies using React are using Next.js. It\'s listed in ~60% of React job postings.',
          topics: ['App Router', 'Server vs Client Components', 'File-based routing', 'API routes', 'Data fetching (SSR, SSG, ISR)', 'Image optimisation', 'Deployment to Vercel'],
          resources: [
            { title: 'Next.js Docs', url: 'https://nextjs.org/docs', type: 'docs', free: true },
            { title: 'Next.js Full Course — Fireship', url: 'https://www.youtube.com/watch?v=Sklc_fQBmcs', type: 'video', free: true },
          ],
          project: 'Build a full blog with Next.js: MDX posts, dynamic routes, SSG for posts, a contact form API route. Deploy to Vercel.',
          estimatedDays: 8,
        },
        {
          id: 'testing-basics',
          name: 'Testing (Jest + React Testing Library)',
          description: 'Writing automated tests to prove your code works. Expected at all mid-size and large companies.',
          why: 'Listing "experience with testing" on your resume or GitHub immediately sets you apart from 80% of junior candidates.',
          topics: ['Unit tests with Jest', 'Component testing with RTL', 'Testing user interactions', 'Mocking API calls', 'Coverage reports'],
          resources: [
            { title: 'React Testing Library Docs', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'docs', free: true },
            { title: 'Testing JavaScript — Kent C. Dodds', url: 'https://testingjavascript.com', type: 'course', free: false },
          ],
          project: 'Write tests for your to-do list React app. Test: adding an item, completing an item, filtering. Reach 80%+ coverage.',
          estimatedDays: 5,
        },
        {
          id: 'web-performance',
          name: 'Web Performance',
          description: 'Making websites load fast. Core Web Vitals are a ranking factor and a common interview topic.',
          why: 'Performance knowledge is rare in junior devs. Mentioning LCP, CLS, FID in an interview makes you memorable.',
          topics: ['Core Web Vitals (LCP, CLS, INP)', 'Lighthouse audits', 'Image optimisation', 'Code splitting & lazy loading', 'Bundle analysis'],
          resources: [
            { title: 'web.dev Performance', url: 'https://web.dev/performance/', type: 'docs', free: true },
            { title: 'PageSpeed Insights', url: 'https://pagespeed.web.dev', type: 'practice', free: true },
          ],
          project: 'Run Lighthouse on one of your projects. Identify the top 3 issues. Fix them. Screenshot your before/after scores.',
          estimatedDays: 3,
        },
        {
          id: 'portfolio-project',
          name: 'Portfolio Project',
          description: 'One polished, full-featured project that demonstrates everything you\'ve learned. This is what gets you interviews.',
          why: 'Recruiters look at your GitHub. One impressive project beats 10 tutorial clones. This is the most important thing you will build.',
          topics: ['Problem/solution framing (what does it solve?)', 'Clean code & README', 'Deployed & live', 'Mobile responsive', 'Using real data (API or database)', 'Good UX & design'],
          resources: [
            { title: 'How to build a portfolio project', url: 'https://www.freecodecamp.org/news/how-to-build-an-impressive-portfolio/', type: 'article', free: true },
            { title: 'Design inspiration — Dribbble', url: 'https://dribbble.com', type: 'practice', free: true },
          ],
          project: 'Build your capstone: ideas — expense tracker with charts, job application tracker, recipe app with AI, or a local events finder. Stack: Next.js + TypeScript + Supabase + Tailwind.',
          estimatedDays: 14,
        },
        {
          id: 'interview-prep',
          name: 'Interview Preparation',
          description: 'Technical and behavioural interview preparation specific to Australian companies.',
          why: 'Being technically skilled is only half the battle. Companies in Australia heavily weight cultural fit and communication.',
          topics: ['STAR method for behavioural questions', 'Reverse a string, FizzBuzz, array manipulation (always asked)', 'Explaining your projects clearly', 'Salary negotiation in Australia', 'Reading job descriptions intelligently', 'Questions to ask interviewers'],
          resources: [
            { title: 'LeetCode Easy Problems', url: 'https://leetcode.com/problemset/?difficulty=Easy', type: 'practice', free: true },
            { title: 'Frontend Interview Handbook', url: 'https://www.frontendinterviewhandbook.com', type: 'docs', free: true },
            { title: 'Glassdoor — Australian tech interviews', url: 'https://www.glassdoor.com.au', type: 'practice', free: true },
          ],
          project: 'Do 5 mock interviews with a friend or use Pramp.com. Record yourself explaining one of your projects in 2 minutes. Watch it back.',
          estimatedDays: 7,
        },
      ],
    },
  ],
};

// ─── PATH 2: Junior Full Stack Developer ──────────────────────
const fullstackPath: SkillPath = {
  id:          'junior-fullstack',
  title:       'Junior Full Stack Developer',
  emoji:       '⚡',
  description: 'Build both the frontend and backend. The most versatile role — small companies especially love full stack devs.',
  timeline:    '20 weeks',
  avgSalary:   'AUD $70,000–$90,000',
  demand:      'Very High',
  phases: [
    {
      id: 'phase-1',
      title: 'Frontend Foundation',
      duration: 'Weeks 1–6',
      summary: 'Complete the frontend foundations before touching backend.',
      skills: [
        { ...frontendPath.phases[0].skills[0] }, // HTML
        { ...frontendPath.phases[0].skills[2] }, // CSS Layout
        { ...frontendPath.phases[0].skills[3] }, // JavaScript
        { ...frontendPath.phases[0].skills[4] }, // Git
        { ...frontendPath.phases[1].skills[0] }, // React
        { ...frontendPath.phases[1].skills[1] }, // TypeScript
      ],
    },
    {
      id: 'phase-2',
      title: 'Backend & Databases',
      duration: 'Weeks 7–13',
      summary: 'The server side: APIs, databases, and authentication.',
      skills: [
        {
          id: 'nodejs-express',
          name: 'Node.js & Express',
          description: 'Run JavaScript on the server. Build REST APIs that your frontend can consume.',
          why: 'The most common backend stack in Australian startups. Same language as frontend = easier to switch contexts.',
          topics: ['Node.js runtime', 'Express routing', 'Middleware', 'Error handling', 'Environment variables', 'CORS', 'RESTful API design'],
          resources: [
            { title: 'Node.js Docs', url: 'https://nodejs.org/en/docs', type: 'docs', free: true },
            { title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'docs', free: true },
            { title: 'Node.js API Course — Dave Gray', url: 'https://www.youtube.com/watch?v=jivyItmsu18', type: 'video', free: true },
          ],
          project: 'Build a REST API for a blog: CRUD for posts, user registration, JWT authentication. Test with Postman.',
          estimatedDays: 8,
        },
        {
          id: 'postgresql',
          name: 'PostgreSQL & SQL',
          description: 'The most popular relational database. Powers most serious web applications.',
          why: 'SQL knowledge is required in ~70% of full stack job listings. Understanding databases makes you a much stronger developer.',
          topics: ['SELECT, INSERT, UPDATE, DELETE', 'JOINs (inner, left, right)', 'Indexes & performance', 'Relationships (one-to-many, many-to-many)', 'Transactions', 'SQL via Supabase'],
          resources: [
            { title: 'SQLBolt (interactive)', url: 'https://sqlbolt.com', type: 'practice', free: true },
            { title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com', type: 'docs', free: true },
            { title: 'Supabase Quickstart', url: 'https://supabase.com/docs/guides/getting-started', type: 'docs', free: true },
          ],
          project: 'Add a PostgreSQL database to your blog API. Store posts and users in a real database. Add a Supabase integration.',
          estimatedDays: 7,
        },
        {
          id: 'auth-security',
          name: 'Authentication & Security',
          description: 'How users log in safely. Passwords, sessions, tokens, and the most common security mistakes.',
          why: 'Security vulnerabilities are the #1 cause of real-world incidents. Knowing auth properly impresses senior engineers in interviews.',
          topics: ['JWT (JSON Web Tokens)', 'bcrypt password hashing', 'OAuth (GitHub, Google)', 'HTTP-only cookies', 'CORS configuration', 'OWASP Top 10 basics'],
          resources: [
            { title: 'Supabase Auth Docs', url: 'https://supabase.com/docs/guides/auth', type: 'docs', free: true },
            { title: 'JWT.io', url: 'https://jwt.io', type: 'docs', free: true },
            { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', type: 'docs', free: true },
          ],
          project: 'Add authentication to your blog API. Hash passwords, issue JWTs, protect routes. Add Google OAuth.',
          estimatedDays: 6,
        },
      ],
    },
    {
      id: 'phase-3',
      title: 'Full Stack Integration',
      duration: 'Weeks 14–20',
      summary: 'Bring it all together: deploy full-stack apps and get job ready.',
      skills: [
        { ...frontendPath.phases[2].skills[0] }, // Next.js
        {
          id: 'docker-basics',
          name: 'Docker Basics',
          description: 'Package your app so it runs the same everywhere. Used in most professional workflows.',
          why: 'Docker is mentioned in 30% of full stack job listings. Being able to containerise an app is a strong differentiator.',
          topics: ['Dockerfile', 'docker build & run', 'docker-compose', 'Environment variables in containers', 'Deploying to Railway or Render'],
          resources: [
            { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'docs', free: true },
            { title: 'Docker Tutorial — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', type: 'video', free: true },
          ],
          project: 'Dockerise your blog API + PostgreSQL with docker-compose. One command to start the whole stack.',
          estimatedDays: 5,
        },
        { ...frontendPath.phases[2].skills[3] }, // Portfolio Project
        { ...frontendPath.phases[2].skills[4] }, // Interview Prep
      ],
    },
  ],
};

// ─── PATH 3: Junior Backend Developer ─────────────────────────
const backendPath: SkillPath = {
  id:          'junior-backend',
  title:       'Junior Backend Developer',
  emoji:       '⚙️',
  description: 'Build the systems that power apps: APIs, databases, authentication, and infrastructure.',
  timeline:    '18 weeks',
  avgSalary:   'AUD $70,000–$90,000',
  demand:      'High',
  phases: [
    {
      id: 'phase-1',
      title: 'Programming Fundamentals',
      duration: 'Weeks 1–5',
      summary: 'Solid programming foundations in Python or Node.js.',
      skills: [
        { ...frontendPath.phases[0].skills[4] }, // Git
        {
          id: 'python-basics',
          name: 'Python Fundamentals',
          description: 'One of the two dominant backend languages in Australia (the other being JavaScript/Node.js).',
          why: 'Python is used for backend, data pipelines, scripting, and AI. Extremely in demand at Brisbane tech companies.',
          topics: ['Variables, functions, classes', 'Lists, dicts, sets', 'File I/O', 'Error handling', 'Modules & packages', 'Virtual environments', 'pip & pyproject.toml'],
          resources: [
            { title: 'Python Docs Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'docs', free: true },
            { title: 'Automate the Boring Stuff (free book)', url: 'https://automatetheboringstuff.com', type: 'course', free: true },
            { title: 'Codecademy Python', url: 'https://www.codecademy.com/learn/learn-python-3', type: 'course', free: false },
          ],
          project: 'Build a command-line tool: either a file organiser, a URL shortener, or an expense tracker with JSON persistence.',
          estimatedDays: 10,
        },
        {
          id: 'data-structures',
          name: 'Data Structures & Algorithms',
          description: 'The theory of how to store and process data efficiently. Required for technical interviews.',
          why: 'Most backend technical interviews test algorithms. You cannot skip this if you want to pass screening rounds at serious companies.',
          topics: ['Arrays, linked lists', 'Stacks & queues', 'Hash maps', 'Binary search', 'Sorting algorithms', 'Big O notation', 'Trees & graphs basics'],
          resources: [
            { title: 'NeetCode 75 (free)', url: 'https://neetcode.io/practice', type: 'practice', free: true },
            { title: 'CS50 (Harvard, free)', url: 'https://cs50.harvard.edu/x/', type: 'course', free: true },
            { title: 'Visualgo (visualisations)', url: 'https://visualgo.net', type: 'practice', free: true },
          ],
          project: 'Solve 20 LeetCode Easy problems. Write your solutions in clean, commented code. Understand the time complexity of each.',
          estimatedDays: 14,
        },
      ],
    },
    {
      id: 'phase-2',
      title: 'Backend Core',
      duration: 'Weeks 6–12',
      summary: 'APIs, databases, and server infrastructure.',
      skills: [
        {
          id: 'fastapi',
          name: 'FastAPI (Python Web Framework)',
          description: 'The fastest growing Python web framework. Great for REST APIs and now widely used for AI-powered backends.',
          why: 'FastAPI is used by major companies and is the go-to choice for Python APIs in 2025/2026. Easy to learn, hard to outgrow.',
          topics: ['Routes & path parameters', 'Pydantic models (validation)', 'Async endpoints', 'Dependency injection', 'OpenAPI docs auto-generation', 'Background tasks'],
          resources: [
            { title: 'FastAPI Docs', url: 'https://fastapi.tiangolo.com', type: 'docs', free: true },
            { title: 'FastAPI Full Course', url: 'https://www.youtube.com/watch?v=7t2alSnE2-I', type: 'video', free: true },
          ],
          project: 'Build a task management REST API: CRUD for tasks, user authentication with JWT, input validation with Pydantic.',
          estimatedDays: 8,
        },
        { ...fullstackPath.phases[1].skills[1] }, // PostgreSQL
        { ...fullstackPath.phases[1].skills[2] }, // Auth & Security
        {
          id: 'cloud-basics',
          name: 'Cloud & Deployment (AWS basics)',
          description: 'Where your code actually runs. AWS is the most used cloud in Australia.',
          why: 'AWS knowledge is mentioned in 50% of backend job listings in Australia. Even basic knowledge gets you ahead.',
          topics: ['EC2 (virtual machines)', 'S3 (file storage)', 'RDS (managed databases)', 'Environment variables & secrets', 'Basic networking (VPC, security groups)', 'GitHub Actions for CI/CD'],
          resources: [
            { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', type: 'practice', free: true },
            { title: 'AWS Cloud Practitioner — FreeCodeCamp', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', type: 'video', free: true },
          ],
          project: 'Deploy your FastAPI app to AWS EC2 or Render. Set up a CI/CD pipeline with GitHub Actions that auto-deploys on push.',
          estimatedDays: 7,
        },
      ],
    },
    {
      id: 'phase-3',
      title: 'Advanced & Job Ready',
      duration: 'Weeks 13–18',
      summary: 'Distinguish yourself from other candidates.',
      skills: [
        { ...fullstackPath.phases[1].skills[0] }, // Docker
        {
          id: 'system-design-basics',
          name: 'System Design Basics',
          description: 'How to think about building systems that scale. Asked in junior interviews at larger companies.',
          why: 'Even junior backend devs are asked "how would you design X?" knowing the vocabulary impresses interviewers.',
          topics: ['Client-server model', 'Caching (Redis basics)', 'Load balancing', 'Database scaling (read replicas, sharding)', 'Message queues (basics)', 'REST vs GraphQL vs gRPC'],
          resources: [
            { title: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', type: 'docs', free: true },
            { title: 'ByteByteGo YouTube', url: 'https://www.youtube.com/@ByteByteGo', type: 'video', free: true },
          ],
          project: 'Design (on paper) a URL shortener: draw the system diagram, explain the database schema, describe how you\'d handle 1M requests/day.',
          estimatedDays: 5,
        },
        { ...frontendPath.phases[2].skills[3] }, // Portfolio Project
        { ...frontendPath.phases[2].skills[4] }, // Interview Prep
      ],
    },
  ],
};

export const SKILL_PATHS: SkillPath[] = [frontendPath, fullstackPath, backendPath];

export function getPathById(id: string): SkillPath | undefined {
  return SKILL_PATHS.find(p => p.id === id);
}

export function getAllSkillIds(path: SkillPath): string[] {
  return path.phases.flatMap(ph => ph.skills.map(s => s.id));
}
