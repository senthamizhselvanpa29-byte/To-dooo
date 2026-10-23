# VdoU — "Where do I change…?" Guide

Every code file starts with a heading that says what it does, in simple English.
This page tells you which file to open.

## Words and languages

| I want to change… | Open this file |
|---|---|
| A word or sentence in English | `src/locales/en.js` |
| A word in Tamil / Malayalam / Telugu / Hindi | `src/locales/ta.js` · `ml.js` · `te.js` · `hi.js` |
| The daily quotes | `src/data/quotes.js` (search for "Day 45" etc.) |
| Add a new language | Steps at the top of `src/lib/i18n.js` |

## Look and feel

| I want to change… | Open this file |
|---|---|
| Colours, sizes, spacing, effects | `src/app/globals.css` |
| Brand colours (blue / green) | `src/app/globals.css` → the `--vdou-...` lines at the top |
| The logo | Replace `public/logo.png` (keep the same name) |
| The galaxy (number of stars, speed, colours) | `src/lib/galaxy.js` → `SETTINGS` at the top |
| Browser tab title / description | `src/app/layout.js` → `metadata` |

## Pages

| Page | Web address | Page file | Form / content |
|---|---|---|---|
| Login | `/login` | `src/app/(auth)/login/page.js` | `src/components/auth/LoginForm.js` |
| Sign up | `/signup` | `src/app/(auth)/signup/page.js` | `src/components/auth/SignupForm.js` |
| Forgot password | `/forgot-password` | `src/app/(auth)/forgot-password/page.js` | `src/components/auth/ForgotPasswordForm.js` |
| New password | `/reset-password` | `src/app/(auth)/reset-password/page.js` | `src/components/auth/ResetPasswordForm.js` |
| Add phone (Google users) | `/complete-profile` | `src/app/(auth)/complete-profile/page.js` | `src/components/auth/CompleteProfileForm.js` |
| Terms / Privacy | `/terms`, `/privacy` | `src/app/(auth)/terms/page.js` … | (text coming in Week 7) |
| Today (planner) | `/today` | `src/app/today/page.js` | `src/components/today/TodayBoard.js` (parts in `src/components/today/`) |
| Upcoming + calendar | `/upcoming` | `src/app/upcoming/page.js` | `src/components/upcoming/UpcomingBoard.js`, `CalendarView.js` |
| Lists | `/lists` | `src/app/lists/page.js` | `src/components/lists/ListsBoard.js` |
| Edit panel, steps, clash window (all pages) | — | — | `src/components/tasks/` |

## Rules and settings

| I want to change… | Open this file |
|---|---|
| Minimum password length | `src/lib/validation.js` → `MIN_PASSWORD_LENGTH` |
| Phone number rules | `src/lib/validation.js` → `normalizePhone` |
| Which pages need login | `src/lib/supabase/proxy.js` → `PRIVATE_PAGES` |
| Quick time buttons (Morning 9:00…) | `src/lib/dates.js` → `QUICK_TIMES` |
| When "Plan tomorrow" glows (6 PM) | `src/lib/dates.js` → `EVENING_HOUR` |
| Planner colours (red / yellow / green) | `src/app/globals.css` → `--prio-high` / `--prio-medium` / `--prio-low` |
| Clash rules (which plan moves, how many free days) | `src/lib/clash.js` |
| "How long?" choices | `src/lib/dates.js` → `DURATIONS` |
| List icons to choose from | `src/components/lists/ListsBoard.js` → `LIST_EMOJIS` |
| Days shown one by one on Upcoming | `src/components/upcoming/UpcomingBoard.js` → `DAYS_SHOWN` |
| Menu items (Today, Upcoming, Lists) | `src/components/app/AppShell.js` → `MENU` |
| Login error messages | Words: `src/locales/*.js` · Which error shows: `src/lib/authErrors.js` |
| Database tables | `supabase/migrations/` (see `supabase/README.md`) |
| Secret keys | Never in files! Vercel → Settings → Environment Variables (see `docs/SETUP.md`) |
