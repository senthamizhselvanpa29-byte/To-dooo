# VdoU — Setup Guide (connect login and put the app online)

Do these steps in order. Each step says exactly where to click.
**Never paste keys into a chat or into GitHub.**

---

## Step 1 — Create the database table (Supabase, 2 minutes)

1. Open **supabase.com** → your project.
2. Left menu → **SQL Editor** → **New query**.
3. Open the file `supabase/migrations/0001_profiles.sql` from this project, copy everything, paste it in.
4. Click **Run**. You should see "Success. No rows returned".

## Step 2 — Copy your two Supabase keys (you'll paste them in Step 3)

1. Supabase → your project → **Project Settings** (gear icon) → **API Keys** / **Data API**.
2. Copy these two values somewhere private (e.g. a note on your own phone):
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Publishable key** (or **anon public** key) — a long text
3. ⚠️ Do NOT copy the **secret** / **service_role** key. The app doesn't need it.

## Step 3 — Put the app online (Vercel, 5 minutes)

1. Open **vercel.com** → **Add New…** → **Project**.
2. Find **To-dooo** in the list → **Import**.
3. Open **Environment Variables** and add these two:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from Step 2 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your Publishable key from Step 2 |

4. Click **Deploy**. After about 1–2 minutes you get a link like `https://to-dooo.vercel.app`.
5. Copy that link — you need it in Step 4.

> Our work is on the branch `claude/intelligent-mendel-701tm2`. Vercel shows it as a
> **Preview** link (Vercel → Project → **Deployments**). When we merge it into `main`,
> it becomes the main link.

## Step 4 — Tell Supabase your website address

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: paste your Vercel link (e.g. `https://to-dooo.vercel.app`).
3. **Redirect URLs** → **Add URL**, add both:
   - `https://to-dooo.vercel.app/**`  (your link + `/**`)
   - `https://*-senthamizhselvanpa29-bytes-projects.vercel.app/**`  (preview links — copy the exact ending from a Vercel preview link)
4. **Save**.

Now email sign-up, login and "forgot password" work. ✅

## Step 5 — "Continue with Google" (15 minutes, optional for now)

1. Open **console.cloud.google.com** → create a project called **VdoU**.
2. **APIs & Services** → **OAuth consent screen** → External → fill app name **VdoU**, your email → Save.
3. **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
4. Under **Authorized redirect URIs**, add the address Supabase shows you at:
   Supabase → **Authentication** → **Sign In / Providers** → **Google** (it looks like
   `https://abcdefgh.supabase.co/auth/v1/callback`).
5. Click **Create**. Copy the **Client ID** and **Client secret**.
6. Back in Supabase → **Google** → turn it **on**, paste Client ID and Client secret → **Save**.

## Step 6 — Email links that work on any device (recommended)

By default, a "confirm your email" link only works in the same browser where the person
signed up. To make it work on any phone or computer:

1. Supabase → **Authentication** → **Emails** → **Templates**.
2. **Confirm signup** — replace the link with:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
3. **Reset password** — replace the link with:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
4. Save.

---

## Running the app on your own computer (optional)

1. Install **Node.js** (version 20 or newer) from nodejs.org.
2. In the project folder, copy `.env.example` to a new file named `.env.local` and fill in the two keys.
3. Open a terminal in the folder and run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000
