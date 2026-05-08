-- ================================================================
-- Art — Life Dashboard · Supabase Schema
-- Run this in Supabase → SQL Editor
-- ================================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ── Spirit Profile (1 per user) ──────────────────────────────────
create table if not exists spirit_profile (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade unique not null,
  who_am_i         text default '',
  values           text default '',
  where_i_am       text default '',
  where_i_want_to_go text default '',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Spirit Goals ─────────────────────────────────────────────────
create table if not exists spirit_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text default '',
  why          text default '',
  how          text default '',
  what_needed  text default '',
  reflection   text default '',
  position     integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Spirit Tasks ─────────────────────────────────────────────────
create table if not exists spirit_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  goal_id      uuid references spirit_goals(id) on delete cascade not null,
  title        text default '',
  start_date   date,
  end_date     date,
  repeat       boolean default false,
  repeat_days  text[] default '{}',
  completed    boolean default false,
  created_at   timestamptz default now()
);

-- ── Spirit Routines ──────────────────────────────────────────────
create table if not exists spirit_routines (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text default '',
  days         text[] default '{}',
  start_time   time,
  end_time     time,
  created_at   timestamptz default now()
);

-- ================================================================
-- Row Level Security (CRITICAL for SaaS — each user sees only their data)
-- ================================================================

alter table spirit_profile  enable row level security;
alter table spirit_goals    enable row level security;
alter table spirit_tasks    enable row level security;
alter table spirit_routines enable row level security;

-- Profile
create policy "Users manage own profile"
  on spirit_profile for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals
create policy "Users manage own goals"
  on spirit_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks
create policy "Users manage own tasks"
  on spirit_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Routines
create policy "Users manage own routines"
  on spirit_routines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ================================================================
-- Auto-update updated_at
-- ================================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spirit_profile_updated_at
  before update on spirit_profile
  for each row execute function update_updated_at();

create trigger spirit_goals_updated_at
  before update on spirit_goals
  for each row execute function update_updated_at();
