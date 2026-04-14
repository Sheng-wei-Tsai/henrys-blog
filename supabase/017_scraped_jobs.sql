-- 017_scraped_jobs.sql
-- Cache table for scraped IT job listings from Seek, Indeed, ACS
-- Jobs expire after 30 days; the scraper cleans up on each run.

create table if not exists public.scraped_jobs (
  id            text primary key,             -- "seek-12345678", "indeed-abc123", "acs-xyz"
  source        text not null,                -- "seek" | "indeed" | "acs"
  title         text not null,
  company       text not null,
  location      text not null,
  description   text not null default '',
  salary        text,                         -- formatted string e.g. "$80k – $110k"
  salary_min    numeric,
  salary_max    numeric,
  url           text not null,
  category      text default '',
  contract_type text,
  created       timestamptz not null,         -- original posting date from the source
  scraped_at    timestamptz default now(),
  dedup_key     text not null,                -- lowercase "title|company" for cross-source dedup
  expires_at    timestamptz not null          -- scraped_at + 30 days
);

create index if not exists idx_scraped_jobs_dedup   on public.scraped_jobs (dedup_key);
create index if not exists idx_scraped_jobs_expires on public.scraped_jobs (expires_at);
create index if not exists idx_scraped_jobs_source  on public.scraped_jobs (source);
create index if not exists idx_scraped_jobs_title   on public.scraped_jobs using gin (to_tsvector('english', title));

alter table public.scraped_jobs enable row level security;

create policy "Anyone can read scraped jobs"
  on public.scraped_jobs for select using (true);

create policy "Service role can write scraped jobs"
  on public.scraped_jobs for all using (true);
