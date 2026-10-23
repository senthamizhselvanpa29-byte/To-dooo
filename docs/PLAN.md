# VdoU — Project Plan

> "Plan your life in 2 taps." A simple, low-cost life planner for everyone.

## 1. Decisions

| Item | Decision |
|---|---|
| App name | **VdoU** |
| Who it's for | Everyone |
| Main idea | Low cost and simple to use — not complex like Notion |
| Languages (launch) | English, Tamil, Malayalam, Telugu, Hindi (more later) |
| Deadline | Launch within 2 months |
| Code style | Every file has simple-English headings and notes |

## 2. Prices

| Plan | Price |
|---|---|
| Free | ₹0 |
| Pro — Monthly | ₹199 / month |
| Pro — Yearly | ₹1,499 / year |
| Pro — Lifetime | ₹15,000 one time |

- AI limit for lifetime users: **100 AI uses per month**.
- Payments through **Razorpay** (UPI, cards, net banking).
- Ask an accountant about GST once income starts.

## 3. Free vs Pro

| Feature | Free | Pro |
|---|---|---|
| Unlimited tasks (every task has date + time) | ✅ | ✅ |
| 🔴 / 🟡 / 🟢 colours and 🔮 glass / 🏀 rubber | ✅ | ✅ |
| Today / Upcoming views | ✅ | ✅ |
| Clash check + new date suggestions | ✅ | ✅ |
| Postpone tracker | ✅ | ✅ |
| Benefits library (common daily tasks) | ✅ | ✅ |
| Night planning (5 minutes) | ✅ | ✅ |
| Mini Jarvis lite (morning + evening messages) | ✅ | ✅ |
| Weekly report | ✅ | ✅ |
| All 5 languages, phone + computer sync, light / dark | ✅ | ✅ |
| Daily routine habits | Up to 5 | Unlimited |
| Lists / projects | Up to 3 | Unlimited |
| Big plans with steps inside | Up to 3 steps | Unlimited |
| Monthly report + full history | — | ✅ |
| Calendar view (week / month) | — | ✅ |
| Email reminders | — | ✅ |
| AI features (after launch) | — | ✅ |

## 4. Technology

| Part | Tool | What it does |
|---|---|---|
| Website + back end | Next.js (React + Node) | The app screens and the secret server code, in one project |
| Database + login | Supabase | Saves tasks and users; email and Google login |
| Payments | Razorpay | Subscriptions and lifetime payments |
| Hosting | Vercel | Puts the app online |
| AI (later) | Claude or OpenAI | Smart planning features |

## 5. Eight-week schedule (updated 23 Oct 2026)

| Week | Work | Status |
|---|---|---|
| 0 | Plan + project folders | ✅ Done |
| 1 | Login: email + Google, sign-up, 5 languages, daily quotes | ✅ Done and online |
| 2 | Today page: add / edit / delete / tick tasks, date + time required, colours, glass / rubber, Plan tomorrow box, postpone tracker | ✅ Built — run supabase/migrations/0002_tasks.sql |
| 3 | Upcoming, Lists, big plans with steps, clash check, calendar view | ✅ Built — run supabase/migrations/0003_lists_steps_duration.sql |
| 4 | Daily routine setup, repeating tasks, night planning, night-shift settings | ⬜ |
| 5 | Postpone tracker, weekly / monthly reports, benefits library | ⬜ |
| 6 | Razorpay payments, Free vs Pro limits | ⬜ |
| 7 | Mini Jarvis lite, reminders, home page, privacy / terms, email service, Google verification | ⬜ |
| 8 | Testing, native speakers check translations, **launch** 🚀 | ⬜ |

## 6. After launch (updates)

1. Full Jarvis: AI chat + voice ("Remind me to pay rent on the 5th at 9 AM, red")
2. AI benefits for any task, AI smart rescheduling, "plan my week"
3. Share lists with family or team
4. Phone notifications
5. Android / iPhone app
6. Google Calendar sync
7. More languages and themes

## 7. Accounts

| Service | Status |
|---|---|
| GitHub | ✅ |
| Razorpay | ✅ Created (KYC approval pending) |
| Supabase | ✅ |
| Vercel | ✅ |
| Domain (vdou.app / .in / .com) | ⬜ Check and buy |

**Safety rule:** secret keys (passwords from Supabase, Razorpay, etc.) are never typed into chat
and never saved in GitHub. They go only into Vercel's settings and a private `.env.local` file.

## 8. Login and sign-up (decided)

Design is based on `prototype/login/` (galaxy background, quote, logo, 5 languages, dark/light mode).

**Login page**
- Email + password, "Continue with Google", "Forgot password" (real reset email)
- On phones the login box shows first, with a short quote above it
- Fewer galaxy stars on phones so it runs smoothly; fix the small box glitch in the galaxy

**Daily quote**
- 365 quotes, a new one each day, the same for everyone (changes at midnight India time)
- Each quote in all 5 languages, kept in one easy-to-edit file
- Native speakers to check Tamil, Malayalam, Telugu and Hindi before launch

**Sign-up page** (same galaxy design)

| Field | Required |
|---|---|
| Full name | Yes |
| Email | Yes |
| Phone number (+91 pre-filled) | Yes |
| Password + confirm password | Yes |
| Agree to Terms & Privacy Policy | Yes |

- Phone number is saved but not checked by OTP at launch (OTP costs per SMS; can add later)
- More details (date of birth, city, etc.) can be added later in Settings

## 9. Smart features (decided 23 Oct 2026)

| # | Feature | How it works |
|---|---|---|
| 1 | **Postpone tracker** | Every time a task is moved later, VdoU remembers how much. Shown on the task: "Postponed 3 times · 2 days 5 hrs late". |
| 2 | **Reports** | Weekly (every Sunday) and monthly: done vs pending by 🔴 / 🟡 / 🟢, on time vs late, most postponed task, best day. |
| 3 | **Benefits** | Common daily tasks (water, walking, reading, sleep…) show their benefits, e.g. 💧 "Drinking water keeps you energetic and helps digestion". About 100 tasks, all 5 languages. AI benefits for any task come after launch. |
| 4 | **Glass vs rubber ball** | Every task is 🔮 Glass (can't be dropped or moved: health, family, friends) or 🏀 Rubber (can be moved). Separate from the colour. When the day is too full, VdoU suggests moving rubber tasks, never glass. |
| 5 | **Daily routine first** | First login asks wake-up, brush, meals, exercise, sleep times and creates the daily routine automatically. Free: 5 habits. Pro: unlimited. |
| 6 | **Colours everywhere** | 🔴 High · 🟡 Medium · 🟢 Low on every task and plan. |
| 7 | **Linked plans** | (a) **Clash check**: two plans at the same date / time → warning. Day plans (All day / Many days) only clash with other day plans; time tasks only with time tasks at the same time; the lower one (colour, then rubber before glass) gets new free dates suggested. (b) **Big plans with steps**: e.g. Vacation → Book tickets, Pack bags, Book hotel. |
| 8 | **Mini Jarvis** | Launch: morning briefing and evening summary messages (no AI cost). After launch: AI chat + voice. |
| 9 | **Deadline required** | Every task MUST have a date AND a time — it will not save without both. No automatic time. |
| 10 | **Night planning** | When the app is opened at night: "Let's plan tomorrow" — a 5-minute guided session to give every task a time and a reminder. |
| 11 | **Night-shift setting** | Each user sets their own "day start" and "planning time" (e.g. night-shift worker plans at 8 AM). Morning / evening messages and night planning follow these times. |
