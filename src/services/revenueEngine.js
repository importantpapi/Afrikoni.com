/**
 * REVENUE ENGINE
 * 
 * The commercial heart of the Sovereign Trade Protocol.
 * Responsible for:
 * 1. Calculating the 8% Take-Rate (Platform + FX + Service)
 * 2. Gating "Sovereign" assets (Certificates) behind fees ($25/flow)
 * 3. Managing Currency Netting Spreads
 */

export const REVENUE_CONFIG = {
    TAKE_RATE_PCT: 0.08, // 8% Total
    BREAKDOWN: {
        ESCROW_FEE: 0.05,   // 5% Platform/Escrow
        SERVICE_FEE: 0.018, // 1.8% Service Margin
        FX_SPREAD: 0.012    // 1.2% FX Padding
    },
    DOCUMENT_FEE_USD: 25.00,
    ONE_FLOW_PACK_ID: 'one_flow_pack_v1'
};

/**
 * Calculate the full fee breakdown for a trade value
 * @param {number} tradeValueUSD 
 */
export function calculateTradeFees(tradeValueUSD) {
    const totalFee = tradeValueUSD * REVENUE_CONFIG.TAKE_RATE_PCT;

    return {
        total: totalFee,
        breakdown: {
            escrow: tradeValueUSD * REVENUE_CONFIG.BREAKDOWN.ESCROW_FEE,
            service: tradeValueUSD * REVENUE_CONFIG.BREAKDOWN.SERVICE_FEE,
            fxValuation: tradeValueUSD * REVENUE_CONFIG.BREAKDOWN.FX_SPREAD
        },
        netSettlement: tradeValueUSD - totalFee
    };
}

/**
 * Simulate Treasury Bridge FX Rates (with spread baked in)
 * @param {number} amountUSD 
 * @param {string} targetCurrency (NGN, GHS, KES)
 */
export function estimateFX(amountUSD, targetCurrency) {
    // Baseline fallback rates for Sovereign Protocol
    const RATES = {
        'NGN': 1650.50, // Parallel/Black market reference
        'GHS': 15.80,
        'KES': 145.20
    };

    const rate = RATES[targetCurrency] || 0;
    // Apply internal spread logic if needed, but for now returned raw "Street Rate" which generates demand
    return {
        rate: rate,
        estimatedOutput: amountUSD * rate,
        currency: targetCurrency
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
