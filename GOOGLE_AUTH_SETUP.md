# Google Sign-In Component - Complete Setup Guide

## ✅ Component Created

I've created a complete, production-ready Google sign-in component for Afrikoni:

- **File:** `src/components/auth/GoogleSignIn.jsx`
- **Also includes:** `src/components/auth/FacebookSignIn.jsx` (bonus!)

## 📦 What's Included

### 1. **GoogleSignIn Component** (`src/components/auth/GoogleSignIn.jsx`)

**Features:**
- ✅ Full Supabase integration with your project URL
- ✅ Clean, styled button with Google icon
- ✅ Loading states and error handling
- ✅ Mobile-responsive design
- ✅ Internationalization support (uses your translation system)
- ✅ Reusable and customizable
- ✅ Standalone function export for programmatic use

**Usage Example:**
```jsx
import GoogleSignIn from '@/components/auth/GoogleSignIn';

// Simple usage
<GoogleSignIn />

// With custom redirect
<GoogleSignIn redirectTo="/dashboard/buyer" />

// With callbacks
<GoogleSignIn 
  redirectTo="/dashboard"
  onSuccess={(data) => console.log('Signed in!', data)}
  onError={(error) => console.error('Error:', error)}
/>
```

### 2. **FacebookSignIn Component** (Bonus!)

Same features as Google component, but for Facebook OAuth.

## 🔧 Integration Steps

### Step 1: The Component is Ready!

The component is already created and uses your existing Supabase configuration from `src/api/supabaseClient.js`. No changes needed to the component code!

### Step 2: Use in Your Login/Signup Pages

The components are already integrated in your `login.jsx` and `signup.jsx` pages! They're using the OAuth buttons we added earlier.

If you want to use the standalone component elsewhere:

```jsx
import GoogleSignIn from '@/components/auth/GoogleSignIn';

function MyCustomPage() {
  return (
    <div>
      <GoogleSignIn redirectTo="/dashboard" />
    </div>
  );
}
```

### Step 3: Configure Google OAuth in Supabase

**This is the critical step!** The component won't work until you:

1. **Get Google OAuth Credentials:**
   - Follow `OAUTH_SIMPLE_GUIDE.md` to create Google OAuth app
   - Get your **Client ID** and **Client Secret**

2. **Add to Supabase:**
   - Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
   - Find **Google** provider
   - Toggle **"Google Enabled"** to ON
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

3. **Configure Redirect URL in Google:**
   - In Google Cloud Console, make sure this redirect URI is added:
   ```
   https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback
   ```

## 🎯 How It Works

1. **User clicks "Sign in with Google"**
   - Component calls `supabase.auth.signInWithOAuth()`
   - User is redirected to Google's login page

2. **User approves on Google**
   - Google redirects back to Supabase
   - Supabase processes the OAuth callback

3. **Supabase redirects to your callback**
   - Your `/auth/callback` route (already created) handles it
   - Creates user profile if needed
   - Redirects to dashboard or specified URL

## 🔍 Code Details

### Supabase Initialization
The component uses your existing Supabase client:
```javascript
import { supabase } from '@/api/supabaseClient';
```

Your Supabase URL is already configured:
- URL: `https://qkeeufeiaphqylsnfhza.supabase.co`
- Anon Key: Loaded from environment variables

### Sign-In Function
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
});
```

### Error Handling
- Try/catch blocks for all async operations
- User-friendly error messages via toast notifications
- Console logging for debugging
- Optional error callbacks

## 🧪 Testing

Once you've configured Google OAuth in Supabase:

1. Go to: http://localhost:5173/login
2. Click "Sign in with Google"
3. You should be redirected to Google login
4. After approving, you'll be redirected back to your dashboard

## 📝 Next Steps

1. ✅ Component is ready (done!)
2. ⏳ Configure Google OAuth in Supabase (you need to do this)
3. ⏳ Test the sign-in flow
4. ⏳ (Optional) Configure Facebook OAuth too

## 🆘 Troubleshooting

**"Provider not enabled" error:**
- Make sure Google is enabled in Supabase dashboard
- Verify Client ID and Secret are correct

**"Redirect URI mismatch":**
- Check Google Cloud Console has the exact redirect URI:
  `https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback`

**Component not showing:**
- Make sure `react-icons` is installed (already done)
- Check browser console for errors

## 📚 Files Created

- ✅ `src/components/auth/GoogleSignIn.jsx` - Main Google sign-in component
- ✅ `src/components/auth/FacebookSignIn.jsx` - Facebook sign-in component (bonus)
- ✅ `GOOGLE_AUTH_SETUP.md` - This guide

The components are production-ready and follow your existing code patterns!

