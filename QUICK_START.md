# ⚡ Quick Start - Deploy in 5 Minutes

## The Absolute Easiest Way

### 1️⃣ Push to GitHub (2 minutes)

```bash
# In your project folder, run these commands:
git init
git add .
git commit -m "Ready to deploy"
git branch -M main

# Then create a new repo on GitHub.com and run:
git remote add origin https://github.com/YOUR_USERNAME/wanderlust-app.git
git push -u origin main
```

### 2️⃣ Deploy to Render (3 minutes)

1. **Go to:** [render.com](https://render.com) → Sign up with GitHub

2. **Create Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `wanderlust-db`
   - Plan: **Free**
   - Click "Create"
   - **Copy the "Internal Database URL"**

3. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - Build: `npm install && npm run build`
     - Start: `npm start`
   - Add these Environment Variables:
     ```
     NODE_ENV = production
     JWT_SECRET = (click Generate)
     DATABASE_URL = (paste from step 2)
     ```
   - Click "Create"

4. **Wait 5 minutes** → Click "Shell" tab → Run:
   ```bash
   npx prisma migrate deploy
   ```

### 3️⃣ Done! 🎉

Your app is live at: `https://wanderlust-app.onrender.com`

---

## That's It!

No complicated setup. No server configuration. Just push, connect, and deploy!

**Note:** Free tier may take 30 seconds to wake up after inactivity (this is normal).

