/**
 * PAPSS SETTLEMENT SERVICE
 *
 * Connectivity to the Pan-African Payment and Settlement System.
 * Enables cross-border African currency clearing (e.g. NGN -> KES).
 *
 * NOTE: The papss-clearing Edge Function must be deployed and configured
 * with valid PAPSS credentials for live settlement. Until then, this
 * service will return a pending state that requires manual reconciliation.
 */

import { supabase } from '@/api/supabaseClient';
const ALLOW_SIMULATED_SETTLEMENTS = import.meta.env.VITE_ALLOW_SIMULATED_SETTLEMENTS === 'true';

export async function initiatePAPSSSettlement(tradeId, amount, fromCurrency, toCurrency) {
    try {
        console.log(`[PAPSS] Initiating settlement: ${amount} ${fromCurrency} -> ${toCurrency}`);

        const { data, error } = await supabase.functions.invoke('papss-clearing', {
            body: { tradeId, amount, fromCurrency, toCurrency }
        });

        if (error) {
            // Controlled simulation mode for local development only.
            if (ALLOW_SIMULATED_SETTLEMENTS && (error.status === 404 || error.message?.includes('not found'))) {
                console.warn('[PAPSS] papss-clearing missing - simulating settlement');
                return {
                    success: true,
                    settlementId: `SIM-PAPSS-${tradeId.slice(0, 8)}`,
                    clearedAt: new Date().toISOString(),
                    exchangeRate: 1.0,
                    netAmount: amount,
                    isSimulation: true
                };
            }
            throw error;
        }

        // Use the settlement ID returned by the Edge Function — never generate client-side
        if (!data?.settlementId) {
            throw new Error('PAPSS clearing did not return a valid settlement ID.');
        }

        return {
            success: true,
            settlementId: data.settlementId,
            clearedAt: data.clearedAt || new Date().toISOString(),
            exchangeRate: data.rate || null,
            netAmount: data.netAmount || null,
        };
    } catch (err) {
        console.error('[PAPSS] Settlement initiation failed:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Fetch indicative exchange rates.
 * Tries the sync-fx-rates Edge Function first, falls back to static rates.
 */
export async function getPAPSSRates(baseCurrency, targetCurrency) {
    try {
        const { data, error } = await supabase.functions.invoke('sync-fx-rates', {
            body: { base: baseCurrency, target: targetCurrency }
        });
        if (!error && data?.rate) return data.rate;
    } catch (_) {
        // Fall through to static fallback
    }

    // Static fallback rates (approximate — not for settlement calculations)
    const fallbackRates = {
        'NGN_KES': 0.084,
        'GHS_NGN': 90.00,
        'ZAR_KES': 7.20,
        'USD_NGN': 1550.00,
    };

    const key = `${baseCurrency}_${targetCurrency}`;
    return fallbackRates[key] || null;
}

export default {
    initiatePAPSSSettlement,
    getPAPSSRates
};
