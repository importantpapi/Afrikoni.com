# 🔐 ENVIRONMENT VARIABLES FOR VERCEL

**Quick Reference Guide** - Copy and paste these into Vercel Dashboard

---

## ✅ REQUIRED VARIABLES

### 1. VITE_SUPABASE_URL

**Key:** `VITE_SUPABASE_URL`  
**Value:** `https://qkeeufeiaphqylsnfhza.supabase.co`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

**How to Get:**
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/settings/api
2. Copy **Project URL**

---

### 2. VITE_SUPABASE_ANON_KEY

**Key:** `VITE_SUPABASE_ANON_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

**How to Get:**
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/settings/api
2. Copy **anon/public** key

---

## ⚠️ OPTIONAL VARIABLES

### 3. VITE_OPENAI_API_KEY (Optional - For KoniAI)

**Key:** `VITE_OPENAI_API_KEY`  
**Value:** `sk-proj-...` (your OpenAI API key)  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

**How to Get:**
1. Go to: https://platform.openai.com/api-keys
2. Create new API key
3. Copy key

**Note:** Without this, KoniAI features will show a banner but won't function.

---

### 4. VITE_SENTRY_DSN (Optional - For Error Tracking)

**Key:** `VITE_SENTRY_DSN`  
**Value:** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

**How to Get:**
1. Sign up at: https://sentry.io (free tier available)
2. Create a project
3. Get your DSN from project settings

**Note:** Without this, error tracking is disabled. No warnings shown.

---

### 5. VITE_GA4_ID (Optional - For Analytics)

**Key:** `VITE_GA4_ID`  
**Value:** `G-XXXXXXXXXX`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

**How to Get:**
1. Create GA4 property at: https://analytics.google.com
2. Get your Measurement ID (format: G-XXXXXXXXXX)

**Note:** Without this, analytics tracking is disabled. No warnings shown.

---

## 📋 HOW TO ADD IN VERCEL

### Step-by-Step:

1. **Go to:** https://vercel.com/YOUR_USERNAME/afrikoni-marketplace/settings/environment-variables
   (Replace YOUR_USERNAME with your Vercel username)

2. **For each variable:**
   - Click **"Add New"**
   - Enter **Key** (e.g., `VITE_SUPABASE_URL`)
   - Enter **Value** (e.g., `https://qkeeufeiaphqylsnfhza.supabase.co`)
   - Select **Environments:** Check all three (Production, Preview, Development)
   - Click **"Save"**

3. **After adding all variables:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - This ensures new variables are loaded

---

## ✅ VERIFICATION

### After Adding Variables:

1. **Trigger a new deployment** (or redeploy existing)
2. **Check build logs** - Should not show "VITE_SUPABASE_URL not set"
3. **Test in browser:**
   ```javascript
   // Open browser console (F12)
   console.log(import.meta.env.VITE_SUPABASE_URL)
   // Should show: https://qkeeufeiaphqylsnfhza.supabase.co
   ```

---

## 🔒 SECURITY NOTES

- ✅ `VITE_SUPABASE_ANON_KEY` is **safe to expose** (it's public)
- ✅ `VITE_SUPABASE_URL` is **safe to expose** (it's public)
- ⚠️ `VITE_OPENAI_API_KEY` should be kept secret (but Vite prefixes with VITE_ make it public in client code)
- 💡 For production, consider using Supabase Edge Functions for sensitive operations

---

## 📝 QUICK COPY-PASTE FOR VERCEL

### Required Variables (Copy these):

```
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

### Optional Variables (Add if you have them):

```
VITE_OPENAI_API_KEY=sk-proj-...
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_GA4_ID=G-XXXXXXXXXX
```

---

**Status:** ✅ **READY TO ADD TO VERCEL**

Copy the values above and add them to your Vercel project settings!
