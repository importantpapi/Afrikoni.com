# AFRIKONI EXECUTION ROADMAP
## From Current State to Profitable Trade Operating System

---

## CURRENT STATE ASSESSMENT

Based on forensic analysis, Afrikoni has:

| Component | Status | Blocker |
|-----------|--------|---------|
| User Authentication | ✅ Working | None |
| Profile/Company Management | ✅ Working | None |
| RFQ Creation | ✅ Working | No payment gate |
| Quote Submission | ✅ Working | No payment gate |
| Order Creation | ✅ Working | No fund collection |
| Escrow State Machine | ✅ Logic exists | No payment integration |
| Trust Score | ✅ Working | None |
| Messaging | ✅ Working | No content gating |
| Supplier Profiles | 🔴 Leaking | Contact info exposed |
| Payment Collection | 🔴 Broken | No gateway integrated |
| Logistics | 🔴 Missing | No partner APIs |
| Serious Mode | 🔴 Missing | Does not exist |
| Trade Credit | 🔴 Missing | Does not exist |

---

## PHASE 0: STOP THE BLEEDING
**Timeline: Week 1-2**
**Goal: Prevent further value leakage**

### 0.1 Remove WhatsApp Public Link
**Files to modify:**
- `src/components/contact/ContactPage.jsx` - Remove WhatsApp community section
- `src/components/shared/MobileWhatsAppButton.jsx` - Remove or gate behind login
- Any hardcoded WhatsApp links across codebase

**Acceptance Criteria:**
- [ ] No public WhatsApp link visible to unauthenticated users
- [ ] WhatsApp community link only shown to verified suppliers (internal use)

### 0.2 Hide Contact Information
**Files to modify:**
- `src/pages/business/[id].jsx` - Remove email, phone, website, address display
- `src/components/supplier/SupplierCard.jsx` - Remove contact info
- `src/components/supplier/SupplierProfile.jsx` - Gate contact info

**New Logic:**
```
IF user.has_completed_transaction_with(supplier) THEN
  show_contact_info()
ELSE
  show_placeholder("Complete a transaction to unlock contact info")
END
```

**Acceptance Criteria:**
- [ ] Contact info hidden on all supplier profiles
- [ ] Contact info visible ONLY to users who completed a transaction with that supplier
- [ ] Clear messaging about how to unlock contact info

### 0.3 Disable Free RFQ Creation
**Files to modify:**
- `src/pages/dashboard/rfqs/new.jsx` - Add Serious Mode check
- `src/services/rfqService.js` - Validate Serious Mode before creation

**New Logic:**
```
IF user.serious_mode_active AND user.rfq_quota_remaining > 0 THEN
  allow_rfq_creation()
ELSE
  redirect_to_serious_mode_upgrade()
END
```

**Acceptance Criteria:**
- [ ] RFQ creation blocked for users without Serious Mode
- [ ] Clear upgrade prompt shown
- [ ] Existing RFQs still visible/manageable

### 0.4 Align Marketing with Reality
**Files to modify:**
- `src/pages/pricing.jsx` - Update claims
- `src/pages/logistics.jsx` - Update claims
- `src/pages/trust.jsx` - Update claims
- All marketing pages with "insured" or "protected" claims

**Remove or Qualify:**
- "All shipments insured" → "Protection up to $X for verified transactions"
- "Customs clearance network" → "Customs documentation assistance"
- "54 country coverage" → "Operating in X countries, expanding to Y"

**Acceptance Criteria:**
- [ ] No claims that exceed actual liability caps
- [ ] Terms of Service and marketing aligned
- [ ] Legal review completed (if applicable)

---

## PHASE 1: PAYMENT FOUNDATION
**Timeline: Week 3-6**
**Goal: Enable revenue collection**

### 1.1 Integrate Payment Gateway
**Provider: Flutterwave (already referenced in codebase)**

**New Files to Create:**
- `src/services/PaymentService.js` - Payment orchestration
- `src/hooks/usePayment.js` - React hooks for payment flows
- `src/components/payment/PaymentModal.jsx` - Payment UI
- `src/pages/api/webhooks/flutterwave.js` - Webhook handler (if using API routes)

