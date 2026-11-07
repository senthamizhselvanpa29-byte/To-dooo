-- ============================================================
-- VdoU DATABASE SETUP — Step 6: Free vs Pro, payments (Razorpay)
--
-- HOW TO RUN (one time only, after Step 5):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. "user_plans": each user's plan — free trial (45 days), monthly,
--      yearly or lifetime — and until when Pro lasts.
--      The trial starts by itself the first time the user opens VdoU.
--   2. "payments": every Razorpay payment (order, amount, paid or not).
--   3. A private "server key" that only our own server (on Vercel) knows.
--      Only the server can record payments and make someone Pro —
--      users can never make themselves Pro.
--   4. Free plan limits, checked by the database itself:
--      5 habits, 3 lists, 3 steps in a big plan.
--
-- AFTER RUNNING: copy the server key into Vercel (see docs/SETUP.md, Step 6).
-- ============================================================

-- ----- Numbers you can change -----
-- Trial length and Free limits are in the functions below:
--   trial: interval '45 days'  ·  habits: 5  ·  lists: 3  ·  steps: 3
-- (keep them the same as src/lib/plans.js)

-- ----- 1. Plans (one row per user) -----
create table if not exists public.user_plans (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan        text not null check (plan in ('trial', 'monthly', 'yearly', 'lifetime')),
  pro_until   timestamptz,                -- empty only for lifetime
  updated_at  timestamptz not null default now()
);

alter table public.user_plans enable row level security;

-- Users can only READ their own plan. Changes happen only through the
-- functions below.
drop policy if exists "Users can read their own plan" on public.user_plans;
create policy "Users can read their own plan" on public.user_plans for select
  using ((select auth.uid()) = user_id);

-- ----- 2. Payments -----
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  plan                 text not null check (plan in ('monthly', 'yearly', 'lifetime')),
  amount               integer not null check (amount > 0),   -- in rupees
  razorpay_order_id    text not null unique,
  razorpay_payment_id  text unique,
  status               text not null default 'created' check (status in ('created', 'paid')),
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);

create index if not exists payments_user_idx on public.payments (user_id);

alter table public.payments enable row level security;

drop policy if exists "Users can read their own payments" on public.payments;
create policy "Users can read their own payments" on public.payments for select
  using ((select auth.uid()) = user_id);

-- ----- 3. Private server key (not reachable from the app or the internet) -----
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_keys (
  name   text primary key,
  value  text not null
);

