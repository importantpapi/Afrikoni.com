# Email Testing Guide

## 📧 Comprehensive Email Testing Page

A complete email testing and verification system has been implemented to ensure all emails are sent from `hello@afrikoni.com` and working correctly.

## 🎯 Access the Test Page

**URL:** `/dashboard/test-emails`

**Requirements:**
- Must be logged in
- Accessible in both development and production

## ✨ Features

### 1. **Configuration Status Dashboard**
- Shows email provider (Resend, SendGrid, etc.)
- Displays API key status and format validation
- Verifies `hello@afrikoni.com` is configured as the official email
- Shows reply-to address configuration

### 2. **Individual Email Tests**
Test each email template individually:
- Welcome Email
- Order Confirmation
- RFQ Received
- Quote Submitted
- Payment Received
- Order Shipped
- Dispute Opened
- **Newsletter Subscription** (simulates actual homepage popup flow)

### 3. **Comprehensive Test All**
- One-click button to test all email templates
- Sequential testing with progress tracking
- Detailed results for each email

### 4. **Verification System**
Each test verifies:
- ✅ Email was sent successfully
- ✅ From address is `hello@afrikoni.com`
- ✅ Reply-to is `hello@afrikoni.com`
- ✅ Message ID (for tracking)
- ✅ Timestamp
- ❌ Error details (if failed)

## 🧪 How to Test

### Step 1: Enter Your Email
1. Go to `/dashboard/test-emails`
2. Enter your email address in the test field
3. Check the configuration status (should show green checkmarks)

### Step 2: Test Individual Emails
1. Click "Send Test Email" on any template card
2. Wait for the result (success/error indicator)
3. Check the detailed results below the button:
   - From address verification
   - Official email check
   - Message ID
   - Any errors

### Step 3: Test Newsletter Subscription
1. Click "Test Newsletter Flow" on the Newsletter Subscription card
2. This simulates the exact flow from the homepage popup:
   - Saves to `newsletter_subscriptions` table
   - Sends welcome email from `hello@afrikoni.com`
   - Shows detailed verification

### Step 4: Test All Emails
1. Click "Test All Emails" button
2. Wait for all tests to complete (sequential)
3. Review the summary at the bottom

## ✅ What Gets Verified

### Email Configuration
- ✅ Provider is set (`VITE_EMAIL_PROVIDER`)
- ✅ API key is configured (`VITE_EMAIL_API_KEY`)
- ✅ API key format is correct (for Resend: starts with `re_`)
- ✅ Official email is `hello@afrikoni.com`

### Email Sending
- ✅ Email is sent successfully
- ✅ From address contains `hello@afrikoni.com`
- ✅ Reply-to is `hello@afrikoni.com`
- ✅ Message ID is returned (for tracking)

### Newsletter Flow
- ✅ Database record is created
- ✅ Welcome email is sent
- ✅ Email uses official address

## 📊 Test Results Display

Each test shows:
- **Status Icon**: Green checkmark (success), Red X (error), Spinner (sending)
- **From Address**: Shows the exact from address used
- **Official Email Check**: ✓ Yes or ✗ No
- **Message ID**: For tracking in email provider dashboard
- **Error Details**: If sending failed

## 🔍 Troubleshooting

### If emails don't send:
1. Check configuration status at the top
2. Verify `VITE_EMAIL_PROVIDER` is set in environment
3. Verify `VITE_EMAIL_API_KEY` is complete (not truncated)
4. For Resend: API key should start with `re_`
5. Check browser console for detailed error logs

### If from address is wrong:
1. Check `emailService.js` - should use `hello@afrikoni.com`
2. Verify domain is verified in email provider (Resend/SendGrid)
3. Check that `from` parameter is not overridden

### If newsletter test fails:
1. Check Supabase `newsletter_subscriptions` table exists
2. Verify RLS policies allow inserts
3. Check email service is working (test other emails first)

## 📝 Notes

- All test emails are real - they will be sent to the address you enter
- Check your inbox (and spam folder) after testing
- Test results are stored in component state (refresh to clear)
- Newsletter test creates a real database record
- Message IDs can be used to track emails in provider dashboard

## 🎯 Quick Test Checklist

- [ ] Configuration shows green checkmarks
- [ ] Individual email test succeeds
- [ ] From address shows `hello@afrikoni.com`
- [ ] Official email check shows ✓ Yes
- [ ] Newsletter subscription test works
- [ ] Test All completes successfully
- [ ] Received emails in inbox show `hello@afrikoni.com` as sender

---

**Last Updated:** Email testing system implemented with full verification

