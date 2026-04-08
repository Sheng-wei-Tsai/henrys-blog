import { getAllPosts, getAllDigests, getAllGithot, Post } from '@/lib/posts';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrysdigitallife.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc2822(dateStr: string): string {
  return new Date(dateStr).toUTCString();
}

function buildItem(post: Post, section: string): string {
  const link = `${BASE}/${section}/${post.slug}`;
  const title   = escapeXml(post.title);
  const excerpt = escapeXml(post.excerpt || '');
  const cats    = post.tags.map(t => `      <category>${escapeXml(t)}</category>`).join('\n');

  return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc2822(post.date)}</pubDate>
      <description>${excerpt}</description>
${cats}
    </item>`;
}

export async function GET() {
  const posts   = getAllPosts().slice(0, 20);
  const digests = getAllDigests().slice(0, 10);
  const githot  = getAllGithot().slice(0, 10);

  // Merge and sort by date, newest first
  const all: { post: Post; section: string }[] = [
    ...posts.map(p  => ({ post: p, section: 'blog'   })),
    ...digests.map(p => ({ post: p, section: 'digest' })),
    ...githot.map(p  => ({ post: p, section: 'githot' })),
  ].sort((a, b) => new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
   .slice(0, 30);

  const lastBuildDate = all[0] ? toRfc2822(all[0].post.date) : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Henry Tsai — Full Stack Developer</title>
    <link>${BASE}</link>
    <description>Writing about web development, AI, and tech careers in Australia. Daily AI digests, GitHub trending, and original posts.</description>
    <language>en-AU</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
${all.map(({ post, section }) => buildItem(post, section)).join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
