# supabase — Database setup

Files here create the database tables. They run **on Supabase**, not in the app.

| File | What it creates |
|---|---|
| `migrations/0001_profiles.sql` | `profiles` table — each user's full name and phone number |

**How to run a file:** Supabase → your project → **SQL Editor** → New query →
paste the whole file → **Run**. Run each file once, in number order.

More tables (lists, tasks, subscriptions) will be added here in later weeks.
