# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Setup (Completed)

- [x] Created `vercel.json` configuration
- [x] Created `.vercelignore` file
- [x] Updated API files to use environment variables
- [x] Created `.env.example` for reference
- [x] Created deployment documentation

## 📋 Deployment Steps

### 1. Test Build Locally
```bash
npm run build
```
This should create a `dist` folder without errors.

### 2. Push to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Create GitHub repo and push
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### 4. Configure Environment Variables

After deployment, add these in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the following variables:

**For Production (when backend is hosted):**
```
VITE_USERS_API_URL=https://your-backend-url.com
VITE_TRANSACTION_API_URL=https://your-backend-url.com
VITE_ML_API_URL=https://your-ml-backend-url.com
```

**For Testing with Local Backend:**
```
VITE_USERS_API_URL=http://localhost:8001
VITE_TRANSACTION_API_URL=http://localhost:8000
VITE_ML_API_URL=http://localhost:5000
```

### 5. Redeploy After Adding Variables
After adding environment variables, trigger a new deployment:
- Go to Deployments tab
- Click "Redeploy" on latest deployment

## 🔧 Backend Hosting (Required)

Your frontend is deployed, but you need to host the backend separately.

### Recommended Platforms:

#### **Render.com** (Easiest)
1. Go to https://render.com
2. Create a "Web Service"
3. Connect GitHub repository
4. Deploy each Python service:
   - `flask_server.py` (Transaction API)
   - `ml_api_server.py` (ML API)
   - `users_api.py` (Users API)
5. Update Vercel environment variables with Render URLs

#### **Railway.app**
1. Go to https://railway.app
2. Deploy from GitHub
3. Configure build settings for Python
4. Get deployment URLs

#### **PythonAnywhere**
1. Upload backend files
2. Configure WSGI
3. Set up scheduled tasks if needed

### Backend Deployment Files Needed:
- `requirements.txt` (list all Python dependencies)
- `Procfile` or startup command
- Update CORS to allow Vercel domain

## 🌐 Your Deployment URLs

After deployment, you'll get:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: (Deploy separately)

## ✨ Automatic Deployments

Vercel will automatically deploy:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

## 🎯 Next Steps

1. ✅ Deploy frontend to Vercel
2. ⏳ Deploy backend to Render/Railway/etc.
3. ⏳ Update Vercel environment variables with backend URLs
4. ⏳ Test the deployed application
5. ⏳ Configure custom domain (optional)

---

## 🆘 Troubleshooting

### Build Fails
- Check `package.json` has all dependencies
- Review Vercel build logs
- Test `npm run build` locally

### Blank Page
- Check browser console for errors
- Verify API URLs in environment variables
- Check CORS settings on backend

### API Not Working
- Ensure backend is running
- Check environment variables are set
- Verify CORS allows your Vercel domain

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- Render Docs: https://render.com/docs

**Good luck with your deployment! 🎉**
