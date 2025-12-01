# 🚀 Deploy Your Wanderlust App - Step by Step

## Part 1: Create GitHub Repository & Push Code

### Step 1: Create Repository on GitHub

1. Go to [github.com/jncdrx](https://github.com/jncdrx)
2. Click the **green "New"** button (or the **"+"** icon → "New repository")
3. Fill in:
   - **Repository name:** `wanderlust-app` (or any name you like)
   - **Description:** "Travel Itinerary Management App"
   - **Visibility:** Choose **Public** (required for free Render deployment)
   - **DO NOT** check "Add a README file" (we already have code)
   - **DO NOT** add .gitignore or license (we already have them)
4. Click **"Create repository"**

### Step 2: Push Your Code to GitHub

Open your terminal/command prompt in your project folder (`C:\Users\johnc\Desktop\new`) and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Ready for deployment"

# Rename branch to main
git branch -M main

# Add your GitHub repository (replace YOUR_USERNAME with jncdrx)
git remote add origin https://github.com/jncdrx/wanderlust-app.git

# Push to GitHub
git push -u origin main
```

**If it asks for credentials:**
- Username: `jncdrx`
- Password: Use a **Personal Access Token** (not your GitHub password)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token → Select "repo" permissions → Generate
  - Copy the token and use it as password

---

## Part 2: Deploy to Render.com (Free)

### Step 3: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account

### Step 4: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name:** `wanderlust-db`
   - **Database:** `wanderlust`
   - **User:** `wanderlust_user`
   - **Region:** Choose closest to you (e.g., "Oregon (US West)")
   - **PostgreSQL Version:** Latest (15 or 16)
   - **Plan:** **Free**
4. Click **"Create Database"**
5. **Wait 2-3 minutes** for database to be ready
6. Once ready, click on the database name
7. Find **"Internal Database URL"** and **copy it** (looks like: `postgresql://user:password@host:5432/dbname`)
   - ⚠️ **Important:** Use "Internal Database URL", not "External Database URL"

### Step 5: Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. **Connect Repository:**
   - You'll see your GitHub repositories
   - Click **"Connect"** next to `wanderlust-app`
3. **Configure Service:**
   - **Name:** `wanderlust-app` (or any name)
   - **Environment:** Select **"Node"**
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Free**
4. **Add Environment Variables:**
   - Click **"Advanced"** at the bottom
   - Click **"Add Environment Variable"** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Click the **"Generate"** button (or type any random string like `my-super-secret-jwt-key-12345`) |
   | `DATABASE_URL` | Paste the **Internal Database URL** you copied in Step 4 |
   | `PORT` | `4001` (optional - Render will assign automatically) |

5. Click **"Create Web Service"**
6. **Wait 5-10 minutes** for first deployment
   - You'll see build logs in real-time
   - Don't close the page!

### Step 6: Run Database Migrations

1. Once deployment shows **"Live"** (green status), click on your service name
2. Click **"Shell"** tab in the left sidebar
3. A terminal will open - type this command:
   ```bash
   npx prisma migrate deploy
   ```
4. Press Enter and wait for it to complete
5. You should see: "All migrations have been applied successfully"

---

## 🎉 Done! Your App is Live!

Your app will be available at:
**`https://wanderlust-app.onrender.com`**

(Replace `wanderlust-app` with whatever name you chose)

---

## ✅ Test Your Deployment

1. Visit your app URL
2. Try registering a new account
3. Try logging in
4. Create a trip or destination
5. Everything should work!

---

## 🔧 Troubleshooting

### "Application Error" when visiting site
- Go to Render dashboard → Your service → **"Logs"** tab
- Check for error messages
- Common issues:
  - Missing environment variables
  - Database connection failed
  - Build errors

### "Cannot connect to database"
- Make sure you used **Internal Database URL** (not External)
- Verify `DATABASE_URL` environment variable is set correctly
- Check that migrations ran successfully

### Build fails
- Check build logs in Render
- Make sure all files were pushed to GitHub
- Verify `package.json` has all dependencies

### Slow first load
- **This is normal!** Free tier spins down after 15 min inactivity
- First request takes ~30 seconds (cold start)
- Subsequent requests are fast

---

## 📝 Quick Reference

**Your GitHub:** [github.com/jncdrx](https://github.com/jncdrx)

**Render Dashboard:** [dashboard.render.com](https://dashboard.render.com)

**Your App URL:** `https://wanderlust-app.onrender.com` (after deployment)

---

## 💡 Pro Tips

1. **Auto-deployments:** Every time you push to GitHub, Render automatically redeploys
2. **View logs:** Always check the "Logs" tab if something isn't working
3. **Environment variables:** You can update them anytime in Render dashboard → Settings
4. **Custom domain:** Add your own domain in Render → Settings → Custom Domains

---

## 🆘 Need Help?

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Render Support:** Check your dashboard → Support
- **Check logs:** Always check the Logs tab first!

