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
| Unlimited tasks | ✅ | ✅ |
| Due dates and priority | ✅ | ✅ |
| Today / Upcoming / Done views | ✅ | ✅ |
| All 5 languages | ✅ | ✅ |
| Phone + computer sync | ✅ | ✅ |
| Light / dark mode | ✅ | ✅ |
| Lists / projects | Up to 3 | Unlimited |
| Repeating tasks | — | ✅ |
| Subtasks | — | ✅ |
| Calendar view (week / month) | — | ✅ |
| Email reminders | — | ✅ |
| AI planning (after launch) | — | ✅ |

## 4. Technology

| Part | Tool | What it does |
|---|---|---|
| Website + back end | Next.js (React + Node) | The app screens and the secret server code, in one project |
| Database + login | Supabase | Saves tasks and users; email and Google login |
| Payments | Razorpay | Subscriptions and lifetime payments |
| Hosting | Vercel | Puts the app online |
| AI (later) | Claude or OpenAI | Smart planning features |

## 5. Eight-week schedule

| Week | Work | Status |
|---|---|---|
| 0 | Plan + project folders | ✅ Done |
| 1 | Project setup, database, login (email + Google) | ⬜ |
| 2 | Tasks: add, edit, delete, complete, due date, priority | ⬜ |
| 3 | Lists, Today / Upcoming views, phone-friendly design | ⬜ |
| 4 | 5 languages, light / dark mode | ⬜ |
| 5 | Pro features: repeating tasks, subtasks, calendar view | ⬜ |
| 6 | Razorpay payments, Free vs Pro limits | ⬜ |
| 7 | Email reminders, home page, privacy policy, terms | ⬜ |
| 8 | Testing, fixing, **launch** 🚀 | ⬜ |

## 6. After launch (updates)

1. AI: "plan my week", break big tasks into steps, suggest priorities
2. Share lists with family or team
3. Phone notifications
4. Android / iPhone app
5. Productivity stats
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
