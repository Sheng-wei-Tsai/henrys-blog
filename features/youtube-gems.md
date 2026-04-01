# Feature: YouTube Gems

**Priority:** 🟡 Medium
**Status:** 🔲 Not started
**Branch:** `feature/youtube-gems`
**Started:** —
**Shipped:** —

---

## Goal

A dedicated section called **YouTube Gems** that surfaces the latest videos from IBM Technology (and optionally other curated channels), auto-generates a ~10-minute deep-dive learning guide from each video transcript using `o4-mini`, and turns the content into interactive flashcard quizzes.

The goal is not a quick summary — it's a **structured self-study guide** that teaches the topic as well as the video does, but in a readable format. Readers who don't have time to watch can read the guide and genuinely learn. A built-in **term lookup** lets readers right-click (or tap-and-hold on mobile) any technical word to get an instant plain-English explanation without leaving the page.

The pipeline runs on a schedule (daily or on-demand), fetches new uploads, generates the learning content, and publishes it as MDX — the same way `run-digest.ts` and `run-githot.ts` work today.

---

## Acceptance Criteria

### Curated feed (pipeline)
- [ ] `/youtube-gems` listing page: thumbnail, title, channel badge, date, estimated read time
- [ ] "Learn any video" input box at the top of the listing page — paste any YouTube URL to generate a guide on-demand
- [ ] Individual gem page (`/youtube-gems/[slug]`) with:
  - [ ] Embedded YouTube player (iframe, lazy-loaded)
  - [ ] **Learning guide** — ~2,000 words (~10 min read), written as a structured article (see Content Structure below)
  - [ ] **Key takeaways** section (5–8 bullet points)
  - [ ] **Term lookup** — select/right-click any word in the guide body → popover with plain-English definition
  - [ ] **Flashcard quiz** — at least 8 Q&A cards, swipeable/click to reveal, shuffle support
  - [ ] Channel badge and video metadata (duration, published date, view count)
- [ ] `scripts/run-youtube-gems.ts` pipeline that:
  - [ ] Fetches latest N videos from IBM Technology channel via YouTube Data API v3
  - [ ] Skips already-processed videos (slug dedup against `content/youtube-gems/`)
  - [ ] Fetches transcript via `youtube-transcript` package (auto-caption fallback)
  - [ ] Sends transcript + title to `o4-mini` for deep-dive guide generation
  - [ ] Writes MDX to `content/youtube-gems/[slug].mdx` with structured frontmatter
  - [ ] Saves YouTube thumbnail to `public/covers/yt-[slug].jpg`
- [ ] GitHub Actions cron triggers the pipeline daily

### User-submitted videos (on-demand)
- [ ] URL input on `/youtube-gems` accepts any YouTube URL format (`youtu.be/`, `youtube.com/watch?v=`, `/shorts/`)
- [ ] Submitting redirects to `/youtube-gems/watch/[videoId]` — a live generation page
- [ ] `/youtube-gems/watch/[videoId]` streams the guide in real-time as it is generated (no waiting for the full response)
- [ ] Page shows the YouTube embed immediately while the guide streams in below it
- [ ] Takeaways and flashcards appear after the guide completes
- [ ] `/api/youtube-gems/generate` route: accepts `{ videoId }`, validates it, fetches transcript, streams guide + emits takeaways/flashcards as a final JSON chunk
- [ ] User-generated pages are **not** saved to MDX or the filesystem — ephemeral, session only
- [ ] Term lookup works on user-generated guide pages (same `TermLookup` component)
- [ ] All pages follow the site's Eastern/comic design system

---

## Learning Guide Content Structure

The AI-generated guide is **not** a summary. It is a full structured article that teaches the topic. Target: ~2,000 words (~10 minute read). The pipeline instructs `o4-mini` to produce the following sections in order:

```
## What is [Topic]?
Brief orientation — what problem does it solve and why should a developer care?

## How it works
Core concepts explained with analogies. Walk through the main components and
their relationships. Use numbered steps where the video explains a sequence.

## Key concepts in depth
One subsection (###) per major concept from the video.
Each subsection: definition, how it fits in the bigger picture, a concrete example.

## Real-world use cases
2–3 concrete examples of where this technology is used in production systems.

## Common misconceptions
What beginners usually get wrong. Address the most likely confusion points.

## How to get started
Practical next steps: tools to install, a minimal example, what to learn next.
```

