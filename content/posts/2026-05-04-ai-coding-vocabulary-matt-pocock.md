---
title: "The AI Coding Vocabulary You Actually Need"
date: "2026-05-04"
excerpt: "Matt Pocock just open-sourced a dictionary of AI coding jargon that explains the stuff model docs glossed over. Here are the terms that matter most when you're building AI-powered apps in production."
tags: ["AI", "LLMs", "Claude API", "Developer Tools"]
coverEmoji: "📖"
auto_generated: true
source_url: "https://github.com/mattpocock/dictionary-of-ai-coding"
---

Matt Pocock — the person responsible for more TypeScript developers understanding generics than anyone else — just open-sourced an [AI coding dictionary](https://github.com/mattpocock/dictionary-of-ai-coding). Nearly 900 stars in the first week for what is essentially a glossary file. That tells you something about how badly this vocabulary was needed.

The problem isn't that the concepts are hard. It's that model providers assume you already know them, so they don't explain them. You're left inferring why your context degrades halfway through a session, or why the same prompt behaves differently on consecutive calls, or why your Claude bill is 10x higher than expected.

Here are the terms I think actually matter when you're building AI-powered features — filtered for developers who are calling APIs rather than just using chat interfaces.

## Context and attention degradation

Every model has a **context window** — the total number of tokens it can hold in a single request. That's not the interesting part. The interesting part is **attention degradation**: as the context fills up, the model's ability to attend to earlier content gets worse. Distant tokens matter less than recent ones.

This is why agentic sessions go sideways after a while. It's not the model "forgetting" — it's the attention mechanism deprioritising distant tokens. Matt calls the early, active portion the **smart zone**: roughly the first third of the context window is where reasoning is sharpest.

The practical implication: if you're building a long-running feature (interview prep, multi-step resume analysis), structure your prompts so critical instructions are near the end of the context, not the beginning. Front-loading your system prompt and then adding 20 user messages before the real task is a good way to get mediocre output.

## Prefix caching and why it matters for your bill

**Prefix caching** (also called **cache tokens** in Anthropic's billing) is one of the most impactful things to understand if you're paying Claude API costs.

When two requests share a common prefix — say, the same system prompt — the model provider can cache the KV computation for that prefix and reuse it. Anthropic bills cached tokens at about 10% of the standard input rate.

The implication: if your system prompt is 2,000 tokens and you're running 1,000 requests a day, putting the stable content at the top of the prompt (where caching kicks in) will cut your input token costs by 90% on that prefix. Conversely, if you put dynamic content like `Today is ${date}` at the top of your system prompt, you destroy the cache every time.

```ts
// ❌ Destroys cache prefix every request
const systemPrompt = `Today is ${new Date().toISOString()}. You are a helpful assistant...`;

// ✅ Stable prefix caches across requests
const systemPrompt = `You are a helpful assistant for TechPath AU, a career platform...
...2000 tokens of stable instructions...`;

// Dynamic content goes in the user turn instead
const userMessage = `[Context: ${new Date().toISOString()}]\nUser question: ${question}`;
```

This single change can make a meaningful difference on anything that runs at scale.

## Handoffs, compaction, and long sessions

A **handoff** is what happens when you pass work from one AI context to another — either because the context window filled up, or because you're switching to a new session. The **handoff artifact** is the document (a spec, a summary, a ticket) that carries the relevant state forward.

**Compaction** is the process of summarising a long context down to the essential state so a new session can continue where the old one left off. Claude Code does this automatically with **autocompact**, but when you're building your own agentic system you have to implement it yourself.

If you're building multi-step AI features that might span many turns, designing explicit handoff artifacts is worth doing early. Something like:

```ts
interface AgentHandoff {
  taskSummary: string;
  completedSteps: string[];
  currentState: Record<string, unknown>;
  nextStep: string;
  blockers: string[];
}
```

When the session approaches context limits, have the model produce this structure before clearing. Feed it back in as the preamble for the next session. It's not glamorous but it's what makes long-running agents reliable.

## Sycophancy — why the model agrees with you

**Sycophancy** is the model's tendency to validate whatever you say, especially when you push back. If you tell the model its answer was wrong, there's a good chance it'll agree with you even if it was right.

This is a real problem in interactive AI features. If you're building an interview coach or resume analyser, you don't want the model to cave when the user argues back. A few mitigations:

- Include an explicit instruction like "if the user disagrees with your assessment, re-examine your reasoning but do not simply capitulate — only change your position if they provide new information or a valid counter-argument"
- Use a higher temperature for initial assessments, then lock down the response format before showing it to the user (harder to retract a structured output)
- In multi-turn features, summarise the AI's prior positions in the system prompt so they're harder to silently abandon

## AGENTS.md as a first-class pattern

Matt's dictionary has an entry specifically for **AGENTS.md** — the convention of putting AI agent instructions in a markdown file that gets loaded into context. It's become a de facto standard, and it's worth treating it as seriously as you'd treat a `CONTRIBUTING.md`.

The value isn't just that it tells the agent what to do. It's that it's version-controlled, reviewable, and applies consistently across every session. If your AI feature has quirks — data it shouldn't touch, formats it must follow, constraints from legal — those belong in an AGENTS.md equivalent, not in an ad-hoc system prompt that lives in a `.env` file.

## What I'd build with this

**A jargon-aware AI onboarding flow.** When a new developer joins your platform, have them tell you what they understand about AI coding. Use this vocabulary as a benchmark — quiz them on the five or six concepts that most directly affect how they'll use your product. Tailor the onboarding based on where their mental model has gaps.

**Context health monitoring for long agent sessions.** Track token count across agent turns and surface a warning when you're approaching 60% of the context window (the edge of the smart zone). Give the user the option to compact before quality degrades, rather than waiting for it to fail silently.

**A billing optimisation audit tool.** Accept a system prompt as input, analyse the structure, and report on cache-ability: what percentage of tokens are stable across requests, where the cache break points are, and how much you'd save by restructuring. Something I'd genuinely use every time I ship a new AI feature.

---

The dictionary itself is worth bookmarking — it's at [github.com/mattpocock/dictionary-of-ai-coding](https://github.com/mattpocock/dictionary-of-ai-coding) and covers about 60 terms across 7 sections. Matt's framing in the intro is honest: "there's a whole VC-funded economy that benefits from keeping this hard to understand." The vocabulary is learnable in an afternoon. Once you have it, a lot of the mystery around AI billing and model behaviour disappears.
