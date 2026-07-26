# Your App is Ready — Final 2 Steps

## ✅ What I Just Did For You

- Created your database on Neon (all 16 tables ready)
- Saved your database connection
- Prepared all your app's code in a Git repository, ready to push

You don't need to do anything technical. Just follow the next 2 steps.

---

## Step 1 — Put the code on GitHub (5 minutes)

The code needs to be on GitHub so Vercel can grab it. Use **GitHub Desktop** (a free app — much easier than typing commands).

### 1A. Install GitHub Desktop

1. Go to: **https://desktop.github.com**
2. Click the big blue **"Download for Windows"** (or Mac) button.
3. Run the installer. Just click "Next" through everything.
4. When it opens, sign in with the GitHub account you created earlier.

### 1B. Create a new repository in GitHub Desktop

1. In GitHub Desktop, click **"File"** (top left) → **"New repository"**
2. Fill in:
   - **Name**: `waft-mam-farms`
   - **Local path**: click "Choose…" and select the folder where you want to store the project (e.g. your Documents folder)
   - **Initialize this repository with a README**: leave UNCHECKED
   - **Git ignore**: leave as "None"
   - **License**: leave as "None"
3. Click the blue **"Create repository"** button.

### 1C. Copy the app code into that folder

1. I'll give you a download link (or zip file) of the complete app code.
2. Unzip it.
3. Copy everything inside the unzipped folder.
4. Paste it into the `waft-mam-farms` folder that GitHub Desktop just created (it will be in the location you picked in step 1B).
5. If it asks "Do you want to replace files?" → click **"Replace"** for all.

### 1D. Publish to GitHub

1. Go back to GitHub Desktop.
2. You'll see a long list of files on the left — that's the app code. Good.
3. At the bottom left, type anything in the **"Summary"** box (e.g. `initial code`).
4. Click the blue **"Commit to main"** button.
5. Now click the **"Publish repository"** button (top right).
6. A popup appears. Leave "Keep this code private" CHECKED. Click **"Publish repository"**.

✅ Your code is now on GitHub. (You can verify at https://github.com/YOUR_USERNAME/waft-mam-farms)

---

## Step 2 — Deploy to Vercel (3 minutes)

Now we put the app on the internet.

### 2A. Sign up for Vercel

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** (top right).
3. Click **"Continue with GitHub"** — use the same GitHub account.
4. Authorize Vercel when it asks.

### 2B. Import your project

1. On the Vercel dashboard, click the **"Add New"** button (top right) → **"Project"**.
2. You'll see your `waft-mam-farms` GitHub repo listed under "Import Git Repository".
3. Click the **"Import"** button next to it.

### 2C. Add your database link (IMPORTANT — don't skip)

On the import page, scroll down to **"Environment Variables"**. You need to add **TWO** variables:

**First variable:**
- **Name** (the small box): type exactly `DATABASE_URL`
- **Value** (the big box): paste this exactly:
  ```
  postgresql://neondb_owner:npg_K4MHYFd9oJWO@ep-nameless-violet-ay45f9wc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
  ```
- Click the **"Add"** button next to it.

**Second variable:**
- **Name**: type exactly `DIRECT_URL`
- **Value**: paste this exactly:
  ```
  postgresql://neondb_owner:npg_K4MHYFd9oJWO@ep-nameless-violet-ay45f9wc.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
- Click **"Add"**.

⚠️ **Critical:** The two links are SLIGHTLY different. The DATABASE_URL has `-pooler` in the middle, the DIRECT_URL does NOT. Make sure you paste them exactly as shown above.

### 2D. Deploy!

1. Click the big blue **"Deploy"** button at the bottom.
2. Wait ~2-3 minutes. You'll see a progress screen with build logs.
3. When it's done, you'll see **"Congratulations!"** with confetti.
4. Click the big **"Visit"** button.

🎉 **Your app is now LIVE on the internet!** You'll see a web address like `https://waft-mam-farms-xxx.vercel.app`. Bookmark it.

---

## Step 3 — First Login

When you visit your new web address:

1. The page will load and **automatically create sample data** (5 staff accounts, 3 farms, 30 days of records).
2. Wait about 5 seconds for it to finish.
3. Log in with:
   - **Username**: `ceo`
   - **Password**: `ceo123`

You should now see your dashboard with 5 tabs at the top:
- **Dashboard** — overview
- **Pending** — amendment requests
- **Announcements** — messages to staff
- **Settings** — ⭐ edit farm name, add/delete farms, full data reset
- **Access Control** — manage staff accounts

---

## Step 4 — Customize Your Farm (do this once)

Once logged in as CEO:

1. Click the **"Settings"** tab.
2. **Farm Name** card → click "Edit" → type your real business name → "Save".
3. **Farm Locations** card → click "Add Farm" to add your real farm locations.
   - Or click "Remove" next to "Kumasi Main Farm", "Accra Branch", "Tamale Farm" to delete the sample ones.
4. **Full Data Reset** card → if you want to wipe ALL the sample data and start fresh, click "Start Full Reset" → type "RESET" → click "Confirm".

After that, your app is 100% ready for real daily use.

---

## That's It!

Your web address works on:
- 📱 Your phone (save to home screen)
- 💻 Your computer
- 📲 Your staff's phones (share the web address with them)

Anyone can log in from anywhere, 24/7. No more "Network error" — ever.

---

## If You Get Stuck

| Problem | What to do |
|---------|-----------|
| "Cannot find module" during Vercel build | Make sure you copied ALL the files (including hidden ones like `package.json`) into the GitHub folder |
| Vercel shows "Deployment Failed" | Check that you added BOTH `DATABASE_URL` and `DIRECT_URL` exactly as shown |
| Login fails with "Invalid username or password" | Wait 10 seconds after the page loads — the auto-seed is still running. Then refresh and try again. |
| "Database connection failed" | Make sure you used the `-pooler` URL for `DATABASE_URL` (with `&pgbouncer=true` at the end) |

If anything else breaks, take a screenshot and paste it in the chat. I'll help.
