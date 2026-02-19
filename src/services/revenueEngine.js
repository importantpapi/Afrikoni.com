/**
 * REVENUE ENGINE
 * 
 * The commercial heart of the Afrikoni Trade Protocol.
 * Responsible for:
 * 1. Calculating the 8% Take-Rate (Platform + FX + Service)
 * 2. Gating "Secure" assets (Certificates) behind fees ($25/flow)
 * 3. Managing Currency Netting Spreads
 */

export const REVENUE_CONFIG = {
    TAKE_RATE_PCT: 0.08,             // 8% Total Base
    VOLATILITY_BUFFER_PCT: 0.005,    // 0.5% Safety Buffer for Corridor Spikes
    BREAKDOWN: {
        ESCROW_FEE: 0.05,   // 5% Platform/Escrow
        SERVICE_FEE: 0.018, // 1.8% Service Margin
        FX_SPREAD: 0.012    // 1.2% FX Padding (Base)
    },
    DOCUMENT_FEE_USD: 25.00,
    ONE_FLOW_PACK_ID: 'one_flow_pack_v1'
};

/**
 * Get the current dynamic take-rate including volatility buffers.
 * Future: Adjust based on real-time corridor risk (e.g. NGN/GHS).
 */
export function getDynamicTakeRate() {
    return REVENUE_CONFIG.TAKE_RATE_PCT + REVENUE_CONFIG.VOLATILITY_BUFFER_PCT;
}

/**
 * Calculate the full fee breakdown for a trade value
 * @param {number} tradeValueUSD 
 */
export function calculateTradeFees(tradeValueUSD) {
    const dynamicRate = getDynamicTakeRate();
    const totalFee = tradeValueUSD * dynamicRate;

    return {
        total: totalFee,
        breakdown: {
            escrow: tradeValueUSD * REVENUE_CONFIG.BREAKDOWN.ESCROW_FEE,
            service: tradeValueUSD * REVENUE_CONFIG.BREAKDOWN.SERVICE_FEE,
            fxValuation: tradeValueUSD * (REVENUE_CONFIG.BREAKDOWN.FX_SPREAD + REVENUE_CONFIG.VOLATILITY_BUFFER_PCT)
        },
        netSettlement: tradeValueUSD - totalFee,
        appliedRate: dynamicRate
    };
}

/**
 * Estimate FX output for display purposes only.
 * For actual settlement, always use live rates from sync-fx-rates Edge Function.
 * @param {number} amountUSD
 * @param {string} targetCurrency (NGN, GHS, KES)
 */
export function estimateFX(amountUSD, targetCurrency) {
    // Static fallback rates — used only for UI estimates when live rates unavailable
    const RATES = {
        'NGN': 1550,
        'GHS': 13.5,
        'KES': 130,
    };

    const rate = RATES[targetCurrency] || 0;
    return {
        rate,
        estimatedOutput: amountUSD * rate,
        currency: targetCurrency,
        isEstimate: true,
    };
}

/**
 * Check if a document is accessible based on payment status
 * @param {string} docType 
 * @param {boolean} hasOneFlowPack 
 */
export function checkDocumentAccess(docType, hasOneFlowPack) {
    const PREMIUIM_DOCS = ['Certificate of Origin', 'Bill of Lading', 'Commercial Invoice (Verified)'];

    if (PREMIUIM_DOCS.includes(docType) && !hasOneFlowPack) {
        return {
            locked: true,
            reason: 'Standardization Fee Required',
            fee: REVENUE_CONFIG.DOCUMENT_FEE_USD
        };
    }

    return { locked: false };
}

export default {
    calculateTradeFees,
    estimateFX,
    checkDocumentAccess,
    REVENUE_CONFIG
};
