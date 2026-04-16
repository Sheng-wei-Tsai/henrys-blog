---
title: "Gemini 3.1 Flash TTS: the next generation of expressive AI speech"
date: "2026-04-15"
company: "google"
source_url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-tts/"
excerpt: "Gemini 3.1 Flash TTS is now available across Google products."
tags: ["Google AI","AI News"]
coverEmoji: "🎙️"
auto_generated: true
ai_enriched: true
---

*Source: [Google AI](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-tts/)*

## What was announced

Google released Gemini 3.1 Flash TTS, a text-to-speech model with granular audio control via XML-style tags. Developers can now manipulate vocal style, pacing, and delivery in 70+ languages using natural language commands within text. The model is available in Google AI Studio, Vertex AI, and Google Vids, with all generated audio automatically watermarked using SynthID to identify synthetic content.

## Why it matters

This gives developers fine-grained control over TTS output without separate voice cloning or post-processing—previously unavailable at this level of granularity in production APIs. The tag-based approach integrates directly into prompts, making it easier to generate consistent, expressive speech at scale compared to alternatives like ElevenLabs or Azure Speech. Developers building conversational AI, video generation, or accessibility tools should test the tag syntax now in AI Studio to understand expressiveness limits before integrating into production pipelines.

## Key takeaways

- Audio tags allow inline control of vocal style/pacing—concrete: `<audio style='happy' pace='1.2'>` syntax (exact format TBD, verify in Studio)
- SynthID watermarking is automatic and non-removable—critical for compliance in regulated industries and misinformation prevention
- 70+ language support with consistent tag behavior across languages reduces localization complexity for global products
