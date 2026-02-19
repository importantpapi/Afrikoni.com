import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AFRIKONI FINANCE ENGINE (Instant Payouts)
 * 
 * This function:
 * 1. Evaluates supplier eligibility for instant financing.
 * 2. Criteria: Credit Score > 700 AND Verified Tier > 1.
 * 3. Simulates instant payout transfer (Trade Value - 2% fee).
 * 4. Records revenue transaction.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { trade_id, supplier_id } = await req.json();

        if (!trade_id || !supplier_id) {
            throw new Error("Missing trade_id or supplier_id");
        }

        // 1. Fetch Trade & Supplier Details
        const { data: trade, error: tradeError } = await supabase
            .from('trades')
            .select('total_value, status, currency')
            .eq('id', trade_id)
            .single();

        if (tradeError) throw new Error(`Trade not found: ${tradeError.message}`);

        const { data: supplier, error: supplierError } = await supabase
            .from('companies')
            .select('verification_status, credit_score, metadata')
            .eq('id', supplier_id)
            .single();

        if (supplierError) throw new Error(`Supplier not found: ${supplierError.message}`);

        // 2. Evaluate Eligibility
        const creditScore = supplier.credit_score || 0;
        const isVerified = supplier.verification_status === 'verified';

        const isEligible = isVerified && creditScore >= 700;
        const reason = !isVerified ? "Supplier not verified" :
            creditScore < 700 ? `Credit score too low (${creditScore}/700)` :
                "Eligible for instant payout";

        if (!isEligible) {
            return new Response(JSON.stringify({
                eligible: false,
                reason,
                credit_score: creditScore
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Calculate Payout
        const tradeValue = trade.total_value || 0;
        const feePercentage = 0.02; // 2% Fee
        const feeAmount = tradeValue * feePercentage;
        const payoutAmount = tradeValue - feeAmount;

        // 4. Simulate Payout & Record Transaction
        // In a real system, this would trigger a Flutterwave/Stripe transfer

        const { data: transaction, error: txnError } = await supabase
            .from('revenue_transactions')
            .insert({
                company_id: supplier_id,
                trade_id: trade_id,
                transaction_type: 'financing_fee',
                amount: feeAmount,
                currency: trade.currency || 'USD',
                status: 'completed',
                description: `2% Financing Fee for Trade #${trade_id.substring(0, 8)}`,
                metadata: {
                    payout_amount: payoutAmount,
                    original_value: tradeValue,
                    credit_score_at_payout: creditScore
                }
            })
            .select()
            .single();

        if (txnError) throw new Error(`Transaction recording failed: ${txnError.message}`);

        // Log the payout event
        await supabase.from('trade_events').insert({
            trade_id: trade_id,
            event_type: 'finance_payout_processed',
            description: `Instant payout of ${trade.currency} ${payoutAmount.toFixed(2)} processed to supplier.`,
            metadata: { fee: feeAmount, transaction_id: transaction.id }
        });

        return new Response(JSON.stringify({
            eligible: true,
            status: 'payout_processed',
            payout_amount: payoutAmount,
            fee_deducted: feeAmount,
            currency: trade.currency,
            transaction_id: transaction.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Finance Engine Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
