/**
 * Information Age RSS feed fetcher
 * Source: https://ia.acs.org.au — ACS flagship tech news publication
 * Feed:   https://ia.acs.org.au/feed
 *
 * Revalidates every 6 hours. Filters to career/tech/AI categories.
 * Falls back to empty array on any network or parse error.
 */

export interface IAFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  category: string[];
  author?: string;
}

const FEED_URL = 'https://ia.acs.org.au/feed';

const KEEP_CATEGORIES = [
  'ai', 'artificial intelligence', 'machine learning',
  'careers', 'salary', 'workforce', 'skills', 'hiring',
  'cybersecurity', 'security',
  'cloud', 'devops',
  'data', 'analytics',
  'software', 'developer',
  'policy', 'regulation',
  'diversity', 'gender',
  'australia', 'ict',
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`);
  const plainPattern = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`);
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(plainPattern);
  return plainMatch ? plainMatch[1].trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'g');
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'g');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = cdataRe.exec(xml)) !== null) results.push(m[1].trim());
  while ((m = plainRe.exec(xml)) !== null) results.push(m[1].trim());
  return results.filter(Boolean);
}

function isRelevant(categories: string[]): boolean {
  if (categories.length === 0) return true;
  const lower = categories.map(c => c.toLowerCase());
  return lower.some(c => KEEP_CATEGORIES.some(k => c.includes(k)));
}

export async function fetchIAFeed(limit = 12): Promise<IAFeedItem[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 21600 },
      headers: { 'User-Agent': 'henry-blog/1.0 (AU IT career site; RSS reader)' },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    const items: IAFeedItem[] = itemBlocks
      .map(block => {
        const title = stripHtml(extractTag(block, 'title'));
        const link = extractTag(block, 'link') || extractTag(block, 'guid');
        const pubDateRaw = extractTag(block, 'pubDate');
        const description = stripHtml(extractTag(block, 'description')).slice(0, 220);
        const categories = extractAllTags(block, 'category').map(c => stripHtml(c));
        const author = stripHtml(
          extractTag(block, 'dc:creator') || extractTag(block, 'author')
        );

        let pubDate = pubDateRaw;
        try { pubDate = new Date(pubDateRaw).toISOString(); } catch { /* keep raw */ }

        return { title, link, pubDate, description, category: categories, author };
      })
      .filter(item => item.title && item.link && isRelevant(item.category))
      .slice(0, limit);

    return items;
  } catch {
    return [];
  }
}

export function formatRelativeDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
