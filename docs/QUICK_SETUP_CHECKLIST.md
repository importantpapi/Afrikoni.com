# ✅ Quick Setup Checklist - Final 3 Tasks

**Time Required:** 15 minutes total  
**Status:** All code complete, just these 3 manual steps!

---

## 📋 **Task 1: Verify Vercel Environment Variables** (5 min)

### **Quick Steps:**
1. ✅ Run verification script:
   ```bash
   node scripts/verify-vercel-env.js
   ```
2. ✅ Go to: https://vercel.com/dashboard
3. ✅ Project → Settings → Environment Variables
4. ✅ Verify all required variables are set
5. ✅ Add any missing variables

### **Required Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FLW_PUBLIC_KEY`
- `VITE_WHATSAPP_COMMUNITY_LINK`
- `VITE_GA4_ID` (optional but recommended)

### **✅ Done when:** All variables are set in Vercel

---

## 📋 **Task 2: Enable Leaked Password Protection** (5 min)

### **Quick Steps:**
1. ✅ Go to: https://supabase.com/dashboard
2. ✅ Select Afrikoni project
3. ✅ Authentication → Settings
4. ✅ Enable "Leaked Password Protection"
5. ✅ Verify it's enabled

### **Detailed Guide:**
See: `scripts/check-supabase-password-protection.md`

### **✅ Done when:** Feature is enabled in Supabase

---

## 📋 **Task 3: Submit Sitemap to Google** (5 min)

### **Quick Steps:**
1. ✅ Go to: https://search.google.com/search-console
2. ✅ Add property: `https://afrikoni.com` (if not added)
3. ✅ Verify ownership (HTML file/tag/DNS)
4. ✅ Sitemaps → Submit `sitemap.xml`
5. ✅ Confirm "Success" status

### **Detailed Guide:**
See: `scripts/submit-sitemap-to-google.md`

### **✅ Done when:** Sitemap shows "Success" in Search Console

---

## 🎯 **After Completing All 3 Tasks**

### **Verify Everything:**
```bash
# Run production readiness check
node scripts/check-production-readiness.js

# Should show: ✅ All critical checks passed!
```

### **Deploy:**
- Push any remaining changes
- Vercel will auto-deploy
- All environment variables will be active

### **Test:**
- Visit your live site
- Check that everything works
- Monitor Sentry for errors
- Check GA4 for analytics

---

## 📊 **Completion Status**

| Task | Status | Time |
|------|--------|------|
| Vercel Env Vars | ⚠️ Manual | 5 min |
| Password Protection | ⚠️ Manual | 5 min |
| Google Sitemap | ⚠️ Manual | 5 min |
| **Total** | **3 tasks** | **15 min** |

---

## 🚀 **You're Almost There!**

**Current Status:**
- ✅ Code: 100% complete
- ✅ OG Image: 100% complete
- ✅ Build: Passing
- ✅ All checks: Passing
- ⚠️ 3 manual tasks remaining (15 min)

**After these 3 tasks:** 🎉 **100% Production Ready!**

---

## 📞 **Need Help?**

- **Vercel:** See `scripts/verify-vercel-env.js` output
- **Supabase:** See `scripts/check-supabase-password-protection.md`
- **Google:** See `scripts/submit-sitemap-to-google.md`
- **General:** See `MANUAL_SETUP_GUIDE.md`

---

**Let's finish these last 3 tasks and launch! 🚀**

