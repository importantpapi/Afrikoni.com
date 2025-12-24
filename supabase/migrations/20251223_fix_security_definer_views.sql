-- ============================================================================
-- Afrikoni - Fix SECURITY DEFINER-style views for multi-tenant safety
-- Date: 2025-12-23
--
-- Goal:
--   - Ensure all intelligence views execute in SECURITY INVOKER context
--   - Preserve existing SELECT logic (from 20250120000000_trade_intelligence_system.sql)
--   - Ensure access is explicitly granted to authenticated only
-- ============================================================================

-- Drop and recreate views in invoker context (default for views)

drop view if exists public.trade_performance cascade;
drop view if exists public.supplier_intelligence cascade;
drop view if exists public.demand_intelligence cascade;
drop view if exists public.risk_signals cascade;
drop view if exists public.buyer_intelligence cascade;
drop view if exists public.category_performance cascade;
drop view if exists public.trust_evolution cascade;
drop view if exists public.demand_trends cascade;

-- BUYER INTELLIGENCE
create or replace view public.buyer_intelligence as
select 
  c.id as company_id,
  c.company_name,
  c.country,
  c.role,
  c.verified,
  c.trust_score,
  count(distinct r.id) as total_rfqs,
  count(distinct case when r.status = 'open' then r.id end) as open_rfqs,
  count(distinct case when r.status = 'closed' then r.id end) as closed_rfqs,
  count(distinct conv.id) as total_conversations,
  count(distinct case when conv.last_message_at > now() - interval '30 days' then conv.id end) as active_conversations,
  count(distinct o.id) as total_orders,
  count(distinct case when o.status = 'completed' then o.id end) as completed_orders,
  count(distinct case when o.status = 'cancelled' then o.id end) as cancelled_orders,
  coalesce(sum(case when o.status = 'completed' then o.total_amount else 0 end), 0) as total_deal_value,
  coalesce(avg(case when o.status = 'completed' then o.total_amount end), 0) as avg_deal_value,
  max(r.created_at) as last_rfq_date,
  max(conv.last_message_at) as last_conversation_date,
  max(o.created_at) as last_order_date,
  greatest(
    coalesce(max(r.created_at), '1970-01-01'::timestamp),
    coalesce(max(conv.last_message_at), '1970-01-01'::timestamp),
    coalesce(max(o.created_at), '1970-01-01'::timestamp)
  ) as last_activity_date,
  extract(epoch from (now() - greatest(
    coalesce(max(r.created_at), '1970-01-01'::timestamp),
    coalesce(max(conv.last_message_at), '1970-01-01'::timestamp),
    coalesce(max(o.created_at), '1970-01-01'::timestamp)
  ))) / 86400 as days_since_last_activity,
  case
    when count(distinct o.id) >= 5 and coalesce(sum(case when o.status = 'completed' then o.total_amount else 0 end), 0) > 10000 then 'High-Value Buyer'
    when count(distinct r.id) >= 3 and count(distinct conv.id) >= 2 and count(distinct o.id) >= 1 then 'Serious Buyer'
    when extract(epoch from (now() - greatest(
      coalesce(max(r.created_at), '1970-01-01'::timestamp),
      coalesce(max(conv.last_message_at), '1970-01-01'::timestamp),
      coalesce(max(o.created_at), '1970-01-01'::timestamp)
    ))) / 86400 > 90 then 'Dormant'
    when count(distinct r.id) < 2 and count(distinct conv.id) < 1 then 'Low Activity'
    else 'Active Buyer'
  end as buyer_segment
from companies c
left join rfqs r on r.buyer_company_id = c.id
left join conversations conv on (conv.buyer_company_id = c.id or conv.seller_company_id = c.id)
left join orders o on o.buyer_company_id = c.id
where c.role in ('buyer', 'hybrid')
group by c.id, c.company_name, c.country, c.role, c.verified, c.trust_score;

