-- ============================================================================
-- Afrikoni Trade Intelligence & Execution System
-- Simplified Views Compatible with Actual Schema
-- ============================================================================

-- ============================================================================
-- 1. BUYER & SUPPLIER INTELLIGENCE LAYER
-- ============================================================================

-- Buyer Segmentation View
CREATE OR REPLACE VIEW buyer_intelligence AS
SELECT 
  c.id AS company_id,
  c.company_name,
  c.country,
  c.role,
  c.verified,
  c.trust_score,
  
  -- RFQ Metrics
  COUNT(DISTINCT r.id) AS total_rfqs,
  COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) AS open_rfqs,
  COUNT(DISTINCT CASE WHEN r.status = 'closed' THEN r.id END) AS closed_rfqs,
  
  -- Conversation Metrics
  COUNT(DISTINCT conv.id) AS total_conversations,
  COUNT(DISTINCT CASE WHEN conv.last_message_at > NOW() - INTERVAL '30 days' THEN conv.id END) AS active_conversations,
  
  -- Deal Metrics
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
  
  -- Financial Metrics
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_deal_value,
  COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) AS avg_deal_value,
  
  -- Activity Metrics
  MAX(r.created_at) AS last_rfq_date,
  MAX(conv.last_message_at) AS last_conversation_date,
  MAX(o.created_at) AS last_order_date,
  GREATEST(
    COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp),
    COALESCE(MAX(o.created_at), '1970-01-01'::timestamp)
  ) AS last_activity_date,
  EXTRACT(EPOCH FROM (NOW() - GREATEST(
    COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp),
    COALESCE(MAX(o.created_at), '1970-01-01'::timestamp)
  ))) / 86400 AS days_since_last_activity,
  
  -- Buyer Segment Classification
  CASE
    WHEN COUNT(DISTINCT o.id) >= 5 AND COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) > 10000 THEN 'High-Value Buyer'
    WHEN COUNT(DISTINCT r.id) >= 3 AND COUNT(DISTINCT conv.id) >= 2 AND COUNT(DISTINCT o.id) >= 1 THEN 'Serious Buyer'
    WHEN EXTRACT(EPOCH FROM (NOW() - GREATEST(
      COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
      COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp),
      COALESCE(MAX(o.created_at), '1970-01-01'::timestamp)
    ))) / 86400 > 90 THEN 'Dormant'
    WHEN COUNT(DISTINCT r.id) < 2 AND COUNT(DISTINCT conv.id) < 1 THEN 'Low Activity'
    ELSE 'Active Buyer'
  END AS buyer_segment
  
FROM companies c
LEFT JOIN rfqs r ON r.buyer_company_id = c.id
LEFT JOIN conversations conv ON conv.buyer_company_id = c.id
LEFT JOIN orders o ON o.buyer_company_id = c.id
WHERE c.role IN ('buyer', 'hybrid')
GROUP BY c.id, c.company_name, c.country, c.role, c.verified, c.trust_score;

-- Supplier Intelligence View
CREATE OR REPLACE VIEW supplier_intelligence AS
SELECT 
  c.id AS company_id,
  c.company_name,
  c.country,
  c.role,
  c.verified,
  c.verification_status,
  c.trust_score,
  c.average_rating,
  c.approved_reviews_count,
  
  -- Response Time Metrics
  AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) AS avg_response_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) AS median_response_hours,
  COUNT(DISTINCT CASE WHEN EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600 <= 24 THEN q.id END) AS responses_within_24h,
  COUNT(DISTINCT q.id) AS total_quotes_submitted,
  
  -- Deal Completion Metrics
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::numeric / COUNT(DISTINCT o.id)::numeric) * 100
    ELSE 0
  END AS completion_rate,
  
  -- Dispute Metrics
  COUNT(DISTINCT d.id) AS total_disputes,
  COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) AS resolved_disputes,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 
    THEN (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) * 100
    ELSE 0
  END AS dispute_rate,
  
  -- Delivery Metrics
  COUNT(DISTINCT s.id) AS total_shipments,
  COUNT(DISTINCT CASE WHEN s.status = 'delivered' THEN s.id END) AS delivered_shipments,
  AVG(EXTRACT(EPOCH FROM (s.actual_delivery - s.created_at)) / 86400) AS avg_delivery_days,
  
  -- Activity Metrics
  MAX(r.created_at) AS last_rfq_response_date,
  MAX(o.created_at) AS last_order_date,
  MAX(s.created_at) AS last_shipment_date,
  
  -- Reliability Score Calculation (0-100)
  (
    -- Base score from trust_score (40% weight)
    (COALESCE(c.trust_score, 50) * 0.4) +
    -- Completion rate (30% weight)
    (CASE 
      WHEN COUNT(DISTINCT o.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::numeric / COUNT(DISTINCT o.id)::numeric) * 100 * 0.3
      ELSE 30
    END) +
    -- Response time score (20% weight) - faster is better
    (CASE 
      WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) IS NOT NULL
      THEN GREATEST(0, 100 - (AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) / 24 * 20)) * 0.2
      ELSE 20
    END) +
    -- Dispute penalty (10% weight)
    (CASE 
      WHEN COUNT(DISTINCT o.id) > 0 
      THEN GREATEST(0, 100 - ((COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) * 100 * 10)) * 0.1
      ELSE 10
    END)
  ) AS reliability_score,
  
  -- Supplier Flags
  CASE 
    WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 72 THEN true
    ELSE false
  END AS slow_response_flag,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.1 THEN true
    ELSE false
  END AS high_dispute_flag,
  CASE 
    WHEN MAX(r.created_at) < NOW() - INTERVAL '90 days' THEN true
    ELSE false
  END AS inactive_flag
  
