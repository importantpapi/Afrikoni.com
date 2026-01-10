# ⚡ QUICK DEPLOYMENT GUIDE

**Fastest way to deploy to Vercel** - Follow these steps in order

---

## 🚀 STEP 1: COMMIT & PUSH TO GITHUB

```bash
cd "/Users/youba/Desktop/Afrikoni V"

# Stage all changes
git add .

# Commit
git commit -m "Production ready: All fixes applied, ready for Vercel deployment"

# Push to GitHub
git push origin main
```

**Verify:** Go to https://github.com/importantpapi/Afrikoni.com and check files are updated

---

## 🌐 STEP 2: CREATE VERCEL PROJECT

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/new
2. **Click:** "Import Git Repository"
3. **Select:** GitHub → Authorize (if first time)
4. **Find:** `importantpapi/Afrikoni.com`
5. **Click:** Import
6. **Configure:**
   - Project Name: `afrikoni-marketplace` (or keep default)
   - Framework: **Vite** (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - **DO NOT CLICK DEPLOY YET!**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy (will prompt for setup)
cd "/Users/youba/Desktop/Afrikoni V"
vercel
```

---

## 🔐 STEP 3: ADD ENVIRONMENT VARIABLES

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

### Add These 2 Required Variables:

**1. VITE_SUPABASE_URL**
```
Key: VITE_SUPABASE_URL
Value: https://qkeeufeiaphqylsnfhza.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

**2. VITE_SUPABASE_ANON_KEY**
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
Environments: ✅ Production ✅ Preview ✅ Development
```

**Click "Save" after each variable**

---

## 🚀 STEP 4: DEPLOY

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. Click **"Deploy"** (or it may auto-deploy)
3. **Wait** for build to complete (~2-3 minutes)
4. **Check** build logs for errors

**Your app will be live at:** `https://afrikoni-marketplace.vercel.app` (or your custom domain)

---

## ✅ STEP 5: VERIFY

**Test these:**
- [ ] Visit production URL
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] Post RFQ works
- [ ] Admin Panel works (if admin)

**Check Console (F12):**
- [ ] No "VITE_SUPABASE_URL not set" errors
- [ ] No critical errors

---

## 🆘 TROUBLESHOOTING

### Build Fails?
- ✅ Check environment variables are set
- ✅ Check Node version is 18.x or 20.x
- ✅ Check build logs for specific error

### App Loads But Shows Errors?
- ✅ Check environment variables are set correctly
- ✅ Redeploy after adding variables
- ✅ Check browser console for specific errors

### Need Help?
- 📖 See `DEPLOYMENT_GUIDE.md` for detailed guide
- 📖 See `ENVIRONMENT_VARIABLES.md` for env var details

---

**That's it! Your app should be live in ~5 minutes! 🎉**