This structure is baked into the `o4-mini` system prompt at pipeline time and written to the MDX body verbatim. No runtime AI call on the page.

---

## Content Structure (MDX Frontmatter)

```yaml
---
title: "Understanding Kubernetes: What You Need to Know"
date: "2026-04-01"
channel: "IBM Technology"
channelId: "UCKWaEZ-_VweaEx1j62do_vQ"
videoId: "aSrqRSk43lY"
videoUrl: "https://www.youtube.com/watch?v=aSrqRSk43lY"
thumbnail: "/covers/yt-understanding-kubernetes.jpg"
duration: "PT8M42S"
publishedAt: "2026-03-30T14:00:00Z"
readingTime: "10 min read"
excerpt: "A structured learning guide on what Kubernetes does, how it works, and how to get started."
tags: ["kubernetes", "devops", "containers", "cloud"]
takeaways:
  - "Kubernetes orchestrates containers — it decides where and how they run"
  - "A Pod is the smallest deployable unit, not a container"
  - "Services decouple networking from Pod lifecycle"
  - "ConfigMaps and Secrets separate config from code"
  - "Horizontal Pod Autoscaler handles traffic spikes automatically"
flashcards:
  - q: "What is the smallest deployable unit in Kubernetes?"
    a: "A Pod — which can contain one or more containers that share network and storage."
  - q: "What problem does a Kubernetes Service solve?"
    a: "It provides a stable network endpoint for a set of Pods, so callers don't need to track individual Pod IPs."
  - q: "What is the difference between a ConfigMap and a Secret?"
    a: "Both externalise config from the container image. Secrets are base64-encoded and intended for sensitive values."
  - q: "What does the Horizontal Pod Autoscaler do?"
    a: "It automatically scales the number of Pod replicas based on CPU/memory or custom metrics."
  - q: "Why use Kubernetes instead of running containers directly with Docker?"
    a: "Kubernetes adds scheduling, self-healing, rolling updates, service discovery, and scaling."
  - q: "What is a Deployment in Kubernetes?"
    a: "A Deployment is a controller that manages a desired number of identical Pods and handles rollouts and rollbacks."
  - q: "What is the role of etcd in a Kubernetes cluster?"
    a: "etcd is the distributed key-value store that holds all cluster state — the source of truth for the control plane."
  - q: "What happens when a Kubernetes node fails?"
    a: "The scheduler detects the failure and reschedules the affected Pods onto healthy nodes automatically."
---
```

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/youtube-gems/page.tsx` | Create | Listing page + URL input box at top |
| `app/youtube-gems/[slug]/page.tsx` | Create | Curated gem page: player, guide, takeaways, term lookup, flashcards |
| `app/youtube-gems/watch/[videoId]/page.tsx` | Create | On-demand page: streams guide live, no MDX saved |
| `app/api/youtube-gems/generate/route.ts` | Create | POST `{ videoId }` → validates, fetches transcript, streams guide via `o4-mini`, emits structured JSON chunk at end |
| `app/api/youtube-gems/lookup/route.ts` | Create | POST `{ term, context }` → streams plain-English definition via `o4-mini` |
| `components/YoutubeUrlInput.tsx` | Create | Client component: URL input, parse + validate videoId, redirect to `/watch/[videoId]` |
| `components/StreamingGuide.tsx` | Create | Client component: fetches from `/api/generate`, renders guide as it streams, shows flashcards/takeaways when done |
| `components/FlashcardDeck.tsx` | Create | Client component: flip cards, shuffle, progress counter |
| `components/TermLookup.tsx` | Create | Client component: wraps guide body, listens for text selection / right-click |
| `lib/posts.ts` | Modify | Add `YoutubeGem` type + `getAllYoutubeGems()` / `getYoutubeGemBySlug()` |
| `lib/youtube-url.ts` | Create | Pure function: parse any YouTube URL format → `videoId \| null` |
| `scripts/run-youtube-gems.ts` | Create | Daily pipeline: fetch → transcribe → o4-mini → write MDX |
| `scripts/lib/youtube.ts` | Create | YouTube Data API v3 helpers: latest videos, transcript fetch |
| `content/youtube-gems/` | Create dir | MDX posts for curated feed only |
| `public/covers/yt-*.jpg` | Auto-generated | Pipeline thumbnails |
| `components/Header.tsx` | Modify | Add "YouTube Gems" nav entry |
| `.github/workflows/youtube-gems.yml` | Create | Daily cron trigger for the pipeline |

---

## Implementation Notes

### YouTube Data API v3

```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &channelId=UCKWaEZ-_VweaEx1j62do_vQ
  &order=date
  &maxResults=5
  &type=video
  &key=${YOUTUBE_API_KEY}
