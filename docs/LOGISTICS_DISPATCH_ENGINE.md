# Logistics Dispatch Engine

**Status:** ✅ Fully Implemented (Kernel-First Architecture)  
**Type:** Trade OS Subsystem  
**Trigger:** `PICKUP_SCHEDULED` state transition  

## Overview

The Logistics Dispatch Engine is an Uber-style provider matching system integrated into the Afrikoni Trade OS kernel. When a trade enters the `PICKUP_SCHEDULED` state, the kernel automatically triggers the dispatch engine to find and notify logistics providers.

**Key Principle:** The UI **cannot** directly assign providers. All dispatch operations flow through the kernel to maintain sovereignty and auditability.

---

## Architecture

### 1. Database Schema

**File:** [`supabase/migrations/20260212_logistics_dispatch_engine.sql`](../supabase/migrations/20260212_logistics_dispatch_engine.sql)

#### Tables

**`logistics_providers`** - Supply index of available providers
```sql
CREATE TABLE public.logistics_providers (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  city TEXT NOT NULL,
  vehicle_types TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  response_score FLOAT DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  accepted_jobs INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ
);
```

**`dispatch_events`** - Immutable audit trail
```sql
CREATE TABLE public.dispatch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id),
  provider_id UUID REFERENCES public.logistics_providers(id),
  shipment_id UUID REFERENCES public.shipments(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**`dispatch_notifications`** - Outbound message queue
```sql
CREATE TABLE public.dispatch_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id),
  provider_id UUID REFERENCES public.logistics_providers(id),
  notification_type TEXT CHECK (notification_type IN ('sms', 'whatsapp', 'push')),
  message TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### RLS Policies

- **Providers:** Scoped to `current_company_id()` - each logistics company only sees their own records
- **Events:** Scoped to trade participants (buyer/seller) via join
- **Notifications:** Internal only (no RLS - processed by service role)

---

### 2. Kernel Integration

**File:** [`supabase/functions/trade-transition/index.ts`](../supabase/functions/trade-transition/index.ts)

The kernel detects `PICKUP_SCHEDULED` state transitions and invokes the dispatch engine:

```typescript
async function executeStateSideEffects({ supabase, trade, nextState, metadata }: any) {
  if (nextState === "pickup_scheduled") {
    // Create shipment record
    await supabase.from("shipments").insert({
      trade_id: tradeId,
      status: "pending",
      tracking_number: `AFK-${randomString}`,
    });

    // Invoke dispatch engine
    const dispatchResponse = await fetch(`${SUPABASE_URL}/functions/v1/logistics-dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ trade_id: tradeId }),
    });
  }
}
```

**Critical:** The dispatch is triggered **inside** the kernel, not from the UI. The UI cannot bypass this flow.

---

### 3. Dispatch Matching Engine

**File:** [`supabase/functions/logistics-dispatch/index.ts`](../supabase/functions/logistics-dispatch/index.ts)

**Algorithm:**
1. **Fetch trade details** (pickup city, cargo weight/volume)
2. **Determine required vehicle types** (e.g., van, truck, flatbed)
3. **Query providers** in the same city with matching vehicles
4. **Filter by availability** (`is_available = true`)
5. **Rank by response score** (performance metric)
6. **Notify top 5 providers** via SMS/WhatsApp
7. **Log events** to `dispatch_events` (audit trail)

**Key Decisions:**
- **Deterministic, not AI-based:** Uses city matching + vehicle type filtering + score ranking
- **No randomness:** Providers are ranked purely by response_score (acceptance rate)
- **First-responder wins:** The first provider to accept gets the job (atomic assignment)

**Sample Code:**
```typescript
const matchedProviders = providers?.filter((p: LogisticsProvider) => {
  const hasRequiredVehicle = requiredVehicleTypes.some((vt: string) =>
    p.vehicle_types.includes(vt)
  );
  return hasRequiredVehicle && p.is_available;
}).sort((a, b) => b.response_score - a.response_score);

const topProviders = matchedProviders.slice(0, 5);
```

---

### 4. Acceptance Handler

**File:** [`supabase/functions/logistics-accept/index.ts`](../supabase/functions/logistics-accept/index.ts)

Handles provider responses (accept/reject) with **atomic first-responder locking**.

**Flow:**
1. Provider receives SMS: "Reply YES to accept"
2. SMS webhook hits `/logistics-accept` endpoint
3. **Atomic check:** Is `shipment.logistics_provider_id` still `NULL`?
   - **Yes:** Assign provider, mark unavailable, log `SHIPMENT_ASSIGNED`
   - **No:** Job already taken, respond "Too late"
4. Update provider stats (acceptance rate, total jobs)

**Race Condition Protection:**
```typescript
const { data: updated } = await supabase
  .from("shipments")
  .update({ logistics_provider_id: provider_id, status: "assigned" })
  .eq("id", shipmentId)
  .is("logistics_provider_id", null) // Optimistic locking
  .select("id");

