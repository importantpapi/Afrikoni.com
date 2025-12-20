# Trust Score Calculation - Internal Documentation

**Last Updated:** January 20, 2025  
**Status:** FROZEN - Do not modify for 2-4 weeks

## Overview

The Afrikoni Trust & Reliability System calculates trust scores for suppliers based on real transaction data, response behavior, and dispute history. This document explains the exact calculation logic.

---

## 1. Supplier Reliability Score (0-100)

**Location:** `supplier_intelligence` database view

### Components

The reliability score is calculated from four weighted components:

#### A. Response Time Score (25% weight)
- **Metric:** Average response time in hours
- **Calculation:**
  - `avg_response_hours` = Average time between message sent and first response
  - Score: `100 - (avg_response_hours * 2)` capped at 0-100
  - **Flags:**
    - `slow_response_flag` = true if `avg_response_hours > 48`

#### B. Completion Rate (35% weight)
- **Metric:** Percentage of orders completed successfully
- **Calculation:**
  - `completion_rate` = (completed_orders / total_orders) * 100
  - Direct score: `completion_rate` (0-100)

#### C. Dispute Rate (30% weight)
- **Metric:** Percentage of orders that resulted in disputes
- **Calculation:**
  - `dispute_rate` = (disputes / total_orders) * 100
  - Score: `100 - (dispute_rate * 10)` capped at 0-100
  - **Flags:**
    - `high_dispute_flag` = true if `dispute_rate > 5%`

#### D. Delivery Performance (10% weight)
- **Metric:** On-time delivery rate
- **Calculation:**
  - Based on `delivery_delay_days` from orders
  - Score: `100 - (avg_delay_days * 5)` capped at 0-100

### Final Reliability Score Formula

```
reliability_score = 
  (response_time_score * 0.25) +
  (completion_rate * 0.35) +
  (dispute_rate_score * 0.30) +
  (delivery_performance * 0.10)
```

**Result:** 0-100 scale, where:
- **80-100:** High Reliability (Green badge)
- **60-79:** Good Reliability (Yellow badge)
- **0-59:** Needs Improvement (Orange badge)

---

## 2. Base Trust Score (Companies Table)

**Location:** `companies.trust_score` column

### Components

#### A. Verification Status (30 points)
- Verified company: +30 points
- Unverified: 0 points

#### B. Review Rating (40 points)
- Average review rating (1-5 stars) converted to 0-40 points
- Formula: `(avg_rating / 5) * 40`

#### C. Review Count (20 points)
- Based on number of approved reviews
- Formula: `min(20, (review_count / 10) * 20)`
- Caps at 20 points for 10+ reviews

#### D. Completed Deals (10 points)
- Based on number of completed orders
- Formula: `min(10, (completed_deals / 5) * 10)`
- Caps at 10 points for 5+ completed deals

### Final Base Trust Score

```
base_trust_score = 
  verification_bonus (0 or 30) +
  review_rating_score (0-40) +
  review_count_score (0-20) +
  completed_deals_score (0-10)
```

**Result:** 0-100 scale

---

## 3. Combined Trust Assessment

When displaying trust to users, we use:

1. **Primary:** `reliability_score` from `supplier_intelligence` (if available)
2. **Fallback:** `trust_score` from `companies` table
3. **Default:** 50 (neutral starting point)

---

## 4. Risk Flags

The system automatically flags suppliers with:

### Slow Response Flag
- Trigger: `avg_response_hours > 48`
- Impact: Visible warning badge in admin dashboard

### High Dispute Flag
- Trigger: `dispute_rate > 5%`
- Impact: Red warning badge, excluded from top recommendations

### Delivery Delay Flag
- Trigger: `avg_delivery_delay > 7 days`
- Impact: Orange warning badge

---

## 5. Data Sources

### Tables Used
- `companies` - Base company info, verification status
- `orders` - Order completion, disputes, delivery dates
- `conversations` - Message timestamps for response time
- `messages` - Individual message timestamps
- `reviews` - Review ratings and counts

### Views
- `supplier_intelligence` - Aggregated reliability metrics
- `trust_evolution` - Historical trust score tracking

---

## 6. Update Frequency

- **Real-time:** Trust scores update when new orders, reviews, or messages are created
- **View refresh:** `supplier_intelligence` view recalculates on each query
- **Caching:** Consider caching for high-traffic pages (future optimization)

---

## 7. Edge Cases

### New Suppliers (No Data)
- Default reliability score: 50
- Shown as "Needs Improvement" until data accumulates
- Requires minimum 3 orders for meaningful score

### Suppliers with Zero Orders
- Reliability score: N/A
- Base trust score: Based only on verification + reviews

### Suppliers with All Disputes
- Dispute rate: 100%
- Dispute score: 0
- Overall reliability: Severely penalized

---

## 8. Business Rules

### Minimum Data Requirements
- **Reliability Score:** Requires at least 1 order
- **Response Time:** Requires at least 1 conversation with response
- **Dispute Rate:** Requires at least 1 order

### Score Interpretation
- **80+:** Premium suppliers, prioritize in matching
- **60-79:** Good suppliers, standard matching
- **Below 60:** Flag for review, may need intervention

---

## 9. Future Enhancements (NOT IN CURRENT VERSION)

These are planned but NOT implemented:
- Seasonal adjustments
- Category-specific scoring
- Buyer feedback weighting
- Time-decay for old disputes

**DO NOT implement these without explicit approval.**

---

## 10. Testing & Validation

### Test Cases
1. New supplier (no data) → Should show 50/default
2. Perfect supplier (100% completion, fast response, no disputes) → Should show 80+
3. Problem supplier (slow response, high disputes) → Should show <60
4. Supplier with mixed performance → Should show weighted average

### Validation Queries

```sql
-- Check reliability score calculation
SELECT 
  company_id,
  company_name,
  reliability_score,
  avg_response_hours,
  completion_rate,
  dispute_rate,
  slow_response_flag,
  high_dispute_flag
FROM supplier_intelligence
ORDER BY reliability_score DESC
LIMIT 10;
```

---

## 11. Contact & Questions

For questions about trust score logic:
- **Technical:** Check `supabase/migrations/20250120000000_trade_intelligence_system.sql`
- **Business Logic:** This document
- **UI Display:** Check `src/components/intelligence/ReliabilityBadge.jsx`

---

**⚠️ IMPORTANT: This logic is FROZEN for 2-4 weeks. Any changes require approval.**

