# 🎯 AFRIKONI TRUST ENGINE — PHASE ACTIVATION GUIDE

**Status:** Phase A Active | Phase B Dormant | Phase C Inactive  
**Philosophy:** Build infrastructure like a regulator, not a marketer  
**Last Updated:** Dec 18, 2025

---

## 📊 CURRENT ACTIVATION STATUS

| Phase | Layer | Status | Buyer Visible | Admin Visible | Auto Actions |
|-------|-------|--------|---------------|---------------|--------------|
| **A** | Supplier Listings | ✅ **ACTIVE** | Yes (rankings only) | Yes (full data) | Ranking only |
| **B** | RFQ Matching | 🧊 **DORMANT** | No | Yes (scores/tiers) | None |
| **C** | Deal Prioritization | ⏸️ **INACTIVE** | No | Code ready | None |

---

## ✅ PHASE A: ACTIVE NOW (BUYER-FACING)

### What's Live

1. **Supplier Listings** (`/suppliers`)
   - Suppliers ranked by `rank_score`
   - "Recommended" badges for top 6 suppliers
   - Tooltip: "Recommended based on verified trade history, relevance, and responsiveness."

2. **Admin Trust Dashboard** (`/dashboard/admin/trust-engine`)
   - Full visibility into trust scores
   - Supplier tiers (A/B/C)
   - Rank scores
   - Review counts

### What's NOT Exposed

❌ Numeric trust scores  
❌ Tier labels (A/B/C) to buyers  
❌ Match scores  
❌ Priority scores  

### Files Changed

- `/src/pages/suppliers.jsx` — Integrated `useSupplierRanking` hook
- `/src/hooks/useSupplierRanking.js` — Trust-based ranking with safety checks
- `/src/components/suppliers/RecommendedBadge.jsx` — Badge UI component
- `/src/utils/trustSafety.js` — Safety utilities for missing data
- `/src/App.jsx` — Trust engine route added
- `/src/layouts/DashboardLayout.jsx` — Admin sidebar link added

### Safety Guarantees

✅ New suppliers always visible (just ranked lower)  
✅ Missing trust data = default to neutral (score 50)  
✅ RPC errors don't break supplier listings  
✅ No user blocked by trust engine  

### How It Feels to Buyers

- **Calm** — No aggressive gamification
- **Fair** — New suppliers still appear
- **Invisible** — Trust works in the background
- **Defensible** — "Recommended" implies governance

---

## 🧊 PHASE B: DORMANT (ADMIN-ONLY)

### What's Implemented

1. **RFQ Matching Hook** (`/src/hooks/useRFQMatching.js`)
   - Computes match scores (0-100)
   - Assigns tiers (A/B/C)
   - Provides match confidence
   - Lists match reasons

2. **Admin RFQ Matching Page** (`/dashboard/admin/rfq-matching`)
   - Shows suggested suppliers for RFQs
   - Displays match scores (admin-only)
   - Allows manual reordering
   - Logs matching decisions

### Why It's Dormant

- **Not enough RFQ volume** to validate matching quality
- **Manual override required** before any buyer sees results
- **Observing accuracy** before exposing to buyers

### When to Activate

Activate Phase B when:
1. ✅ 50+ RFQs processed manually
2. ✅ Admin match accuracy >= 80%
3. ✅ Manual overrides < 20%
4. ✅ No supplier complaints about fairness

### How to Activate

**Step 1:** Add match scores to buyer RFQ results (behind a feature flag)

```javascript
// In /src/pages/dashboard/rfqs.jsx
const { matches } = useRFQMatching(rfq.id, allSuppliers);

// Show to buyer (no scores, just ordering)
const sortedSuppliers = matches.map(m => m.supplier);
```

**Step 2:** A/B test with 10% of buyers

**Step 3:** Monitor:
- Buyer conversion rate
- Supplier response rate
- Dispute rate

**Step 4:** If metrics improve, roll out to 100%

---

## ⏸️ PHASE C: INACTIVE (OPS LAYER)

### What's Prepared

