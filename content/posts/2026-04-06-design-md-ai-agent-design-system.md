---
title: "DESIGN.md: Give Your AI Agent a Design Brain"
date: "2026-04-06"
excerpt: "A plain markdown file that tells AI coding agents exactly how your UI should look. No Figma, no JSON schemas — just drop it in your project root and watch consistent UI fall out the other side."
tags: ["AI", "Design Systems", "Next.js", "Developer Tools"]
coverEmoji: "🎨"
auto_generated: true
source_url: "https://github.com/VoltAgent/awesome-design-md"
---

AI coding agents are genuinely useful until they start making UI decisions. Left to their own devices, Cursor or Claude will give you a different shade of blue on every page, inconsistent button states, and a typography hierarchy that looks like it was assembled by committee. DESIGN.md is a dead-simple fix that's picking up serious traction — 22k stars this week on the [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) repo — and it's worth wiring into every project you're running AI on right now.

## What DESIGN.md Actually Is

Google Stitch introduced the format. The idea is simple: a plain markdown file sitting at your project root that defines your design system in terms an LLM can actually use. No tooling, no exports, no build step. Just structured markdown describing your colours, typography, components, spacing, and guardrails.

The analogy is clean. You've probably already got an `AGENTS.md` (or `CLAUDE.md`) that tells your agent how to build the project — run commands, project structure, conventions. `DESIGN.md` does the same job but for how the project should *look*.

```
/my-app
  AGENTS.md      ← how to build it
  DESIGN.md      ← how it should look
  /app
  /components
```

Every `DESIGN.md` in the awesome-design-md collection follows the Stitch format with nine sections: visual theme, colour palette with semantic roles, typography hierarchy, component styling (buttons, cards, inputs), layout principles, shadow/elevation system, do's and don'ts, responsive behaviour, and a ready-to-use agent prompt guide at the bottom.

The agent prompt guide section alone is worth the price of admission — it's a cheat sheet of copy-paste prompts tuned to the design system you just dropped in.

## Writing One for Your Next.js/Supabase Stack

The fastest path is grabbing one of the 58 existing files from the repo and adapting it. But here's what a minimal custom one looks like for a typical dark-mode SaaS dashboard:

```markdown
# DESIGN.md — My App

## 1. Visual Theme & Atmosphere
Dark, dense, data-forward. Think Linear or Vercel dashboard.
No decorative elements. Every pixel earns its place.

## 2. Color Palette
| Token | Hex | Role |
|-------|-----|------|
| `bg-base` | #0a0a0a | Page background |
| `bg-surface` | #111111 | Card / panel backgrounds |
| `bg-elevated` | #1a1a1a | Hover states, dropdowns |
| `border` | #2a2a2a | All borders |
| `text-primary` | #ededed | Headings, labels |
| `text-muted` | #71717a | Secondary text |
| `accent` | #6366f1 | Primary actions, links |
| `accent-hover` | #4f46e5 | Hover state for accent |
| `destructive` | #ef4444 | Errors, delete actions |

## 3. Typography
- Font: Inter (system fallback: -apple-system)
- Base: 14px / 1.5 line height
- Scale: 12 / 14 / 16 / 20 / 24 / 32px
- Never exceed 60ch line length in body text

## 4. Components
### Buttons
- Primary: `bg-accent` fill, 8px radius, 32px height, medium weight label
- Secondary: transparent + `border` stroke, same geometry
- Destructive: `bg-destructive` fill, same geometry
- States: hover darkens 10%, disabled at 40% opacity

### Cards
- Background: `bg-surface`
- Border: 1px `border`
- Radius: 8px
- Padding: 16px or 24px — never mix within a view

## 5. Layout
- Sidebar: 240px fixed
- Content max-width: 1200px
- Spacing scale (4px base): 4 / 8 / 12 / 16 / 24 / 32 / 48px
- Section gaps: always 32px minimum

## 7. Do's and Don'ts
✅ Use `text-muted` for all secondary/helper text
✅ Consistent 8px border-radius across interactive elements
❌ No box shadows — use border + bg-elevated for depth
❌ No gradients on UI chrome
❌ Never use raw colour values — always reference tokens

## 9. Agent Prompt Guide
Quick reference: accent=#6366f1, surface=#111111, border=#2a2a2a

Example prompts:
- "Build a data table component using the DESIGN.md token system"
- "Create a settings page layout following the sidebar and content-width rules"
- "Add a delete confirmation modal using destructive colour and card component styles"
```

Pop that in your project root and your Supabase auth screens, dashboard pages, and data components will stop looking like they came from three different designers.

## Wiring It Into Your Agentic Workflow

The file does nothing on its own — you need to reference it. Three approaches that actually work:

**Cursor:** Add this to `.cursorrules`:
```
Always read DESIGN.md before generating any UI component or page.
All colours, spacing, and component styles must reference the token system defined there.
```

**Claude / API workflows:** Prepend it to your system prompt. If you're using the Anthropic API for automated UI generation, read the file and include it directly:
```python
with open("DESIGN.md", "r") as f:
    design_context = f.read()

system_prompt = f"""You are a UI developer.
Here is the design system you must follow:

{design_context}

Never deviate from the colours, spacing, or component patterns defined above."""
```

**AGENTS.md reference:** For agents that read `AGENTS.md` on startup, add a single line:
```markdown
## Design
Before building any UI, read DESIGN.md in the project root and follow it strictly.
```

The key is making the agent read it *before* generating, not after. Retrofitting is painful.

## What I'd Build With This

**1. Multi-tenant SaaS with per-client theming** — Maintain a `DESIGN.md` per client in a `/design-systems/` directory. When generating tenant-specific UI, inject the matching file. Instant brand consistency across what is otherwise the same codebase.

**2. Design system enforcement CI check** — Write a script that runs on PR, extracts all Tailwind colour classes used in new components, and checks them against the palette defined in `DESIGN.md`. Flag anything using raw hex values or off-system colours. Keeps the design system honest without manual review.

**3. Rapid landing page generator** — Pull a `DESIGN.md` from the awesome-design-md collection that matches the aesthetic you want (Linear-style, Vercel-style, etc.), drop it in a fresh Next.js project, and use an agent to scaffold the full page set. You get a credible-looking product site in an afternoon without touching Figma.

---

I've been manually pasting colour palettes and spacing rules into prompts for months. Having a standardised file format that any agent can read is the kind of boring infrastructure improvement that actually compounds. The awesome-design-md repo gives you 58 production-quality starting points. Grab one, adapt it, commit it, and stop fighting your agent over button colours.
