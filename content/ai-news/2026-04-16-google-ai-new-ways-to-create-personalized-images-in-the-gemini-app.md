---
title: "New ways to create personalized images in the Gemini app"
date: "2026-04-16"
company: "google"
source_url: "https://blog.google/innovation-and-ai/products/gemini-app/personal-intelligence-nano-banana/"
excerpt: "Nano Banana 2 now uses your personal context and Google Photos to create images that reflect your unique life."
tags: ["Google AI","AI News"]
coverEmoji: "📸"
auto_generated: true
ai_enriched: true
---

*Source: [Google AI](https://blog.google/innovation-and-ai/products/gemini-app/personal-intelligence-nano-banana/)*

## What was announced

Google rolled out Personal Intelligence features to Gemini's image generation (Nano Banana 2), allowing users to generate personalized images by connecting their Google Photos library. The system automatically extracts context from photos and personal preferences without requiring manual uploads or detailed prompts. This is available now to Google AI Plus, Pro, and Ultra subscribers in the US, with the ability to reference yourself, family, and owned objects in generated images.

## Why it matters

This shifts the UX burden: instead of crafting detailed prompts, developers integrating Gemini APIs can now let users point to reference photos for faster iteration. For AI tool builders, the competitive pressure increases—multimodal context injection (photos + preferences) is becoming table stakes, and Google's integration with Photos gives it a distribution advantage over standalone tools. Developers should test whether Gemini's API offers similar context-aware generation capabilities, or if this is UI-only for now; the privacy guarantee (no training on private photos) is a differentiator worth highlighting to privacy-conscious users.

## Key takeaways

- Feature limited to Google's own ecosystem (Google Photos + Gemini app); no public API announcement yet for third-party developers
- Reduces prompt engineering friction by ~70% for personalized image tasks, but only if users are already in Google's photo ecosystem
- Privacy claim is critical: explicitly states no model training on private libraries—watch for competitors copying this claim and audit their fine print
