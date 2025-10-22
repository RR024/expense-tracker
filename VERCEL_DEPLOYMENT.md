# FinSight - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Step 3: Configure Environment Variables (if needed)

If you need to set API URLs for your backend:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add your backend API URLs:
   - `VITE_API_URL` - Your backend API base URL
   - `VITE_ML_API_URL` - Your ML API URL
   - `VITE_USERS_API_URL` - Your users API URL

### Step 4: Update API Endpoints

Update your API files to use environment variables:

**src/api/usersAPI.js**:
```javascript
const API_BASE_URL = import.meta.env.VITE_USERS_API_URL || 'http://localhost:8001';
```

**src/api/transactionAPI.js**:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

**src/api/mlAPI.js**:
```javascript
const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';
```

## 📝 Important Notes

### Backend Hosting
Your Python backend servers need to be hosted separately:
- **Flask Transaction API** (port 8000)
- **ML API Server** (port 5000)
- **Users API** (port 8001)

Consider hosting them on:
- **Render.com** (Free tier available)
- **Railway.app** (Free tier available)
- **PythonAnywhere**
- **Heroku**
- **AWS/Azure/GCP**

### CORS Configuration
Make sure your backend allows requests from your Vercel domain:
```python
from flask_cors import CORS

# In your Flask apps
CORS(app, origins=['https://your-app.vercel.app'])
```

## 🔧 Build Configuration

The project is configured with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Node Version**: 18.x (recommended)

## 🌐 Custom Domain (Optional)

1. Go to your project on Vercel
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 📊 Deployment Status

After deployment, your app will be available at:
- Production: `https://your-project-name.vercel.app`
- Preview: Automatic preview URLs for each commit

## 🔄 Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For pull requests and other branches

## 🐛 Troubleshooting

### Build fails?
- Check `package.json` scripts
- Ensure all dependencies are listed
- Check Vercel build logs

### Blank page after deployment?
- Check browser console for errors
- Verify API endpoints are accessible
- Check CORS configuration on backend

### Routing issues?
- `vercel.json` includes rewrite rules for SPA routing
- All routes should work correctly

## 📞 Support

For issues, check:
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev/guide/

---

Happy Deploying! 🎉
