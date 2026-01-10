# 🔍 Client Signup Debugging Guide

## Issue: Signup works for you but not for clients

### Quick Checklist (Ask Clients to Check)

1. **Browser Console Errors**
   - Client should open browser DevTools (F12)
   - Go to Console tab
   - Try to signup
   - Note any red error messages
   - Share screenshot or copy errors

2. **What Happens When They Click "Create Account"**
   - Does button show loading spinner? ✅/❌
   - Does page reload? ✅/❌
   - Do error messages appear? ✅/❌
   - Does nothing happen at all? ✅/❌

3. **Network Tab Check**
   - Open DevTools → Network tab
   - Try to signup
   - Look for request to `supabase.co/auth/v1/signup`
   - What's the status code? (200, 400, 500, etc.)
   - What's the response?

4. **Browser & Device Info**
   - Browser: Chrome/Safari/Firefox/Edge?
   - Device: Desktop/Mobile/Tablet?
   - OS: Windows/Mac/iOS/Android?

---

## Common Causes & Solutions

### Cause 1: Missing Environment Variables in Production
**Symptom:** Console shows "Missing environment variables" or network requests fail

**Check:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `VITE_SUPABASE_URL` is set
3. Verify `VITE_SUPABASE_ANON_KEY` is set
4. Both should be set for **Production, Preview, Development**

**Fix:**
- Add missing variables
- Redeploy: Push to GitHub or click "Redeploy" in Vercel

---

### Cause 2: Old Cached Code
**Symptom:** Client sees old behavior, but you see new behavior

**Check:**
- Client should do hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

**Fix:**
- Already handled via `vercel.json` cache headers
- If persists, may need to invalidate CDN cache

---

### Cause 3: Validation Errors (Silent Failures)
**Symptom:** Form doesn't submit, no error shown

**Check:**
- Client fills ALL fields correctly?
- Email format valid?
- Password 8+ characters?
- Passwords match?

**Fix:**
- Error messages should now appear inline
- Check console for "VALIDATION ERRORS" log

---

### Cause 4: Network/Firewall Issues
**Symptom:** "Load failed" or connection errors

**Check:**
- Client's network can reach `supabase.co`?
- Corporate firewall blocking?
- VPN interfering?

**Fix:**
- User should see friendly error: "We're having trouble connecting to our servers"
- Ask client to try different network

---

### Cause 5: JavaScript Errors Breaking Form
**Symptom:** Console shows JavaScript errors before signup

**Check:**
- Browser console shows errors?
- Errors in `signup.jsx` file?

**Fix:**
- Check for syntax errors
- Check browser compatibility

---

## Quick Diagnostic Script (For Client)

Ask client to paste this in browser console and share output:

```javascript
// Check environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

// Check Supabase client
import { supabase } from '/src/api/supabaseClient.js';
console.log('Supabase client:', supabase ? 'INITIALIZED' : 'NOT INITIALIZED');

// Test connection
supabase.auth.getSession().then(result => {
  console.log('Session check:', result.error ? 'ERROR: ' + result.error.message : 'OK');
});
```

---

## What to Ask Client For

1. **Screenshot of browser console** (with errors visible)
2. **Screenshot of Network tab** (showing signup request)
3. **Exact steps they took** (what they entered, what happened)
4. **Browser/device info**
5. **Any error messages they see** (even if brief)

---

## Most Likely Issue (Based on "Works for me, not clients")

**Hypothesis:** Environment variables not set in Vercel production

**Why:** Your local `.env` file has them, but Vercel production might not.

**Check:** Vercel Dashboard → Settings → Environment Variables → Verify both are set for "Production"

**Fix:** Add variables → Redeploy

