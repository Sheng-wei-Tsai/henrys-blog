-- ─────────────────────────────────────────────────────────────
-- Migration 003: Email auth fields + Skill Progress Tracker
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- 1. Extend profiles for email signups
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists location     text;

-- Update trigger so email signups also populate display_name
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    full_name    = coalesce(excluded.full_name,    profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- Allow users to update their own profile (location, name)
create policy if not exists "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. Skill progress tracking (spaced repetition)
-- status: 'not_started' | 'learning' | 'needs_review' | 'mastered'
create table if not exists public.skill_progress (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  path_id         text not null,       -- e.g. 'junior-frontend'
  skill_id        text not null,       -- e.g. 'html-basics'
  status          text not null default 'not_started',
  started_at      timestamptz,
  last_reviewed_at timestamptz,
  next_review_at  timestamptz,
  review_count    int default 0,
  notes           text,
  updated_at      timestamptz default now(),
  unique(user_id, path_id, skill_id)
);

alter table public.skill_progress enable row level security;

create policy "Users can view own skill progress"
  on public.skill_progress for select using (auth.uid() = user_id);
create policy "Users can insert own skill progress"
  on public.skill_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own skill progress"
  on public.skill_progress for update using (auth.uid() = user_id);
create policy "Users can delete own skill progress"
  on public.skill_progress for delete using (auth.uid() = user_id);
