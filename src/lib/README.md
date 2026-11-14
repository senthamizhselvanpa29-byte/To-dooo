# src/lib — Helpers and connections

| File | What it does |
|---|---|
| `supabase/client.js` | Supabase connection in the browser |
| `supabase/server.js` | Supabase connection on the server |
| `supabase/proxy.js` | Login guard — runs before every page (private pages, keep-me-signed-in) |
| `supabase/config.js` | Reads the Supabase keys |
| `i18n.js` | Language list and translation helper |
| `dailyQuote.js` | Picks today's quote |
| `galaxy.js` | Draws the 3D galaxy |
| `validation.js` | Checks email, phone number and password |
| `authErrors.js` | Turns login errors into friendly messages |
| `googleSignIn.js` | "Continue with Google" |
| `rememberMe.js` | "Keep me signed in" tick box |
| `tasks.js` | Reads and saves tasks and lists in the database |
| `routines.js` | Daily habits and repeating tasks: shift-aware times, "does it happen on this day?", making each day's copies |
| `reports.js` | Weekly / monthly report numbers and day colours (🟢 80%+, 🟡 50–79%, 🔴 under 50%) |
| `benefits.js` | Finds the 💡 benefit line for a task name |
| `money.js` | 💰 Money: saving and loading, money month (1st or salary day), totals, budget colours, ₹ format, ⭐ frequent |
| `moneyParse.js` | 💰 Calculator (120+45), smart add ("petrol 500 upi" in 5 languages), which tasks are bills |
| `portfolio.js` | 📈 Investment values (FD / RD / PPF interest, units × NAV, gold rate), returns + yearly return, loan EMI / interest / end date, net worth, 80C |
| `plans.js` | Prices, free trial, Free limits, "is this user Pro?" |
| `razorpay.js` | Talks to Razorpay — **server only** (create order, check payment) |
| `clash.js` | Clash check rules: which plan moves, free-day suggestions |
| `dates.js` | Date and time helpers, quick time buttons, evening glow |
| `safeRedirect.js` | Makes sure email links only go to our own pages |

Coming later: `ai` (after launch).
