# supabase — Database setup

Files here create the database tables. They run **on Supabase**, not in the app.

| File | What it creates |
|---|---|
| `migrations/0001_profiles.sql` | `profiles` table — each user's full name and phone number |
| `migrations/0003_lists_steps_duration.sql` | `lists` table, steps inside big plans, and "How long?" for the clash check |
| `migrations/0002_tasks.sql` | `tasks` table — every task (date + time, colour, glass / rubber) and the postpone tracker |

**How to run a file:** Supabase → your project → **SQL Editor** → New query →
paste the whole file → **Run**. Run each file once, in number order.

More tables (lists, routines, subscriptions) will be added here in later weeks.
