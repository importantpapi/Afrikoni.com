/**
 * GEO-INTELLIGENCE UTILITY
 *
 * Detects user country via free IP-based geolocation.
 * No API keys exposed in the client bundle.
 */

export async function getCountryCodeFromCoords(lat, lng) {
    // 1. If coords provided, try free reverse geocoding via BigDataCloud (no API key needed)
    if (lat !== undefined && lng !== undefined) {
        try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.countryCode) {
                return data.countryCode;
            }
        } catch {
            // Fall through to IP-based fallback
        }
    }

    // 2. Fallback: Free IP-based Geolocation (ipapi.co)
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
            return data.country_code;
        }
    } catch {
        // Silent fail - geo detection is optional
    }

    return null;
}

export const TRADE_BLOCS = {
    ECOWAS: ['NG', 'GH', 'SN', 'CI', 'BJ', 'BF', 'CV', 'GM', 'GN', 'GW', 'LR', 'ML', 'NE', 'SL', 'TG'],
    EAC: ['KE', 'TZ', 'UG', 'RW', 'BI', 'SS', 'CD', 'SO'],
    SADC: ['ZA', 'AO', 'BW', 'CD', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'SZ', 'TZ', 'ZM', 'ZW'],
    MAGHREB: ['DZ', 'MA', 'TN', 'LY', 'MR']
};

export function getTradeBloc(countryCode) {
    if (!countryCode) return null;
    for (const [bloc, countries] of Object.entries(TRADE_BLOCS)) {
        if (countries.includes(countryCode)) return bloc;
    }
    return 'AFRICA';
}
