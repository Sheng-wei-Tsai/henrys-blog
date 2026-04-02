---
title: "Wire OpenAI Codex into Claude Code for Automated Reviews"
date: "2026-04-02"
excerpt: "OpenAI just shipped a Claude Code plugin that lets you run Codex reviews and delegate tasks without leaving your existing workflow. Here's how to actually use it in a Next.js/TypeScript project."
tags: ["OpenAI", "Claude", "AI Tooling", "TypeScript", "Developer Tools"]
coverEmoji: "🔌"
auto_generated: true
source_url: "https://github.com/openai/codex-plugin-cc"
---

OpenAI shipping a plugin *for* Claude Code is not something I had on my 2025 bingo card. But here we are — `openai/codex-plugin-cc` hit GitHub trending with over 10k stars this week, and the premise is straightforward: use Codex from inside Claude Code for reviews and background task delegation. If you're already living in Claude Code, this is worth 10 minutes of your time right now.

## Installing the Plugin

The setup is three commands. Open Claude Code in your project and run:

```bash
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
```

Then kick off setup:

```bash
/codex:setup
```

You'll need either a ChatGPT subscription (Free tier works) or an OpenAI API key. If Codex isn't installed globally yet, the setup command will offer to do it for you — or you can handle it yourself:

```bash
npm install -g @openai/codex
!codex login
```

After that you've got a handful of slash commands available and a `codex:codex-rescue` subagent sitting in `/agents`.

## What the Commands Actually Do

There are two review modes and a task delegation workflow.

**`/codex:review`** runs a standard read-only code review on your uncommitted changes, or against a base branch:

```bash
# Review uncommitted changes
/codex:review

# Review your feature branch vs main
/codex:review --base main

# Fire it off in the background and check back later
/codex:review --background
/codex:status
/codex:result
```

For multi-file changes the background flag is the right call — reviews on large diffs block otherwise.

**`/codex:adversarial-review`** is the more interesting one. It's steerable — you can point it at specific decisions, tradeoffs, or risk areas and it'll push back on your implementation choices. Think of it as a second opinion from someone who actively wants to find holes in your approach.

The task delegation commands — `/codex:rescue`, `/codex:status`, `/codex:result`, `/codex:cancel` — let you hand off work to Codex as a background agent and manage the job lifecycle. `/codex:rescue` is the one I'd reach for when I'm stuck on something and want a second brain to take a crack at it.

## Using It in a Real Next.js/TypeScript Project

Here's a realistic workflow. Say you're building an API route in Next.js and you've made changes across a few files — the route handler, a utility module, and some types:

```
app/api/orders/route.ts
lib/orders/processor.ts
types/orders.ts
```

Before raising a PR, you'd normally do a self-review. Now the loop looks like this:

```bash
# Stage everything you want reviewed
git add app/api/orders/route.ts lib/orders/processor.ts types/orders.ts

# Run the review in background so you can keep working
/codex:review --background

# Check in a few minutes
/codex:status

# Pull the result
/codex:result
```

For anything where you're making an architectural call — say, choosing between an edge runtime handler versus a Node.js one, or deciding how to handle optimistic updates — run the adversarial variant:

```bash
/codex:adversarial-review --base main
```

It'll question whether your approach is the right one rather than just checking for bugs. That's genuinely useful when you're the only senior dev on a project and there's nobody to rubber-duck with.

If you hit something gnarly — a type error you can't untangle, a weird Next.js edge case — delegate it:

```bash
/codex:rescue
# Describe the problem when prompted
/codex:status
/codex:result
```

The result comes back as a suggestion you can accept or ignore. It doesn't touch your files unless you tell it to.

## What I'd Build With This

**Automated PR review bot** — Wire `/codex:review --base main` into a pre-push git hook or a CI step. Every branch gets a Codex review before it goes up. Pipe the output into a PR comment via the GitHub API. That's a Saturday afternoon project.

**Architecture decision log tool** — Run `/codex:adversarial-review` on every significant PR and save the output to a `decisions/` directory in the repo. You get a timestamped record of what was challenged and what was defended. Useful when someone asks "why did we do it this way" six months later.

**Solo dev review loop** — If you're building solo and shipping fast, set up a simple shell alias that stages your current changes, fires off a background review, and notifies you via `terminal-notifier` or `osascript` when it's done. You keep working, the review lands in your lap when it's ready.

The two-AI-systems angle is a bit of a headline but the actual utility here is practical: you get a second code review pass without context-switching out of Claude Code. That's the bit that matters. I'll be folding `/codex:adversarial-review` into my pre-PR checklist — the standard review catches bugs, the adversarial one catches bad decisions, and both are worth running before anyone else sees the code.
