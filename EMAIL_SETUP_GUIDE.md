# Email Service Setup - Resend

## ✅ Your Resend Domain Status

Based on your Resend dashboard:
- ✅ Domain: `afrikoni.com` is **Verified**
- ✅ DKIM: **Verified** (Domain Verification)
- ✅ SPF: **Enabled** (Enable Sending)
- ✅ MX: Configured (Enable Receiving - optional)

**You're ready to send emails!** Just need the API key.

---

## 🔑 Step 1: Get Your Resend API Key

1. Go to: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name it: `Afrikoni Production`
4. Select permissions: **"Sending access"**
5. Copy the API key (starts with `re_`)

**Important:** Copy it now - you won't see it again!

---

## ⚙️ Step 2: Add to Vercel

Run these commands (replace `YOUR_API_KEY` with your actual key):

```bash
# Add email provider
npx vercel env add VITE_EMAIL_PROVIDER production
# When prompted, enter: resend

# Add API key
npx vercel env add VITE_EMAIL_API_KEY production
# When prompted, paste your API key (re_xxxxx)
```

Or add manually in Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project: `Afrikoni.com`
3. Settings → Environment Variables
4. Add:
   - **Name:** `VITE_EMAIL_PROVIDER`
   - **Value:** `resend`
   - **Environment:** Production, Preview, Development
5. Add:
   - **Name:** `VITE_EMAIL_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxx` (your actual key)
   - **Environment:** Production, Preview, Development

---

## 🧪 Step 3: Test

After adding environment variables:

1. **Redeploy** (or wait for next deployment)
2. **Test subscription:**
   - Visit your site
   - Subscribe to newsletter
   - Check inbox for welcome email

---

## 📧 Email Configuration

**From Address:** `Afrikoni <hello@afrikoni.com>`
- Uses your verified domain
- Already configured in code

**Templates Available:**
- `newsletterWelcome` - Newsletter subscription welcome
- `welcome` - User account welcome
- `orderConfirmation` - Order confirmations
- And more...

---

## ✅ Verification Checklist

- [ ] Resend API key obtained
- [ ] `VITE_EMAIL_PROVIDER=resend` added to Vercel
- [ ] `VITE_EMAIL_API_KEY=re_xxxxx` added to Vercel
- [ ] Project redeployed
- [ ] Test subscription sent
- [ ] Welcome email received

---

## 🚨 Troubleshooting

**Emails not sending?**
1. Check Vercel environment variables are set
2. Verify API key is correct (starts with `re_`)
3. Check Resend dashboard → Logs for errors
4. Verify domain is still verified in Resend

**Need help?**
- Resend Docs: https://resend.com/docs
- Check `src/services/emailService.js` for implementation

