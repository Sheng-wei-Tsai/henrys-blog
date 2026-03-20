-- ─────────────────────────────────────────────────────────────
-- Henry Blog — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- 1. User profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Saved jobs
create table if not exists public.saved_jobs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  job_id        text not null,                  -- Adzuna job ID
  title         text not null,
  company       text not null,
  location      text not null,
  salary        text,
  url           text not null,
  description   text,
  category      text,
  contract_type text,
  created_at    timestamptz default now(),
  unique (user_id, job_id)                      -- can't save the same job twice
);

-- 3. Job alerts
create table if not exists public.job_alerts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  keywords    text not null,
  location    text not null default 'Brisbane',
  full_time   boolean default false,
  frequency   text not null default 'weekly',   -- 'daily' | 'weekly'
  active      boolean default true,
  last_run_at timestamptz,
  created_at  timestamptz default now()
);

-- 4. Job applications tracker
create table if not exists public.job_applications (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  job_id       text not null,
  title        text not null,
  company      text not null,
  url          text not null,
  status       text not null default 'applied', -- 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  applied_at   timestamptz default now(),
  notes        text,
  updated_at   timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────
-- Users can only see and modify their own data

alter table public.profiles          enable row level security;
alter table public.saved_jobs        enable row level security;
alter table public.job_alerts        enable row level security;
alter table public.job_applications  enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Saved jobs
create policy "Users can view own saved jobs"
  on public.saved_jobs for select using (auth.uid() = user_id);
create policy "Users can save jobs"
  on public.saved_jobs for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved jobs"
  on public.saved_jobs for delete using (auth.uid() = user_id);

-- Job alerts
create policy "Users can view own alerts"
  on public.job_alerts for select using (auth.uid() = user_id);
create policy "Users can create alerts"
  on public.job_alerts for insert with check (auth.uid() = user_id);
create policy "Users can update own alerts"
  on public.job_alerts for update using (auth.uid() = user_id);
create policy "Users can delete own alerts"
  on public.job_alerts for delete using (auth.uid() = user_id);

-- Applications
create policy "Users can view own applications"
  on public.job_applications for select using (auth.uid() = user_id);
create policy "Users can create applications"
  on public.job_applications for insert with check (auth.uid() = user_id);
create policy "Users can update own applications"
  on public.job_applications for update using (auth.uid() = user_id);
create policy "Users can delete own applications"
  on public.job_applications for delete using (auth.uid() = user_id);
