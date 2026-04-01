# Feature: Post Cover Images

**Priority:** 🟡 Medium
**Status:** 🔲 Not started
**Branch:** `feature/post-cover-images`
**Started:** —
**Shipped:** —

---

## Goal

Every blog post, digest, and githot entry should have a cover image that makes the reading experience more engaging. Images can come from two sources:

1. **Diagrams** — Mermaid diagrams, architecture diagrams, or other technical illustrations embedded in or generated from the post content. Best for posts about system design, data flows, or step-by-step processes.
2. **AI-generated images** — DALL-E 3 via OpenAI API, auto-generated at pipeline write time for daily digests and githot entries. Generates a relevant cover that matches the post topic and the site's Eastern/comic aesthetic.

Manual posts can opt-in with a `coverImage` frontmatter field pointing to a local file in `public/covers/`, or leave it empty to fall back to `coverEmoji` (existing behavior).

---

## Acceptance Criteria

- [ ] `Post` type has an optional `coverImage?: string` field (relative URL like `/covers/my-post.png`)
- [ ] `PostCard` component renders a thumbnail when `coverImage` is present; falls back to `coverEmoji` square when absent
- [ ] Individual post page (`app/blog/[slug]/page.tsx`) renders the cover image as a full-width hero above the post title
- [ ] Same hero treatment applied to digest and githot post pages
- [ ] Pipeline scripts (`scripts/run-digest.ts`, `scripts/run-githot.ts`) auto-generate a cover via DALL-E 3 and save it under `public/covers/[slug].png`
- [ ] `scripts/run-post.ts` generates a cover image via DALL-E 3 when no `coverImage` is provided in the draft
- [ ] Diagram support: posts with a ` ```mermaid ` code block in their MDX can have the diagram rendered to a PNG and used as the cover (via a script helper or at pipeline time)
- [ ] All generated images follow the site's Eastern/comic aesthetic: brush strokes, vermilion/gold palette, ink texture — passed as a system style suffix in the DALL-E prompt
- [ ] `next/image` used for all cover images (width/height optimised, lazy loaded)
- [ ] No cover image breaks existing `coverEmoji` fallback behaviour

---

## Image Sources — Decision Tree

```
Does the post have a coverImage in frontmatter?
  ├── YES → use it directly (public/covers/... or absolute URL)
  └── NO
       └── Is it a pipeline post (digest / githot)?
            ├── YES → DALL-E 3 auto-generate at write time, save to public/covers/
            └── NO (manual blog post)
                 └── Does the MDX have a mermaid code block?
                      ├── YES → render diagram to PNG (mermaid-cli) → use as cover
                      └── NO → fall back to coverEmoji square (current behaviour)
```

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `lib/posts.ts` | Modify | Add `coverImage?: string` to `Post` interface; parse from frontmatter in `readDir` / `getBySlug` |
| `components/PostCard.tsx` | Modify | Add thumbnail: `<Image>` when `coverImage`, else `coverEmoji` square (unchanged) |
| `app/blog/[slug]/page.tsx` | Modify | Add full-width hero image above post title |
| `app/digest/[slug]/page.tsx` | Modify | Same hero treatment |
| `app/githot/[slug]/page.tsx` | Modify | Same hero treatment |
| `scripts/run-digest.ts` | Modify | Call `generateCoverImage(slug, title, excerpt)` after content is written |
| `scripts/run-githot.ts` | Modify | Same |
| `scripts/run-post.ts` | Modify | Optional auto-generation if no manual `coverImage` in draft |
| `scripts/lib/generate-cover.ts` | Create | Shared helper: DALL-E 3 call → save to `public/covers/[slug].png` |
| `scripts/lib/mermaid-to-png.ts` | Create | Extracts mermaid block from MDX, renders via `@mermaid-js/mermaid-cli`, saves to `public/covers/` |
| `public/covers/` | Create dir | Git-ignored build artefacts; add to `.gitignore` with exception for manually curated images |
| `next.config.ts` | Check | Confirm `images.domains` allows any absolute URLs if used |

---

## Implementation Notes

### DALL-E 3 prompt structure

The system style suffix should be applied consistently across all auto-generated images:

```
"${topicDescription}. Art style: comic book panel with Eastern/Chinese ink brush aesthetic, vermilion and gold colour palette, bold ink outlines, rice paper texture, minimal halftone dots. No text."
```

`topicDescription` is derived from the post title and first 200 characters of the excerpt at pipeline time.

### Mermaid diagram rendering

Use `@mermaid-js/mermaid-cli` (`mmdc`) as a subprocess via `execFile` (not `exec`) to avoid shell injection:

```ts
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

