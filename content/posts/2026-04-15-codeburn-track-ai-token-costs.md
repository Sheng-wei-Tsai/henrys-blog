---
title: "codeburn: Finally See Where Your AI Coding Budget Is Actually Going"
date: "2026-04-15"
excerpt: "AI coding tools are burning real money and most developers have no idea where. codeburn gives you a TUI dashboard that reads session data directly from disk — no proxies, no API keys — and shows you exactly which tasks, tools, and models are bleeding your budget."
tags: ["TypeScript", "AI Tools", "Developer Tools", "Claude Code", "Cursor"]
coverEmoji: "🔥"
auto_generated: true
source_url: "https://github.com/AgentSeal/codeburn"
---

My Claude Code bill last month was higher than my AWS bill. I had no idea why until I started actually looking at the session data. That's exactly the problem codeburn solves — 1,722 GitHub stars in a week tells you I'm not the only one who needed this.

## What codeburn actually does

It reads session data directly off disk — `~/.claude/projects/` for Claude Code, `~/.codex/sessions/` for Codex, SQLite for Cursor and OpenCode. No wrapper, no proxy sitting between you and the model, no API keys required. It pulls pricing from LiteLLM's model database (auto-cached), maps your actual token usage to dollar figures, and renders the whole thing as an interactive TUI dashboard.

The part that's genuinely useful beyond raw cost: it tracks **one-shot success rate per activity type**. So you can see that your AI nails code generation first try 80% of the time, but burns 4-5 retries on test writing. That's actionable. That's where you change your prompting strategy or switch models for specific tasks.

Install and run:

```bash
npm install -g codeburn
codeburn
```

Or just `npx codeburn` if you don't want a global install. Needs Node 20+.

## Getting useful data out of it

The default view is 7 days. Most useful commands for building a picture of your actual costs:

```bash
# Rolling 30-day report, auto-refreshes every 60 seconds
codeburn report -p 30days --refresh 60

# Quick status check — good for a shell alias
codeburn status

# Machine-readable output for scripting
codeburn status --format json

# Export everything for analysis in another tool
codeburn export -f json
```

If you're running multiple tools (Claude Code and Cursor both installed), press `p` in the dashboard to toggle between providers or see them combined. Arrow keys or `1`/`2`/`3`/`4` to switch between Today, 7 Days, 30 Days, Month.

The JSON export is where it gets interesting for your own analysis:

```bash
codeburn export -f json > ai-costs.json
```

You get cost broken down by project, model, task type, and MCP server. Feed that into a quick script and you can see which of your projects is disproportionately expensive relative to the output it's producing.

## What the data actually reveals

Once you have a week or two of data, patterns show up fast. In my case:

- Refactoring tasks had a terrible one-shot rate — I was burning 3x the tokens I needed because my prompts weren't giving the model enough context about existing patterns
- I was using Sonnet for tasks where Haiku would've been fine — switching models for boilerplate generation cut that category's cost by ~60%
- One project with a badly configured MCP server was making redundant tool calls on almost every session

None of this is visible from your billing dashboard. The billing dashboard just shows you a total. codeburn shows you *why*.

For macOS users there's also a SwiftBar menu bar widget so you can see today's spend without opening a terminal. Practical if you're the kind of person who runs Claude Code in long autonomous sessions and wants a sanity check.

## What I'd build with this

**Team cost visibility tool**: Run `codeburn export -f json` on a schedule via cron, ship the output to a shared dashboard (Grafana, a simple Next.js app, whatever). Give the team a live view of AI spend by project. Useful when you're billing AI costs back to clients or trying to justify model choices to a finance team.

**Prompt optimisation feedback loop**: Script the JSON export, track one-shot success rates per task type over time, and get a Slack notification when a category drops below a threshold. Forces you to actually iterate on prompts that aren't working rather than just paying more.

**Per-project cost allocation**: If you're a consultant running AI tools across multiple client projects, the project-level breakdown means you can attach actual dollar figures to your AI usage per engagement. Export weekly, reconcile against invoices.

The broader shift here is that AI coding costs are becoming a real line item — not "developer productivity tool" budget, but actual infrastructure cost that needs the same visibility as your cloud spend. codeburn is the first tool I've seen that treats it that way, reads from where the data already lives, and doesn't require you to route traffic through anything. That's the right approach.
