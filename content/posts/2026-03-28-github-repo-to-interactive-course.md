---
title: "Turn Any GitHub Repo Into an Interactive HTML Course With Claude Code"
date: "2026-03-28"
excerpt: "codebase-to-course hit 2,100+ stars this week for good reason — it's a Claude Code skill that spits out a self-contained HTML course from any repo. Here's how it works and how to wire it into a proper web app."
tags: ["Claude Code", "Developer Tools", "Next.js", "AI", "Education"]
coverEmoji: "🎓"
auto_generated: true
source_url: "https://github.com/zarazhangrui/codebase-to-course"
---

codebase-to-course dropped on GitHub this week and immediately blew up — 2,100+ stars in days. The pitch is simple: point Claude Code at any repo, get back a single HTML file that teaches how the code works. Scroll-based modules, code↔plain-English translations, animated architecture diagrams, interactive quizzes, glossary tooltips. No dependencies, works offline. If you're building anything for developer education — or you just want to understand a codebase you didn't write — this is the most practical trick I've seen come out of the Claude Code ecosystem.

## What It Actually Does

The skill lives in `~/.claude/skills/codebase-to-course`. You install it, open a project in Claude Code, and say something like "turn this codebase into an interactive course". Claude reads your repo, reasons about the architecture, then generates a single self-contained HTML file.

The output isn't a wall of text. It's a proper learning experience — left-pane code, right-pane plain-English explanation, animated data flow diagrams that show what happens when a user action fires, and quizzes that test whether you actually understand the structure ("You want to add a favourites feature — which files change?").

Installation is dead simple:

```bash
# Clone the repo
git clone https://github.com/zarazhangrui/codebase-to-course

# Drop the skill into your Claude Code skills directory
cp -r codebase-to-course/codebase-to-course ~/.claude/skills/

# Open any project in Claude Code, then just ask:
# "Turn this codebase into an interactive course"
```

The target audience the README describes is "vibe coders" — people building with AI who want to understand what they've built well enough to steer it better, not get a CS degree. That framing is honest and the output reflects it. This isn't academic. It's practical comprehension.

## Wiring It Into a Next.js + Supabase App

The interesting move is turning this into a product. Imagine a web app where a user pastes a GitHub URL, hits generate, and gets back a hosted interactive course they can share. Here's how I'd structure that.

**The core flow:**
1. User submits a GitHub repo URL
2. Your API clones the repo into a temp directory
3. You invoke Claude via the Anthropic API with the skill's system prompt + repo contents
4. Claude returns the HTML string
5. You store it in Supabase and serve it at a unique URL

```typescript
// app/api/generate-course/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const anthropic = new Anthropic();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: Request) {
  const { repoUrl, userId } = await req.json();

  // Clone repo to temp dir
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'course-'));
  await simpleGit().clone(repoUrl, tmpDir, ['--depth', '1']);

  // Read file tree (simplified — you'd want to filter node_modules etc)
  const files = await collectFiles(tmpDir);

  // Load the skill's system prompt
  const skillPrompt = await fs.readFile(
    path.join(process.cwd(), 'skills/codebase-to-course/prompt.md'),
    'utf-8'
  );

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    system: skillPrompt,
    messages: [{
      role: 'user',
      content: `Turn this codebase into an interactive course:\n\n${files}`
    }]
  });

  const html = (message.content[0] as { text: string }).text;

  // Store in Supabase
  const slug = crypto.randomUUID();
  await supabase.from('courses').insert({
    slug,
    user_id: userId,
    repo_url: repoUrl,
    html_content: html,
    created_at: new Date().toISOString()
  });

  // Cleanup
  await fs.rm(tmpDir, { recursive: true });

  return Response.json({ slug });
}
```

For serving the course, a simple dynamic route:

```typescript
// app/course/[slug]/page.tsx
export default async function CoursePage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('courses')
    .select('html_content')
    .eq('slug', params.slug)
    .single();

  // Render the raw HTML — dangerouslySetInnerHTML is fine here,
  // it's your own generated content
  return (
    <div dangerouslySetInnerHTML={{ __html: data.html_content }} />
  );
}
```

For large repos you'll want to queue generation jobs rather than blocking on the API call — a Supabase Edge Function with a status column works well.

## What I'd Build With This

**1. OSS onboarding generator.** A CLI tool that runs as part of a repo's GitHub Actions workflow — on every major release, it auto-generates an updated course and publishes it to GitHub Pages. New contributors get a living, always-current guide to the codebase. Zero manual docs work.

**2. "Understand this dependency" browser extension.** You're on an npm package page, you click the extension, it pulls the GitHub source and generates a course on the spot. Finally understand what that obscure middleware you've been copy-pasting actually does.

**3. Code review learning tool.** When a PR touches unfamiliar parts of the codebase, trigger a focused course generation scoped to just those changed files. Reviewers get context, juniors get education, and the whole thing attaches as a PR comment.

---

The reason this hit 2k+ stars so fast is that it solves a real problem with zero friction — the output is genuinely useful and the setup takes five minutes. The Claude Code skill pattern is underrated as a distribution mechanism too; dropping a folder into `~/.claude/skills/` is about as low-barrier as it gets. I'm genuinely curious to see what people build on top of the core generation capability — the web app angle is obvious but there are a dozen other useful wrappers hiding in here.
