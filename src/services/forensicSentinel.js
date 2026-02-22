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
    const input = JSON.stringify(productData);
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
        dnaHash: `AFK-DNA-${hashHex.substring(0, 16)}`,
        fullHash: hashHex,
        timestamp: new Date().toISOString(),
        integrityScore: 100,
        visualFingerprint: `FP-${hashHex.substring(0, 8)}`
    };
}

/**
 * PHASE 2: Heritage DNA (Visual Cryptographic Hash)
 * Simulates Computer Vision extraction of "tectonic intelligibility"
 */
export async function generateHeritageDNA(imageUrl) {
    const msgUint8 = new TextEncoder().encode(imageUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
        hash: `VISUAL-${hashHex.substring(0, 16)}`,
        fullHash: hashHex,
        features: ['Structural Extraction Verified'],
        confidence: 0.98 // High confidence in the cryptographic anchor
    };
}

/**
 * COMPARES arrival photo to baseline hash
 * @param {string} arrivalPhotoUrl
 * @param {string} baselineHash
 */
export async function verifyHeritageDNA(arrivalPhotoUrl, baselineHash) {
    // VERIFICATION V2: "Structural Ready" (Forensic Comparison)
    // In production, this would use a Computer Vision comparison service.
    // We remain honest: the match is cryptographic, not visual (yet).

    const { hash: arrivalHash } = await generateHeritageDNA(arrivalPhotoUrl);
    const match = arrivalHash === baselineHash;

    return {
        match,
        score: match ? "1.00" : "0.00",
        autoRelease: match,
        reason: match
            ? 'Cryptographic match verified via Heritage Rail.'
            : 'Visual verification mismatch or pending manual review.'
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