```

Then `videos.list` with `part=contentDetails,statistics` for duration and view count.

**Quota:** `search.list` = 100 units, `videos.list` = 1 unit/video. 5 videos/day ≈ 105 units — well within the 10,000 unit/day free tier.

### Transcript fetching

```ts
import { YoutubeTranscript } from 'youtube-transcript';
const segments = await YoutubeTranscript.fetchTranscript(videoId);
const fullText = segments.map(s => s.text).join(' ');
```

Fallback: if captions are disabled, use title + video description only. Note "Transcript unavailable — guide based on video description" at the top of the article.

### o4-mini pipeline prompt (deep-dive guide)

```ts
const response = await openai.chat.completions.create({
  model: 'o4-mini',
  reasoning_effort: 'high', // high = best quality learning guide
  messages: [
    {
      role: 'system',
      content: `You are a senior technical writer creating a self-study learning guide for developers.
Given a YouTube video transcript, write a structured article of approximately 2,000 words (~10 minute read).

The article must follow this exact structure:
## What is [Topic]?
## How it works
## Key concepts in depth
  (one ### subsection per major concept, with definition + analogy + example)
## Real-world use cases
## Common misconceptions
## How to get started

Rules:
- Teach the topic, don't just summarise the video
- Use analogies to explain abstract concepts
- Include concrete examples (code snippets where relevant, in fenced code blocks)
- Write for a junior developer who knows basic programming but not this specific technology
- Do NOT mention the video, the presenter, or IBM
- Output ONLY valid JSON: { guide: string (markdown), takeaways: string[], flashcards: {q:string,a:string}[] }
- guide must be ~2000 words of markdown
- takeaways: 5–8 bullet strings
- flashcards: 8–10 objects`,
    },
    {
      role: 'user',
      content: `Title: "${title}"\nTranscript:\n${transcript}`,
    },
  ],
});

