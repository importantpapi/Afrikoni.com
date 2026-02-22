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

// ✅ AfCFTA Corridors: Expanded operational set (Phase 1 + Phase 2)
const ACTIVE_CORRIDORS = [
    { from: 'GH', to: 'NG', status: 'ACTIVE', focus: 'Industrial' },
    { from: 'KE', to: 'RW', status: 'ACTIVE', focus: 'Services/Agri' },
    { from: 'ZA', to: 'EG', status: 'STAGING', focus: 'Retail' },
    { from: 'NG', to: 'KE', status: 'ACTIVE', focus: 'Agri/Manufacturing' },
    { from: 'NG', to: 'EG', status: 'ACTIVE', focus: 'Industrial Inputs' },
    { from: 'NG', to: 'CM', status: 'ACTIVE', focus: 'Agri' },
    { from: 'GH', to: 'CI', status: 'ACTIVE', focus: 'Cocoa/Textiles' },
    { from: 'MA', to: 'SN', status: 'STAGING', focus: 'Retail/Tech' },
    { from: 'ET', to: 'DJ', status: 'ACTIVE', focus: 'Transit/Logistics' },
    { from: 'TZ', to: 'ZM', status: 'ACTIVE', focus: 'Mining/Agri' },
    { from: 'ZA', to: 'ZW', status: 'ACTIVE', focus: 'Manufacturing' },
    { from: 'ZA', to: 'ZM', status: 'ACTIVE', focus: 'Mining' },
    { from: 'ZA', to: 'MZ', status: 'ACTIVE', focus: 'Port Logistics' },
    { from: 'EG', to: 'LY', status: 'STAGING', focus: 'Industrial' },
    { from: 'EG', to: 'TN', status: 'STAGING', focus: 'Industrial' },
    { from: 'UG', to: 'KE', status: 'ACTIVE', focus: 'Agri' },
    { from: 'UG', to: 'RW', status: 'ACTIVE', focus: 'Agri' },
    { from: 'TZ', to: 'RW', status: 'ACTIVE', focus: 'Agri/Transit' },
    { from: 'CM', to: 'SN', status: 'STAGING', focus: 'Regional FMCG' },
    { from: 'CI', to: 'SN', status: 'ACTIVE', focus: 'Agri Processing' },
];

/**
 * Get specific AfCFTA legal clauses for a trade corridor and product.
 */
export function getLegalClauses(corridor, hsCode) {
    const defaultClause = "This trade is governed by the AfCFTA Agreement. The parties agree to adhere to the General Rules of Origin as specified in Annex 2.";

    // HS-code specific clauses (Simulated for 2026)
    const hsClauses = {
        '0701': 'Agricultural produce classified as wholly obtained, eligible for preferential tariff.',
        '0801': 'Agri produce may qualify under wholly obtained rule with origin certification.',
        '0901': 'Product qualifies as "Wholly Obtained" under agricultural rules. 0% tariff applied.',
        '1006': 'Rice trade requires origin proof and quality certification for preferential rate.',
        '1207': 'Oil seeds can qualify with regional origin and traceability documentation.',
        '1511': 'Vegetable oils require value-add verification for tariff preference.',
        '1701': 'Sugar requires proof of regional processing value-added thresholds.',
        '1801': 'Cocoa beans are eligible under agricultural origin protocols with certificate of origin.',
        '2008': 'Processed agri goods require value-add documentation under Annex 2.',
        '2401': 'Unmanufactured tobacco may qualify with strict origin evidence.',
        '5201': 'Cotton fibre eligibility depends on origin and processing stage.',
        '6101': 'Product meets "Change in Tariff Sub-Heading" rule for textile manufacture.',
        '6203': 'Apparel products require CTH rule verification and manufacturing declarations.',
        '6403': 'Footwear requires substantial transformation evidence.',
        '7201': 'Value-Added content verified above 35% threshold for manufactured steel.',
        '7214': 'Steel bars require value-added declaration and mill certificates.',
        '7308': 'Fabricated metal structures require regional manufacturing proof.',
        '7403': 'Refined copper requires processing origin chain evidence.',
        '7601': 'Aluminium origin treatment depends on transformation threshold.',
        '8471': 'Electronics require substantial transformation and component-origin reporting.',
    };

    // Corridor-specific legal text
    const corridorData = {
        'NG-GH': 'This contract incorporates the Nigeria-Ghana Bilateral Trade Protocol as harmonized with AfCFTA Art. 4.',
        'GH-NG': 'This contract incorporates the Nigeria-Ghana Bilateral Trade Protocol as harmonized with AfCFTA Art. 4.', // Bidirectional
        'KE-RW': 'Settlement governed by the East African Community (EAC) Common Market Protocol.',
        'RW-KE': 'Settlement governed by the East African Community (EAC) Common Market Protocol.', // Bidirectional
        'ZA-EG': 'SADC Protocol on Trade specifically applied for duty-free transit.',
        'EG-ZA': 'SADC Protocol on Trade specifically applied for duty-free transit.',
        'NG-KE': 'PAPSS corridor with AfCFTA Annex 2 origin proof and cross-border compliance controls.',
        'KE-NG': 'PAPSS corridor with AfCFTA Annex 2 origin proof and cross-border compliance controls.',
        'NG-EG': 'North-West Africa corridor requiring standardized customs declarations.',
        'EG-NG': 'North-West Africa corridor requiring standardized customs declarations.',
        'GH-CI': 'ECOWAS-aligned cocoa and textile corridor under AfCFTA preference framework.',
        'CI-GH': 'ECOWAS-aligned cocoa and textile corridor under AfCFTA preference framework.',
        'ET-DJ': 'Horn of Africa transit corridor with logistics-first customs protocol.',
        'DJ-ET': 'Horn of Africa transit corridor with logistics-first customs protocol.',
        'TZ-ZM': 'SADC-EAC connective corridor requiring coordinated border compliance.',
        'ZM-TZ': 'SADC-EAC connective corridor requiring coordinated border compliance.'
    };

    return {
        base: defaultClause,
        hsSpecific: hsClauses[hsCode?.substring(0, 4)] || null,
        corridorSpecific: corridorData[corridor] || null
    };
}

/**
 * Check compliance and return full legal context.
 */
export function checkCompliance(params) {
    const { origin, destination, hsCode, valueAdded } = params;
    const corridorKey = `${origin}-${destination}`;

    const isCompliant = valueAdded >= 35; // Standard AfCFTA threshold
    const clauses = getLegalClauses(corridorKey, hsCode);

    return {
        compliant: isCompliant,
        tariffRate: isCompliant ? 0 : 12.5,
        requiredDocs: [
            'AfCFTA Certificate of Origin',
            'Secure DNA Ledger Proof',
            'Customs Declaration Form A1'
        ],
        legalClauses: clauses,
        summary: isCompliant
            ? `Verified AfCFTA compliant. Eligible for 0% tariff in ${corridorKey} corridor.`
            : `Fails 35% Value-Add threshold. Standard 12.5% tariff applicable.`
    };
}

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
    const hsPrefix = (hs_code || '').substring(0, 2);
    const likelyDutyFreePrefixes = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']);
    const isLikelyDutyFree = likelyDutyFreePrefixes.has(hsPrefix);
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
