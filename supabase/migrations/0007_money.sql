-- ============================================================
-- VdoU DATABASE SETUP — Step 7: 💰 Money (daily income & expenses)
--
-- HOW TO RUN (one time only, after Step 6):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. "money_categories": your own categories (e.g. 🐄 Cow feed).
--      The built-in ones (Food, Bills, Salary…) live in the app:
--      src/data/money.js
--   2. "money_entries": every income and expense — amount, category,
--      how you paid (cash / UPI / card / bank), when, a note, and the
--      bill task it came from (if any). Deleting only hides an entry,
--      so "Undo" can bring it back.
--   3. Money settings in "user_settings": monthly budget, the day your
--      month starts (1st or salary day), default "paid by", show money
--      on Today, hide amounts, budget warnings.
-- Only you can see your own money (row level security).
-- ============================================================

-- ----- 1. My own categories -----
create table if not exists public.money_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('expense', 'income')),
  name        text not null check (char_length(name) between 1 and 40),
  emoji       text check (emoji is null or char_length(emoji) <= 16),
  created_at  timestamptz not null default now()
);

create index if not exists money_categories_user_idx on public.money_categories (user_id);

alter table public.money_categories enable row level security;

drop policy if exists "Users can read their own money categories" on public.money_categories;
create policy "Users can read their own money categories" on public.money_categories for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own money categories" on public.money_categories;
create policy "Users can add their own money categories" on public.money_categories for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own money categories" on public.money_categories;
create policy "Users can update their own money categories" on public.money_categories for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own money categories" on public.money_categories;
create policy "Users can delete their own money categories" on public.money_categories for delete
  using ((select auth.uid()) = user_id);

-- ----- 2. Money in and out -----
create table if not exists public.money_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind                text not null check (kind in ('expense', 'income')),
  amount              numeric(12, 2) not null check (amount > 0),           -- in rupees (₹49.50 allowed)
  category            text not null check (char_length(category) between 1 and 40), -- e.g. 'food', or 'custom'
  item                text check (item is null or char_length(item) <= 40), -- quick choice, e.g. 'lunch'
  custom_category_id  uuid references public.money_categories (id) on delete set null,
  pay_mode            text check (pay_mode is null or pay_mode in ('cash', 'upi', 'card', 'bank', 'other')),
  spent_at            timestamptz not null default now(),
  note                text check (note is null or char_length(note) <= 300),
  task_id             uuid references public.tasks (id) on delete set null,  -- the bill task it came from
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists money_entries_user_time_idx on public.money_entries (user_id, spent_at desc);
create index if not exists money_entries_task_idx on public.money_entries (task_id) where task_id is not null;

alter table public.money_entries enable row level security;

drop policy if exists "Users can read their own money" on public.money_entries;
create policy "Users can read their own money" on public.money_entries for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own money" on public.money_entries;
create policy "Users can add their own money" on public.money_entries for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own money" on public.money_entries;
create policy "Users can update their own money" on public.money_entries for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own money" on public.money_entries;
create policy "Users can delete their own money" on public.money_entries for delete
  using ((select auth.uid()) = user_id);

-- Changed entry: keep owner and created time, remember when it changed
create or replace function public.money_entries_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists money_entries_before_update on public.money_entries;
create trigger money_entries_before_update
  before update on public.money_entries
  for each row execute function public.money_entries_before_update();

-- ----- 3. Money settings -----
alter table public.user_settings
  add column if not exists money_budget numeric(12, 2) check (money_budget is null or money_budget > 0),
  add column if not exists money_month_start smallint not null default 1 check (money_month_start between 1 and 31),
  add column if not exists money_default_mode text check (money_default_mode is null or money_default_mode in ('cash', 'upi', 'card', 'bank', 'other')),
  add column if not exists money_on_today boolean not null default true,
  add column if not exists money_hide boolean not null default false,
  add column if not exists money_warnings boolean not null default true;
