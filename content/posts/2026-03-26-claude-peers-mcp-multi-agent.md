---
title: "Claude Instances Talking to Each Other: Multi-Agent MCP Coordination"
date: "2026-03-26"
excerpt: "claude-peers-mcp lets your Claude Code sessions discover and message each other in real time. Here's how to wire it up and actually parallelise a Next.js build across multiple agents."
tags: ["Claude", "MCP", "AI Agents", "TypeScript", "Next.js"]
coverEmoji: "🤖"
auto_generated: true
source_url: "https://github.com/louislva/claude-peers-mcp"
---

Multi-agent AI workflows have been mostly theoretical hand-waving until now. [claude-peers](https://github.com/louislva/claude-peers-mcp) is a dead-simple MCP server that gives every Claude Code session a peer discovery and messaging layer — so your agents can actually coordinate instead of bumbling around independently. It picked up 1,200+ stars this week for a reason: this is the missing piece for parallelising real work across Claude instances.

## How It Works Under the Hood

The architecture is refreshingly boring. A broker daemon runs on `localhost:7899` backed by a SQLite database. Each Claude Code session spawns an MCP server process that registers with the broker and polls every second. Inbound messages get pushed into the session via Claude's `claude/channel` protocol, so the receiving instance sees messages immediately without any extra polling gymnastics.

The MCP tools you get:

| Tool | What it does |
|---|---|
| `list_peers` | Discover other Claude instances scoped to machine, directory, or repo |
| `send_message` | Push a message to another instance by ID |
| `set_summary` | Advertise what this session is working on |
| `check_messages` | Manual fallback polling |

Setup is a one-liner after cloning:

```bash
git clone https://github.com/louislva/claude-peers-mcp.git ~/claude-peers-mcp
cd ~/claude-peers-mcp
bun install

# Register globally across all Claude Code sessions
claude mcp add --scope user --transport stdio claude-peers -- bun ~/claude-peers-mcp/server.ts
```

Then launch sessions with the channel flag:

```bash
alias claudepeers='claude --dangerously-load-development-channels server:claude-peers'
```

The broker starts automatically on first launch. Open a second terminal, run the same alias, and the two instances can find each other immediately.

## Parallelising a Real Next.js Build

Here's a concrete pattern I'd use today. Say you've got a Next.js app and you want to build three features simultaneously without stepping on each other.

In Terminal 1 (working on `/app/dashboard`):
```
> set_summary: "Building dashboard data fetching layer — touching app/dashboard/page.tsx and lib/api/"
```

In Terminal 2 (working on `/app/auth`):
```
> list_peers
# Returns: peer-a42f | ./app/dashboard | "Building dashboard data fetching layer..."

> send_message peer-a42f: "I'm refactoring the session types in types/auth.ts — are you importing Session anywhere in your data layer?"
```

Peer A gets the message instantly and can respond before either agent touches a shared type. This prevents the classic multi-agent footgun: two Claude instances independently rewriting the same interface in conflicting ways.

For a TypeScript monorepo this matters even more. You'd have agents working across packages, and `list_peers` scoped to `repo` lets any instance see the full picture:

```typescript
// Claude can query something like:
// "list_peers scoped to repo" → returns all instances in this git repo
// Then broadcast a message before touching shared packages:
// "I'm bumping the @acme/ui package version — hold off on any package.json changes"
```

This isn't magic orchestration — it's just message passing. But message passing is all you actually need to coordinate parallel work.

## Coordination Patterns Worth Using

**Lock announcements before touching shared files.** Before any agent edits `tsconfig.json`, `package.json`, or a shared type definition, it broadcasts intent. Other agents check messages before starting tasks that might conflict.

**Capability discovery.** Agent A is working on the API layer and hits a question about the database schema. Instead of hallucinating, it queries peers: "Is anyone working in the Prisma schema right now?" Agent B, sitting in `/prisma`, responds with the current state.

**Progress reporting to an orchestrator.** One Claude session acts as a coordinator — it spawns conceptual tasks by messaging peers with specific instructions, then polls for completion summaries. You'd structure this with a simple convention:

```
# Orchestrator sends:
"Task: add input validation to /app/api/users/route.ts using zod. Reply with 'DONE: <summary>' when complete."

# Worker replies:
"DONE: Added zod schema UserCreateSchema, validates name/email/role, returns 400 with field errors."
```

No custom framework needed. Just structured messages between instances.

## What I'd Build With This

**Parallel test-fix loop.** One Claude runs the test suite and messages failing test names to specialist agents — one per test file. Each agent fixes its failing tests independently, then reports back. The orchestrator collects, runs tests again, repeats.

**Monorepo refactor coordinator.** When you're doing a large TypeScript migration or API redesign, spin up one agent per package. A coordinator agent holds the migration plan and gates each package agent from proceeding until its dependencies are done — using `send_message` as the synchronisation primitive.

**Live architecture review.** Multiple Claude instances working across different parts of a codebase, each with `set_summary` describing their current context. A dedicated "reviewer" instance periodically queries all peers, builds a picture of what's changing across the whole system, and flags potential integration issues before they land.

I've been waiting for something like this since multi-agent Claude workflows started getting traction. The broker-plus-SQLite approach is the right call — it's local-only, no cloud dependency, and the implementation is simple enough that you can actually trust what it's doing. The `--dangerously-skip-permissions` flag gives me pause for anything touching prod, but for local dev parallelisation this is immediately useful. Give it a run on your next big refactor.