FROM companies c
LEFT JOIN quotes q ON q.supplier_company_id = c.id
LEFT JOIN rfqs r ON r.id = q.rfq_id
LEFT JOIN orders o ON o.seller_company_id = c.id
LEFT JOIN disputes d ON (d.buyer_company_id = c.id OR d.seller_company_id = c.id)
LEFT JOIN shipments s ON s.order_id = o.id
WHERE c.role IN ('seller', 'hybrid')
GROUP BY c.id, c.company_name, c.country, c.role, c.verified, c.verification_status, 
         c.trust_score, c.average_rating, c.approved_reviews_count;

-- ============================================================================
-- 2. TRADE & REVENUE PERFORMANCE ENGINE
-- ============================================================================

-- Trade Performance View
CREATE OR REPLACE VIEW trade_performance AS
SELECT 
  DATE_TRUNC('day', o.created_at) AS trade_date,
  DATE_TRUNC('week', o.created_at) AS trade_week,
  DATE_TRUNC('month', o.created_at) AS trade_month,
  
  -- Funnel Metrics
  COUNT(DISTINCT r.id) AS rfqs_created,
  COUNT(DISTINCT conv.id) AS conversations_started,
  COUNT(DISTINCT o.id) AS deals_created,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS deals_completed,
  
  -- Conversion Rates
  CASE 
    WHEN COUNT(DISTINCT r.id) > 0 
    THEN (COUNT(DISTINCT conv.id)::numeric / COUNT(DISTINCT r.id)::numeric) * 100
    ELSE 0
  END AS rfq_to_conversation_rate,
  CASE 
    WHEN COUNT(DISTINCT conv.id) > 0 
    THEN (COUNT(DISTINCT o.id)::numeric / COUNT(DISTINCT conv.id)::numeric) * 100
    ELSE 0
  END AS conversation_to_deal_rate,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::numeric / COUNT(DISTINCT o.id)::numeric) * 100
    ELSE 0
  END AS deal_completion_rate,
  
  -- GMV & Revenue
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS gmv,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount * 0.05 ELSE 0 END), 0) AS commission_earned,
  COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) AS avg_deal_size,
  
  -- Category Breakdown
  COUNT(DISTINCT p.category_id) AS categories_traded,
  
  -- Country Breakdown
  COUNT(DISTINCT c_buyer.country) AS buyer_countries,
  COUNT(DISTINCT c_seller.country) AS seller_countries
  
