# Email Setup - Final Configuration

## ✅ Fixed: Using Only `hello@afrikoni.com`

All email functionality now **exclusively uses `hello@afrikoni.com`** as the sender address.

## 🎯 What You Need to Do

### Step 1: Verify `afrikoni.com` Domain in Resend

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter: `afrikoni.com`
4. Resend will provide DNS records to add:
   - **DKIM** (TXT record) - Required for domain verification
   - **SPF** (TXT record) - Required for sending emails
   - **MX** (optional) - Only if you want to receive emails

### Step 2: Add DNS Records

1. Go to your domain registrar (where you manage `afrikoni.com`)
2. Navigate to DNS settings
3. Add the DNS records provided by Resend:
   - DKIM record (for verification)
   - SPF record (for sending)
4. Wait for DNS propagation (usually 5-60 minutes)

### Step 3: Verify Domain Status

1. Go back to Resend Dashboard → Domains
2. Check that `afrikoni.com` shows **"Verified"** status
3. Both DKIM and SPF should show green "Verified" badges

### Step 4: Test

1. Restart your dev server (if running)
2. Go to `/dashboard/test-emails`
3. Click "Run API Diagnostic Test"
4. If successful, send a test email
5. Check your inbox!

## 📋 Current Configuration

- **Email Provider:** Resend
- **API Key:** Configured in `.env`
- **Sender Email:** `hello@afrikoni.com` (hardcoded, cannot be changed)
- **Sender Name:** `Afrikoni`
- **Reply-To:** `hello@afrikoni.com`

## ⚠️ Important Notes

- **All emails will come from `hello@afrikoni.com`** - this is hardcoded
- **Domain must be verified** in Resend before emails will work
- **"Failed to fetch" error** will persist until domain is verified
- Once verified, all email functionality will work automatically

## 🔧 Troubleshooting

### "Failed to fetch" Error

**Cause:** Domain `afrikoni.com` not verified in Resend

**Solution:**
1. Verify domain in Resend Dashboard
2. Add DNS records to your domain registrar
3. Wait for verification (green badges)
4. Test again

### API Key Issues

**Check:**
- API key is correct in `.env`
- API key hasn't been revoked in Resend
- Dev server was restarted after adding API key

## ✅ Verification Checklist

- [ ] Domain `afrikoni.com` added to Resend
- [ ] DNS records added to domain registrar
- [ ] DKIM shows "Verified" (green badge)
- [ ] SPF shows "Verified" (green badge)
- [ ] Domain status is "Verified" in Resend
- [ ] API key is correct in `.env`
- [ ] Dev server restarted
- [ ] Diagnostic test passes
- [ ] Test email sends successfully

---

**Status:** ✅ Code fixed to use only `hello@afrikoni.com`
**Next Step:** Verify `afrikoni.com` domain in Resend Dashboard

