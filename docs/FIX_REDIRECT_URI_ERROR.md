# Fix: Google OAuth redirect_uri_mismatch Error

## 🔴 The Problem

You're seeing: **"Error 400: redirect_uri_mismatch"**

This happens when the redirect URI in Google Cloud Console doesn't match what Supabase is sending.

## ✅ The Solution

**Important:** Google must redirect to **Supabase**, not directly to your app!

### Correct OAuth Flow:
1. User clicks "Sign in with Google" → Goes to Google
2. Google redirects to **Supabase**: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
3. Supabase processes the OAuth → Redirects to your app: `http://localhost:5174/auth/callback`

### What You Need to Fix:

In **Google Cloud Console**, the redirect URI must be the **Supabase callback URL**, not your local app URL.

## 📋 Step-by-Step Fix

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your project (the one with Client ID: `415378128354-fnbicopacoi8ngetvb3s48qe9ujgurnh`)

### Step 2: Go to OAuth Credentials
1. Navigate to: **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (the one ending in `...gurnh.apps.googleusercontent.com`)
3. Click on it to edit

### Step 3: Fix the Redirect URI
1. In the **"Authorized redirect URIs"** section, you should have:
   ```
   https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
   ```

2. **Remove any of these if they exist:**
   - ❌ `http://localhost:5173/auth/callback`
   - ❌ `http://localhost:5174/auth/callback`
   - ❌ `http://localhost:5173/auth/callback?redirect_to=...`
   - ❌ Any other localhost URLs

3. **Make sure you have exactly this:**
   - ✅ `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`

4. Click **"Save"**

### Step 4: Verify in Supabase
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
2. Click on **Google** provider
3. You should see the **Callback URL** shown there
4. Copy it - it should be: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
5. This is what you need in Google Cloud Console

## 🧪 Test Again

1. Go to: http://localhost:5174/login (note: your app is on port 5174, not 5173)
2. Click "Sign in with Google"
3. The error should be gone!

## 📝 Important Notes

- **Google redirects to Supabase** (not your app directly)
- **Supabase redirects to your app** (handled by the `redirectTo` parameter)
- The port number (5173 vs 5174) doesn't matter for Google - only Supabase needs to know your local URL
- For production, you'll add your production URL to Supabase's redirect allowlist, not Google's

## 🆘 Still Not Working?

If you still get the error:

1. **Double-check the exact URL:**
   - Must be: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
   - No trailing slash
   - Must be `https://` not `http://`
   - Must match exactly (case-sensitive)

2. **Wait a few minutes:**
   - Google sometimes takes 1-2 minutes to update redirect URIs

3. **Clear browser cache:**
   - Try incognito/private window
   - Clear cookies for `accounts.google.com`

4. **Check Supabase redirect allowlist:**
   - Go to: Authentication → URL Configuration
   - Make sure `http://localhost:5174/auth/callback` is in the allowlist
   - Add it if it's missing

## ✅ Quick Checklist

- [ ] Google Cloud Console has: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- [ ] No localhost URLs in Google Cloud Console redirect URIs
- [ ] Supabase has `http://localhost:5174/auth/callback` in redirect allowlist
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Testing on correct port (5174, not 5173)