FROM orders o
LEFT JOIN rfqs r ON r.id = o.rfq_id
LEFT JOIN conversations conv ON (conv.buyer_company_id = o.buyer_company_id AND conv.seller_company_id = o.seller_company_id)
LEFT JOIN products p ON p.id = o.product_id
LEFT JOIN companies c_buyer ON c_buyer.id = o.buyer_company_id
LEFT JOIN companies c_seller ON c_seller.id = o.seller_company_id
GROUP BY DATE_TRUNC('day', o.created_at), DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- Category Performance View
CREATE OR REPLACE VIEW category_performance AS
SELECT 
  cat.id AS category_id,
  cat.name AS category_name,
  
  -- RFQ Metrics
  COUNT(DISTINCT r.id) AS total_rfqs,
  COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) AS open_rfqs,
  
  -- Deal Metrics
  COUNT(DISTINCT o.id) AS total_deals,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_deals,
  
  -- GMV
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS gmv,
  COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) AS avg_deal_size,
  
  -- Conversion Rate
  CASE 
    WHEN COUNT(DISTINCT r.id) > 0 
    THEN (COUNT(DISTINCT o.id)::numeric / COUNT(DISTINCT r.id)::numeric) * 100
    ELSE 0
  END AS conversion_rate,
  
  -- Supplier Count
  COUNT(DISTINCT c_seller.id) AS active_suppliers,
  COUNT(DISTINCT p.id) AS total_products
  
FROM categories cat
LEFT JOIN rfqs r ON r.category_id = cat.id
LEFT JOIN products p ON p.category_id = cat.id
LEFT JOIN orders o ON o.product_id = p.id
LEFT JOIN companies c_seller ON c_seller.id = p.company_id
GROUP BY cat.id, cat.name;

-- ============================================================================
-- 3. MARKET DEMAND INTELLIGENCE LAYER
-- ============================================================================

-- Demand Intelligence View
CREATE OR REPLACE VIEW demand_intelligence AS
SELECT 
  r.category_id,
  cat.name AS category_name,
  r.buyer_company_id,
  c_buyer.country AS buyer_country,
  c_buyer.company_name AS buyer_company_name,
  
  -- RFQ Details
  r.id AS rfq_id,
  r.title AS rfq_title,
  r.quantity,
  COALESCE(r.target_price, (r.metadata->>'budget_max')::numeric, 0) AS budget,
  r.status,
  r.created_at AS rfq_created_at,
  
  -- Demand Signals
  CASE 
    WHEN r.status = 'open' AND r.created_at > NOW() - INTERVAL '30 days' THEN true
    ELSE false
  END AS recent_demand,
  CASE 
    WHEN COALESCE(r.target_price, (r.metadata->>'budget_max')::numeric, 0) > 10000 THEN 'High Value'
    WHEN COALESCE(r.target_price, (r.metadata->>'budget_max')::numeric, 0) > 5000 THEN 'Medium Value'
    ELSE 'Low Value'
  END AS demand_value_tier,
  
  -- Supplier Availability
  COUNT(DISTINCT p.id) AS available_products,
  COUNT(DISTINCT c_seller.id) AS available_suppliers,
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 THEN 'No Supply'
    WHEN COUNT(DISTINCT p.id) < 3 THEN 'Low Supply'
    WHEN COUNT(DISTINCT p.id) < 10 THEN 'Medium Supply'
    ELSE 'High Supply'
  END AS supply_status,
  
  -- Gap Analysis
  CASE 
    WHEN COUNT(DISTINCT p.id) = 0 AND r.status = 'open' THEN true
    ELSE false
  END AS supply_gap_flag
  
FROM rfqs r
LEFT JOIN categories cat ON cat.id = r.category_id
LEFT JOIN companies c_buyer ON c_buyer.id = r.buyer_company_id
LEFT JOIN products p ON p.category_id = r.category_id AND p.status = 'active'
LEFT JOIN companies c_seller ON c_seller.id = p.company_id AND c_seller.verified = true
GROUP BY r.id, r.category_id, cat.name, r.buyer_company_id, c_buyer.country, 
         c_buyer.company_name, r.title, r.quantity, r.target_price, r.metadata, r.status, r.created_at;

-- Demand Trends View
CREATE OR REPLACE VIEW demand_trends AS
SELECT 
  DATE_TRUNC('month', r.created_at) AS demand_month,
  r.category_id,
  cat.name AS category_name,
  c_buyer.country AS buyer_country,
  
  COUNT(DISTINCT r.id) AS rfqs_count,
  SUM(r.quantity) AS total_quantity_demanded,
  SUM(COALESCE(r.target_price, (r.metadata->>'budget_max')::numeric, 0)) AS total_budget_demanded,
  AVG(COALESCE(r.target_price, (r.metadata->>'budget_max')::numeric, 0)) AS avg_budget,
  
  EXTRACT(YEAR FROM r.created_at) AS demand_year,
  EXTRACT(MONTH FROM r.created_at) AS demand_month_num
  
