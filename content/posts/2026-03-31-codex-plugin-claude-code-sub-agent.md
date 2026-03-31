---
title: "Wire OpenAI Codex as a Sub-Agent Inside Claude Code"
date: "2026-03-31"
excerpt: "The codex-plugin-cc repo just hit 5,500+ stars in a week. Here's what the cross-agent delegation pattern actually looks like and how to use it today."
tags: ["AI", "Claude", "OpenAI", "Developer Tools", "TypeScript"]
coverEmoji: "🤖"
auto_generated: true
source_url: "https://github.com/openai/codex-plugin-cc"
---

The codex-plugin-cc repo dropped this week and immediately went to 5,500+ stars. The reason is straightforward: it's the first production-ready pattern for delegating work from one AI coding agent to another — specifically, using OpenAI Codex as a sub-agent inside Claude Code. If you're already living in Claude Code and want Codex's review quality without switching contexts, this is how you wire it up right now.

## What's Actually Happening Here

This isn't a wrapper or a thin API shim. It's a cross-agent delegation pattern. Claude Code acts as your orchestrator — you're talking to it, planning work, writing code — and then you can hand off specific tasks (code review, adversarial design challenges, background rescue jobs) to Codex as a sub-agent. Codex runs independently, and you retrieve the result when it's done.

The install is three commands:

```bash
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
```

Then run `/codex:setup` to check your environment. If you don't have the Codex CLI yet:

```bash
npm install -g @openai/codex
!codex login
```

You need Node 18.18+ and either a ChatGPT subscription (Free tier works) or an OpenAI API key. That's it.

## The Commands You'll Actually Use

Once installed, you get six slash commands and a `codex:codex-rescue` sub-agent in `/agents`.

The two review commands are the day-to-day workhorses:

```bash
# Review your uncommitted changes
/codex:review

# Review your branch against main
/codex:review --base main

# Run it in the background so you're not blocked
/codex:review --background
```

`/codex:adversarial-review` is the more interesting one. It's a steerable review that actively questions your implementation choices — pressure-testing tradeoffs, failure modes, whether a different approach would've been safer. Same flags as the normal review:

```bash
/codex:adversarial-review --base main --background
```

For background jobs, the management commands are:

```bash
/codex:status    # check progress
/codex:result    # retrieve output
/codex:cancel    # kill it if you've moved on
```

The `/codex:rescue` command is for delegating actual work, not just review — you're handing Codex a task and letting it run.

## A Real Next.js/TypeScript Workflow

Here's how I'd integrate this into a real feature branch workflow on a Next.js TypeScript project.

Say I've just finished a chunk of work — new API route, some updated types, a few components. Before I raise a PR:

```bash
# Kick off a background review against main while I write the PR description
/codex:review --base main --background

# Check it's running
/codex:status

# Once it's done, pull the result
/codex:result
```

For anything architecturally risky — say I've restructured how server actions pass data to client components, or I've made a call on error boundaries — I'd follow up with:

```bash
/codex:adversarial-review --base main --background
```

The adversarial review won't just tell you what's wrong. It'll challenge whether your approach was the right call at all. That's useful when you've made a deliberate tradeoff and want it stress-tested before another human sees it.

For larger automated pipelines, you could script this. A `package.json` script that kicks off the review on pre-push:

```json
{
  "scripts": {
    "pre-push-review": "claude -p '/codex:review --base main --wait'"
  }
}
```

Obviously you'd want to think about auth handling and whether blocking on `--wait` makes sense for your team, but the primitives are there.

## What I'd Build With This

**Automated PR review bot for a monorepo.** Wire `/codex:review --base main --background` into a GitHub Actions workflow on PR open. Have it post the result as a PR comment via the GitHub API. No one has to manually kick off a review — it just happens.

**Adversarial review gate for high-risk paths.** Tag certain directories (e.g. `app/api/payments/`, `lib/auth/`) in a config file. On any PR touching those paths, automatically run `/codex:adversarial-review` and require the output to be reviewed by a human before merge. Cheap way to add a second opinion on your most sensitive code.

**Personal dev loop assistant.** Build a small CLI that wraps your normal Git workflow — after every `git add`, it quietly runs a background review and surfaces the results in your terminal when you're ready to commit. Codex as a passive reviewer watching your work as you go.

---

The multi-agent pattern has been theoretically interesting for a while, but it hasn't been practical until tooling like this lands. Cross-agent delegation with real CLI commands and background job management is something I can actually build into my workflow today — not next quarter when some platform matures. That's why 5,500 developers starred this in a week.
