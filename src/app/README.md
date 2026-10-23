# src/app — Pages and back end

Each folder with a `page.js` is a page of the website. The folder name is the web address.

| Folder | Web address | Page |
|---|---|---|
| `(auth)/login/` | `/login` | Log in |
| `(auth)/signup/` | `/signup` | Sign up |
| `(auth)/forgot-password/` | `/forgot-password` | Forgot password |
| `(auth)/reset-password/` | `/reset-password` | Choose a new password (from the email link) |
| `(auth)/complete-profile/` | `/complete-profile` | Add phone number (Google sign-ups) |
| `(auth)/terms/`, `(auth)/privacy/` | `/terms`, `/privacy` | Terms and Privacy (text coming in Week 7) |
| `today/` | `/today` | The planner's front page (Today) |
| `upcoming/` | `/upcoming` | Next 7 days, Later, and the calendar |
| `lists/` | `/lists` | Lists (Home, Work, Study…) |
| `settings/` | `/settings` | My shift, my daily routine, repeating tasks |
| `auth/callback/`, `auth/confirm/` | — | Handle email links and Google login (no screen) |

Other files:
- `layout.js` — wraps every page (language, theme, fonts)
- `(auth)/layout.js` — galaxy + quote + card frame for the account pages
- `globals.css` — all styles
- `page.js` — the home address `/` (sends you to `/today` or `/login`)

Folders in brackets like `(auth)` group pages without changing the web address.