const result = JSON.parse(response.choices[0].message.content ?? '{}');
// result.guide → written as MDX body
// result.takeaways + result.flashcards → written to frontmatter
```

Use `reasoning_effort: 'high'` for guide generation — the thinking step meaningfully improves the article structure and analogy quality. Cost is still low vs Claude Sonnet given `o4-mini` pricing.

### Term lookup API route

`POST /api/youtube-gems/lookup` accepts `{ term: string, context: string }` and streams a definition.

```ts
// app/api/youtube-gems/lookup/route.ts
const stream = await openai.chat.completions.create({
  model: 'o4-mini',
  reasoning_effort: 'low', // low = fast + cheap for short definitions
  stream: true,
  messages: [
    {
      role: 'system',
      content: 'You explain technical terms in 2–3 plain-English sentences for junior developers. No jargon. Be specific and concrete.',
    },
    {
      role: 'user',
      content: `Term: "${term}"\nContext it appeared in: "${context}"\n\nExplain this term.`,
    },
  ],
});
// Return as ReadableStream (same pattern as /api/cover-letter/route.ts)
```

`context` is the surrounding sentence (~100 chars) so the definition is relevant to how the term is used, not just a generic definition.

### TermLookup component

`components/TermLookup.tsx` is a `'use client'` wrapper around the guide body:

- Listens for `mouseup` (desktop) and `touchend` (mobile) on the content container
- On text selection: reads `window.getSelection().toString().trim()` — if 1–4 words, shows the lookup popover
- On right-click (`contextmenu`): adds "Look up: [selected word]" as the first item via a custom context menu overlay (not the native browser menu — native is blocked with `e.preventDefault()`)
- Popover shows term + streaming definition, positioned near the selection anchor
- Dismisses on click-outside or Escape
- Popover styled as a comic panel: `border: var(--panel-border)`, `box-shadow: var(--panel-shadow)`, ink/cream colours
- Does NOT wrap every word in a `<span>` — selection is read at interaction time, not pre-processed

### FlashcardDeck component

- One card visible at a time, click/tap to flip (CSS 3D `rotateY`)
- Fixed card height (no layout shift on flip)
- "Next" / "Prev" navigation
- Progress: "Card 3 of 8"
- "Shuffle" randomises order and resets all flip states
- All state in `useState` — no auth, no DB

### Dedup logic

Slug = `yt-${videoId}`. Check `content/youtube-gems/yt-${videoId}.mdx` exists before processing. Skip if found.

### videoId validation

Validate against `/^[a-zA-Z0-9_-]{11}$/` before any URL construction or file path use.

### Curated channels

```ts
export const CHANNELS = [
  { id: 'UCKWaEZ-_VweaEx1j62do_vQ', name: 'IBM Technology' },
  // future: Fireship, ByteByteGo, Theo, etc.
];
```

---

### On-demand video generation

#### URL parsing (`lib/youtube-url.ts`)

Handles all common YouTube URL formats:

```ts
export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = input.match(re);
    if (match) return match[1];
  }
  return null;
}
```

This lives in `lib/` (not `scripts/`) so both the client component and the API route can import it.

#### YoutubeUrlInput component

`components/YoutubeUrlInput.tsx` — `'use client'`:

- Text input with placeholder "Paste any YouTube URL..."
- On submit: calls `extractVideoId(input)`, shows inline error "Couldn't find a video ID in that URL" if null
- On valid ID: `router.push(`/youtube-gems/watch/${videoId}`)` — no API call at this step
- Styled as a comic panel input: `border: var(--panel-border)`, button uses `.hero-btn-primary`

#### `/youtube-gems/watch/[videoId]/page.tsx`

Server component that validates the `videoId` param against `/^[a-zA-Z0-9_-]{11}$/` and returns 404 if invalid. Renders:

1. YouTube embed immediately (no waiting)
2. `<StreamingGuide videoId={videoId} />` — client component that drives generation

#### StreamingGuide component

`components/StreamingGuide.tsx` — `'use client'`:

```
mount → POST /api/youtube-gems/generate { videoId }
      → read response as a stream
      → append text chunks to guideMarkdown state as they arrive (renders live)
      → detect final sentinel chunk: { type: 'meta', takeaways: [...], flashcards: [...] }
      → set takeaways + flashcards state → render FlashcardDeck
```

Shows a skeleton/loading state ("Fetching transcript and generating your guide...") before the first chunk arrives. Once streaming begins the text appears incrementally.

#### `/api/youtube-gems/generate` route

```ts
// POST { videoId: string }
// 1. Validate videoId format
// 2. Fetch transcript via youtube-transcript
// 3. Fetch video title via YouTube oEmbed (no API key needed):
//    GET https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json
// 4. Stream o4-mini response (same prompt as pipeline, reasoning_effort: 'high')
// 5. After stream closes, emit one final newline-delimited JSON chunk:
//    \n{"type":"meta","takeaways":[...],"flashcards":[...]}
```

The `meta` chunk is appended at the end of the same stream so the client only needs one connection. The client detects it by checking if a line parses as JSON with `type === 'meta'`.

Rate limiting: cap at 10 requests/minute per IP using a simple in-memory map (or Vercel's edge rate limiting). Return 429 if exceeded. This prevents abuse of the OpenAI key.

**No MDX is written** — user-generated guides are ephemeral. If a user wants to bookmark a guide they visit `/youtube-gems/watch/[videoId]` and the guide regenerates on each load. Consider adding a "Save to read later" bookmarking feature in a future iteration.

---

## Environment Variables

```bash
YOUTUBE_API_KEY    # YouTube Data API v3 key — Google Cloud Console
OPENAI_API_KEY     # Already present — used for o4-mini pipeline + lookup API
```

---

## Senior Dev Test Checklist

### Functional — curated feed (pipeline)

- [ ] Run pipeline locally — at least one `content/youtube-gems/yt-*.mdx` created with `guide` body ~2,000 words
- [ ] `/youtube-gems` listing renders: thumbnail, title, channel badge, read time, URL input box at top
- [ ] Individual curated page: YouTube embed loads, guide renders with correct heading structure
- [ ] Dedup: run pipeline twice — second run writes zero new files
- [ ] Transcript unavailable: pipeline completes with fallback, "Transcript unavailable" note shown

### Functional — on-demand URL input

- [ ] Paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → redirects to `/youtube-gems/watch/dQw4w9WgXcQ`
- [ ] Paste `https://youtu.be/dQw4w9WgXcQ` → same redirect
- [ ] Paste `https://youtube.com/shorts/dQw4w9WgXcQ` → same redirect
- [ ] Paste a non-YouTube URL → inline error message, no redirect
- [ ] Paste a malformed URL → inline error, no crash
- [ ] `/youtube-gems/watch/[videoId]`: YouTube embed appears immediately, guide begins streaming within 3s
- [ ] Guide text appears incrementally as it streams — not blank until complete
- [ ] After stream ends: takeaways list and flashcard deck appear
- [ ] Invalid `videoId` in URL (e.g. `/watch/../../etc`) → 404 page
- [ ] Rate limit: submitting 11 requests in under a minute returns a 429 with a user-friendly message

