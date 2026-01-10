# Fix: Invalid Resend API Key

## ❌ Issue Found

The Resend API key is **invalid**. Resend API returned:
```json
{"statusCode":401,"name":"validation_error","message":"API key is invalid"}
```

## ✅ Solution: Get a New API Key

### Step 1: Go to Resend Dashboard

1. Go to [Resend Dashboard → API Keys](https://resend.com/api-keys)
2. Check if your current key exists
3. If it exists but is invalid, it may have been:
   - Revoked
   - Expired
   - Doesn't have email sending permissions

### Step 2: Create a New API Key

1. Click **"Create API Key"**
2. Give it a name: `Afrikoni Production` or `Afrikoni Email Service`
3. Select permissions: **"Full Access"** or at least **"Send Emails"**
4. Click **"Add"**
5. **Copy the new API key** (starts with `re_`)

### Step 3: Update the Secret

**Option A: Via Supabase CLI**
```bash
supabase secrets set RESEND_API_KEY=your_new_api_key_here
```

**Option B: Via Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza)
2. Navigate to: **Project Settings → Edge Functions → Secrets**
3. Find `RESEND_API_KEY`
4. Click **"Edit"** or **"Update"**
5. Paste the new API key
6. Click **"Save"**

### Step 4: Update Local `.env` (Optional)

If you want to test locally:
```env
VITE_EMAIL_API_KEY=your_new_api_key_here
```

### Step 5: Test

1. Restart dev server (if running)
2. Go to `/dashboard/test-emails`
3. Click "Test All Emails"
4. Should work now! ✅

## 🔍 Verify API Key Format

A valid Resend API key:
- Starts with `re_`
- Is about 36-40 characters long
- Example: `re_1234567890abcdefghijklmnopqrstuvwxyz`

## ⚠️ Important Notes

- **Never commit API keys to Git** - they're in `.gitignore`
- **Keep API keys secure** - don't share them publicly
- **Rotate keys regularly** - for security best practices

---

**Status:** ⚠️ API key needs to be regenerated in Resend
**Next Step:** Get a new API key from Resend Dashboard and update the secret

