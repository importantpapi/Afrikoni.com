# Supabase Email Configuration - Quick Setup Guide

## 🎯 Goal
Configure Supabase to send all authentication emails from **hello@afrikoni.com** with Afrikoni branding.

---

## ⚡ Quick Steps (5 minutes)

### Step 1: Update Email Sender
1. Go to: **Supabase Dashboard → Authentication → Settings → Email**
2. Scroll to **"SMTP Settings"** or **"Email Settings"**
3. Set:
   - **Sender email**: `hello@afrikoni.com`
   - **Sender name**: `Afrikoni`
4. If using custom SMTP:
   - Enable **"Use custom SMTP"**
   - Enter your SMTP credentials (host, port, username, password)
   - Ensure SMTP is configured to send from `hello@afrikoni.com`
5. Click **"Save"**

### Step 2: Update Email Template
1. Go to: **Supabase Dashboard → Authentication → Templates**
2. Click on **"Confirm signup"** template
3. Update:
   - **Subject**: `Verify Your Afrikoni Account`
   - **Content**: Copy the HTML from `scripts/supabase-email-template.html`
     - Open the file: `scripts/supabase-email-template.html`
     - Copy all content
     - Paste into Supabase template editor
     - **Important**: Keep `{{ .ConfirmationURL }}` exactly as is (this is the confirmation link)
4. Click **"Save"**

### Step 3: Test
1. Sign up with a new email address
2. Check your inbox
3. Verify:
   - ✅ Email is from: `Afrikoni <hello@afrikoni.com>`
   - ✅ Subject: "Verify Your Afrikoni Account"
   - ✅ Content shows Afrikoni branding (not Supabase default)

---

## 📧 Email Template File

The branded email template is saved at:
```
scripts/supabase-email-template.html
```

**Copy this entire file content** into the Supabase "Confirm signup" template editor.

---

## 🔧 Alternative: Using Script

If you want to use the automated script:

1. Add to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_PROJECT_REF=your_project_ref
   ```

2. Run:
   ```bash
   node scripts/configure-supabase-email.js
   ```

**Note**: The script provides instructions but Supabase templates must be updated manually in the dashboard.

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Email sender is `hello@afrikoni.com`
- [ ] Email subject is "Verify Your Afrikoni Account"
- [ ] Email content shows Afrikoni logo/branding
- [ ] Confirmation link works correctly
- [ ] Email is mobile-responsive
- [ ] Footer shows Afrikoni contact info

---

## 🆘 Troubleshooting

### Email still shows Supabase branding?
- Make sure you saved the template in Supabase dashboard
- Clear browser cache and try again
- Check that you copied the entire HTML from `supabase-email-template.html`

### Email not sending?
- Check SMTP settings in Supabase
- Verify `hello@afrikoni.com` is configured in your email provider
- Check Supabase logs for email errors

### Sender shows as different email?
- Verify SMTP settings are saved
- If using custom SMTP, ensure it's configured to send from `hello@afrikoni.com`
- Check your email provider's sender verification (SPF/DKIM)

---

## 📝 Notes

- Supabase uses Go templates. The `{{ .ConfirmationURL }}` variable is required.
- Email templates are stored in Supabase, not in your codebase.
- Changes take effect immediately after saving.
- Test with a fresh email address to see the new template.

---

**Last Updated**: January 2025  
**Status**: Ready for production

