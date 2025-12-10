/**
 * Country Configuration System
 * Central configuration for country-specific features and targeting
 */

// Set your target country here
// Use import.meta.env for Vite (not process.env)
export const TARGET_COUNTRY = import.meta.env.VITE_TARGET_COUNTRY || 'Ghana';

// Country-specific configurations
export const COUNTRY_CONFIG = {
  Ghana: {
    name: 'Ghana',
    currency: 'GHS',
    currencySymbol: '₵',
    defaultCurrency: 'USD',
    languages: ['en'],
    timezone: 'Africa/Accra',
    phoneCode: '+233',
    popularProducts: ['cocoa', 'shea butter', 'gold', 'cashew', 'coffee', 'pineapple'],
    logisticsHubs: ['Tema', 'Takoradi', 'Accra'],
    paymentMethods: ['mobile money', 'bank transfer', 'escrow'],
    marketingHooks: {
      supplier: 'Sell your goods from Ghana to the world',
      buyer: 'Buy authentic Ghanaian products — Verified & Escrow-protected',
      logistics: 'Afrikoni Logistics Hub — Ghana'
    }
  },
  Nigeria: {
    name: 'Nigeria',
    currency: 'NGN',
    currencySymbol: '₦',
    defaultCurrency: 'USD',
    languages: ['en'],
    timezone: 'Africa/Lagos',
    phoneCode: '+234',
    popularProducts: ['crude oil', 'cocoa', 'palm oil', 'rubber', 'cashew', 'sesame'],
    logisticsHubs: ['Lagos', 'Port Harcourt', 'Onne'],
    paymentMethods: ['bank transfer', 'escrow', 'mobile money'],
    marketingHooks: {
      supplier: 'Sell your goods from Nigeria to the world',
      buyer: 'Buy authentic Nigerian products — Verified & Escrow-protected',
      logistics: 'Afrikoni Logistics Hub — Nigeria'
    }
  },
  Kenya: {
    name: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KSh',
    defaultCurrency: 'USD',
    languages: ['en', 'sw'],
    timezone: 'Africa/Nairobi',
    phoneCode: '+254',
    popularProducts: ['coffee', 'tea', 'flowers', 'avocado', 'macadamia', 'sisal'],
    logisticsHubs: ['Mombasa', 'Nairobi'],
    paymentMethods: ['mobile money', 'bank transfer', 'escrow'],
    marketingHooks: {
      supplier: 'Sell your goods from Kenya to the world',
      buyer: 'Buy authentic Kenyan products — Verified & Escrow-protected',
      logistics: 'Afrikoni Logistics Hub — Kenya'
    }
  },
  SouthAfrica: {
    name: 'South Africa',
    currency: 'ZAR',
    currencySymbol: 'R',
    defaultCurrency: 'USD',
    languages: ['en', 'af', 'zu'],
    timezone: 'Africa/Johannesburg',
    phoneCode: '+27',
    popularProducts: ['diamonds', 'gold', 'platinum', 'wine', 'citrus', 'wool'],
    logisticsHubs: ['Durban', 'Cape Town', 'Johannesburg'],
    paymentMethods: ['bank transfer', 'escrow', 'credit card'],
    marketingHooks: {
      supplier: 'Sell your goods from South Africa to the world',
      buyer: 'Buy authentic South African products — Verified & Escrow-protected',
      logistics: 'Afrikoni Logistics Hub — South Africa'
    }
  }
};

// Get current country config
export const getCountryConfig = () => {
  const countryKey = Object.keys(COUNTRY_CONFIG).find(
    key => COUNTRY_CONFIG[key].name === TARGET_COUNTRY
  ) || 'Ghana';
  return COUNTRY_CONFIG[countryKey] || COUNTRY_CONFIG.Ghana;
};

// Get country-specific marketing content
export const getMarketingContent = (type) => {
  const config = getCountryConfig();
  return config.marketingHooks[type] || config.marketingHooks.supplier;
};

// Check if feature is enabled for country
export const isCountryFeatureEnabled = (feature) => {
  const config = getCountryConfig();
  // Add feature flags here as needed
  return true; // Default: all features enabled
};

export default {
  TARGET_COUNTRY,
  COUNTRY_CONFIG,
  getCountryConfig,
  getMarketingContent,
  isCountryFeatureEnabled
};