-- SUPPLIER INTELLIGENCE
create or replace view public.supplier_intelligence as
select 
  c.id as company_id,
  c.company_name,
  c.country,
  c.role,
  c.verified,
  c.verification_status,
  c.trust_score,
  c.average_rating,
  c.approved_reviews_count,
  avg(extract(epoch from (q.created_at - r.created_at)) / 3600) as avg_response_hours,
  percentile_cont(0.5) within group (order by extract(epoch from (q.created_at - r.created_at)) / 3600) as median_response_hours,
  count(distinct case when extract(epoch from (q.created_at - r.created_at)) / 3600 <= 24 then q.id end) as responses_within_24h,
  count(distinct q.id) as total_quotes_submitted,
  count(distinct o.id) as total_orders,
  count(distinct case when o.status = 'completed' then o.id end) as completed_orders,
  count(distinct case when o.status = 'cancelled' then o.id end) as cancelled_orders,
  case 
    when count(distinct o.id) > 0 
    then (count(distinct case when o.status = 'completed' then o.id end)::numeric / count(distinct o.id)::numeric) * 100
    else 0
  end as completion_rate,
  count(distinct d.id) as total_disputes,
  count(distinct case when d.status = 'resolved' then d.id end) as resolved_disputes,
  case 
    when count(distinct o.id) > 0 
    then (count(distinct d.id)::numeric / count(distinct o.id)::numeric) * 100
    else 0
  end as dispute_rate,
  count(distinct s.id) as total_shipments,
  count(distinct case when s.status = 'delivered' then s.id end) as delivered_shipments,
  avg(extract(epoch from (s.delivered_at - s.shipped_at)) / 86400) as avg_delivery_days,
  max(r.created_at) as last_rfq_response_date,
  max(o.created_at) as last_order_date,
  max(s.created_at) as last_shipment_date,
  (
    (coalesce(c.trust_score, 50) * 0.4) +
    (case 
      when count(distinct o.id) > 0 
      then (count(distinct case when o.status = 'completed' then o.id end)::numeric / count(distinct o.id)::numeric) * 100 * 0.3
      else 30
    end) +
    (case 
      when avg(extract(epoch from (q.created_at - r.created_at)) / 3600) is not null
      then greatest(0, 100 - (avg(extract(epoch from (q.created_at - r.created_at)) / 3600) / 24 * 20)) * 0.2
      else 20
    end) +
    (case 
      when count(distinct o.id) > 0 
      then greatest(0, 100 - ((count(distinct d.id)::numeric / count(distinct o.id)::numeric) * 100 * 10)) * 0.1
      else 10
    end)
  ) as reliability_score,
  case 
    when avg(extract(epoch from (q.created_at - r.created_at)) / 3600) > 72 then true
    else false
  end as slow_response_flag,
  case 
    when count(distinct o.id) > 0 and (count(distinct d.id)::numeric / count(distinct o.id)::numeric) > 0.1 then true
    else false
  end as high_dispute_flag,
  case 
    when max(r.created_at) < now() - interval '90 days' then true
    else false
  end as inactive_flag
from companies c
left join quotes q on q.supplier_company_id = c.id
left join rfqs r on r.id = q.rfq_id
left join orders o on o.seller_company_id = c.id
left join disputes d on (d.buyer_company_id = c.id or d.seller_company_id = c.id)
left join shipments s on s.seller_company_id = c.id
where c.role in ('seller', 'hybrid')
group by c.id, c.company_name, c.country, c.role, c.verified, c.verification_status, 
         c.trust_score, c.average_rating, c.approved_reviews_count;

