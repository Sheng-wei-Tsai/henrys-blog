---
title: "OpenClaude: Claude Code's Agentic Workflow, Any LLM You Want"
date: "2026-04-03"
excerpt: "OpenClaude rips out Claude's proprietary backend and lets you wire the same terminal-first coding agent UX to Gemini, DeepSeek, Ollama, or 200+ OpenAI-compatible models. Here's why that matters and how to get running today."
tags: ["AI", "TypeScript", "Developer Tools", "LLM", "CLI"]
coverEmoji: "🤖"
auto_generated: true
source_url: "https://github.com/Gitlawb/openclaude"
---

Claude Code's agentic workflow is genuinely good — bash tools, file edits, grep, glob, MCP, streaming output, the whole lot. The problem is it's locked to Anthropic's API, which means US billing, waitlists, and costs that add up fast. [OpenClaude](https://github.com/Gitlawb/openclaude) clones that entire UX and lets you swap in whatever backend you actually have access to. 11,000+ stars in a week tells you the appetite for this was real.

## What You're Actually Getting

OpenClaude is a TypeScript CLI that re-implements Claude Code's agentic loop — the bit where the model calls tools, reads files, runs shell commands, and iterates — but abstracts the model layer out completely. You get the same `/` slash commands, the same MCP support, the same streaming terminal output. The only thing that changes is where the inference happens.

Provider support is broad:

| Provider | How to connect |
|---|---|
| OpenAI / OpenRouter / DeepSeek / Groq | OpenAI-compatible env vars or `/provider` |
| Gemini | `/provider` or env vars |
| Ollama (local) | `OPENAI_BASE_URL=http://localhost:11434/v1` |
| GitHub Models | `/onboard-github` |
| Bedrock / Vertex | env vars |
| Atomic Chat (Apple Silicon) | advanced setup |

That last one is interesting for Mac users — local inference with no API calls at all.

## Getting Running in Under 5 Minutes

Install it globally:

```bash
npm install -g @gitlawb/openclaude
```

If you've got an OpenAI key (or an OpenRouter key, which gives you access to basically everything):

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o

openclaude
```

For a fully local setup with Ollama — no API key, no egress, runs on your machine:

```bash
# First, pull a decent coding model
ollama pull qwen2.5-coder:7b

# Then point OpenClaude at the local Ollama server
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=qwen2.5-coder:7b

openclaude
```

Ollama exposes an OpenAI-compatible `/v1` endpoint, so OpenClaude talks to it like it's GPT. Once you're inside, run `/provider` to save a named profile so you're not re-exporting env vars every session.

If `ripgrep` isn't found after install, fix it before you start:

```bash
# macOS
brew install ripgrep

# Ubuntu/Debian
apt install ripgrep

# Verify
rg --version
```

## The Provider Profile System

The `/provider` slash command is where OpenClaude earns its keep for multi-model workflows. You can save named profiles for different backends and switch between them without touching env vars. Useful when you want to use DeepSeek for cheap bulk refactoring tasks and Gemini 1.5 Pro for the harder architectural questions.

For GitHub Models — which gives Australian devs free access to a solid model lineup through your GitHub account — there's a dedicated onboarding flow:

```bash
# Inside openclaude
/onboard-github
```

It walks you through auth and saves credentials. GitHub Models has been quietly useful for anyone who wants capable inference without a credit card attached to a US API account.

## What I'd Build With This

**1. A repo-wide refactoring agent with cost controls**
Point OpenClaude at a legacy TypeScript codebase, use DeepSeek (cheap) for the bulk renaming and import fixing passes, then switch to a stronger model only for the hairy logic rewrites. The provider profile system makes this a manual switch rather than a re-config job. Run it locally so no code leaves your network.

**2. A local code review bot for offline or air-gapped work**
Set up Ollama with `qwen2.5-coder:7b` or `deepseek-coder-v2` and wire OpenClaude into a pre-commit hook or CI script. It reads your diff, runs the agent loop against your actual files, and posts a structured review. Zero API costs, works on a plane, nothing leaves your laptop.

**3. A multi-provider benchmark harness**
Use OpenClaude's consistent CLI surface to throw the same coding tasks at four or five different models — Gemini, DeepSeek, a local Ollama model, GPT-4o via OpenRouter — and compare output quality against token cost. The uniform tooling means you're testing the model, not fighting different API shapes.

The vendor lock-in problem with coding agents has been annoying me for a while. OpenClaude doesn't solve the hard AI research bits, but it does solve the dumb infrastructure problem of being tied to one provider's uptime, pricing, and geo-restrictions. For Australian devs especially, having a clean path to local inference or non-US-centric providers is genuinely useful. I'll be keeping this in my toolbox.
