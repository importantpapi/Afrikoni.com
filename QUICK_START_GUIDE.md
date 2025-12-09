# 🚀 Quick Start Guide - Afrikoni Marketplace

**For:** Developers, DevOps, and Stakeholders  
**Purpose:** Get the platform production-ready in 30 minutes

---

## ⚡ **30-Minute Production Setup**

### **Step 1: Environment Variables (15 min)**

#### **1.1 Google Analytics 4 (5 min)**
1. Go to https://analytics.google.com
2. Create GA4 property (if not exists)
3. Get Measurement ID: `G-XXXXXXXXXX`
4. Add to Vercel:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Name: `VITE_GA4_ID`
   - Value: `G-XXXXXXXXXX`
   - Apply to: Production, Preview, Development

#### **1.2 Sentry Error Tracking (10 min)**
1. Go to https://sentry.io
2. Sign up (free tier: 5,000 events/month)
3. Create React project
4. Get DSN from: Settings → Projects → Client Keys (DSN)
5. Add to Vercel:
   - Name: `VITE_SENTRY_DSN`
   - Value: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - Apply to: Production, Preview, Development

---

### **Step 2: Security (5 min)**

1. Go to Supabase Dashboard
2. Navigate to: Authentication → Settings
3. Find "Password Security" section
4. Enable "Leaked Password Protection"
5. Save changes

---

### **Step 3: SEO Assets (10 min)**

#### **3.1 Create Open Graph Image (10 min)**
1. Create image: `1200x630px`
2. Include:
   - Afrikoni logo (gold/brown)
   - Text: "Trade. Trust. Thrive."
   - Background: Afrikoni brand colors
3. Save as: `public/og-image.png`
4. Verify: Image loads at `https://afrikoni.com/og-image.png`

#### **3.2 Submit Sitemap (5 min)**
1. Go to https://search.google.com/search-console
2. Add property: `https://afrikoni.com`
3. Verify ownership
4. Go to: Sitemaps
5. Submit: `https://afrikoni.com/sitemap.xml`

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] GA4 tracking works:
  - Visit site
  - Check GA4 Real-Time reports
  - Should see your visit

- [ ] Sentry works:
  - Trigger test error (or wait for real error)
  - Check Sentry dashboard
  - Should see error captured

- [ ] OG Image works:
  - Share URL on social media
  - Should show preview with image

- [ ] Sitemap works:
  - Visit: `https://afrikoni.com/sitemap.xml`
  - Should see XML with pages

---

## 🎯 **Quick Reference**

### **Environment Variables:**
```bash
# Required
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_FLW_PUBLIC_KEY=your_key
VITE_WHATSAPP_COMMUNITY_LINK=your_link

# For Monitoring (Add these)
VITE_GA4_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### **Key URLs:**
- **Production:** https://afrikoni.com
- **Sitemap:** https://afrikoni.com/sitemap.xml
- **robots.txt:** https://afrikoni.com/robots.txt
- **Dashboard:** https://afrikoni.com/dashboard

### **Admin Access:**
- **Support Email:** hello@afrikoni.com
- **WhatsApp Community:** https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v

---

## 🚨 **Troubleshooting**

### **GA4 Not Tracking:**
- Check `VITE_GA4_ID` is set
- Verify in Network tab (look for `googletagmanager.com`)
- Check browser console for errors
- Disable ad blockers

### **Sentry Not Working:**
- Check `VITE_SENTRY_DSN` is set
- Verify DSN format is correct
- Check Sentry dashboard project status
- Test with: `Sentry.captureMessage('Test')`

### **OG Image Not Showing:**
- Verify file exists: `public/og-image.png`
- Check file size (should be < 1MB)
- Verify URL: `https://afrikoni.com/og-image.png`
- Test with: https://www.opengraph.xyz/

---

## 📊 **Monitoring Dashboard**

### **Daily Checks:**
1. **Sentry:** Review new errors
2. **GA4:** Check user activity
3. **Audit Logs:** Review high-risk events
4. **Database:** Check query performance

### **Weekly Reviews:**
1. **Analytics:** User behavior trends
2. **Errors:** Most common issues
3. **Performance:** Page load times
4. **Security:** Audit log anomalies

---

## 🎉 **You're Ready!**

Once all steps are complete:
- ✅ Monitoring active
- ✅ Analytics tracking
- ✅ SEO optimized
- ✅ Security hardened

**Status:** 🚀 **PRODUCTION READY**

---

**Need Help?** Check:
- `PRODUCTION_SETUP_GUIDE.md` - Detailed setup
- `TESTING_CHECKLIST.md` - Testing guide
- `DEPLOYMENT_CHECKLIST_FINAL.md` - Deployment steps

