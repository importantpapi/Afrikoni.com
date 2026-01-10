# Fix: Connection Refused After Google Login

## 🔴 The Problem

After approving Google OAuth, you're getting "ERR_CONNECTION_REFUSED" when trying to return to localhost.

## ✅ The Solution

Supabase needs to know it can redirect to your localhost URL. You need to add it to Supabase's redirect allowlist.

### Step 1: Add Localhost to Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/url-configuration
2. Scroll to **"Redirect URLs"** section
3. Click **"+ Add URL"** or the input field
4. Add exactly:
   ```
   http://localhost:5174/auth/callback
   ```
5. Click **"Save"**

### Step 2: Verify Your Dev Server is Running

Make sure your dev server is still running:
```bash
npm run dev
```

It should show:
```
Local: http://localhost:5174/
```

### Step 3: Test Again

1. Go to: http://localhost:5174/login
2. Click "Sign in with Google"
3. Approve the OAuth request
4. You should be redirected back successfully

## 🔍 Why This Happens

- Google redirects to Supabase: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- Supabase processes OAuth and tries to redirect to your app
- But Supabase blocks redirects to URLs not in the allowlist (for security)
- So you need to explicitly allow `http://localhost:5174/auth/callback`

## 📝 For Production

When you deploy, also add your production URL:
```
https://your-vercel-app.vercel.app/auth/callback
```

## ✅ Quick Checklist

- [ ] Dev server running on port 5174
- [ ] `http://localhost:5174/auth/callback` added to Supabase redirect URLs
- [ ] Saved changes in Supabase
- [ ] Try Google sign-in again

