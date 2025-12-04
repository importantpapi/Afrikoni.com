# 🐛 Sentry Error Tracking Setup Guide

## ✅ What's Done

- ✅ `@sentry/react` package installed
- ✅ Sentry code enabled in `src/utils/sentry.js`
- ✅ ErrorBoundary integrated with Sentry
- ✅ Main.jsx initializes Sentry on app start

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Sentry Account

1. Go to: https://sentry.io
2. Click **"Sign Up"** (or "Get Started")
3. Sign up with:
   - Email
   - Google account, or
   - GitHub account

### Step 2: Create a Project

1. After signing up, you'll see "Create your first project"
2. Select **"React"** as your platform
3. Project name: `Afrikoni` (or `afrikoni-marketplace`)
4. Click **"Create Project"**

### Step 3: Get Your DSN

1. After creating the project, you'll see a setup page
2. **Copy the DSN** - it looks like:
   ```
   https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. **Save it somewhere safe!**

### Step 4: Add DSN to Environment Variables

**For Local Development:**
1. Open your `.env` file (or create `.env.local`)
2. Add:
   ```bash
   VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Replace `xxxxx` with your actual DSN

**For Production (Vercel):**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - **Name:** `VITE_SENTRY_DSN`
   - **Value:** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
4. Select **"Production"** (and "Preview" if you want)
5. Click **"Save"**
6. Redeploy your site

### Step 5: Test It!

1. **Restart your dev server** (if local):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check the console:**
   - You should see: `[Sentry] Initialized successfully`

3. **Trigger a test error:**
   - Open browser console
   - Type: `throw new Error('Test error')`
   - Press Enter
   - Check Sentry dashboard → Issues
   - You should see the error appear within seconds!

---

## ✅ Verification Checklist

- [ ] Sentry account created
- [ ] React project created in Sentry
- [ ] DSN copied
- [ ] `VITE_SENTRY_DSN` added to `.env` (local)
- [ ] `VITE_SENTRY_DSN` added to Vercel (production)
- [ ] Dev server restarted
- [ ] Console shows: `[Sentry] Initialized successfully`
- [ ] Test error appears in Sentry dashboard

---

## 🎯 What Sentry Tracks

### Automatic Tracking:
- ✅ JavaScript errors
- ✅ Unhandled promise rejections
- ✅ React component errors (via ErrorBoundary)
- ✅ Network request failures
- ✅ Performance issues

### Manual Tracking:
You can also manually track errors:

```javascript
import { captureException, captureMessage } from '@/utils/sentry';

// Track an error
try {
  // some code
} catch (error) {
  captureException(error, { 
    context: 'user action',
    userId: user.id 
  });
}

// Track a message
captureMessage('Important event happened', 'info', {
  userId: user.id,
  action: 'purchase'
});
```

---

## 📊 Sentry Features Enabled

1. **Error Tracking** - All errors automatically captured
2. **Performance Monitoring** - 10% of transactions in production
3. **Session Replay** - 10% of sessions, 100% of error sessions
4. **Source Maps** - Better error stack traces (if you upload source maps)

---

## 🔧 Advanced Configuration

### Upload Source Maps (Optional)

For better error stack traces in production:

1. Install Sentry CLI:
   ```bash
   npm install --save-dev @sentry/cli
   ```

2. Add to `package.json`:
   ```json
   "scripts": {
     "build": "vite build && sentry-cli sourcemaps inject --org YOUR_ORG --project YOUR_PROJECT ./dist && sentry-cli sourcemaps upload --org YOUR_ORG --project YOUR_PROJECT ./dist"
   }
   ```

3. Create `.sentryclirc`:
   ```ini
   [auth]
   token=YOUR_SENTRY_AUTH_TOKEN

   [defaults]
   org=YOUR_ORG
   project=YOUR_PROJECT
   ```

---

## 💡 Pro Tips

1. **Set up Alerts:**
   - Go to Sentry → Alerts
   - Create alerts for critical errors
   - Get notified via email/Slack

2. **Filter by Environment:**
   - Errors are tagged with `environment: development` or `production`
   - Filter in Sentry dashboard to see only production errors

3. **Ignore Known Errors:**
   - Some errors (like ad blockers) can be ignored
   - Go to Settings → Inbound Filters

4. **Release Tracking:**
   - Tag releases to see which version introduced errors
   - Helps with debugging

---

## 🆘 Troubleshooting

**"Sentry not initialized" in console:**
- Check that `VITE_SENTRY_DSN` is set correctly
- Restart dev server after adding to `.env`

**Errors not appearing in Sentry:**
- Check browser console for Sentry errors
- Verify DSN is correct
- Check Sentry project settings → Client Keys

**Too many errors:**
- Adjust `tracesSampleRate` to lower value (e.g., 0.05 for 5%)
- Use Inbound Filters to ignore known errors

---

## 📝 Next Steps

1. **Set up alerts** - Get notified of critical errors
2. **Configure release tracking** - Tag deployments
3. **Upload source maps** - Better error debugging
4. **Set up integrations** - Slack, email, etc.

---

**Sentry is ready! Just add your DSN and you're tracking errors! 🚀**

