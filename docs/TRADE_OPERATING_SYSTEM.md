# AFRIKONI TRADE OPERATING SYSTEM (TOS)
## Version 1.0 - The State Machine That Makes Sideways Behavior Irrational

---

## EXECUTIVE SUMMARY

Afrikoni is not a marketplace. It is a **Trade Operating System** — infrastructure that makes cross-border African trade trustworthy, trackable, and profitable for everyone involved.

This document defines the **7 Trade States** that every transaction flows through, the **gates** that create revenue, and the **gravity** that makes leaving Afrikoni irrational.

---

## THE CORE PRINCIPLE

> **Users pay for state transitions, not features.**
> **Every transition creates value that users cannot take with them.**
> **Leaving Afrikoni means starting from zero.**

---

## THE 7 TRADE STATES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AFRIKONI TRADE STATE MACHINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │    1     │    │    2     │    │    3     │    │    4     │             │
│   │DISCOVERY │───▶│  INTENT  │───▶│ SERIOUS  │───▶│  DEAL    │             │
│   │          │    │          │    │   MODE   │    │  DRAFT   │             │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│        │              │               │ $$$           │                     │
│        │              │               │               │                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │    7     │    │    6     │    │    5     │◀───┤          │             │
│   │ CLOSEOUT │◀───│ DELIVERY │◀───│  SECURE  │    │          │             │
│   │          │    │          │    │   DEAL   │    │          │             │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│        │                               │ $$$                                │
│        ▼                               │                                    │
│   ┌──────────┐                         │                                    │
│   │  TRADE   │◀────────────────────────┘                                    │
│   │  MEMORY  │  (Data Gravity Layer - Non-Exportable)                       │
│   └──────────┘                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STATE 1: DISCOVERY

### What Happens
- Visitor lands on Afrikoni (marketplace, product page, supplier profile)
- Can browse categories, products, supplier summaries
- Can see **Trust Scores**, **Trade Volume Badges**, **Verification Status**

### What Is VISIBLE
- Product names, descriptions, images
- Supplier company name, country, verification badge
- Trust score (1-100)
- Trade volume tier (Bronze/Silver/Gold/Platinum)
- Response rate, average response time
- Category specializations

### What Is HIDDEN (Until State 3)
- Email address
- Phone number
- WhatsApp
- Website URL
- Physical address
- Direct messaging capability

### Why This Works
The user sees PROOF of quality (trust score, trade volume, verification) but cannot EXTRACT contact information. They must enter the system to access the supplier.

### Cost to Afrikoni
- Infrastructure: Page loads, CDN, database reads
- Revenue: $0 (acquisition cost, acceptable)

### Gate to Next State
- **Create Account** (free, but captures identity)

---

## STATE 2: INTENT

### What Happens
- User creates account (email + password OR Google/Apple SSO)
- User completes basic profile (name, company, country)
- User can now:
  - Save products to watchlist
  - Follow suppliers
  - See "Request Quote" buttons
  - See "Contact Supplier" buttons (grayed out)

### What Is VISIBLE
- Everything from State 1
- "Request Quote" button (leads to RFQ form)
- "Upgrade to Contact Suppliers" prompt
- Sample RFQs from other buyers (anonymized)

### What Is STILL HIDDEN
- Supplier contact info
- Direct messaging
- Quote responses (until Serious Mode)

### Why This Works
The user has invested identity (account creation). They can see the VALUE of the platform (RFQs, quotes, deals happening) but cannot participate fully. They are shown what they're missing.

### Cost to Afrikoni
- Infrastructure: Account storage, profile data
- Revenue: $0 (but email captured for marketing)

### Gate to Next State
- **Purchase Serious Mode Bundle**

---

## STATE 3: SERIOUS MODE (First Revenue Gate)

### The Bundle
Serious Mode is NOT a subscription. It is a **commitment signal** that unlocks real trade capability.

| Tier | Price | Duration | What's Included |
|------|-------|----------|-----------------|
| **Starter** | $29 | 30 days | 5 RFQs, 10 messages, basic matching |
| **Professional** | $99 | 30 days | 25 RFQs, unlimited messages, priority matching, price intelligence |
| **Enterprise** | $299 | 30 days | Unlimited RFQs, unlimited messages, dedicated matcher, API access |

### What Is NOW UNLOCKED
- **RFQ Creation**: Submit requests for quotes
- **Supplier Messaging**: Direct chat with matched suppliers
- **Quote Reception**: Receive and compare quotes
- **Price Intelligence**: See average prices for your category/corridor
- **Supplier Contact Info**: Revealed AFTER first successful transaction

