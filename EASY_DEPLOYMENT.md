# 🚀 Easy Free Deployment Guide - Render.com

## The Easiest Way (5 Steps, ~15 minutes)

### ✅ Step 1: Push Your Code to GitHub

1. **Create a GitHub account** (if you don't have one): [github.com](https://github.com)

2. **Create a new repository:**
   - Click the "+" icon → "New repository"
   - Name: `wanderlust-app`
   - Make it **Public** (free accounts need public repos)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   # Open terminal in your project folder
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wanderlust-app.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

---

### ✅ Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account (easiest way)
4. Authorize Render to access your GitHub

---

### ✅ Step 3: Create Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name:** `wanderlust-db`
   - **Database:** `wanderlust`
   - **User:** `wanderlust_user`
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** Latest
   - **Plan:** Free
3. Click **"Create Database"**
4. **Wait 2-3 minutes** for it to be ready
5. **Copy the "Internal Database URL"** - you'll need this next!

---

### ✅ Step 4: Deploy Your App

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. **Connect your GitHub repository:**
   - Select `wanderlust-app` from the list
   - Click "Connect"
3. **Configure the service:**
   - **Name:** `wanderlust-app` (or any name you like)
   - **Environment:** `Node`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. **Add Environment Variables** (click "Advanced"):
   - Click "Add Environment Variable" for each:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Click "Generate" button (or use any random string) |
   | `DATABASE_URL` | Paste the Internal Database URL from Step 3 |
   | `PORT` | `4001` (optional, Render will assign automatically) |

5. Click **"Create Web Service"**

---

### ✅ Step 5: Run Database Migrations

1. **Wait 5-10 minutes** for the first deployment to complete
2. Once it says "Live", click on your service name
3. Go to the **"Shell"** tab (in the left sidebar)
4. Run this command:
   ```bash
   npx prisma migrate deploy
   ```
5. Wait for it to complete (should say "All migrations have been applied")

---

## 🎉 Done! Your App is Live!

Your app will be available at: `https://wanderlust-app.onrender.com`

(Replace `wanderlust-app` with whatever name you chose)

---

## 🔧 Troubleshooting

### App shows "Application Error"
- Check the "Logs" tab in Render
- Make sure all environment variables are set correctly
- Verify `DATABASE_URL` is correct

### Can't connect to database
- Make sure you ran `npx prisma migrate deploy` in the Shell
- Check that `DATABASE_URL` uses the "Internal Database URL" (not External)

### Build fails
- Check build logs in Render
- Make sure all dependencies are in `package.json`
- Try running `npm install` locally first to check for errors

---

## 📝 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service created and connected to GitHub
- [ ] Environment variables added
- [ ] First deployment completed
- [ ] Database migrations run
- [ ] App is live and working!

---

## 💡 Pro Tips

1. **Free tier limits:**
   - Render free tier spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds (cold start)
   - This is normal for free hosting!

2. **Custom domain (optional):**
   - In Render dashboard → Your service → Settings
   - Add your custom domain (if you have one)

3. **Monitor your app:**
   - Check "Logs" tab regularly
   - Set up email alerts in Render settings

---

## 🆘 Need Help?

- Render Docs: [render.com/docs](https://render.com/docs)
- Render Support: Check dashboard → Support
- Check your app logs in Render dashboard

