# RFQ Matching Logic - Internal Documentation

**Last Updated:** January 20, 2025  
**Status:** FROZEN - Do not modify for 2-4 weeks

## Overview

The Afrikoni RFQ Matching System intelligently matches buyer requests (RFQs) with verified suppliers based on trust scores, reliability metrics, capacity, and relevance. This document explains the exact matching algorithm.

---

## 1. Matching Flow

```
RFQ Created → Admin Review → Manual Matching → Supplier Selection → Notification
```

### Current State: **Manual Matching with AI Suggestions**

- **Phase A (Active):** Admin manually selects suppliers from ranked list
- **Phase B (Dormant):** AI-suggested matches shown as recommendations (admin review required)

---

## 2. Supplier Ranking Algorithm

**Location:** `src/pages/dashboard/admin/rfq-matching.jsx`

### Step 1: Load Verified Suppliers

```javascript
// Only verified suppliers are eligible
SELECT * FROM companies 
WHERE verified = true
```

### Step 2: Load Reliability Data

```javascript
// Get reliability scores from supplier_intelligence view
SELECT 
  company_id,
  reliability_score,
  avg_response_hours,
  completion_rate,
  dispute_rate,
  slow_response_flag,
  high_dispute_flag
FROM supplier_intelligence
WHERE company_id IN (verified_supplier_ids)
```

### Step 3: Merge Data

Each supplier gets:
- Base company data (name, country, city, trust_score)
- Reliability metrics (reliability_score, flags)
- Combined score for ranking

### Step 4: Sort by Reliability

```javascript
// Primary sort: reliability_score (descending)
// Fallback: trust_score (descending)
suppliers.sort((a, b) => {
  const scoreA = b.reliability_score || b.trust_score || 0;
  const scoreB = a.reliability_score || a.trust_score || 0;
  return scoreA - scoreB;
});
```

**Result:** Suppliers with highest reliability appear first in matching interface.

---

## 3. AI Matching Suggestions (Phase B - Dormant)

**Location:** `src/hooks/useRFQMatching.js`**

### Match Score Calculation

When AI suggestions are enabled, each supplier gets a match score (0-100):

#### A. Reliability Score (40% weight)
- Direct use of `reliability_score` from `supplier_intelligence`
- Range: 0-100
- Weighted: `reliability_score * 0.40`

#### B. Category Relevance (30% weight)
- Does supplier have products in RFQ category?
- Yes: +30 points
- No: 0 points

#### C. Location Match (20% weight)
- Supplier country matches RFQ delivery location?
- Exact match: +20 points
- Same region: +10 points
- No match: 0 points

#### D. Capacity Match (10% weight)
- Supplier can handle RFQ quantity?
- Based on historical order sizes
- Yes: +10 points
- Partial: +5 points
- No: 0 points

### Match Score Formula

```
match_score = 
  (reliability_score * 0.40) +
  (category_relevance * 30) +
  (location_match * 20) +
  (capacity_match * 10)
```

### Match Tiers

- **Tier A (80-100):** Excellent match, high reliability
- **Tier B (60-79):** Good match, reliable supplier
- **Tier C (40-59):** Acceptable match, may need review
- **Below 40:** Not recommended

---

## 4. Manual Matching Process

### Admin Workflow

1. **Select RFQ** from pending list
2. **View Supplier List** (sorted by reliability)
3. **Review AI Suggestions** (if enabled, shown as recommendations)
4. **Select Suppliers** (checkbox selection)
5. **Add Internal Notes** (why these suppliers were chosen)
6. **Match** (creates notifications, updates RFQ status)

### Supplier Selection Criteria

Admins should consider:

1. **Reliability Score** (primary)
   - Prefer suppliers with 80+ reliability
   - Avoid suppliers with high dispute flags

2. **Response Time**
   - Prefer suppliers with <24 hour response time
   - Flag suppliers with slow_response_flag

3. **Capacity**
   - Can supplier handle RFQ quantity?
   - Check historical order sizes

4. **Location**
   - Proximity to delivery location
   - Shipping costs and logistics

5. **Category Expertise**
   - Supplier's product categories match RFQ?
   - Historical success in this category

---

## 5. Matching Notes (Internal)

**Purpose:** Institutional memory for quality control and future automation

Admins can add notes explaining matching decisions:
- "Supplier A has capacity for 500kg"
- "Supplier B has better pricing"
- "Supplier C is closer to destination"

**Storage:** `rfqs.matching_notes` field (internal only)

---

## 6. Risk-Based Filtering

### Automatic Exclusions

Suppliers are automatically pushed down (not excluded) if:

