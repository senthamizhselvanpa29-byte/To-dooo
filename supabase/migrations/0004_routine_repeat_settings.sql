-- ============================================================
-- VdoU DATABASE SETUP — Step 4: settings, daily routine, repeating tasks
--
-- HOW TO RUN (one time only, after Step 3):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. "user_settings": day / night shift, wake-up times, night planning time
--   2. "routines": daily habits (times follow your wake-up time) and
--      repeating tasks (every day … every 2 months, every year)
--   3. Tasks remember which routine and which day they belong to,
--      so each habit / repeat is created only once per day.
-- ============================================================

-- ----- 1. Settings (one row per user) -----
create table if not exists public.user_settings (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  shift            text not null default 'day' check (shift in ('day', 'night')),
  day_wake         time not null default '06:00',
  night_wake       time not null default '14:00',
  planning_offset  integer not null default 900 check (planning_offset between 0 and 1439), -- minutes after wake-up (900 = 15 hours)
  routine_set_up   boolean not null default false,
  night_planned_on date,                                   -- last night planning (shows once per night)
  updated_at       timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can read their own settings" on public.user_settings;
create policy "Users can read their own settings" on public.user_settings for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own settings" on public.user_settings;
create policy "Users can add their own settings" on public.user_settings for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings" on public.user_settings for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ----- 2. Routines: habits + repeating tasks -----
create table if not exists public.routines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind            text not null check (kind in ('habit', 'repeat')),
  title           text not null check (char_length(title) between 1 and 200),
  emoji           text check (emoji is null or char_length(emoji) <= 16),
  offset_minutes  integer check (offset_minutes between 0 and 1439), -- habits: minutes after wake-up
  time_of_day     time,                                              -- repeating tasks: fixed clock time
  repeat          text not null default 'daily'
                    check (repeat in ('daily', 'weekdays', 'weekly', 'monthly', 'bimonthly', 'yearly')),
  weekdays        smallint[],                                        -- weekly: 0 = Sunday … 6 = Saturday
  start_date      date not null default current_date,
  priority        text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  ball            text not null default 'rubber' check (ball in ('glass', 'rubber')),
  list_id         uuid references public.lists (id) on delete set null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  check ((kind = 'habit' and offset_minutes is not null) or (kind = 'repeat' and time_of_day is not null))
);

create index if not exists routines_user_idx on public.routines (user_id);

alter table public.routines enable row level security;

drop policy if exists "Users can read their own routines" on public.routines;
create policy "Users can read their own routines" on public.routines for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own routines" on public.routines;
create policy "Users can add their own routines" on public.routines for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own routines" on public.routines;
create policy "Users can update their own routines" on public.routines for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own routines" on public.routines;
create policy "Users can delete their own routines" on public.routines for delete
  using ((select auth.uid()) = user_id);

-- ----- 3. Tasks remember their routine and day -----
alter table public.tasks
  add column if not exists routine_id      uuid references public.routines (id) on delete set null,
  add column if not exists occurrence_date date,
  add column if not exists habit           boolean not null default false;

alter table public.tasks drop constraint if exists tasks_routine_occurrence_unique;
alter table public.tasks add constraint tasks_routine_occurrence_unique unique (routine_id, occurrence_date);