**Database Changes:**
```sql
-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  type VARCHAR(50), -- 'card', 'mobile_money', 'bank_transfer'
  provider VARCHAR(50), -- 'flutterwave', 'paystack'
  provider_payment_method_id VARCHAR(255),
  last_four VARCHAR(4),
  brand VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  type VARCHAR(50), -- 'serious_mode', 'escrow_deposit', 'verification'
  status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Acceptance Criteria:**
- [ ] Can collect one-time payments (Serious Mode)
- [ ] Can hold funds in escrow (Secure Deal)
- [ ] Can release funds to sellers
- [ ] Can process refunds
- [ ] Webhook handles all payment states

### 1.2 Enable Serious Mode Purchases
**New Files to Create:**
- `src/pages/serious-mode.jsx` - Serious Mode landing/purchase page
- `src/components/serious-mode/PricingTable.jsx` - Tier selection
- `src/components/serious-mode/UpgradePrompt.jsx` - Upgrade CTAs

**Database Changes:**
```sql
-- Serious Mode subscriptions
CREATE TABLE serious_mode_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  tier VARCHAR(50), -- 'starter', 'professional', 'enterprise'
  status VARCHAR(50), -- 'active', 'expired', 'cancelled'
  rfq_quota INT,
  rfq_used INT DEFAULT 0,
  message_quota INT, -- NULL for unlimited
  messages_used INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  payment_transaction_id UUID REFERENCES payment_transactions(id)
);
```

**Acceptance Criteria:**
- [ ] Users can purchase Serious Mode tiers
- [ ] RFQ quota tracked and enforced
- [ ] Message quota tracked and enforced
- [ ] Expiration handled automatically
- [ ] Upgrade/downgrade paths work

### 1.3 Enable Escrow Fund Holding
**Files to modify:**
- `src/lib/supabaseQueries/payments.js` - Add real fund operations
- `src/pages/dashboard/escrow/[orderId].jsx` - Connect to real payments

**New Logic:**
```
WHEN order created:
  1. Calculate total (order_value + 6% secure_deal_fee)
  2. Collect payment via Flutterwave
  3. On success: Update escrow_payments.status = 'held'
  4. On failure: Rollback order creation

WHEN buyer confirms delivery:
  1. Calculate seller payout (order_value - platform_commission)
  2. Initiate payout via Flutterwave
  3. On success: Update escrow_payments.status = 'released'
  4. On failure: Queue for retry/manual review
```

**Acceptance Criteria:**
- [ ] Funds actually collected when order created
- [ ] Funds actually released when delivery confirmed
- [ ] Refunds work for cancelled orders
- [ ] All transactions logged with provider references

### 1.4 Test Complete Paid Flow
**Test Scenarios:**
1. User purchases Serious Mode → Check payment captured
2. User creates RFQ → Check quota decremented
3. Supplier submits quote → Check messaging works
4. Buyer accepts quote → Check escrow collected
5. Seller ships → Check milestone tracking
6. Buyer confirms → Check seller paid
7. Review submitted → Check trust score updated

**Acceptance Criteria:**
- [ ] End-to-end flow works with real money (test mode)
- [ ] All edge cases handled (failures, refunds, disputes)
- [ ] Audit trail complete

---

## PHASE 2: SERIOUS MODE GATE
**Timeline: Week 7-10**
**Goal: Monetize intent, cover admin costs**

### 2.1 Build Serious Mode Bundle UI
**Pages to create:**
- Serious Mode landing page with benefits
- Tier comparison table
- Purchase flow with payment
- Dashboard showing usage/quota

**Acceptance Criteria:**
- [ ] Clear value proposition for each tier
- [ ] Seamless purchase experience
- [ ] Usage tracking visible to user

### 2.2 Gate RFQ Creation
**Enforcement points:**
- RFQ creation form
- RFQ service layer
- Database constraints

**User Experience:**
- Non-Serious Mode users see RFQ benefits
- Clear path to upgrade
- No dead ends

### 2.3 Gate Messaging
**Enforcement points:**
- Message composer
- Conversation creation
- Message service layer

**User Experience:**
- Can see conversation exists
- Can see message previews (first 100 chars)
- Cannot send without Serious Mode
- Clear upgrade prompt

### 2.4 Launch to Initial Users
**Rollout strategy:**
1. Announce to existing users (email)
2. Grandfather existing RFQs (complete them)
3. New RFQs require Serious Mode
4. Support for transition questions

---

## PHASE 3: SECURE DEAL BUNDLE
**Timeline: Week 11-16**
**Goal: Monetize transactions, prove value**

### 3.1 Build Escrow Flow with Real Fund Movement
**Complete the escrow flow:**
- Fund collection on order acceptance
- Fund holding during fulfillment
- Fund release on delivery confirmation
- Refund on cancellation/dispute

### 3.2 Integrate ONE Logistics Partner
**Recommended first partner:** DHL Africa or local leader (e.g., GIG Logistics)

**Integration scope:**
- Rate fetching API
- Booking API
- Tracking API
- Webhook for status updates

**Files to create:**
- `src/services/LogisticsService.js`
- `src/services/providers/DHLProvider.js`
- `src/hooks/useShippingRates.js`
- `src/components/shipping/RateSelector.jsx`

### 3.3 Build Milestone Tracking
**Connect logistics to order status:**
- Auto-update milestones from carrier API
- Manual fallback for non-integrated carriers
- Exception handling for delays

### 3.4 Build Dispute Flow with Deposit
**Dispute flow:**
1. User initiates dispute (pays $25 deposit)
2. Evidence collection period (72 hours)
3. Admin review (24-48 hours)
4. Resolution (refund, release, partial)
5. Deposit returned if ruled in favor

**Files to create:**
- `src/pages/dashboard/disputes/new.jsx`
- `src/components/disputes/EvidenceUploader.jsx`
- `src/components/disputes/DisputeTimeline.jsx`

---

## PHASE 4: GRAVITY SYSTEMS
**Timeline: Week 17-24**
**Goal: Create lock-in, make leaving irrational**

### 4.1 Launch Trade Credit
**Database:**
```sql
CREATE TABLE trade_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  balance DECIMAL(12,2) DEFAULT 0,
  lifetime_earned DECIMAL(12,2) DEFAULT 0,
  lifetime_spent DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trade_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  amount DECIMAL(12,2),
  type VARCHAR(50), -- 'earned', 'spent', 'expired'
  reference_type VARCHAR(50), -- 'order', 'serious_mode', 'verification'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Earning rules:**
