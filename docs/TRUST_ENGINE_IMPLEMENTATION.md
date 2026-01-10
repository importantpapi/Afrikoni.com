# 🧠 AFRIKONI TRUST-DRIVEN DECISION ENGINE

## 🎯 WHAT THIS IS

A **backend intelligence layer** that uses trust scores to make better decisions about:
- Which suppliers to show first (ranking)
- Which suppliers to recommend for RFQs (matching)
- Which deals need admin attention (prioritization)

**Critical:** Users never see the numeric scores. They see "Recommended" badges and smart defaults.

---

## ✅ WHAT'S BEEN IMPLEMENTED

### 1. DATABASE FUNCTIONS ✅

**`calculate_supplier_rank_score(company_id, search_query, buyer_country)`**
- Returns: 0-100 score
- Weights:
  - **Trust Score: 45%**
  - Relevance: 25% (verified status, profile completeness, certs, location match)
  - Responsiveness: 20% (response rate)
  - Pricing: 10% (placeholder for price competitiveness)

**`calculate_rfq_match_score(rfq_id, supplier_company_id)`**
- Returns: 0-100 score (0 = blocked supplier)
- Weights:
  - **Trust Score: 40%**
  - Category Match: 30% (supplier has products in RFQ category)
  - Capacity: 20% (past orders, employee count, verified status)
  - Location: 10% (same country as delivery location)

**`calculate_deal_priority_score(order_id)`**
- Returns: 0-100 score (higher = needs more attention)
- Weights:
  - **Inverse Trust: 35%** (lower trust = higher priority)
  - Deal Value: 30% (higher value = higher priority)
  - Urgency: 20% (older = higher priority)
  - Complexity: 15% (disputes = immediate priority)

**`get_supplier_tier(company_id)`**
- Returns: A, B, or C
  - **A (75+)**: Top tier, highly recommended
  - **B (50-74)**: Mid tier, good match
  - **C (<50)**: Lower tier, needs verification

---

### 2. FRONTEND HOOKS ✅

**`useSupplierRanking(suppliers, searchQuery, buyerCountry)`**
- Calculates rank scores for list of suppliers
- Sorts by score (highest first)
- Adds `is_recommended` flag (score >= 75)
- Returns: `{ rankedSuppliers, isLoading }`

**`useRFQMatching(rfqId, suppliers)`**
- Calculates match scores for RFQ
- Filters out blocked suppliers (score = 0)
- Adds `match_tier` and `is_highly_recommended` flags
- Returns: `{ matchedSuppliers, isLoading }`

---

### 3. UI COMPONENTS ✅

**`<RecommendedBadge type="recommended" />`**
- Shows "Recommended" badge (gold)
- Hover tooltip: "Based on verified trade history, profile quality, and responsiveness"
- **NO numeric scores shown**

**`<RecommendedBadge type="highly_recommended" />`**
- Shows "Highly Recommended" badge (green)
- Hover tooltip: "Top-rated supplier with excellent verified trade history"

**`<MatchTierBadge tier="A" />`**
- For RFQ matching
- Shows "Excellent Match", "Good Match", or "Possible Match"
- Hover tooltip with buyer-safe explanation

---

### 4. ADMIN PANEL ✅

**`/dashboard/admin/trust-engine`**
- View all suppliers with their:
  - Tier (A/B/C)
  - Trust Score
  - Rank Score
  - Reviews count
  - Verification status
- Stats dashboard:
  - Count of Tier A, B, C suppliers
  - Average trust score across platform
- Search and filter suppliers
- **Full transparency for governance**

---

### 5. AUDIT TRAIL ✅

**`decision_audit_log` table**
- Logs all trust engine calculations
- Fields:
  - `decision_type`: 'supplier_rank', 'rfq_match', 'deal_priority'
  - `entity_id`: supplier/rfq/order id
  - `computed_score`: final score
  - `score_components`: JSON breakdown
  - `context`: additional context
