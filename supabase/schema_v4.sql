-- ── MIND ──────────────────────────────────────────────────────────

create table if not exists public.mind_profile (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  self_thought text,
  sabotage     text,
  turn_gold    text,
  skills       text,
  tips         text,
  updated_at   timestamptz default now()
);
alter table public.mind_profile enable row level security;
create policy "mind_profile_sel" on public.mind_profile for select using (auth.uid() = user_id);
create policy "mind_profile_ins" on public.mind_profile for insert with check (auth.uid() = user_id);
create policy "mind_profile_upd" on public.mind_profile for update using (auth.uid() = user_id);

create table if not exists public.mind_goals (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  title        text default '',
  why          text default '',
  how          text default '',
  what_needed  text default '',
  completed    boolean default false,
  reflection   text default '',
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.mind_goals enable row level security;
create policy "mind_goals_sel" on public.mind_goals for select using (auth.uid() = user_id);
create policy "mind_goals_ins" on public.mind_goals for insert with check (auth.uid() = user_id);
create policy "mind_goals_upd" on public.mind_goals for update using (auth.uid() = user_id);
create policy "mind_goals_del" on public.mind_goals for delete using (auth.uid() = user_id);

create table if not exists public.mind_tasks (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  goal_id      uuid references public.mind_goals(id) on delete cascade,
  title        text default '',
  completed    boolean default false,
  repeat       boolean default false,
  repeat_days  text[] default '{}',
  start_date   date,
  end_date     date,
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.mind_tasks enable row level security;
create policy "mind_tasks_sel" on public.mind_tasks for select using (auth.uid() = user_id);
create policy "mind_tasks_ins" on public.mind_tasks for insert with check (auth.uid() = user_id);
create policy "mind_tasks_upd" on public.mind_tasks for update using (auth.uid() = user_id);
create policy "mind_tasks_del" on public.mind_tasks for delete using (auth.uid() = user_id);

create table if not exists public.mind_routines (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  title        text default '',
  days         text[] default '{}',
  start_time   time,
  end_time     time,
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.mind_routines enable row level security;
create policy "mind_routines_sel" on public.mind_routines for select using (auth.uid() = user_id);
create policy "mind_routines_ins" on public.mind_routines for insert with check (auth.uid() = user_id);
create policy "mind_routines_upd" on public.mind_routines for update using (auth.uid() = user_id);
create policy "mind_routines_del" on public.mind_routines for delete using (auth.uid() = user_id);

-- ── BODY ──────────────────────────────────────────────────────────

create table if not exists public.body_profile (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  kindness       text,
  last_exam_date text,
  next_exam_date text,
  updated_at     timestamptz default now()
);
alter table public.body_profile enable row level security;
create policy "body_profile_sel" on public.body_profile for select using (auth.uid() = user_id);
create policy "body_profile_ins" on public.body_profile for insert with check (auth.uid() = user_id);
create policy "body_profile_upd" on public.body_profile for update using (auth.uid() = user_id);

create table if not exists public.body_goals (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  title        text default '',
  why          text default '',
  how          text default '',
  what_needed  text default '',
  completed    boolean default false,
  reflection   text default '',
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.body_goals enable row level security;
create policy "body_goals_sel" on public.body_goals for select using (auth.uid() = user_id);
create policy "body_goals_ins" on public.body_goals for insert with check (auth.uid() = user_id);
create policy "body_goals_upd" on public.body_goals for update using (auth.uid() = user_id);
create policy "body_goals_del" on public.body_goals for delete using (auth.uid() = user_id);

create table if not exists public.body_tasks (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  goal_id      uuid references public.body_goals(id) on delete cascade,
  title        text default '',
  completed    boolean default false,
  repeat       boolean default false,
  repeat_days  text[] default '{}',
  start_date   date,
  end_date     date,
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.body_tasks enable row level security;
create policy "body_tasks_sel" on public.body_tasks for select using (auth.uid() = user_id);
create policy "body_tasks_ins" on public.body_tasks for insert with check (auth.uid() = user_id);
create policy "body_tasks_upd" on public.body_tasks for update using (auth.uid() = user_id);
create policy "body_tasks_del" on public.body_tasks for delete using (auth.uid() = user_id);

create table if not exists public.body_routines (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  title        text default '',
  days         text[] default '{}',
  start_time   time,
  end_time     time,
  position     int default 0,
  created_at   timestamptz default now()
);
alter table public.body_routines enable row level security;
create policy "body_routines_sel" on public.body_routines for select using (auth.uid() = user_id);
create policy "body_routines_ins" on public.body_routines for insert with check (auth.uid() = user_id);
create policy "body_routines_upd" on public.body_routines for update using (auth.uid() = user_id);
create policy "body_routines_del" on public.body_routines for delete using (auth.uid() = user_id);
