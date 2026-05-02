---
title: "Give Your AI Coding Agent a Consistent Design System"
date: "2026-04-30"
excerpt: "nexu-io/open-design hit 8,000 GitHub stars this week — a local-first platform that wires 72 brand-grade design systems into Claude Code, Cursor, and 8 other coding agents so you stop explaining your design tokens in every session."
tags: ["AI Tools", "Design Systems", "TypeScript"]
coverEmoji: "🎨"
auto_generated: true
source_url: "https://github.com/nexu-io/open-design"
---

Every time I start a new conversation with Claude Code, I'm re-explaining the same design context: "use Space Grotesk for UI, Lora for headings, these exact CSS variables..." It lives in `CLAUDE.md` as paragraphs of prose, and even then the generated components still drift — wrong spacing, invented colour values, button styles that don't match anything else in the codebase.

**open-design** (nexu-io/open-design, ~8,000 GitHub stars in under a week) takes a different approach. It packages design systems as machine-readable artefacts that any AI coding agent can consume. Instead of describing your design system in prose, you reference it by name and the agent gets structured, typed data.

## What It Actually Is

open-design is two things bundled together:

**72 pre-built design systems** — each with colour tokens, typography scales, spacing rules, and component conventions. You pick one (or compose several), and it becomes the source of truth for your agent sessions.

**19 Skills** — reusable instruction sets for specific design tasks: generating a primary button, laying out a card grid, building a data table. Skills reference your chosen design system rather than inventing values.

The architecture is fully local-first. Design system artefacts live on disk in a `.design/` directory; nothing is sent to a central server. BYOK means you use your own API keys for the underlying model.

It integrates with 10 coding-agent CLIs: Claude Code, Cursor, Codex, Gemini CLI, OpenCode, Qwen, GitHub Copilot, and a few others. The integration surface is just a config file and a project context reference — no vendor lock-in.

## Wiring It Into Claude Code

Setup is a single init command:

```bash
npx open-design init
```

This scaffolds `.design/config.json` and a `systems/` subdirectory at your project root. Pick a design system from the catalogue:

```bash
npx open-design use "Tokyo Midnight"
```

Then in your `CLAUDE.md`:

```
Design system: see .design/config.json
When generating any UI component, load the active design system and follow its tokens exactly.
Use the "button-primary" Skill for primary CTA buttons.
```

That's it. Any coding agent reading your project context now has structured colour tokens, type scales, and spacing rules from `.design/` instead of guessing.

## The Actual Difference

Without a design system reference, an agent invents values:

```tsx
// agent guesses — drifts every session
<button style={{ 
  background: '#3b82f6', 
  color: 'white',
  borderRadius: '6px',
  padding: '8px 16px'
}}>
  Save changes
</button>
```

With the "Tokyo Midnight" system loaded via the `button-primary` Skill:

```tsx
// agent uses structured tokens — consistent across sessions
<button className="btn-primary">
  Save changes
</button>
```

```css
/* .design/systems/tokyo-midnight/tokens.css */
.btn-primary {
  background: var(--ds-brand-500);
  color: var(--ds-text-inverse);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-2) var(--ds-space-4);
  font-family: var(--ds-font-ui);
}
```

Every agent session, every component, same tokens. The drift disappears because the source of truth is typed data, not prose that a model might interpret differently each time.

## What I'd Build With This

**Project-specific design system for an existing codebase.** TechPath AU already has a strict design language — ink colours, panel shadows, Lora headings. Packaging those CSS custom properties as an open-design artefact would mean Claude Code generates on-brand components first try, every time. No more writing essays about `var(--panel-shadow)` in every `CLAUDE.md` update.

**Onboarding screen generator.** Wire an open-design Skill for onboarding flows to a SaaS-specific system, then run Claude Code in headless mode to scaffold entire screen sequences from a product brief. The design constraints are encoded, not described — so the output is immediately on-brand.

**Figma token sync script.** A small TypeScript utility that reads a Figma token export (Design Tokens Community Group format) and converts it into an open-design system artefact. Your designer and your AI coding agent then share the same ground truth — no translation layer, no drift.

## My Take

The problem is real. AI coding agents are good at component logic but inconsistent at design — unless you give them structured, machine-readable context rather than prose. What makes open-design interesting over just dropping a design doc in markdown is that the artefacts are typed and queryable. A model parsing structured JSON tokens is going to be more reliable than one reading a bullet-pointed description of your spacing scale.

The 72 pre-built systems sound like a lot until you want a bespoke one for your product. But the local-first model means you can fork any built-in system and customise it — which is the right architecture for a tool like this.

Worth an afternoon to wire in if you're doing regular UI work with an AI coding agent. The setup overhead is low; the reduction in design drift pays off quickly.
