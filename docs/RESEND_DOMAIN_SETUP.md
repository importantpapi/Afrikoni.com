# 🌐 Resend Domain Setup for hello@afrikoni.com

## ✅ What You Need

- Domain: `afrikoni.com`
- Email: `hello@afrikoni.com`
- Resend account with API key

## 🚀 Step-by-Step Setup

### Step 1: Add Domain in Resend

1. Go to Resend Dashboard: https://resend.com/domains
2. Click **"Add domain"**
3. Enter: `afrikoni.com`
4. Click **"Add"**

### Step 2: Add DNS Records

Resend will show you DNS records to add. You need to add these to your domain's DNS settings:

#### Required Records:

1. **SPF Record** (TXT)
   - Name: `@` (or `afrikoni.com`)
   - Value: `v=spf1 include:resend.com ~all`
   - TTL: 3600

2. **DKIM Record** (TXT)
   - Name: `resend._domainkey` (or similar)
   - Value: (Resend will provide this - looks like a long string)
   - TTL: 3600

3. **DMARC Record** (TXT) - Optional but recommended
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:hello@afrikoni.com`
   - TTL: 3600

### Step 3: Verify Domain

1. After adding DNS records, go back to Resend
2. Click **"Verify"** next to your domain
3. Wait a few minutes for DNS propagation
4. Once verified, you'll see a green checkmark ✅

### Step 4: Update Email Service

The email service is already configured to use `hello@afrikoni.com`! 

If you need to change it, edit `src/services/emailService.js`:
```javascript
from = 'Afrikoni <hello@afrikoni.com>'
```

### Step 5: Test Sending

1. Make sure your API key is in `.env.local`:
   ```bash
   VITE_EMAIL_PROVIDER=resend
   VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxx
   ```

2. Restart dev server

3. Test by signing up a new user or triggering a notification

4. Check `hello@afrikoni.com` inbox for the email

## 📧 Email Addresses You Can Use

Once domain is verified, you can use:
- `hello@afrikoni.com` (main support email)
- `noreply@afrikoni.com` (automated emails)
- `support@afrikoni.com` (customer support)
- `sales@afrikoni.com` (sales inquiries)
- Any other address @afrikoni.com

## ✅ Verification Checklist

- [ ] Domain added in Resend dashboard
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC record added (optional)
- [ ] Domain verified in Resend (green checkmark)
- [ ] API key in `.env.local`
- [ ] Test email sent successfully
- [ ] Email received at hello@afrikoni.com

## 🆘 Troubleshooting

**Domain not verifying?**
- Wait 5-10 minutes for DNS propagation
- Check DNS records are correct
- Use a DNS checker tool to verify records are live

**Emails going to spam?**
- Make sure SPF and DKIM records are correct
- Add DMARC record
- Warm up the domain by sending a few test emails first

**Not receiving emails?**
- Check spam folder
- Verify API key is correct
- Check Resend dashboard → Emails for delivery status
- Make sure domain is verified

## 📝 DNS Records Location

Where to add DNS records depends on where you bought the domain:
- **Namecheap**: Domain List → Manage → Advanced DNS
- **GoDaddy**: DNS Management
- **Cloudflare**: DNS → Records
- **Google Domains**: DNS → Custom records

---

**Once verified, all emails will be sent from hello@afrikoni.com! 📧**

