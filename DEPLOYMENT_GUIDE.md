# 🚀 COMPLETE DEPLOYMENT GUIDE - GITHUB + VERCEL

**Status:** ✅ **READY FOR DEPLOYMENT**  
**Last Updated:** $(date)

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Step 1: Prepare Git Repository](#step-1-prepare-git-repository)
3. [Step 2: Push to GitHub](#step-2-push-to-github)
4. [Step 3: Create Vercel Project](#step-3-create-vercel-project)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Deploy](#step-5-deploy)
7. [Step 6: Post-Deployment Verification](#step-6-post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES

Before starting, ensure you have:

- [x] **Git** installed and configured
- [x] **GitHub account** created
- [x] **Vercel account** created (sign up at https://vercel.com)
- [x] **Node.js** 18.x or 20.x installed
- [x] **Supabase project** created and active
- [x] **Supabase credentials** ready (URL and Anon Key)

---

## 📦 STEP 1: PREPARE GIT REPOSITORY

### 1.1 Check Current Status
```bash
cd "/Users/youba/Desktop/Afrikoni V"
git status
```

### 1.2 Stage All Changes
```bash
# Add all files
git add .

# Check what will be committed
git status
```

### 1.3 Commit Changes
```bash
git commit -m "Production ready: All fixes applied, ready for Vercel deployment

- Fixed JSX syntax errors in sales.jsx and payments.jsx
- Added all admin routes (20 routes)
- Added RFQ creation route
- Enhanced error handling and query validation
- Optimized for production build
- All routes configured and tested"
```

### 1.4 Verify Commit
```bash
git log --oneline -1
```

---

## 🔗 STEP 2: PUSH TO GITHUB

### 2.1 Check Remote Repository
```bash
# Check if remote is configured
git remote -v
```

### 2.2 Create GitHub Repository (if needed)

**Option A: Via GitHub Website**
1. Go to: https://github.com/new
2. Repository name: `afrikoni-marketplace` (or your preferred name)
3. Description: "Afrikoni Marketplace - B2B Trade Platform"
4. Visibility: **Private** (recommended) or **Public**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

**Option B: Via GitHub CLI**
```bash
# Install GitHub CLI if not installed
# brew install gh  # macOS
# Then authenticate: gh auth login

# Create repository
gh repo create afrikoni-marketplace --private --source=. --remote=origin --push
```

### 2.3 Add Remote (if not already added)
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/afrikoni-marketplace.git

# Or using SSH (if you have SSH keys set up)
# git remote add origin git@github.com:YOUR_USERNAME/afrikoni-marketplace.git
```

### 2.4 Push to GitHub
```bash
# Push to main branch
git push -u origin main

# If you get an error about upstream, use:
# git push --set-upstream origin main
```

### 2.5 Verify Push
- Go to: https://github.com/YOUR_USERNAME/afrikoni-marketplace
- Verify all files are uploaded
- Check that `vercel.json`, `package.json`, and `src/` folder are present

---

## 🌐 STEP 3: CREATE VERCEL PROJECT

### 3.1 Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```

### 3.3 Create Project via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/new
2. **Import Git Repository:**
   - Click **Import Git Repository**
   - Select **GitHub**
   - Authorize Vercel to access GitHub (if first time)
   - Find and select your repository: `afrikoni-marketplace`
   - Click **Import**

3. **Configure Project:**
   - **Project Name:** `afrikoni-marketplace` (or your preferred name)
   - **Framework Preset:** **Vite** (should auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (should auto-detect)
   - **Output Directory:** `dist` (should auto-detect)
   - **Install Command:** `npm install` (should auto-detect)

4. **DO NOT DEPLOY YET** - We need to set environment variables first!

---

## 🔐 STEP 4: CONFIGURE ENVIRONMENT VARIABLES

### 4.1 Required Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable below for **Production**, **Preview**, and **Development**

### 4.2 Add Variables

#### ✅ REQUIRED VARIABLES

**1. VITE_SUPABASE_URL**
```
Key: VITE_SUPABASE_URL
Value: https://qkeeufeiaphqylsnfhza.supabase.co
Environments: Production, Preview, Development
```

**2. VITE_SUPABASE_ANON_KEY**
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
Environments: Production, Preview, Development
```

#### ⚠️ OPTIONAL VARIABLES (Add if you have them)

**3. VITE_OPENAI_API_KEY** (For KoniAI features)
```
Key: VITE_OPENAI_API_KEY
Value: sk-proj-... (your OpenAI API key)
Environments: Production, Preview, Development
```

**4. VITE_SENTRY_DSN** (For error tracking)
```
Key: VITE_SENTRY_DSN
Value: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
Environments: Production, Preview, Development
```

**5. VITE_GA4_ID** (For Google Analytics)
```
Key: VITE_GA4_ID
Value: G-XXXXXXXXXX
Environments: Production, Preview, Development
```

### 4.3 How to Add Variables in Vercel

1. **Click "Add New"** button
2. **Enter Key:** `VITE_SUPABASE_URL`
3. **Enter Value:** Your Supabase URL
4. **Select Environments:** Check all three (Production, Preview, Development)
5. **Click "Save"**
6. **Repeat** for each variable

### 4.4 Verify Variables

After adding all variables, you should see:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- (Optional) VITE_OPENAI_API_KEY
- (Optional) VITE_SENTRY_DSN
- (Optional) VITE_GA4_ID

---

## 🚀 STEP 5: DEPLOY

### 5.1 Deploy via Vercel Dashboard

1. **Go to:** Your project dashboard
2. **Click:** "Deploy" button (or it may auto-deploy after importing)
3. **Wait** for build to complete (usually 1-3 minutes)
4. **Monitor** build logs for any errors

### 5.2 Deploy via Vercel CLI (Alternative)

```bash
# Navigate to project directory
cd "/Users/youba/Desktop/Afrikoni V"

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (first time) or Yes (if updating)
# - Project name: afrikoni-marketplace
# - Directory: ./
```

### 5.3 Monitor Deployment

**Watch for:**
- ✅ Build starting
- ✅ Dependencies installing
- ✅ Build completing successfully
- ✅ Deployment URL generated

**If build fails:**
- Check build logs for errors
- Verify environment variables are set
- Check Node version (should be 18.x or 20.x)

---

## ✅ STEP 6: POST-DEPLOYMENT VERIFICATION

### 6.1 Get Deployment URL

After successful deployment, Vercel will provide:
- **Production URL:** `https://afrikoni-marketplace.vercel.app` (or your custom domain)
- **Preview URLs:** For each branch/PR

### 6.2 Critical Tests

**Test 1: Homepage**
- [ ] Visit production URL
- [ ] Homepage loads without errors
- [ ] No console errors (check browser DevTools)

**Test 2: Authentication**
- [ ] Click "Login" or "Sign Up"
- [ ] Auth flow works correctly
- [ ] Can login successfully

**Test 3: Dashboard**
- [ ] After login, redirected to dashboard
- [ ] Dashboard loads without infinite spinner
- [ ] KPIs display (even if 0)
- [ ] Charts render

**Test 4: Post RFQ**
- [ ] Click "Post RFQ Now" button
- [ ] Navigates to `/dashboard/rfqs/new`
- [ ] RFQ creation form loads
- [ ] Can submit RFQ

**Test 5: Admin Panel** (If you're an admin)
- [ ] Admin Panel link visible in sidebar
- [ ] Can navigate to `/dashboard/admin/users`
- [ ] Admin routes work

**Test 6: Navigation**
- [ ] All routes work
- [ ] No 404 errors
- [ ] Navigation is smooth

### 6.3 Browser Console Check

**Open Browser DevTools (F12) → Console**

**Expected:**
- ✅ No critical errors
- ✅ May see deprecation warnings (safe to ignore)
- ✅ May see 404 for missing tables (handled gracefully)

**Not Expected:**
- ❌ "VITE_SUPABASE_URL not set" errors
- ❌ "Cannot connect to Supabase" errors
- ❌ Build/runtime errors

---

## 🔧 TROUBLESHOOTING

### Issue: Build Fails

**Symptoms:**
- Build fails in Vercel
- Error messages in build logs

**Solutions:**

1. **Check Environment Variables**
   ```
   - Go to: Vercel Dashboard → Settings → Environment Variables
   - Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
   - Ensure they're set for Production, Preview, and Development
   ```

2. **Check Node Version**
   ```
   - Go to: Vercel Dashboard → Settings → General
   - Node.js Version: Should be 18.x or 20.x
   ```

3. **Check Build Logs**
   ```
   - Look for specific error messages
   - Common issues:
     * Missing dependencies → Check package.json
     * Import errors → Check file paths
     * Syntax errors → Check recent changes
   ```

### Issue: App Loads But Shows Errors

**Symptoms:**
- App loads but shows error messages
- Console shows errors

**Solutions:**

1. **Check Environment Variables**
   ```javascript
   // In browser console, check:
   console.log(import.meta.env.VITE_SUPABASE_URL)
   // Should show your Supabase URL, not undefined
   ```

2. **Check Supabase Connection**
   ```
   - Verify Supabase project is active
   - Check Supabase dashboard for any issues
   - Verify RLS policies are configured
   ```

3. **Check Network Tab**
   ```
   - Open DevTools → Network tab
   - Look for failed requests
   - Check CORS errors
   ```

### Issue: Dashboard Not Loading

**Symptoms:**
- Dashboard stuck on loading spinner
- Infinite "Preparing your workspace..." message

**Solutions:**

1. **Check Auth Flow**
   ```
   - Verify login works
   - Check if user has company_id in profile
   - Verify capabilities are loading
   ```

2. **Check Console Logs**
   ```
   - Look for specific error messages
   - Check for "CapabilityContext" errors
   - Check for query errors
   ```

3. **Check Supabase Data**
   ```
   - Verify user has a profile
   - Verify profile has company_id
   - Verify company exists in companies table
   ```

### Issue: Environment Variables Not Working

**Symptoms:**
- Variables set but app shows "not set" errors

**Solutions:**

1. **Redeploy After Adding Variables**
   ```
   - After adding env vars, trigger a new deployment
   - Go to: Deployments → Click "Redeploy"
   ```

2. **Check Variable Names**
   ```
   - Must start with VITE_
   - Case-sensitive
   - No spaces or special characters
   ```

3. **Check Environments**
   ```
   - Ensure variables are set for Production
   - Also set for Preview and Development if needed
   ```

---

## 📝 QUICK REFERENCE

### Vercel Dashboard URLs

- **Projects:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/YOUR_USERNAME/afrikoni-marketplace/settings
- **Environment Variables:** https://vercel.com/YOUR_USERNAME/afrikoni-marketplace/settings/environment-variables
- **Deployments:** https://vercel.com/YOUR_USERNAME/afrikoni-marketplace/deployments

### GitHub Repository

- **Repository:** https://github.com/YOUR_USERNAME/afrikoni-marketplace
- **Settings:** https://github.com/YOUR_USERNAME/afrikoni-marketplace/settings

### Supabase Dashboard

- **Project:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza
- **API Settings:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/settings/api

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [x] Git repository initialized
- [x] All changes committed
- [x] Pushed to GitHub
- [x] Build passes locally (`npm run build`)

### Vercel Setup
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Environment variables set
- [ ] Build settings configured

### Deployment
- [ ] Initial deployment successful
- [ ] Production URL working
- [ ] All tests passing

### Post-Deployment
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] Post RFQ works
- [ ] Admin Panel works (if admin)
- [ ] No critical errors

---

## 🎉 SUCCESS!

Once all steps are complete, your application will be live at:
**https://afrikoni-marketplace.vercel.app** (or your custom domain)

**Next Steps:**
1. Set up custom domain (optional)
2. Configure monitoring (Sentry, Analytics)
3. Set up CI/CD for automatic deployments
4. Configure preview deployments for PRs

---

**Status:** ✅ **READY TO DEPLOY**

Follow the steps above to deploy your application to Vercel!
