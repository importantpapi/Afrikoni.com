/**
 * Commission Calculator
 * Simple, honest monetization logic
 * Afrikoni earns ONLY on successful deals
 */

// Commission rates (%)
export const COMMISSION_RATES = {
  STANDARD: 8, // Standard deals
  ASSISTED: 12, // Afrikoni-assisted deals
  HIGH_VALUE: 5, // Deals > $50,000 (lower rate, higher absolute value)
  MINIMUM: 50 // Minimum commission in USD
};

/**
 * Calculate commission for a deal
 * @param {number} dealValue - Total deal value in USD
 * @param {string} dealType - 'standard' | 'assisted' | 'high_value'
 * @param {string} currency - Deal currency
 * @returns {object} Commission breakdown
 */
export function calculateCommission(dealValue, dealType = 'standard', currency = 'USD') {
  let rate;

  // Determine rate based on deal type
  if (dealType === 'assisted') {
    rate = COMMISSION_RATES.ASSISTED;
  } else if (dealValue >= 50000) {
    rate = COMMISSION_RATES.HIGH_VALUE;
  } else {
    rate = COMMISSION_RATES.STANDARD;
  }

  // Calculate commission
  const commissionAmount = (dealValue * rate) / 100;
  
  // Apply minimum
  const finalCommission = Math.max(commissionAmount, COMMISSION_RATES.MINIMUM);

  // Calculate net payout to supplier
  const netPayoutToSupplier = dealValue - finalCommission;

  return {
    dealValue,
    currency,
    rate,
    commissionAmount: finalCommission,
    netPayoutToSupplier,
    minimumApplied: finalCommission === COMMISSION_RATES.MINIMUM,
    dealType
  };
}

/**
 * Format commission disclosure message for buyers
 */
export function getCommissionDisclosureMessage(dealValue, dealType = 'standard') {
  const { rate, commissionAmount, currency } = calculateCommission(dealValue, dealType);
  
  return {
    title: 'Success Fee',
    message: `Afrikoni earns a ${rate}% success fee (${currency} ${commissionAmount.toFixed(2)}) only if this deal completes successfully.`,
    disclaimer: 'No upfront cost to you. We only succeed when you succeed.',
    breakdown: [
      `Deal value: ${currency} ${dealValue.toFixed(2)}`,
      `Afrikoni fee: ${rate}% (${currency} ${commissionAmount.toFixed(2)})`,
      `Paid to supplier: ${currency} ${(dealValue - commissionAmount).toFixed(2)}`
    ]
  };
}

/**
 * Check if commission should be waived (admin override)
 */
export function shouldWaiveCommission(order, reason = null) {
  const waiverReasons = {
    FIRST_DEAL: 'First deal with this supplier',
    HIGH_VOLUME: 'High volume buyer (10+ deals)',
    STRATEGIC: 'Strategic partnership',
    DISPUTE_RESOLUTION: 'Dispute resolution goodwill',
    TEST_ORDER: 'Test order (sample)'
  };

  return {
    shouldWaive: !!reason && waiverReasons[reason],
    reason: waiverReasons[reason] || null
  };
}

/**
 * Track commission for reporting
 */
export async function recordCommission(supabase, {
  orderId,
  dealValue,
  commissionRate,
  commissionAmount,
  currency,
  dealType,
  status = 'pending'
}) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        order_id: orderId,
        deal_value: dealValue,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        currency,
        deal_type: dealType,
        status, // 'pending' | 'earned' | 'waived'
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording commission:', error);
    return { success: false, error };
  }
}

/**
 * Update commission status when deal completes
 */
export async function markCommissionEarned(supabase, orderId) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'earned',
        earned_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error marking commission earned:', error);
    return { success: false, error };
  }
}

/**
 * Get commission summary for admin dashboard
 */
export async function getCommissionSummary(supabase, timeframe = 'all') {
  try {
    let query = supabase
      .from('commissions')
      .select('*');

    // Apply timeframe filter
    if (timeframe === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfMonth.toISOString());
    } else if (timeframe === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      query = query.gte('created_at', startOfWeek.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate totals
    const pending = data.filter(c => c.status === 'pending');
    const earned = data.filter(c => c.status === 'earned');
    const waived = data.filter(c => c.status === 'waived');

    const pendingValue = pending.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const earnedValue = earned.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const waivedValue = waived.reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    return {
      success: true,
      summary: {
        total: data.length,
        pending: { count: pending.length, value: pendingValue },
        earned: { count: earned.length, value: earnedValue },
        waived: { count: waived.length, value: waivedValue },
        totalRevenue: earnedValue
      },
      data
    };
  } catch (error) {
    console.error('Error getting commission summary:', error);
    return { success: false, error };
  }
}

/**
 * Commission migration SQL
 * Run this to create the commissions table
 */
export const COMMISSION_TABLE_MIGRATION = `
-- Commissions tracking table
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  deal_value NUMERIC(15, 2) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  deal_type TEXT DEFAULT 'standard' CHECK (deal_type IN ('standard', 'assisted', 'high_value')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'earned', 'waived')),
  waiver_reason TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON public.commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_recorded_at ON public.commissions(recorded_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION update_commissions_updated_at();
`;

