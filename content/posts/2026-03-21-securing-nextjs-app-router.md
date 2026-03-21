---
title: "What I Fixed When I Audited My Next.js App for Security"
date: "2026-03-21"
excerpt: "Path traversal, open redirects, unauthenticated AI endpoints, and a CI pipeline that never worked — here's everything I found and how I fixed it."
tags: ["Next.js", "Security", "TypeScript", "Vercel"]
coverEmoji: "🔐"
---

I did a full security and architecture review of this site today. It's a Next.js 16 app with Supabase auth, OpenAI/Claude API routes, a filesystem-based blog, and a GitHub Actions CI pipeline. Here's what I found.

## Path traversal in the filesystem CMS

The blog uses a flat filesystem approach — posts live in `content/posts/` as Markdown files, and slugs from the URL are used to read the right file:

```typescript
// What I had — dangerous
export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(postsDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, 'utf8');
  // ...
}
```

The problem: `slug` comes directly from the URL. A request to `/blog/../../.env.local` would try to read `content/posts/../../.env.local.mdx`. The `.mdx` extension appended at the end prevents reading most files, but `path.join` still resolves the `..` sequences and escapes the content directory.

The fix is two layers of validation — a regex to reject the slug early, and a path containment check to be certain:

```typescript
function isSafeSlug(slug: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(slug) && !slug.includes('..');
}

function isInsideDir(dir: string, filePath: string): boolean {
  const relative = path.relative(dir, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function getPostBySlug(slug: string): Post | null {
  if (!isSafeSlug(slug)) return null;
  const target = path.join(postsDir, `${slug}.md`);
  if (!isInsideDir(postsDir, target)) return null;
  // safe to read
}
```

I also deduplicated the code — there were three nearly identical functions for reading posts, digests, and githot entries. Collapsed into one `readDir(dir, defaultEmoji)` that all three use.

## Open redirect in the OAuth callback

The `/auth/callback` route handles Supabase's OAuth code exchange and redirects the user afterward:

```typescript
// What I had
const next = searchParams.get('next') ?? '/dashboard';
return NextResponse.redirect(`${origin}${next}`);
```

If `next` is `//evil.com`, the resulting URL `https://mysite.com//evil.com` can behave as an open redirect in some browsers. The fix is simple:

```typescript
const rawNext = searchParams.get('next') ?? '/dashboard';
const next = rawNext.startsWith('/') && !rawNext.startsWith('//')
  ? rawNext
  : '/dashboard';
```

## Unauthenticated AI endpoints

The cover letter generator and resume matcher both call OpenAI and cost real money per request. Neither had any auth check — anyone on the internet could call them:

```typescript
// Before: public endpoint calling paid API
export async function POST(req: NextRequest) {
  const body = await req.json();
  const stream = await client.chat.completions.create({ ... });
  // ...
}
```

Fixed by verifying the Supabase session server-side before touching the AI client:

```typescript
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // now safe to call OpenAI
}
```

Also: `req.json()` was being called without a try/catch in both routes. A malformed request body throws an unhandled exception and returns a 500. Wrapped in try/catch to return a proper 400.

## GitHub Pages is the wrong host for a Next.js app with API routes

The CI pipeline had been failing on every single push. The workflow was deploying to GitHub Pages, but the app has:

- API routes (`/api/jobs`, `/api/cover-letter`, `/api/resume-match`)
- A server-side auth callback (`/auth/callback`)
- Streaming responses

GitHub Pages only serves static files. Next.js with `output: 'export'` errors out on any route handler that isn't fully static. Even removing `force-dynamic` doesn't help — Next.js 16 refuses to export dynamic routes.

The fix was switching to Vercel, which is what the app actually needs. The new workflow:

```yaml
- name: Deploy to Vercel
  run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --yes
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

First successful deployment in the project's history.

## Module-level API client initialisation crashes the build

Both OpenAI and Supabase clients were initialised at module level:

```typescript
// Crashes at build time if env var is missing
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const supabase = createBrowserClient(url, key);
```

During a Next.js build, all modules are evaluated to collect page data. If the env vars aren't set in the build environment (which they weren't in CI), the SDK constructors throw and the build fails.

For the OpenAI client: moved instantiation inside the route handler so it only runs at request time, never at build time.

For Supabase: used a placeholder fallback value so `createBrowserClient` doesn't throw during prerendering. The real values are baked in at deploy time when the actual env vars are present.

---

None of these are exotic vulnerabilities. Path traversal, open redirects, unauthenticated paid endpoints, and broken CI are all common in apps that grew organically without a dedicated review. Worth doing periodically, especially before putting a production URL on your portfolio.