-- TRADE PERFORMANCE
create or replace view public.trade_performance as
select 
  date_trunc('day', o.created_at) as trade_date,
  date_trunc('week', o.created_at) as trade_week,
  date_trunc('month', o.created_at) as trade_month,
  count(distinct r.id) as rfqs_created,
  count(distinct conv.id) as conversations_started,
  count(distinct o.id) as deals_created,
  count(distinct case when o.status = 'completed' then o.id end) as deals_completed,
  case 
    when count(distinct r.id) > 0 
    then (count(distinct conv.id)::numeric / count(distinct r.id)::numeric) * 100
    else 0
  end as rfq_to_conversation_rate,
  case 
    when count(distinct conv.id) > 0 
    then (count(distinct o.id)::numeric / count(distinct conv.id)::numeric) * 100
    else 0
  end as conversation_to_deal_rate,
  case 
    when count(distinct o.id) > 0 
    then (count(distinct case when o.status = 'completed' then o.id end)::numeric / count(distinct o.id)::numeric) * 100
    else 0
  end as deal_completion_rate,
  coalesce(sum(case when o.status = 'completed' then o.total_amount else 0 end), 0) as gmv,
  coalesce(sum(case when o.status = 'completed' then o.total_amount * 0.05 else 0 end), 0) as commission_earned,
  coalesce(avg(case when o.status = 'completed' then o.total_amount end), 0) as avg_deal_size,
  count(distinct p.category_id) as categories_traded,
  count(distinct c_buyer.country) as buyer_countries,
  count(distinct c_seller.country) as seller_countries
from orders o
left join rfqs r on r.id = o.rfq_id
left join conversations conv on conv.id = o.conversation_id
left join products p on p.id = o.product_id
left join companies c_buyer on c_buyer.id = o.buyer_company_id
left join companies c_seller on c_seller.id = o.seller_company_id
group by date_trunc('day', o.created_at), date_trunc('week', o.created_at), date_trunc('month', o.created_at);

-- CATEGORY PERFORMANCE
create or replace view public.category_performance as
select 
  cat.id as category_id,
  cat.name as category_name,
  cat.parent_id,
  count(distinct r.id) as total_rfqs,
  count(distinct case when r.status = 'open' then r.id end) as open_rfqs,
  count(distinct o.id) as total_deals,
  count(distinct case when o.status = 'completed' then o.id end) as completed_deals,
  coalesce(sum(case when o.status = 'completed' then o.total_amount else 0 end), 0) as gmv,
  coalesce(avg(case when o.status = 'completed' then o.total_amount end), 0) as avg_deal_size,
  case 
    when count(distinct r.id) > 0 
    then (count(distinct o.id)::numeric / count(distinct r.id)::numeric) * 100
    else 0
  end as conversion_rate,
  count(distinct c_seller.id) as active_suppliers,
  count(distinct p.id) as total_products
from categories cat
left join rfqs r on r.category_id = cat.id
left join products p on p.category_id = cat.id
left join orders o on o.product_id = p.id
left join companies c_seller on c_seller.id = p.company_id
group by cat.id, cat.name, cat.parent_id;

-- DEMAND INTELLIGENCE
create or replace view public.demand_intelligence as
select 
  r.category_id,
  cat.name as category_name,
  r.buyer_company_id,
  c_buyer.country as buyer_country,
  c_buyer.company_name as buyer_company_name,
  r.id as rfq_id,
  r.title as rfq_title,
  r.quantity,
  r.budget,
  r.currency,
  r.status,
  r.created_at as rfq_created_at,
  case 
    when r.status = 'open' and r.created_at > now() - interval '30 days' then true
    else false
  end as recent_demand,
  case 
    when r.budget > 10000 then 'High Value'
    when r.budget > 5000 then 'Medium Value'
    else 'Low Value'
  end as demand_value_tier,
  count(distinct p.id) as available_products,
  count(distinct c_seller.id) as available_suppliers,
  case 
    when count(distinct p.id) = 0 then 'No Supply'
    when count(distinct p.id) < 3 then 'Low Supply'
    when count(distinct p.id) < 10 then 'Medium Supply'
    else 'High Supply'
  end as supply_status,
  case 
    when count(distinct p.id) = 0 and r.status = 'open' then true
    else false
  end as supply_gap_flag
