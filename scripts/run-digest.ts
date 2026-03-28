import 'dotenv/config';
import { execSync } from 'child_process';
import { fetchAll } from './fetch-digest';
import { filterItems } from './filter';
import { summarizeAll } from './summarize';
import { writeDigestPost } from './generate-post';

async function main() {
  console.log('🚀 AI Research Digest pipeline\n');

  // 1. Fetch from curated high-quality sources
  const items = await fetchAll();
  if (items.length === 0) {
    console.error('No items fetched. Check your network / source URLs.');
    process.exit(1);
  }

  // 2. Filter — rule-based scoring + Claude quality gate
  const quality = await filterItems(items);
  if (quality.length === 0) {
    console.error('No items passed the quality gate. Try again later.');
    process.exit(1);
  }

  // 3. Summarize — cap at 6 so it stays readable
  const topItems = quality.slice(0, 6);
  const entries  = await summarizeAll(topItems);

  // 4. Write digest post (.md so Obsidian can open it)
  const filePath = writeDigestPost(entries);

  // 5. Commit + push so Vercel deploys automatically
  const dateStr = new Date().toISOString().split('T')[0];
  console.log('\n\u{1F4E4} Pushing to GitHub...');
  try {
    execSync(`git add "${filePath}"`, { stdio: 'inherit' });
    execSync(`git commit -m "digest: AI Research Digest ${dateStr}"`, { stdio: 'inherit' });
    // Retry push with rebase to handle parallel job conflicts
    const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
    let pushed = false;
    for (let attempt = 1; attempt <= 3 && !pushed; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise(r => setTimeout(r, 10000 * attempt));
          execSync('git pull --rebase origin main', { stdio: 'inherit', env: gitEnv, timeout: 60000 });
        }
        execSync('git push origin main', { stdio: 'inherit', env: gitEnv, timeout: 60000 });
        pushed = true;
      } catch (pushErr) {
        if (attempt === 3) throw pushErr;
        console.warn(`Push attempt ${attempt} failed, retrying...`);
      }
    }
    console.log('Deployed — Vercel is building now');
  } catch (err) {
    console.warn('Git push failed (maybe nothing changed):', (err as Error).message);
  }

  console.log('\n✅ Digest pipeline complete!');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Pipeline failed:', err);
    process.exit(1);
  });
