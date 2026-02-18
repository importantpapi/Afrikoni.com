/**
 * THE FORENSIC SENTINEL
 * 
 * "The Watchdog" of the Afrikoni Trade Protocol.
 * Responsible for:
 * 1. Visual Cryptographic Hashing of products (Trade DNA).
 * 2. Leakage Prevention (blocking off-platform contact sharing).
 * 3. Dispute Arbitration via DNA comparison.
 */

// Basic Security Warning Message
export const SECURITY_ALERT = {
    title: 'Security Alert: Leakage Detected',
    message: 'Warning: Moving off-platform voids your $1.2M Insurance and the Tax Shield. Risk of capital loss: High. Stay on the Rail for 100% protection.',
    action: 'ack_warning'
};

/**
 * Generate a Visual Cryptographic Hash (Trade DNA) from product features
 * @param {Object} productData 
 */
export async function generateTradeDNA(productData) {
    // DNA V2: Instant Deterministic Generation
    // No artificial delay

    const input = JSON.stringify(productData);

    // Simple hash for demo (in production, use SHA-256)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');

    return {
        dnaHash: `AFK-${hexHash}-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        integrityScore: 100,
        visualFingerprint: 'Generated' // Placeholder for visual/image hash
    };
}

/**
 * PHASE 2: Heritage DNA (Visual Cryptographic Hash)
 * Simulates Computer Vision extraction of "tectonic intelligibility"
 */
export async function generateHeritageDNA(imageUrl) {
    // VISUAL DNA V2: Deterministic Hash only
    // No fake AI confidence scores
    const simpleHash = imageUrl.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const hexHash = Math.abs(simpleHash).toString(16).toUpperCase().padStart(8, '0');

    return {
        hash: `VISUAL-${hexHash}`,
        features: ['Pending Analysis'],
        confidence: 0 // Honest confidence
    };
}

/**
 * COMPARES arrival photo to baseline hash
 * @param {string} arrivalPhotoUrl
 * @param {string} baselineHash
 */
export async function verifyHeritageDNA(arrivalPhotoUrl, baselineHash) {
    // VERIFICATION V2: Honest Pending State
    // We do not auto-pass anything based on random numbers.

    return {
        match: false,
        score: "0.00",
        autoRelease: false,
        reason: 'Pending Manual Visual Verification'
    };
}

/**
 * Scan text for Leakage (Off-platform contact info)
 * @param {string} text 
 */
export function scanForLeakage(text) {
    if (!text) return { detected: false };

    // Patterns for Phone, Email, Handles
    const PATTERNS = [
        /(\+\d{1,3}[- ]?)?\d{10}/, // Phone
        /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/, // Email
        /whatsapp/i,
        /watsapp/i,
        /call me/i,
        /dm me/i
    ];

    for (const pattern of PATTERNS) {
        if (pattern.test(text)) {
            return {
                detected: true,
                type: 'contact_leakage',
                riskLevel: 'HIGH',
                warning: SECURITY_ALERT
            };
        }
    }

    return { detected: false };
}

/**
 * Arbitrate Dispute: Compare Baseline DNA vs Evidence DNA
 * @param {string} baselineHash 
 * @param {string} evidenceHash 
 */
export function arbitrateDispute(baselineHash, evidenceHash) {
    const match = baselineHash === evidenceHash;

    return {
        match,
        confidence: match ? 100 : 0,
        verdict: match ? 'AUTHENTIC' : 'COUNTERFEIT_SUSPECTED'
    };
}

/**
 * Downgrade Trust Score based on infraction
 * @param {string} reason 
 */
export function downgradeTrustScore(reason) {
    const PENALTIES = {
        'leakage': 25,
        'document_fraud': 100,
        'late_shipment': 10
    };

    const penalty = PENALTIES[reason] || 5;

    return {
        penalty,
        newRiskScore: penalty, // Simplified for demo
        warning: `Trust Score downgraded by ${penalty} points due to ${reason}.`
    };
}

export default {
    generateTradeDNA,
    generateHeritageDNA,
    verifyHeritageDNA,
    scanForLeakage,
    arbitrateDispute,
    downgradeTrustScore,
    SECURITY_ALERT
};
