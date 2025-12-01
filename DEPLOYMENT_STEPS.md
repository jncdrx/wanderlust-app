# Quick Deployment Steps for InfinityFree + Render

## ⚡ Quick Start (Recommended: Render.com for Everything)

### Option A: Deploy Everything to Render.com (Easiest)

1. **Sign up at [render.com](https://render.com)** (Free account)

2. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/wanderlust.git
   git push -u origin main
   ```

3. **In Render Dashboard:**
   - Click "New +" → "PostgreSQL"
   - Name: `wanderlust-db`
   - Region: Choose closest to you
   - Plan: Free
   - Click "Create Database"
   - **Copy the Internal Database URL** (you'll need this)

4. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `wanderlust-app`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free

5. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (click "Generate" or use a random string)
   - `DATABASE_URL` = (paste the Internal Database URL from step 3)
   - `PORT` = `4001` (or leave blank, Render will assign)

6. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your app will be live at `https://wanderlust-app.onrender.com`

7. **Run Database Migrations:**
   - In Render dashboard, go to your service
   - Click "Shell" tab
   - Run: `npx prisma migrate deploy`

**Done!** Your app is live! 🎉

---

## Option B: Frontend on InfinityFree + Backend on Render

### Step 1: Deploy Backend to Render (Same as Option A, steps 1-7)

### Step 2: Build Frontend

```bash
# Create .env.production file
echo "VITE_API_URL=https://your-backend-name.onrender.com" > .env.production

# Build the app
npm run build
```

### Step 3: Update API URL

Edit `src/api/client.ts` and ensure it uses:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-name.onrender.com';
```

Rebuild:
```bash
npm run build
```

### Step 4: Upload to InfinityFree

1. **Sign up at [infinityfree.net](https://www.infinityfree.net)**

2. **Create Account:**
   - Go to "Add Website"
   - Choose subdomain (e.g., `wanderlust.epizy.com`)
   - Click "Create"

3. **Upload Files:**
   - Go to Control Panel → File Manager
   - Navigate to `htdocs` folder
   - Delete default `index.html`
   - Upload ALL files from your `build` folder
   - Upload `.htaccess` file (for React Router)

4. **Done!** Your frontend is live at `https://wanderlust.epizy.com`

### Step 5: Update CORS on Backend

In Render dashboard → Your service → Environment:
- Add: `CORS_ORIGIN` = `https://wanderlust.epizy.com`

Update `server/index.js` CORS:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## Environment Variables Checklist

### Backend (Render):
- ✅ `NODE_ENV` = `production`
- ✅ `JWT_SECRET` = (random secure string)
- ✅ `DATABASE_URL` = (from PostgreSQL service)
- ✅ `PORT` = `4001` (optional, Render assigns automatically)
- ✅ `CORS_ORIGIN` = (your frontend URL if separate)

### Frontend (if separate):
- ✅ `VITE_API_URL` = (your backend URL)

---

## Post-Deployment

1. **Test the app:**
   - Visit your URL
   - Try registering a new user
   - Test login
   - Test creating a trip

2. **Check logs:**
   - Render dashboard → Your service → Logs
   - Look for any errors

3. **Database:**
   - Ensure migrations ran successfully
   - Check database has tables

---

## Troubleshooting

### "Cannot connect to API"
- Check backend URL is correct
- Verify CORS settings
- Check backend logs in Render

### "404 on page refresh"
- Ensure `.htaccess` is uploaded (InfinityFree)
- Check file permissions

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check database is running in Render
- Ensure migrations ran

### "Build failed"
- Check build logs in Render
- Verify all dependencies in `package.json`
- Try `npm install` locally first

---

## Free Hosting Comparison

| Service | Node.js | Database | Free Tier | Best For |
|---------|---------|----------|-----------|----------|
| **Render** | ✅ | ✅ PostgreSQL | 750 hrs/month | **Full-stack (Recommended)** |
| **Railway** | ✅ | ✅ PostgreSQL | $5 credit/month | Full-stack |
| **InfinityFree** | ❌ | ✅ MySQL only | Unlimited | Static sites only |
| **Vercel** | ✅ | ❌ (external) | Unlimited | Frontend + Serverless |
| **Netlify** | ✅ | ❌ (external) | 100GB bandwidth | Frontend + Functions |

**Recommendation: Use Render.com for everything!** It's the easiest and supports your full stack.

