# Fix Supabase URL Configuration

## 🔴 Issues Found

1. **Site URL** is set to `http://localhost:3000` (should be production URL)
2. **Redirect URL** is missing `https://` protocol: `afrikoni-1gcwl2xws-youbas-projects.vercel.app`

## ✅ Fix Steps

### Step 1: Update Site URL

1. In the **"Site URL"** section, change:
   - **From:** `http://localhost:3000`
   - **To:** `https://afrikoni.com` (or your Vercel URL: `https://afrikoni-1gcwl2xws-youbas-projects.vercel.app`)
2. Click **"Save changes"**

### Step 2: Fix Redirect URL

1. Find the redirect URL: `afrikoni-1gcwl2xws-youbas-projects.vercel.app`
2. Click on it to edit (or delete and re-add)
3. Change it to:
   ```
   https://afrikoni-1gcwl2xws-youbas-projects.vercel.app/auth/callback
   ```
   (Add `https://` at the start and `/auth/callback` at the end)
4. Click **"Save"**

### Step 3: Final Redirect URLs List

You should have exactly these 3 URLs:

1. ✅ `http://localhost:5174/auth/callback` (for local dev)
2. ✅ `https://afrikoni.com/auth/callback` (for production)
3. ✅ `https://afrikoni-1gcwl2xws-youbas-projects.vercel.app/auth/callback` (for Vercel)

## 🎯 Quick Fix

**Site URL:** Change to `https://afrikoni.com` (or your Vercel URL)

**Redirect URLs:** Make sure all have:
- `https://` protocol (not `http://` for production)
- `/auth/callback` at the end
- No trailing slashes

