# Feature: Site & UX Improvements

**Priority:** 🔴 High (sitemap/robots) · 🟡 Medium (OG images, mobile jobs) · 🟢 Nice to have (reading bar, RSS)
**Status:** 🔲 Not started
**Branch:** `feature/site-ux` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Fix critical SEO gaps (missing sitemap and robots.txt), improve social sharing with Open Graph images, fix the mobile jobs layout, and optionally add a reading progress bar and RSS feed.

---

## Acceptance Criteria

### SEO — Sitemap + Robots (High — do first, it's simple)
- [ ] `app/sitemap.ts` generates a valid XML sitemap for all pages + blog/digest/githot posts
- [ ] `app/robots.ts` returns a correct `robots.txt` (allow all, point to sitemap)
- [ ] `/sitemap.xml` and `/robots.txt` return 200 in production

### Open Graph Images (Medium)
- [ ] `app/opengraph-image.tsx` generates a default OG image for the site
- [ ] Blog posts generate per-post OG images with title + description
- [ ] LinkedIn/Twitter preview card shows image when sharing a link

### Mobile Jobs Layout (Medium)
- [ ] `/jobs` shows card layout (stacked) on screens ≤ 768px
- [ ] Wide table layout only on desktop
- [ ] Cards show: title, company, location, freshness badge, save button

### Reading Progress Bar (Nice to have)
- [ ] `components/ReadingProgress.tsx` created — thin bar at top of page
- [ ] Progress updates as user scrolls through a blog post
- [ ] Does not affect layout or cause reflow

### RSS Feed (Nice to have)
- [ ] `app/feed.xml/route.ts` returns a valid RSS 2.0 feed
- [ ] Feed includes all blog posts + digests + githot (or just blog — decide at build time)
- [ ] `<link rel="alternate">` tag in `<head>` points to feed URL

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `app/sitemap.ts` | Create | Next.js built-in sitemap support |
| `app/robots.ts` | Create | Next.js built-in robots.txt support |
| `app/opengraph-image.tsx` | Create | Default OG image |
| `app/blog/[slug]/opengraph-image.tsx` | Create | Per-post OG image |
| `app/jobs/page.tsx` | Modify | Mobile card layout |
| `components/ReadingProgress.tsx` | Create | Reading progress bar |
| `app/feed.xml/route.ts` | Create | RSS feed |

---

## Implementation Notes

- Next.js 16 has built-in sitemap + robots support via `app/sitemap.ts` and `app/robots.ts` — no library needed
- OG images: Next.js `ImageResponse` from `next/og` — no extra package
- For sitemap: iterate `content/posts/`, `content/digests/`, `content/githot/` directories
- RSS: use standard `<rss>` XML template — no library needed, or check if one is already installed
- Reading progress: `window.scrollY` / `document.documentElement.scrollHeight` — pure JS

---

## Senior Dev Test Checklist

### Functional

- [ ] `/sitemap.xml` returns 200 and valid XML (validate at validator.w3.org/feed/)
- [ ] `/robots.txt` returns 200 and contains `Sitemap:` directive
- [ ] OG image appears when pasting a URL into the LinkedIn post inspector (`linkedin.com/post-inspector`)
- [ ] Jobs page on mobile (375px) shows card layout — no horizontal scroll
- [ ] Jobs page on desktop (1280px) shows table layout
- [ ] Reading progress bar tracks scroll position accurately
- [ ] RSS feed returns valid XML (validate at validator.w3.org/feed/)

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] `app/sitemap.ts` export satisfies Next.js `MetadataRoute.Sitemap` type
- [ ] `app/robots.ts` export satisfies Next.js `MetadataRoute.Robots` type
- [ ] OG image file renders without runtime errors

### Performance

- [ ] Sitemap generation does not block page loads (it's a static route)
- [ ] OG image generation cached after first request
- [ ] Reading progress bar does not cause layout thrashing (use `requestAnimationFrame`)

---

## Post-Ship Checklist

- [ ] `/sitemap.xml` accessible on live Vercel URL
- [ ] Submit sitemap to Google Search Console
- [ ] OG image verified via LinkedIn post inspector
- [ ] Mobile jobs layout tested on a real device (not just DevTools)
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
