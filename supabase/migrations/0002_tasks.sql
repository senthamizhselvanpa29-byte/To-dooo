-- ============================================================
-- VdoU DATABASE SETUP — Step 2: tasks
--
-- HOW TO RUN (one time only):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. Creates the "tasks" table: every task with its date + time,
--      colour (high / medium / low) and ball (glass / rubber).
--   2. Security: each user can only see and change their own tasks.
--   3. Postpone tracker: when a task is moved to a later time, the
--      database counts it automatically ("postponed 3 times, 2 days late").
-- ============================================================

-- ----- 1. The tasks table -----
create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title              text not null check (char_length(title) between 1 and 200),
  note               text check (note is null or char_length(note) <= 1000),
  due_at             timestamptz not null,                       -- date + time (required)
  priority           text not null default 'medium'
                       check (priority in ('high', 'medium', 'low')),  -- 🔴 🟡 🟢
  ball               text not null default 'rubber'
                       check (ball in ('glass', 'rubber')),       -- 🔮 can't move / 🏀 can move
  done               boolean not null default false,
  done_at            timestamptz,
  postpone_count     integer not null default 0,                 -- how many times moved later
  postponed_minutes  integer not null default 0,                 -- total time moved later
  deleted_at         timestamptz,                                -- set when deleted (allows Undo)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists tasks_user_due_idx on public.tasks (user_id, due_at);

-- ----- 2. Security: users only see / change their own tasks -----
alter table public.tasks enable row level security;

drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks"
  on public.tasks for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own tasks" on public.tasks;
create policy "Users can add their own tasks"
  on public.tasks for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using ((select auth.uid()) = user_id);

-- ----- 3. Automatic bookkeeping -----
-- New task: counters start at zero.
create or replace function public.tasks_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.postpone_count := 0;
  new.postponed_minutes := 0;
  new.done_at := case when new.done then now() end;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

-- Changed task: count postpones, remember when it was done.
create or replace function public.tasks_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- These can only be changed by the database itself
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.postpone_count := old.postpone_count;
  new.postponed_minutes := old.postponed_minutes;

  -- Postpone tracker: moved to a later time (and not already done)
  if new.due_at > old.due_at and not old.done then
    new.postpone_count := old.postpone_count + 1;
    new.postponed_minutes := old.postponed_minutes
      + floor(extract(epoch from (new.due_at - old.due_at)) / 60)::integer;
  end if;

  -- Done time
  if new.done and not old.done then
    new.done_at := now();
  elsif not new.done then
    new.done_at := null;
  else
    new.done_at := old.done_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_before_insert on public.tasks;
create trigger tasks_before_insert
  before insert on public.tasks
  for each row execute function public.tasks_before_insert();

drop trigger if exists tasks_before_update on public.tasks;
create trigger tasks_before_update
  before update on public.tasks
  for each row execute function public.tasks_before_update();
