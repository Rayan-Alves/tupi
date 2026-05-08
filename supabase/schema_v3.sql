-- User Profiles
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  bio         text,
  birth_date  date,
  country     text,
  city        text,
  occupation  text,
  gender      text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "profile_select" on public.user_profiles
  for select using (auth.uid() = id);

create policy "profile_insert" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "profile_update" on public.user_profiles
  for update using (auth.uid() = id);

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_user_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_user_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
