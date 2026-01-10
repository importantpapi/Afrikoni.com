# Facebook OAuth Domain Configuration Fix

## 🔴 Problem
Users are seeing this error when trying to sign in with Facebook:
```
Can't load URL
The domain of this URL isn't included in the app's domains. 
To be able to load this URL, add all domains and sub-domains of your app 
to the App Domains field in your app settings.
```

## ✅ Solution

### Step 1: Configure Facebook App Settings

1. **Go to Facebook Developers Console:**
   - Visit: https://developers.facebook.com/apps
   - Select your Afrikoni app (or create one if needed)

2. **Add App Domains:**
   - Go to **Settings** → **Basic**
   - Scroll to **App Domains**
   - Add these domains:
     ```
     afrikoni.com
     www.afrikoni.com
     ```
   - Click **Save Changes**

3. **Add Valid OAuth Redirect URIs:**
   - Go to **Settings** → **Basic**
   - Scroll to **Valid OAuth Redirect URIs**
   - Add these URIs:
     ```
     https://www.afrikoni.com/auth/callback
     https://afrikoni.com/auth/callback
     https://www.afrikoni.com/*
     https://afrikoni.com/*
     ```
   - Click **Save Changes**

4. **Configure Site URL (if using Facebook Login):**
   - Go to **Settings** → **Basic**
   - Set **Site URL** to:
     ```
     https://www.afrikoni.com
     ```

### Step 2: Configure Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your Afrikoni project

2. **Configure Facebook Provider:**
   - Go to **Authentication** → **Providers**
   - Click on **Facebook**
   - Enable Facebook provider
   - Add your Facebook App ID and App Secret
   - Set **Redirect URL** to:
     ```
     https://www.afrikoni.com/auth/callback
     ```

3. **Add Redirect URLs:**
   - Go to **Authentication** → **URL Configuration**
   - Add to **Redirect URLs**:
     ```
     https://www.afrikoni.com/auth/callback
     https://afrikoni.com/auth/callback
     https://www.afrikoni.com/auth/confirm
     https://www.afrikoni.com/auth/success
     ```

### Step 3: Test

1. Try signing in with Facebook
2. Should redirect properly without domain errors
3. If still having issues, check browser console for specific errors

## 🔧 Alternative: Use Email/Password Sign-In

If Facebook OAuth continues to have issues, users can:
- Sign in with email/password
- Sign up with email/password
- Use Google sign-in (if configured)

The app now shows clear error messages and suggests using email/password as an alternative.

## 📝 Notes

- Facebook requires exact domain matches (including www)
- Changes may take a few minutes to propagate
- Test in incognito mode to avoid cached redirects
- Ensure your production domain matches exactly what's in Facebook settings

