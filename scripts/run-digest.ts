import 'dotenv/config';
import { fetchAll } from './fetch-digest';
import { filterItems } from './filter';
import { summarizeAll } from './summarize';
import { writeDigestPost } from './generate-post';

async function main() {
  console.log('🚀 Starting AI digest pipeline...\n');

  // 1. Fetch
  const items = await fetchAll();
  if (items.length === 0) {
    console.error('No items fetched. Exiting.');
    process.exit(1);
  }

  // 2. Filter — rule-based + Claude quality gate
  const quality = await filterItems(items);
  if (quality.length === 0) {
    console.error('No quality items passed the filter. Exiting.');
    process.exit(1);
  }

  // 3. Summarize top items (cap at 8 to control cost)
  const topItems = quality.slice(0, 8);
  const entries = await summarizeAll(topItems);

  // 4. Generate MDX post
  writeDigestPost(entries);

  console.log('\n✅ Digest pipeline complete!');
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
