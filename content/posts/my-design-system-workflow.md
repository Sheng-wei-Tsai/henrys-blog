---
title: "How I Build My Personal Design System"
date: "2025-02-28"
excerpt: "A design system doesn't have to be corporate or complex. Here's the lightweight process I use for my own projects."
tags: ["Design", "Tech & Coding"]
coverEmoji: "🎨"
---

Every project I build starts the same way: I open a file and define my CSS variables. That 10-minute ritual has saved me hundreds of hours.

This is my personal design system workflow.

## Start with color tokens

I never use hardcoded colors anywhere. Everything goes through a variable:

```css
:root {
  --color-primary: #c4623a;
  --color-bg: #faf6f0;
  --color-text: #231a12;
  --color-muted: #a08070;
}
```

When I want to change my accent color, I change one line. Done.

## Typography hierarchy

I pick two fonts max: one for display/headings, one for body. The contrast between them does the heavy lifting.

> A great font pairing can make a mediocre design look polished. A bad pairing can break a great design.

My current favourite combination: **Lora** (serif, warm, literary) for headings + **DM Sans** (clean, humanist) for body text.

## Spacing scale

I use a simple 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64. I don't memorise it — I just build `--space-xs` through `--space-xl` and reference those.

Consistent spacing is the single biggest difference between designs that feel "off" and designs that feel calm.

## The one rule that changed everything

**Design in context, not isolation.** Stop tweaking button styles in a vacuum. Put the button on a real page, with real content around it. Your eye will immediately tell you what needs to change.

---

Next time I'll write about how I handle dark mode without losing my mind.
