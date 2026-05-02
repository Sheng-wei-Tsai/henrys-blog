-- Migration 021: Shared interview questions cache
-- Questions are role-scoped, not per-user — first visitor pays the AI cost, everyone else reads from cache

create table if not exists public.interview_questions_cache (
  id         bigserial primary key,
  role_id    text unique not null,
  questions  jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_questions_cache_role_id_idx
  on public.interview_questions_cache (role_id);

-- Non-personal shared cache — no RLS needed (service role writes, authenticated reads)
grant select, insert, update on public.interview_questions_cache to anon, authenticated;
grant usage, select on sequence public.interview_questions_cache_id_seq to anon, authenticated;
