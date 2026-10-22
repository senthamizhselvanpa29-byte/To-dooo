-- ============================================================
-- VdoU DATABASE SETUP — Step 1: user profiles
--
-- HOW TO RUN (one time only):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. Creates a "profiles" table: one row per user with their
--      full name and phone number.
--   2. Fills it in automatically when someone signs up
--      (and updates it when they add their phone later).
--   3. Security: each user can only see and change their own row.
-- ============================================================

-- ----- 1. The profiles table -----
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----- 2. Security: users only see / edit their own profile -----
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----- 3. Copy name + phone from the sign-up form into profiles -----
create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do update
    set full_name  = excluded.full_name,
        phone      = excluded.phone,
        updated_at = now();
  return new;
end;
$$;

-- When someone signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.sync_profile_from_auth();

-- When someone adds or changes their name / phone
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth();
