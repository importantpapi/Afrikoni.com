# 🚨 CRITICAL: Supabase SMTP Configuration for hello@afrikoni.com

**Status:** URGENT - Required for auth email delivery  
**Date:** 2025-01-21  
**Priority:** Production Blocking

---

## Problem

Users cannot receive authentication emails (verification, password reset) from `hello@afrikoni.com`. This is breaking login flows.

---

## Solution: Configure Supabase to Use Resend SMTP

Supabase Auth emails are currently using Supabase's default email service. We need to configure Supabase to send via Resend SMTP so emails come from `hello@afrikoni.com`.

---

## Step-by-Step Configuration

### Prerequisites

1. **Resend Account** with `afrikoni.com` domain verified
2. **Resend API Key** (starts with `re_...`)
3. **Resend SMTP Credentials** (from Resend dashboard)

### Step 1: Get Resend SMTP Credentials

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Settings → SMTP**
3. Copy these values:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` (SSL) or `587` (TLS)
   - **SMTP Username:** `resend`
   - **SMTP Password:** Your Resend API key (starts with `re_...`)

### Step 2: Configure Supabase SMTP

1. **Go to Supabase Dashboard:**
   - Navigate to: `https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers`
   - Or: **Authentication → Settings → Email**

2. **Enable Custom SMTP:**
   - Toggle **"Enable custom SMTP"** to **ON** (green)

3. **Fill SMTP Settings:**
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (recommended) or `587`
   - **Username:** `resend`
   - **Password:** Your Resend API key (e.g., `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Minimum interval per user:** `60` seconds

4. **Set Sender Details:**
   - **Sender email address:** `hello@afrikoni.com`
   - **Sender name:** `Afrikoni`

5. **Click "Save changes"**

### Step 3: Verify Domain in Resend

**IMPORTANT:** `afrikoni.com` must be verified in Resend for emails to send.

1. Go to [Resend Domains](https://resend.com/domains)
2. If `afrikoni.com` is not listed:
   - Click **"Add domain"**
   - Enter: `afrikoni.com`
   - Add DNS records (SPF, DKIM, DMARC) as shown by Resend
   - Wait for verification (usually 5-10 minutes)

3. If domain is already added:
   - Ensure it shows **"Verified"** status
   - If not verified, check DNS records

### Step 4: Test Email Delivery

1. **In Supabase Dashboard:**
   - Go to **Authentication → Users**
   - Click **"Invite user"** or create a test user
   - Check if email arrives from `hello@afrikoni.com`

2. **In Your App:**
   - Sign up with a new email
   - Check inbox for verification email
   - Verify it comes from `Afrikoni <hello@afrikoni.com>`

---

## Alternative: Use Supabase Built-in Email (Temporary)

If Resend SMTP configuration fails, you can temporarily use Supabase's built-in email service:

1. **In Supabase Dashboard:**
   - Go to **Authentication → Settings → Email**
   - **Disable** "Enable custom SMTP"
   - Set **Sender email:** `hello@afrikoni.com`
   - Set **Sender name:** `Afrikoni`

2. **Verify Domain in Supabase:**
   - Supabase will show DNS records to add
   - Add SPF/DKIM records to your domain DNS
   - Wait for verification

**Note:** This uses Supabase's email service (rate-limited) but will work for testing.

---

## Troubleshooting

### Emails Still Not Sending

1. **Check Resend Dashboard:**
   - Go to **Emails** section
   - Check for failed deliveries
   - Review error messages

2. **Check Supabase Logs:**
   - Go to **Logs → Auth**
   - Look for SMTP errors
   - Check for authentication failures

3. **Verify SMTP Credentials:**
   - Ensure Resend API key is correct
   - Ensure port matches (465 for SSL, 587 for TLS)
   - Try switching ports if one doesn't work

### Domain Not Verified

1. **Check DNS Records:**
   - SPF: `v=spf1 include:resend.com ~all`
   - DKIM: (provided by Resend)
   - DMARC: (optional but recommended)

2. **Use DNS Checker:**
   - Visit [MXToolbox](https://mxtoolbox.com/spf.aspx)
   - Enter `afrikoni.com`
   - Verify records are live

### SMTP Authentication Failed

1. **Verify API Key:**
   - Ensure you're using the full API key (starts with `re_`)
   - Check for extra spaces or characters
   - Regenerate key if needed

2. **Check Port:**
   - Port `465` requires SSL
   - Port `587` requires TLS/STARTTLS
   - Ensure correct port for your setup

---

## Quick Reference

**Resend SMTP Settings:**
```
Host: smtp.resend.com
Port: 465 (SSL) or 587 (TLS)
Username: resend
Password: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Supabase Sender Settings:**
```
Sender email: hello@afrikoni.com
Sender name: Afrikoni
```

**Supabase Dashboard Path:**
```
https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers
```

---

## Status Check

After configuration, verify:

- [ ] Custom SMTP enabled in Supabase
- [ ] SMTP credentials saved successfully
- [ ] Sender email set to `hello@afrikoni.com`
- [ ] Domain verified in Resend
- [ ] Test email sent successfully
- [ ] Email received from `Afrikoni <hello@afrikoni.com>`

---

## Support

If issues persist:
1. Check Supabase status: https://status.supabase.com
2. Check Resend status: https://status.resend.com
3. Contact: hello@afrikoni.com

---

**Last Updated:** 2025-01-21  
**Priority:** CRITICAL - Production Blocking

