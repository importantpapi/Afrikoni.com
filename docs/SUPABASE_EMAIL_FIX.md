# 🔧 Fix "Error sending confirmation email" in Signup

## Problem
Users see "Error sending confirmation email" when trying to sign up. This is a **Supabase Auth configuration issue**, not a code problem.

## Root Cause
Supabase Auth is trying to send confirmation emails, but:
1. Email confirmation is **enabled** in Supabase Dashboard
2. SMTP is **not configured** OR
3. SMTP credentials are **incorrect**

## ✅ Solution Options

### Option 1: Disable Email Confirmation (Fastest - For MVP/Testing)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Find **"Enable email confirmations"**
5. **Turn it OFF** (toggle switch)
6. Click **Save**
7. Try signup again - it should work immediately

**Result:** Users are created and logged in immediately without email verification.

---

### Option 2: Configure SMTP (For Production)

#### Step 1: Get SMTP Credentials

Choose one:
- **Resend** (Recommended): https://resend.com
- **SendGrid**: https://sendgrid.com
- **Mailgun**: https://mailgun.com
- **Custom SMTP**: Your own SMTP server

#### Step 2: Configure in Supabase

1. Go to Supabase Dashboard → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Fill in:
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (SSL) or `587` (TLS)
   - **SMTP User**: `resend`
   - **SMTP Password**: `re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk` (your Resend API key)
   - **Sender Email**: `hello@afrikoni.com`
   - **Sender Name**: `Afrikoni`
4. Click **Save**
5. Test by signing up a new user

**📋 See `RESEND_API_KEY_SETUP.md` for detailed step-by-step instructions.**

#### Step 3: Verify Domain (Important for Production)

If using Resend:
1. Go to Resend Dashboard → **Domains**
2. Add `afrikoni.com`
3. Add DNS records (SPF, DKIM) as shown
4. Wait for verification
5. Update sender email in Supabase to use verified domain

---

## 🔍 How to Debug

### Check Current Configuration

1. **Supabase Dashboard** → **Authentication** → **Settings**
   - Is "Enable email confirmations" ON or OFF?
   - Check "Email Templates" section

2. **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
   - Is SMTP configured?
   - Are credentials correct?

### Check Browser Console

After implementing the fix, the signup page now logs detailed information:

```javascript
// Success case
✅ Signup Success: {
  userCreated: true,
  sessionExists: true,
  emailConfirmed: true,
  email: "user@example.com",
  timestamp: "2024-01-01T12:00:00.000Z"
}

// Error case
❌ Signup Error: {
  message: "Error sending confirmation email",
  status: 400,
  name: "AuthApiError",
  email: "user@example.com",
  timestamp: "2024-01-01T12:00:00.000Z"
}
📧 Email Configuration Issue Detected
```

### Test Email Service

If SMTP is configured, test it:
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **"Send test email"**
3. Check if email arrives

---

## 📋 Quick Checklist

- [ ] Check Supabase Dashboard → Auth → Settings
- [ ] Verify "Enable email confirmations" status
- [ ] Check SMTP configuration in Project Settings
- [ ] Test signup and check browser console logs
- [ ] Verify email arrives (if confirmation enabled)
- [ ] Check Resend/SendGrid dashboard for sent emails

---

## 🚨 Common Issues

### Issue: "Error sending confirmation email" persists

**Solution:**
- Disable email confirmation (Option 1) for immediate fix
- OR fix SMTP credentials (Option 2)

### Issue: Emails go to spam

**Solution:**
- Verify domain in Resend/SendGrid
- Add SPF and DKIM records
- Use verified sender email

### Issue: SMTP test fails

**Solution:**
- Double-check credentials
- Verify SMTP port (465 for SSL, 587 for TLS)
- Check firewall/network restrictions
- Try different email provider

---

## 📝 Notes

- **For MVP/Development**: Disable email confirmation (Option 1)
- **For Production**: Configure SMTP with verified domain (Option 2)
- The frontend code is correct - this is purely a Supabase configuration issue
- Enhanced error logging is now in place to help debug

---

## ✅ After Fix

Once fixed, you should see:
- ✅ Signup creates user successfully
- ✅ User is redirected to onboarding (if auto-confirm) OR login (if email confirmation required)
- ✅ No "Error sending confirmation email" message
- ✅ Console shows success logs

