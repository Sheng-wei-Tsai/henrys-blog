---
title: "Turn Any Codebase Into an Interactive HTML Course With One Claude Prompt"
date: "2026-03-28"
excerpt: "A Claude Code skill that generates a self-contained, interactive HTML course from any repo just hit 2,000+ stars overnight. Here's how to use it on your own projects today."
tags: ["Claude", "AI Tools", "Documentation", "Developer Tools", "Open Source"]
coverEmoji: "🎓"
auto_generated: true
source_url: "https://github.com/zarazhangrui/codebase-to-course"
---

A GitHub project called `codebase-to-course` picked up over 2,000 stars this week, and for good reason — it's a Claude Code skill that reads any codebase and spits out a single, self-contained HTML file that teaches how it works. Scroll-based modules, animated data flow diagrams, interactive quizzes, code-to-plain-English side-by-side panels, the whole lot. No server, no dependencies, works offline. If you've ever spent three hours writing onboarding docs that nobody reads, this is the tool you've been waiting for.

## What It Actually Does

The skill lives in `~/.claude/skills/codebase-to-course/`. You drop it there, open any project in Claude Code, and say something like *"Turn this codebase into an interactive course"*. Claude reads your code, figures out the architecture, and produces a single HTML file that acts like a proper course platform.

What's inside that HTML file:

- **Code ↔ Plain English panels** — your actual source on the left, a human explanation on the right
- **Animated visualisations** — data flow between components, request/response cycles, state changes
- **Quizzes that test application** — not "what does useState do" but "you want to add a favourites feature, which files change and why"
- **Glossary tooltips** — hover a term, get a definition, no leaving the page
- **Keyboard navigation and progress tracking** — feels like a real course, not a wall of text

The design philosophy is "build first, understand later" — it traces what actually happens when you use the app, rather than front-loading theory.

## Setting It Up

Installation is dead simple:

```bash
# Clone the repo
git clone https://github.com/zarazhangrui/codebase-to-course

# Copy the skill into Claude's skills directory
mkdir -p ~/.claude/skills
cp -r codebase-to-course/codebase-to-course ~/.claude/skills/
```

Then open your project in Claude Code and run:

```
Turn this codebase into an interactive course
```

That's literally it. Claude picks up the skill automatically from the skills directory and runs it against your current working directory. The output is a single `.html` file you can open in any browser, host on S3, attach to a Notion doc, or email to a new team member.

## Running It Against a Next.js + Supabase Project

I tried this on a mid-sized Next.js app with a Supabase backend — about 40 files, server actions, a few API routes, RLS policies in the mix. The course it generated covered:

- The request lifecycle from browser to Supabase and back
- How the auth flow works (including where the session cookie actually lives)
- Which server actions hit the DB directly vs. which go through an edge function
- A quiz section asking "a user logs out on device A — is their session invalidated on device B?"

For a Next.js/Supabase project specifically, the bits I'd pay attention to:

```
# After generating, check that the course covers:
# - your /app directory structure and when components are server vs client
# - how Supabase RLS interacts with your server actions
# - the auth session flow (this trips up most new contributors)
```

If the generated course misses something important — say it glosses over your middleware — just follow up in the same Claude session: *"The course skipped the middleware auth checks, add a module for that."* Claude will patch the HTML inline.

## What I'd Build With This

**Automated onboarding docs as part of CI.** Add a GitHub Action that regenerates the course whenever `main` changes. New hire clones the repo, opens `course.html`, and they're up to speed without a three-hour Zoom walkthrough. The course stays current because it's generated from actual code, not maintained separately.

**A landing page for your open-source tool.** Instead of a README that nobody reads past the install instructions, generate a course and host it on GitHub Pages. It shows potential users and contributors exactly how your tool works internally — that's a much stronger pitch than a feature list.

**Client handover documentation.** When you finish a freelance project and hand the codebase to the client's internal team, include a generated course alongside the repo. Charge for it as a deliverable. Takes you five minutes to generate, saves the client weeks of confusion, and it's completely self-contained so they don't need to pay for a hosted docs platform.

The thing that makes this genuinely useful rather than just a neat demo is the output format. A single HTML file is the most portable thing you can produce — no lock-in, no SaaS dependency, no subscription to worry about. I've seen AI tools generate docs that require the AI to answer follow-up questions in perpetuity. This generates something that stands on its own. That's the right call.
