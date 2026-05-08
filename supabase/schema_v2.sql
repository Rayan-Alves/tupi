-- ================================================================
-- Art — Schema v2: Month & Week Dashboard
-- Run this in Supabase → SQL Editor
-- ================================================================

-- ── Month Profile (1 per user per month) ─────────────────────────
create table if not exists month_profile (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,  -- "2026-05"
  how_start   text default '',
  how_end     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, period)
);

-- ── Month Goals ───────────────────────────────────────────────────
create table if not exists month_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,
  title       text default '',
  why         text default '',
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── Month Tasks ───────────────────────────────────────────────────
create table if not exists month_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,
  title       text default '',
  due_date    date,
  completed   boolean default false,
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── Month Events ──────────────────────────────────────────────────
create table if not exists month_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,
  title       text default '',
  event_date  date,
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── Month Birthdays ───────────────────────────────────────────────
create table if not exists month_birthdays (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,
  name        text default '',
  birth_date  date,
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── Month Reading / Watching ──────────────────────────────────────
create table if not exists month_reading (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(7) not null,
  title       text default '',
  type        varchar(10) default 'read',  -- 'read' | 'watch'
  completed   boolean default false,
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ── Week Profile (1 per user per ISO week) ────────────────────────
create table if not exists week_profile (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(10) not null,  -- "2026-W19"
  how_start   text default '',
  how_end     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, period)
);

-- ── Week Tasks ────────────────────────────────────────────────────
create table if not exists week_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  period      varchar(10) not null,
  title       text default '',
  completed   boolean default false,
  position    integer default 0,
  created_at  timestamptz default now()
);

-- ================================================================
-- Row Level Security
-- ================================================================

alter table month_profile   enable row level security;
alter table month_goals     enable row level security;
alter table month_tasks     enable row level security;
alter table month_events    enable row level security;
alter table month_birthdays enable row level security;
alter table month_reading   enable row level security;
alter table week_profile    enable row level security;
alter table week_tasks      enable row level security;

create policy "own month_profile"   on month_profile   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_goals"     on month_goals     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_tasks"     on month_tasks     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_events"    on month_events    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_birthdays" on month_birthdays for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_reading"   on month_reading   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own week_profile"    on week_profile    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own week_tasks"      on week_tasks      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