insert into private.app_keys (name, value)
values ('server_key', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

create or replace function private.server_key_ok(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.app_keys where name = 'server_key' and value = p_key and p_key is not null
  );
$$;

-- Returns the user's plan; starts the 45-day free trial the first time.
create or replace function private.ensure_plan(p_user uuid)
returns public.user_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  plan_row public.user_plans;
begin
  insert into public.user_plans (user_id, plan, pro_until)
  values (p_user, 'trial', now() + interval '45 days')
  on conflict (user_id) do nothing;
  select * into plan_row from public.user_plans where user_id = p_user;
  return plan_row;
end;
$$;

-- Is this user Pro right now? (trial counts as Pro)
create or replace function private.is_pro(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  plan_row public.user_plans;
begin
  plan_row := private.ensure_plan(p_user);
  return plan_row.plan = 'lifetime' or plan_row.pro_until > now();
end;
$$;

-- ----- Functions the app calls -----

-- My plan (starts the free trial the first time)
create or replace function public.my_plan()
returns public.user_plans
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  return private.ensure_plan(auth.uid());
end;
$$;

-- Server only: remember a new Razorpay order for the logged-in user
create or replace function public.record_order(p_key text, p_order_id text, p_plan text, p_amount integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.server_key_ok(p_key) then
    raise exception 'bad_server_key';
  end if;
  if auth.uid() is null then
    raise exception 'not_logged_in';
  end if;
  insert into public.payments (user_id, plan, amount, razorpay_order_id)
  values (auth.uid(), p_plan, p_amount, p_order_id);
end;
$$;

-- Server only: a payment was checked with Razorpay → make the user Pro.
-- Safe to call twice for the same payment (the second time changes nothing).
create or replace function public.confirm_payment(p_key text, p_order_id text, p_payment_id text)
returns public.user_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments;
  current_plan public.user_plans;
  base timestamptz;
begin
  if not private.server_key_ok(p_key) then
    raise exception 'bad_server_key';
  end if;

  select * into pay from public.payments where razorpay_order_id = p_order_id for update;
  if not found then
    raise exception 'unknown_order';
  end if;
  if auth.uid() is not null and pay.user_id <> auth.uid() then
    raise exception 'not_your_order';
  end if;

  current_plan := private.ensure_plan(pay.user_id);
  if pay.status = 'paid' then
    return current_plan;
  end if;

  update public.payments
     set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now()
   where id = pay.id;

  -- A new month / year starts when the current Pro (or trial) ends
  base := greatest(now(), coalesce(current_plan.pro_until, now()));

  if current_plan.plan = 'lifetime' then
    null; -- already Pro for life
  elsif pay.plan = 'lifetime' then
    update public.user_plans set plan = 'lifetime', pro_until = null, updated_at = now() where user_id = pay.user_id;
  elsif pay.plan = 'yearly' then
    update public.user_plans set plan = 'yearly', pro_until = base + interval '1 year', updated_at = now() where user_id = pay.user_id;
  else
    -- (a month added to an active yearly plan keeps the name "yearly")
    update public.user_plans
       set plan = case when current_plan.plan = 'yearly' and current_plan.pro_until > now() then 'yearly' else 'monthly' end,
           pro_until = base + interval '1 month', updated_at = now()
     where user_id = pay.user_id;
  end if;

  select * into current_plan from public.user_plans where user_id = pay.user_id;
  return current_plan;
end;
$$;

revoke all on function public.my_plan() from public, anon;
revoke all on function public.record_order(text, text, text, integer) from public, anon;
revoke all on function public.confirm_payment(text, text, text) from public, anon;
grant execute on function public.my_plan() to authenticated;
grant execute on function public.record_order(text, text, text, integer) to authenticated;
grant execute on function public.confirm_payment(text, text, text) to authenticated;

-- ----- 4. Free plan limits (checked when adding) -----
-- Habits: 5 (repeating tasks are not limited)
create or replace function private.limit_habits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'habit' and not private.is_pro(new.user_id)
     and (select count(*) from public.routines where user_id = new.user_id and kind = 'habit' and active) >= 5 then
    raise exception 'free_limit_habits';
  end if;
  return new;
end;
$$;

-- Lists: 3
create or replace function private.limit_lists()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_pro(new.user_id)
     and (select count(*) from public.lists where user_id = new.user_id) >= 3 then
    raise exception 'free_limit_lists';
  end if;
  return new;
end;
$$;

-- Steps inside one big plan: 3 (normal tasks are unlimited)
create or replace function private.limit_steps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is not null and not private.is_pro(new.user_id)
     and (select count(*) from public.tasks where parent_id = new.parent_id and deleted_at is null) >= 3 then
    raise exception 'free_limit_steps';
  end if;
  return new;
end;
$$;

drop function if exists private.check_free_limits() cascade;

drop trigger if exists routines_free_limits on public.routines;
create trigger routines_free_limits
  before insert on public.routines
  for each row execute function private.limit_habits();

drop trigger if exists lists_free_limits on public.lists;
create trigger lists_free_limits
  before insert on public.lists
  for each row execute function private.limit_lists();

drop trigger if exists tasks_free_limits on public.tasks;
create trigger tasks_free_limits
  before insert on public.tasks
  for each row execute function private.limit_steps();

-- ----- Show the server key (copy it into Vercel as VDOU_SERVER_KEY) -----
select value as "Copy this into Vercel as VDOU_SERVER_KEY" from private.app_keys where name = 'server_key';