- **For compliance and debugging**

---

## 🚀 HOW TO USE IT

### For Supplier Listings

```jsx
import { useSupplierRanking } from '@/hooks/useSupplierRanking';
import RecommendedBadge from '@/components/suppliers/RecommendedBadge';

function SupplierList({ suppliers }) {
  const { rankedSuppliers, isLoading } = useSupplierRanking(
    suppliers,
    searchQuery,
    buyerCountry
  );

  return (
    <div>
      {rankedSuppliers.map(supplier => (
        <SupplierCard key={supplier.id}>
          <h3>{supplier.company_name}</h3>
          
          {/* Show badge for top suppliers */}
          {supplier.is_recommended && (
            <RecommendedBadge type="recommended" />
          )}
          
          {/* Tier A gets "Highly Recommended" */}
          {supplier.tier === 'A' && (
            <RecommendedBadge type="highly_recommended" />
          )}
        </SupplierCard>
      ))}
    </div>
  );
}
```

---

### For RFQ Matching

```jsx
import { useRFQMatching } from '@/hooks/useRFQMatching';
import { MatchTierBadge } from '@/components/suppliers/RecommendedBadge';

function RFQSupplierMatch({ rfqId, suppliers }) {
  const { matchedSuppliers, isLoading } = useRFQMatching(rfqId, suppliers);

  return (
    <div>
      <h2>Recommended Suppliers for This RFQ</h2>
      {matchedSuppliers.map(supplier => (
        <SupplierCard key={supplier.id}>
          <h3>{supplier.company_name}</h3>
          
          {/* Show match tier */}
          <MatchTierBadge tier={supplier.match_tier} />
          
          {/* Highlight top matches */}
          {supplier.is_highly_recommended && (
            <div className="border-2 border-green-500">
              <RecommendedBadge type="highly_recommended" />
            </div>
          )}
        </SupplierCard>
      ))}
    </div>
  );
}
```

---

### For Admin Deal Queue

```jsx
// In admin dashboard - prioritize deals
const { data: deals } = await supabase
  .from('orders')
  .select('*, seller:companies!seller_company_id(*)')
  .eq('status', 'pending');

// Calculate priority for each
const dealsWithPriority = await Promise.all(
  deals.map(async (deal) => {
    const { data: priority } = await supabase
      .rpc('calculate_deal_priority_score', {
        order_id_param: deal.id
      });
    return { ...deal, priority_score: priority };
  })
);

// Sort by priority (highest first)
const sortedDeals = dealsWithPriority.sort((a, b) => 
  b.priority_score - a.priority_score
);

// Show high-priority deals at top
// Low-trust deals automatically flagged for extra verification
```

---

## 🎯 UX RULES (NON-NEGOTIABLE)

### ✅ DO:
- Show "Recommended" badges
- Sort by rank score (best first)
- Use buyer-safe explanations ("verified trade history", "proven capacity")
- Show match tiers ("Excellent Match", "Good Match")
- Frame positively: "Top suppliers for your request"

### ❌ DON'T:
- Show numeric scores (45, 72, etc.) to buyers
- Say "low trust" or "poor match"
- Hide new suppliers (they still appear, just lower in list)
- Use negative language ("risky", "unverified")

---

## 🔒 GOVERNANCE & AUDITABILITY

### Admin Can Always:
1. **View full scores** at `/dashboard/admin/trust-engine`
2. **Override rankings** manually if needed
3. **See decision breakdown** in audit logs
4. **Adjust weightings** by updating functions

### Audit Trail Captures:
- Every score calculation
- Input parameters (trust, relevance, etc.)
- Timestamp and context
- For compliance reviews and debugging

---

## 📊 SCORE BREAKDOWN EXAMPLES