1. **High Dispute Flag**
   - `high_dispute_flag = true`
   - Still shown but ranked lower

2. **Slow Response Flag**
   - `slow_response_flag = true`
   - Still shown but ranked lower

3. **Low Reliability Score**
   - `reliability_score < 40`
   - Still shown but ranked lower

**Note:** We don't completely exclude suppliers - admin can still select them if needed.

---

## 7. Display in Matching Interface

### Supplier Card Shows

1. **Company Name**
2. **Location** (city, country)
3. **Verification Badge** (if verified)
4. **Reliability Badge** (color-coded: green/yellow/orange)
5. **Trust Score** (if available)
6. **AI Match Tier** (if AI suggestions enabled)

### Sorting Order

1. **Primary:** Reliability score (descending)
2. **Secondary:** Trust score (descending)
3. **Tertiary:** Verification status (verified first)

---

## 8. Notification Flow

After matching:

1. **RFQ Status Updated**
   - Status: `matched`
   - `matched_at` timestamp set
   - `matched_by` admin ID recorded

2. **Supplier Notifications**
   - Notification created for each matched supplier
   - Email sent (if enabled)
   - In-app notification shown

3. **Buyer Notification**
   - Buyer notified of match
   - Can view matched suppliers

---

## 9. Data Sources

### Tables Used
- `rfqs` - RFQ details, status, matching notes
- `companies` - Supplier information, trust scores
- `supplier_intelligence` - Reliability metrics
- `products` - Category matching
- `orders` - Historical capacity data
- `notifications` - Match notifications

### Views
- `supplier_intelligence` - Aggregated supplier metrics

---

## 10. Edge Cases

### No Verified Suppliers
- Show message: "No verified suppliers available"
- Suggest: Verify more suppliers or expand search

### All Suppliers Have Low Reliability
- Still show all suppliers
- Flag in UI: "All suppliers have reliability concerns"
- Admin can still match but should add notes

### RFQ Category Has No Suppliers
- Show suppliers from related categories
- Flag: "No exact category match"
- Admin can manually match if appropriate

---

## 11. Future Enhancements (NOT IN CURRENT VERSION)

These are planned but NOT implemented:

1. **Automatic Matching**
   - Auto-match RFQs to top suppliers
   - Requires approval workflow

2. **Machine Learning Scoring**
   - Historical success rate prediction
   - Buyer-seller compatibility scoring

3. **Multi-Supplier Matching**
   - Split large RFQs across multiple suppliers
   - Capacity optimization

4. **Real-time Availability**
   - Check supplier current capacity
   - Inventory-based matching

**DO NOT implement these without explicit approval.**

---

## 12. Testing & Validation

### Test Cases

1. **High Reliability Supplier**
   - Should appear first in list
   - Should have green reliability badge

2. **Low Reliability Supplier**
   - Should appear lower in list
   - Should have orange reliability badge

3. **Supplier with Disputes**
   - Should be flagged
   - Should still be selectable

4. **New Supplier (No Data)**
   - Should show default reliability
   - Should be ranked by trust_score

### Validation Queries

```sql
-- Check supplier ranking
SELECT 
  c.id,
  c.company_name,
  c.trust_score,
  si.reliability_score,
  si.slow_response_flag,
  si.high_dispute_flag
FROM companies c
LEFT JOIN supplier_intelligence si ON c.id = si.company_id
WHERE c.verified = true
ORDER BY 
  COALESCE(si.reliability_score, c.trust_score, 50) DESC
LIMIT 20;
```

---

## 13. Business Rules

### Matching Rules
1. Only verified suppliers can be matched
2. Admin must select at least 1 supplier
3. Matching notes are optional but recommended
4. Suppliers are ranked, not filtered

### Quality Control
1. All matches require admin review
2. Internal notes help with future automation
3. High-risk suppliers are flagged but not excluded

---

## 14. Contact & Questions

For questions about matching logic:
- **Technical:** Check `src/pages/dashboard/admin/rfq-matching.jsx`
- **AI Suggestions:** Check `src/hooks/useRFQMatching.js`
- **Business Logic:** This document

---

## 15. Admin Best Practices

### When Matching RFQs

1. **Always check reliability scores** - Prefer 80+ suppliers
2. **Review flags** - Pay attention to slow response and dispute flags
3. **Add notes** - Explain why suppliers were chosen
4. **Consider capacity** - Ensure suppliers can handle quantity
5. **Location matters** - Closer suppliers = better logistics

### Red Flags to Watch

- Reliability score < 40
- High dispute flag
- Slow response flag
- No historical orders
- No category match

---

**⚠️ IMPORTANT: This logic is FROZEN for 2-4 weeks. Any changes require approval.**

