# 🚀 Deployment Guide - GitHub & Vercel

## Current Status

✅ **GitHub Repository:** Already connected
- Remote: `https://github.com/importantpapi/Afrikoni.com.git`
- Branch: `main`

✅ **Vercel Configuration:** Already exists
- `vercel.json` configured for Vite/React
- Build command: `npm run build`
- Output directory: `dist`

---

## 📋 Step 1: Commit & Push to GitHub

### Option A: Commit All Changes (Recommended)

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Complete critical fixes - onboarding flow, email verification, admin system, dashboard CTAs, and assisted deal mode

- Fix 1: Clean onboarding flow (role selection in onboarding, email verification required)
- Fix 2: Transaction-safe company creation (atomic operations)
- Fix 3: Real admin system (database-driven, no hardcoded emails)
- Fix 4: Email verification enforcement with /verify-email page
- Fix 5: Dashboard CTAs for all roles (buyer/seller/hybrid/logistics)
- Add Assisted Deal Mode guide for manual matching
- Add pricing & value proposition documentation
- Fix dashboard CTA logic for proper loading states"

# Push to GitHub
git push origin main
```

### Option B: Selective Commit (If you want to review first)

```bash
# Review changes
git status

# Stage specific files
git add src/pages/dashboard/DashboardHome.jsx
git add src/pages/dashboard/logistics-dashboard.jsx
git add src/pages/signup.jsx
git add src/pages/onboarding.jsx
git add src/pages/verify-email.jsx
# ... add other important files

# Commit and push
git commit -m "feat: Critical fixes - onboarding, email verification, dashboard CTAs"
git push origin main
```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first time)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub (if not already)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `importantpapi/Afrikoni.com`
   - Click "Import"

3. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (if needed)
   ```
   
   ⚠️ **Important:** Never commit `.env` files. Add them in Vercel dashboard.

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will ask for project settings)
vercel

# Deploy to production
vercel --prod
```

---

## 🔐 Step 3: Configure Environment Variables in Vercel

### Required Environment Variables:

1. **Go to Vercel Dashboard:**
   - Select your project
   - Go to "Settings" → "Environment Variables"

2. **Add the following:**

   ```
   VITE_SUPABASE_URL
   Value: https://your-project.supabase.co
   
   VITE_SUPABASE_ANON_KEY
   Value: your-anon-key-here
   ```

3. **Optional (for server-side operations):**
   ```
   SUPABASE_SERVICE_ROLE_KEY
   Value: your-service-role-key (keep this secure!)
   ```

4. **Apply to:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Redeploy:**
   - After adding env vars, trigger a new deployment:
   - Go to "Deployments" → Click "..." on latest → "Redeploy"

---

## 🔄 Step 4: Set Up Automatic Deployments

### GitHub Integration (Already set up if using Vercel Dashboard)

Vercel automatically:
- ✅ Deploys on every push to `main` (production)
- ✅ Creates preview deployments for PRs
- ✅ Shows deployment status in GitHub

### Manual Deployment Options:

**From Vercel Dashboard:**
- Go to "Deployments" → Click "Redeploy"

**From CLI:**
```bash
vercel --prod
```

---

## ✅ Step 5: Post-Deployment Checklist

After deployment:

- [ ] Verify site is live at your Vercel URL
- [ ] Test signup flow
- [ ] Test email verification
- [ ] Test onboarding flow
- [ ] Test dashboard access (all roles)
- [ ] Test dashboard CTAs show for new users
- [ ] Verify environment variables are set correctly
- [ ] Check browser console for errors
- [ ] Test on mobile devices

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check:**
1. Build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Node version compatibility (Vercel uses Node 18+ by default)

**Fix:**
```bash
# Specify Node version in package.json
"engines": {
  "node": ">=18.0.0"
}
```

### Environment Variables Not Working

**Check:**
1. Variables are added in Vercel dashboard (Settings → Environment Variables)
2. Variables are prefixed with `VITE_` for client-side access
3. Redeploy after adding variables

### 404 Errors on Refresh

**Already Fixed!** Your `vercel.json` includes:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

This handles React Router client-side routing.

---

## 📊 Vercel Project Settings Summary

**Framework:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Node Version:** 18.x (default)  
**Install Command:** `npm install`

---

## 🎯 Quick Deploy Commands

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "feat: Deploy critical fixes"
git push origin main

# 2. Deploy to Vercel (if using CLI)
vercel --prod

# 3. Or just push to GitHub (auto-deploys if connected to Vercel)
```

---

## 🚨 Important Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Add environment variables in Vercel dashboard** - Not in code
3. **Test production build locally first:**
   ```bash
   npm run build
   npm run preview
   ```
4. **Monitor deployments** in Vercel dashboard for errors
5. **Use preview deployments** to test before production

---

## ✅ You're Ready!

Your repository is configured. Just:
1. Commit & push your changes
2. Deploy to Vercel (via dashboard or CLI)
3. Add environment variables
4. Test and go live! 🎉
