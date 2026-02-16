/**
 * Corridor Optimizer Service
 * Intel layer to select the most efficient payment rail for African trade.
 */

export const PAYMENT_RAILS = {
    PAPSS: {
        id: 'papss',
        name: 'PAPSS (Central Bank Rail)',
        type: 'RTGS',
        fee_percent: 0.5,
        speed: 'Instant',
        settlement: 'Local Currency',
        best_for: 'Avoiding USD conversion'
    },
    FLUTTERWAVE: {
        id: 'flutterwave',
        name: 'Flutterwave',
        type: 'Gateway',
        fee_percent: 2.9,
        speed: '1-3 Days',
        settlement: 'Multi-currency',
        best_for: 'Card/Mobile Money'
    },
    MPESA: {
        id: 'mpesa',
        name: 'M-Pesa / Mobile Money',
        type: 'Wallets',
        fee_percent: 1.5,
        speed: 'Instant',
        settlement: 'Local Currency',
        best_for: 'East African Corridors'
    },
    SWIFT: {
        id: 'swift',
        name: 'SWIFT / USD Rail',
        type: 'Legacy',
        fee_percent: 5.0,
        speed: '3-5 Days',
        settlement: 'USD/EUR',
        best_for: 'Large Institutional Out-of-region'
    }
};

/**
 * Recommends the optimal rail for a given corridor and amount.
 */
export function recommendRail(originCountry, destCountry, amount) {
    const corridor = `${originCountry}-${destCountry}`;

    // Logic 1: Use PAPSS for supported central bank corridors (e.g. Nigeria/Ghana/Gambia/Sierra Leone)
    const papssCorridors = ['NG-GH', 'GH-NG', 'NG-KE', 'KE-NG', 'NG-EG', 'EG-NG'];
    if (papssCorridors.includes(corridor)) {
        return {
            ...PAYMENT_RAILS.PAPSS,
            savings_vs_legacy: (PAYMENT_RAILS.SWIFT.fee_percent - PAYMENT_RAILS.PAPSS.fee_percent) * amount / 100
        };
    }

    // Logic 2: Use M-Pesa for East African Community (EAC)
    const eacCountries = ['KE', 'RW', 'UG', 'TZ'];
    if (eacCountries.includes(originCountry) && eacCountries.includes(destCountry)) {
        return PAYMENT_RAILS.MPESA;
    }

    // Default to Flutterwave for broad coverage
    return PAYMENT_RAILS.FLUTTERWAVE;
}

export default {
    recommendRail,
    PAYMENT_RAILS
};
