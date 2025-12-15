import { supabase } from '@/api/supabaseClient';

/**
 * Record logistics margin in the canonical `platform_revenue` table.
 *
 * NOTE: This is best-effort. Callers should wrap in their own try/catch so
 * quote acceptance isn't blocked if this fails.
 */
export async function recordLogisticsRevenue({
  orderId,
  logisticsQuoteId,
  logisticsPartnerId,
  basePrice,
  markupPercent,
  markupAmount,
  finalPrice,
  currency = 'USD',
}) {
  const payload = {
    source: 'logistics',
    order_id: orderId,
    logistics_quote_id: logisticsQuoteId,
    logistics_partner_id: logisticsPartnerId,
    base_price: basePrice,
    afrikoni_markup_percent: markupPercent,
    afrikoni_markup_amount: markupAmount,
    final_price: finalPrice,
    amount: markupAmount,
    currency,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('platform_revenue').insert(payload);
  if (error) {
    throw error;
  }
}


