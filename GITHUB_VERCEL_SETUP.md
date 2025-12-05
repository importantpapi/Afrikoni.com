# 🔗 GitHub & Vercel Setup Guide

**Status:** Setting up GitHub repository and Vercel connection

---

## 📋 CURRENT STATUS

### Git Repository
- **Local Repository:** ✅ Configured
- **Remote Repository:** Checking...

### Vercel Connection
- **Deployment:** ✅ Deployed
- **GitHub Integration:** Checking...

---

## 🚀 SETUP STEPS

### Step 1: Push to GitHub

#### If GitHub repo doesn't exist:
1. Go to https://github.com/new
2. Create a new repository named `afrikoni-marketplace`
3. **Don't** initialize with README (we already have code)
4. Copy the repository URL

#### Add remote (if not already added):
```bash
git remote add origin https://github.com/YOUR_USERNAME/afrikoni-marketplace.git
```

#### Push code:
```bash
git push -u origin main
```

### Step 2: Connect Vercel to GitHub

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variables
7. Click **"Deploy"**

#### Option B: Via Vercel CLI
```bash
# Link project to GitHub
vercel link

# This will:
# 1. Ask for project name
# 2. Link to Git repository
# 3. Enable automatic deployments
```

---

## 🔐 ENVIRONMENT VARIABLES

**Set these in Vercel Dashboard → Settings → Environment Variables:**

### Required
```
VITE_SUPABASE_URL
https://qkeeufeiaphqylsnfhza.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

### Optional
```
VITE_OPENAI_API_KEY
sk-proj-... (for KoniAI features)
```

---

## ✅ VERIFICATION

### Check GitHub Connection
```bash
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/afrikoni-marketplace.git (fetch)
origin  https://github.com/YOUR_USERNAME/afrikoni-marketplace.git (push)
```

### Check Vercel Connection
```bash
vercel project ls
```

Should show your project linked to GitHub.

### Check Auto-Deploy
- Go to Vercel Dashboard
- Check if "Git Integration" shows your GitHub repo
- Verify "Auto-deploy" is enabled

---

## 🔄 AUTO-DEPLOYMENT

Once connected:
- ✅ Every push to `main` branch = Auto-deploy to production
- ✅ Pull requests = Preview deployments
- ✅ Automatic builds on every commit

---

## 📝 GITHUB REPOSITORY SETUP

### Recommended Repository Settings

1. **Description:**
   ```
   Afrikoni.com - B2B Marketplace for African Trade
   ```

2. **Topics/Tags:**
   ```
   b2b, marketplace, africa, trade, supabase, react, vite
   ```

3. **Visibility:**
   - Private (recommended for production)
   - Or Public (if you want to showcase)

4. **README.md:**
   - Already exists in project
   - Will be pushed automatically

---

## 🎯 QUICK COMMANDS

### Push to GitHub
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Deploy to Vercel
```bash
vercel --prod
```

### Check Status
```bash
# Git status
git status

# Vercel projects
vercel project ls

# Deployment status
vercel ls
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Code pushed to GitHub
- [ ] Vercel connected to GitHub repo
- [ ] Environment variables set in Vercel
- [ ] Auto-deploy enabled
- [ ] Test deployment works
- [ ] Production URL accessible

---

## 🎊 YOU'RE ALL SET!

Once GitHub and Vercel are connected:
- ✅ Every code push = Automatic deployment
- ✅ Pull requests = Preview deployments
- ✅ Full CI/CD pipeline active

**Happy coding!** 🚀

