/**
 * Geo Detection Utility
 * Automatically detects user's country, language, and currency based on browser settings and IP
 */

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP = {
  // African countries
  'NG': 'NGN', // Nigeria
  'GH': 'GHS', // Ghana
  'KE': 'KES', // Kenya
  'ZA': 'ZAR', // South Africa
  'EG': 'EGP', // Egypt
  'MA': 'MAD', // Morocco
  'SN': 'XOF', // Senegal
  'TZ': 'TZS', // Tanzania
  'ET': 'ETB', // Ethiopia
  'AO': 'AOA', // Angola
  'CM': 'XAF', // Cameroon
  'CI': 'XOF', // Côte d'Ivoire
  'UG': 'UGX', // Uganda
  'DZ': 'DZD', // Algeria
  'SD': 'SDG', // Sudan
  'MZ': 'MZN', // Mozambique
  'MG': 'MGA', // Madagascar
  'ML': 'XOF', // Mali
  'BF': 'XOF', // Burkina Faso
  'NE': 'XOF', // Niger
  'RW': 'RWF', // Rwanda
  'BJ': 'XOF', // Benin
  'GN': 'GNF', // Guinea
  'TD': 'XAF', // Chad
  'ZW': 'ZWL', // Zimbabwe
  'ZM': 'ZMW', // Zambia
  'MW': 'MWK', // Malawi
  'AO': 'AOA', // Angola
  'GA': 'XAF', // Gabon
  'BW': 'BWP', // Botswana
  'GM': 'GMD', // Gambia
  'GW': 'XOF', // Guinea-Bissau
  'LR': 'LRD', // Liberia
  'SL': 'SLL', // Sierra Leone
  'TG': 'XOF', // Togo
  'MR': 'MRU', // Mauritania
  'NA': 'NAD', // Namibia
  'LS': 'LSL', // Lesotho
  'ER': 'ERN', // Eritrea
  'DJ': 'DJF', // Djibouti
  'SS': 'SSP', // South Sudan
  'CF': 'XAF', // Central African Republic
  'CG': 'XAF', // Republic of the Congo
  'CD': 'CDF', // DR Congo
  'ST': 'STN', // São Tomé and Príncipe
  'SC': 'SCR', // Seychelles
  'CV': 'CVE', // Cape Verde
  'KM': 'KMF', // Comoros
  'MU': 'MUR', // Mauritius
  'SO': 'SOS', // Somalia
  'BI': 'BIF', // Burundi
  'GQ': 'XAF', // Equatorial Guinea
  'SZ': 'SZL', // Eswatini
  'LY': 'LYD', // Libya
  'TN': 'TND', // Tunisia
  // European countries (for Belgium HQ)
  'BE': 'EUR', // Belgium
  'FR': 'EUR', // France
  'DE': 'EUR', // Germany
  'IT': 'EUR', // Italy
  'ES': 'EUR', // Spain
  'NL': 'EUR', // Netherlands
  'PT': 'EUR', // Portugal
  'GB': 'GBP', // United Kingdom
  // Americas
  'US': 'USD', // United States
  'CA': 'CAD', // Canada
  'BR': 'BRL', // Brazil
  // Asia
  'CN': 'CNY', // China
  'IN': 'INR', // India
  'AE': 'AED', // UAE
  'SA': 'SAR', // Saudi Arabia
  // Default
  'DEFAULT': 'USD'
};

// Trade Bloc Mapping
export const TRADE_BLOC_MAP = {
  'EAC': ['KE', 'TZ', 'UG', 'RW', 'BI', 'SS', 'CD'],
  'ECOWAS': ['NG', 'GH', 'SN', 'CI', 'BJ', 'BF', 'CV', 'GM', 'GN', 'GW', 'LR', 'ML', 'NE', 'SL', 'TG'],
  'SADC': ['ZA', 'ZW', 'MZ', 'AO', 'BW', 'KM', 'LS', 'MG', 'MW', 'MU', 'NA', 'SC', 'SZ', 'TZ', 'ZM'],
  'MAGHREB': ['MA', 'DZ', 'TN', 'LY', 'MR'],
  'AFCFTA': ['NG', 'KE', 'ZA', 'EG', 'MA', 'GH', 'ET', 'TZ', 'UG', 'SN', 'CI', 'CM', 'RW', 'DZ', 'TN'] // Simplified all-Africa
};

