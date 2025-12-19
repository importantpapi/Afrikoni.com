# Email Notification Audit & Role-Based Distribution

## ✅ Golden Rule
**One role, one responsibility, one notification.**

If an email does not help the recipient act or stay informed, it shouldn't be sent.

---

## 📊 Current Event → Recipient Matrix

| Event | Buyer | Supplier | Admin | Status |
|-------|-------|----------|-------|--------|
| **RFQ Created** | ✅ Confirmation | ✅ Match notification | ⚠️ Should notify | ✅ Correct |
| **Quote Submitted** | ✅ New quote alert | ❌ | ❌ | ✅ Correct |
| **Order Placed** | ✅ Order confirmation | ✅ Payment received | ❌ | ✅ Correct |
| **Payment Received** | ✅ Confirmation | ✅ Payment notification | ❌ | ✅ Correct |
| **Order Shipped** | ✅ Tracking info | ❌ | ❌ | ✅ Correct |
| **Dispute Opened** | ✅ Dispute alert | ✅ Dispute alert | ⚠️ Should notify | ⚠️ Needs admin |
| **Order Cancelled** | ✅ Cancellation notice | ✅ Cancellation notice | ❌ | ✅ Correct |
| **Order Delivered** | ✅ Delivery confirmation | ❌ | ❌ | ✅ Correct |

---

## 🔍 Current Implementation Analysis

### ✅ **What's Correct**

1. **RFQ Created** (`src/pages/createrfq.jsx:166`)
   - ✅ Buyer gets confirmation email (`sendRFQReceivedEmail` to buyer)
   - ✅ Suppliers get match notifications (`notifyRFQCreated` - category-filtered)
   - ⚠️ **Issue**: Buyer email uses wrong template name (`sendRFQReceivedEmail` should be `sendWelcomeEmail` or custom)
   - ✅ Suppliers only notified if they have products in matching category

2. **Quote Submitted** (`src/services/notificationService.js:444`)
   - ✅ Buyer gets notification (`notifyQuoteSubmitted`)
   - ✅ Supplier doesn't get email (correct - they submitted it)
   - ✅ Uses `createNotification` with type 'quote' → respects preferences

3. **Order Placed / Payment Received** (`src/pages/payementgateways.jsx:200-225`)
   - ✅ Buyer gets order confirmation (`sendOrderConfirmationEmail`)
   - ✅ Supplier gets payment received (`sendPaymentReceivedEmail`)
   - ✅ Both are action-relevant

4. **Order Shipped**
   - ✅ Buyer gets tracking info
   - ✅ Supplier doesn't get email (correct - they shipped it)

5. **Dispute Opened**
   - ✅ Both parties notified
   - ⚠️ **Missing**: Admin should be notified for disputes

---

## ⚠️ Issues Found

### 1. **RFQ Created Email - Wrong Template**
**Location:** `src/pages/createrfq.jsx:166`

**Problem:**
```javascript
await sendRFQReceivedEmail(user.email, {...})  // ❌ Wrong - this is for suppliers
```

**Should be:**
- Buyer confirmation email (different template)
- Or use `createNotification` with proper type

**Fix:** Use `createNotification` instead of direct email call, or create `sendRFQCreatedConfirmationEmail`

### 2. **Missing Admin Notifications**
**Events that should notify admin:**
- Dispute opened
- RFQ created (optional - for monitoring)
- Large orders (optional - threshold-based)

**Current:** No admin notification system

### 3. **Email Frequency Check**
**Current triggers per order:**
1. Order placed → Buyer (confirmation)
2. Payment received → Supplier (payment notification)
3. Order shipped → Buyer (tracking)
4. Order delivered → Buyer (delivery confirmation)
5. Dispute opened → Both parties

**Assessment:** ✅ **Normal** - 4-5 emails over days/weeks is correct for B2B

---

## 🔧 Recommended Fixes

### Fix 1: Correct RFQ Created Email

**Current:**
```javascript
// ❌ Wrong template
await sendRFQReceivedEmail(user.email, {...});
```

**Should be:**
```javascript
// ✅ Use notification service with proper type
await createNotification({
  company_id: companyId,
  user_email: user.email,
  title: 'RFQ Created Successfully',
  message: `Your RFQ "${rfqData.title}" is now live`,
  type: 'rfq',
  sendEmail: true, // Respects user preferences
  link: `/dashboard/rfqs/${newRFQ.id}`,
  related_id: newRFQ.id
});
```

### Fix 2: Add Admin Notification for Disputes

**Add to dispute creation:**
```javascript
// Notify admin
await createNotification({
  user_email: 'admin@afrikoni.com', // Or get from admin users table
  title: 'New Dispute Opened',
  message: `Dispute #${disputeId} opened for Order #${orderId}`,
  type: 'dispute',
  sendEmail: true
});
```

### Fix 3: Ensure No Duplicate Emails

**Check for:**
- Multiple calls to same email function
- Same event triggering multiple times
- Both direct email + notification service sending

**Current status:** ✅ No duplicates found

---

## ✅ Verification Checklist

- [x] Buyer gets buyer-relevant emails only
- [x] Supplier gets supplier-relevant emails only
- [x] No cross-role spam (buyer getting supplier updates)
- [x] Email frequency is reasonable (not 6 emails in 5 minutes)
- [x] Each email has clear action or information value
- [ ] Admin notifications for critical events (disputes)
- [ ] RFQ created email uses correct template

---

## 📝 Email Preference System

**Current:** `getUserNotificationPreferences()` respects:
- `email`: Global email toggle
- `rfq_responses`: RFQ/quote emails
- `order_updates`: Order status emails
- `payments`: Payment emails
- `new_messages`: Message emails
- `reviews`: Review emails

**Status:** ✅ **Working correctly** - emails respect user preferences

---

## 🎯 Summary

**What's Working:**
- ✅ Role-based email distribution (mostly correct)
- ✅ User preferences respected
- ✅ No spam (reasonable frequency)
- ✅ Clear action-based triggers

**What Needs Fixing:**
- ⚠️ RFQ created email uses wrong template
- ⚠️ Missing admin notifications for disputes
- ⚠️ No admin notification system in place

**Overall Assessment:** ✅ **Good** - Following golden rule, just needs minor fixes

---

**Next Steps:**
1. Fix RFQ created email template
2. Add admin notification system
3. Test email flow end-to-end
4. Monitor email frequency in production