// slug is validated against /^[a-zA-Z0-9._-]+$/ before use
await execFileAsync('mmdc', [
  '-i', `/tmp/${slug}.mmd`,
  '-o', `public/covers/${slug}.png`,
  '-t', 'dark',
]);
```

Puppeteer is required underneath `mmdc` — check if it's already a devDependency before adding.

### Storage

- Generated images are saved to `public/covers/` at pipeline/script run time on the build server (Vercel or local).
- Do NOT commit auto-generated images to git. Add `public/covers/` to `.gitignore`.
- Exception: manually designed cover images can be committed — use a naming convention like `public/covers/manual-*.png` and adjust `.gitignore` accordingly.

### `next/image` sizing

PostCard thumbnail: `width={320} height={180}` (16:9), `object-fit: cover`.
Post hero: `width={720} height={360}` (2:1), full-width, placed above the `<h1>`.

### Fallback

If DALL-E 3 call fails (quota, timeout), the pipeline must not crash. Catch the error, log a warning, and write the post without `coverImage` — the `coverEmoji` fallback handles display.

---

## Senior Dev Test Checklist

### Functional

- [ ] PostCard shows thumbnail for posts with `coverImage`, emoji square for those without
- [ ] Post page shows full-width hero when `coverImage` is present
- [ ] DALL-E generation succeeds end-to-end: run `ts-node scripts/run-digest.ts` locally and confirm `public/covers/*.png` is created and frontmatter contains `coverImage`
- [ ] Mermaid rendering: create a test post with a mermaid code block, run the script helper, confirm PNG is saved and used as cover
- [ ] Fallback: temporarily set `OPENAI_API_KEY=invalid`, run pipeline — confirm it logs a warning and still writes the post without crashing
- [ ] Mobile layout at 375px: thumbnail in PostCard displays correctly, no layout overflow
- [ ] Desktop at 1280px+: hero image is full-width within the 720px content column

### Build & Types

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `Post` interface change does not break any existing consumers (all usages of `Post` are non-breaking since `coverImage` is optional)
- [ ] `next/image` domains configured if using absolute URLs
- [ ] No `any` types added to `generate-cover.ts` or `mermaid-to-png.ts`

### Security

- [ ] DALL-E prompt is constructed from trusted pipeline data (post title/excerpt), not user input
- [ ] File paths for saved PNGs use `execFile` (not `exec`) and validated slugs — never pass unsanitised strings to subprocess calls
- [ ] Slug validation reuses `isSafeSlug()` from `lib/posts.ts` before any file write or subprocess call
- [ ] `public/covers/` is not world-writable in production (Vercel handles this)

### Performance

- [ ] `next/image` lazy loading confirmed (check Network tab — image not fetched until in viewport)
- [ ] Generated PNG size reasonable (< 1MB) — DALL-E 3 standard size `1024x1024` is fine; resize to 720x360 with `sharp` if needed

---

## Post-Ship Checklist

- [ ] Tested on live Vercel URL (not just localhost)
- [ ] Vercel Function / Build logs clean
- [ ] At least 3 posts have auto-generated cover images visible in production
- [ ] `public/covers/` added to `.gitignore`
- [ ] `context/current-feature.md` updated
- [ ] `context/feature-roadmap.md` item checked off
- [ ] This file updated with ship date

---

## Notes / History

- **2026-04-01** — Feature spec created. Two image modes confirmed by Henry: (1) diagrams (Mermaid / architecture), (2) AI-generated via OpenAI DALL-E 3. Emoji fallback must be preserved for posts that have neither.