// Country to language mapping
const COUNTRY_LANGUAGE_MAP = {
  // English-speaking African countries
  'NG': 'en', // Nigeria
  'GH': 'en', // Ghana
  'KE': 'en', // Kenya
  'ZA': 'en', // South Africa
  'UG': 'en', // Uganda
  'TZ': 'en', // Tanzania
  'ZW': 'en', // Zimbabwe
  'ZM': 'en', // Zambia
  'MW': 'en', // Malawi
  'BW': 'en', // Botswana
  'LS': 'en', // Lesotho
  'SZ': 'en', // Eswatini
  'NA': 'en', // Namibia
  'GM': 'en', // Gambia
  'SL': 'en', // Sierra Leone
  'LR': 'en', // Liberia
  'SC': 'en', // Seychelles
  'MU': 'en', // Mauritius
  // French-speaking African countries
  'SN': 'fr', // Senegal
  'CI': 'fr', // Côte d'Ivoire
  'CM': 'fr', // Cameroon
  'ML': 'fr', // Mali
  'BF': 'fr', // Burkina Faso
  'NE': 'fr', // Niger
  'BJ': 'fr', // Benin
  'TG': 'fr', // Togo
  'GW': 'fr', // Guinea-Bissau
  'TD': 'fr', // Chad
  'GA': 'fr', // Gabon
  'CG': 'fr', // Republic of the Congo
  'CF': 'fr', // Central African Republic
  'GQ': 'fr', // Equatorial Guinea
  'DJ': 'fr', // Djibouti
  'MR': 'fr', // Mauritania
  'MG': 'fr', // Madagascar
  'KM': 'fr', // Comoros
  'DZ': 'ar', // Algeria
  'MA': 'ar', // Morocco
  'TN': 'ar', // Tunisia
  'LY': 'ar', // Libya
  'EG': 'ar', // Egypt
  'SD': 'ar', // Sudan
  'SS': 'ar', // South Sudan
  'SO': 'ar', // Somalia
  'AO': 'pt', // Angola
  'MZ': 'pt', // Mozambique
  'CV': 'pt', // Cape Verde
  'ST': 'pt', // São Tomé and Príncipe
  'GW': 'pt', // Guinea-Bissau (also Portuguese)
  'ET': 'en', // Ethiopia (Amharic, but English common)
  'ER': 'ar', // Eritrea
  'CD': 'fr', // DR Congo
  'BI': 'fr', // Burundi
  'RW': 'en', // Rwanda (Kinyarwanda, but English common)
  'GN': 'fr', // Guinea
  // European countries
  'BE': 'en', // Belgium (default to English for international)
  'FR': 'fr', // France
  'DE': 'en', // Germany (default to English)
  'IT': 'en', // Italy (default to English)
  'ES': 'en', // Spain (default to English)
  'NL': 'en', // Netherlands (default to English)
  'PT': 'pt', // Portugal
  'GB': 'en', // United Kingdom
  // Default
  'DEFAULT': 'en'
};

/**
 * Get the trade bloc for a country
 * @param {string} countryCode 
 * @returns {string|null}
 */
export function getTradeBloc(countryCode) {
  for (const [bloc, countries] of Object.entries(TRADE_BLOC_MAP)) {
    if (countries.includes(countryCode)) return bloc;
  }
  return null;
}

/**
 * Detect user's country using Google Maps Geolocation API or fallback to Timezone
 */
