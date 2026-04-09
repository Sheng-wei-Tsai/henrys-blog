---
title: "Graphify: Give Your AI Coding Assistant a Map of Your Entire Codebase"
date: "2026-04-09"
excerpt: "Your AI assistant only sees the files you have open. Graphify builds a persistent knowledge graph of your whole codebase so it can answer architectural questions, not just syntax questions."
tags: ["AI", "Developer Tools", "Python", "Architecture", "Knowledge Graphs"]
coverEmoji: "🕸️"
auto_generated: true
source_url: "https://github.com/safishamsi/graphify"
---

The biggest lie about AI coding assistants is that they understand your codebase. They understand whatever's in their context window. Ask Cursor why your Supabase RLS policies are structured the way they are, or how your Next.js middleware connects to your auth layer, and you get a confident guess based on whatever files you have open. Graphify fixes this by doing one pass over your entire repo — code, docs, diagrams, PDFs, the lot — and handing back a persistent, queryable knowledge graph your AI can actually reason over.

## What Graphify Actually Does

It runs two passes. First pass is deterministic: tree-sitter parses your source files and extracts classes, functions, imports, call graphs, and rationale comments. No LLM needed, no hallucination risk. Second pass spins up parallel Claude subagents over your docs, markdown, images, and PDFs — extracting concepts and relationships, including stuff like `semantically_similar_to` edges marked as `INFERRED` so you always know what was found vs guessed.

The graph gets clustered using Leiden community detection on edge density, not embeddings. You end up with real topology-based communities, not vibes-based semantic clusters.

Output lands in `graphify-out/`:

```
graphify-out/
├── graph.html       # interactive — click, search, filter by community
├── GRAPH_REPORT.md  # god nodes, surprising connections, suggested questions
├── graph.json       # persistent — query it weeks later without re-running
└── cache/           # SHA256 cache — only reprocesses changed files
```

Running it is a single command:

```bash
pip install graphifyy
/graphify .  # or invoke it inside Claude Code, Cursor, Codex, Gemini CLI
```

Throw a `.graphifyignore` in your project root to skip what you don't need:

```
# .graphifyignore
node_modules/
.next/
supabase/.branches/
dist/
*.generated.ts
```

## Applying This to a Next.js + Supabase Stack

This is where it gets actually useful. A typical Next.js/Supabase project has auth logic split across middleware, server actions, RLS policies, and edge functions. The reasons why things are structured that way live in Notion docs, old PRs, or nobody's head anymore.

Run Graphify over your whole repo including any docs folder:

```bash
/graphify ./my-app
```

Then query `graph.json` directly, or — more practically — point your AI assistant at it as a context file. The graph already contains edges like:

```json
{
  "source": "middleware.ts::authGuard",
  "target": "lib/supabase/server.ts::createClient",
  "relationship": "calls",
  "type": "DETERMINISTIC"
},
{
  "source": "supabase/policies/profiles.sql",
  "target": "lib/auth/roles.ts::UserRole",
  "relationship": "enforces_constraint_defined_in",
  "type": "INFERRED"
}
```

Now when you ask "why does the profiles RLS policy reference the roles enum from the TypeScript layer", your assistant has the graph edge to follow rather than guessing. The `GRAPH_REPORT.md` also surfaces god nodes — files or concepts with disproportionate connectivity — which in most Next.js apps will be your Supabase client initialisation and your session provider. Knowing that upfront saves you from accidentally breaking eight things when you touch one file.

The 71.5x token reduction claim comes from querying the pre-built graph JSON vs feeding raw files into context every session. Persistent graph means you run it once, update incrementally via the SHA256 cache, and query cheaply forever.

## What I'd Build With This

**Onboarding assistant for new hires.** Run Graphify over your whole monorepo, drop `graph.json` and `GRAPH_REPORT.md` into a RAG pipeline, and give new developers a chatbot that actually knows why the legacy payment module is still in the repo and what it touches. Faster than a wiki, harder to let go stale.

**Pre-refactor impact analysis tool.** Before moving a shared utility or renaming a Supabase table, query the graph for all nodes connected to that target. Feed the subgraph into your AI assistant and ask it to predict breakage. Much more reliable than grep or TypeScript's find-references when your dependencies cross file types (e.g., a table name referenced in SQL, a TypeScript type, and a markdown API doc).

**Architecture drift detector in CI.** Regenerate the graph on each PR, diff the community clusters and god nodes against the main branch graph, and flag when a change significantly rewires the topology. If a supposedly small PR is suddenly making `lib/utils.ts` the most connected node in the graph, you want to know that before merge.

Graphify isn't solving a new problem — people have wanted whole-codebase understanding for years. What's different is that it actually ships the thing: deterministic AST extraction so the structural edges are trustworthy, Claude vision for the messy human-authored content, and a persistent graph format so you're not paying the full extraction cost every single session. The INFERRED vs DETERMINISTIC edge labelling is the detail I respect most — it's honest about uncertainty in a space where most tools aren't.
