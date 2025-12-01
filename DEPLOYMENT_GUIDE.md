# Deployment Guide for Wanderlust Travel App

## ⚠️ Important: InfinityFree Limitations

**InfinityFree does NOT support Node.js/Express backends.** It only supports:
- Static HTML/CSS/JavaScript files
- PHP applications
- MySQL databases

Since your app uses Node.js/Express, you have two options:

---

## Option 1: Frontend on InfinityFree + Backend on Free Node.js Hosting (Recommended)

### Part A: Deploy Backend to Free Node.js Hosting

#### Step 1: Choose a Free Node.js Hosting Service
Recommended free options:
- **Render.com** (Free tier, 750 hours/month)
- **Railway.app** (Free tier with $5 credit)
- **Fly.io** (Free tier)
- **Cyclic.sh** (Free tier)

#### Step 2: Prepare Backend for Deployment

1. **Create a `.env` file for production:**
```bash
# In your project root, create .env.production
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=4001
NODE_ENV=production
DATABASE_URL=your-postgresql-connection-string
```

2. **Update `server/index.js` to use environment variables:**
   - Make sure it reads `process.env.PORT` or defaults to 4001
   - Ensure database connection uses `process.env.DATABASE_URL`

3. **Create a `Procfile` (for Render/Railway):**
```
web: node server/index.js
```

4. **Update `package.json` to add start script:**
```json
"scripts": {
  "start": "node server/index.js",
  "dev": "concurrently \"npm run server\" \"vite\"",
  "server": "nodemon server/index.js",
  "build": "vite build"
}
```

#### Step 3: Deploy Backend to Render.com (Example)

1. **Sign up at [render.com](https://render.com)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - **Name:** wanderlust-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `JWT_SECRET` = (generate a random string)
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = (your PostgreSQL connection string)
     - `PORT` = `4001` (or let Render assign it)

5. **Add PostgreSQL Database:**
   - In Render dashboard, create a new PostgreSQL database
   - Copy the connection string to `DATABASE_URL`

6. **Deploy and copy your backend URL** (e.g., `https://wanderlust-backend.onrender.com`)

---

### Part B: Deploy Frontend to InfinityFree

#### Step 1: Build Your React App

```bash
# In your project root
npm run build
```

This creates a `build` folder with static files.

#### Step 2: Update API Base URL

Before building, update `src/api/client.ts` to use your production backend URL:

```typescript
// In src/api/client.ts, update the API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com';
```

Create `.env.production` file:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

Then rebuild:
```bash
npm run build
```

#### Step 3: Prepare Files for InfinityFree

1. **Copy build files:**
   - Copy everything from the `build` folder
   - You'll upload these to InfinityFree

2. **Create `.htaccess` file** (for React Router):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Step 4: Upload to InfinityFree

1. **Sign up at [infinityfree.net](https://www.infinityfree.net)**
2. **Create a new account**
3. **Add a new website:**
   - Choose a subdomain (e.g., `wanderlust.epizy.com`)
   - Or use your own domain
4. **Access File Manager:**
   - Go to Control Panel → File Manager
   - Navigate to `htdocs` folder
5. **Upload files:**
   - Delete default `index.html` if present
   - Upload all files from your `build` folder
   - Upload `.htaccess` file
6. **Set permissions:**
   - Ensure `.htaccess` has proper permissions (644)

#### Step 5: Configure CORS on Backend

Update your `server/index.js` to allow requests from InfinityFree:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-site.epizy.com',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}));
```

---

## Option 2: Full-Stack Deployment on Free Node.js Hosting (Easier)

### Deploy Everything to Render.com (Recommended)

#### Step 1: Prepare for Deployment

1. **Update `vite.config.ts` for production:**
```typescript
export default defineConfig({
  // ... existing config
  build: {
    outDir: 'dist', // Change from 'build' to 'dist'
  },
});
```

2. **Create `render.yaml` in project root:**
```yaml
services:
  - type: web
    name: wanderlust-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: wanderlust-db
          property: connectionString
      - key: PORT
        value: 4001

databases:
  - name: wanderlust-db
    databaseName: wanderlust
    user: wanderlust_user
```

3. **Update `server/index.js` to serve static files:**
```javascript
// At the end of server/index.js, before app.listen
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}
```

#### Step 2: Deploy to Render

1. **Push code to GitHub**
2. **Connect GitHub to Render**
3. **Create new Web Service**
4. **Configure environment variables**
5. **Deploy**

---

## Option 3: Alternative Free Hosting (All Support Node.js)

### 1. **Vercel** (Best for Frontend + Serverless Functions)
- Free tier
- Automatic deployments
- Great for React apps

### 2. **Netlify** (Best for Frontend)
- Free tier
- Easy deployment
- Can use Netlify Functions for backend

### 3. **Railway.app**
- Free $5 credit monthly
- Easy PostgreSQL setup
- Simple deployment

### 4. **Fly.io**
- Free tier
- Global edge deployment
- Good performance

---

## Database Setup

### Using Free PostgreSQL Hosting

1. **Render PostgreSQL** (Free tier available)
2. **Supabase** (Free tier, 500MB database)
3. **ElephantSQL** (Free tier, 20MB database)

### Migration Steps

1. **Get connection string from your PostgreSQL provider**
2. **Update `DATABASE_URL` in environment variables**
3. **Run migrations:**
```bash
npx prisma migrate deploy
```

---

## Post-Deployment Checklist

- [ ] Backend is accessible and responding
- [ ] Frontend can connect to backend API
- [ ] CORS is properly configured
- [ ] Database migrations are applied
- [ ] Environment variables are set
- [ ] JWT_SECRET is secure and random
- [ ] HTTPS is enabled (most hosts do this automatically)
- [ ] Test user registration/login
- [ ] Test all major features

---

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings
- Verify API URL in frontend code
- Check browser console for errors

### 404 errors on page refresh
- Ensure `.htaccess` is uploaded (InfinityFree)
- Check routing configuration

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Ensure migrations are run

---

## Recommended: Use Render.com for Everything

**Why Render.com is better than InfinityFree for this project:**
- ✅ Supports Node.js/Express
- ✅ Free PostgreSQL database
- ✅ Automatic HTTPS
- ✅ Easy deployment from GitHub
- ✅ Free tier (750 hours/month)
- ✅ Can host both frontend and backend

**Steps:**
1. Sign up at render.com
2. Create PostgreSQL database
3. Create Web Service for backend
4. Deploy frontend as static site or serve from backend
5. Done!

---

## Need Help?

If you encounter issues:
1. Check Render/Railway logs
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check browser console for frontend errors