FROM rfqs r
LEFT JOIN categories cat ON cat.id = r.category_id
LEFT JOIN companies c_buyer ON c_buyer.id = r.buyer_company_id
GROUP BY DATE_TRUNC('month', r.created_at), r.category_id, cat.name, c_buyer.country,
         EXTRACT(YEAR FROM r.created_at), EXTRACT(MONTH FROM r.created_at);

-- ============================================================================
-- 4. OPERATIONS, RISK & TRUST CONTROL LAYER
-- ============================================================================

-- Risk Signals View (simplified)
CREATE OR REPLACE VIEW risk_signals AS
SELECT 
  c.id AS company_id,
  c.company_name,
  c.role,
  c.country,
  c.trust_score,
  
  -- Response Delay Risk
  AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) AS avg_response_hours,
  CASE 
    WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 72 THEN 'High'
    WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 48 THEN 'Medium'
    ELSE 'Low'
  END AS response_delay_risk,
  
  -- Dispute Risk
  COUNT(DISTINCT d.id) AS total_disputes,
  COUNT(DISTINCT CASE WHEN d.status = 'open' THEN d.id END) AS open_disputes,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.2 THEN 'High'
    WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.1 THEN 'Medium'
    ELSE 'Low'
  END AS dispute_risk,
  
  -- Abandoned Conversation Risk (simplified - conversations without orders)
  COUNT(DISTINCT CASE 
    WHEN conv.last_message_at < NOW() - INTERVAL '14 days' 
    AND conv.last_message_at > NOW() - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM orders o2 
      WHERE (o2.buyer_company_id = conv.buyer_company_id AND o2.seller_company_id = conv.seller_company_id)
      OR (o2.buyer_company_id = conv.seller_company_id AND o2.seller_company_id = conv.buyer_company_id)
    )
    THEN conv.id
  END) AS abandoned_conversations,
  CASE 
    WHEN COUNT(DISTINCT conv.id) > 0 AND 
         (COUNT(DISTINCT CASE 
           WHEN conv.last_message_at < NOW() - INTERVAL '14 days' 
           AND conv.last_message_at > NOW() - INTERVAL '90 days'
           AND NOT EXISTS (
             SELECT 1 FROM orders o2 
             WHERE (o2.buyer_company_id = conv.buyer_company_id AND o2.seller_company_id = conv.seller_company_id)
             OR (o2.buyer_company_id = conv.seller_company_id AND o2.seller_company_id = conv.buyer_company_id)
           )
           THEN conv.id
         END)::numeric / COUNT(DISTINCT conv.id)::numeric) > 0.3 THEN 'High'
    WHEN COUNT(DISTINCT conv.id) > 0 AND 
         (COUNT(DISTINCT CASE 
           WHEN conv.last_message_at < NOW() - INTERVAL '14 days' 
           AND conv.last_message_at > NOW() - INTERVAL '90 days'
           AND NOT EXISTS (
             SELECT 1 FROM orders o2 
             WHERE (o2.buyer_company_id = conv.buyer_company_id AND o2.seller_company_id = conv.seller_company_id)
             OR (o2.buyer_company_id = conv.seller_company_id AND o2.seller_company_id = conv.buyer_company_id)
           )
           THEN conv.id
         END)::numeric / COUNT(DISTINCT conv.id)::numeric) > 0.15 THEN 'Medium'
    ELSE 'Low'
  END AS abandonment_risk,
  
  -- Stuck Deal Risk
  COUNT(DISTINCT CASE 
    WHEN o.status IN ('processing', 'shipped') 
    AND o.updated_at < NOW() - INTERVAL '30 days'
    THEN o.id
  END) AS stuck_deals,
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 AND 
         (COUNT(DISTINCT CASE 
           WHEN o.status IN ('processing', 'shipped') 
           AND o.updated_at < NOW() - INTERVAL '30 days'
           THEN o.id
         END)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.2 THEN 'High'
    WHEN COUNT(DISTINCT o.id) > 0 AND 
         (COUNT(DISTINCT CASE 
           WHEN o.status IN ('processing', 'shipped') 
           AND o.updated_at < NOW() - INTERVAL '30 days'
           THEN o.id
         END)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.1 THEN 'Medium'
    ELSE 'Low'
  END AS stuck_deal_risk,
  
  -- Overall Risk Level (simplified scoring)
  CASE 
    WHEN (
      CASE WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 72 THEN 3 
           WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 48 THEN 2 
           ELSE 1 END +
      CASE WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.2 THEN 3 
           WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.1 THEN 2 
           ELSE 1 END
    ) >= 5 THEN 'High'
    WHEN (
      CASE WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 72 THEN 3 
           WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) > 48 THEN 2 
           ELSE 1 END +
      CASE WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.2 THEN 3 
           WHEN COUNT(DISTINCT o.id) > 0 AND (COUNT(DISTINCT d.id)::numeric / COUNT(DISTINCT o.id)::numeric) > 0.1 THEN 2 
           ELSE 1 END
    ) >= 3 THEN 'Medium'
    ELSE 'Low'
  END AS overall_risk_level,
  
  COUNT(DISTINCT CASE WHEN o.total_amount > 10000 THEN o.id END) AS high_value_deals,
  
  GREATEST(
    COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp),
    COALESCE(MAX(o.created_at), '1970-01-01'::timestamp)
  ) AS last_activity_date
  
