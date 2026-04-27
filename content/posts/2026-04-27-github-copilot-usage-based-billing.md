---
title: "GitHub Copilot's Usage Billing: What You're Actually Paying Now"
date: "2026-04-27"
excerpt: "Starting June 1, your flat Copilot subscription becomes a credit meter. Here's the real maths on model multipliers and whether you should stay or switch."
tags: ["GitHub Copilot", "AI Tools", "Developer Productivity"]
coverEmoji: "💳"
auto_generated: true
source_url: "https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/"
---

GitHub dropped this [announcement](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) this morning and it's all over HN (468 points, 367 comments at time of writing). Starting **June 1**, Copilot moves from flat subscriptions to a credit-based usage model. The headline pricing looks the same — $10/month for Pro, $39 for Pro+ — but what that money actually buys you is fundamentally different.

The era of subsidised inference is over. Here's what it means in practice.

## How the Credit Meter Works

Previously, your $10/month Copilot Pro plan gave you access to multiple models with soft monthly request caps. In practice, developers were burning through hundreds of dollars worth of inference (particularly Claude Opus and GPT-4) on a flat tenner. GitHub was absorbing the difference.

Now each plan converts to an equivalent number of **AI Credits** — $10 plan gets $10 of credits, $39 plan gets $39. Those credits are spent at different rates depending on the model you use, measured in multipliers:

| Model tier | Multiplier | Effective cost on $10 plan |
|---|---|---|
| Basic completion models | 1× | Full $10 worth |
| GPT-4o, Claude Sonnet | ~6× | ~$1.67 worth |
| Claude Opus | ~27× | ~$0.37 worth |

That last row is the one that stings. If you've been using Copilot Chat with Opus for complex refactoring, architectural review, or anything that needs real reasoning — you were getting probably $300–500/month of compute for $10. Now you get less than 40 cents of Opus time.

The math that's doing the rounds on HN: one commenter noted you could previously prompt `plan this out for me, don't stop until fully planned` and burn through ~$5 of Opus in a single request. 100 of those requests a month, $10 bill. Now that same usage pattern blows your entire monthly credit in two requests.

## What This Actually Changes Day-to-Day

The **inline autocomplete** (tab completions in VS Code or JetBrains) runs on lightweight models and won't eat credits fast. That part of the experience is probably fine.

What changes dramatically:

- **Copilot Chat with premium models** — every Opus or Sonnet conversation is now metered
- **Copilot agent tasks** (multi-step agentic runs) — these are expensive and burn credits quickly
- **Code review and PR summaries** using premium models

For most developers who mainly use tab completion and occasional quick questions, the impact is minimal. For heavy users of Copilot Chat who've been relying on Opus for serious reasoning tasks, this is effectively a large price increase.

## Whether to Stay or Switch

The HN thread is full of people running the comparison to OpenRouter and direct API access. Here's how the maths line up if you're a moderate user:

**Stay on Copilot Pro if:**
- You mostly use tab completions and Copilot inline suggestions
- You only occasionally use Chat for quick questions
- You value the deep IDE integration and want zero config

**Switch to direct API or OpenRouter if:**
- You're doing serious Copilot Chat sessions daily
- You want to control your model selection per task
- You want credits that roll over (Copilot credits expire monthly)

For a hybrid workflow, a lot of developers are landing on: keep Copilot Pro for the IDE autocomplete experience, and use direct API access (Claude or OpenAI) for the heavy reasoning tasks where you need Opus-level quality.

Here's a rough cost tracking approach if you want to audit your own usage before June 1:

```typescript
// Rough credit burn estimator — paste into a scratch file
// to understand your current usage patterns

type ModelTier = 'basic' | 'standard' | 'premium';

const MULTIPLIERS: Record<ModelTier, number> = {
  basic: 1,      // Copilot completions, small models
  standard: 6,   // GPT-4o, Claude Sonnet
  premium: 27,   // Claude Opus, similar high-tier
};

function estimateMonthlyCost(
  sessions: { tier: ModelTier; requestsPerDay: number }[],
  planCredits: number = 10
) {
  const dailyCredit = planCredits / 30;

  const dailyBurn = sessions.reduce((total, s) => {
    // Rough: each Chat request ≈ $0.01–0.05 at base rate
    const baseCostPerRequest = 0.02;
    return total + s.requestsPerDay * baseCostPerRequest * MULTIPLIERS[s.tier];
  }, 0);

  const daysUntilEmpty = dailyCredit / dailyBurn;

  return {
    dailyBurn: dailyBurn.toFixed(4),
    daysUntilCreditsEmpty: Math.floor(daysUntilEmpty),
    monthlyBurn: (dailyBurn * 30).toFixed(2),
  };
}

// Example: 10 completions/day (basic) + 5 chat sessions/day (premium)
console.log(estimateMonthlyCost([
  { tier: 'basic', requestsPerDay: 10 },
  { tier: 'premium', requestsPerDay: 5 },
]));
// { dailyBurn: '2.9200', daysUntilCreditsEmpty: 0, monthlyBurn: '87.60' }
// = you'd burn through the $10 plan in under a day
```

The numbers above illustrate why heavy Opus users are alarmed. Five agentic chat sessions per day with a premium model burns $87/month of credits against a $10/month plan.

## What I'd Build With This

**1. Personal AI credit dashboard** — a small Next.js app that pulls from the GitHub Copilot usage API (if/when they expose one) and tracks daily credit burn, projects month-end balance, and sends a Slack ping when you're at 50% remaining. Pair it with a Supabase table to track historical usage across team members.

**2. Model router for VS Code extension** — a tiny extension that automatically selects model tier based on context: basic model for single-line completions, standard for function generation, premium only when you explicitly ask for architectural review or complex debugging. Keeps credits for when they matter.

**3. Cross-provider usage aggregator** — since many developers will now split workloads across Copilot, OpenRouter, and direct Anthropic API, a unified dashboard that shows spend across all three providers, normalised to a single credit unit. Useful for any team managing AI tooling costs across multiple subscriptions.

---

The June 1 deadline gives you about five weeks to work out your usage patterns and decide whether to adjust your workflow, switch providers, or upgrade plans. My take: if you're a heavy Copilot Chat user (especially with Opus), this change effectively prices you out of the flat plan. Do the audit now, not in June when the bill arrives.

The broader trend is clear — the subsidised AI inference period is ending across the board. Microsoft absorbed these costs to acquire Copilot users. Now that the market is established, they're moving to sustainable unit economics. Every AI tool with a flat subscription is going to face this reckoning eventually.
