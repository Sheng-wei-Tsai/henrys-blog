---
title: "Graphify: Turn Your Next.js Codebase into a Queryable Knowledge Graph"
date: "2026-04-08"
excerpt: "Graphify ingests your code, docs, and images into a persistent knowledge graph you can query with an AI assistant that actually understands your project structure — not just keyword-searches it."
tags: ["AI", "Python", "Developer Tools", "Knowledge Graph", "Next.js"]
coverEmoji: "🕸️"
auto_generated: true
source_url: "https://github.com/safishamsi/graphify"
---

12,000+ stars in a week is a signal worth paying attention to. Graphify solves a specific, painful problem: you drop into a large Next.js/TypeScript codebase — or come back to your own after six months — and your AI assistant gives you confident-sounding answers that miss the architectural intent entirely because it's reading raw files with no sense of structure. Graphify fixes that by building a persistent knowledge graph from your code, docs, and images, then letting you query that graph instead of the files themselves.

## How the Ingestion Actually Works

Graphify runs two passes. First, a deterministic AST pass over your code using tree-sitter — no LLM, no hallucination risk, just structural facts: classes, functions, imports, call graphs, docstrings. For a TypeScript codebase this means it actually resolves your component tree, your hook dependencies, your API route structure.

Second pass: Claude subagents run in parallel over everything that isn't code — your `docs/` folder, architecture PDFs, Figma export screenshots, ADR markdown files, whiteboard photos from that session where you designed the auth flow. It extracts concepts and relationships from all of it and merges them into a single NetworkX graph, clustered with Leiden community detection.

The clustering is graph-topology-based — no embeddings, no vector database. The semantic edges Claude extracts (labelled `semantically_similar_to`, flagged as INFERRED so you know what's derived) directly influence community detection. The graph structure *is* the similarity signal.

The output lands in `graphify-out/`:

```
graphify-out/
├── graph.html       # interactive — click nodes, filter by community
├── GRAPH_REPORT.md  # god nodes, surprising connections, suggested questions
├── graph.json       # persistent — query weeks later without re-ingesting
└── cache/           # SHA256 cache — re-runs only touch changed files
```

## Running It on a Next.js/TypeScript Project

Install and run:

```bash
pip install graphifyy

# From your project root
/graphify .
```

Or if you're using Claude Code, Codex, or OpenCode, just type `/graphify .` directly in the chat. It reads your files, builds the graph, writes the output.

For a Next.js project you'll want a `.graphifyignore` to avoid wasting time on generated output:

```
# .graphifyignore
.next/
node_modules/
dist/
out/
*.d.ts
```

Once the graph is built, querying it costs 71.5x fewer tokens per query compared to feeding raw files — because you're querying structured relationships, not re-reading source. That's not a rounding error; on a large monorepo that's the difference between a query that works and one that hits context limits.

To query the graph from Python:

```python
import json
import networkx as nx
from networkx.readwrite import json_graph

with open("graphify-out/graph.json") as f:
    data = json.load(f)

G = json_graph.node_link_graph(data)

# Find all nodes connected to your auth module
auth_neighbours = list(G.neighbors("src/lib/auth.ts"))
print(auth_neighbours)

# Check edge relationships
for u, v, attrs in G.edges(data=True):
    if attrs.get("relationship") == "semantically_similar_to":
        print(f"{u} ↔ {v} [INFERRED]")
```

The `GRAPH_REPORT.md` is genuinely useful — it flags "god nodes" (files with an unusual number of connections, i.e. your actual critical paths) and surfaces connections the AST wouldn't have found, like a design doc that conceptually matches a component cluster.

## Feeding It into an AI Assistant

The real use case is pairing the graph with an assistant that queries `graph.json` rather than your raw codebase. Quick FastAPI wrapper:

```python
from fastapi import FastAPI
import json, networkx as nx
from networkx.readwrite import json_graph

app = FastAPI()

with open("graphify-out/graph.json") as f:
    G = json_graph.node_link_graph(json.load(f))

@app.get("/context")
def get_context(node: str, depth: int = 2):
    if node not in G:
        return {"error": "node not found"}
    subgraph_nodes = nx.ego_graph(G, node, radius=depth).nodes(data=True)
    return {"nodes": list(subgraph_nodes)}
```

Your assistant calls `/context?node=src/components/CheckoutForm.tsx&depth=2` before answering questions about that component. It gets back the actual dependency neighbourhood — hooks it calls, API routes it hits, design docs that reference it — not a keyword search result.

## What I'd Build with This

**Onboarding assistant for a large monorepo.** New engineers type a component name, get back the community it belongs to, the god nodes that control it, and the ADRs that explain why it was built that way. Faster than reading 40 PRs.

**Architecture drift detector.** Run Graphify on a schedule, diff `graph.json` between runs. Flag when a module's neighbourhood changes significantly — a new god node forming, an INFERRED edge that shouldn't exist. Pipe that into a Slack alert.

**Screenshot-to-graph ingest for design handoffs.** Drop Figma exports and whiteboard photos into a `/raw` folder, run Graphify, and have the design concepts automatically linked to the components that implement them. Your AI assistant can then answer "does this UI match the original design intent" with actual graph evidence.

The persistent `graph.json` is the bit I keep coming back to. You build the graph once, query it indefinitely, only re-process what changed. That changes Graphify from a one-shot analysis tool into infrastructure — something you run in CI and query continuously. That's the version worth building on.
