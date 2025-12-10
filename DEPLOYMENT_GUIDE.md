# 🚀 Deployment Guide - GitHub & Vercel

## ✅ **GitHub Repository**

**Repository:** `https://github.com/importantpapi/Afrikoni.com.git`  
**Status:** ✅ All changes committed and pushed

### Recent Commits:
- RLS performance optimizations
- Error handling improvements
- Database index optimizations
- Accessibility fixes

---

## 🌐 **Vercel Deployment**

### **Option 1: Auto-Deploy (If Already Connected)**

If your GitHub repository is already connected to Vercel:
1. ✅ Changes are automatically deployed on push to `main` branch
2. Check your Vercel dashboard: https://vercel.com/dashboard
3. View deployment status and logs

### **Option 2: Manual Setup (If Not Connected)**

#### **Step 1: Connect Repository**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub: `importantpapi/Afrikoni.com`
4. Vercel will auto-detect:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### **Step 2: Configure Environment Variables**

In Vercel project settings → Environment Variables, add:

**Required:**
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FLW_PUBLIC_KEY=your_flutterwave_public_key
```

**Optional (Recommended for Production):**
```bash
VITE_GA4_ID=G-HV6W89FG6E
VITE_SENTRY_DSN=your_sentry_dsn
VITE_TARGET_COUNTRY=Ghana
VITE_WHATSAPP_COMMUNITY_LINK=your_whatsapp_link
```

#### **Step 3: Deploy**

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run build command
   - Deploy to production
3. You'll get a URL like: `https://afrikoni-marketplace.vercel.app`

---

## 📋 **Vercel Configuration**

Your `vercel.json` is already configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- ✅ SPA routing works correctly
- ✅ All routes redirect to `index.html`
- ✅ Proper headers for sitemap.xml and robots.txt

---

## 🔍 **Verify Deployment**

### **1. Check Build Status**
- Go to Vercel Dashboard → Your Project → Deployments
- Verify build completed successfully
- Check build logs for any errors

### **2. Test Production URL**
- Visit your Vercel deployment URL
- Test key features:
  - ✅ Homepage loads
  - ✅ No console errors
  - ✅ Authentication works
  - ✅ Routes navigate correctly

### **3. Check Environment Variables**
- Vercel Dashboard → Settings → Environment Variables
- Verify all required variables are set
- Ensure they're available for Production environment

---

## 🔄 **Continuous Deployment**

Once connected:
- ✅ Every push to `main` branch = Auto-deploy
- ✅ Preview deployments for pull requests
- ✅ Automatic HTTPS/SSL certificates
- ✅ Global CDN distribution

---

## 📊 **Monitoring**

### **Vercel Analytics (Optional)**
- Enable in Vercel Dashboard → Analytics
- Track page views, performance metrics

### **Error Tracking**
- Sentry integration (if `VITE_SENTRY_DSN` is set)
- View errors in Sentry dashboard

### **Performance**
- Vercel automatically provides:
  - Lighthouse scores
  - Core Web Vitals
  - Build performance metrics

---

## 🛠️ **Troubleshooting**

### **Build Fails**
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure `package.json` scripts are correct
4. Check for TypeScript/ESLint errors

### **Routes Not Working**
- Verify `vercel.json` rewrites are configured
- Check that `dist/index.html` exists after build
- Ensure React Router is configured correctly

### **Environment Variables Not Working**
- Verify variables are set for "Production" environment
- Check variable names start with `VITE_` (required for Vite)
- Redeploy after adding new variables

---

## 📝 **Quick Commands**

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Open deployment in browser
vercel open

# Pull environment variables
vercel env pull .env.local
```

---

## ✅ **Deployment Checklist**

- [x] Code committed to GitHub
- [x] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Production URL accessible
- [ ] All features tested
- [ ] Analytics configured (optional)
- [ ] Error tracking enabled (optional)

---

## 🎯 **Next Steps**

1. **Connect to Vercel** (if not already connected)
2. **Set environment variables** in Vercel dashboard
3. **Deploy** and verify production URL
4. **Test** all features in production
5. **Monitor** performance and errors

Your application is ready for deployment! 🚀