### Functional — shared interactions

- [ ] Term lookup (desktop): select a word → popover appears, streamed definition renders, dismisses on click-outside
- [ ] Term lookup (mobile): tap-and-hold → popover appears, tap outside dismisses
- [ ] Right-click a word → custom context menu with "Look up: [word]" as first item
- [ ] Lookup API: POST with empty/whitespace term returns 400, not 500
- [ ] Flashcard deck: flip, Next, Prev, Shuffle all work; progress counter correct
- [ ] Mobile at 375px: embed responsive, popover fits screen, flashcards tap-to-flip, no horizontal overflow
- [ ] Desktop at 1280px+: guide stays within 720px column, popover doesn't overflow viewport

### Build & Types

- [ ] `npm run build` zero TypeScript errors
- [ ] `YoutubeGem` type exported, no `any`
- [ ] `getAllYoutubeGems()` returns `[]` when directory is empty or missing

### Security

- [ ] `YOUTUBE_API_KEY` server-side only — not in `NEXT_PUBLIC_*`
- [ ] `videoId` validated against `/^[a-zA-Z0-9_-]{11}$/` in both the route handler AND the `watch/[videoId]` page
- [ ] `term` and `context` in lookup route trimmed and length-capped (max 200 chars each) before sending to OpenAI
- [ ] All AI output rendered as React text / MDX — no raw HTML injection
- [ ] iframe `src` uses validated `videoId` only
- [ ] `/api/youtube-gems/generate` rate-limited to 10 req/min per IP — returns 429 with message, not 500
- [ ] User-submitted `videoId` never used in any file system write (on-demand guides are ephemeral)

### Performance

- [ ] YouTube embed uses `loading="lazy"`
- [ ] Thumbnail via `next/image` with explicit dimensions
- [ ] Flashcard fixed height — no layout shift on flip
- [ ] Lookup popover streams incrementally (not blank until complete)

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL
- [ ] GitHub Actions cron confirmed running
- [ ] At least 3 gem posts live in production with full guides
- [ ] `YOUTUBE_API_KEY` added to Vercel environment variables
- [ ] Nav entry "YouTube Gems" visible in Header
- [ ] `context/current-feature.md` updated
- [ ] `context/feature-roadmap.md` item checked off
- [ ] This file updated with ship date

---

## Notes / History

- **2026-04-01** — Feature spec created. IBM Technology seed channel. Uses `o4-mini` (`reasoning_effort: high`) for pipeline guide generation, `o4-mini` (`reasoning_effort: low`) for real-time term lookup. Guide target is ~2,000 words / 10 min read — structured article, not a summary. Term lookup triggers on text selection and right-click. Flashcard v1 client-side only. On-demand URL input added: user pastes any YouTube link → `/watch/[videoId]` → guide streams live via `/api/youtube-gems/generate`. Ephemeral — no MDX written for user-submitted videos.
