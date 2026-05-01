---
title: "Cursor Just Shipped a TypeScript SDK for Their Coding Agent"
date: "2026-05-01"
excerpt: "Cursor's new SDK lets you run their AI coding agent programmatically — embed it in your own apps, stream agent events, manage cloud runs from code."
tags: ["AI", "TypeScript", "Developer Tools"]
coverEmoji: "🤖"
auto_generated: true
source_url: "https://github.com/cursor/cookbook"
---

Cursor shipped a TypeScript SDK this week and it's more interesting than the headline suggests. It's not just an API wrapper — it's programmatic access to the same coding agent you use in the IDE, runnable from scripts, web apps, or CI pipelines, with streaming events and cloud execution support.

The [cursor/cookbook](https://github.com/cursor/cookbook) repo dropped with 2,700 stars in the first week. Here's what it actually is and why you'd reach for it.

## What the Cursor SDK Does

The SDK gives you a TypeScript API to spawn Cursor's coding agent — the same model that edits files, runs commands, and iterates on feedback inside the IDE — as a programmable service.

You point it at a workspace (local or cloud-hosted), give it a prompt, and stream back structured events: messages, file edits, tool calls, completion signals. The agent manages its own context and can iterate across multiple steps the same way it does interactively.

```bash
npm install @cursor/sdk
```

You'll need a Cursor API key from their [integrations dashboard](https://cursor.com/dashboard/integrations). Set it as `CURSOR_API_KEY`.

## Quickstart: Spawn an Agent and Stream Events

The minimal example from their cookbook creates a local agent, sends a prompt, and streams responses:

```typescript
import Cursor from '@cursor/sdk';

const client = new Cursor({ apiKey: process.env.CURSOR_API_KEY });

async function runAgent(workspacePath: string, prompt: string) {
  const stream = await client.agents.runs.stream({
    workspace: workspacePath,
    prompt,
  });

  for await (const event of stream) {
    switch (event.type) {
      case 'message':
        process.stdout.write(event.content);
        break;
      case 'file_edit':
        console.log(`\nEditing: ${event.path}`);
        break;
      case 'complete':
        console.log('\nDone.');
        break;
    }
  }
}

runAgent('./my-project', 'Add input validation to all API route handlers');
```

The event stream is the key design choice here. You get granular visibility into what the agent is doing — which files it touched, what it decided, when it finished — rather than a black-box response after some unknowable wait.

## Cloud Agents: Sandboxed Execution

The more interesting capability is cloud agents. Instead of pointing the agent at a local workspace, you give it a repository and a prompt and Cursor spins up a sandboxed cloud environment to run it in.

```typescript
const run = await client.agents.cloudRuns.create({
  repository: 'org/repo',
  branch: 'main',
  prompt: 'Refactor the auth module to use the new session API',
  model: 'claude-sonnet-4-6',
});

// Poll or stream for completion
const result = await client.agents.cloudRuns.waitForCompletion(run.id);
console.log(result.artifactUrl); // PR or patch link
```

The cookbook ships a kanban board example that groups cloud runs by status, lets you preview artifacts, and create new runs from a repo + prompt. That pattern — a UI over programmatic agent execution — is the template worth stealing.

## What I'd Build With This

**Automated code review pipeline.** On every PR, trigger a cloud agent run pointed at the diff with a focused prompt: "Check these changes for SQL injection, missing error handling, and type safety regressions." Stream the results into a GitHub comment. Faster than waiting on a human reviewer for the mechanical stuff.

**Self-healing CI.** When a test suite fails, extract the failure output and feed it to an agent with the relevant files in context. Let it propose a fix as a patch, then gate approval on a human thumbs-up before applying. Not full auto-merge, but it turns a 20-minute debugging session into a 2-minute approval.

**AI-assisted onboarding tool.** New dev joins a team and asks "how does the auth flow work?" Feed the question plus the relevant files to an agent and stream a contextualised walkthrough. The agent can read the actual code, not a stale wiki page.

## My Take

The pattern of embedding a coding agent as a service — rather than running it interactively — opens up a lot of boring-but-useful automation. The cloud execution model is what makes it practical: you don't have to provision anything or manage state, just hand it a repo and a task.

The TypeScript-first SDK is the right call for this audience. Most teams building on top of AI tools are already in Node/TS land. The event streaming API is well designed; the kanban board example in the cookbook is the clearest demonstration of the intended use case.

Worth experimenting with if you're building internal tooling or want to add automated code-quality gates to your CI pipeline without writing your own agent scaffolding from scratch.
