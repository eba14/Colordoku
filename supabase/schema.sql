-- Colordoku: save progress + best times
-- Run this once in your Supabase project's SQL editor (Dashboard > SQL Editor > New query).

-- Best completion time per user per mode.
create table if not exists public.best_times (
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('easy', 'medium', 'hard', 'expert')),
  best_seconds integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

alter table public.best_times enable row level security;

-- RLS policies only take effect once the role has the base SQL privilege to
-- touch the table at all — without this grant every request 403s with
-- "permission denied for table" before RLS is ever evaluated.
grant select, insert, update on public.best_times to authenticated;

create policy "Users can read their own best times"
  on public.best_times for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own best times"
  on public.best_times for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own best times"
  on public.best_times for update
  using (auth.uid() = user_id);

-- One in-progress game per user (a single "resume" slot). Overwritten on every save,
-- deleted when the puzzle is finished or abandoned.
create table if not exists public.game_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null check (mode in ('easy', 'medium', 'hard', 'expert')),
  puzzle jsonb not null,
  tray_pieces jsonb not null,
  placed_pieces jsonb not null,
  elapsed_seconds integer not null,
  updated_at timestamptz not null default now()
);

alter table public.game_progress enable row level security;

grant select, insert, update, delete on public.game_progress to authenticated;

create policy "Users can read their own progress"
  on public.game_progress for select
  using (auth.uid() = user_id);

create policy "Users can write their own progress"
  on public.game_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.game_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own progress"
  on public.game_progress for delete
  using (auth.uid() = user_id);
