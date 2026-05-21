-- ── SOLTAR (Breaking Bad Habits) ─────────────────────────────────
-- Feature: track a bad habit in progressive stages.
-- Each habit has 1..N stages. Each stage has a window (startDate..endDate),
-- a per-day marked array (jsonb boolean[]), an optional reflection, and a
-- completedAt timestamp once the user closes that stage.
--
-- Run once on the production Supabase project.

create table if not exists public.body_habits (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default '',
  why         text not null default '',
  how         text not null default '',
  pulse       text not null default 'always',   -- 'morning' | 'afternoon' | 'night' | 'always'
  status      text not null default 'active',   -- 'active' | 'completed'
  created_at  timestamptz default now()
);

create index if not exists body_habits_user_idx on public.body_habits(user_id);

alter table public.body_habits enable row level security;

create policy "body_habits_sel" on public.body_habits for select using (auth.uid() = user_id);
create policy "body_habits_ins" on public.body_habits for insert with check (auth.uid() = user_id);
create policy "body_habits_upd" on public.body_habits for update using (auth.uid() = user_id);
create policy "body_habits_del" on public.body_habits for delete using (auth.uid() = user_id);


create table if not exists public.body_habit_stages (
  id            uuid default gen_random_uuid() primary key,
  habit_id      uuid references public.body_habits(id) on delete cascade not null,
  user_id       uuid references auth.users(id)         on delete cascade not null,
  stage_order   int  not null default 1,
  step          text not null default '',
  start_date    date,
  end_date      date,
  total_days    int  not null default 0,
  marked_days   jsonb not null default '[]'::jsonb,    -- array of booleans, length = total_days
  reflection    text not null default '',
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

create index if not exists body_habit_stages_habit_idx on public.body_habit_stages(habit_id);
create index if not exists body_habit_stages_user_idx  on public.body_habit_stages(user_id);

alter table public.body_habit_stages enable row level security;

create policy "body_habit_stages_sel" on public.body_habit_stages for select using (auth.uid() = user_id);
create policy "body_habit_stages_ins" on public.body_habit_stages for insert with check (auth.uid() = user_id);
create policy "body_habit_stages_upd" on public.body_habit_stages for update using (auth.uid() = user_id);
create policy "body_habit_stages_del" on public.body_habit_stages for delete using (auth.uid() = user_id);
