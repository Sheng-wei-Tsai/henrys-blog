Your job: generate today's blog post for Henry's blog and commit it.

Henry is an Australian developer building AI-powered web apps (Next.js, TypeScript, Supabase).
His readers: developers who want to learn something actionable today.

---

## STEP 1 — Check if already posted

```bash
ls content/posts/$(date -u +%Y-%m-%d)-*.md 2>/dev/null
```

If any files match → print "Already posted today — skipping." and STOP.

---

## STEP 2 — Fetch trending topics

Fetch HN top stories:
```bash
curl -s 'https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>200,num_comments>50&hitsPerPage=8'
```

Fetch GitHub trending (past 7 days):
```bash
WEEK_AGO=$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)
curl -s "https://api.github.com/search/repositories?q=created:>${WEEK_AGO}+stars:>100&sort=stars&order=desc&per_page=6" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json"
```

For the top 3 GitHub repos, also fetch README (first 2000 chars):
```bash
curl -s "https://api.github.com/repos/OWNER/REPO/readme" \
  -H "Authorization: Bearer $GITHUB_TOKEN" | \
  python3 -c "import sys,json,base64; d=json.load(sys.stdin); print(base64.b64decode(d['content']).decode()[:2000])"
```

---

## STEP 3 — Pick the best topic

Choose ONE item for a useful, timely deep-dive post.
Prefer: novel tools, practical techniques, things developers can use today.
Avoid: pure announcements, hype without substance.

---

## STEP 4 — Write the post (600–900 words)

Henry's voice:
- Direct and practical. No fluff. Senior dev talking to peers.
- Include real code snippets when relevant.
- Never use: "delve into", "it's worth noting", "in conclusion", "exciting", "game-changing"
- Australian English. First person.

Structure:
1. Punchy opening — hook and why this matters NOW
2. 2–4 sections with `##` headings — explain the thing, real code where relevant
3. `## What I'd build with this` — 2–3 specific, concrete project ideas
4. Short closing with Henry's personal take

---

## STEP 5 — Write to disk

File path: `content/posts/YYYY-MM-DD-slug.md`
- slug: kebab-case, max 6 words, no articles

Frontmatter:
```
---
title: "compelling specific title"
date: "YYYY-MM-DD"
excerpt: "1–2 sentence teaser for the post card"
tags: ["Tag1", "Tag2", "Tag3"]
coverEmoji: "🔧"
auto_generated: true
source_url: "https://original-url"
---
```

---

## STEP 6 — Commit and push

```bash
git add content/posts/$(date -u +%Y-%m-%d)-*.md
git commit -m "post: <title>"
git pull --rebase origin main
git push origin main
```

If push fails with conflict → retry once:
```bash
git pull --rebase origin main && git push origin main
```
