# Fix: "Failed to fetch" Email Error

## 🔍 Issue

Email tests are showing "Failed to fetch" errors even though:
- ✅ Email Provider: `RESEND` is configured
- ✅ API Key: `✓ Configured` and `✓ Valid`
- ✅ Status: `✓ Ready`

## 🎯 Most Likely Cause

**Domain not verified in Resend**

Resend requires you to verify the domain `afrikoni.com` before you can send emails from `hello@afrikoni.com`.

## ✅ Solution

### Step 1: Verify Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"** or find `afrikoni.com` if already added
3. Add the domain: `afrikoni.com`
4. Resend will provide DNS records to add:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT - optional but recommended)

### Step 2: Add DNS Records

1. Go to your domain registrar (where you bought `afrikoni.com`)
2. Navigate to DNS settings
3. Add the DNS records provided by Resend
4. Wait for DNS propagation (usually 5-60 minutes)

### Step 3: Verify Domain Status

1. Go back to Resend Dashboard → Domains
2. Check that `afrikoni.com` shows **"Verified"** status
3. Once verified, you can send emails from `hello@afrikoni.com`

## 🧪 Test After Verification

1. Refresh the test page: `/dashboard/test-emails`
2. Click **"Run API Diagnostic Test"** button
3. If successful, try sending a test email
4. Check your inbox (and spam folder)

## 🔧 Alternative: Use Resend's Test Domain

If you need to test immediately without domain verification:

1. Temporarily change the `from` address to Resend's test domain
2. Use: `onboarding@resend.dev` (Resend's test domain)
3. **Note:** This is only for testing. Production must use `hello@afrikoni.com`

## 📋 Other Possible Causes

If domain verification doesn't fix it:

1. **CORS Issue:**
   - Resend API should support CORS
   - Check browser console for CORS errors
   - Try from a different browser/network

2. **API Key Issue:**
   - Verify API key is correct in `.env`
   - Check API key hasn't been revoked in Resend Dashboard
   - Ensure API key has email sending permissions

3. **Network Issue:**
   - Check internet connection
   - Try from a different network
   - Check if firewall is blocking `api.resend.com`

4. **Browser Security:**
   - Try a different browser
   - Disable browser extensions temporarily
   - Check browser console for security errors

## 🎯 Quick Diagnostic

Use the **"Run API Diagnostic Test"** button on the test page to get detailed error information.

## ✅ Verification Checklist

- [ ] Domain `afrikoni.com` added to Resend
- [ ] DNS records added to domain registrar
- [ ] Domain shows "Verified" in Resend Dashboard
- [ ] API key is correct and active
- [ ] Diagnostic test passes
- [ ] Test email sends successfully

---

**Status:** Waiting for domain verification in Resend
**Next Step:** Verify `afrikoni.com` domain in Resend Dashboard

