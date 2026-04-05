---
title: "DESIGN.md: Drop One File, Get On-Brand UI From Any AI Agent"
date: "2026-04-05"
excerpt: "A single markdown file in your project root is all it takes for AI coding agents to generate consistent, on-brand UI. Here's how to write one for a Next.js/Tailwind/Supabase stack."
tags: ["AI", "Next.js", "Tailwind", "Developer Tools", "UI"]
coverEmoji: "🎨"
auto_generated: true
source_url: "https://github.com/VoltAgent/awesome-design-md"
---

The biggest time sink with AI-generated UI isn't the generation — it's the cleanup. You ask Cursor or Claude to build a settings page and it comes back with blue buttons when your brand is green, Inter when you use Geist, and card shadows that belong in 2018. `DESIGN.md` is a convention that fixes this at the source. Drop one markdown file in your repo root and every AI agent that touches the project knows exactly how your UI should look — colours, type scale, spacing, component states, the lot.

## What DESIGN.md Actually Is

Google Stitch introduced the format and VoltAgent's [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) repo has 55+ ready-to-use examples extracted from real developer-focused sites. The concept is simple: LLMs read markdown natively, so a structured markdown file is the most direct way to hand a design system to an agent without any tooling, parsing, or Figma plugins involved.

Think of it as the design equivalent of `AGENTS.md`. Your `AGENTS.md` tells agents how to build — run tests, use pnpm, don't touch the migrations folder. Your `DESIGN.md` tells agents how things should look.

The spec covers nine sections: visual theme and atmosphere, colour palette with semantic roles, typography hierarchy, component styling (buttons, cards, inputs, nav), layout and spacing principles, shadow/elevation system, do's and don'ts, responsive behaviour, and a prompt guide with ready-to-use snippets for agents.

## Writing a DESIGN.md for a Next.js/Tailwind Project

Here's a stripped-back `DESIGN.md` I'd put at the root of a Next.js 14 + Tailwind 3 + Supabase project. Pull from the awesome-design-md examples and adapt — don't write this from scratch every time.

```markdown
# DESIGN.md

## 1. Visual Theme & Atmosphere
Clean, high-contrast SaaS dashboard. Dark mode first. Dense information layout
with generous whitespace inside components. Functional over decorative.

## 2. Colour Palette
| Role | Token | Hex |
|---|---|---|
| Background | `bg-gray-950` | #030712 |
| Surface | `bg-gray-900` | #111827 |
| Border | `border-gray-800` | #1f2937 |
| Primary | `bg-emerald-500` | #10b981 |
| Primary hover | `bg-emerald-400` | #34d399 |
| Text primary | `text-white` | #ffffff |
| Text muted | `text-gray-400` | #9ca3af |
| Destructive | `bg-red-500` | #ef4444 |

## 3. Typography
Font: Geist Sans (next/font/google). Mono: Geist Mono.

| Role | Class |
|---|---|
| Page heading | `text-2xl font-semibold tracking-tight` |
| Section heading | `text-lg font-medium` |
| Body | `text-sm text-gray-300` |
| Caption | `text-xs text-gray-500` |
| Code | `font-mono text-sm text-emerald-400` |

## 4. Component Styling
**Buttons**
- Primary: `bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg px-4 py-2 text-sm transition-colors`
- Ghost: `bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700`
- Destructive: `bg-red-500 hover:bg-red-600 text-white`

**Cards**
`bg-gray-900 border border-gray-800 rounded-xl p-6`
No drop shadows on cards. Borders only.

**Inputs**
`bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`

**Data tables**
`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden`
Header row: `bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider`

## 5. Layout Principles
- Max content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Sidebar width: 240px fixed, collapses to icon-only at md breakpoint
- Section spacing: `space-y-6` between major sections
- Card grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

## 6. Depth & Elevation
No box shadows. Use border colour and background contrast to create hierarchy.
Overlays/modals: `bg-gray-950/80 backdrop-blur-sm`

## 7. Do's and Don'ts
✅ Use emerald as the single accent colour
✅ Keep border-radius consistent at `rounded-lg` or `rounded-xl`
✅ Use `transition-colors duration-150` on interactive elements
❌ Don't use blue — that's Supabase's colour, not ours
❌ Don't add decorative gradients or illustrations
❌ Don't use font weights above 600

## 8. Responsive Behaviour
- Mobile: single column, bottom nav replaces sidebar
- Tablet (md): sidebar collapses to icons
- Desktop (lg+): full sidebar + content

## 9. Agent Prompt Guide
When building UI, reference this file and:
- Always use Tailwind classes directly — no inline styles
- Import components from `@/components/ui/`
- Use `cn()` from `@/lib/utils` for conditional classes
- Supabase auth state lives in `@/lib/supabase/client.ts`
```

That last section is the bit people skip and shouldn't. Project-specific context — where auth lives, which utility functions exist — saves a tonne of back-and-forth with the agent.

## Wiring It Into Your Workflow

Once the file exists, using it is just prompting:

```
Build a user settings page following DESIGN.md. 
It should show profile info from Supabase auth.getUser() 
and let users update their display name. 
Use the card component pattern from DESIGN.md section 4.
```

For Cursor users, reference it in your `.cursorrules` so it's always in context:

```
# .cursorrules
Always read DESIGN.md before generating any UI components.
All UI must follow the colour palette and component patterns defined there.
```

For Claude via the API or Claude.ai Projects, drop the `DESIGN.md` contents into your project instructions once. Every subsequent UI generation prompt is automatically grounded in it.

## What I'd Build With This

**Supabase admin dashboard** — every internal tool I've built has had inconsistent UI because different team members prompted different things. A shared `DESIGN.md` in the repo means anyone generating a new admin view gets the same table styles, the same button variants, the same colour usage. No design review required for internal tools.

**Multi-tenant SaaS with white-labelling** — maintain a `DESIGN.md` per tenant in a `/design-systems/` folder. When generating tenant-specific UI, point the agent at the right file. Beats maintaining multiple Tailwind config overrides.

**Component library bootstrapper** — use the awesome-design-md examples to grab a `DESIGN.md` inspired by a site whose aesthetic you like (Linear, Vercel, Resend all have entries), then prompt an agent to generate your full component set — buttons, inputs, cards, badges — in one pass. Better starting point than shadcn defaults for opinionated projects.

This is one of those conventions that should have existed three years ago. Now that agents are doing more of the UI work, having a machine-readable design spec in the repo is just table stakes. Grab one of the 55 examples from awesome-design-md, adapt it to your stack, and commit it alongside your `README.md`. Future you — and your agents — will thank you.
