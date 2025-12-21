# Authentication Troubleshooting Guide

## 🔴 Common Issues & Solutions

### Issue 1: User Didn't Receive Confirmation Email

**Symptoms:**
- User signed up but no confirmation email received
- User can't log in because email not confirmed

**Solutions:**

1. **Check Spam Folder:**
   - Ask user to check spam/junk folder
   - Add `hello@afrikoni.com` to contacts

2. **Resend Confirmation Email:**
   - User can click "Resend Confirmation Email" on login page
   - Or visit `/login?message=confirm-email`

3. **Verify Supabase Email Settings:**
   - Go to Supabase Dashboard → Authentication → Settings
   - Ensure "Enable email confirmations" is ON
   - Check email templates are configured
   - Verify SMTP settings (if using custom SMTP)

4. **Check Email Provider:**
   - Some email providers (Gmail, Outlook) may delay emails
   - Wait 5-10 minutes and check again

### Issue 2: Facebook Sign-In Not Working

**Symptoms:**
- Error: "Can't load URL - domain not included"
- Facebook redirect fails

**Solutions:**

1. **Configure Facebook App (See FACEBOOK_OAUTH_FIX.md):**
   - Add domains to Facebook App Settings
   - Add redirect URIs
   - Wait for changes to propagate (5-10 minutes)

2. **Use Alternative Sign-In:**
   - Use email/password sign-in
   - Use Google sign-in (if available)
   - The app now shows clear error messages with alternatives

### Issue 3: Can't Reset Password

**Symptoms:**
- User forgot password
- Reset email not received

**Solutions:**

1. **Use Forgot Password Page:**
   - Visit `/forgot-password`
   - Enter email address
   - Check inbox for reset link

2. **Resend Reset Email:**
   - Click "Send Another Email" on forgot password page
   - Check spam folder

3. **Contact Support:**
   - If still having issues, contact hello@afrikoni.com
   - Provide email address for manual reset

### Issue 4: Confirmation Link Expired

**Symptoms:**
- User clicks confirmation link but it doesn't work
- Error: "Link expired" or "Invalid token"

**Solutions:**

1. **Resend Confirmation Email:**
   - Go to login page
   - Click "Resend Confirmation Email"
   - Use new link (links expire after 24 hours)

2. **Check Link Format:**
   - Link should be: `https://www.afrikoni.com/auth/confirm?token=...`
   - If different format, contact support

### Issue 5: Can't Log In After Confirmation

**Symptoms:**
- Email confirmed but still can't log in
- Error: "Email not confirmed"

**Solutions:**

1. **Clear Browser Cache:**
   - Clear cookies and cache
   - Try incognito/private mode
   - Try different browser

2. **Check Email Confirmation:**
   - Verify email is actually confirmed in Supabase
   - Try logging out and back in

3. **Contact Support:**
   - If issue persists, contact hello@afrikoni.com
   - Provide email address for manual verification

## 🛠️ Admin Tools

### Manual Email Confirmation (Supabase)

1. Go to Supabase Dashboard → Authentication → Users
2. Find user by email
3. Click "Confirm Email" button
4. User can now log in

### Manual Password Reset (Supabase)

1. Go to Supabase Dashboard → Authentication → Users
2. Find user by email
3. Click "Reset Password" button
4. User receives reset email

## 📧 Support Contact

If users continue having issues:
- Email: hello@afrikoni.com
- Include: Email address, issue description, screenshots if possible

## ✅ Prevention

To prevent these issues:

1. **Configure Supabase Properly:**
   - Enable email confirmations
   - Set up SMTP (recommended)
   - Configure redirect URLs

2. **Configure Facebook OAuth:**
   - Add all domains
   - Add redirect URIs
   - Test thoroughly

3. **Monitor Email Delivery:**
   - Check Supabase logs
   - Monitor bounce rates
   - Use email service with good deliverability (Resend recommended)

4. **Provide Clear Instructions:**
   - Show clear error messages
   - Provide alternatives (email/password)
   - Include support contact info

