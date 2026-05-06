create table if not exists public.user_progress (
  user_id uuid primary key,
  card_index integer not null default 0,
  reviewed integer not null default 0,
  quiz_score integer not null default 0,
  streak integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy if not exists "Users can read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
