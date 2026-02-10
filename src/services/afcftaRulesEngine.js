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

// Mock Rules Database - In production, this would be a Supabase table
const HS_RULES = {
    '1801': { // Cocoa Beans
        rule: 'WO',
        description: 'Wholly obtained in the member state.',
        threshold: 100
    },
    '1803': { // Cocoa Paste
        rule: 'CTH',
        description: 'Manufacture from materials of any heading, except that of the product.',
        threshold: 0
    },
    '1806': { // Chocolate
        rule: 'VA',
        description: 'Value of non-originating materials does not exceed 60% of ex-works price.',
        threshold: 40 // Minimum 40% local value content
    },
    'default': {
        rule: 'CTH',
        description: 'Change in Tariff Heading required.',
        threshold: 0
    }
};

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

    // 1. Geography Check
    if (!AFCFTA_MEMBER_STATES.includes(origin_country) || !AFCFTA_MEMBER_STATES.includes(destination_country)) {
        return {
            qualified: false,
            status: 'INELIGIBLE_ROUTE',
            message: 'One or both countries are not yet active AfCFTA trading partners.',
            details: { origin: origin_country, destination: destination_country }
        };
    }

    // 2. Rules of Origin Lookup
    const shortCode = hs_code ? hs_code.substring(0, 4) : 'default';
    const rule = HS_RULES[shortCode] || HS_RULES['default'];

    // 3. Product Specific Validation (Mock simulation)
    // In a real automated engine, we'd check uploaded documents vs the rule.
    // Here we perform a heuristic check based on typical Trade OS data.

    let complianceStatus = 'PENDING_DATA';

    if (rule.rule === 'WO') {
        // Wholly Obtained usually requires minimal processing proof, just origin cert.
        complianceStatus = 'LIKELY_QUALIFIED';
    } else if (rule.rule === 'VA') {
        // Value Added needs cost breakdown
        if (productDetails?.local_value_content >= rule.threshold) {
            complianceStatus = 'QUALIFIED';
        } else if (productDetails?.local_value_content < rule.threshold) {
            complianceStatus = 'NOT_QUALIFIED';
        } else {
            complianceStatus = 'NEEDS_VALUE_DECLARATION';
        }
    } else {
        complianceStatus = 'NEEDS_ORIGIN_CERT';
    }

    return {
        qualified: ['QUALIFIED', 'LIKELY_QUALIFIED'].includes(complianceStatus),
        status: complianceStatus,
        rule_applied: rule,
        message: getMessageForStatus(complianceStatus, rule)
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