1. **Deal Prioritization Hook** (`/src/hooks/useDealPrioritization.js`)
   - Computes priority scores (0-100)
   - Flags high-risk deals
   - Marks deals requiring extra verification

### Why It's Inactive

- **Not enough deal volume** yet
- **No ops team** to act on priorities
- **Risk of premature automation**

### When to Activate

Activate Phase C when:
1. ✅ 100+ assisted deals per month
2. ✅ Dedicated ops team exists
3. ✅ Clear SLA definitions
4. ✅ Dispute resolution process tested

### How to Activate

**Step 1:** Enable in admin deal queue

```javascript
// In /src/pages/dashboard/admin/deals.jsx
const { prioritizedDeals } = useDealPrioritization(allDeals);

// Sort admin queue by priority
const sortedQueue = prioritizedDeals;
```

**Step 2:** Train ops team on risk flags

**Step 3:** Monitor:
- Deal processing time
- Dispute rate
- False positive rate on risk flags

**Step 4:** Adjust thresholds based on outcomes

---

## 🛡️ GOVERNANCE RULES (NON-NEGOTIABLE)

1. **Trust biases decisions, never blocks access**
   - Low-trust suppliers still visible
   - Low-trust buyers still transact (with extra checks)

2. **Trust scores never shown to buyers**
   - Only qualitative badges ("Recommended")
   - No numeric scores or tiers in buyer UI

3. **New suppliers always visible**
   - Default rank score: 50 (neutral)
   - Can rise quickly with verified trades

4. **Manual admin override always wins**
   - Admin can reorder any list
   - Admin can approve any match
   - Admin can waive any flag

5. **All decisions auditable**
   - Every ranking logged to `decision_audit_log`
   - Includes factors, score, outcome
   - Queryable for compliance

---

## 🧪 ACCEPTANCE TESTS

### Phase A Tests (Run Now)

1. **New Supplier Visibility**
   ```
   Create supplier with trust_score = NULL
   → Should appear in listings (rank_score = 0)
   → Should NOT have "Recommended" badge
   ```

2. **Recommended Badge Logic**
   ```
   Supplier with trust_score = 75
   → Should appear in top 6
   → Should have "Recommended" badge
   → Tooltip should match spec
   ```

3. **RPC Failure Handling**
   ```
   Simulate calculate_supplier_rank_score failure
   → Listings should still load
   → Supplier should use fallback rank (trust_score)
   → No error shown to buyer
   ```

4. **Admin Dashboard Access**
   ```
   Navigate to /dashboard/admin/trust-engine
   → Should load without errors
   → Should show tiers, scores, counts
   → Should be admin-only
   ```

### Phase B Tests (Before Activation)

1. **Match Score Accuracy**
   ```
   Run 10 test RFQs
   → Compare AI matches to admin manual selection
   → Accuracy should be >= 80%
   ```

2. **Admin Override**
   ```
   Admin reorders suggested suppliers
   → Order should persist
   → Logged to decision_audit_log
   ```

### Phase C Tests (Before Activation)

1. **Priority Flagging**
   ```
   Create high-value, low-trust deal
   → Should flag "requires extra verification"
   → Should appear at top of admin queue
   ```

---

## 📈 SUCCESS METRICS

### Phase A (Current)

- **Buyer experience:** No friction added
- **Supplier complaints:** 0 related to unfair ranking
- **Admin confidence:** Can explain any ranking
- **System uptime:** 99.9% (failures degrade gracefully)

### Phase B (When Active)

- **Match acceptance rate:** >= 70% of admin-approved matches convert
- **Buyer satisfaction:** RFQ response time < 24 hours
- **Supplier response rate:** >= 60% of matched suppliers respond

### Phase C (When Active)

- **Deal processing time:** 20% faster for flagged high-priority deals
- **Dispute rate:** < 5% for extra-verified deals
- **False positive rate:** < 10% of flagged deals are false alarms

---

## 🚨 ROLLBACK PROCEDURES

### If Phase A Causes Issues

