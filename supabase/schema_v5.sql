-- ── ROUTINE COMPLETIONS ───────────────────────────────────────────
-- Tracks which routines were completed on which date (one record per day)
-- This powers the "check" ceremony in the Rotinas tab and streak calculation.

create table if not exists public.routine_completions (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  routine_id     uuid references public.body_routines(id) on delete cascade not null,
  completed_date date not null default current_date,
  created_at     timestamptz default now(),
  unique (user_id, routine_id, completed_date)
);

alter table public.routine_completions enable row level security;

create policy "routine_completions_sel"
  on public.routine_completions for select
  using (auth.uid() = user_id);

create policy "routine_completions_ins"
  on public.routine_completions for insert
  with check (auth.uid() = user_id);

create policy "routine_completions_del"
  on public.routine_completions for delete
  using (auth.uid() = user_id);

-- Shadow Work Sessions
create table if not exists shadow_work_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  title       text default '',
  nodes       jsonb default '{}'::jsonb,
  connections jsonb default '[]'::jsonb,
  canvas_aes  text default 'mono',
  node_style  text default 'floating',
  entry_bg    text default 'neblina',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table if exists shadow_work_sessions enable row level security;
create policy if not exists "users manage own shadow work"
  on shadow_work_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