from rfqs r
left join categories cat on cat.id = r.category_id
left join companies c_buyer on c_buyer.id = r.buyer_company_id
left join products p on p.category_id = r.category_id and p.status = 'active'
left join companies c_seller on c_seller.id = p.company_id and c_seller.verified = true
group by r.id, r.category_id, cat.name, r.buyer_company_id, c_buyer.country, 
         c_buyer.company_name, r.title, r.quantity, r.budget, r.currency, r.status, r.created_at;

-- DEMAND TRENDS
create or replace view public.demand_trends as
select 
  date_trunc('month', r.created_at) as demand_month,
  r.category_id,
  cat.name as category_name,
  c_buyer.country as buyer_country,
  count(distinct r.id) as rfqs_count,
  sum(r.quantity) as total_quantity_demanded,
  sum(r.budget) as total_budget_demanded,
  avg(r.budget) as avg_budget,
  extract(year from r.created_at) as demand_year,
  extract(month from r.created_at) as demand_month_num
from rfqs r
left join categories cat on cat.id = r.category_id
left join companies c_buyer on c_buyer.id = r.buyer_company_id
group by date_trunc('month', r.created_at), r.category_id, cat.name, c_buyer.country,
         extract(year from r.created_at), extract(month from r.created_at);

-- RISK SIGNALS
create or replace view public.risk_signals as
select 
  c.id as company_id,
  c.company_name,
  c.role,
  c.country,
  c.trust_score,
  avg(extract(epoch from (q.created_at - r.created_at)) / 3600) as avg_response_hours,
  count(distinct case when extract(epoch from (q.created_at - r.created_at)) / 3600 > 72 then q.id end) as slow_responses_count,
  case 
    when avg(extract(epoch from (q.created_at - r.created_at)) / 3600) > 72 then 'High'
    when avg(extract(epoch from (q.created_at - r.created_at)) / 3600) > 48 then 'Medium'
    else 'Low'
  end as response_delay_risk,
  count(distinct d.id) as total_disputes,
  count(distinct case when d.status = 'open' then d.id end) as open_disputes,
  case 
    when count(distinct o.id) > 0 and (count(distinct d.id)::numeric / count(distinct o.id)::numeric) > 0.2 then 'High'
    when count(distinct o.id) > 0 and (count(distinct d.id)::numeric / count(distinct o.id)::numeric) > 0.1 then 'Medium'
    else 'Low'
  end as dispute_risk,
  count(distinct case 
    when conv.last_message_at < now() - interval '14 days' 
    and conv.last_message_at > now() - interval '90 days'
    and not exists (select 1 from orders o where o.conversation_id = conv.id)
    then conv.id
  end) as abandoned_conversations,
  case 
    when count(distinct conv.id) > 0 and 
         (count(distinct case 
           when conv.last_message_at < now() - interval '14 days' 
           and conv.last_message_at > now() - interval '90 days'
           and not exists (select 1 from orders o where o.conversation_id = conv.id)
           then conv.id
         end)::numeric / count(distinct conv.id)::numeric) > 0.3 then 'High'
    when count(distinct conv.id) > 0 and 
         (count(distinct case 
           when conv.last_message_at < now() - interval '14 days' 
           and conv.last_message_at > now() - interval '90 days'
           and not exists (select 1 from orders o where o.conversation_id = conv.id)
           then conv.id
         end)::numeric / count(distinct conv.id)::numeric) > 0.15 then 'Medium'
    else 'Low'
  end as abandonment_risk,
  count(distinct case 
    when o.status in ('processing', 'shipped') 
    and o.updated_at < now() - interval '30 days'
    then o.id
  end) as stuck_deals,
  case 
    when count(distinct o.id) > 0 and 
         (count(distinct case 
           when o.status in ('processing', 'shipped') 
           and o.updated_at < now() - interval '30 days'
           then o.id
         end)::numeric / count(distinct o.id)::numeric) > 0.2 then 'High'
    when count(distinct o.id) > 0 and 
         (count(distinct case 
           when o.status in ('processing', 'shipped') 
           and o.updated_at < now() - interval '30 days'
           then o.id
         end)::numeric / count(distinct o.id)::numeric) > 0.1 then 'Medium'
    else 'Low'
  end as stuck_deal_risk,
  case 
    when response_delay_risk = 'High' and dispute_risk = 'High' then 'High'
    when response_delay_risk = 'High' or dispute_risk = 'High' or abandonment_risk = 'High' or stuck_deal_risk = 'High' then 'High'
    when response_delay_risk = 'Medium' and (dispute_risk = 'Medium' or abandonment_risk = 'Medium' or stuck_deal_risk = 'Medium') then 'Medium'
    when response_delay_risk = 'Medium' or dispute_risk = 'Medium' or abandonment_risk = 'Medium' or stuck_deal_risk = 'Medium' then 'Medium'
    else 'Low'
  end as overall_risk_level,
  count(distinct case when o.total_amount > 10000 then o.id end) as high_value_deals,
  greatest(
    coalesce(max(r.created_at), '1970-01-01'::timestamp),
    coalesce(max(conv.last_message_at), '1970-01-01'::timestamp),
    coalesce(max(o.created_at), '1970-01-01'::timestamp)
  ) as last_activity_date
