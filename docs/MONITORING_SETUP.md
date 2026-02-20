# MONITORING SETUP GUIDE
## Production Observability for Afrikoni Platform

This guide covers setting up Sentry for error tracking and Google Analytics 4 for user behavior analysis.

---

## SENTRY — Error Tracking & Performance Monitoring

### Why Sentry?
- **Real-time error tracking**: Catch bugs in production before users report them
- **Performance monitoring**: Track slow API calls and database queries
- **Release tracking**: See which deployment introduced a bug
- **User context**: Know which companies/users are affected

### Step 1: Create Sentry Project
1. Go to https://sentry.io/signup/
2. Create account (free tier: 5,000 errors/month)
3. Click "Create Project"
4. Select **React** as platform
5. Name project: `afrikoni-platform`
6. Click "Create Project"

### Step 2: Get DSN Key
1. After project creation, you'll see the DSN on setup page
2. OR: Go to **Settings** → **Projects** → **afrikoni-platform** → **Client Keys (DSN)**
3. Copy the DSN (looks like: `https://abc123@o456789.ingest.sentry.io/789012`)

### Step 3: Configure Environment
Add to `.env`:
```
VITE_SENTRY_DSN=https://your-actual-dsn-here
```

### Step 4: Initialize Sentry (Already Done)
The app is already configured to use Sentry when `VITE_SENTRY_DSN` is set. Check [src/main.jsx](src/main.jsx) for initialization code.

### Step 5: Test Error Tracking
```bash
# Start development server
npm run dev

# Open browser console and run:
throw new Error("Test Sentry Integration");

# Check Sentry dashboard - error should appear within 30 seconds
```

### Step 6: Set Up Alerts
1. In Sentry dashboard, go to **Alerts** → **Create Alert Rule**
2. Recommended alerts:
   - **High Error Rate**: Trigger when >100 errors/hour
   - **New Issue**: Notify on Slack when new error type appears
   - **Performance Degradation**: Alert when API response time >3s

---

## GOOGLE ANALYTICS 4 — User Behavior Analytics

### Why GA4?
- **User flow analysis**: Understand how buyers navigate from RFQ → trade
- **Conversion tracking**: Measure RFQ-to-trade conversion rate
- **Geographic insights**: See which countries generate most trades
- **Custom events**: Track button clicks, form submissions, trade milestones

### Step 1: Create GA4 Property
1. Go to https://analytics.google.com/
2. Sign in with Google account
3. Click **Admin** (bottom left gear icon)
4. Under **Account**, click **Create Account**
   - Account name: `Afrikoni`
   - Check all data sharing settings
5. Under **Property**, click **Create Property**
   - Property name: `Afrikoni Platform`
   - Reporting time zone: `(GMT+00:00) Africa/Accra`
   - Currency: `US Dollar`
6. Fill business details:
   - Industry: `E-commerce`
   - Business size: `Small` (1-10 employees) or actual size
7. Click **Create**

### Step 2: Set Up Data Stream
1. Select **Web** platform
2. Enter website URL: `https://afrikoni.com`
3. Stream name: `Production Website`
4. Click **Create stream**

### Step 3: Get Measurement ID
1. After creating stream, you'll see **Measurement ID** (format: `G-XXXXXXXXXX`)
2. Copy this ID

### Step 4: Configure Environment
Add to `.env`:
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 5: Initialize GA4 (Already Done)
The app is already configured to use GA4 when `VITE_GA_MEASUREMENT_ID` is set. Check [src/main.jsx](src/main.jsx) for initialization code.

### Step 6: Test Tracking
```bash
# Start development server
npm run dev

# Navigate through app:
# 1. Go to /dashboard
# 2. Click "Create RFQ"
# 3. Submit RFQ

# Check GA4 Real-Time Report:
# Admin → Data Streams → Click your stream → View tag details → See event counts
```

### Step 7: Set Up Custom Events (Optional)
Already tracked events:
- `rfq_created` - When user creates new RFQ
- `trade_transition` - When trade moves to new state
- `payment_completed` - When escrow payment succeeds
- `dispute_filed` - When user opens dispute

To add more events, edit [src/services/analytics.js](src/services/analytics.js).

---

## PRODUCTION DEPLOYMENT CHECKLIST

### Before Going Live:
- [ ] Sentry DSN configured in Vercel environment variables
- [ ] GA4 Measurement ID configured in Vercel
- [ ] Test Sentry by triggering test error in production
- [ ] Verify GA4 events appear in Real-Time report
- [ ] Set up Sentry alert rules (email/Slack)
- [ ] Create GA4 dashboard for key metrics

### Recommended Vercel Environment Variables:
```bash
# Add via Vercel Dashboard → Settings → Environment Variables
VITE_SENTRY_DSN=https://your-dsn-here
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Monitoring Dashboard URLs:
- Sentry: `https://sentry.io/organizations/YOUR_ORG/issues/`
- GA4: `https://analytics.google.com/analytics/web/#/p123456789/reports/intelligenthome`

---

## TROUBLESHOOTING

### Sentry Not Capturing Errors
**Symptom**: Errors occur but don't appear in Sentry dashboard

**Solutions**:
1. Verify `VITE_SENTRY_DSN` is set (check with `console.log(import.meta.env.VITE_SENTRY_DSN)`)
2. Check browser console for Sentry initialization errors
3. Ensure DSN format is correct (must start with `https://`)
4. Verify Sentry project is not paused (Settings → General)

### GA4 Not Showing Events
**Symptom**: User actions tracked but GA4 shows 0 events

**Solutions**:
1. Verify `VITE_GA_MEASUREMENT_ID` is set and starts with `G-`
2. Check browser console for GA4 gtag errors
3. Wait 24-48 hours for data to appear in standard reports (Real-Time should show immediately)
4. Use GA4 DebugView to see events in real-time (Admin → DebugView)

### High Sentry Error Volume (Exceeding Free Tier)
**Solution**: Set up sampling to capture only % of errors:
```javascript
// In src/main.jsx Sentry.init()
sampleRate: 0.5, // Capture 50% of errors
tracesSampleRate: 0.1, // Capture 10% of performance traces
```

---

## COST ESTIMATES

### Sentry
- **Free tier**: 5,000 errors/month + 10,000 performance traces
- **Team plan**: $26/month for 50,000 errors + 100K traces
- **Business plan**: $80/month for 500K errors + 1M traces

### Google Analytics 4
- **Free**: Unlimited events, 14 months data retention
- **GA4 360**: $50,000+/year for enterprise features (not needed for MVP)

**Recommendation**: Start with free tiers, upgrade Sentry to Team plan when >5K errors/month.

---

## ADDITIONAL RESOURCES

- Sentry React Guide: https://docs.sentry.io/platforms/javascript/guides/react/
- GA4 Setup Guide: https://support.google.com/analytics/answer/9304153
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
