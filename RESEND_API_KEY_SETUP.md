# 🚀 Resend API Key Configuration Guide

## Your Resend API Key
```
re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk
```

## ✅ Quick Setup (Choose One Method)

### Method 1: Configure Supabase Auth SMTP (Recommended - Direct Integration)

This configures Supabase Auth to send emails directly via Resend SMTP.

#### Step 1: Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **Afrikoni** project
3. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
4. Fill in the following:

   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465 (SSL) or 587 (TLS)
   SMTP User: resend
   SMTP Password: re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk
   Sender Email: hello@afrikoni.com
   Sender Name: Afrikoni
   ```

5. Click **Save**
6. Test by signing up a new user

#### Step 2: Verify Domain in Resend (Important for Production)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter: `afrikoni.com`
4. Add the DNS records shown:
   - **SPF Record**: `v=spf1 include:resend.com ~all`
   - **DKIM Records**: (provided by Resend)
5. Wait for verification (usually 5-10 minutes)
6. Once verified, emails from `hello@afrikoni.com` will work

---

### Method 2: Use Supabase Edge Function (Alternative)

If Method 1 doesn't work, use the Edge Function that's already set up.

#### Step 1: Set Environment Variable in Supabase

1. Go to Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. Add new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk`
3. Click **Save**

#### Step 2: Deploy Edge Function (if not already deployed)

```bash
# In your terminal
cd supabase/functions/auth-email
supabase functions deploy auth-email
```

#### Step 3: Configure Supabase to Use Edge Function

1. Supabase Dashboard → **Authentication** → **Settings**
2. Find **"Email Templates"** section
3. For each template (Signup, Password Reset, etc.):
   - Set **"Use custom email template"** to ON
   - This will use the Edge Function automatically

---

## 🧪 Testing

### Test 1: Signup Flow

1. Go to your signup page: `http://localhost:5173/signup`
2. Fill in the form and submit
3. Check browser console for logs:
   ```
   ✅ Signup Success: {
     userCreated: true,
     sessionExists: true,
     emailConfirmed: false,
     ...
   }
   ```
4. Check your email inbox for confirmation email
5. Check [Resend Dashboard](https://resend.com/emails) to see sent emails

### Test 2: Password Reset

1. Go to forgot password page
2. Enter your email
3. Check email inbox for reset link
4. Verify email is from `hello@afrikoni.com`

### Test 3: Supabase Test Email

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **"Send test email"**
3. Enter your email address
4. Check inbox

---

## 🔍 Troubleshooting

### Issue: "Error sending confirmation email" still appears

**Check:**
1. Is SMTP configured correctly in Supabase Dashboard?
2. Are the credentials correct? (no extra spaces)
3. Is the Resend API key valid? (starts with `re_`)
4. Check browser console for detailed error logs

**Solution:**
- Double-check SMTP settings in Supabase Dashboard
- Verify API key is correct
- Try disabling email confirmation temporarily to test

### Issue: Emails not arriving

**Check:**
1. Resend Dashboard → **Emails** - see if emails are being sent
2. Check spam folder
3. Verify domain is verified in Resend (if using `hello@afrikoni.com`)

**Solution:**
- If using unverified domain, Resend may block emails
- Verify domain in Resend Dashboard
- Or use Resend's default domain temporarily for testing

### Issue: SMTP connection fails

**Check:**
1. Port 465 (SSL) vs 587 (TLS) - try both
2. Firewall/network restrictions
3. API key permissions

**Solution:**
- Try port 587 (TLS) instead of 465 (SSL)
- Check if your network allows SMTP connections
- Verify API key has email sending permissions

---

## 📋 Configuration Checklist

- [ ] Resend API key obtained: `re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk`
- [ ] SMTP configured in Supabase Dashboard (Method 1)
- [ ] OR Edge Function secret set (Method 2)
- [ ] Domain verified in Resend Dashboard (for production)
- [ ] Test email sent successfully
- [ ] Signup flow tested - email arrives
- [ ] Password reset tested - email arrives
- [ ] Emails show correct sender: `Afrikoni <hello@afrikoni.com>`

---

## 🎯 Expected Result

After configuration:
- ✅ Signup creates user and sends confirmation email
- ✅ Password reset sends email with reset link
- ✅ All emails are from `hello@afrikoni.com`
- ✅ No "Error sending confirmation email" message
- ✅ Emails arrive in inbox (not spam)

---

## 📝 Notes

- **For Development**: You can use Resend's default domain temporarily
- **For Production**: Must verify `afrikoni.com` domain in Resend
- **API Key Security**: Never commit API keys to git
- **Rate Limits**: Resend free tier: 3,000 emails/month
- **Email Templates**: Supabase uses its own templates, but you can customize them

---

## 🔗 Useful Links

- [Resend Dashboard](https://resend.com)
- [Supabase Auth Settings](https://app.supabase.com/project/_/auth/settings)
- [Resend SMTP Documentation](https://resend.com/docs/send-with-smtp)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

