/**
 * Country to Language Mapping
 * Maps country codes to their primary language for automatic language detection
 */

export const COUNTRY_LANGUAGE_MAP = {
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
  'ET': 'en', // Ethiopia (Amharic, but English common)
  'RW': 'en', // Rwanda (Kinyarwanda, but English common)
  
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
  'CD': 'fr', // DR Congo
  'BI': 'fr', // Burundi
  'GN': 'fr', // Guinea
  
  // Arabic-speaking African countries
  'DZ': 'ar', // Algeria
  'MA': 'ar', // Morocco
  'TN': 'ar', // Tunisia
  'LY': 'ar', // Libya
  'EG': 'ar', // Egypt
  'SD': 'ar', // Sudan
  'SS': 'ar', // South Sudan
  'SO': 'ar', // Somalia
  'ER': 'ar', // Eritrea
  
  // Portuguese-speaking African countries
  'AO': 'pt', // Angola
  'MZ': 'pt', // Mozambique
  'CV': 'pt', // Cape Verde
  'ST': 'pt', // São Tomé and Príncipe
  
  // European countries (for HQ and international users)
  'BE': 'fr', // Belgium (French-speaking region)
  'FR': 'fr', // France
  'PT': 'pt', // Portugal
  'GB': 'en', // United Kingdom
  'DE': 'en', // Germany (default to English)
  'IT': 'en', // Italy (default to English)
  'ES': 'en', // Spain (default to English)
  'NL': 'en', // Netherlands (default to English)
  
  // Default fallback
  'DEFAULT': 'en'
};

/**
 * Get language for a country code
 * @param {string} countryCode - ISO country code (e.g., 'NG', 'FR', 'MA')
 * @returns {string} Language code ('en', 'fr', 'ar', 'pt')
 */
export function getLanguageForCountry(countryCode) {
  if (!countryCode) return 'en';
  return COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()] || COUNTRY_LANGUAGE_MAP['DEFAULT'];
}

/**
 * Get all countries for a language
 * @param {string} lang - Language code ('en', 'fr', 'ar', 'pt')
 * @returns {string[]} Array of country codes
 */
export function getCountriesForLanguage(lang) {
  return Object.keys(COUNTRY_LANGUAGE_MAP).filter(
    code => COUNTRY_LANGUAGE_MAP[code] === lang && code !== 'DEFAULT'
  );
}

