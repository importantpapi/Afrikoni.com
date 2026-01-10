# 📧 Email Notifications Setup Guide

## ✅ What's Been Implemented

- ✅ Email service structure with multiple provider support
- ✅ Professional HTML email templates (mobile-responsive)
- ✅ Integration with notification service
- ✅ Email templates for: Welcome, Order Confirmation, RFQ, Quotes, Payments, Shipping, Disputes

## 🚀 Quick Setup

### Option 1: Resend (Recommended - Easiest)

1. **Sign up:** https://resend.com
2. **Get API key:**
   - Go to API Keys
   - Create new key
   - Copy the key (starts with `re_`)

3. **Add to environment:**
   ```bash
   # .env.local
   VITE_EMAIL_PROVIDER=resend
   VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Verify domain (for production):**
   - Add your domain in Resend dashboard
   - Add DNS records
   - Update `from` address in `emailService.js` to use your domain

### Option 2: SendGrid

1. **Sign up:** https://sendgrid.com
2. **Get API key:**
   - Settings → API Keys
   - Create API key with "Mail Send" permissions
   - Copy the key

3. **Add to environment:**
   ```bash
   # .env.local
   VITE_EMAIL_PROVIDER=sendgrid
   VITE_EMAIL_API_KEY=SG.xxxxxxxxxxxxx
   ```

4. **Verify sender:**
   - Settings → Sender Authentication
   - Verify your domain or single sender

### Option 3: Supabase Edge Functions

1. **Create Edge Function:**
   ```bash
   supabase functions new send-email
   ```

2. **Deploy function** (see `supabase/functions/send-email/` for example)

3. **Add to environment:**
   ```bash
   # .env.local
   VITE_EMAIL_PROVIDER=supabase
   VITE_EMAIL_API_KEY=your_supabase_anon_key
   ```

## 📧 Email Templates Available

1. **Welcome Email** - Sent on signup
2. **Order Confirmation** - When order is placed
3. **RFQ Received** - When seller receives RFQ
4. **Quote Submitted** - When buyer receives quote
5. **Payment Received** - When seller receives payment
6. **Order Shipped** - When order ships
7. **Dispute Opened** - When dispute is created

## 🔧 Usage

### Automatic (via Notification Service)

Emails are automatically sent when notifications are created:

```javascript
import { createNotification } from '@/services/notificationService';

// This will send email if user has email notifications enabled
await createNotification({
  user_id: userId,
  title: 'Order Confirmed',
  message: 'Your order has been confirmed',
  type: 'order', // Maps to orderConfirmation template
  link: '/dashboard/orders/123',
  sendEmail: true // Force email send
});
```

### Manual

```javascript
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/services/emailService';

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');

// Send order confirmation
await sendOrderConfirmationEmail('buyer@example.com', {
  orderNumber: 'ORD-123',
  productName: 'Cocoa Beans',
  quantity: 100,
  totalAmount: 5000,
  currency: 'USD',
  supplierName: 'ABC Trading',
  orderId: '123'
});
```

## ✅ Verification Checklist

- [ ] Email provider account created
- [ ] API key obtained
- [ ] Environment variables added
- [ ] Domain verified (for production)
- [ ] Test email sent successfully
- [ ] Email templates render correctly
- [ ] Mobile responsive emails work

## 🧪 Testing

1. **Test in development:**
   - Emails will log to console if provider not configured
   - Add API key to test real sending

2. **Test email templates:**
   ```javascript
   // In browser console or test file
   import { sendWelcomeEmail } from '@/services/emailService';
   await sendWelcomeEmail('your-email@example.com', 'Test User');
   ```

3. **Check email inbox:**
   - Verify email arrives
   - Check formatting on desktop and mobile
   - Test all links

## 📝 Customization

### Update Email Templates

Edit `src/services/emailTemplates.js` to customize:
- Colors and branding
- Content and messaging
- Layout and structure

### Add New Templates

1. Add template function to `emailTemplates.js`:
   ```javascript
   myNewTemplate: (data) => {
     const content = `...`;
     return baseTemplate(content, 'Button Text', 'https://link.com');
   }
   ```

2. Add to `emailService.js`:
   ```javascript
   export async function sendMyNewEmail(userEmail, data) {
     return await sendEmail({
       to: userEmail,
       subject: 'My Subject',
       template: 'myNewTemplate',
       data
     });
   }
   ```

## 🎯 Next Steps

1. **Set up email provider** (Resend recommended)
2. **Verify domain** for production
3. **Test all email types**
4. **Monitor email delivery** in provider dashboard
5. **Set up email analytics** (open rates, click rates)

---

**Ready to send emails! Just add your API key! 📧**

