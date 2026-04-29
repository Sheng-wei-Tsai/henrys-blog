import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const diagramsDir = path.resolve(process.cwd(), 'content/diagrams');

export type DiagramTopic =
  | 'Networking'
  | 'Databases'
  | 'System Design'
  | 'DevOps'
  | 'Security'
  | 'APIs'
  | 'Distributed Systems'
  | 'Frontend'
  | 'Backend'
  | 'AI/ML';

export type DiagramDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Diagram {
  slug: string;
  title: string;
  date: string;
  topic: DiagramTopic;
  difficulty: DiagramDifficulty;
  mermaid: string;
  excerpt: string;
}

export function getAllDiagrams(): Diagram[] {
  if (!fs.existsSync(diagramsDir)) return [];

  return fs.readdirSync(diagramsDir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const slug = filename.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(diagramsDir, filename), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        title:      data.title      ?? slug,
        date:       data.date       ?? slug.slice(0, 10),
        topic:      data.topic      ?? 'System Design',
        difficulty: data.difficulty ?? 'intermediate',
        mermaid:    data.mermaid    ?? '',
        excerpt:    content.trim().split('\n')[0] ?? '',
      } satisfies Diagram;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDiagramsByTopic(topic: DiagramTopic): Diagram[] {
  return getAllDiagrams().filter(d => d.topic === topic);
}

export function getDiagram(slug: string): Diagram | undefined {
  return getAllDiagrams().find(d => d.slug === slug);
}
