# Railway Deployment Guide for FinSight

## 🚀 Quick Deploy to Railway

### What Railway Will Deploy:
1. ✅ **Frontend** (React + Vite) - Automatic detection
2. ✅ **Backend APIs** (3 Python services) - Automatic detection
3. ✅ **Database** (Optional - PostgreSQL free tier)

---

## 📋 Step-by-Step Deployment

### Step 1: Sign Up on Railway
1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"RR024/expense-tracker"**
4. Railway will scan your repository

### Step 3: Railway Auto-Detection
Railway will automatically detect:
- ✅ Node.js project (frontend)
- ✅ Python projects (backend services)
- ✅ Configuration files

### Step 4: Configure Services

Railway might create multiple services. You need to configure them:

#### **Service 1: Frontend (Vite)**
- **Name**: `frontend` or `expense-tracker-frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: Auto-detected (uses Vite preview)
- **Root Directory**: `/` (root)
- Railway will auto-detect this from `package.json`

#### **Service 2: Transaction API**
- **Name**: `transaction-api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn flask_server:app`
- **Root Directory**: `/backend`

#### **Service 3: ML API**
- **Name**: `ml-api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn ml_api_server:app`
- **Root Directory**: `/backend`

#### **Service 4: Users API**
- **Name**: `users-api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python users_api.py`
- **Root Directory**: `/backend`

### Step 5: Set Environment Variables (Frontend)

For the **frontend service only**:

1. Click on the frontend service
2. Go to **"Variables"** tab
3. Add these variables (you'll get backend URLs after deployment):

```
VITE_TRANSACTION_API_URL=${{transaction-api.RAILWAY_PUBLIC_DOMAIN}}
VITE_ML_API_URL=${{ml-api.RAILWAY_PUBLIC_DOMAIN}}
VITE_USERS_API_URL=${{users-api.RAILWAY_PUBLIC_DOMAIN}}
```

Or manually set them after backend deploys:
```
VITE_TRANSACTION_API_URL=https://your-transaction-api.railway.app
VITE_ML_API_URL=https://your-ml-api.railway.app
VITE_USERS_API_URL=https://your-users-api.railway.app
```

### Step 6: Deploy!
1. Click **"Deploy"** for each service
2. Wait for builds to complete (5-10 minutes total)
3. Railway will provide public URLs for each service

### Step 7: Enable Public Networking
For each service:
1. Click on the service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the generated URL

---

## 🌐 After Deployment

You'll have:
- **Frontend**: `https://expense-tracker-frontend.railway.app`
- **Transaction API**: `https://transaction-api-production.railway.app`
- **ML API**: `https://ml-api-production.railway.app`
- **Users API**: `https://users-api-production.railway.app`

## 💰 Pricing

Railway offers:
- **$5 free credits per month** (trial)
- After trial: ~$5/month for all services
- No credit card required for trial

## 🔧 Alternative: Simpler Approach

If Railway creates too many services automatically, you can:

1. **Deploy Frontend on Vercel** (already set up)
   - Free forever
   - Better for static sites

2. **Deploy Backend on Railway** (3 Python services)
   - Use the $5 credit for backend only
   - More cost-effective

## ⚠️ Important Notes

### Free Tier Limitations:
- $5 credit lasts ~500 hours of runtime
- Services don't auto-sleep (unlike Render)
- Good for development/demos

### Production Ready:
- Add PostgreSQL database for persistent storage
- Set up proper environment variables
- Monitor usage in Railway dashboard

---

## 🐛 Troubleshooting

### Build Fails?
- Check Railway build logs
- Ensure `requirements.txt` and `package.json` are correct
- Verify root directories are set correctly

### Services Can't Connect?
- Use Railway's internal service URLs
- Add CORS headers to backend
- Check environment variables

### Out of Credits?
- Upgrade to hobby plan ($5/month)
- Or use Vercel (frontend) + Render free tier (backend)

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: Active community support
- Railway Dashboard: Real-time logs and metrics

**Happy Deploying! 🚀**
