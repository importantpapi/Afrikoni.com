# Fix Google OAuth redirect_uri_mismatch - Exact Steps

## 🔍 What I See in Your Screenshot

Your OAuth client shows "Client ID for Desktop" - this might be the issue! For Supabase, you need a **Web application** client, not Desktop.

## ✅ Step-by-Step Fix

### Step 1: Check Client Type
1. In the Google Cloud Console, look at the top of the page
2. If it says "Client ID for Desktop", you need to create a **Web application** client instead

### Step 2: Create Web Application Client (if needed)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure OAuth consent screen first (if not done)
5. In the creation form:
   - **Application type**: Select **"Web application"** (NOT Desktop!)
   - **Name**: `Afrikoni Web Client`
   - **Authorized redirect URIs**: Click **"+ ADD URI"** and add:
     ```
     https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
     ```
6. Click **"Create"**
7. Copy the **Client ID** and **Client Secret**

### Step 3: Update Supabase with New Credentials
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
2. Click on **Google** provider
3. Paste the new **Client ID** (from Step 2)
4. Paste the new **Client Secret** (from Step 2)
5. Click **"Save"**

### Step 4: If You Want to Use Existing Client
If your existing client (`415378128354-fnbicopacoi8ngetvb3s48qe9ujgurnh`) is actually a Web application:

1. Scroll down on that page to find **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"**
3. Add exactly:
   ```
   https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

## 🎯 Quick Checklist

- [ ] OAuth client type is **"Web application"** (not Desktop)
- [ ] **Authorized redirect URIs** section has: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- [ ] No localhost URLs in redirect URIs
- [ ] Client ID and Secret are updated in Supabase
- [ ] Waited 1-2 minutes after saving

## 🔗 Direct Links

- **Google Cloud Console Credentials**: https://console.cloud.google.com/apis/credentials
- **Supabase Google Provider**: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers

## ⚠️ Important

The redirect URI in Google Cloud Console must be:
- ✅ `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- ❌ NOT `http://localhost:5174/auth/callback`
- ❌ NOT any localhost URL

Google redirects to Supabase, then Supabase redirects to your app!

