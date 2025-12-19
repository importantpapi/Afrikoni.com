# Fix: CORS Email Error - Supabase Edge Function Solution

## ✅ Solution Implemented

Created a **Supabase Edge Function** to handle email sending server-side, avoiding CORS issues.

## 📋 What Was Done

1. **Created Supabase Edge Function** (`supabase/functions/send-email/index.ts`)
   - Handles email sending server-side
   - No CORS issues
   - Uses Resend API with API key stored securely

2. **Updated Email Service** (`src/services/emailService.js`)
   - Automatically tries Supabase Edge Function first
   - Falls back to direct API if Edge Function unavailable
   - All emails use `hello@afrikoni.com`

## 🚀 Deployment Steps

### Step 1: Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Get project-ref from Supabase Dashboard → Settings → General)

4. **Deploy the function**:
   ```bash
   supabase functions deploy send-email
   ```

### Step 2: Set Environment Variable in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **Project Settings → Edge Functions → Secrets**
3. Add secret:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_QzfeoKRt_2MpMRAe7f660HfYmjCda3y5w` (your Resend API key)

### Step 3: Update Email Provider Setting

**Option A: Use Supabase Edge Function (Recommended)**

Update `.env`:
```env
VITE_EMAIL_PROVIDER=supabase
```

**Option B: Keep Resend (Auto-fallback)**

Keep current setting:
```env
VITE_EMAIL_PROVIDER=resend
```

The code will automatically try Supabase Edge Function first, then fallback to direct Resend API.

### Step 4: Test

1. Restart dev server
2. Go to `/dashboard/test-emails`
3. Click "Test All Emails"
4. Should work without CORS errors!

## 🔧 Alternative: Quick Test Without Deployment

If you want to test immediately without deploying the Edge Function:

1. The code will automatically fallback to direct Resend API
2. However, you'll still get CORS errors in browser
3. **Solution:** Test from a server environment or deploy the Edge Function

## ✅ Benefits of Edge Function

- ✅ **No CORS issues** - Server-side execution
- ✅ **Secure** - API key stored in Supabase, not exposed to browser
- ✅ **Reliable** - No browser security restrictions
- ✅ **Scalable** - Handles high email volume

## 📝 Current Status

- ✅ Edge Function code created
- ⏳ Needs deployment to Supabase
- ⏳ Needs `RESEND_API_KEY` secret added
- ⏳ Email service updated to use Edge Function

---

**Next Step:** Deploy the Supabase Edge Function and add the `RESEND_API_KEY` secret

