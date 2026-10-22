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
| `safeRedirect.js` | Makes sure email links only go to our own pages |

Coming later: `razorpay` (payments, Week 6), `plans` (Free vs Pro limits), `ai` (after launch).
