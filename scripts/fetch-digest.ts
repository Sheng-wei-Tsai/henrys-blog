import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

// ── RSS Sources ────────────────────────────────────────────────
const RSS_FEEDS = [
  { name: 'OpenAI',          url: 'https://openai.com/blog/rss.xml' },
  { name: 'HuggingFace',     url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'DeepMind',        url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Google AI',       url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Google Research', url: 'https://research.google/blog/rss/' },
];

// ── ArXiv categories ───────────────────────────────────────────
const ARXIV_CATEGORIES = ['cs.AI', 'cs.LG', 'cs.CL'];
const ARXIV_MAX = 5;

export interface FeedItem {
  source: string;
  title: string;
  link: string;
  summary: string;
  published: string;
}

// Fetch latest N items from a single RSS feed
async function fetchRSS(name: string, url: string, max = 3): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, max).map(item => ({
      source: name,
      title: item.title ?? 'Untitled',
      link: item.link ?? '',
      summary: item.contentSnippet ?? item.content ?? '',
      published: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.warn(`⚠️  Could not fetch ${name} RSS:`, (err as Error).message);
    return [];
  }
}

// Fetch latest papers from ArXiv across categories
async function fetchArXiv(): Promise<FeedItem[]> {
  const query = ARXIV_CATEGORIES.map(c => `cat:${c}`).join('+OR+');
  const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${ARXIV_MAX}`;

  try {
    const { data } = await axios.get<string>(url);

    const entries = [...data.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    return entries.map(([, body]) => {
      const title     = body.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim() ?? 'Untitled';
      const link      = body.match(/<id>([\s\S]*?)<\/id>/)?.[1].trim() ?? '';
      const summary   = body.match(/<summary>([\s\S]*?)<\/summary>/)?.[1].trim() ?? '';
      const published = body.match(/<published>([\s\S]*?)<\/published>/)?.[1].trim() ?? '';
      return { source: 'ArXiv', title, link, summary, published };
    });
  } catch (err) {
    console.warn('⚠️  Could not fetch ArXiv:', (err as Error).message);
    return [];
  }
}

// Main export: returns all items combined
export async function fetchAll(): Promise<FeedItem[]> {
  console.log('🔍 Fetching sources...');

  const rssResults = await Promise.all(
    RSS_FEEDS.map(f => fetchRSS(f.name, f.url))
  );
  const arxivResults = await fetchArXiv();

  const all = [...rssResults.flat(), ...arxivResults];
  console.log(`✅ Fetched ${all.length} items total`);
  return all;
}

// Run directly: npx tsx scripts/fetch-digest.ts
if (process.argv[1].endsWith('fetch-digest.ts')) {
  fetchAll().then(items => {
    items.forEach(i => console.log(`[${i.source}] ${i.title}`));
  });
}
