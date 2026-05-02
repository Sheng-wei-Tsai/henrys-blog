-- Migration 022: Cover letter fragments cache
-- Keyed by company+role slug — first generation for a role is reused for all subsequent requests

create table if not exists public.cover_letter_fragments_cache (
  id                 bigserial primary key,
  cache_key          text unique not null,
  cover_letter_text  text        not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists cover_letter_fragments_cache_key_idx
  on public.cover_letter_fragments_cache (cache_key);

-- Shared non-personal cache — no RLS needed (service role writes, authenticated reads)
grant select, insert, update on public.cover_letter_fragments_cache to anon, authenticated;
grant usage, select on sequence public.cover_letter_fragments_cache_id_seq to anon, authenticated;
