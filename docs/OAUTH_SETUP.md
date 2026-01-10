# OAuth Setup Guide for Facebook and Google

## ✅ Code Implementation Complete

The frontend code for OAuth authentication with Facebook and Google has been fully implemented:

- ✅ OAuth buttons added to login and signup pages
- ✅ OAuth callback handler created
- ✅ Profile auto-creation for OAuth users
- ✅ Translations added for all languages
- ✅ React Icons installed for provider icons

## 🔧 Supabase Dashboard Configuration Required

To enable OAuth, you need to configure the providers in your Supabase dashboard:

### Step 1: Enable Google OAuth

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **afrikoni.com**
3. Navigate to **Authentication** → **Providers** (or **Sign In / Providers**)
4. Find **Google** in the list
5. Click **Enable**
6. You'll need to:
   - Create a Google OAuth app at [Google Cloud Console](https://console.cloud.google.com/)
   - Add your Supabase redirect URL: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
   - Copy your **Client ID** and **Client Secret**
   - Paste them into Supabase Google provider settings
7. Click **Save**

### Step 2: Enable Facebook OAuth

1. In the same **Authentication** → **Providers** page
2. Find **Facebook** in the list
3. Click **Enable**
4. You'll need to:
   - Create a Facebook App at [Facebook Developers](https://developers.facebook.com/)
   - Add your Supabase redirect URL: `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`
   - Copy your **App ID** and **App Secret**
   - Paste them into Supabase Facebook provider settings
5. Click **Save**

### Step 3: Configure Redirect URLs

Make sure your Supabase project has the correct redirect URLs configured:

1. Go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   - `http://localhost:5173/auth/callback` (for local development)
   - `https://your-production-domain.com/auth/callback` (for production)
   - `https://your-vercel-app.vercel.app/auth/callback` (if using Vercel)

### Step 4: Test OAuth Flow

1. Start your development server: `npm run dev`
2. Go to `/login` or `/signup`
3. Click "Sign in with Google" or "Sign in with Facebook"
4. Complete the OAuth flow
5. You should be redirected back to your app and logged in

## 📝 Important Notes

- **Profile Creation**: OAuth users will automatically get a profile created with:
  - Full name from OAuth provider
  - Email from OAuth provider
  - Default role: `buyer`
  - Avatar URL (if available from provider)
  - `onboarding_completed: false` (they'll need to complete onboarding)

- **Redirect Handling**: The OAuth callback preserves the original redirect URL, so users are sent back to where they started (e.g., if they clicked "Sign in" from a product page, they'll return there after OAuth).

- **Error Handling**: If OAuth fails, users see an error message and are redirected to the login page after 3 seconds.

## 🔒 Security Notes

- Never commit OAuth client secrets to version control
- Use environment variables for sensitive OAuth credentials (if needed in code)
- Regularly rotate OAuth app secrets
- Monitor OAuth usage in Supabase dashboard

## 🐛 Troubleshooting

**"OAuth provider not configured"**
- Make sure you've enabled the provider in Supabase dashboard
- Verify client ID and secret are correct

**"Redirect URI mismatch"**
- Check that your redirect URLs match exactly in both Supabase and OAuth provider settings
- Include both `http://localhost` (dev) and production URLs

**"Profile not created"**
- Check Supabase logs for errors
- Verify RLS policies allow profile creation
- Check that `profiles` table exists and has correct schema

## 📚 Resources

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Facebook OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