if (!updated || updated.length === 0) {
  // Race condition: another provider got it first
  return { success: false, error: "Job already assigned" };
}
```

---

### 5. Notification Sender

**File:** [`supabase/functions/notification-sender/index.ts`](../supabase/functions/notification-sender/index.ts)

Processes the `dispatch_notifications` queue and sends SMS/WhatsApp messages via Twilio.

**Invocation:** 
- Can be called manually via cron or HTTP trigger
- Processes `status = 'pending'` notifications in batches of 10

**Environment Variables Required:**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Graceful Degradation:**
- If Twilio credentials missing: Logs to console (dev mode)
- If send fails: Marks notification as `failed`, retries can be implemented

---

### 6. Frontend Service (Read-Only)

**File:** [`src/services/logisticsDispatchService.ts`](../src/services/logisticsDispatchService.ts)

Provides **read-only** access to dispatch data for the UI:

```typescript
// Get dispatch status for a trade
const status = await getDispatchStatus(tradeId);

// Subscribe to real-time updates
const unsubscribe = subscribeToDispatchUpdates(tradeId, (event) => {
  console.log("New dispatch event:", event);
});
```

**Important:** This service has **zero write methods**. All writes go through:
- Kernel (state transitions)
- Acceptance handler (provider responses)

---

### 7. UI Component

**File:** [`src/components/LogisticsDispatchStatus.tsx`](../src/components/LogisticsDispatchStatus.tsx)

React component that displays dispatch status on trade detail pages.

**Features:**
- Real-time updates via Supabase Realtime
- Status indicators: idle → searching → assigned → in_transit → delivered
- Provider details (city, vehicle types, response score)
- Event timeline (last 3 activities)

**Usage:**
```tsx
import { LogisticsDispatchStatus } from '@/components/LogisticsDispatchStatus';

<LogisticsDispatchStatus tradeId={trade.id} />
```

**Display States:**
- **Idle:** "No pickup scheduled yet"
- **Searching:** "Searching for pickup provider (3 contacted)" (animated pulse)
- **Assigned:** "Pickup assigned - waiting for collection"
- **In Transit:** "In transit with {provider_name}"
- **Delivered:** "Shipment delivered"

---

## Data Flow

```mermaid
graph TD
    A[Trade → PICKUP_SCHEDULED] --> B[Kernel: trade-transition]
    B --> C[Create Shipment Record]
    B --> D[Invoke logistics-dispatch]
    
    D --> E[Match Providers by City]
    E --> F[Filter by Vehicle Type]
    F --> G[Rank by Response Score]
    G --> H[Notify Top 5 Providers]
    
    H --> I[Insert dispatch_notifications]
    I --> J[notification-sender processes queue]
    J --> K[Send SMS/WhatsApp via Twilio]
    
    K --> L[Provider Replies YES]
    L --> M[logistics-accept endpoint]
    M --> N{Shipment Still Unassigned?}
    
    N -->|Yes| O[Assign Provider Atomically]
    N -->|No| P[Return: Job Already Taken]
    
    O --> Q[Mark Provider Unavailable]
    O --> R[Log SHIPMENT_ASSIGNED Event]
    O --> S[Update Trade Metadata]
    
    R --> T[UI receives Realtime Update]
    T --> U[LogisticsDispatchStatus shows Provider]
```

---

## Event Types

All events are logged to `dispatch_events` table:

| Event Type           | Description                                      |
|----------------------|--------------------------------------------------|
| `DISPATCH_REQUESTED` | Kernel triggered dispatch for a trade            |
| `PROVIDER_NOTIFIED`  | Notification sent to a specific provider         |
| `PROVIDER_ACCEPTED`  | Provider replied YES                             |
| `PROVIDER_REJECTED`  | Provider replied NO                              |
| `SHIPMENT_ASSIGNED`  | Provider successfully assigned (first responder) |

---

## Security

### Row-Level Security (RLS)

**Logistics Providers:**
```sql
CREATE POLICY "Providers can view own records"
  ON public.logistics_providers
  FOR SELECT
  USING (company_id = current_company_id());
