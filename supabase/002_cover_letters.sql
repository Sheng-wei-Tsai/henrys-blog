create table if not exists public.cover_letters (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  job_title       text not null,
  company         text not null,
  job_description text not null,
  cover_letter    text not null,
  created_at      timestamptz default now()
);

alter table public.cover_letters enable row level security;

create policy "Users can manage own cover letters"
  on public.cover_letters for all using (auth.uid() = user_id);
