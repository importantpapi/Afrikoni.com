/**
 * Currency Converter Utility
 * Handles currency conversion between African currencies and major world currencies
 * Uses real-time exchange rates from exchange rate API
 */

// Common African currencies with their ISO codes and symbols
export const AFRICAN_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'International' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'International' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'International' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
  { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', country: 'Rwanda' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'West Africa' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Central Africa' },
  { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', country: 'Angola' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', country: 'Morocco' },
  { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', country: 'Tunisia' },
  { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', country: 'Algeria' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', country: 'Zambia' },
  { code: 'BWP', symbol: 'P', name: 'Botswana Pula', country: 'Botswana' },
  { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', country: 'Mozambique' },
  { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', country: 'Malawi' },
  { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar', country: 'Zimbabwe' },
  { code: 'LRD', symbol: 'L$', name: 'Liberian Dollar', country: 'Liberia' },
  { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone', country: 'Sierra Leone' },
  { code: 'GNF', symbol: 'GF', name: 'Guinean Franc', country: 'Guinea' },
  { code: 'SLE', symbol: 'Le', name: 'Sierra Leonean Leone (New)', country: 'Sierra Leone' },
  { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', country: 'DR Congo' },
  { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound', country: 'Sudan' },
  { code: 'SSP', symbol: 'SS£', name: 'South Sudanese Pound', country: 'South Sudan' },
  { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', country: 'Djibouti' },
  { code: 'SOS', symbol: 'Sh.So.', name: 'Somali Shilling', country: 'Somalia' },
  { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', country: 'Eritrea' },
  { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', country: 'Lesotho' },
  { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni', country: 'Eswatini' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', country: 'Mauritius' },
  { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', country: 'Seychelles' },
  { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', country: 'Comoros' },
  { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', country: 'São Tomé and Príncipe' },
  { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', country: 'Cape Verde' },
];

// Fallback exchange rates (updated periodically, should use API for real-time)
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1550,
  ZAR: 18.5,
  KES: 130,
  GHS: 12.5,
  EGP: 31,
  ETB: 55,
  UGX: 3800,
  TZS: 2500,
  RWF: 1200,
  XOF: 600,
  XAF: 600,
  AOA: 830,
  MAD: 10,
  TND: 3.1,
  DZD: 135,
  ZMW: 25,
  BWP: 13.5,
  MZN: 64,
  MWK: 1700,
  ZWL: 10000,
  LRD: 190,
  SLL: 23000,
  GNF: 8500,
  SLE: 23,
  CDF: 2800,
  SDG: 600,
  SSP: 1300,
  DJF: 178,
  SOS: 570,
  ERN: 15,
  LSL: 18.5,
  SZL: 18.5,
  MUR: 45,
  SCR: 13.5,
  KMF: 450,
  STN: 22,
  CVE: 101,
};

// Cache for exchange rates (valid for 1 hour)
let exchangeRateCache = {
  rates: {},
  timestamp: null,
  expiry: 3600000, // 1 hour in milliseconds
};

/**
 * Get exchange rates from API or use fallback
 */
async function getExchangeRates() {
  // Check cache
  if (exchangeRateCache.timestamp && 
      Date.now() - exchangeRateCache.timestamp < exchangeRateCache.expiry) {
    return exchangeRateCache.rates;
  }

  try {
    // Try to fetch real-time rates (using a free API)
    // Note: In production, use a proper exchange rate API with API key
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      exchangeRateCache.rates = data.rates || {};
      exchangeRateCache.timestamp = Date.now();
      return exchangeRateCache.rates;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error);
  }

  // Use fallback rates
  exchangeRateCache.rates = FALLBACK_RATES;
  exchangeRateCache.timestamp = Date.now();
  return FALLBACK_RATES;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'USD')
 * @param {string} toCurrency - Target currency code (e.g., 'NGN')
 * @returns {Promise<number>} - Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || amount <= 0) return 0;
  if (fromCurrency === toCurrency) return amount;

  try {
    const rates = await getExchangeRates();
    
    // Convert to USD first (base currency)
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
      usdAmount = amount / fromRate;
    }

    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return Math.round(usdAmount * 100) / 100; // Round to 2 decimals
    }

    const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
    const convertedAmount = usdAmount * toRate;
    
    // Round based on currency (some currencies don't use decimals)
    const decimalPlaces = ['UGX', 'TZS', 'RWF', 'SLL', 'GNF', 'CDF', 'MWK'].includes(toCurrency) ? 0 : 2;
    return Math.round(convertedAmount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Fallback: return original amount with warning
    return amount;
  }
}

/**
 * Format currency amount with symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} - Formatted string (e.g., "$1,234.56" or "₦1,234")
 */
export function formatCurrency(amount, currencyCode) {
  // Handle invalid inputs
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  if (!currencyCode) {
    currencyCode = 'USD';
  }

  const currency = AFRICAN_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) {
    // Fallback for unknown currencies
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currencyCode} ${formatted}`;
  }

  const symbol = currency.symbol;
  
  // Format number with commas
  const options = {
    minimumFractionDigits: ['UGX', 'TZS', 'RWF', 'SLL', 'GNF', 'CDF', 'MWK'].includes(currencyCode) ? 0 : 2,
    maximumFractionDigits: ['UGX', 'TZS', 'RWF', 'SLL', 'GNF', 'CDF', 'MWK'].includes(currencyCode) ? 0 : 2,
  };
  
  const formatted = new Intl.NumberFormat('en-US', options).format(amount);
  return `${symbol}${formatted}`;
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(currencyCode) {
  return AFRICAN_CURRENCIES.find(c => c.code === currencyCode) || {
    code: currencyCode,
    symbol: currencyCode,
    name: currencyCode,
    country: 'Unknown'
  };
}

/**
 * Get currency by country name
 */
export function getCurrencyByCountry(countryName) {
  const currency = AFRICAN_CURRENCIES.find(c => 
    c.country.toLowerCase() === countryName.toLowerCase()
  );
  return currency?.code || 'USD';
}

