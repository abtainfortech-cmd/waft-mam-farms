# WAFT MAM Farms — Deployment Guide

This guide walks you through deploying the app to **Vercel** with a **Neon PostgreSQL** database.
After deployment, the app will be live 24/7 at `https://your-app.vercel.app` — no more "Network error".

---

## Prerequisites (free accounts)

1. **Vercel** — https://vercel.com (host the Next.js app)
2. **Neon** — https://neon.tech (host the PostgreSQL database)
3. **GitHub** — https://github.com (push the code so Vercel can deploy from it)

> All three have generous free tiers. The whole stack costs $0/month for a single-farm operation.

---

## Step 1 — Create a Neon database

1. Go to https://neon.tech and sign in with GitHub.
2. Click **New Project** → name it `waft-mam-farms` → pick the region closest to Ghana (probably `AWS Asia Pacific (Singapore)` or `AWS US East` — Singapore has lower latency to West Africa).
3. Once created, you'll see a **Connection Details** panel. Copy BOTH strings:
   - **Pooled connection** (has `?pgbouncer=true`) — this is your `DATABASE_URL`
   - **Direct connection** (no pgbouncer) — this is your `DIRECT_URL`

> ⚠️ Keep these strings secret. They include your database password.

---

## Step 2 — Push the code to GitHub

```bash
cd /home/z/my-project
git init
git add .
git commit -m "WAFT MAM Farms — production-ready with PostgreSQL"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/waft-mam-farms.git
git push -u origin main
```

> Don't forget to add a `.gitignore` that excludes `.env`, `node_modules/`, `.next/`, and `db/`.

---

## Step 3 — Create the database schema (run once, locally)

Run the migration against your Neon database from your local machine:

```bash
# Set env vars in your local shell (or put them in .env temporarily)
export DATABASE_URL="postgresql://...pgbouncer=true..."   # pooled
export DIRECT_URL="postgresql://...direct..."             # direct

# Create all tables in your Neon database
npx prisma migrate deploy

# Optional: open Prisma Studio to verify tables exist
npx prisma studio
```

After this step, your Neon database has all tables (Staff, Farm, DailyEggCollection, etc.) but they're empty.

---

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New** → **Project** → import your `waft-mam-farms` repository.
3. Vercel will auto-detect Next.js. Leave defaults, but expand **Environment Variables** and add:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `DATABASE_URL` | (your pooled Neon URL) | Production, Preview, Development |
   | `DIRECT_URL` | (your direct Neon URL) | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |

4. Click **Deploy**. The first build takes ~2–3 minutes.
5. When done, Vercel gives you a URL like `https://waft-mam-farms.vercel.app`.

---

## Step 5 — Seed the database (one time only)

Open your deployed app in the browser. The home page automatically calls `/api/seed` on load, which will:
- Create 5 staff accounts (ceo/sales/farmhand/accountant/vet)
- Create 3 sample farm locations (Kumasi, Accra, Tamale)
- Create 7 bird flocks
- Create 6 customers
- Generate 30 days of sample egg/bird sales, expenses, mortality, feed records, health checks, vaccinations, treatments
- Create 3 announcements

You should now be able to log in:

| Role | Username | Password |
|------|----------|----------|
| CEO | `ceo` | `ceo123` |
| Sales | `sales` | `sales123` |
| Farm Hand | `farmhand` | `farm123` |
| Accountant | `accountant` | `acc123` |
| Vet | `vet` | `vet123` |

> ⚠️ Change these passwords immediately after first login via **CEO → Access Control**.

---

## Step 6 — Going live checklist

- [ ] Changed CEO password from `ceo123` to something secure
- [ ] Edited farm name under **CEO → Settings → Farm Name** (e.g. your real business name)
- [ ] Renamed/added/deleted farm locations under **CEO → Settings → Farm Locations** to match your real sites
- [ ] Optional: Used **CEO → Settings → Full Data Reset** to wipe the 30 days of sample data before going live with real records

---

## Optional — Custom domain

1. In Vercel, go to **Project Settings → Domains**.
2. Add your domain (e.g. `waftmamfarms.com`).
3. Update your DNS provider's CNAME/A records as Vercel instructs.
4. Vercel auto-provisions HTTPS.

---

## Troubleshooting

**"Prisma cannot reach database"** — Your Vercel env vars are missing or wrong. Re-check `DATABASE_URL` and `DIRECT_URL` in Vercel Project Settings.

**"Migration failed"** — Make sure you ran `npx prisma migrate deploy` against the correct Neon project. The `DIRECT_URL` must point to the same Neon project as `DATABASE_URL`.

**Login fails with "Invalid username or password"** — The seed didn't run. Visit the home page (which auto-triggers `/api/seed`), wait 5 seconds, then try again.

**App works but data disappears** — You're hitting the Neon free-tier autosuspend (5 min idle). The first request after idle takes ~1s extra to wake the DB. Subsequent requests are instant. Upgrade to Neon's Pro tier if this is unacceptable.

**Want to inspect the database directly** — `npx prisma studio` from your local machine (with env vars set) opens a visual editor for all tables.
