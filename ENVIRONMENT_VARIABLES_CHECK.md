# ✅ Environment Variables Check

**Date:** December 9, 2024  
**Status:** Verification Guide

---

## 🔍 **How to Verify Environment Variables**

### **If Variables Are Already Added:**

Great! You don't need to add them again. Here's how to verify they're working:

---

## ✅ **Verification Steps**

### **1. Google Analytics 4 (VITE_GA4_ID)**

**Check if it's working:**
1. Open your site in a browser
2. Open DevTools (F12) → Network tab
3. Filter by "googletagmanager" or "google-analytics"
4. You should see requests to Google Analytics
5. Check GA4 Real-Time reports - you should see your visit

**If you see requests:** ✅ Working  
**If you don't see requests:** ⚠️ Check variable name and value

---

### **2. Sentry Error Tracking (VITE_SENTRY_DSN)**

**Check if it's working:**
1. Open browser console
2. Look for: `[Sentry] Initialized with performance monitoring`
3. If you see that message: ✅ Working
4. If you see: `[Sentry] VITE_SENTRY_DSN not set`: ⚠️ Variable not loaded

**Test error capture:**
1. Trigger a test error (or wait for real error)
2. Check Sentry dashboard
3. If error appears: ✅ Working

---

## 📍 **Where Variables Should Be**

### **For Vercel Deployment:**
- Vercel Dashboard → Project → Settings → Environment Variables
- Should be set for: Production, Preview, Development

### **For Local Development:**
- `.env.local` file in project root
- Or `.env` file

---

## 🔧 **If Variables Are Missing**

### **Quick Check:**
```bash
# In browser console (after site loads)
console.log('GA4 ID:', import.meta.env.VITE_GA4_ID);
console.log('Sentry DSN:', import.meta.env.VITE_SENTRY_DSN ? 'Set' : 'Not set');
```

**If they show as `undefined`:** Variables not loaded  
**If they show values:** ✅ Variables are loaded

---

## ✅ **If Already Configured**

**You can skip these steps:**
- ✅ No need to add VITE_GA4_ID again
- ✅ No need to add VITE_SENTRY_DSN again

**Just verify they're working:**
1. Check browser console for initialization messages
2. Check Network tab for GA4 requests
3. Test Sentry error capture

---

## 🎯 **Remaining Tasks (If Variables Are Set)**

Since variables are already added, you only need:

1. **Enable Leaked Password Protection** (5 min)
   - Supabase Dashboard → Auth → Settings

2. **Create OG Image** (10 min)
   - `1200x630px` → `public/og-image.png`

3. **Submit Sitemap** (5 min)
   - Google Search Console

**Total Time:** 20 minutes (instead of 35)

---

## 🚀 **Quick Verification Script**

Add this temporarily to check variables (remove after):

```javascript
// In browser console
console.log('=== Environment Variables Check ===');
console.log('GA4 ID:', import.meta.env.VITE_GA4_ID ? '✅ Set' : '❌ Not set');
console.log('Sentry DSN:', import.meta.env.VITE_SENTRY_DSN ? '✅ Set' : '❌ Not set');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set');
```

---

**If variables are already set and working, you're good to go!** ✅

Just complete the remaining 3 tasks (20 minutes total).

