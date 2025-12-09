# 🚀 Production Setup Guide - Afrikoni Marketplace

**Date:** December 9, 2024  
**Status:** Ready for Production Deployment

---

## ✅ **What's Already Set Up**

### 1. **Error Tracking (Sentry)** ✅
- ✅ Code integrated and ready
- ✅ ErrorBoundary connected
- ✅ Performance monitoring enabled
- ⚠️ **Action Required:** Add DSN to environment variables

### 2. **Analytics (Google Analytics 4)** ✅
- ✅ Code integrated and ready
- ✅ Page view tracking
- ✅ Event tracking hooks
- ⚠️ **Action Required:** Add GA4 ID to environment variables

### 3. **SEO** ✅
- ✅ robots.txt configured
- ✅ Dynamic sitemap generator
- ✅ Open Graph tags added
- ✅ Twitter Card tags added
- ✅ Meta descriptions

---

## 🔧 **Setup Instructions**

### **Step 1: Google Analytics 4 (30 minutes)**

1. **Create GA4 Property:**
   - Go to https://analytics.google.com
   - Create a new GA4 property
   - Get your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Add to Environment Variables:**
   
   **For Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `VITE_GA4_ID` = `G-XXXXXXXXXX`
   - Apply to: Production, Preview, Development

   **For Local Development:**
   - Create `.env.local` file in project root
   - Add: `VITE_GA4_ID=G-XXXXXXXXXX`

3. **Verify:**
   - Deploy or restart dev server
   - Open browser DevTools → Network tab
   - Visit your site
   - Look for requests to `googletagmanager.com`
   - Check GA4 Real-Time reports

---

### **Step 2: Sentry Error Tracking (45 minutes)**

1. **Sign Up:**
   - Go to https://sentry.io
   - Create a free account (5,000 events/month free)
   - Create a new project (React)

2. **Get Your DSN:**
   - In Sentry dashboard → Settings → Projects → [Your Project]
   - Go to "Client Keys (DSN)"
   - Copy your DSN (format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

3. **Add to Environment Variables:**
   
   **For Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `VITE_SENTRY_DSN` = `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - Apply to: Production, Preview, Development

   **For Local Development:**
   - Add to `.env.local`: `VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

4. **Verify:**
   - Deploy or restart dev server
   - Trigger a test error (or wait for real errors)
   - Check Sentry dashboard for events

---

### **Step 3: SEO Setup (15 minutes)**

1. **Create Open Graph Image:**
   - Create an image: `1200x630px` (recommended size)
   - Save as `public/og-image.png`
   - Should include: Afrikoni logo, tagline "Trade. Trust. Thrive."

2. **Submit Sitemap to Google:**
   - Go to https://search.google.com/search-console
   - Add property: `https://afrikoni.com`
   - Verify ownership
   - Go to Sitemaps section
   - Submit: `https://afrikoni.com/sitemap.xml`

3. **Verify:**
   - Visit: `https://afrikoni.com/sitemap.xml`
   - Should see XML with all pages
   - Visit: `https://afrikoni.com/robots.txt`
   - Should see robots.txt content

---

## 📊 **Environment Variables Checklist**

### **Required for Production:**

```bash
# Supabase (Already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Gateway (Already configured)
VITE_FLW_PUBLIC_KEY=your_flutterwave_public_key

# Analytics (Add these)
VITE_GA4_ID=G-XXXXXXXXXX

# Error Tracking (Add these)
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# WhatsApp Community (Already configured)
VITE_WHATSAPP_COMMUNITY_LINK=https://chat.whatsapp.com/...
```

---

## 🧪 **Testing Checklist**

### **Analytics:**
- [ ] GA4 property created
- [ ] `VITE_GA4_ID` added to environment
- [ ] Page views tracked in GA4 Real-Time
- [ ] Events tracked (sign-ups, logins, purchases)
- [ ] Conversion goals set up in GA4

### **Error Tracking:**
- [ ] Sentry account created
- [ ] `VITE_SENTRY_DSN` added to environment
- [ ] Test error captured in Sentry
- [ ] ErrorBoundary working
- [ ] Performance monitoring active

### **SEO:**
- [ ] `og-image.png` created and uploaded
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Sitemap submitted to Google Search Console
- [ ] Open Graph tags verified (use: https://www.opengraph.xyz/)

---

## 📈 **Monitoring & Alerts**

### **Sentry Alerts:**
1. Go to Sentry Dashboard → Alerts
2. Set up alerts for:
   - New errors
   - High error rate
   - Performance degradation

### **GA4 Goals:**
1. Go to GA4 → Admin → Events
2. Mark as conversions:
   - `sign_up`
   - `purchase`
   - `create_rfq`

### **Google Search Console:**
1. Monitor indexing status
2. Check for crawl errors
3. Review search performance

---

## 🎯 **Key Metrics to Track**

### **Business Metrics:**
- Sign-ups per day
- Active users
- RFQs created
- Orders completed
- Revenue

### **Technical Metrics:**
- Page load times
- Error rate
- API response times
- Database query performance
- Uptime

### **User Experience:**
- Bounce rate
- Time on site
- Pages per session
- Conversion rate (signup → first order)

---

## 🚨 **Troubleshooting**

### **GA4 Not Tracking:**
- Check `VITE_GA4_ID` is set correctly
- Verify script loads in Network tab
- Check browser console for errors
- Ensure ad blockers aren't blocking GA4

### **Sentry Not Capturing Errors:**
- Check `VITE_SENTRY_DSN` is set correctly
- Verify Sentry.init() is called in main.jsx
- Check Sentry dashboard for project status
- Test with: `Sentry.captureMessage('Test')`

### **Sitemap Not Working:**
- Verify route exists in App.jsx
- Check Supabase connection
- Verify generateSitemap function exists
- Check browser console for errors

---

## 📝 **Next Steps After Setup**

1. **Monitor for 1 week:**
   - Review Sentry errors daily
   - Check GA4 reports weekly
   - Monitor Search Console

2. **Optimize:**
   - Fix high-priority errors
   - Optimize slow pages
   - Improve conversion rates

3. **Scale:**
   - Set up additional alerts
   - Create custom dashboards
   - Implement A/B testing

---

## ✅ **Production Ready Checklist**

- [x] Database optimized (RLS policies, indexes)
- [x] Audit logging integrated
- [x] Error tracking ready (Sentry)
- [x] Analytics ready (GA4)
- [x] SEO optimized (sitemap, robots.txt, OG tags)
- [ ] GA4 ID configured
- [ ] Sentry DSN configured
- [ ] Open Graph image created
- [ ] Sitemap submitted to Google

**Status:** 90% Complete - Just need environment variables and image assets!

---

**Summary:** All code is ready. Just add environment variables and create the OG image, then you're fully production-ready! 🚀