### What Is STILL HIDDEN
- Supplier email/phone/WhatsApp (until first deal closes)
- Logistics partner rates (until Secure Deal)
- Trade credit eligibility (until 3+ deals)

### Why This Works
1. **Commitment Signal**: $29-299 proves serious intent, filters tire-kickers
2. **Admin Labor Covered**: RFQ matching (5-15 min each) is now compensated
3. **Messaging Gated**: Contact extraction blocked until value delivered
4. **Progressive Reveal**: More value unlocks with more commitment

### Cost to Afrikoni
- Admin: RFQ matching (paid for by bundle)
- Infrastructure: Messaging, storage (paid for by bundle)

### Revenue
- $29-299 per active buyer per month
- At 1000 active buyers: $29,000-$299,000/month

### Gate to Next State
- **Submit RFQ** OR **Accept Quote**

---

## STATE 4: DEAL DRAFT

### What Happens
- Buyer submits RFQ (using Serious Mode quota)
- Afrikoni's matching system finds suitable suppliers
- Matched suppliers are notified
- Suppliers submit quotes (price, terms, lead time)
- Buyer reviews quotes in comparison view
- Buyer can message suppliers (within platform)

### The Negotiation Room
All negotiation happens in a **structured environment**:
- Messages are logged
- Terms are tracked
- Price changes are recorded
- Delivery promises are timestamped

### What Is VISIBLE
- All quotes with full pricing breakdown
- Supplier trust scores and trade history
- Average market price for this product/corridor
- Estimated delivery time ranges
- Supplier certifications and verifications

### What Is STILL HIDDEN
- Supplier direct contact (email/phone)
- Off-platform communication capability

### Anti-Sideways Mechanism
If a message contains phone number, email, or "WhatsApp":
1. Message is flagged (not blocked)
2. User sees: "Direct contact is available after your first successful deal. Complete this transaction to unlock."
3. Message is delivered but flagged in supplier's trust history

### Why This Works
1. **Structured Negotiation**: All terms are on record
2. **Price Transparency**: Buyer sees market context
3. **Trust Integration**: Every action affects trust score
4. **Progressive Unlock**: Contact info is the REWARD for completing a deal

### Cost to Afrikoni
- Infrastructure: Quote storage, messaging
- Revenue: Covered by Serious Mode bundle

### Gate to Next State
- **Accept Quote** → Creates order
- **Both parties agree to terms**

---

## STATE 5: SECURE DEAL (Second Revenue Gate)

### The Bundle
When buyer accepts a quote, they enter **Secure Deal** — the escrow + logistics + protection bundle.

### What's Included (Automatically)

| Component | What It Does | Cost |
|-----------|--------------|------|
| **Escrow Protection** | Funds held until delivery confirmed | 3% of order value |
| **Logistics Coordination** | Shipping quotes, tracking, customs docs | 2% of order value (or flat fee) |
| **Trade Insurance** | Protection against fraud, non-delivery | 1% of order value |
| **Dispute Resolution** | Mediation if issues arise | Included (pre-paid) |
| **Milestone Tracking** | Order → Shipped → Customs → Delivered | Included |

**Total: 6% of order value** (bundled, not itemized to user)

### Why Bundling Works
Users don't choose to unbundle because:
1. **Escrow is required** to release supplier contact info post-deal
2. **Logistics rates are only available** through Secure Deal
3. **Insurance is only valid** for Secure Deal transactions
4. **Disputes are only mediated** for Secure Deal transactions

Unbundling means: no protection, no tracking, no recourse.

### The Escrow Flow
```
Buyer accepts quote
       │
       ▼
┌─────────────────────────┐
│  FUNDS COLLECTED        │  ◀── Flutterwave/Mobile Money/Bank
│  (Order Value + 6% Fee) │
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  ESCROW HELD            │  ◀── Funds in Afrikoni custody
│  Status: SECURED        │
└─────────────────────────┘
       │
       ▼
  (Delivery happens)
       │
       ▼
┌─────────────────────────┐
│  BUYER CONFIRMS         │  ◀── "I received the goods"
│  Status: CONFIRMED      │
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  FUNDS RELEASED         │  ◀── Seller receives payment
│  Status: RELEASED       │
└─────────────────────────┘
```

### What Is NOW UNLOCKED
- Logistics partner quotes (integrated rates)
- Shipment tracking (real-time)
- Customs documentation (auto-generated)
- Dispute escalation (if needed)

