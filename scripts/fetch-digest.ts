import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

export interface FeedItem {
  source: string;
  title: string;
  link: string;
  summary: string;
  published: string;
}

// ── Curated high-quality essay & research sources ───────────────
// Every source here publishes substantive, peer-reviewed, or expert-written content only.
const ESSAY_FEEDS = [
  {
    name: 'The Gradient',
    url:  'https://thegradient.pub/rss/',
    desc: 'Long-form essays by AI researchers — one of the best in the field',
  },
  {
    name: 'Ahead of AI',
    url:  'https://magazine.sebastianraschka.com/feed',
    desc: 'Sebastian Raschka — deep ML research breakdowns',
  },
  {
    name: 'Anthropic Research',
    url:  'https://www.anthropic.com/rss.xml',
    desc: 'Original safety and capability research from Anthropic',
  },
  {
    name: 'Google DeepMind',
    url:  'https://deepmind.google/blog/rss.xml',
    desc: 'Flagship research from DeepMind',
  },
  {
    name: 'OpenAI Research',
    url:  'https://openai.com/blog/rss.xml',
    desc: 'Research papers and technical posts from OpenAI',
  },
  {
    name: 'Google Research',
    url:  'https://research.google/blog/rss/',
    desc: 'Applied ML research from Google Brain / Research',
  },
  {
    name: 'AI Alignment Forum',
    url:  'https://www.alignmentforum.org/feed.xml',
    desc: 'Rigorous alignment and safety research essays',
  },
];

// ── Hugging Face Daily Papers ───────────────────────────────────
// Community-upvoted papers — trending = worth reading
async function fetchHFPapers(): Promise<FeedItem[]> {
  try {
    const { data } = await axios.get('https://huggingface.co/api/daily_papers', {
      params: { limit: 8 },
      timeout: 10000,
    });

    return (data as Array<{
      paper: { title: string; id: string; summary: string; publishedAt: string };
      upvotes: number;
    }>)
      .filter(d => d.upvotes >= 10)   // only papers with real community interest
      .map(d => ({
        source:    'Hugging Face Papers',
        title:     d.paper.title,
        link:      `https://huggingface.co/papers/${d.paper.id}`,
        summary:   d.paper.summary,
        published: d.paper.publishedAt,
      }));
  } catch (err) {
    console.warn('⚠️  Could not fetch HF daily papers:', (err as Error).message);
    return [];
  }
}

// ── Papers With Code — trending (sorted by GitHub stars) ────────
async function fetchPapersWithCode(): Promise<FeedItem[]> {
  try {
    const { data } = await axios.get('https://paperswithcode.com/api/v1/papers/', {
      params: { ordering: '-github_stars', items_per_page: 6 },
      timeout: 10000,
    });

    return (data.results as Array<{
      title: string; url_abs: string; abstract: string;
      published: string; github_stars: number;
    }>)
      .filter(p => p.github_stars >= 50)  // must have real traction
      .map(p => ({
        source:    'Papers With Code',
        title:     p.title,
        link:      p.url_abs,
        summary:   p.abstract ?? '',
        published: p.published ?? new Date().toISOString(),
      }));
  } catch (err) {
    console.warn('⚠️  Could not fetch Papers With Code:', (err as Error).message);
    return [];
  }
}

// ── RSS feed fetcher ─────────────────────────────────────────────
async function fetchRSS(name: string, url: string, max = 4): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, max).map(item => ({
      source:    name,
      title:     item.title ?? 'Untitled',
      link:      item.link ?? '',
      summary:   item.contentSnippet ?? item.content ?? '',
      published: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.warn(`⚠️  Could not fetch ${name}:`, (err as Error).message);
    return [];
  }
}

// ── Hacker News — top trending stories (Algolia API) ────────────
// High points + high comments = the tech community is genuinely discussing it.
async function fetchHackerNews(): Promise<FeedItem[]> {
  try {
    const { data } = await axios.get('https://hn.algolia.com/api/v1/search', {
      params: {
        tags:           'story',
        numericFilters: 'points>150,num_comments>30',
        hitsPerPage:    10,
      },
      timeout: 10000,
    });

    return (data.hits as Array<{
      title:       string;
      url:         string | null;
      story_text:  string | null;
      points:      number;
      num_comments: number;
      created_at:  string;
    }>)
      .filter(h => h.url)   // skip Ask HN / text-only posts
      .map(h => ({
        source:    'Hacker News',
        title:     h.title,
        link:      h.url!,
        summary:   h.story_text ?? `${h.points} points · ${h.num_comments} comments on Hacker News`,
        published: h.created_at,
      }));
  } catch (err) {
    console.warn('⚠️  Could not fetch Hacker News:', (err as Error).message);
    return [];
  }
}

// ── Main export ──────────────────────────────────────────────────
export async function fetchAll(): Promise<FeedItem[]> {
  console.log('🔍 Fetching high-quality AI sources...\n');

  const [rssResults, hfPapers, pwcPapers, hnStories] = await Promise.all([
    Promise.all(ESSAY_FEEDS.map(f => fetchRSS(f.name, f.url))),
    fetchHFPapers(),
    fetchPapersWithCode(),
    fetchHackerNews(),
  ]);

  const all = [...rssResults.flat(), ...hfPapers, ...pwcPapers, ...hnStories];
  console.log(`✅ Fetched ${all.length} items from ${ESSAY_FEEDS.length + 3} sources`);
  return all;
}
