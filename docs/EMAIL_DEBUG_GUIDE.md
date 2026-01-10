# 🔍 Email Service Debug Guide

## Current Status

**Environment Variables:**
- ✅ `VITE_EMAIL_PROVIDER` = `resend` (configured)
- ⚠️ `VITE_EMAIL_API_KEY` = Set (but may be incomplete)

## How to Verify API Key is Complete

### Check in Vercel:
1. Go to: https://vercel.com/dashboard
2. Select: `afrikoni-marketplace` project
3. Settings → Environment Variables
4. Check `VITE_EMAIL_API_KEY`
5. **Verify it starts with `re_` and is ~50+ characters long**

### Test Email Sending:

**Option 1: Test via Newsletter Subscription**
1. Visit your site
2. Subscribe to newsletter
3. Check browser console (F12) for email logs
4. Look for: `📧 Email send error:` or `Email config:`

**Option 2: Check Resend Dashboard**
1. Go to: https://resend.com/emails
2. Check "Logs" tab
3. See if emails are being sent
4. Check for any errors

## Common Issues

### Issue 1: API Key Incomplete
**Symptom:** No emails sent, no errors shown
**Fix:** 
```bash
# Remove incomplete key
npx vercel env rm VITE_EMAIL_API_KEY production

# Add complete key
npx vercel env add VITE_EMAIL_API_KEY production
# Paste FULL key from Resend (starts with re_)
```

### Issue 2: API Key Wrong Format
**Symptom:** 401 Unauthorized errors
**Fix:** 
- Get new key from: https://resend.com/api-keys
- Make sure it has "Sending access" permission

### Issue 3: Domain Not Verified
**Symptom:** Emails rejected
**Fix:**
- Check Resend dashboard → Domains
- Verify `afrikoni.com` is verified
- Check DKIM and SPF records

## Debug Steps

1. **Check Console Logs:**
   - Open browser DevTools (F12)
   - Subscribe to newsletter
   - Look for email-related logs

2. **Check Vercel Logs:**
   ```bash
   npx vercel logs --follow
   ```
   - Look for email send attempts
   - Check for API errors

3. **Test Email Directly:**
   - Use Resend dashboard → Send Test Email
   - Verify domain works

## Expected Behavior

**When Working:**
- ✅ Newsletter subscription shows: "Welcome email sent to your inbox"
- ✅ Email appears in Resend logs
- ✅ Email received in inbox
- ✅ No console errors

**When Not Working:**
- ⚠️ Shows: "Subscribed successfully, but welcome email could not be sent"
- ⚠️ Console shows: `📧 Email send error:`
- ⚠️ No email in Resend logs

## Quick Fix

If emails still not working:

1. **Get fresh API key:**
   - https://resend.com/api-keys
   - Create new key: "Afrikoni Production"
   - Copy FULL key

2. **Update Vercel:**
   ```bash
   npx vercel env rm VITE_EMAIL_API_KEY production
   npx vercel env add VITE_EMAIL_API_KEY production
   # Paste complete key
   ```

3. **Redeploy:**
   ```bash
   npx vercel --prod
   ```

4. **Test again:**
   - Subscribe to newsletter
   - Check inbox
   - Check Resend logs

## Support

If still not working:
1. Check Resend dashboard for error messages
2. Verify domain verification status
3. Check Vercel environment variables are set correctly
4. Review browser console for detailed error messages