export async function detectCountry() {
  if (typeof window === 'undefined') return 'DEFAULT';

  // 1. Try Google Maps Geolocation if API Key is present
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      // Get lat/lng from browser
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using Google Maps
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        // Find the country component
        const countryComponent = data.results[0]?.address_components.find(
          comp => comp.types.includes('country')
        );
        if (countryComponent?.short_name) {
          return countryComponent.short_name;
        }
      }
    } catch (error) {
      console.warn('Google Geolocation failed, falling back to timezone:', error.message);
    }
  }

  // 2. Fallback to Timezone-based detection (No CORS issues)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Africa/')) {
      const city = timezone.split('/')[1];
      const cityToCountry = {
        'Lagos': 'NG', 'Accra': 'GH', 'Nairobi': 'KE', 'Cairo': 'EG',
        'Casablanca': 'MA', 'Dakar': 'SN', 'Dar_es_Salaam': 'TZ',
        'Addis_Ababa': 'ET', 'Luanda': 'AO', 'Kinshasa': 'CD',
        'Abidjan': 'CI', 'Kampala': 'UG', 'Algiers': 'DZ',
        'Khartoum': 'SD', 'Maputo': 'MZ', 'Antananarivo': 'MG',
        'Bamako': 'ML', 'Ouagadougou': 'BF', 'Niamey': 'NE',
        'Kigali': 'RW', 'Porto-Novo': 'BJ', 'Conakry': 'GN',
        'Ndjamena': 'TD', 'Harare': 'ZW', 'Lusaka': 'ZM',
        'Lilongwe': 'MW', 'Banjul': 'GM', 'Monrovia': 'LR',
        'Freetown': 'SL', 'Lome': 'TG', 'Nouakchott': 'MR',
        'Windhoek': 'NA', 'Maseru': 'LS', 'Asmara': 'ER',
        'Djibouti': 'DJ', 'Juba': 'SS', 'Bangui': 'CF',
        'Brazzaville': 'CG', 'Malabo': 'GQ', 'Mbabane': 'SZ',
        'Tripoli': 'LY', 'Tunis': 'TN', 'Johannesburg': 'ZA'
      };
      if (cityToCountry[city]) {
        return cityToCountry[city];
      }
    }

    // Quick checks for major regions
    if (timezone.includes('Europe/Brussels')) return 'BE';
    if (timezone.includes('Europe/Paris')) return 'FR';
    if (timezone.includes('Europe/London')) return 'GB';
    if (timezone.includes('America/New_York')) return 'US';
  } catch (e) {
    // Ignore errors in fallback
  }

  return 'DEFAULT';
}

/**
 * Detect user's language from browser settings
 */
export function detectLanguage() {
  try {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Map browser language to our supported languages
    const langMap = {
      'en': 'en',
      'fr': 'fr',
      'ar': 'ar',
      'pt': 'pt',
      'es': 'en', // Spanish -> English (not supported yet)
      'de': 'en', // German -> English
      'it': 'en', // Italian -> English
      'nl': 'en', // Dutch -> English
      'zh': 'en', // Chinese -> English
      'ja': 'en', // Japanese -> English
      'ko': 'en', // Korean -> English
      'ru': 'en', // Russian -> English
      'hi': 'en', // Hindi -> English
      'sw': 'en', // Swahili -> English
      'am': 'en', // Amharic -> English
      'yo': 'en', // Yoruba -> English
      'ha': 'en', // Hausa -> English
      'zu': 'en', // Zulu -> English
      'af': 'en', // Afrikaans -> English
      'xh': 'en', // Xhosa -> English
    };

    return langMap[langCode] || 'en';
  } catch (error) {
    console.warn('Failed to detect language:', error);
    return 'en';
  }
}

/**
 * Get currency based on country code
 */
export function getCurrencyForCountry(countryCode) {
  return COUNTRY_CURRENCY_MAP[countryCode] || COUNTRY_CURRENCY_MAP['DEFAULT'];
}

/**
 * Get language based on country code
 */
export function getLanguageForCountry(countryCode) {
  return COUNTRY_LANGUAGE_MAP[countryCode] || COUNTRY_LANGUAGE_MAP['DEFAULT'];
}

/**
 * Auto-detect user's country, language, and currency
 */
export async function autoDetectUserPreferences() {
  const countryCode = await detectCountry();
  const browserLanguage = detectLanguage();
  const countryLanguage = getLanguageForCountry(countryCode);
  const currency = getCurrencyForCountry(countryCode);

  // Prefer country-based language over browser language for African countries
  const finalLanguage = countryCode !== 'DEFAULT' ? countryLanguage : browserLanguage;

  return {
    countryCode,
    language: finalLanguage,
    currency,
    detected: true
  };
}