### What Is STILL HIDDEN
- Supplier direct contact (unlocks at State 7)

### Cost to Afrikoni
- Payment processing: ~2.5% (covered by 6% bundle)
- Logistics coordination: Labor + API costs
- Insurance reserve: Pooled from 1% insurance component
- Dispute reserve: Pooled from escrow fees

### Revenue
- 6% of every transaction
- At $1M monthly GMV: $60,000/month
- At $10M monthly GMV: $600,000/month

### Gate to Next State
- **Seller ships goods**

---

## STATE 6: DELIVERY

### Milestone Tracking
Every Secure Deal has automatic milestones:

```
┌──────────────────────────────────────────────────────────────────┐
│                    DELIVERY MILESTONE TRACKER                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Order Confirmed ─────────────────────────── Day 0           │
│     │                                                            │
│  ✅ Payment Secured ─────────────────────────── Day 0           │
│     │                                                            │
│  ⏳ Seller Preparing ────────────────────────── Day 1-3         │
│     │                                                            │
│  ⬜ Shipped ─────────────────────────────────── Expected Day 5   │
│     │                                                            │
│  ⬜ In Transit ──────────────────────────────── Tracking: ___   │
│     │                                                            │
│  ⬜ Customs Clearance ───────────────────────── Expected Day 10  │
│     │                                                            │
│  ⬜ Out for Delivery ────────────────────────── Expected Day 12  │
│     │                                                            │
│  ⬜ Delivered ───────────────────────────────── Expected Day 14  │
│     │                                                            │
│  ⬜ Buyer Confirmed ─────────────────────────── Awaiting         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Logistics Partner Integration
For each shipment:
1. System fetches rates from integrated partners (DHL, Aramex, local carriers)
2. Buyer selects shipping option during Secure Deal
3. Tracking number auto-populates when seller ships
4. Milestones update automatically via carrier API
5. Customs documents generated (commercial invoice, packing list)

### Exception Handling
If milestone is delayed:
- Automatic notification to both parties
- Escalation path clearly visible
- Dispute can be opened (but not frivolously — see below)

### Dispute Prevention
To open a dispute:
1. Must be in Delivery state for 7+ days
2. Must have attempted resolution via messaging (logged)
3. **$25 dispute deposit** (refunded if dispute ruled in your favor)

This prevents frivolous disputes while protecting legitimate claims.

### Cost to Afrikoni
- Logistics API costs: Covered by 2% logistics component
- Tracking infrastructure: Covered by bundle
- Dispute handling: Covered by $25 deposit + insurance pool

### Revenue
- Already captured in Secure Deal bundle
- Logistics margin: 10-15% markup on carrier rates

### Gate to Next State
- **Buyer confirms delivery** OR **Dispute resolution completes**

---

## STATE 7: CLOSEOUT

### What Happens
1. Buyer confirms goods received (or dispute resolved)
2. Escrow releases funds to seller (minus any dispute adjustments)
3. Both parties prompted to leave reviews
4. **Trade Memory is written** (permanent, non-exportable)

### The Big Unlock: Direct Contact
**ONLY NOW** does the buyer receive:
- Supplier email address
- Supplier phone number
- Supplier WhatsApp (if provided)
- Supplier website

### Why This Works
1. **Trust is established**: One successful deal proves reliability
2. **Value is delivered**: Buyer got their goods, seller got paid
3. **Relationship earned**: Direct contact is the REWARD
4. **Data captured**: The entire journey is now in Trade Memory

### Review System
Both parties rate each other:
- Overall (1-5 stars)
- Communication (1-5 stars)
- Quality/Accuracy (1-5 stars)
- Timeliness (1-5 stars)

Reviews are:
- **Moderated** (no fake reviews)
- **Verified** (only after real transaction)
- **Permanent** (cannot be deleted)
- **Weighted** (larger deals = more weight)

### Trade Memory Written
After closeout, the system records:
- Transaction value
- Product category
- Corridor (origin → destination)
- Timeline (days from order to delivery)
- Pricing (benchmarking)
- Outcome (successful, disputed, refunded)

This data becomes part of **Afrikoni Intelligence**.

### Cost to Afrikoni
- Infrastructure: Review storage, data processing
- Revenue: None (value capture already happened)

### What Happens Next
The buyer now has supplier contact info. They CAN transact directly next time.

**But why would they?**

---

## THE GRAVITY LAYER: WHY STAYING IS RATIONAL

### Trade Credit System
After 3+ successful Secure Deals:
- Buyer earns **Trade Credit** (2% of transaction value)
- Trade Credit is ONLY usable on Afrikoni
- Trade Credit expires after 12 months of inactivity
- Trade Credit can be used for: Serious Mode bundles, Secure Deal fees, logistics

**At $100K lifetime GMV**: $2,000 Trade Credit balance
**Leaving Afrikoni means losing $2,000**

### Trust Score Portability (NOT)
Your trust score:
- Is visible to all Afrikoni users
- Affects your matching priority
- Affects your logistics rates (high trust = lower rates)
- Affects your dispute resolution (high trust = benefit of doubt)

**Your trust score CANNOT be exported.**
**Starting on another platform = starting from zero.**

### Price Intelligence
After 5+ transactions, you unlock:
- **Corridor benchmarks**: "Average price for X from Nigeria to Kenya is $Y"
- **Seasonal trends**: "Prices for X typically drop 15% in Q4"
- **Supplier comparison**: "This quote is 12% above market average"

**This intelligence is ONLY available inside Afrikoni.**
**Going direct means flying blind.**

### Relationship Memory
For repeat purchases:
- One-click reorder from same supplier
- Historical pricing visible
- Previous terms auto-populated
- Loyalty discounts from suppliers (who want Afrikoni reviews)

**Going direct means: no history, no one-click, no memory.**

### Why Going Sideways Becomes Irrational

| If You Leave Afrikoni | You Lose |
|-----------------------|----------|
| Trade Credit balance | $X (earned over time) |
| Trust score | Start from zero elsewhere |
| Price intelligence | No benchmarks, no trends |
| Escrow protection | No recourse if scammed |
| Logistics rates | Pay retail, not Afrikoni rates |
| Dispute resolution | No mediator, no insurance |
| Relationship memory | No history, no one-click |

**The cost of leaving > The cost of staying.**

---

## REVENUE MODEL SUMMARY

### Revenue Streams

| Stream | When | Amount | At $1M GMV | At $10M GMV |
|--------|------|--------|------------|-------------|
| **Serious Mode** | State 3 | $29-299/month | $29K-299K/mo | $290K-2.9M/mo |
| **Secure Deal Fee** | State 5 | 6% of GMV | $60K/mo | $600K/mo |
| **Logistics Margin** | State 6 | 10-15% markup | $10K-15K/mo | $100K-150K/mo |
| **Verification** | Pre-State 1 | $99-299/supplier | Variable | Variable |
| **Data/API** | Post-Scale | Enterprise pricing | Future | Future |

### Cost Coverage

| Cost | Covered By |
|------|------------|
| RFQ matching (admin labor) | Serious Mode bundle |
| Messaging infrastructure | Serious Mode bundle |
| Escrow processing | Secure Deal fee (3%) |
| Logistics coordination | Secure Deal fee (2%) |
| Insurance reserve | Secure Deal fee (1%) |
| Dispute handling | $25 deposit + insurance pool |
| Trust/review moderation | Secure Deal fee (included) |

### Profitability Math

At $1M monthly GMV with 100 active Serious Mode users:

| Revenue | Amount |
|---------|--------|
| Serious Mode (avg $100) | $10,000 |
| Secure Deal (6%) | $60,000 |
| Logistics margin (10%) | $10,000 |
| **Total Revenue** | **$80,000/month** |

| Cost | Amount |
|------|--------|
| Payment processing (2.5%) | $25,000 |
| Infrastructure (Supabase, etc.) | $2,000 |
| Support (2 FTE) | $6,000 |
| Dispute reserve | $5,000 |
| **Total Cost** | **$38,000/month** |

| **Net Profit** | **$42,000/month** |
|----------------|-------------------|

**Profit margin: 52.5%**

---

## SUPPLIER SIDE: THE MIRROR FLOW

### Supplier Journey

1. **Discovery**: Supplier finds Afrikoni, sees buyer demand
2. **Registration**: Creates account, basic profile
3. **Verification** (Paid Gate): $99-299 for verification badge
4. **Listing**: Creates product listings
5. **Matching**: Receives RFQ matches based on category/capability
6. **Quoting**: Submits quotes to interested buyers
7. **Fulfillment**: Completes orders via Secure Deal
8. **Reputation**: Builds trust score, unlocks premium placement

### Supplier Incentives to Stay

| Benefit | Why It Matters |
|---------|---------------|
| **Buyer traffic** | Afrikoni brings verified, paying buyers |
| **Trust badge** | Verification badge = credibility |
| **Escrow protection** | Payment guaranteed when shipped |
| **Dispute protection** | Mediation protects against unfair claims |
| **Analytics** | See which products get most RFQs |
| **Premium placement** | High trust score = top of search |

### Supplier Costs

| Cost | Amount | Why |
|------|--------|-----|
| Verification | $99-299 one-time | Proves legitimacy |
| Transaction fee | 0% | Afrikoni charges BUYERS, not sellers |
| Premium placement | $49-199/month (optional) | Boost visibility |

**Suppliers pay for verification and optional visibility.**
**Transaction fees are on buyers, creating supplier-friendly economics.**

---

## ANTI-FRAUD MECHANISMS

### Pre-Transaction
- KYB verification for suppliers
- Email verification for all users
- Device fingerprinting
- IP geolocation matching

### During Transaction
- Escrow holds funds until delivery confirmed
- Milestone tracking with partner verification
- Message monitoring for red flags
- Price anomaly detection

### Post-Transaction
- Review verification (only completed deals)
- Trust score impact from disputes
- Repeat fraud = permanent ban
- Shared fraud database (cross-platform eventually)

### Fraud Cost Model
- Insurance pool: 1% of all transactions
- Expected fraud rate: 0.5% of transactions
- Reserve ratio: 2:1 (insurance covers fraud)
- No loss to Afrikoni operations

---

## IMPLEMENTATION PHASES

### Phase 0: Stop Bleeding (Week 0-2)
- [ ] Remove WhatsApp public link
- [ ] Hide contact info on all profiles
- [ ] Disable free RFQ creation
- [ ] Align marketing with actual capabilities

### Phase 1: Payment Foundation (Week 3-6)
- [ ] Integrate Flutterwave
- [ ] Enable Serious Mode purchases
- [ ] Enable escrow fund holding
- [ ] Test complete paid flow

### Phase 2: Serious Mode Gate (Week 7-10)
- [ ] Build Serious Mode bundle UI
- [ ] Gate RFQ creation behind Serious Mode
- [ ] Gate messaging behind Serious Mode
- [ ] Launch to initial users

### Phase 3: Secure Deal Bundle (Week 11-16)
- [ ] Build escrow flow with real fund movement
- [ ] Integrate ONE logistics partner
- [ ] Build milestone tracking
- [ ] Build dispute flow with deposit

### Phase 4: Gravity Systems (Week 17-24)
- [ ] Launch Trade Credit
- [ ] Build price intelligence
- [ ] Build relationship memory
- [ ] Launch supplier premium placement

### Phase 5: Scale (Week 25+)
- [ ] Add more logistics partners
- [ ] Add more payment methods
- [ ] Launch API for enterprise
- [ ] Expand geographic coverage

---

## SUCCESS METRICS

### North Star Metric
**GMV through Secure Deal** (not just registered users)

### Leading Indicators
- Serious Mode conversion rate (target: 15% of registered users)
- Secure Deal conversion rate (target: 40% of Serious Mode users)
- Repeat transaction rate (target: 60% within 90 days)
- Trade Credit redemption rate (target: 80%)

### Guardrail Metrics
- Dispute rate (target: <2% of transactions)
- Refund rate (target: <1% of transactions)
- Off-platform leakage rate (target: <5% of initiated deals)
- Support ticket rate (target: <3% of transactions)

---

## WHAT THIS SYSTEM PREVENTS

| Problem | How TOS Prevents It |
|---------|---------------------|
| Contact info leakage | Hidden until first deal completes |
| Free RFQ abuse | Gated behind Serious Mode payment |
| Off-platform payments | Escrow required for contact unlock |
| Frivolous disputes | $25 deposit required |
| Fake reviews | Only verified transactions can review |
| Supplier churn | Transaction fees on buyers, not sellers |
| Buyer churn | Trade Credit + Trust Score + Intelligence |
| Fraud | Escrow + Insurance + Verification |
| Unprofitable growth | Every state transition is profitable |

---

## THE BOTTOM LINE

Afrikoni Trade Operating System transforms trade from:

**"I hope this works"** → **"This is how it works"**

By making every state transition:
1. **Valuable** (user gets something they need)
2. **Paid** (by someone, somehow)
3. **Sticky** (creates data/value that can't leave)

The result:
- **Users don't feel billed** — they feel protected
- **Sideways behavior is irrational** — not forbidden
- **Every flow pays for itself** — no loss leaders
- **Data gravity compounds** — moat deepens over time

This is not a marketplace. This is infrastructure.

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
*Author: Afrikoni Architecture Team*
