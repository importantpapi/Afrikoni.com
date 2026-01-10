# 🚨 Supabase SMTP Configuration - Critical Setup Guide

**Status:** URGENT - Required for auth email delivery  
**Date:** 2025-01-21  
**Priority:** Production Blocking

---

## Problem

Afrikoni signup currently fails with "Error sending confirmation email" because Supabase Auth SMTP is not configured. Users are created but cannot receive verification emails.

**Current Behavior:**
- ✅ User account is created
- ❌ Email delivery fails
- ⚠️ User sees error message (but can still access)

**Target Behavior:**
- ✅ User account is created
- ✅ Email delivery succeeds
- ✅ User receives verification email from `hello@afrikoni.com`

---

## Solution: Configure Supabase Auth SMTP

**IMPORTANT:** Supabase Auth emails DO NOT use Edge Functions by default. Custom SMTP is mandatory for branded auth emails from `hello@afrikoni.com`.

---

## Part 1: Resend Setup

### Step 1: Get Resend API Key

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys**
3. Create a new API key or copy existing one
4. **Save the key** - it starts with `re_...`

### Step 2: Verify Domain in Resend

1. Go to [Resend Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter: `afrikoni.com`
4. Resend will show DNS records to add

### Step 3: Add DNS Records

Add these records to your domain DNS (via your DNS provider):

#### SPF Record
```
Type: TXT
Name: @ (or afrikoni.com)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

#### DKIM Records
Resend will provide 2-3 DKIM records. Add them as:
```
Type: TXT
Name: <provided by Resend>
Value: <provided by Resend>
TTL: 3600
```

#### DMARC Record (Optional but Recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:hello@afrikoni.com
TTL: 3600
```

### Step 4: Wait for Verification

1. After adding DNS records, wait 5-10 minutes
2. Check Resend dashboard - domain status should show **"Verified"**
3. If not verified, check DNS propagation: [MXToolbox](https://mxtoolbox.com/spf.aspx)

---

## Part 2: Supabase SMTP Configuration

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qkeeufeiaphqylsnfhza`
3. Navigate to: **Authentication → Settings → Email**

### Step 2: Enable Custom SMTP

1. Find **"Enable custom SMTP"** toggle
2. Turn it **ON** (green/enabled)

### Step 3: Configure SMTP Settings

Fill in the following values:

**SMTP Host:**
```
smtp.resend.com
```

**SMTP Port:**
```
465
```
*(Use 465 for SSL. Alternative: 587 for TLS/STARTTLS)*

**SMTP Username:**
```
resend
```

**SMTP Password:**
```
<YOUR_RESEND_API_KEY>
```
*(Paste your Resend API key here - starts with `re_...`)*

**Minimum interval per user:**
```
60
```
*(Seconds between emails per user)*

### Step 4: Configure Sender Details

**Sender email address:**
```
hello@afrikoni.com
```

**Sender name:**
```
Afrikoni
```

### Step 5: Save Configuration

1. Click **"Save changes"** button
2. Wait for confirmation message
3. Test by creating a test user

---

## Part 3: Testing Email Delivery

### Test 1: Signup Flow

1. Go to your app signup page
2. Create a new test account
3. Check email inbox for verification email
4. Verify email comes from: `Afrikoni <hello@afrikoni.com>`

### Test 2: Password Reset

1. Go to forgot password page
2. Enter test email
3. Check email inbox for reset link
4. Verify email comes from: `Afrikoni <hello@afrikoni.com>`

### Test 3: Check Supabase Logs

1. Go to Supabase Dashboard → **Logs → Auth**
2. Look for email sending events
3. Check for any SMTP errors

---

## Part 4: Troubleshooting

### Emails Still Not Sending

**Check 1: Resend Dashboard**
- Go to Resend Dashboard → **Emails**
- Check for failed deliveries
- Review error messages

**Check 2: Domain Verification**
- Go to Resend Dashboard → **Domains**
- Ensure `afrikoni.com` shows **"Verified"** status
- If not verified, check DNS records

**Check 3: SMTP Credentials**
- Verify Resend API key is correct
- Ensure no extra spaces in credentials
- Try regenerating API key if needed

**Check 4: Supabase Logs**
- Go to Supabase Dashboard → **Logs → Auth**
- Look for SMTP authentication errors
- Check for connection timeouts

### SMTP Authentication Failed

**Possible Causes:**
1. Incorrect API key
2. Wrong port (try 587 instead of 465)
3. Extra spaces in credentials
4. API key expired or revoked

**Solutions:**
1. Regenerate Resend API key
2. Copy-paste credentials carefully
3. Try port 587 (TLS) instead of 465 (SSL)
4. Verify API key in Resend dashboard

### Domain Not Verified

**Check DNS Records:**
1. Use [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)
2. Enter `afrikoni.com`
3. Verify SPF record is live
4. Check DKIM records are present

**Common Issues:**
- DNS propagation delay (wait 10-15 minutes)
- Wrong record type (must be TXT)
- Typos in record values
- DNS provider caching

---

## Part 5: Safety Switch (Optional)

### Temporarily Disable Email Confirmation

**Note:** This is optional and can be re-enabled after SMTP is confirmed working.

1. Go to Supabase Dashboard → **Authentication → Settings**
2. Find **"Confirm email"** setting
3. Toggle **OFF** (temporarily)
4. Click **"Save changes"**

**Why This Helps:**
- Users can sign up immediately without email verification
- Reduces user friction while SMTP is being configured
- Can be re-enabled once emails are working

**When to Re-enable:**
- After SMTP is configured and tested
- After domain is verified in Resend
- After test emails are successfully delivered

---

## Part 6: Verification Checklist

After configuration, verify:

- [ ] Resend domain `afrikoni.com` is verified
- [ ] SPF record is live (check via MXToolbox)
- [ ] DKIM records are live
- [ ] Supabase custom SMTP is enabled
- [ ] SMTP credentials are saved
- [ ] Sender email is `hello@afrikoni.com`
- [ ] Sender name is `Afrikoni`
- [ ] Test signup email is received
- [ ] Test password reset email is received
- [ ] Emails come from `Afrikoni <hello@afrikoni.com>`
- [ ] No errors in Supabase logs

---

## Quick Reference

### Resend SMTP Settings
```
Host: smtp.resend.com
Port: 465 (SSL) or 587 (TLS)
Username: resend
Password: <RESEND_API_KEY>
```

### Supabase Sender Settings
```
Sender email: hello@afrikoni.com
Sender name: Afrikoni
```

### DNS Records
```
SPF: v=spf1 include:resend.com ~all
DKIM: (provided by Resend)
DMARC: v=DMARC1; p=none; rua=mailto:hello@afrikoni.com
```

### Supabase Dashboard Path
```
https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
```

---

## Important Notes

### Supabase Auth Emails vs Edge Functions

**Supabase Auth emails** (signup verification, password reset):
- Use Supabase's built-in email system
- Require custom SMTP for branded emails
- Do NOT use Edge Functions by default
- Must configure SMTP in Supabase Dashboard

**Edge Functions** (custom emails):
- Use `auth-email` edge function
- Can send custom HTML emails
- Require Resend API key in function
- Separate from Supabase Auth emails

**For Afrikoni:**
- Configure Supabase SMTP for auth emails (this guide)
- Edge function is backup/optional

### Email Delivery Priority

1. **Supabase SMTP** (primary) - Configured via Dashboard
2. **Edge Function** (backup) - Already implemented
3. **Supabase Default** (fallback) - Unbranded, rate-limited

---

## Support

If issues persist:

1. **Check Resend Status:** https://status.resend.com
2. **Check Supabase Status:** https://status.supabase.com
3. **Review Supabase Logs:** Dashboard → Logs → Auth
4. **Review Resend Logs:** Dashboard → Emails
5. **Contact Support:** hello@afrikoni.com

---

## Status

**Current Status:** ⚠️ SMTP Not Configured  
**Target Status:** ✅ SMTP Configured and Verified  
**Priority:** CRITICAL - Production Blocking

---

**Last Updated:** 2025-01-21  
**Next Review:** After SMTP configuration complete

