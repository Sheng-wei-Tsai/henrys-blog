import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const postsDir   = path.join(process.cwd(), 'content/posts');
const digestsDir = path.join(process.cwd(), 'content/digests');
const githotDir  = path.join(process.cwd(), 'content/githot');

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readingTime: string;
  content: string;
  coverEmoji?: string;
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  return files
    .map(file => {
      const slug = file.replace(/\.(mdx|md)$/, '');
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        coverEmoji: data.coverEmoji || '✍️',
        readingTime: readingTime(content).text,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(postsDir, `${slug}.mdx`);
  const fallback = path.join(postsDir, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;
  const raw = fs.readFileSync(target, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    coverEmoji: data.coverEmoji || '✍️',
    readingTime: readingTime(content).text,
    content,
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach(p => p.tags.forEach(t => tags.add(t)));
  return Array.from(tags);
}

function readDir(dir: string): Post[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  return files
    .map(file => {
      const slug = file.replace(/\.(mdx|md)$/, '');
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        coverEmoji: data.coverEmoji || '🤖',
        readingTime: readingTime(content).text,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllDigests(): Post[] {
  return readDir(digestsDir);
}

export function getDigestBySlug(slug: string): Post | null {
  const filePath = path.join(digestsDir, `${slug}.mdx`);
  const fallback = path.join(digestsDir, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;
  const raw = fs.readFileSync(target, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    coverEmoji: data.coverEmoji || '🤖',
    readingTime: readingTime(content).text,
    content,
  };
}

export function getAllGithot(): Post[] {
  return readDir(githotDir);
}

export function getGithotBySlug(slug: string): Post | null {
  const filePath = path.join(githotDir, `${slug}.mdx`);
  const fallback = path.join(githotDir, `${slug}.md`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return null;
  const raw = fs.readFileSync(target, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    coverEmoji: data.coverEmoji || '🔥',
    readingTime: readingTime(content).text,
    content,
  };
}
