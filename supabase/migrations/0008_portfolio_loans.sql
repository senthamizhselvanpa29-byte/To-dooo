-- ============================================================
-- VdoU DATABASE SETUP — Step 8: 📈 Portfolio (investments) + 🏦 Loans
--
-- HOW TO RUN (one time only, after Step 7):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. "investments": mutual funds, shares, gold, FD, RD, PPF… — what you
--      put in, the interest rate / units / value, maturity date.
--   2. "investment_txns": each investment's history — money added,
--      returns received, money taken out, value updates.
--   3. "loans": home loan, gold loan, personal loan… — amount, interest
--      rate, EMI or interest-only, start date.
--   4. "loan_txns": each loan's history — extra payments, more borrowed,
--      balance updates.
--   5. Settings: today's gold / silver rate, 80C tracker on/off, and the
--      monthly "update your values" reminder.
--   6. Free plan: up to 3 investments and 3 loans (Pro: unlimited).
-- Only you can see your own portfolio and loans.
-- ============================================================

-- ----- 1. Investments -----
create table if not exists public.investments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type               text not null check (type in ('mf', 'stocks', 'gold', 'silver', 'fd', 'rd', 'ppf', 'epf', 'ssy', 'postoffice', 'bonds', 'nps', 'insurance', 'crypto', 'chit', 'land', 'other')),
  name               text not null check (char_length(name) between 1 and 80),
  started_on         date not null default current_date,
  amount             numeric(14, 2) not null default 0 check (amount >= 0),          -- put in at the start (or "so far")
  monthly_amount     numeric(14, 2) check (monthly_amount is null or monthly_amount > 0), -- SIP / RD every month
  monthly_day        smallint check (monthly_day is null or monthly_day between 1 and 31),
  monthly_until      date,                                                          -- SIP stopped / RD last month
  rate               numeric(6, 3) check (rate is null or rate between 0 and 100),  -- yearly interest % (FD, RD, PPF…)
  matures_on         date,
  payout             boolean not null default false,                                -- interest paid out to me (MIS, SCSS)
  units              numeric(18, 6) check (units is null or units >= 0),            -- MF units, shares, grams of gold
  price              numeric(16, 4) check (price is null or price >= 0),            -- latest price per unit (NAV, share price)
  value              numeric(14, 2) check (value is null or value >= 0),            -- latest value you entered
  value_on           date,
  tax_saver          boolean not null default false,                                -- counts for 80C
  closed_on          date,
  note               text check (note is null or char_length(note) <= 300),
  reminder_task_ids  uuid[] not null default '{}',                                  -- "matures soon" tasks
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists investments_user_idx on public.investments (user_id);

alter table public.investments enable row level security;

drop policy if exists "Users can read their own investments" on public.investments;
create policy "Users can read their own investments" on public.investments for select
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can add their own investments" on public.investments;
create policy "Users can add their own investments" on public.investments for insert
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own investments" on public.investments;
create policy "Users can update their own investments" on public.investments for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own investments" on public.investments;
create policy "Users can delete their own investments" on public.investments for delete
  using ((select auth.uid()) = user_id);

-- ----- 2. Investment history -----
create table if not exists public.investment_txns (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  investment_id   uuid not null references public.investments (id) on delete cascade,
  kind            text not null check (kind in ('invest', 'return', 'withdraw', 'value')),
  amount          numeric(14, 2) not null check (amount >= 0),   -- for 'value': the value on that day
  units           numeric(18, 6) check (units is null or units >= 0),
  price           numeric(16, 4) check (price is null or price >= 0),
  on_date         date not null default current_date,
  note            text check (note is null or char_length(note) <= 300),
  money_entry_id  uuid references public.money_entries (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists investment_txns_investment_idx on public.investment_txns (investment_id, on_date);

alter table public.investment_txns enable row level security;

-- History rows must belong to one of YOUR investments
drop policy if exists "Users can read their own investment history" on public.investment_txns;
create policy "Users can read their own investment history" on public.investment_txns for select
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can add their own investment history" on public.investment_txns;
create policy "Users can add their own investment history" on public.investment_txns for insert
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.investments i where i.id = investment_id and i.user_id = (select auth.uid()))
  );
drop policy if exists "Users can update their own investment history" on public.investment_txns;
create policy "Users can update their own investment history" on public.investment_txns for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.investments i where i.id = investment_id and i.user_id = (select auth.uid()))
  );
drop policy if exists "Users can delete their own investment history" on public.investment_txns;
create policy "Users can delete their own investment history" on public.investment_txns for delete
  using ((select auth.uid()) = user_id);

