# Newsletter Subscription Flow - Complete Guide

## 📧 What Happens When Someone Subscribes

### Current Flow (Step-by-Step)

1. **User sees popup** (after 30 seconds or exit intent)
2. **User enters email** and clicks "Subscribe Now"
3. **Email is saved** to Supabase `newsletter_subscriptions` table
4. **Welcome email is sent** (if email service is configured)
5. **User sees success message**: "Thank you for subscribing! Check your inbox for a welcome email."

---

## 🗄️ Database Storage

### Table: `newsletter_subscriptions`

```sql
CREATE TABLE public.newsletter_subscriptions (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  source text,                    -- 'homepage_popup'
  subscribed_at timestamp,
  unsubscribed_at timestamp,
  is_active boolean DEFAULT TRUE,
  created_at timestamp
);
```

**What gets stored:**
- ✅ Email address (unique)
- ✅ Source: `'homepage_popup'`
- ✅ Subscription timestamp
- ✅ Active status

**RLS Policy:** Public can insert (anyone can subscribe)

---

## 📨 Email Service Status

### Current Configuration

**Email Provider:** Configurable via environment variables
- `VITE_EMAIL_PROVIDER` = `'resend'`, `'sendgrid'`, `'supabase'`, or `'none'`
- `VITE_EMAIL_API_KEY` = Your API key

### What Happens:

**If email service is configured:**
✅ Welcome email is sent immediately
✅ Email uses `newsletterWelcome` template
✅ Subject: "Welcome to Afrikoni - Africa's B2B Trade Engine"

**If email service is NOT configured:**
⚠️ Email is logged to console (dev mode)
⚠️ Subscription still saved to database
⚠️ User still sees success message
⚠️ No actual email sent (silent failure)

---

## 📝 Welcome Email Content

### Template: `newsletterWelcome`

**What subscribers receive:**

1. **Welcome message**
   - "Welcome to the Afrikoni Community!"
   - Thank you for subscribing

2. **What We're Building**
   - Mission: Africa's trusted B2B trade engine
   - Vision: Make African trade accessible, secure, profitable

3. **What You'll Get**
   - B2B Trade Insights (weekly updates)
   - Supplier Spotlights
   - Exclusive Offers
   - Platform Updates

4. **Call-to-Action**
   - Button: "Explore Marketplace"
   - Link: `https://afrikoni.com/marketplace`

5. **Footer**
   - Links to website, help center, contact
   - Unsubscribe information

---

## 🔍 Current Issues & Status

### ✅ What Works:
- ✅ Popup shows correctly
- ✅ Email saved to database
- ✅ Duplicate emails handled (ignored, not error)
- ✅ localStorage tracking (prevents re-showing)
- ✅ Success message shown to user

### ⚠️ What Needs Configuration:

**Email Service Setup Required:**

1. **Choose a provider:**
   - **Resend** (recommended): https://resend.com
   - **SendGrid**: https://sendgrid.com
   - **Supabase Edge Function**: Custom implementation

2. **Add to `.env` file:**
   ```env
   VITE_EMAIL_PROVIDER=resend
   VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxx
   ```

3. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add both variables for Production

### ❌ Current Problem:

**Emails are NOT being sent** because:
- Email provider is not configured (defaults to `'none'`)
- No API key set
- Service fails silently (doesn't break subscription)

**Result:**
- ✅ Subscriptions are saved
- ❌ Welcome emails are NOT sent
- ✅ User still sees success message (but won't receive email)

---

## 🛠️ How to Fix Email Sending

### Option 1: Resend (Easiest - Recommended)

1. **Sign up:** https://resend.com
2. **Get API key:** Dashboard → API Keys → Create
3. **Add to `.env`:**
   ```env
   VITE_EMAIL_PROVIDER=resend
   VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Add to Vercel:** Same variables in Production
5. **Verify domain:** Add `afrikoni.com` to Resend (for better deliverability)

### Option 2: SendGrid

1. **Sign up:** https://sendgrid.com
2. **Get API key:** Settings → API Keys → Create
3. **Add to `.env`:**
   ```env
   VITE_EMAIL_PROVIDER=sendgrid
   VITE_EMAIL_API_KEY=SG.xxxxxxxxxxxxx
   ```
4. **Add to Vercel:** Same variables

### Option 3: Supabase Edge Function

1. **Create Edge Function:** `send-email`
2. **Configure email service** in function
3. **Add to `.env`:**
   ```env
   VITE_EMAIL_PROVIDER=supabase
   ```
4. **No API key needed** (uses Supabase auth)

---

## 📊 Where to View Subscriptions

### Supabase Dashboard:

1. Go to Supabase Dashboard
2. Navigate to: **Table Editor** → `newsletter_subscriptions`
3. View all subscribers:
   - Email addresses
   - Subscription dates
   - Source (homepage_popup)
   - Active status

### Export Subscribers:

```sql
SELECT email, subscribed_at, source 
FROM newsletter_subscriptions 
WHERE is_active = true 
ORDER BY subscribed_at DESC;
```

---

## 🔄 Future Improvements Needed

### 1. Email Service Status Check
- Show admin dashboard if emails are being sent
- Alert if email service fails

### 2. Unsubscribe Functionality
- Add unsubscribe link in emails
- Update `is_active = false` when unsubscribed
- Set `unsubscribed_at` timestamp

### 3. Email Campaigns
- Send weekly newsletters
- Supplier spotlights
- Platform updates
- Use subscriber list from database

### 4. Double Opt-in (GDPR Compliance)
- Send confirmation email first
- Require click to confirm
- Only activate after confirmation

### 5. Analytics
- Track open rates
- Track click rates
- Track unsubscribe rates

---

## 🚨 Action Required

**To enable email sending:**

1. ✅ Choose email provider (Resend recommended)
2. ✅ Get API key
3. ✅ Add to `.env` file
4. ✅ Add to Vercel environment variables
5. ✅ Test subscription flow
6. ✅ Verify welcome email received

**Current Status:**
- ❌ **Emails are NOT being sent** (service not configured)
- ✅ Subscriptions ARE being saved to database
- ✅ Users see success message (but no email)

---

## 📞 Support

If you need help setting up email:
1. Check `src/services/emailService.js` for provider details
2. Check `src/services/emailTemplates.js` for email content
3. Test in development mode first (emails logged to console)

