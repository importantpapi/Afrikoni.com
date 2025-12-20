# How Afrikoni Decides - System Overview

**For:** Investors, Partners, Agencies  
**Last Updated:** January 20, 2025  
**Status:** Production Ready

---

## Executive Summary

Afrikoni uses a data-driven Trade Intelligence & Execution System to make trust-based decisions about supplier matching, risk assessment, and marketplace operations. This system moves Afrikoni from a basic marketplace to a **data-driven platform** that improves trust, matching quality, deal success, and risk management.

---

## 1. Trust & Reliability Scoring

### How We Calculate Trust

Every supplier on Afrikoni receives a **Reliability Score (0-100)** based on real transaction data:

#### Components (Weighted)

1. **Response Time (25%)**
   - How quickly suppliers respond to buyer inquiries
   - Average response time in hours
   - Suppliers with <24 hour response get highest scores

2. **Completion Rate (35%)**
   - Percentage of orders completed successfully
   - Direct measure of supplier reliability
   - 100% completion = perfect score

3. **Dispute Rate (30%)**
   - Percentage of orders that resulted in disputes
   - Lower is better
   - Suppliers with >5% disputes are flagged

4. **Delivery Performance (10%)**
   - On-time delivery rate
   - Based on actual delivery dates vs. promised dates

### Score Interpretation

- **80-100:** High Reliability (Green badge) - Premium suppliers
- **60-79:** Good Reliability (Yellow badge) - Standard suppliers
- **0-59:** Needs Improvement (Orange badge) - Flagged for review

### Base Trust Score

Additionally, suppliers have a **Base Trust Score** based on:
- Verification status (30 points)
- Review ratings (40 points)
- Review count (20 points)
- Completed deals (10 points)

**Result:** Suppliers are ranked by reliability, not just popularity.

---

## 2. Intelligent RFQ Matching

### How We Match Buyers to Suppliers

When a buyer creates an RFQ (Request for Quotation), Afrikoni's system:

#### Step 1: Load Verified Suppliers
- Only verified suppliers are eligible
- Ensures quality and trust

#### Step 2: Calculate Reliability Scores
- Pulls real-time reliability data
- Includes response time, completion rate, disputes

#### Step 3: Rank Suppliers
- Suppliers sorted by reliability score (highest first)
- High-reliability suppliers appear at top
- Risk-flagged suppliers pushed down

#### Step 4: Admin Review
- Admin reviews ranked list
- Can see reliability badges and risk flags
- Makes informed matching decision

#### Step 5: AI Suggestions (Phase B - Dormant)
- Future: AI will suggest matches based on:
  - Reliability score (40%)
  - Category relevance (30%)
  - Location match (20%)
  - Capacity match (10%)

### Matching Criteria

Admins consider:
1. **Reliability Score** (primary) - Prefer 80+
2. **Response Time** - Prefer <24 hours
3. **Capacity** - Can handle RFQ quantity?
4. **Location** - Proximity to delivery destination
5. **Category Expertise** - Historical success in category

**Result:** Buyers get matched with the most reliable suppliers, not just the cheapest.

---

## 3. Risk Control & Monitoring

### How We Identify Risk

The system automatically flags suppliers and deals with risk signals:

#### Risk Levels

1. **High Risk**
   - Multiple disputes (>5% dispute rate)
   - Slow response times (>48 hours)
   - Abandoned conversations
   - Stuck deals (no progress)

2. **Medium Risk**
   - Occasional delays
   - Some disputes
   - Inconsistent response times

3. **Low Risk**
   - Reliable performance
   - Fast responses
   - High completion rate

### Risk Signals Tracked

- **Response Delay Risk** - Suppliers taking too long to respond
- **Dispute Risk** - Suppliers with high dispute rates
- **Abandoned Conversations** - Buyers/suppliers not engaging
- **Stuck Deals** - Orders not progressing
- **High-Value Deal Alerts** - Large deals needing attention

### Admin Dashboard

Admins see:
- Real-time risk alerts
- High-risk supplier list
- High-value deals needing attention
- Risk breakdown by level

**Result:** Problems are caught early, before they become major issues.

---

## 4. Market Demand Intelligence

### How We Understand Market Needs

The system analyzes RFQ data to identify:

#### Demand Patterns

1. **Top Categories**
   - Most requested products/services
   - Budget by category
   - Countries with highest demand

2. **Supply Gaps**
   - Categories with high buyer demand but low supplier availability
   - Identifies: "We need more suppliers in category X, country Y"
   - Actionable insights for supplier recruitment

3. **Trending Demand**
   - Categories with increasing demand
   - Seasonal patterns
   - Regional trends

### Use Cases

1. **Supplier Recruitment**
   - Know exactly which categories/countries need suppliers
   - Targeted outreach: "We have X buyers waiting for Y in Z country"

2. **Market Insights**
   - Understand what buyers want
   - Identify growth opportunities
   - Plan inventory and capacity

**Result:** Data-driven decisions about where to grow the marketplace.

---

## 5. Trade Performance Tracking

### How We Measure Success

The system tracks the complete trade funnel:

#### Conversion Funnel

```
RFQs Created → Conversations Started → Deals Created → Completed Deals
```

