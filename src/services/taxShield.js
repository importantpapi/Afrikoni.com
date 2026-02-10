/**
 * THE AfCFTA TAX SHIELD
 * 
 * "The Moat" of the Sovereign Trade Protocol.
 * Responsible for:
 * 1. AI Auto-Mapping of Harmonized System (HS) Codes.
 * 2. Validating Rules of Origin (RoO) for Duty-Free Status.
 * 3. Issuing the 90% Duty-Free Certificate.
 */

// Mock HS Code Database
const HS_CODE_DB = {
    'cocoa': { code: '1801.00', desc: 'Cocoa beans, whole or broken, raw or roasted', duty: '0%' },
    'coffee': { code: '0901.11', desc: 'Coffee, not roasted: Not decaffeinated', duty: '0%' },
    'ginger': { code: '0910.11', desc: 'Ginger: Neither crushed nor ground', duty: '0%' },
    'textile': { code: '5208.11', desc: 'Woven fabrics of cotton, weighing not more than 200 g/m2', duty: '0%' },
    'gold': { code: '7108.12', desc: 'Gold: Non-monetary: Other unwrought forms', duty: '5%' },
};

/**
 * Predict HS Code based on product description (Simulated AI)
 * @param {string} description 
 */
export async function predictHSCode(description) {
    // Simulate AI latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerDesc = description.toLowerCase();
    let bestMatch = null;

    for (const [key, data] of Object.entries(HS_CODE_DB)) {
        if (lowerDesc.includes(key)) {
            bestMatch = data;
            break;
        }
    }

    // Fallback for demo
    if (!bestMatch) {
        if (lowerDesc.length > 5) {
            return {
                code: '0000.00',
                desc: 'General Merchandise (Auto-Classification Pending)',
                duty: 'Variable',
                confidence: 0.4
            };
        }
        return null;
    }

    return {
        ...bestMatch,
        confidence: 0.98
    };
}

/**
 * Validate Rules of Origin (RoO) based on Bill of Materials (BOM)
 * @param {Array} bomItems - [{ origin: 'GH', value: 100 }, { origin: 'CN', value: 50 }]
 * @param {number} totalValue 
 */
export function validateRoO(bomItems, totalValue) {
    const AFRICAN_ORIGINS = ['GH', 'NG', 'KE', 'ZA', 'EG', 'RW', 'TZ']; // List of African Country Codes

    let localContentValue = 0;

    bomItems.forEach(item => {
        if (AFRICAN_ORIGINS.includes(item.origin)) {
            localContentValue += item.value;
        }
    });

    const localContentPct = (localContentValue / totalValue) * 100;
    const passed = localContentPct >= 40; // 40% Threshold

    return {
        passed,
        localContentPct,
        threshold: 40,
        certificateEligible: passed
    };
}

/**
 * Generate Duty-Free Certificate Token
 * @param {string} tradeId 
 */
export function generateDutyFreeCert(tradeId) {
    return {
        id: `AFCFTA-${tradeId}-${Date.now().toString(16).toUpperCase()}`,
        type: 'Certificate of Origin (AfCFTA)',
        issuer: 'StartRail Protocol Validator',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE'
    };
}

/**
 * PHASE 1: Intelligent Document Processing (IDP)
 * Simulates Gemini API extraction from uploaded documents
 */
export async function simulateIDP(file) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock extraction data
    return {
        exporter: "Ashanti Gold Fields Ltd.",
        consignee: "Global Commodities Inc.",
        origin: "Takoradi, Ghana",
        incoterms: "CIF (Cost, Insurance & Freight)",
        hsCode: "7108.12",
        items: [
            { desc: "Gold Bullion (99.9% Purity)", qty: "10 kg", price: "$65,000/kg", total: "$650,000" }
        ],
        confidence: 0.96
    };
}

/**
 * Calculate Potential Duty Savings under AfCFTA
 * @param {string} hsCode 
 * @param {number} valueUSD - Estimated trade value
 */
export function calculateDutySavings(hsCode, valueUSD = 50000) {
    // Average MFN Tariff in Africa is ~18-35% depending on category
    // We'll use a conservative 25% for demo purposes
    const MFN_RATE = 0.25;
    const AFCFTA_RATE = 0.00;

    const potentialDuty = valueUSD * MFN_RATE;
    const afcftaDuty = valueUSD * AFCFTA_RATE;
    const savings = potentialDuty - afcftaDuty;

    return {
        savingsAmount: savings,
        formatted: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(savings),
        baselineRate: '25% (Avg MFN)',
        afcftaRate: '0% (Duty-Free)',
        complianceSummary: 'One-Flow Compliant'
    };
}

export default {
    predictHSCode,
    validateRoO,
    generateDutyFreeCert,
    simulateIDP,
    calculateDutySavings
};
