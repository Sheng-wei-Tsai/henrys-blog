/**
 * Starter diagrams shown on /posts/diagram. Hand-crafted, editorial-style
 * Mermaid sources following the cathrynlavery/diagram-design principles:
 *  - ≤8 nodes per diagram
 *  - Short labels (≤5 words)
 *  - Single concept per diagram
 *  - One accent node (the user's focal point) styled in vermilion via
 *    `style X fill:#c0281c,color:#fff`
 *
 * If you add a new starter diagram here, also bump the count in
 * `app/posts/layout.tsx` (counts['/posts/diagram']).
 */

export type DiagramCategory =
  | 'IT'
  | 'AI'
  | 'Software Developer'
  | 'Fullstack';

export interface StarterDiagram {
  id: string;
  title: string;
  category: DiagramCategory;
  emoji: string;
  description: string;
  mermaid: string;
  takeaways: string[];
}

export const STARTER_DIAGRAMS: StarterDiagram[] = [
  {
    id: 'how-the-internet-works',
    title: 'How the Internet Works',
    category: 'IT',
    emoji: '🌐',
    description:
      'When you type a URL, four parties cooperate to deliver the page in milliseconds. The DNS resolver does the work most people forget.',
    mermaid: `sequenceDiagram
    autonumber
    participant U as You
    participant B as Browser
    participant D as DNS Resolver
    participant S as Web Server
    U->>B: type techpath.au
    B->>D: where is techpath.au?
    D-->>B: 76.76.21.21
    B->>S: GET / (HTTPS)
    S-->>B: HTML + assets
    B-->>U: rendered page`,
    takeaways: [
      'DNS turns a name into an IP — without it, every link would be a number.',
      'TLS happens before the GET — that handshake is what the lock icon means.',
      'Most page-load time is round-trips, not bytes. Caching is the fix.',
    ],
  },
  {
    id: 'how-an-llm-generates-text',
    title: 'How an LLM Generates Text',
    category: 'AI',
    emoji: '🧠',
    description:
      'A language model never "writes" — it predicts the next token, one at a time, sampling from a probability distribution.',
    mermaid: `flowchart LR
    A[Your prompt] --> B[Tokeniser]
    B --> C[Embeddings]
    C --> D[Transformer<br/>attention layers]
    D --> E[Probability<br/>over next token]
    E --> F[Sampler]
    F --> G[New token]
    G -. append .-> A
    style D fill:#c0281c,color:#fff,stroke:#140a05,stroke-width:2px`,
    takeaways: [
      'Output is built one token at a time — that is why streaming feels live.',
      'Temperature changes the sampler, not the model — same weights, different boldness.',
      'Attention is the part that grew. Bigger context windows = more attention compute.',
    ],
  },
  {
    id: 'sdlc-with-ci-cd',
    title: 'SDLC with CI/CD',
    category: 'Software Developer',
    emoji: '⚙️',
    description:
      'Modern software is a loop, not a line. The faster the loop runs, the smaller and safer each change is.',
    mermaid: `flowchart TD
    P[Plan<br/>issue, ticket]
    C[Code<br/>local branch]
    R[Review<br/>pull request]
    T[Test<br/>CI pipeline]
    D[Deploy<br/>preview + prod]
    M[Monitor<br/>logs + alerts]
    P --> C --> R --> T --> D --> M
    M -. learn .-> P
    style D fill:#c0281c,color:#fff,stroke:#140a05,stroke-width:2px`,
    takeaways: [
      'Every step is automatable except the first and last — those need humans.',
      '"Deploy" is the focal node because deploy frequency is the strongest signal of team health.',
      'Monitoring closes the loop — without it you only ship, you do not learn.',
    ],
  },
  {
    id: 'modern-web-app-architecture',
    title: 'Modern Web App Architecture',
    category: 'Fullstack',
    emoji: '🏗️',
    description:
      'A typical 2026 fullstack request: cached at the edge, rendered close to the user, and only hits the database when nothing else can answer.',
    mermaid: `flowchart TB
    U[User]
    CDN[CDN / Edge cache]
    FE[Next.js<br/>React Server Components]
    API[API routes<br/>/ Server actions]
    DB[(Postgres<br/>+ Row Level Security)]
    Q[Cache<br/>Redis / KV]
    U --> CDN --> FE --> API --> DB
    API <--> Q
    style API fill:#c0281c,color:#fff,stroke:#140a05,stroke-width:2px`,
    takeaways: [
      'The CDN answers most requests — your server only sees the misses.',
      'API routes are the only layer that touches the database. Everything else is cache or render.',
      'Row-Level Security in Postgres replaces 80% of the auth code you used to write in Express.',
    ],
  },
];

export function getStarterDiagram(id: string): StarterDiagram | undefined {
  return STARTER_DIAGRAMS.find(d => d.id === id);
}
