-- 018_fix_missing_schema.sql
-- Applies schema that was skipped due to earlier migration failures:
--   • skill_progress (003 stopped at invalid "create policy if not exists" syntax)
--   • page_views / ai_suggestions (010 stopped at non-IMMUTABLE cast in unique index)
--   • checked_topics column on skill_progress (009 depends on skill_progress existing)

-- ── skill_progress (from 003) ─────────────────────────────────────────────────

create table if not exists public.skill_progress (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  path_id          text not null,
  skill_id         text not null,
  status           text not null default 'not_started',
  started_at       timestamptz,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz,
  review_count     int default 0,
  notes            text,
  updated_at       timestamptz default now(),
  -- checked_topics from 009
  checked_topics   text[] not null default '{}',
  unique(user_id, path_id, skill_id)
);

alter table public.skill_progress enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='skill_progress' and policyname='Users can view own skill progress') then
    create policy "Users can view own skill progress"
      on public.skill_progress for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='skill_progress' and policyname='Users can insert own skill progress') then
    create policy "Users can insert own skill progress"
      on public.skill_progress for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='skill_progress' and policyname='Users can update own skill progress') then
    create policy "Users can update own skill progress"
      on public.skill_progress for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='skill_progress' and policyname='Users can delete own skill progress') then
    create policy "Users can delete own skill progress"
      on public.skill_progress for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Also fix profiles insert policy (from 003) — use DO block to guard against duplicates
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile"
      on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- ── page_views (from 010, fixed) ──────────────────────────────────────────────
-- Fix: (created_at::date) is not IMMUTABLE on timestamptz; use a separate date column instead

create table if not exists public.page_views (
  id          bigserial primary key,
  path        text        not null,
  referrer    text,
  country     text,
  city        text,
  device      text        check (device in ('mobile', 'tablet', 'desktop')),
  session_id  text        not null,
  created_at  timestamptz default now() not null
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx       on public.page_views (path);
create index if not exists page_views_session_idx    on public.page_views (session_id, path);
-- Note: unique index on (session_id, path, date) omitted — timestamptz::date is not IMMUTABLE in PG

alter table public.page_views enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='page_views' and policyname='Public insert') then
    create policy "Public insert" on public.page_views for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='page_views' and policyname='Admin read') then
    create policy "Admin read" on public.page_views for select using (
      exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );
  end if;
end $$;

