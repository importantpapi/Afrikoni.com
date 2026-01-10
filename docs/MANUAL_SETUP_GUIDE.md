# 📋 Manual Setup Guide - Step by Step

**Date:** December 9, 2024  
**Purpose:** Complete guide for remaining manual tasks

---

## 🎯 **Quick Overview**

**4 tasks remaining** (15-20 minutes total):
1. Convert OG image to PNG (5 min)
2. Verify Vercel environment variables (5 min)
3. Enable leaked password protection (5 min)
4. Submit sitemap to Google (5 min)

---

## 📝 **Task 1: Convert OG Image to PNG** (5 minutes)

### **Option A: Online Converter (Easiest)** ⭐ Recommended

1. **Go to:** https://cloudconvert.com/svg-to-png
2. **Upload:** `public/og-image.svg`
3. **Settings:**
   - Width: `1200`
   - Height: `630`
   - Quality: `100`
4. **Convert** and download
5. **Save as:** `public/og-image.png`
6. **Verify:** File should be exactly 1200x630px

### **Option B: Design Tool**

1. **Open** `public/og-image.svg` in:
   - Figma (free)
   - Photoshop
   - Canva
   - GIMP (free)
2. **Export as PNG:**
   - Size: 1200x630px
   - Quality: High
3. **Save to:** `public/og-image.png`

### **Option C: Command Line (if ImageMagick installed)**

```bash
convert public/og-image.svg -resize 1200x630 public/og-image.png
```

### **Option D: Automated Script**

```bash
# Install sharp (recommended)
npm install sharp --save-dev

# Run conversion
node scripts/convert-og-image.js
```

**✅ Done when:** `public/og-image.png` exists and is 1200x630px

---

## 📝 **Task 2: Verify Vercel Environment Variables** (5 minutes)

### **Step-by-Step:**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Sign in to your account

2. **Select Your Project:**
   - Click on "Afrikoni" or your project name

3. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

4. **Verify These Variables Are Set:**

   **Required:**
   - ✅ `VITE_SUPABASE_URL` = Your Supabase project URL
   - ✅ `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - ✅ `VITE_FLW_PUBLIC_KEY` = Your Flutterwave public key
   - ✅ `VITE_WHATSAPP_COMMUNITY_LINK` = `https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v`

   **Optional (but recommended):**
   - ✅ `VITE_GA4_ID` = `G-HV6W89FG6E` (or your GA4 ID)
   - ⚠️ `VITE_SENTRY_DSN` = Your Sentry DSN (if using Sentry)

5. **For Each Variable:**
   - Check "Production"
   - Check "Preview" (optional)
   - Check "Development" (optional)

6. **If Missing:**
   - Click "Add New"
   - Enter variable name
   - Enter variable value
   - Select environments
   - Click "Save"

**✅ Done when:** All required variables are set in Vercel

---

## 📝 **Task 3: Enable Leaked Password Protection** (5 minutes)

### **Step-by-Step:**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project:**
   - Click on your Afrikoni project

3. **Navigate to Authentication:**
   - Click "Authentication" in left sidebar
   - Click "Settings" (under Authentication)

4. **Find Password Security Section:**
   - Scroll down to "Password Security" or "Password Settings"

5. **Enable Leaked Password Protection:**
   - Toggle ON "Leaked Password Protection"
   - Or check the checkbox if it's a checkbox
   - This prevents users from using compromised passwords

6. **Save Changes:**
   - Click "Save" or the changes auto-save

**✅ Done when:** Leaked Password Protection is enabled

**Note:** If you don't see this option, it might be:
- Under a different name (e.g., "Password Breach Detection")
- In a different section
- Available only on certain Supabase plans

---

## 📝 **Task 4: Submit Sitemap to Google** (5 minutes)

### **Step-by-Step:**

1. **Go to Google Search Console:**
   - https://search.google.com/search-console
   - Sign in with your Google account

2. **Add Property (if not already added):**
   - Click "Add Property"
   - Enter: `https://afrikoni.com`
   - Choose verification method (DNS, HTML file, etc.)
   - Complete verification

3. **Navigate to Sitemaps:**
   - In left sidebar, click "Sitemaps"
   - (Under "Indexing" section)

4. **Submit Sitemap:**
   - In "Add a new sitemap" field, enter:
     ```
     sitemap.xml
     ```
   - Click "Submit"

5. **Verify Submission:**
   - You should see "Success" status
   - Google will start crawling your sitemap

**✅ Done when:** Sitemap shows "Success" status in Google Search Console

**Note:** It may take a few days for Google to fully index all pages.

---

## ✅ **Verification**

After completing all tasks, run:

```bash
# Check production readiness
node scripts/check-production-readiness.js

# Verify setup
node scripts/verify-setup.js
```

Both scripts should show all checks passing (or only warnings).

---

## 🎉 **Completion Checklist**

- [ ] OG image converted to PNG (1200x630px)
- [ ] Vercel environment variables verified
- [ ] Leaked password protection enabled
- [ ] Sitemap submitted to Google

**When all checked:** ✅ **100% Production Ready!** 🚀

---

## 📞 **Need Help?**

- **OG Image:** See `public/OG_IMAGE_INSTRUCTIONS.md`
- **Environment Variables:** See `ENVIRONMENT_VARIABLES_CHECK.md`
- **General Setup:** See `REMAINING_TASKS.md`
- **Full Report:** See `FINAL_COMPLETION_REPORT.md`

---

**Estimated Total Time:** 15-20 minutes  
**Status After Completion:** 100% Production Ready ✅