FROM companies c
LEFT JOIN quotes q ON q.supplier_company_id = c.id
LEFT JOIN rfqs r ON r.id = q.rfq_id
LEFT JOIN orders o ON (o.buyer_company_id = c.id OR o.seller_company_id = c.id)
LEFT JOIN disputes d ON (d.buyer_company_id = c.id OR d.seller_company_id = c.id)
LEFT JOIN conversations conv ON (conv.buyer_company_id = c.id OR conv.seller_company_id = c.id)
GROUP BY c.id, c.company_name, c.role, c.country, c.trust_score;

-- Trust Evolution View
CREATE OR REPLACE VIEW trust_evolution AS
SELECT 
  c.id AS company_id,
  c.company_name,
  c.trust_score AS current_trust_score,
  c.verified,
  c.average_rating,
  c.approved_reviews_count,
  
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_deals,
  COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) AS resolved_disputes,
  COUNT(DISTINCT rev.id) AS total_reviews,
  AVG(rev.rating) AS avg_review_rating
  
FROM companies c
LEFT JOIN orders o ON (o.buyer_company_id = c.id OR o.seller_company_id = c.id)
LEFT JOIN disputes d ON (d.buyer_company_id = c.id OR d.seller_company_id = c.id)
LEFT JOIN reviews rev ON (rev.buyer_company_id = c.id OR rev.seller_company_id = c.id)
GROUP BY c.id, c.company_name, c.trust_score, c.verified, c.average_rating, c.approved_reviews_count;

-- ============================================================================
-- GRANTS & INDEXES
-- ============================================================================

GRANT SELECT ON buyer_intelligence TO authenticated;
GRANT SELECT ON supplier_intelligence TO authenticated;
GRANT SELECT ON trade_performance TO authenticated;
GRANT SELECT ON category_performance TO authenticated;
GRANT SELECT ON demand_intelligence TO authenticated;
GRANT SELECT ON demand_trends TO authenticated;
GRANT SELECT ON risk_signals TO authenticated;
GRANT SELECT ON trust_evolution TO authenticated;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_buyer_intelligence_company_id ON companies(id) WHERE role IN ('buyer', 'hybrid');
CREATE INDEX IF NOT EXISTS idx_supplier_intelligence_company_id ON companies(id) WHERE role IN ('seller', 'hybrid');
CREATE INDEX IF NOT EXISTS idx_trade_performance_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_demand_intelligence_rfqs ON rfqs(category_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_risk_signals_disputes ON disputes(buyer_company_id, seller_company_id, status);

COMMENT ON VIEW buyer_intelligence IS 'Buyer segmentation and intelligence metrics';
COMMENT ON VIEW supplier_intelligence IS 'Supplier reliability and performance metrics';
COMMENT ON VIEW trade_performance IS 'Trade volume, GMV, and conversion funnel metrics';
COMMENT ON VIEW category_performance IS 'Performance metrics by product category';
COMMENT ON VIEW demand_intelligence IS 'Market demand analysis and supply gap detection';
COMMENT ON VIEW demand_trends IS 'Seasonal demand patterns and trends';
COMMENT ON VIEW risk_signals IS 'Risk assessment and flagging for companies';
COMMENT ON VIEW trust_evolution IS 'Trust score components and evolution tracking';

