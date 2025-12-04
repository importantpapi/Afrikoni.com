# 📊 Analytics & Monitoring Setup Guide

## ✅ What's Been Implemented

### 1. Google Analytics 4 (GA4)
- ✅ Analytics hook updated with real GA4 integration
- ✅ Page view tracking
- ✅ Event tracking (sign-ups, logins, purchases, etc.)
- ✅ Convenience methods for common events

### 2. Error Tracking (Sentry - Ready to Enable)
- ✅ ErrorBoundary updated to use Sentry
- ✅ Setup utility created
- ⚠️ **Action Required:** Install Sentry and add DSN

### 3. SEO Improvements
- ✅ robots.txt created
- ✅ Sitemap generator created
- ✅ Dynamic sitemap route added

---

## 🚀 Setup Instructions

### Step 1: Google Analytics 4

1. **Create GA4 Property:**
   - Go to https://analytics.google.com
   - Create a new GA4 property
   - Get your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Add to Environment Variables:**
   ```bash
   # .env.local or Vercel Environment Variables
   VITE_GA4_ID=G-XXXXXXXXXX
   ```

3. **Test:**
   - Open browser DevTools → Network tab
   - Visit your site
   - Look for requests to `google-analytics.com` or `googletagmanager.com`
   - Check GA4 Real-Time reports

### Step 2: Sentry Error Tracking

1. **Sign Up:**
   - Go to https://sentry.io
   - Create a free account
   - Create a new project (React)

2. **Install Package:**
   ```bash
   npm install @sentry/react
   ```

3. **Get Your DSN:**
   - In Sentry dashboard, go to Settings → Client Keys (DSN)
   - Copy your DSN

4. **Add to Environment Variables:**
   ```bash
   # .env.local or Vercel Environment Variables
   VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

5. **Enable Sentry:**
   - Open `src/utils/sentry.js`
   - Uncomment all the code (remove the `/* */` comments)
   - Save and rebuild

6. **Test:**
   - Trigger an error in your app
   - Check Sentry dashboard for the error

### Step 3: Verify Sitemap

1. **Test Sitemap:**
   - Visit: `https://afrikoni.com/sitemap.xml`
   - Should see XML with all your pages

2. **Submit to Google:**
   - Go to Google Search Console
   - Add property: `https://afrikoni.com`
   - Submit sitemap: `https://afrikoni.com/sitemap.xml`

---

## 📈 Tracking Events

The analytics hook now includes these methods:

```javascript
const { 
  trackPageView,      // Track page views
  trackEvent,         // Track custom events
  trackSignUp,        // Track sign-ups
  trackLogin,         // Track logins
  trackProductView,   // Track product views
  trackRFQCreated,    // Track RFQ creation
  trackOrderCompleted,// Track purchases
  trackSearch         // Track searches
} = useAnalytics();
```

### Example Usage:

```javascript
// In a component
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent, trackProductView } = useAnalytics();
  
  const handlePurchase = () => {
    trackOrderCompleted('order-123', 1000, 'USD');
  };
  
  const handleProductClick = (product) => {
    trackProductView(product.id, product.name, product.category);
  };
}
```

---

## 🎯 Key Events to Track

### User Actions:
- ✅ Sign up (method: email/google/facebook)
- ✅ Login (method: email/google/facebook)
- ✅ Product view
- ✅ Search query
- ✅ RFQ created
- ✅ Order completed

### Business Metrics:
- Conversion rate (visits → sign-ups)
- Sign-up method distribution
- Product view → RFQ conversion
- RFQ → Order conversion
- Average order value

---

## 🔍 Monitoring Checklist

- [ ] GA4 property created
- [ ] VITE_GA4_ID added to environment
- [ ] GA4 tracking verified in browser
- [ ] Sentry account created
- [ ] @sentry/react installed
- [ ] VITE_SENTRY_DSN added to environment
- [ ] Sentry code uncommented
- [ ] Error tracking tested
- [ ] Sitemap accessible
- [ ] Sitemap submitted to Google Search Console

---

## 📊 Next Steps

1. **Set up GA4** (30 min) - Start tracking immediately
2. **Set up Sentry** (45 min) - Catch errors before users report
3. **Submit sitemap** (10 min) - Help Google index your site
4. **Set up custom dashboards** - Track your key metrics

---

## 💡 Pro Tips

- **GA4:** Use Real-Time reports to verify tracking is working
- **Sentry:** Set up alerts for critical errors
- **Sitemap:** Update it regularly as you add new pages
- **Privacy:** Make sure to comply with GDPR/CCPA if applicable

---

**Ready to track! 🚀**