**Metrics Tracked:**
- RFQ to Conversation rate
- Conversation to Deal rate
- Deal Completion rate

#### Financial Metrics

- **GMV (Gross Merchandise Value)** - Total transaction value
- **Commission Earned** - Platform revenue (2% of GMV)
- **Average Deal Size** - Typical transaction value
- **Category Performance** - GMV by category
- **Country Performance** - GMV by country

### Dashboards

1. **Admin Dashboard**
   - Full visibility into all metrics
   - Daily/weekly/monthly views
   - Top categories, countries, suppliers

2. **Seller Dashboard**
   - Own performance metrics
   - Reliability score
   - Trust evolution over time

3. **Buyer Dashboard**
   - Buyer segment classification
   - Activity metrics
   - Deal value tracking

**Result:** Clear visibility into what's working and what needs improvement.

---

## 6. Buyer Segmentation

### How We Classify Buyers

Buyers are automatically segmented based on behavior:

#### Segments

1. **High-Value Buyers**
   - Large deal volumes
   - High total spend
   - Frequent transactions

2. **Serious Buyers**
   - Active RFQs
   - Engaged in conversations
   - Likely to convert

3. **Active Buyers**
   - Regular activity
   - Moderate engagement
   - Some conversions

4. **Low Activity Buyers**
   - Minimal engagement
   - Few RFQs
   - Low conversion

5. **Dormant Buyers**
   - No recent activity
   - May need re-engagement

### Use Cases

- **Targeted Marketing** - Different messages for different segments
- **Resource Allocation** - Focus on high-value buyers
- **Re-engagement** - Reach out to dormant buyers

**Result:** Better understanding of buyer behavior and needs.

---

## 7. System Architecture

### Data Sources

- **Real Transaction Data** - Orders, conversations, messages
- **User Behavior** - RFQs, responses, engagement
- **Reviews & Ratings** - Buyer feedback
- **Verification Data** - KYC/KYB status

### Technology Stack

- **Database:** PostgreSQL (Supabase)
- **Views:** Materialized intelligence views
- **Frontend:** React with custom hooks
- **Real-time:** Supabase subscriptions (future)

### Data Flow

```
Raw Data → Database Views → React Hooks → UI Components → User Decisions
```

**Result:** Clean separation of concerns, maintainable, scalable.

---

## 8. Key Differentiators

### What Makes Afrikoni Different

1. **Data-Driven, Not Just Reviews**
   - Real transaction data, not just ratings
   - Objective metrics, not subjective opinions

2. **Proactive Risk Management**
   - Flags problems before they escalate
   - Protects both buyers and suppliers

3. **Intelligent Matching**
   - Reliability-based, not just price-based
   - Better matches = higher success rates

4. **Market Intelligence**
   - Knows what buyers want
   - Identifies supply gaps
   - Guides growth strategy

5. **Transparent Trust**
   - Suppliers see their scores
   - Buyers see supplier reliability
   - Everyone knows where they stand

---

## 9. Business Impact

### Measurable Outcomes

1. **Improved Matching Quality**
   - Suppliers ranked by reliability
   - Better buyer-supplier matches
   - Higher deal success rates

2. **Reduced Risk**
   - Early problem detection
   - Flagged suppliers identified
   - Protected transactions

3. **Increased Trust**
   - Transparent scoring
   - Verified suppliers prioritized
   - Buyers make informed decisions

4. **Data-Driven Growth**
   - Know where to recruit suppliers
   - Understand market demand
   - Make informed decisions

---

## 10. Future Roadmap

### Planned Enhancements (Not Yet Implemented)

1. **Automatic Matching**
   - AI-powered auto-matching
   - Reduces admin workload
   - Faster response times

2. **Machine Learning**
   - Predictive success scoring
   - Buyer-seller compatibility
   - Demand forecasting

3. **Real-time Updates**
   - Live score updates
   - Instant risk alerts
   - Real-time dashboards

4. **Advanced Analytics**
   - Seasonal pattern detection
   - Category-specific scoring
   - Time-decay for old data

---

## 11. Compliance & Security

### Data Privacy

- **RLS (Row Level Security)** - Users only see their own data
- **Admin-Only Views** - Sensitive data restricted to admins
- **Audit Logs** - All changes tracked

### Trust & Safety

- **Verified Suppliers Only** - Matching requires verification
- **Risk Flags** - Automatic problem detection
- **Manual Review** - High-risk items reviewed by humans

---

## 12. Conclusion

Afrikoni's Trade Intelligence & Execution System transforms the marketplace from a simple listing platform into a **data-driven decision engine** that:

- ✅ Improves trust through transparent scoring
- ✅ Enhances matching quality through reliability-based ranking
- ✅ Reduces risk through proactive monitoring
- ✅ Increases deal success through better matches
- ✅ Guides growth through market intelligence

**This is not just a feature - it's a competitive advantage.**

---

## Contact

For questions about the system:
- **Technical Documentation:** See `docs/` folder
- **Business Questions:** Contact Afrikoni team
- **Demo Requests:** Available upon request

---

**Last Updated:** January 20, 2025  
**Version:** 1.0 (Frozen for 2-4 weeks)

