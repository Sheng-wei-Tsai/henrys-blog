---
title: "Superpowers: The Claude Code Methodology Stopping Agents Going Rogue"
date: "2026-05-01"
excerpt: "obra/superpowers hit 174K GitHub stars by solving the real problem with coding agents — they jump to code before understanding the spec. Here's how the methodology works and why it's worth installing today."
tags: ["Claude Code", "AI Tools", "Developer Productivity"]
coverEmoji: "⚡"
auto_generated: true
source_url: "https://github.com/obra/superpowers"
---

I've lost count of how many times I've watched Claude jump straight into writing code, build the wrong thing for twenty minutes, then need walking back. The agent is fast, but without structure it optimises for velocity in the wrong direction.

`obra/superpowers` hit 174K GitHub stars this week by solving exactly this. It's not another prompt collection — it's a complete software development methodology packaged as a Claude Code plugin.

## What It Actually Does

Superpowers intercepts the moment you describe a task. Instead of generating code, your agent runs through a mandatory workflow:

1. **Brainstorming first.** It asks clarifying questions until it can describe what you're building in terms a "junior engineer with poor taste and no context" could follow. (Their words, and accurate.) The design gets saved as a document you sign off on.

2. **A proper implementation plan.** Tasks are broken into 2–5 minute bites, each with exact file paths, complete code snippets, and verification steps. You review this before any code runs.

3. **Git worktree isolation.** A fresh branch and clean workspace before touching a single file — no half-finished changes polluting your working tree.

4. **Subagent-per-task execution.** Each chunk gets a fresh subagent context. The orchestrator runs a two-stage review (spec compliance, then code quality) before advancing to the next task.

5. **Enforced TDD.** RED-GREEN-REFACTOR is not optional. The skill literally deletes code written before the failing test exists.

The result is an agent that can run autonomously for hours without going off-rails, because the rails were built before it started moving.

## Installing It

Superpowers is now on the official Claude plugin marketplace:

```bash
/plugin install superpowers@claude-plugins-official
```

No manual AGENTS.md copying. The skills trigger automatically based on context — describe a feature and the brainstorming workflow activates. Describe implementation and the plan-writing skill kicks in. It's ambient, not opt-in.

If you want to inspect the skills before committing, install from the Superpowers marketplace instead:

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

It also works with Cursor (`/add-plugin superpowers`), GitHub Copilot CLI, Gemini CLI, and OpenAI Codex — so if you're not on Claude Code, you're not locked out.

## The Workflow in Practice

Here's what the full cycle looks like when you kick off a feature:

```
You: "Add a job alert email when a new listing matches a user's saved search"

Agent (brainstorming skill): Asks 4 questions:
  - How often should alerts send? (real-time vs daily digest)
  - What triggers a match? (title keywords, location, salary?)
  - Unsubscribe mechanism?
  - Transactional email provider already set up?

You: answer, confirm design doc

Agent (writing-plans skill): Produces tasks:
  Task 1: supabase/017_job_alerts.sql — alerts table + RLS
  Task 2: lib/job-alerts.ts — match logic + Resend integration
  Task 3: app/api/cron/job-alerts/route.ts — daily cron handler
  Task 4: app/dashboard/alerts/page.tsx — manage alerts UI
  Task 5: __tests__/job-alerts.test.ts — match logic unit tests

You: approve plan

Agent (subagent-driven-development skill): spawns subagents per task,
  reviews each, reports back
```

The plan step is what changes the dynamic. Getting an AI to slow down and clarify *before* building is genuinely hard with raw prompts — it always wants to help now. The methodology makes hesitation structural.

## What I'd Build With This

**A legacy migration runner.** Point Superpowers at a `pages/` router Next.js codebase, describe "migrate to App Router," and let the plan-writing skill break it into atomic file-by-file tasks. The subagent loop means no half-migrated state where half your routes are broken at once.

**An overnight backlog worker.** Drop a Linear ticket URL into the chat. Superpowers extracts the spec, writes a plan, you confirm it before bed, it executes overnight. Wake up to a branch ready for review rather than an empty editor.

**A test coverage filler.** Feed it files with low coverage. The brainstorming skill will surface what behaviour actually matters before writing tests — preventing the tautological tests that just parrot the implementation and tell you nothing.

---

The part I keep coming back to: this project has 174K stars not because it does something technically novel, but because it imposes discipline that most developers know they need and consistently skip. The spec step. The plan sign-off. The TDD constraint. These aren't new ideas — they're the ideas from every good engineering book, finally packaged so an AI enforces them automatically.

Whether the methodology holds up at scale across large, messy codebases is still being road-tested by the community. But the core insight is right, the install is trivial, and the worst case is you learn something about your own process.
