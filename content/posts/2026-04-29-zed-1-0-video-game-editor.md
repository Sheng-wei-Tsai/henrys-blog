---
title: "Zed 1.0: The Editor Built Like a Video Game"
date: "2026-04-29"
excerpt: "Zed hit 1.0 today. The GPU-accelerated, Rust-built editor from the Atom creators just declared itself production-ready — and its bet on AI-native architecture is worth paying attention to."
tags: ["Zed", "Tools", "AI", "TypeScript"]
coverEmoji: "⚡"
auto_generated: true
source_url: "https://zed.dev/blog/zed-1-0"
---

Zed hit 1.0 today. Five years after Nathan Sobo's team — the people who built Atom and accidentally spawned Electron — declared their Rust-based, GPU-rendered editor production-ready. It's the top story on Hacker News today with good reason, and I want to explain why this is more than a version bump.

## Why They Started From Scratch

The Electron problem is simple: you inherit the platform's ceiling. Atom was a Chromium fork, which gave it flexibility but capped its performance. VS Code sits on the same foundation. Those editors are genuinely impressive given the constraints, but they'll always be fighting the browser runtime's overhead.

Zed wrote GPUI — a Rust UI framework — from scratch, specifically to solve this. Every frame rendered directly through the GPU via shaders, like a game engine. The practical effect is noticeable immediately: Zed opens a 50k-line TypeScript monorepo in roughly the time VS Code is still indexing symbols. On an M-series Mac with a Next.js project, startup is essentially instant. Scrolling through large files doesn't jank.

Owning every layer of the stack is why they could reach 1.0 with features like SSH remoting (edit files on a remote server with local editor performance) and a real debugger, without being blocked by what Electron can or can't do.

## AI Built Into the Foundation, Not Bolted On

Here's the part that matters more long-term. Zed didn't add an AI chat sidebar to an existing editor — they designed agents as first-class participants in the editing session.

The **Agent Client Protocol (ACP)** means Claude, Codex, OpenCode, and Cursor can all operate as agents directly inside Zed. You can run multiple agents in parallel on different tasks. Inline edit predictions appear at keystroke granularity — similar to Copilot completions but rendered through the GPU rather than a browser widget.

To wire up Claude, your `~/.config/zed/settings.json`:

```json
{
  "assistant": {
    "version": "2",
    "default_model": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    }
  },
  "features": {
    "edit_prediction_provider": "zed"
  }
}
```

`Cmd+?` opens the assistant panel; `Cmd+Enter` on a selection asks Claude about it with full file context. The keyboard-first flow stays intact — you're not mousing to a sidebar.

## What 1.0 Actually Means

Sobo is explicit in the announcement: 1.0 doesn't mean done, it means "most developers can quickly feel at home." The changelog fills in the gaps that kept people on VS Code: Git integration, SSH remoting, a debugger, proper Windows and Linux support. The "missing feature" excuses from 12 months ago mostly don't apply anymore.

The more interesting signal is what's on the roadmap: **DeltaDB**, a CRDT-based synchronisation engine that tracks every change with character-level granularity. The goal is a shared, consistent codebase view across multiple humans and AI agents — not screen sharing, not copy-pasting diffs, but actual shared editing state. Agents would commit directly into a live session; teammates would see changes at the character level in real time.

If DeltaDB ships as described, it changes how multi-agent code generation works in practice. Right now you're running an agent, reviewing its output, manually applying patches. With DeltaDB, the agent is another cursor in your file.

## What I'd Build With This

**A dedicated TypeScript + Next.js rig**: Set `~/.config/zed/settings.json` with project-local ESLint on save, strict TypeScript, and your `ANTHROPIC_API_KEY` wired to the assistant. SSH remoting into a cloud dev environment (a lightweight EC2 or Fly.io machine) means you get local editing feel against a remote build cache — useful when your laptop fan spins up during `next build`.

**Parallel agent review**: Zed's multi-agent support lets you run Claude on your diff in one panel while a second agent generates test cases for the same changes. Both work against the same file. Accept or reject chunks from each inline, git-patch style.

**Watch DeltaDB for a Supabase integration**: When DeltaDB ships, there'll be an early window to build collaborative dev tooling on top of it. Supabase Realtime + DeltaDB change events could power pair-programming sessions with audit trails — who changed what, when, and whether an agent or a human made the call. First mover advantage is real in this space.

---

I've been on Zed for most personal projects for the past six months. The 1.0 milestone makes it straightforward to put in front of teammates — the conversation shifts from "is it ready?" to "does it fit your workflow?" For most TypeScript and Rust developers, the answer is now probably yes.

The bet Zed is making is that the editor becomes the coordination layer for human-AI development teams, not just the place you type. DeltaDB is the part I'm watching most closely — if it delivers, the editor that owns that primitive will have a meaningful moat.
