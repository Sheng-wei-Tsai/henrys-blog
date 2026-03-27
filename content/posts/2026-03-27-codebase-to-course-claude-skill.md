---
title: "Turn Any Codebase Into an Interactive Course With Claude Code"
date: "2026-03-27"
excerpt: "A Claude Code skill that generates a self-contained HTML course from any repo — scroll navigation, quizzes, animated data flow diagrams, the lot. Here's how it works and where it's actually useful."
tags: ["Claude", "Developer Tools", "Next.js", "Documentation", "AI"]
coverEmoji: "📚"
auto_generated: true
source_url: "https://github.com/zarazhangrui/codebase-to-course"
---

A repo called `codebase-to-course` picked up 2,000 stars this week, and it's not hype — it solves a genuinely annoying problem. You've inherited a Next.js project, or you've vibe-coded something with AI assistance and now you don't fully understand what you built, or you need to onboard a new dev without writing 40 pages of docs. This Claude Code skill turns the codebase itself into a single HTML file with interactive modules, code-to-English translations, quizzes, and animated data flow diagrams. No server, no dependencies, works offline.

## How It Actually Works

The skill lives in `~/.claude/skills/codebase-to-course`. Once it's there, Claude Code can read your entire project structure and generate a course file against it. You trigger it with plain English — "turn this codebase into a course" — and Claude crawls the repo, infers the architecture, and produces a self-contained `.html` file.

The output isn't just a pretty README. It has scroll-based module navigation, glossary tooltips on hover, and quizzes that test application rather than memorisation — "you want to add a favourites feature, which files change?" That last bit matters. It forces the reader to reason about the code, not just read about it.

Under the hood, the skill is a structured prompt that instructs Claude to:
1. Map the directory tree and identify key entry points
2. Trace a core user flow end-to-end
3. Generate annotated code blocks with plain-English sidebars
4. Produce inline SVG animations for data flow
5. Wrap everything in a single HTML file with vanilla JS navigation

No external API calls from the output file. It's genuinely portable.

## Running It on a Next.js or Supabase Project

For a typical Next.js + Supabase stack, the generated course will pick up your `app/` directory structure, trace auth flows through Supabase client calls, and annotate your server actions and route handlers. Here's how you'd set it up:

```bash
# Install the skill
cd ~/.claude/skills
git clone https://github.com/zarazhangrui/codebase-to-course

# Open your project in Claude Code
cd ~/my-nextjs-app
claude

# Then just say:
# "Turn this codebase into an interactive course"
```

The skill is smart enough to prioritise what matters. On a Next.js app it'll lead with the routing model, then hit your data fetching patterns, then auth. On a Supabase-heavy project it'll spend time on RLS policies and the realtime subscription setup — the bits that are hardest to grok from cold code.

If the default output order doesn't suit your audience, you can direct it: "turn this into a course focused on the auth flow and database schema, skip the UI components". It responds to that kind of steering.

## Adapting It for Onboarding

This is where I think it's most useful right now. Writing onboarding docs is painful and they go stale fast. Instead, you generate the course from the actual current codebase, commit the HTML file, and link it from your README.

You can customise the audience framing in the prompt — tell Claude to generate the course for "a mid-level dev who knows React but hasn't used Supabase before". That changes the depth of explanation on Supabase-specific patterns without dumbing down the React side.

For AI-assisted projects specifically, there's an extra benefit: the course documents *why* the code is structured the way it is, not just what it does. If Claude made an architectural choice during a build session, that context often ends up in the course annotations because Claude generated both the code and the explanation. It's weirdly good at explaining its own decisions.

```
# Example prompt customisation
"Turn this codebase into an interactive course for a developer 
who's comfortable with React but new to Supabase RLS and 
server-side rendering. Focus on the data layer and auth."
```

## What I'd Build With This

**1. Auto-generated onboarding for SaaS starter kits.** Ship your Next.js + Supabase boilerplate with a generated `COURSE.html` in the repo root. New devs open one file and understand the whole thing before touching code. Regenerate it as part of your release process.

**2. A "how I built this" artifact for shipped side projects.** Instead of writing a blog post explaining your architecture, generate the course and host the HTML file on your domain. It's more useful than a blog post and takes about 30 seconds to produce.

**3. Client handoff documentation.** When you hand off a project to an in-house team, generate a course scoped to the bits they'll actually maintain — the CMS integration, the auth flow, the deployment pipeline. No more 50-page Word docs that nobody reads.

The thing that makes this worth paying attention to is the output quality. Most AI-generated documentation is generic and annoying. Because the skill is pointing Claude at real code with a structured prompt, the explanations stay grounded. It's not perfect — complex business logic can confuse it — but for architecture and data flow it's genuinely solid. I'd rather give a new dev this than a Confluence page.
