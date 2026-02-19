
import { getCurrencyForCountry } from "@/utils/geoDetection";

// Country code to country name mapping
export const COUNTRY_NAMES = {
    'NG': 'Nigeria', 'GH': 'Ghana', 'KE': 'Kenya', 'ZA': 'South Africa',
    'EG': 'Egypt', 'MA': 'Morocco', 'SN': 'Senegal', 'TZ': 'Tanzania',
    'ET': 'Ethiopia', 'AO': 'Angola', 'CM': 'Cameroon', 'CI': 'Côte d\'Ivoire',
    'UG': 'Uganda', 'DZ': 'Algeria', 'SD': 'Sudan', 'MZ': 'Mozambique',
    'MG': 'Madagascar', 'ML': 'Mali', 'BF': 'Burkina Faso', 'NE': 'Niger',
    'RW': 'Rwanda', 'BJ': 'Benin', 'GN': 'Guinea', 'TD': 'Chad',
    'ZW': 'Zimbabwe', 'ZM': 'Zambia', 'MW': 'Malawi', 'GA': 'Gabon',
    'BW': 'Botswana', 'GM': 'Gambia', 'GW': 'Guinea-Bissau', 'LR': 'Liberia',
    'SL': 'Sierra Leone', 'TG': 'Togo', 'MR': 'Mauritania', 'NA': 'Namibia',
    'LS': 'Lesotho', 'ER': 'Eritrea', 'DJ': 'Djibouti', 'SS': 'South Sudan',
    'CF': 'Central African Republic', 'CG': 'Republic of the Congo',
    'CD': 'DR Congo', 'ST': 'São Tomé and Príncipe', 'SC': 'Seychelles',
    'CV': 'Cape Verde', 'KM': 'Comoros', 'MU': 'Mauritius', 'SO': 'Somalia',
    'BI': 'Burundi', 'GQ': 'Equatorial Guinea', 'SZ': 'Eswatini', 'LY': 'Libya',
    'TN': 'Tunisia', 'BE': 'Belgium', 'FR': 'France', 'US': 'United States',
    'GB': 'United Kingdom', 'DEFAULT': 'International'
};

// Country flags mapping (using emoji flags)
export const COUNTRY_FLAGS = {
    'NG': '🇳🇬', 'GH': '🇬🇭', 'KE': '🇰🇪', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'MA': '🇲🇦',
    'SN': '🇸🇳', 'TZ': '🇹🇿', 'ET': '🇪🇹', 'AO': '🇦🇴', 'CM': '🇨🇲', 'CI': '🇨🇮',
    'UG': '🇺🇬', 'DZ': '🇩🇿', 'SD': '🇸🇩', 'MZ': '🇲🇿', 'MG': '🇲🇬', 'ML': '🇲🇱',
    'BF': '🇧🇫', 'NE': '🇳🇪', 'RW': '🇷🇼', 'BJ': '🇧🇯', 'GN': '🇬🇳', 'TD': '🇹🇩',
    'ZW': '🇿🇼', 'ZM': '🇿🇲', 'MW': '🇲🇼', 'GA': '🇬🇦', 'BW': '🇧🇼', 'GM': '🇬🇲',
    'GW': '🇬🇼', 'LR': '🇱🇷', 'SL': '🇸🇱', 'TG': '🇹🇬', 'MR': '🇲🇷', 'NA': '🇳🇦',
    'LS': '🇱🇸', 'ER': '🇪🇷', 'DJ': '🇩🇯', 'SS': '🇸🇸', 'CF': '🇨🇫', 'CG': '🇨🇬',
    'CD': '🇨🇩', 'ST': '🇸🇹', 'SC': '🇸🇨', 'CV': '🇨🇻', 'KM': '🇰🇲', 'MU': '🇲🇺',
    'SO': '🇸🇴', 'BI': '🇧🇮', 'GQ': '🇬🇶', 'SZ': '🇸🇿', 'LY': '🇱🇾', 'TN': '🇹🇳',
    'BE': '🇧🇪', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
    'PT': '🇵🇹', 'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦', 'BR': '🇧🇷', 'CN': '🇨🇳',
    'IN': '🇮🇳', 'AE': '🇦🇪', 'SA': '🇸🇦', 'DEFAULT': '🌍'
};

// All available countries for selection
export const ALL_COUNTRIES = Object.keys(COUNTRY_NAMES).filter(key => key !== 'DEFAULT').map(code => ({
    code,
    name: COUNTRY_NAMES[code],
    flag: COUNTRY_FLAGS[code] || '🌍',
    currency: getCurrencyForCountry(code)
}));
