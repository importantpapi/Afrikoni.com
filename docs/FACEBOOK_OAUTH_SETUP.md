# Facebook OAuth Setup - Step by Step

## 🎯 Quick Setup (15 minutes)

### Step 1: Create Facebook App

1. Go to: https://developers.facebook.com/
2. Click **"My Apps"** at the top right
3. Click **"Create App"**
4. Select **"Consumer"** → Click **"Next"**
5. Fill in:
   - **App name:** `Afrikoni`
   - **App contact email:** Your email
   - Click **"Create App"**

### Step 2: Add Facebook Login Product

1. On the "Add Products to Your App" page, find **"Facebook Login"**
2. Click **"Set Up"** under it
3. In the left sidebar, click **"Settings"** under "Facebook Login"

### Step 3: Configure Redirect URI

1. Under **"Valid OAuth Redirect URIs"**, click **"+ Add URI"**
2. Add exactly:
   ```
   https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
   ```
3. Click **"Save Changes"**

### Step 4: Enable Email Permission

1. In the left sidebar, go to **"Use Cases"**
2. Find **"Authentication and Account Creation"**
3. Click **"Edit"**
4. Make sure **"email"** is added (click **"Add"** if not)
5. Both `public_profile` and `email` should show **"Ready for testing"**

### Step 5: Get Your App Credentials

1. In the left sidebar, click **"Settings"** → **"Basic"**
2. **IMPORTANT:** Copy these two values:
   - **App ID** (looks like: `1234567890123456`)
   - **App Secret** (click "Show" to reveal it)
   - **Save them somewhere safe!**

### Step 6: Add to Supabase

1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
2. Find **"Facebook"** in the list
3. Click to expand it
4. Toggle **"Facebook Enabled"** to **ON**
5. Paste your **Facebook App ID** in the "Client ID" field
6. Paste your **Facebook App Secret** in the "Client Secret" field
7. Click **"Save"**

### Step 7: Test It!

1. Go to: https://afrikoni.com/login (or your localhost)
2. Click **"Sign in with Facebook"**
3. Approve the OAuth request
4. You should be redirected back and logged in!

## ✅ Quick Checklist

- [ ] Facebook App created
- [ ] Facebook Login product added
- [ ] Redirect URI added: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- [ ] Email permission enabled
- [ ] App ID and App Secret copied
- [ ] Credentials added to Supabase
- [ ] Facebook enabled in Supabase
- [ ] Tested sign-in flow

## 🔗 Important URLs

- **Facebook Developers:** https://developers.facebook.com/
- **Supabase Facebook Provider:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
- **Your App Login:** https://afrikoni.com/login

## 🆘 Troubleshooting

**"App not available" error:**
- Make sure your Facebook App is in "Development" mode
- Add test users in Facebook App Settings → Roles → Test Users

**"Redirect URI mismatch":**
- Double-check the redirect URI in Facebook matches exactly:
  `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`

**"Email permission denied":**
- Make sure email is added in Use Cases → Authentication and Account Creation

## 📝 Notes

- Facebook App starts in "Development" mode (only you can test)
- To go live, you'll need to submit for App Review later
- For now, Development mode is fine for testing

