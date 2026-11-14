# supabase — Database setup

Files here create the database tables. They run **on Supabase**, not in the app.

| File | What it creates |
|---|---|
| `migrations/0001_profiles.sql` | `profiles` table — each user's full name and phone number |
| `migrations/0002_tasks.sql` | `tasks` table — every task (date + time, colour, glass / rubber) and the postpone tracker |
| `migrations/0003_lists_steps_duration.sql` | `lists` table, steps inside big plans, and "How long?" for the clash check |
| `migrations/0004_routine_repeat_settings.sql` | `user_settings` (day / night shift, wake-up time, night planning) and `routines` (daily habits + repeating tasks) |
| `migrations/0005_reports_why_week_start.sql` | Week starts on Monday / Sunday, "Why am I doing this?" on tasks, and the postpone message memory |
| `migrations/0006_plans_payments.sql` | Plans (45-day free trial, monthly, yearly, lifetime), payments, the private server key, and Free limits (5 habits, 3 lists, 3 steps) |
| `migrations/0007_money.sql` | 💰 Money: income & expense entries, your own categories, and money settings (budget, month start day, paid by…) |
| `migrations/0008_portfolio_loans.sql` | 📈 Investments and 🏦 loans with their history, gold / silver rate, 80C on/off, Free limits (3 investments, 3 loans) |

**How to run a file:** Supabase → your project → **SQL Editor** → New query →
paste the whole file → **Run**. Run each file once, in number order.

More tables (subscriptions, reports) will be added here in later weeks.