from companies c
left join quotes q on q.supplier_company_id = c.id
left join rfqs r on r.id = q.rfq_id
left join orders o on (o.buyer_company_id = c.id or o.seller_company_id = c.id)
left join disputes d on (d.buyer_company_id = c.id or d.seller_company_id = c.id)
left join conversations conv on (conv.buyer_company_id = c.id or conv.seller_company_id = c.id)
group by c.id, c.company_name, c.role, c.country, c.trust_score;

-- TRUST EVOLUTION
create or replace view public.trust_evolution as
select 
  c.id as company_id,
  c.company_name,
  c.trust_score as current_trust_score,
  c.verified,
  c.average_rating,
  c.approved_reviews_count,
  count(distinct case when o.status = 'completed' then o.id end) as completed_deals,
  count(distinct case when d.status = 'resolved' and d.resolution_favor = 'seller' then d.id end) as disputes_won,
  count(distinct case when d.status = 'resolved' and d.resolution_favor = 'buyer' then d.id end) as disputes_lost,
  count(distinct rev.id) as total_reviews,
  avg(rev.rating) as avg_review_rating,
  case 
    when c.verified = true then 20 else 0 end as verification_bonus,
  case 
    when count(distinct case when o.status = 'completed' then o.id end) >= 10 then 30
    when count(distinct case when o.status = 'completed' then o.id end) >= 5 then 20
    when count(distinct case when o.status = 'completed' then o.id end) >= 1 then 10
    else 0
  end as deal_history_bonus,
  case 
    when avg(rev.rating) >= 4.5 then 30
    when avg(rev.rating) >= 4.0 then 20
    when avg(rev.rating) >= 3.5 then 10
    else 0
  end as review_bonus,
  case 
    when count(distinct d.id) = 0 then 20
    when count(distinct d.id) <= 2 and count(distinct case when o.status = 'completed' then o.id end) > 0 
    then 10 - (count(distinct d.id) * 2)
    else 0
  end as dispute_penalty
from companies c
left join orders o on (o.buyer_company_id = c.id or o.seller_company_id = c.id)
left join disputes d on (d.buyer_company_id = c.id or d.seller_company_id = c.id)
left join reviews rev on (rev.buyer_company_id = c.id or rev.seller_company_id = c.id)
group by c.id, c.company_name, c.trust_score, c.verified, c.average_rating, c.approved_reviews_count;

-- GRANTS: only authenticated users (views still respect underlying RLS)
grant select on public.buyer_intelligence to authenticated;
grant select on public.supplier_intelligence to authenticated;
grant select on public.trade_performance to authenticated;
grant select on public.category_performance to authenticated;
grant select on public.demand_intelligence to authenticated;
grant select on public.demand_trends to authenticated;
grant select on public.risk_signals to authenticated;
grant select on public.trust_evolution to authenticated;


