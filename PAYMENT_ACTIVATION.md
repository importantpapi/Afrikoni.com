# PAYMENT SYSTEM ACTIVATION GUIDE
## ⚠️ CRITICAL — Run these commands once to go live with real payments

## PREREQUISITES CHECKLIST
- [ ] Flutterwave account verified (KYC complete)
- [ ] Business account approved by Flutterwave
- [ ] Live API keys generated in Flutterwave dashboard
- [ ] Webhook URL configured in Flutterwave
- [ ] Test with $1 transaction before going live

---

### STEP 1 — Get your Flutterwave production keys
1. Go to https://dashboard.flutterwave.com/settings/apis
2. Toggle to **Live** mode (top right of dashboard)
3. Copy your **Live Secret Key** (starts with `FLWSECK_LIVE-`)
4. Copy your **Live Encryption Key**
5. Copy your **Live Public Key** (starts with `FLWPUBK_LIVE-`)

### STEP 2 — Set Supabase Edge Function secrets (run in terminal)
```bash
# Replace the values below with your actual Flutterwave LIVE keys
npx supabase secrets set \
  FLUTTERWAVE_SECRET_KEY=FLWSECK_LIVE-your-key-here \
  FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_LIVE-your-encryption-key \
  FLUTTERWAVE_SECRET_HASH=your-webhook-hash-secret \
  FRONTEND_URL=https://afrikoni.com \
  --project-ref wmjxiazhvjaadzdsroqa
```

### STEP 3 — Update .env with your Live Public Key
In `.env`, change:
```
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE-your-live-public-key
```

### STEP 4 — Register the webhook in Flutterwave Dashboard
1. Go to https://dashboard.flutterwave.com/settings/webhooks
2. Set webhook URL to:
   ```
   https://wmjxiazhvjaadzdsroqa.supabase.co/functions/v1/flutterwave-webhook
   ```
3. Set the **Secret Hash** to the same value you used for `FLUTTERWAVE_SECRET_HASH` above
4. Enable these event types:
   - `charge.completed` (escrow funding)
   - `refund.completed` (refund processing)
   - `subscription.activated` (subscription activation)

### STEP 5 — Test with a real $1 transaction
1. Go to `/dashboard/subscriptions`
2. Click "Upgrade" on the Growth plan ($49)
3. Use a real card to pay
4. Verify the subscription activates in the dashboard

### STEP 6 — Verification Checklist
After test transaction, verify:
- [ ] Payment webhook received (check `payment_webhook_log` table)
- [ ] Escrow row created in database (if trade payment)
- [ ] Subscription record created (if subscription payment)
- [ ] User email received confirmation
- [ ] Revenue transaction logged in `revenue_transactions` table

**Check webhook logs:**
```sql
SELECT * FROM payment_webhook_log 
WHERE event = 'charge.completed' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check revenue transactions:**
```sql
SELECT * FROM revenue_transactions 
WHERE source = 'subscription' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## What the webhook handles automatically (no browser needed):
- ✅ Trade escrow funding → advances trade to ESCROW_FUNDED state
- ✅ Subscription activation → creates subscription record in DB
- ✅ Refund processing → logs refund event
- ✅ All events logged to `payment_webhook_log` table for audit

## TROUBLESHOOTING

### Issue: Webhook not receiving events
**Solution**: Verify webhook URL is exact (no trailing slash), secret hash matches, and Flutterwave dashboard shows "Last ping: success"

### Issue: Payment completes but escrow not funded
**Solution**: Check `payment_webhook_log` for error messages. Common causes:
- Trade ID not found in database
- Trade status not compatible with escrow funding
- Flutterwave transaction ID already processed (duplicate)

### Issue: Commission calculation wrong
**Solution**: Check `revenue_engine.js` logic. Expected:
- 5% escrow fee
- 1.8% service fee
- 1.2% FX spread (if currency conversion)
- Total: 8%

### ROLLBACK PLAN
If webhook causes issues:
1. Disable webhook in Flutterwave dashboard
2. Manually process payments via service role:
   ```sql
   UPDATE escrows SET status = 'funded' WHERE trade_id = 'xxx';
   ```
3. Fix webhook code, redeploy Edge Function
4. Re-enable webhook

---

## Webhook URL (already deployed):
`https://wmjxiazhvjaadzdsroqa.supabase.co/functions/v1/flutterwave-webhook`

---

## STEP 6 — Enable Error Tracking (Sentry)
1. Go to https://sentry.io and create a new project (React/Vite)
2. Copy the DSN from Project Settings → Client Keys
3. In `.env`, set:
   ```
   VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
   ```

## STEP 7 — Enable Analytics (Google Analytics 4)
1. Go to https://analytics.google.com and create a property
2. Copy the Measurement ID (starts with `G-`)
3. In `.env`, set:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
