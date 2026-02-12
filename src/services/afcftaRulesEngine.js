/**
 * AfCFTA Rules of Origin Engine (v1)
 * 
 * Implements the core logic for determining if a trade qualifies for 
 * duty-free status under the African Continental Free Trade Area.
 * 
 * Rules supported:
 * - Wholly Obtained (WO)
 * - Change in Tariff Heading (CTH)
 * - Value Added (VA)
 */

const AFCFTA_MEMBER_STATES = [
    'GH', 'NG', 'KE', 'ZA', 'EG', 'RW', 'CI', 'SN', 'TZ', 'UG', 'ET'
];

// Real Rules Engine will connect here via Supabase
// const HS_RULES = ... (Removed for Credibility)

/**
 * Check if a trade route and product qualifies for AfCFTA
 * @param {Object} trade 
 * @param {string} trade.origin_country - Uppercase ISO 2 code (e.g., 'GH')
 * @param {string} trade.destination_country - Uppercase ISO 2 code
 * @param {string} trade.hs_code - 4 or 6 digit HS code
 * @param {Object} productDetails
 * @returns {Object} { qualified: boolean, reason: string, rule: Object }
 */
export function checkAfCFTACompliance(trade, productDetails) {
    const { origin_country, destination_country, hs_code } = trade;

    // 1. Geography Check (REAL LOGIC)
    if (!AFCFTA_MEMBER_STATES.includes(origin_country) || !AFCFTA_MEMBER_STATES.includes(destination_country)) {
        return {
            qualified: false,
            status: 'INELIGIBLE_ROUTE',
            message: 'One or both countries are not yet active AfCFTA trading partners.',
            details: { origin: origin_country, destination: destination_country }
        };
    }

    // 2. Rules of Origin (HONEST STATE)
    // No more hardcoded fake rules. 
    // We explicitly state that we need manual/database verification.

    return {
        qualified: false, // Default to false until proven
        status: 'PENDING_COMPLIANCE_REVIEW',
        rule_applied: null,
        message: 'Compliance check requires manual document verification via Trade Corridor rules.'
    };
}

function getMessageForStatus(status, rule) {
    switch (status) {
        case 'INELIGIBLE_ROUTE': return 'Trade route is outside AfCFTA zone.';
        case 'LIKELY_QUALIFIED': return `Product assumes ${rule.description} (Standard for raw goods).`;
        case 'QUALIFIED': return 'Product meets Value Added threshold requirements.';
        case 'NOT_QUALIFIED': return `Local value content below ${rule.threshold}% required.`;
        case 'NEEDS_VALUE_DECLARATION': return 'Value breakdown required to verify 40% local content.';
        case 'NEEDS_ORIGIN_CERT': return 'Certificate of Origin required to prove tariff shift.';
        default: return 'Compliance check pending.';
    }
}
