# EDGE FUNCTION SECURITY DOCUMENTATION
## JWT Verification for KoniAI Functions

### CRITICAL SECURITY ISSUE
8 Edge Functions are currently deployed without JWT verification enabled. This means **anyone with the function URL can call them**, consuming credits and potentially exposing sensitive data.

---

## AFFECTED FUNCTIONS

The following functions need `verify_jwt: true` configured:

1. **koniai-fx-arbitrage** - Currency conversion and arbitrage detection
2. **koniai-recommendation-engine** - Supplier matching recommendations
3. **koniai-dispute-resolver** - AI-powered dispute mediation
4. **koniai-logistics-tracker** - Shipment tracking and ETA predictions
5. **koniai-fraud-eval** - Fraud risk scoring
6. **koniai-finance-engine** - Trade financing calculations
7. **koniai-matchmaker** - RFQ-supplier matching
8. **koniai-extract-product** - Product data extraction from text

### Current Risk Level: **MEDIUM**
- **Exposure**: Public internet can call functions
- **Impact**: Wasted OpenAI/Gemini credits, potential data leak
- **Mitigation**: Functions check user context internally, but this is not enforced

---

## HOW TO FIX

### Option 1: Update Function Configuration (Recommended)

For each affected function, modify the entry point file (usually `index.ts` or `index.js`):

**Before:**
```typescript
Deno.serve(async (req) => {
  // Function logic
});
```

**After:**
```typescript
Deno.serve({
  handler: async (req) => {
    // Function logic
  },
  // ✅ Require valid JWT in Authorization header
  verifyJwt: true
});
```

### Option 2: Redeploy Functions

After updating configuration:

```bash
# Deploy single function
npx supabase functions deploy koniai-fx-arbitrage

# Or deploy all at once
npx supabase functions deploy koniai-fx-arbitrage
npx supabase functions deploy koniai-recommendation-engine
npx supabase functions deploy koniai-dispute-resolver
npx supabase functions deploy koniai-logistics-tracker
npx supabase functions deploy koniai-fraud-eval
npx supabase functions deploy koniai-finance-engine
npx supabase functions deploy koniai-matchmaker
npx supabase functions deploy koniai-extract-product
```

---

## VERIFICATION

### Test JWT Enforcement

**Without JWT (should fail):**
```bash
curl -X POST https://wmjxiazhvjaadzdsroqa.supabase.co/functions/v1/koniai-fx-arbitrage \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "from": "USD", "to": "NGN"}'

# Expected response: 401 Unauthorized
```

**With valid JWT (should succeed):**
```bash
# Get JWT from user session
TOKEN="your-user-jwt-here"

curl -X POST https://wmjxiazhvjaadzdsroqa.supabase.co/functions/v1/koniai-fx-arbitrage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 1000, "from": "USD", "to": "NGN"}'

# Expected response: 200 OK with arbitrage data
```

---

## FUNCTIONS ALREADY SECURED ✅

The following functions already have JWT verification enabled:

- **koniai-chat** - AI assistant
- **trade-transition** - Trade state machine
- **flutterwave-webhook** - Payment webhooks (uses webhook secret instead)
- **logistics-dispatch** - Shipment logistics

---

## ALTERNATIVE: API KEY AUTHENTICATION

If JWT verification is too restrictive (e.g., webhook calls from external services), use API keys:

```typescript
Deno.serve(async (req) => {
  const apiKey = req.headers.get('X-API-Key');
  
  if (apiKey !== Deno.env.get('INTERNAL_API_KEY')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Function logic
});
```

Store API key in Supabase secrets:
```bash
npx supabase secrets set INTERNAL_API_KEY=your-random-key-here
```

---

## IMPACT ON EXISTING CALLS

**Frontend Impact**: None (frontend already sends JWT via Supabase client)

**Example:**
```javascript
// Current code (no changes needed)
const { data, error } = await supabase.functions.invoke('koniai-fx-arbitrage', {
  body: { amount: 1000, from: 'USD', to: 'NGN' }
});
// ✅ Supabase client automatically includes JWT in Authorization header
```

**Edge Function→Edge Function**: If functions call each other, pass JWT:
```typescript
await fetch('https://wmjxiazhvjaadzdsroqa.supabase.co/functions/v1/koniai-other', {
  headers: {
    'Authorization': req.headers.get('Authorization'), // Forward JWT
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## ROLLBACK PLAN

If JWT enforcement breaks existing functionality:

1. **Identify broken calls**: Check Supabase logs for 401 errors
2. **Temporary fix**: Remove `verifyJwt: true` and redeploy
3. **Permanent fix**: Update calling code to include JWT
4. **Re-enable**: Redeploy with JWT verification once fixed

---

## MONITORING

After enabling JWT verification, monitor:

- **401 Errors**: Check Supabase function logs for unauthorized calls
- **Usage patterns**: Verify only authenticated users can invoke functions
- **Performance**: JWT validation adds ~5ms overhead (negligible)

**Check logs:**
```bash
npx supabase functions logs koniai-fx-arbitrage --tail
```

---

## RECOMMENDED PRIORITY

**P1 HIGH** - Enable JWT verification for:
- koniai-fraud-eval (prevents abuse of fraud scoring)
- koniai-finance-engine (protects financial calculations)
- koniai-extract-product (prevents mass data extraction)

**P2 MEDIUM** - Enable for remaining functions:
- koniai-fx-arbitrage
- koniai-recommendation-engine
- koniai-dispute-resolver
- koniai-logistics-tracker
- koniai-matchmaker

---

## ADDITIONAL SECURITY MEASURES

### 1. Rate Limiting
Add per-user rate limits:
```typescript
// In function code
const userId = req.headers.get('X-User-Id');
const rateLimitKey = `rate_limit:${userId}`;

// Check Redis/Upstash for rate limit
if (await isRateLimited(rateLimitKey)) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### 2. IP Whitelisting (Optional)
Restrict to known IPs:
```typescript
const allowedIPs = ['1.2.3.4', '5.6.7.8'];
const clientIP = req.headers.get('X-Forwarded-For');

if (!allowedIPs.includes(clientIP)) {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. Audit Logging
Log all function invocations:
```typescript
await supabase.from('function_audit_log').insert({
  function_name: 'koniai-fx-arbitrage',
  user_id: userId,
  ip_address: clientIP,
  request_body: JSON.stringify(body),
  timestamp: new Date().toISOString()
});
```

---

## QUESTIONS?

Contact: security@afrikoni.com
