---
title: "Build Your Own Claude Code Skills for Next.js and Supabase"
date: "2026-03-29"
excerpt: "slavingia/skills hit 5k+ GitHub stars this week by showing how reusable Claude Code skill files actually work. Here's how to write your own for a real Next.js/Supabase stack."
tags: ["Claude", "AI", "Next.js", "Supabase", "Developer Tools"]
coverEmoji: "🛠️"
auto_generated: true
source_url: "https://github.com/slavingia/skills"
---

Sahil Lavingia dropped a repo this week that's basically a worked example of something Claude Code quietly shipped: installable skill plugins. The `slavingia/skills` repo packages up business frameworks from his book as slash commands — but the real signal here isn't the business advice, it's the plugin format itself. You can write skills for your own stack, check them into git, and have Claude pull context-aware workflows out of a single command. Here's how to do that for a Next.js/Supabase project today.

## How Claude Code Skills Actually Work

A skill is a markdown file that Claude Code reads as a system-level prompt when you invoke the command. The repo structure is straightforward — each skill lives in a `.claude/skills/` directory with a name that maps to the slash command.

```
your-skills-repo/
  .claude/
    skills/
      new-route.md
      add-rls-policy.md
      seed-db.md
  plugin.json
```

The `plugin.json` registers the plugin and lists available skills:

```json
{
  "name": "my-nextjs-skills",
  "version": "1.0.0",
  "skills": [
    {
      "name": "new-route",
      "command": "/new-route",
      "description": "Scaffold a Next.js App Router route with Supabase auth guard",
      "file": ".claude/skills/new-route.md"
    },
    {
      "name": "add-rls-policy",
      "command": "/add-rls-policy",
      "description": "Generate and apply a Supabase RLS policy for a table",
      "file": ".claude/skills/add-rls-policy.md"
    }
  ]
}
```

Install it locally:

```bash
git clone https://github.com/you/my-nextjs-skills ~/.claude/plugins/my-nextjs-skills
```

Then in Claude Code:

```
/plugin marketplace add ~/.claude/plugins/my-nextjs-skills
/plugin install my-nextjs-skills
```

## Writing a Real Skill: Supabase RLS Policies

RLS policies are the thing I get wrong most often — wrong table name, wrong auth.uid() reference, forgetting to enable RLS before writing the policy. A skill file can encode all the guard rails.

Here's `.claude/skills/add-rls-policy.md`:

````markdown
# Add Supabase RLS Policy

You are helping the developer add a Row Level Security policy to their Supabase project.

## Steps

1. Ask which table needs the policy if not specified
2. Ask what operation: SELECT, INSERT, UPDATE, DELETE, or ALL
3. Ask the access pattern: own rows only, public read, authenticated only, or custom
4. Generate the migration SQL
5. Apply it using the Supabase CLI

## Rules
- Always enable RLS on the table first with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Use `auth.uid()` not `auth.user().id`
- Name policies descriptively: `{table}_{operation}_{access_pattern}`
- After generating SQL, run: `supabase db push` or write to `supabase/migrations/`

## Example output format

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY posts_select_own_rows
  ON posts
  FOR SELECT
  USING (user_id = auth.uid());
```

Always confirm the migration file path before writing.
````

Now `/add-rls-policy` drops Claude into a structured workflow — it knows your conventions, asks the right questions, and won't forget to enable RLS first.

## Writing a Real Skill: App Router Route Scaffold

Every project has opinions about how routes are structured. Mine use server components by default, a Supabase client helper, and a consistent auth guard pattern. Encoding that in a skill means I stop copy-pasting the same boilerplate.

`.claude/skills/new-route.md`:

````markdown
# Scaffold New App Router Route

Create a new Next.js App Router route following project conventions.

## Project conventions
- Routes live in `src/app/`
- Auth guard: import `requireUser` from `@/lib/auth` — redirect to `/login` if null
- Supabase client: use `createServerClient` from `@/lib/supabase/server`
- Default to Server Component unless interactivity is explicitly needed
- Co-locate loading.tsx and error.tsx

## Steps

1. Get the route path from the user (e.g. `/dashboard/reports`)
2. Ask if it needs auth protection (default: yes)
3. Ask if it needs a database query (get table name if yes)
4. Scaffold the files

## File template

```tsx
import { requireUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export default async function PageName() {
  const user = await requireUser() // redirects if unauthenticated
  const supabase = createServerClient()

  const { data } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id)

  return <div>{/* render data */}</div>
}
```

Always create loading.tsx alongside the page.
````

The power here is that the skill knows *your* import paths, *your* auth helper, *your* Supabase client wrapper. This is stuff Claude has to infer from context every time otherwise.

## What I'd Build With This

**1. A PR review skill** — `/review-pr` that knows your team's conventions: checks for missing error boundaries, validates that server actions use `zod` for input parsing, flags any `any` types. Basically your internal code review checklist as a Claude command.

**2. A database migration skill** — `/new-migration` that scaffolds a Supabase migration file with the right naming convention, reminds you to handle the down migration, and runs `supabase db diff` after you describe the change so you can see what it actually generated.

**3. A feature flag skill** — `/add-feature-flag` for teams using something like Vercel Flags or a custom `flags` table in Supabase. The skill knows the flag schema, generates the server-side check boilerplate, and adds the flag to your central registry file.

The `slavingia/skills` repo is worth cloning just to read the skill file format — but the real move is building a private skills repo for your own stack. These aren't AI magic, they're just well-structured prompts with your conventions baked in. The slash command interface makes them actually usable day-to-day instead of living in a Notion doc nobody reads.
