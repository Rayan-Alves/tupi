-- Migration v8: dashboard_routines table
-- Routines created directly from the Dashboard day view

create table if not exists public.dashboard_routines (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  title        text    not null default '',
  days         text[]  not null default '{}',
  start_time   time,
  end_time     time,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.dashboard_routines enable row level security;

create policy "dashboard_routines_sel" on public.dashboard_routines
  for select using (auth.uid() = user_id);

create policy "dashboard_routines_ins" on public.dashboard_routines
  for insert with check (auth.uid() = user_id);

create policy "dashboard_routines_upd" on public.dashboard_routines
  for update using (auth.uid() = user_id);

create policy "dashboard_routines_del" on public.dashboard_routines
  for delete using (auth.uid() = user_id);
