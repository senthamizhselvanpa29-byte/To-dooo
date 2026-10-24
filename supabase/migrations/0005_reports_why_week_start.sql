-- ============================================================
-- VdoU DATABASE SETUP — Step 5: reports, "why", postpone message
--
-- HOW TO RUN (one time only, after Step 4):
--   Supabase → your project → SQL Editor → New query →
--   paste this whole file → click "Run".
--
-- What it does:
--   1. Settings remember which day your week starts (Monday or Sunday)
--      — used by the weekly report and the calendar.
--   2. Every task can have your own "Why am I doing this?" note.
--   3. Tasks remember when the "You moved this 4 times" message was
--      last answered, so it doesn't keep asking.
-- ============================================================

-- ----- 1. Week starts on: 1 = Monday, 0 = Sunday -----
alter table public.user_settings
  add column if not exists week_start smallint not null default 1;

alter table public.user_settings drop constraint if exists user_settings_week_start_check;
alter table public.user_settings add constraint user_settings_week_start_check check (week_start in (0, 1));

-- ----- 2. My own reason for a task -----
alter table public.tasks
  add column if not exists why text;

alter table public.tasks drop constraint if exists tasks_why_length;
alter table public.tasks add constraint tasks_why_length check (why is null or char_length(why) <= 500);

-- ----- 3. Postpone message: number of moves when it was last answered -----
alter table public.tasks
  add column if not exists nudged_at_count integer not null default 0;
