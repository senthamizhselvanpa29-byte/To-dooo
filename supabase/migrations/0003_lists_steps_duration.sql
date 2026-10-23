-- ============================================================
-- VdoU DATABASE SETUP — Step 3: lists, steps and "how long?"
--
-- HOW TO RUN (one time only, after Step 2):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. Creates the "lists" table (Home, Work, Study…).
--   2. Lets a task belong to a list.
--   3. Lets a task have STEPS inside it (big plans).
--      A step's deadline can't be after its plan ends.
--   4. Adds "how long?" to tasks (15 min … many days) for the clash check.
-- ============================================================

-- ----- 1. Lists -----
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  emoji       text not null default '📁' check (char_length(emoji) <= 16),
  created_at  timestamptz not null default now()
);

create index if not exists lists_user_idx on public.lists (user_id);

alter table public.lists enable row level security;

drop policy if exists "Users can read their own lists" on public.lists;
create policy "Users can read their own lists" on public.lists for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own lists" on public.lists;
create policy "Users can add their own lists" on public.lists for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own lists" on public.lists;
create policy "Users can update their own lists" on public.lists for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own lists" on public.lists;
create policy "Users can delete their own lists" on public.lists for delete
  using ((select auth.uid()) = user_id);

-- ----- 2–4. New task columns -----
alter table public.tasks
  add column if not exists list_id   uuid references public.lists (id) on delete set null,
  add column if not exists parent_id uuid references public.tasks (id) on delete cascade,
  add column if not exists duration  text check (duration in ('15m', '30m', '1h', '2h', 'all_day', 'days')),
  add column if not exists end_at    timestamptz;

alter table public.tasks drop constraint if exists tasks_end_after_start;
alter table public.tasks add constraint tasks_end_after_start check (end_at is null or end_at >= due_at);

create index if not exists tasks_parent_idx on public.tasks (parent_id);
create index if not exists tasks_list_idx on public.tasks (list_id);

-- ----- Rules checked by the database -----
--  • A task can only use the user's own list and own parent plan
--  • A step can't be inside another step (only one level)
--  • A step's deadline can't be after its plan ends
create or replace function public.tasks_check_links()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  plan record;
begin
  if new.list_id is not null and not exists (
    select 1 from public.lists l where l.id = new.list_id and l.user_id = new.user_id
  ) then
    raise exception 'List not found';
  end if;

  if new.parent_id is not null then
    select p.user_id, p.parent_id, p.due_at, p.end_at into plan
      from public.tasks p where p.id = new.parent_id;
    if plan is null or plan.user_id <> new.user_id then
      raise exception 'Plan not found';
    end if;
    if plan.parent_id is not null then
      raise exception 'A step cannot have its own steps';
    end if;
    if new.due_at > coalesce(plan.end_at, plan.due_at) then
      raise exception 'step_after_plan';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_check_links on public.tasks;
create trigger tasks_check_links
  before insert or update of list_id, parent_id, due_at on public.tasks
  for each row execute function public.tasks_check_links();
