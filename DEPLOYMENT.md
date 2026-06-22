# Aurevon Studios — Deployment Guide

The project has **two separate deployments**:

1. **Frontend (Vite/React)** → Vercel
2. **PDF Server (Express + Puppeteer)** → Railway / Render / VPS

---

## 1. Frontend — Vercel

### Environment variables (set in Vercel Dashboard → Settings → Environment Variables)

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |
| `VITE_PDF_SERVER_URL` | Full URL of your deployed PDF server (e.g. `https://aurevon-pdf.railway.app`) |

### Deploy steps

```bash
# 1. Install Vercel CLI (optional, can also connect via GitHub)
npm i -g vercel

# 2. From project root
vercel --prod
```

`vercel.json` is already configured:
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites: all routes → `index.html`

---

## 2. PDF Server — Railway (recommended)

The PDF server (`server/pdf-server.js`) uses Puppeteer + Chromium.
It **cannot** run on Vercel serverless (binary size + execution limits).

### Deploy to Railway

1. Create a new Railway project
2. Connect the **same GitHub repo** — set the root directory to `server/`
3. Set environment variable: `PORT=3001` (Railway sets this automatically)
4. Railway auto-detects `server/package.json` and runs `npm start`

Railway provides a free-tier public URL — copy it into `VITE_PDF_SERVER_URL` on Vercel.

### Deploy to Render

1. New Web Service → connect repo
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node pdf-server.js`
5. Add Chromium build pack or use `puppeteer` with `--no-sandbox` (already configured)

### Deploy to a VPS (Ubuntu)

```bash
cd server/
npm install
# Install Chromium dependencies
apt-get install -y libgbm-dev libnss3 libasound2
node pdf-server.js
# Use pm2 or systemd to keep it running
```

---

## 3. Supabase

No changes required. The existing Supabase project works as-is.

Make sure Row Level Security (RLS) is configured appropriately for production.

---

## 4. Local development

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — PDF server
npm run pdf-server-dev

# .env should have:
# VITE_PDF_SERVER_URL=http://localhost:3001
```

---

## 5. Build check

```bash
npm run build
# Should produce dist/ with no TypeScript errors
```

---

## Known limitations

- **PDF server cold starts**: On Railway/Render free tier, the server may take 5–10 seconds to wake up after inactivity. The first PDF after a cold start will be slow.
- **Puppeteer on serverless**: Not supported. Always use a persistent server process.
- **Supabase RLS**: In production, ensure the anon key only has permissions you intend to expose.
