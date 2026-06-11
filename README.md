# AUREVON Studio

A premium marketing website for AUREVON - built with **React 19 + Vite + TanStack Router (SPA)** and **Tailwind CSS v4**. Form submissions are stored in **Supabase**.

---

## 1. Local development

```bash
npm install
cp .env.example .env       # then fill in your Supabase keys
npm run dev
```

Open http://localhost:5173

---

## 2. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel → **Add New… → Project** → import the repo.
3. Vercel auto-detects Vite. Confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Add Environment Variables** (Project Settings → Environment Variables):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your Supabase `anon` public key |
5. Deploy. The included `vercel.json` ensures every route (`/services`, `/portfolio`, `/admin`, etc.) falls back to `index.html` - this is what fixes the 404 you were seeing.
6. After it goes live, any later push to your main branch redeploys automatically.

> If you ever change env vars in Vercel, you must **redeploy** for them to take effect (Vercel → Deployments → ⋯ → Redeploy).

---

## 3. Connect your Supabase backend

### 3.1 Create a project

1. Go to https://supabase.com → **New project**.
2. Copy:
   - **Project URL** → goes into `VITE_SUPABASE_URL`
   - **anon public** key (Project Settings → API) → goes into `VITE_SUPABASE_PUBLISHABLE_KEY`

Paste both into:

- `.env` (local dev)
- Vercel → Project Settings → Environment Variables (production)

### 3.2 Create the database table

Open **Supabase Dashboard → SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.

This creates one table - `public.contact_submissions` - and sets up:

- Row Level Security (RLS)
- A policy allowing **anyone** to submit the form (anonymous insert)
- A policy allowing **logged-in admins** to read and delete submissions
- An index on `created_at` for fast sorting in the admin dashboard

### 3.3 Create your admin login

Supabase Dashboard → **Authentication → Users → Add user → Create new user**.

- Email: `you@aurevon.studio` (or any email)
- Password: pick a strong password
- ✅ **Auto Confirm User** - important, or you can't log in.

That account is your admin. You can add more later the same way.

> Optional hardening: in **Authentication → Providers → Email**, disable **Allow new users to sign up** so only you can create admins.

---

## 4. Where do client submissions go?

- Every form submission on `/contact` writes a row to `public.contact_submissions`.
- View them two ways:
  1. **Live admin dashboard** at `https://yourdomain.com/admin` - sign in with the Supabase user you created. You get:
     - Stats (total / this week / unique businesses)
     - Searchable table of every lead
     - Click a row → detail drawer with Reply / Delete
     - **Export CSV** button
  2. **Supabase Dashboard → Table Editor → contact_submissions** - raw table view.

The `/admin` route is **not linked anywhere** in the public navigation. Bookmark it.

---

## 5. Updating contact details

Edit `src/lib/contact-info.ts` - email, phone, WhatsApp number, and location all live there.

---

## 6. Project structure (short)

```
src/
  routes/              ← file-based routes (index, services, portfolio, process, contact, admin)
  components/site/     ← Navbar, Footer, Hero, sections
  components/ui/       ← shadcn-style primitives (available, currently unused by site pages)
  integrations/supabase/client.ts  ← Supabase browser client
  lib/                 ← contact info, portfolio data, useMeta hook, utils
supabase/schema.sql    ← run this once in Supabase SQL editor
vercel.json            ← SPA fallback (fixes the 404 on refresh)
```

---

## What changed vs. the previous build (why your 404 went away)

The previous project used **TanStack Start** (SSR + a serverless Worker bundle). Vercel was returning 404 because that build output didn't match a static Vercel deployment - there was no `index.html` served at every route.

This project is a clean **client-rendered SPA**:

- Single `index.html` entrypoint
- `vercel.json` rewrites every path to `/index.html` so TanStack Router can take over on the client
- All form/admin logic uses the Supabase **browser** client + RLS - no server functions, no edge runtime

That removes every deployment surface that was breaking on Vercel.
