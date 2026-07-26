# How to Put Your Farm App on the Internet (15 minutes, no coding)

Right now your app works only inside this chat. When the chat stops, the app stops — that's why you keep seeing "Network error".

To fix this **permanently**, we need to put the app on the internet. After that, you can open it any time from your phone or computer, just like any website.

You will need to create **two free accounts** and click a few buttons. No coding. No technical words. Just follow the pictures below.

---

## What you'll need

- An email address (Gmail, Outlook, Yahoo — anything works)
- 15 minutes of time
- This guide open on your phone while you do the steps on a computer

---

## Step 1 — Create a free database (5 minutes)

Your farm records need to live somewhere safe. We'll use a free service called **Neon**.

1. Open this link in a new tab: **https://neon.tech**
2. Click the **"Sign up"** button (top right corner).
3. Click **"Continue with GitHub"** or **"Continue with Google"** — whichever is faster for you. (If you don't have either, create a Gmail account first — it's free.)
4. Once logged in, you'll see a page asking to create your first project. Fill it in:
   - **Name**: type `waft-mam` (or anything you like)
   - **Region**: pick **Singapore (AWS Asia Pacific)** — this gives the fastest connection from Ghana
   - **Postgres version**: leave it as default
5. Click the green **"Create project"** button.
6. A page will appear with a box that says **"Connection string"**. You'll see TWO tabs/buttons:
   - One says **"Pooled connection"** (this is what the app uses)
   - One says **"Direct connection"** (this is for setting up the database)

   👉 **Copy the Pooled connection string** and paste it somewhere safe (Notepad, Notes app, etc.)
   👉 **Copy the Direct connection string** and paste it somewhere safe too.

   They look like long web links starting with `postgresql://` — that's normal.

✅ **You now have a database.** Keep those two links safe — you'll need them in Step 3.

---

## Step 2 — Put your app code on GitHub (4 minutes)

GitHub is just a free place to store your app's code so the hosting service (Step 3) can grab it.

1. Open this link in a new tab: **https://github.com**
2. Click **"Sign up"** (top right) and create an account with your email.
3. Once logged in, click the **"+"** icon (top right) → **"New repository"**.
4. Fill in:
   - **Repository name**: type `waft-mam-farms`
   - **Private or Public**: pick **Private** (only you can see it)
   - **Add a README file**: leave it UNCHECKED
5. Click the green **"Create repository"** button.

You'll now see an empty page. **Don't close it** — we'll come back here.

✅ **You now have a place to store the code.**

---

### Now: send me the two database links from Step 1

Once you've done Steps 1 and 2, paste the two long links (the `postgresql://...` ones) into this chat. I will:

1. Push the app code to your GitHub repository for you
2. Set up the database tables automatically
3. Give you a single button to click that deploys everything

After that, you'll have a permanent web address like `https://waft-mam-farms.vercel.app` that you can open from any device, any time, forever.

---

## Step 3 — (I'll guide you when you get here)

Once you send me the two database links, I'll do most of the work. You'll just need to:

1. Click one button on **Vercel.com** (a free website host)
2. Pick your GitHub repository from a dropdown
3. Paste the two database links into two boxes
4. Click **"Deploy"**

That's it. About 3 minutes of clicking. Then your app is live on the internet.

---

## After it's live — your first login

Open your new web address (I'll give it to you after Step 3). The first time you open it, the app will automatically create sample data so you can see how everything works.

Log in with:

| Role | Username | Password |
|------|----------|----------|
| CEO (you) | `ceo` | `ceo123` |
| Sales | `sales` | `sales123` |
| Farm Hand | `farmhand` | `farm123` |
| Accountant | `accountant` | `acc123` |
| Vet | `vet` | `vet123` |

Then go to **CEO → Settings** to:
- Change your farm's name to your real business name
- Add your real farm locations (and delete the sample ones)
- Click **"Full Data Reset"** if you want to wipe all the sample data and start fresh

---

## Frequently asked questions

**"Is this really free?"**
Yes. Neon's free tier holds up to 10GB of data (way more than you'll ever need). Vercel's free tier handles 100,000 visits per month. GitHub is free for private repos.

**"Will my data be safe?"**
Yes. Neon backs up your data automatically. Even if your phone is stolen or your computer crashes, your farm records are safe in the cloud.

**"What if I get stuck?"**
Just paste the error message or screenshot into this chat. I'll walk you through it.

**"Do I need to do this every time I want to use the app?"**
No. You do this **once**. After that, you just open the web address and log in — like opening Gmail or Facebook.

**"Can my staff also log in?"**
Yes. Anyone you give a username and password to can log in from their own phone. They just need the web address. The CEO controls who has access under **Access Control**.

---

## Quick summary

1. **Step 1**: Sign up at neon.tech → copy 2 database links (5 min)
2. **Step 2**: Sign up at github.com → create empty repo (4 min)
3. **Paste the 2 links in this chat** — I'll do the rest

Total time on your end: **~10 minutes of clicking**. After that, your app is live forever.
