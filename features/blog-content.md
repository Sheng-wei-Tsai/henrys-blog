# Feature: Blog & Content Improvements

**Priority:** 🟡 Medium (search, AI badge) · 🟢 Nice to have (series, reading time)
**Status:** 🔲 Not started
**Branch:** `feature/blog-content` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Improve content discoverability with cross-content search, signal AI-generated posts visually, and add optional enhancements like post series grouping and reading time.

---

## Acceptance Criteria

### Cross-Content Full-Text Search (Medium)
- [ ] Search on `/blog` also returns results from `content/digests/` and `content/githot/`
- [ ] Results are labelled by source: "Blog", "Digest", "GitHub Hot"
- [ ] Search is client-side (no new API route needed — all MDX frontmatter available)
- [ ] Existing tag filtering still works alongside search

### AI-Generated Badge (Medium)
- [ ] `PostCard.tsx` shows an "AI-generated" badge when `ai_generated: true` in frontmatter
- [ ] Digest and githot posts have `ai_generated: true` in their frontmatter (auto-added by scripts)
- [ ] Badge is subtle — does not dominate the card layout

### Post Series Support (Nice to have)
- [ ] Posts can declare `series: "Series Name"` and `series_order: 1` in frontmatter
- [ ] On a post page, a "This is part N of [Series Name]" nav block appears
- [ ] Series navigation shows previous/next post in the series

### Reading Time on PostCard (Nice to have)
- [ ] `PostCard.tsx` shows estimated reading time (e.g. "4 min read")
- [ ] Uses `reading-time` package (already installed)
- [ ] Shown alongside date/tags — no layout disruption

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `components/BlogList.tsx` | Modify | Extend search to digests + githot |
| `components/PostCard.tsx` | Modify | AI badge + reading time |
| `app/blog/page.tsx` | Modify | Pass digests/githot to BlogList if needed |
| `scripts/run-digest.ts` | Modify | Ensure `ai_generated: true` in frontmatter |
| `scripts/run-githot.ts` | Modify | Ensure `ai_generated: true` in frontmatter |

---

## Implementation Notes

- `reading-time` is already installed — import `readingTime` from `reading-time`
- Cross-content search: load all three content directories' frontmatter at build/request time, pass to `BlogList.tsx`
- AI badge: a simple `<span>` with CSS var styling — no new component needed
- Series support: add `series` and `series_order` to the MDX frontmatter type definition

---

## Senior Dev Test Checklist

### Functional

- [ ] Searching "AI" on `/blog` returns results from all three content types
- [ ] Each result shows its source label clearly
- [ ] Tag filter still narrows results correctly when search is active
- [ ] AI badge visible on a digest post card
- [ ] AI badge not visible on a hand-written blog post
- [ ] Reading time shown correctly (compare with manual estimate)
- [ ] Series navigation shows correct prev/next links (if implemented)

### Build & Types

- [ ] `npm run build` passes with zero errors
- [ ] MDX frontmatter type extended to include `ai_generated?`, `series?`, `series_order?`
- [ ] No `any` types added

### Performance

- [ ] Cross-content search does not fetch MDX file contents — frontmatter only
- [ ] Search results render without noticeable delay (< 100ms for filter)
- [ ] `PostCard.tsx` reading time calculation does not re-run on every render

---

## Post-Ship Checklist

- [ ] Cross-content search tested on live URL
- [ ] AI badge visible on digest/githot cards in production
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
