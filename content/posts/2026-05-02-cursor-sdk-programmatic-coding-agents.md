---
title: "Cursor's SDK lets you run a coding agent from code"
date: "2026-05-02"
excerpt: "Cursor just shipped a TypeScript SDK that lets you spawn and orchestrate its coding agent programmatically — no IDE required. Here's what you can actually build with it."
tags: ["AI", "TypeScript", "Developer Tools"]
coverEmoji: "🤖"
auto_generated: true
source_url: "https://github.com/cursor/cookbook"
---

Cursor dropped a [public cookbook repo](https://github.com/cursor/cookbook) this week that documents something most people haven't noticed yet: there's now a TypeScript SDK for running Cursor's coding agent from your own code.

Not the IDE. The actual agent — the thing that reads your codebase, writes files, runs commands, and iterates. You can spawn it, stream its output, cancel it, and manage multiple runs in parallel. All from a script or a web app.

That's a meaningfully different capability than what existed two months ago.

## What the SDK actually does

The core of it is a client that wraps Cursor's agent API. You give it a workspace path and a prompt, and it runs the agent there:

```typescript
import { CursorClient } from '@cursor/sdk';

const client = new CursorClient({
  apiKey: process.env.CURSOR_API_KEY,
});

const run = await client.agent.create({
  workspacePath: '/path/to/your/project',
  prompt: 'Add input validation to all API routes. Use Zod.',
});

for await (const event of run.stream()) {
  if (event.type === 'file_write') {
    console.log('Modified:', event.path);
  }
  if (event.type === 'shell_command') {
    console.log('Ran:', event.command);
  }
}

await run.waitForCompletion();
```

Events stream in real time. You can react to file writes, shell commands, messages, and completions as they happen. The run also supports cancellation and exposes conversation state if you want to continue a run with a follow-up prompt.

Cloud agents are the same API but without needing a local workspace path — it provisions an environment for you, runs the agent, and surfaces artifacts when it's done.

## The DAG task runner pattern

The cookbook example I keep coming back to is the DAG task runner. The idea: decompose a large task into a JSON graph of subtasks, fan them out across multiple agents in parallel, and collect the results.

```typescript
const dag = {
  nodes: [
    { id: 'audit', prompt: 'Audit all API routes for missing auth checks. Output JSON.' },
    { id: 'fix-auth', deps: ['audit'], prompt: 'Fix the issues found by the audit agent.' },
    { id: 'tests', deps: ['audit'], prompt: 'Write tests for every route flagged in the audit.' },
    { id: 'pr', deps: ['fix-auth', 'tests'], prompt: 'Create a summary of changes for the PR description.' },
  ]
};
```

You resolve the graph, run leaf nodes in parallel, then pass their outputs as context into dependent nodes. For a security audit + fix pipeline on a real codebase, this could save hours of back-and-forth.

The cookbook ships this as both a runnable example and a Cursor Skill (`.cursor/skills/dag-task-runner`) so you can invoke it inside the IDE too.

## Local vs cloud agents

The distinction matters when you're building something real:

**Local agents** have access to your actual filesystem. Useful when you want the agent to modify a real working directory — e.g., a pre-commit hook that auto-fixes linting issues, or a script that upgrades package versions across a monorepo.

**Cloud agents** run in Cursor's sandboxed environment. Better for untrusted workloads, parallel runs you don't want cluttering your disk, or scenarios where you want to review the output before applying it. The kanban example in the cookbook manages cloud agent runs grouped by status — think of it like a CI dashboard but for coding tasks.

The API surface is intentionally consistent between the two, which means the same orchestration code works for both.

## What I'd build with this

**Automated dependency upgrade PRs.** Trigger a cloud agent run on each new npm advisory, with a prompt like "Upgrade `package-name` to the patched version and fix any breaking changes in this repo." Review the diff, merge if it looks right. Saves the part of dependency upgrades that's usually tedious but straightforward.

**PR review that actually fixes things.** Hook into GitHub webhooks on PR open. Run an agent against the branch with context from your PR description and any review comments. Have it suggest — or apply — the fixes inline. Then post back to the PR. Not a linter, an agent with codebase context.

**Multi-agent codebase migration.** When you're upgrading a framework (say, Next.js 15 to 16) across a large app, fan out agents per route or component using the DAG pattern. Each agent handles one file, parent node reconciles conflicts. The kind of migration that currently takes a week of careful human review becomes a few hours of parallel agent runs with spot-checking.

## My take

The interesting thing here isn't just that you can run Cursor programmatically — it's that coding agents are becoming infrastructure you can build on top of, not just tools you open on your laptop.

The cookbook patterns (DAG decomposition, streaming events, cloud vs local) map directly to real engineering workflows. The SDK feels production-ready enough that I'd use it for internal tooling today — not experimental side projects.

The main thing I'd want before taking this seriously for anything user-facing is more clarity on how workspace isolation works for cloud agents, and what the rate limits look like at scale. But for CI pipelines, internal dev tools, and anything where you control the triggering conditions? This is worth a couple of hours to prototype.

Get the API key at [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations) and start with the [quickstart example](https://github.com/cursor/cookbook/tree/main/sdk/quickstart).