- 2% of Secure Deal value after completion
- Bonus for first 3 deals (onboarding)
- Referral credits

**Spending rules:**
- Serious Mode bundles
- Secure Deal fees
- Premium features

### 4.2 Build Price Intelligence
**Data aggregation:**
- Average prices by category
- Prices by corridor (origin → destination)
- Price trends over time
- Quote vs. final price variance

**Display:**
- During RFQ creation: "Typical price range: $X - $Y"
- During quote review: "This quote is X% above average"
- In dashboard: Market trends widget

### 4.3 Build Relationship Memory
**Features:**
- Reorder from previous supplier (one-click)
- View transaction history with each supplier
- Suggested reorder based on usage patterns
- Supplier loyalty tracking (discounts for repeat)

### 4.4 Launch Supplier Premium Placement
**Monetization:**
- Featured listings: $49-199/month
- Category sponsorship: $299/month
- Homepage banner: $499/month

---

## PHASE 5: SCALE
**Timeline: Week 25+**
**Goal: Expand coverage, deepen moat**

### 5.1 Add More Logistics Partners
- Regional carriers per corridor
- Specialized (cold chain, hazmat, etc.)
- Last-mile partners

### 5.2 Add More Payment Methods
- Mobile money (M-Pesa, MTN MoMo)
- Bank transfers
- Crypto (stablecoins)

### 5.3 Launch API for Enterprise
- Programmatic access to Trade Operating System
- Bulk RFQ creation
- Automated order management
- Data feeds for intelligence

### 5.4 Expand Geographic Coverage
- Country-specific compliance
- Local payment methods
- Local logistics partners
- Local language support

---

## METRICS TO TRACK

### Phase 0-1 (Foundation)
- Payment success rate (target: >95%)
- Leakage incidents (target: 0)
- User complaints about contact hiding (track, don't panic)

### Phase 2 (Serious Mode)
- Serious Mode conversion (target: 15% of registered users)
- RFQ creation rate (should decrease initially, then increase)
- Revenue per user

### Phase 3 (Secure Deal)
- Secure Deal conversion (target: 40% of Serious Mode users)
- Transaction value growth
- Dispute rate (target: <2%)
- Logistics delivery success (target: >95%)

### Phase 4 (Gravity)
- Trade Credit redemption rate (target: 80%)
- Repeat transaction rate (target: 60% within 90 days)
- Off-platform leakage (target: <5%)

### Phase 5 (Scale)
- GMV growth rate
- Geographic expansion
- Enterprise customer acquisition
- API adoption

---

## RISK REGISTRY

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users revolt against contact hiding | High | Medium | Clear messaging, contact unlock is REWARD not punishment |
| Payment integration delays | Medium | High | Start integration ASAP, have backup provider |
| Logistics partner unreliable | Medium | High | Start with major provider, have manual fallback |
| Fraud spike | Medium | High | Aggressive KYB, start with lower limits |
| Competition copies model | Low | Medium | Execute faster, data moat deepens with time |

---

## DO NOT BUILD LIST

Until Phase 4 is complete, DO NOT build:
- [ ] Mobile app
- [ ] AI chatbot
- [ ] Advanced analytics
- [ ] Multi-currency wallets
- [ ] Buyer financing
- [ ] Community features
- [ ] API access
- [ ] Referral programs

These are all **value giveaways** until the core monetization is proven.

---

## SUCCESS CRITERIA

**Phase 0-1 Success:** One complete paid transaction (Serious Mode → Secure Deal → Closeout)

**Phase 2 Success:** 100 paying Serious Mode users, $10K monthly Serious Mode revenue

**Phase 3 Success:** $100K monthly GMV through Secure Deal, <2% dispute rate

**Phase 4 Success:** 60% repeat transaction rate, $500K monthly GMV

**Phase 5 Success:** $1M+ monthly GMV, 3+ logistics partners, positive unit economics

---

*This roadmap is the ONLY viable execution path given the constraint of no loss tolerance.*
*Any deviation creates loss vectors that compound over time.*

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
