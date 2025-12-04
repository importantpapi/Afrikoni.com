# Simple OAuth Setup Guide - Step by Step

## 🎯 What You Need to Do

You need to:
1. Create OAuth apps in Google and Facebook
2. Get the credentials (Client ID & Secret)
3. Add them to Supabase

**Time needed:** 15-20 minutes

---

## 📘 PART 1: Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a Project
1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Name it: `Afrikoni OAuth` (or any name)
4. Click **"Create"**
5. Wait a few seconds, then select this new project from the dropdown

### Step 3: Enable Google+ API
1. In the left menu, go to **"APIs & Services"** → **"Library"**
2. Search for: `Google+ API`
3. Click on it and click **"Enable"**

### Step 4: Create OAuth Credentials
1. Go to **"APIs & Services"** → **"Credentials"** (in left menu)
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If asked, configure OAuth consent screen:
   - Choose **"External"** → **"Create"**
   - App name: `Afrikoni`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"** through the steps
   - Click **"Back to Dashboard"** at the end
5. Back to creating credentials:
   - Application type: **"Web application"**
   - Name: `Afrikoni Web Client`
   - **Authorized redirect URIs**: Click **"+ ADD URI"** and paste:
     ```
     https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**
6. **IMPORTANT:** Copy these two values:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client secret** (click "Show" to see it, looks like: `GOCSPX-...`)
   - **Save them somewhere safe!**

---

## 📘 PART 2: Facebook OAuth Setup

### Step 1: Go to Facebook Developers
1. Open: https://developers.facebook.com/
2. Sign in with your Facebook account

### Step 2: Create an App
1. Click **"My Apps"** at the top right
2. Click **"Create App"**
3. Select **"Consumer"** → **"Next"**
4. Fill in:
   - App name: `Afrikoni`
   - App contact email: Your email
   - Click **"Create App"**

### Step 3: Add Facebook Login
1. On the "Add Products to Your App" page, find **"Facebook Login"**
2. Click **"Set Up"** under it
3. In the left sidebar, click **"Settings"** under "Facebook Login"
4. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
   ```
5. Click **"Save Changes"**

### Step 4: Get Your App Credentials
1. In the left sidebar, click **"Settings"** → **"Basic"**
2. **IMPORTANT:** Copy these two values:
   - **App ID** (looks like: `1234567890123456`)
   - **App Secret** (click "Show" to reveal it)
   - **Save them somewhere safe!**

### Step 5: Enable Email Permission
1. In the left sidebar, go to **"Use Cases"**
2. Find **"Authentication and Account Creation"**
3. Click **"Edit"**
4. Make sure **"email"** is added (click **"Add"** if not)
5. Both `public_profile` and `email` should show **"Ready for testing"**

---

## 📘 PART 3: Add Credentials to Supabase

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
2. Sign in if needed

### Step 2: Enable Google
1. Find **"Google"** in the list
2. Click to expand it
3. Toggle **"Google Enabled"** to **ON**
4. Paste your **Google Client ID** in the "Client ID" field
5. Paste your **Google Client Secret** in the "Client Secret" field
6. Click **"Save"**

### Step 3: Enable Facebook
1. Find **"Facebook"** in the list
2. Click to expand it
3. Toggle **"Facebook Enabled"** to **ON**
4. Paste your **Facebook App ID** in the "Client ID" field
5. Paste your **Facebook App Secret** in the "Client Secret" field
6. Click **"Save"**

### Step 4: Configure Redirect URLs (Optional but Recommended)
1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/url-configuration
2. Under **"Redirect URLs"**, add:
   - `http://localhost:5173/auth/callback` (for local development)
   - Your production URL when you deploy

---

## ✅ Test It!

1. Go to your app: http://localhost:5173/login
2. Click **"Sign in with Google"** or **"Sign in with Facebook"**
3. You should be redirected to Google/Facebook login
4. After logging in, you should be redirected back to your app!

---

## 🆘 Troubleshooting

**"Provider not enabled" error:**
- Make sure you toggled the provider ON in Supabase
- Make sure you saved the credentials

**"Redirect URI mismatch" error:**
- Double-check the redirect URI in Google/Facebook matches exactly:
  `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`

**"Invalid credentials" error:**
- Make sure you copied the Client ID and Secret correctly
- No extra spaces before/after

**Need help?** Let me know which step you're stuck on!