-- ----- 3. Loans -----
create table if not exists public.loans (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type                 text not null check (type in ('home', 'vehicle', 'personal', 'gold', 'education', 'creditcard', 'business', 'agri', 'private', 'consumer', 'other')),
  name                 text not null check (char_length(name) between 1 and 80),   -- bank / lender
  principal            numeric(14, 2) not null check (principal > 0),              -- amount borrowed
  rate                 numeric(6, 3) not null default 0 check (rate between 0 and 100), -- yearly interest %
  style                text not null default 'emi' check (style in ('emi', 'interest_only', 'bullet', 'manual')),
  started_on           date not null default current_date,
  tenure_months        smallint check (tenure_months is null or tenure_months between 1 and 600),
  emi                  numeric(14, 2) check (emi is null or emi > 0),
  emi_day              smallint check (emi_day is null or emi_day between 1 and 31),
  balance              numeric(14, 2) check (balance is null or balance >= 0),     -- "I'll update the balance" style
  balance_on           date,
  closed_on            date,
  note                 text check (note is null or char_length(note) <= 300),
  reminder_routine_id  uuid references public.routines (id) on delete set null,   -- monthly "pay EMI" reminder
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists loans_user_idx on public.loans (user_id);

alter table public.loans enable row level security;

drop policy if exists "Users can read their own loans" on public.loans;
create policy "Users can read their own loans" on public.loans for select
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can add their own loans" on public.loans;
create policy "Users can add their own loans" on public.loans for insert
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own loans" on public.loans;
create policy "Users can update their own loans" on public.loans for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own loans" on public.loans;
create policy "Users can delete their own loans" on public.loans for delete
  using ((select auth.uid()) = user_id);

-- ----- 4. Loan history -----
create table if not exists public.loan_txns (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loan_id         uuid not null references public.loans (id) on delete cascade,
  kind            text not null check (kind in ('payment', 'borrow', 'balance')),
  amount          numeric(14, 2) not null check (amount >= 0),
  on_date         date not null default current_date,
  note            text check (note is null or char_length(note) <= 300),
  money_entry_id  uuid references public.money_entries (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists loan_txns_loan_idx on public.loan_txns (loan_id, on_date);

alter table public.loan_txns enable row level security;

drop policy if exists "Users can read their own loan history" on public.loan_txns;
create policy "Users can read their own loan history" on public.loan_txns for select
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can add their own loan history" on public.loan_txns;
create policy "Users can add their own loan history" on public.loan_txns for insert
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.loans l where l.id = loan_id and l.user_id = (select auth.uid()))
  );
drop policy if exists "Users can update their own loan history" on public.loan_txns;
create policy "Users can update their own loan history" on public.loan_txns for update
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.loans l where l.id = loan_id and l.user_id = (select auth.uid()))
  );
drop policy if exists "Users can delete their own loan history" on public.loan_txns;
create policy "Users can delete their own loan history" on public.loan_txns for delete
  using ((select auth.uid()) = user_id);

-- ----- Keep owner and created time, remember when it changed -----
create or replace function public.portfolio_before_update()
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

drop trigger if exists investments_before_update on public.investments;
create trigger investments_before_update
  before update on public.investments
  for each row execute function public.portfolio_before_update();

drop trigger if exists loans_before_update on public.loans;
create trigger loans_before_update
  before update on public.loans
  for each row execute function public.portfolio_before_update();

-- ----- 5. Settings -----
alter table public.user_settings
  add column if not exists gold_rate numeric(12, 2) check (gold_rate is null or gold_rate > 0),       -- ₹ per gram
  add column if not exists silver_rate numeric(12, 2) check (silver_rate is null or silver_rate > 0), -- ₹ per gram
  add column if not exists metal_rate_on date,
  add column if not exists show_80c boolean not null default true,
  add column if not exists value_reminder_id uuid references public.routines (id) on delete set null;

-- ----- 6. Free plan: 3 investments, 3 loans -----
create or replace function private.limit_investments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_pro(new.user_id)
     and (select count(*) from public.investments where user_id = new.user_id) >= 3 then
    raise exception 'free_limit_investments';
  end if;
  return new;
end;
$$;

create or replace function private.limit_loans()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_pro(new.user_id)
     and (select count(*) from public.loans where user_id = new.user_id) >= 3 then
    raise exception 'free_limit_loans';
  end if;
  return new;
end;
$$;

drop trigger if exists investments_free_limits on public.investments;
create trigger investments_free_limits
  before insert on public.investments
  for each row execute function private.limit_investments();

drop trigger if exists loans_free_limits on public.loans;
create trigger loans_free_limits
  before insert on public.loans
  for each row execute function private.limit_loans();
