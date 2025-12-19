# 🚀 Quick Email Setup (2 Minutes)

## Your Resend Domain is Ready! ✅

I can see `afrikoni.com` is already verified in Resend with:
- ✅ DKIM verified
- ✅ SPF enabled  
- ✅ Domain verified

**Just need your API key!**

---

## Option 1: Automated Setup (Easiest)

Run this command and paste your API key when prompted:

```bash
./setup-email.sh
```

Or with API key directly:

```bash
./setup-email.sh re_YOUR_API_KEY_HERE
```

---

## Option 2: Manual Setup

### Get API Key:
1. Go to: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `Afrikoni Production`
4. Copy the key (starts with `re_`)

### Add to Vercel:

**Via CLI:**
```bash
# Add provider
npx vercel env add VITE_EMAIL_PROVIDER production
# Enter: resend

# Add API key  
npx vercel env add VITE_EMAIL_API_KEY production
# Paste your API key
```

**Via Dashboard:**
1. https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add `VITE_EMAIL_PROVIDER` = `resend`
3. Add `VITE_EMAIL_API_KEY` = `re_xxxxx` (your key)

### Redeploy:
```bash
npx vercel --prod
```

---

## ✅ Test It

1. Visit your site
2. Subscribe to newsletter (popup)
3. Check inbox for welcome email!

**From:** `Afrikoni <hello@afrikoni.com>`

---

## 🎯 What Happens After Setup

- ✅ Newsletter subscriptions send welcome emails
- ✅ User registrations send welcome emails  
- ✅ Order confirmations send emails
- ✅ All transactional emails work

**All emails use your verified domain: `afrikoni.com`**

