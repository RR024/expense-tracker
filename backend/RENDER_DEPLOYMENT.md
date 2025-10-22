# 🚀 Backend Deployment Guide - Render.com

## 📋 Quick Setup

You have 3 backend services to deploy:
1. **Transaction API** (flask_server.py) - Port 8000
2. **ML API** (ml_api_server.py) - Port 5000  
3. **Users API** (users_api.py) - Port 8001

## ✅ Prerequisites Completed

- [x] Created `requirements.txt` with all dependencies
- [x] Created `Procfile` for each service
- [x] Updated servers to use PORT environment variable
- [x] Enabled CORS for all origins

## 🌐 Deploy on Render.com

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Deploy Transaction API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `RR024/expense-tracker`
3. Configure:
   - **Name**: `finsight-transaction-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn flask_server:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free`
4. Click **"Create Web Service"**
5. **Copy the URL** (e.g., `https://finsight-transaction-api.onrender.com`)

### Step 3: Deploy ML API

1. Click **"New +"** → **"Web Service"**
2. Connect repository again
3. Configure:
   - **Name**: `finsight-ml-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn ml_api_server:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free`
4. Click **"Create Web Service"**
5. **Copy the URL** (e.g., `https://finsight-ml-api.onrender.com`)

### Step 4: Deploy Users API

1. Click **"New +"** → **"Web Service"**
2. Connect repository again
3. Configure:
   - **Name**: `finsight-users-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python users_api.py`
   - **Instance Type**: `Free`
4. Click **"Create Web Service"**
5. **Copy the URL** (e.g., `https://finsight-users-api.onrender.com`)

## 🔧 Update Vercel Environment Variables

Once all 3 services are deployed:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_TRANSACTION_API_URL=https://finsight-transaction-api.onrender.com
VITE_ML_API_URL=https://finsight-ml-api.onrender.com
VITE_USERS_API_URL=https://finsight-users-api.onrender.com
```

4. Go to **Deployments** tab
5. Click **"Redeploy"** on the latest deployment

## ⚠️ Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (across all services)

### Data Persistence
- CSV files are **ephemeral** on free tier
- Consider upgrading to paid tier or use a database:
  - PostgreSQL (free tier available on Render)
  - MongoDB Atlas (free tier)

### Build Time
- ML API might take 5-10 minutes to build (TensorFlow is large)
- Transaction API: ~2-3 minutes
- Users API: ~2-3 minutes

## 🐛 Troubleshooting

### Build Fails?
- Check build logs in Render dashboard
- Ensure `requirements.txt` is correct
- Try removing heavy packages like `tensorflow` temporarily

### Service Crashes?
- Check logs in Render dashboard
- Ensure `PORT` environment variable is used
- Check for missing dependencies

### CORS Errors?
- Verify CORS is enabled in Flask apps
- Check that origins are set to `"*"`

## 📊 After Deployment

Your full stack will be:
- **Frontend**: `https://your-app.vercel.app`
- **Transaction API**: `https://finsight-transaction-api.onrender.com`
- **ML API**: `https://finsight-ml-api.onrender.com`
- **Users API**: `https://finsight-users-api.onrender.com`

## 🎯 Next Steps

1. Deploy all 3 services on Render
2. Update Vercel environment variables
3. Redeploy Vercel
4. Test the full application!

---

**Good luck! 🚀**
