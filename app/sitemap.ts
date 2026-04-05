import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrys-blog.vercel.app').replace(/\/$/, '');

function slugsFrom(dir: string): string[] {
  const full = path.join(process.cwd(), 'content', dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(f => f.replace(/\.(md|mdx)$/, ''));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, priority: 1.0 },
    { url: `${BASE_URL}/about`,         lastModified: now, priority: 0.9 },
    { url: `${BASE_URL}/blog`,          lastModified: now, priority: 0.9 },
    { url: `${BASE_URL}/jobs`,          lastModified: now, priority: 0.8 },
    { url: `${BASE_URL}/interview-prep`, lastModified: now, priority: 0.8 },
    { url: `${BASE_URL}/cover-letter`,  lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/resume`,        lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/learn`,         lastModified: now, priority: 0.7 },
    { url: `${BASE_URL}/digest`,        lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/githot`,        lastModified: now, priority: 0.6 },
  ];

  const postRoutes = slugsFrom('posts').map(slug => ({
    url:          `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    priority:     0.7 as const,
  }));

  const digestRoutes = slugsFrom('digests').map(slug => ({
    url:          `${BASE_URL}/digest/${slug}`,
    lastModified: now,
    priority:     0.5 as const,
  }));

  const githubRoutes = slugsFrom('githot').map(slug => ({
    url:          `${BASE_URL}/githot/${slug}`,
    lastModified: now,
    priority:     0.5 as const,
  }));

  return [...staticRoutes, ...postRoutes, ...digestRoutes, ...githubRoutes];
}
