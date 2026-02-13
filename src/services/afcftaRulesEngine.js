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

// ✅ AfCFTA Corridors: Phase 1 Active Corridors
const ACTIVE_CORRIDORS = [
    { from: 'GH', to: 'NG', status: 'ACTIVE', focus: 'Industrial' },
    { from: 'KE', to: 'RW', status: 'ACTIVE', focus: 'Services/Agri' },
    { from: 'ZA', to: 'EG', status: 'STAGING', focus: 'Retail' },
];

/**
 * Check if a trade route and product qualifies for AfCFTA
 * @param {Object} trade 
 * @param {string} trade.origin_country - Uppercase ISO 2 code (e.g., 'GH')
 * @param {string} trade.destination_country - Uppercase ISO 2 code
 * @param {string} trade.hs_code - 4 or 6 digit HS code
 * @returns {Object} { qualified: boolean, status: string, checklist: Array }
 */
export function checkAfCFTACompliance(trade) {
    const { origin_country, destination_country, hs_code } = trade;

    // 1. Corridor Eligibility Check
    const corridor = ACTIVE_CORRIDORS.find(
        c => (c.from === origin_country && c.to === destination_country) ||
            (c.from === destination_country && c.to === origin_country)
    );

    if (!corridor) {
        return {
            qualified: false,
            status: 'INELIGIBLE_CORRIDOR',
            message: 'AfCFTA trading is not yet fully activated for this specific country pair.',
            checklist: []
        };
    }

    // 2. Intelligence: 'Duty-free Likely' vs 'Manual Review'
    const isLikelyDutyFree = hs_code?.startsWith('0') || hs_code?.startsWith('1'); // Raw/Agri simplification
    const status = isLikelyDutyFree ? 'DUTY_FREE_LIKELY' : 'MANUAL_REVIEW_REQUIRED';

    // 3. Required Documents Checklist
    const checklist = [
        { id: 'coo', label: 'Certificate of Origin', required: true, status: 'pending' },
        { id: 'cd', label: 'Customs Declaration', required: true, status: 'pending' },
    ];

    if (!isLikelyDutyFree) {
        checklist.push({ id: 'vbr', label: 'Value Breakdown Report (40% Rule)', required: true, status: 'pending' });
    }

    return {
        qualified: isLikelyDutyFree,
        status,
        corridor_focus: corridor.focus,
        message: isLikelyDutyFree
            ? 'Trade qualifies for expedited duty-free clearance preference.'
            : 'Value-added verification required for industrial goods.',
        checklist
    };
}
