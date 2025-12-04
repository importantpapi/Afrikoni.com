# 🚀 Facebook OAuth - Quick Start

## ⚡ 5-Minute Setup

### 1️⃣ Create Facebook App
**URL:** https://developers.facebook.com/
- Click "My Apps" → "Create App"
- Choose "Consumer" → Fill name: `Afrikoni`
- Click "Create App"

### 2️⃣ Add Facebook Login
- Find "Facebook Login" → Click "Set Up"
- Go to Settings → Facebook Login

### 3️⃣ Add Redirect URI
**Add this EXACT URL:**
```
https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
```
- Click "+ Add URI"
- Paste the URL above
- Click "Save Changes"

### 4️⃣ Enable Email Permission
- Go to "Use Cases" → "Authentication and Account Creation"
- Click "Edit"
- Make sure `email` is added (click "Add" if needed)
- Both `public_profile` and `email` should show "Ready for testing"

### 5️⃣ Get Credentials
- Go to "Settings" → "Basic"
- Copy **App ID** (looks like: `1234567890123456`)
- Click "Show" under App Secret → Copy **App Secret**
- **Save both!**

### 6️⃣ Add to Supabase
**URL:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
- Find "Facebook" → Expand it
- Toggle **"Facebook Enabled"** to **ON**
- Paste **App ID** in "Client ID"
- Paste **App Secret** in "Client Secret"
- Click **"Save"**

### 7️⃣ Test!
- Go to: https://afrikoni.com/login
- Click "Sign in with Facebook"
- Approve → You're in! 🎉

---

## ✅ Checklist

- [ ] Facebook App created
- [ ] Facebook Login added
- [ ] Redirect URI: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
- [ ] Email permission enabled
- [ ] App ID copied
- [ ] App Secret copied
- [ ] Added to Supabase
- [ ] Tested sign-in

---

## 🔗 Direct Links

- **Facebook Developers:** https://developers.facebook.com/
- **Supabase Facebook:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
- **Your Login Page:** https://afrikoni.com/login

---

## 💡 Pro Tips

1. **Development Mode:** Your app starts in "Development" mode - only you can test. This is fine for now!
2. **App Review:** To go live for all users, you'll need to submit for App Review later (not needed now)
3. **Test Users:** You can add test users in Facebook App Settings → Roles → Test Users

---

**That's it! Your Facebook OAuth is ready! 🎊**

