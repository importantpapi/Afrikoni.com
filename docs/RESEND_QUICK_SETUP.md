# 🚀 Resend Quick Setup (2 minutes)

## Step 1: Copy Your API Key

1. In the Resend dashboard, find the API key field (the one with dots)
2. Click the **eye icon** to reveal the key, OR
3. Click **"Copy to clipboard"** button
4. The key will look like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2: Add to Environment Variables

### For Local Development:

1. Open your `.env.local` file (or create it)
2. Add these lines:
   ```bash
   VITE_EMAIL_PROVIDER=resend
   VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Replace `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual API key

### For Production (Vercel):

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - **Name:** `VITE_EMAIL_PROVIDER`
   - **Value:** `resend`
   - Select "Production" and "Preview"
4. Add:
   - **Name:** `VITE_EMAIL_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your actual key)
   - Select "Production" and "Preview"
5. Click "Save"
6. Redeploy your site

## Step 3: Test It!

1. **Restart your dev server** (if local):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test email sending:**
   - Sign up a new user (or trigger any notification)
   - Check your email inbox
   - You should receive the email!

3. **Check Resend dashboard:**
   - Go to "Emails" in Resend
   - You should see sent emails
   - Check delivery status

## Step 4: Verify Your Domain (Recommended for Production)

1. In Resend dashboard, go to **"Domains"**
2. Click **"Add domain"**
3. Add `afrikoni.com` (or your domain)
4. Add the DNS records Resend provides
5. Wait for verification (usually a few minutes)
6. Update `emailService.js` to use your domain:
   ```javascript
   from: 'Afrikoni <noreply@afrikoni.com>'
   ```

## ✅ Verification Checklist

- [ ] API key copied from Resend
- [ ] `VITE_EMAIL_PROVIDER=resend` added to `.env.local`
- [ ] `VITE_EMAIL_API_KEY=re_xxx...` added to `.env.local`
- [ ] Dev server restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Domain verified (for production)
- [ ] Environment variables added to Vercel

## 🎯 What Happens Next

Once you add the API key:
- ✅ Welcome emails will be sent on signup
- ✅ Order confirmations will be sent
- ✅ RFQ notifications will be sent
- ✅ Payment confirmations will be sent
- ✅ Shipping notifications will be sent
- ✅ Dispute notifications will be sent

All emails use professional, mobile-responsive templates!

---

**Quick Tip:** For testing, you can use `onboarding@resend.dev` as the sender. For production, verify your domain and use `noreply@afrikoni.com`.

**Ready to send emails! Just paste your API key! 📧**