1. **Quick rollback:**
   ```javascript
   // In /src/pages/suppliers.jsx
   // Comment out trust ranking
   // const { rankedSuppliers } = useSupplierRanking(suppliers);
   const rankedSuppliers = suppliers; // Fallback to unranked
   ```

2. **Investigation:**
   - Check `decision_audit_log` for patterns
   - Interview affected suppliers
   - Review admin feedback

3. **Fix and redeploy**

### If Phase B Shows Low Accuracy

1. **Increase human oversight:**
   - Require admin approval for all matches
   - Log manual overrides
   - Analyze discrepancies

2. **Retrain model:**
   - Use manual overrides as training data
   - Adjust weighting factors
   - Re-test on historical RFQs

---

## 🔒 SECURITY & COMPLIANCE

### Data Privacy

- Trust scores stored in `companies.trust_score`
- Rank scores computed on-demand (not stored)
- Match scores stored in `rfq_matches` (admin-only)
- Priority scores computed on-demand (not stored)
- All decision factors logged (GDPR-compliant)

### Access Control

- **Buyers:** See ranked lists, no scores
- **Sellers:** See own trust score, not others'
- **Admins:** See everything
- **RLS policies:** Enforce at database level

### Audit Trail

- All trust decisions logged to `decision_audit_log`
- Includes: type, entity, score, factors, outcome, admin override
- Retention: 7 years (regulatory compliance)
- Queryable for disputes or investigations

---

## 📚 TECHNICAL REFERENCE

### Database Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `calculate_trust_score` | Weighted trust score (0-100) | ✅ Active |
| `calculate_supplier_rank_score` | Search + location boost | ✅ Active |
| `get_supplier_tier` | A/B/C classification | ✅ Active (admin-only) |
| `calculate_rfq_match_score` | RFQ-supplier matching | 🧊 Exists, unused by buyers |
| `calculate_deal_priority_score` | Deal risk prioritization | ⏸️ Exists, not operationalized |

### Hooks

| Hook | Purpose | Used By |
|------|---------|---------|
| `useSupplierRanking` | Rank suppliers by trust | `/suppliers` (buyer) |
| `useRFQMatching` | Match RFQs to suppliers | `/dashboard/admin/rfq-matching` (admin) |
| `useDealPrioritization` | Prioritize deals by risk | Not yet integrated |

### Safety Utilities

| Function | Purpose |
|----------|---------|
| `safeTrustScore` | Fallback for missing trust_score |
| `safeRankScore` | Fallback for missing rank_score |
| `isRecommended` | Compute "Recommended" badge logic |
| `ensureTrustFields` | Fill defaults for all trust fields |
| `isTrustEngineReady` | Health check for DB functions |

---

## 🎓 PHILOSOPHY RECAP

**This system is not a growth hack.**

It's institutional infrastructure for B2B trust.

Every decision must be:
- **Calm** — No gamification or urgency
- **Fair** — New suppliers always have a path up
- **Invisible** — Trust works in background
- **Defensible** — Every decision auditable

**Build it like a regulator.**

Not like a marketer.

---

## ✅ FINAL CHECKLIST BEFORE PRODUCTION

- [x] Phase A activated in `/suppliers`
- [x] "Recommended" badges show for top 6
- [x] Admin trust dashboard accessible
- [x] Safety checks prevent broken listings
- [x] Phase B implemented but dormant
- [x] Phase C prepared but inactive
- [x] All governance rules enforced
- [x] Audit logging enabled
- [x] Rollback procedure documented
- [ ] Acceptance tests run successfully
- [ ] Team trained on admin dashboard
- [ ] Supplier communication prepared (transparency)

---

## 📞 ACTIVATION AUTHORITY

| Phase | Who Can Activate | Approval Required |
|-------|------------------|-------------------|
| A | Engineering Lead | ✅ CEO + CTO |
| B | Product Lead | CEO + Operations Lead |
| C | Operations Lead | CEO + Legal + Operations |

---

**Document Owner:** Engineering  
**Review Cycle:** Every 3 months or after 500 new suppliers  
**Next Review:** March 2026