### Supplier Rank Score Example:
```
Supplier: "ABC Textiles" → Rank Score: 78.5

Components:
- Trust Score: 72 × 0.45 = 32.4
- Relevance: 85 × 0.25 = 21.25
  └─ Verified: +40
  └─ Profile complete: +20
  └─ Has logo: +10
  └─ Certifications: +15
- Responsiveness: 80 × 0.20 = 16.0
- Pricing: 50 × 0.10 = 5.0
────────────────────────────────
Total: 74.65 → Rounded: 74.7
Tier: B (but close to A)
Badge: "Recommended"
```

### RFQ Match Score Example:
```
RFQ: "100 tons cocoa beans" → Supplier: "Ghana Cocoa Ltd"

Match Score: 88.0

Components:
- Trust Score: 85 × 0.40 = 34.0
- Category Match: 100 × 0.30 = 30.0
  └─ Has products in cocoa category
- Capacity: 75 × 0.20 = 15.0
  └─ 50+ completed orders: +40
  └─ 50+ employees: +30
  └─ Verified: +30
  └─ Total: 100 (capped)
- Location: 100 × 0.10 = 10.0
  └─ Ghana → Ghana (same country)
────────────────────────────────
Total: 89.0
Tier: A
Badge: "Highly Recommended"
Match Badge: "Excellent Match"
```

### Deal Priority Score Example:
```
Order: $5,500 deal, created 4 days ago

Priority Score: 67.5

Components:
- Inverse Trust: (100 - 65) × 0.35 = 12.25
  └─ Seller trust: 65 (mid-level, some attention needed)
- Deal Value: 80 × 0.30 = 24.0
  └─ $5,500 → High value tier
- Urgency: 70 × 0.20 = 14.0
  └─ 4 days old → moderate urgency
- Complexity: 50 × 0.15 = 7.5
  └─ No disputes, standard deal
────────────────────────────────
Total: 57.75 → Rounded: 57.8
Priority: Medium-High
Admin Action: Monitor, verify if issues arise
```

---

## 🔧 INTEGRATION CHECKLIST

### Required Steps:
- [x] Database functions created
- [x] Frontend hooks created
- [x] Badge components created
- [x] Admin panel created
- [ ] Update supplier listing page to use `useSupplierRanking`
- [ ] Update RFQ matching page to use `useRFQMatching`
- [ ] Add admin route for `/dashboard/admin/trust-engine`
- [ ] Test with real data

---

## 🎯 WHAT THIS ACHIEVES

### For Buyers:
- ✅ See best suppliers first (without knowing why)
- ✅ Get "Recommended" suppliers for RFQs
- ✅ Trust the platform to filter quality

### For Suppliers:
- ✅ High-trust suppliers get more visibility
- ✅ Incentive to build good reputation
- ✅ Fair weighting (not just one metric)

### For Admins:
- ✅ High-risk deals flagged automatically
- ✅ Full transparency into scores
- ✅ Can override when needed

### For Afrikoni:
- ✅ **Defensible competitive advantage**
- ✅ Trust shapes market outcomes
- ✅ Foundation for AI-assisted matching

---

## 🚀 NEXT LEVEL (FUTURE)

Once this is stable, you can:
1. **Train ML models** on RFQ matching data
2. **Semi-automate matching** with human-in-the-loop
3. **Predict deal success** before it happens
4. **Dynamic pricing** based on trust tiers

But first: **implement this foundation**.

---

## 🏆 WHY THIS IS DEFENSIBLE

Anyone can copy:
- ❌ Listings
- ❌ Dashboards
- ❌ UI design

Almost no one can copy:
- ✅ **How trust shapes decisions**
- ✅ **Weighted multi-factor scoring**
- ✅ **Governance & audit trail**
- ✅ **User-invisible intelligence**

**You're building the rules of the market, not just the market.**

---

**Status:** 🟢 CORE ENGINE COMPLETE  
**Ready For:** Integration into supplier listings & RFQ matching  
**Philosophy:** Trust → Better Decisions → Scale

---

**Built with:** Structure → Trust → Intelligence 🧠