```

**Dispatch Events:**
```sql
CREATE POLICY "Trade participants can view dispatch events"
  ON public.dispatch_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trades
      WHERE trades.id = dispatch_events.trade_id
        AND (trades.buyer_id = current_company_id() OR trades.seller_id = current_company_id())
    )
  );
```

**Dispatch Notifications:**
- No RLS (internal service role only)
- Processed by `notification-sender` Edge Function

---

## Provider Onboarding

To add a new logistics provider:

```sql
INSERT INTO public.logistics_providers (
  id,
  company_id,
  city,
  vehicle_types,
  is_available,
  response_score
) VALUES (
  gen_random_uuid(),
  '{company_uuid}',
  'Accra',
  ARRAY['van', 'truck'],
  true,
  0.0
);
```

**Response Score Calculation:**
- Starts at 0.0
- Increases with each accepted job: `new_score = (accepted_jobs / total_jobs)`
- Higher scores = higher priority in future dispatches

---

## Testing

### 1. Test Provider Matching (Local)

```bash
curl -X POST http://localhost:54321/functions/v1/logistics-dispatch \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trade_id": "your-trade-uuid"}'
```

### 2. Test Acceptance Handler

```bash
curl -X POST http://localhost:54321/functions/v1/logistics-accept \
  -H "Content-Type: application/json" \
  -d '{
    "trade_id": "your-trade-uuid",
    "provider_id": "your-provider-uuid",
    "response": "accept",
    "estimated_pickup_time": "2026-02-15T10:00:00Z"
  }'
```

### 3. Test Notification Sender

```bash
curl -X POST http://localhost:54321/functions/v1/notification-sender \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Deployment Checklist

- [ ] Apply migration: `20260212_logistics_dispatch_engine.sql`
- [ ] Deploy Edge Functions:
  - `logistics-dispatch`
  - `logistics-accept`
  - `notification-sender`
- [ ] Set Twilio environment variables in Supabase dashboard
- [ ] Seed logistics providers in production database
- [ ] Test full flow: PICKUP_SCHEDULED → Dispatch → Accept → Assigned
- [ ] Verify RLS policies are active
- [ ] Monitor `dispatch_events` table for audit trail

---

## Future Enhancements

1. **Retry Logic:** If no provider accepts within 5 minutes, notify next batch
2. **Geolocation:** Replace city-based matching with GPS radius matching
3. **Dynamic Pricing:** Surge pricing during peak demand
4. **Provider App:** Mobile app for logistics partners (React Native)
5. **Route Optimization:** Multi-stop pickup optimization (TSP algorithm)
6. **Push Notifications:** Real-time alerts to provider mobile apps
7. **Performance Analytics:** Dashboard showing provider response times, completion rates

---

## Troubleshooting

### No providers notified
- **Check:** Are there providers in `logistics_providers` with `is_available = true` in the correct city?
- **Check:** Does the trade have valid pickup location metadata?
- **Check:** Are vehicle types correctly mapped (e.g., `["van", "truck"]`)?

### Provider acceptance fails with "Job already assigned"
- **Expected behavior:** This is the atomic first-responder lock working correctly
- **Action:** Provider should be notified that another provider was faster

### Notifications not sending
- **Check:** Are Twilio credentials set in Supabase Edge Function secrets?
- **Check:** Is `notification-sender` being invoked (manually or via cron)?
- **Check:** Are phone numbers in E.164 format (e.g., `+233241234567`)?

### Dispatch not triggering on PICKUP_SCHEDULED
- **Check:** Is the trade-transition Edge Function deployed with latest code?
- **Check:** Does the kernel have network access to invoke logistics-dispatch?
- **Check:** Are there errors in trade-transition logs?

---

## Compliance

**Trade OS Kernel Architecture:**
- ✅ All dispatch operations flow through kernel (no UI bypass)
- ✅ Immutable audit trail in `dispatch_events`
- ✅ Deterministic matching (no randomness, no AI)
- ✅ Atomic assignment (race condition protected)
- ✅ Row-level security enforced at database level

**Sovereign Rail Standards:**
- ✅ Event-driven architecture
- ✅ Separation of concerns (UI → Service → Kernel → DB)
- ✅ No mock data (all providers from database)
- ✅ Full observability via event logs

---

## Contact

For questions or issues with the Logistics Dispatch Engine:
- **Documentation:** This file
- **Code:** `supabase/functions/logistics-*` and `src/services/logisticsDispatchService.ts`
- **Database:** `logistics_providers`, `dispatch_events`, `dispatch_notifications` tables
