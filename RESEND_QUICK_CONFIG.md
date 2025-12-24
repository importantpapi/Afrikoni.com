# ⚡ Resend Quick Config - Copy & Paste

## Your API Key
```
re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk
```

## Supabase SMTP Configuration (Method 1 - Recommended)

Go to: **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**

Copy these values:

```
SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk
Sender Email: hello@afrikoni.com
Sender Name: Afrikoni
```

**Alternative Port (if 465 doesn't work):**
```
SMTP Port: 587
```

---

## Supabase Edge Function Secret (Method 2 - Alternative)

Go to: **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Add secret:
```
Name: RESEND_API_KEY
Value: re_YzLDQwAe_AdZxwkQeFa8ywRdD1S54B4Lk
```

---

## Test It

1. Save configuration
2. Go to signup page
3. Create a test account
4. Check email inbox
5. Check [Resend Dashboard](https://resend.com/emails) for sent emails

---

## ✅ Success Indicators

- ✅ No "Error sending confirmation email" message
- ✅ Email arrives in inbox
- ✅ Email from: `Afrikoni <hello@afrikoni.com>`
- ✅ Console shows: `✅ Signup Success`

---

**Full guide:** See `RESEND_API_KEY_SETUP.md` for detailed instructions.

