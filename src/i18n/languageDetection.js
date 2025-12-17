/**
 * Automatic Language Detection with Priority Order
 * 
 * Priority:
 * 1. Logged-in user profile language
 * 2. Saved localStorage language (if user has manually set it)
 * 3. Delivery country / selected country
 * 4. Browser locale
 * 5. Fallback: English
 */

import { getLanguageForCountry } from './countryLanguageMap';

const LANGUAGE_STORAGE_KEY = 'afrikoni_language';
const LANGUAGE_OVERRIDE_KEY = 'afrikoni_language_override'; // Flag to disable auto-detection
const COUNTRY_STORAGE_KEY = 'afrikoni_detected_country';

/**
 * Detect browser language
 */
function detectBrowserLanguage() {
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
    };
    
    return langMap[langCode] || 'en';
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
    return 'en';
  }
}

/**
 * Get language from user profile (if logged in)
 * @param {Object} userProfile - User profile object from Supabase
 * @returns {string|null} Language code or null if not available
 */
export function getLanguageFromProfile(userProfile) {
  if (!userProfile) return null;
  
  // Check common profile fields for language preference
  if (userProfile.language) return userProfile.language;
  if (userProfile.preferred_language) return userProfile.preferred_language;
  if (userProfile.locale) return userProfile.locale;
  
  return null;
}

/**
 * Get saved language from localStorage
 * @returns {string|null} Language code or null if not saved
 */
function getSavedLanguage() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) || null;
}

/**
 * Check if user has manually overridden language (disables auto-detection)
 * @returns {boolean}
 */
export function hasLanguageOverride() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LANGUAGE_OVERRIDE_KEY) === 'true';
}

/**
 * Set language override flag (user manually selected language)
 * @param {boolean} override - Whether to enable override
 */
export function setLanguageOverride(override = true) {
  if (typeof window === 'undefined') return;
  if (override) {
    localStorage.setItem(LANGUAGE_OVERRIDE_KEY, 'true');
  } else {
    localStorage.removeItem(LANGUAGE_OVERRIDE_KEY);
  }
}

/**
 * Get language from delivery country
 * @returns {string|null} Language code or null if country not available
 */
function getLanguageFromCountry() {
  if (typeof window === 'undefined') return null;
  
  const countryCode = localStorage.getItem(COUNTRY_STORAGE_KEY);
  if (!countryCode || countryCode === 'DEFAULT') return null;
  
  return getLanguageForCountry(countryCode);
}

/**
 * Auto-detect language with priority order
 * @param {Object} options - Detection options
 * @param {Object} options.userProfile - User profile object (optional)
 * @param {string} options.deliveryCountry - Delivery country code (optional, overrides localStorage)
 * @returns {string} Detected language code
 */
export function detectLanguage({ userProfile = null, deliveryCountry = null } = {}) {
  // Priority 1: User profile language (if logged in)
  if (userProfile) {
    const profileLang = getLanguageFromProfile(userProfile);
    if (profileLang && ['en', 'fr', 'ar', 'pt'].includes(profileLang)) {
      return profileLang;
    }
  }
  
  // Priority 2: Saved language (if user has manually set it and override is enabled)
  if (hasLanguageOverride()) {
    const savedLang = getSavedLanguage();
    if (savedLang && ['en', 'fr', 'ar', 'pt'].includes(savedLang)) {
      return savedLang;
    }
  }
  
  // Priority 3: Delivery country / selected country
  const countryCode = deliveryCountry || (typeof window !== 'undefined' ? localStorage.getItem(COUNTRY_STORAGE_KEY) : null);
  if (countryCode && countryCode !== 'DEFAULT') {
    const countryLang = getLanguageForCountry(countryCode);
    if (countryLang) {
      return countryLang;
    }
  }
  
  // Priority 4: Browser locale
  const browserLang = detectBrowserLanguage();
  if (browserLang) {
    return browserLang;
  }
  
  // Priority 5: Fallback to English
  return 'en';
}

/**
 * Initialize language on app start
 * This should be called once when the app loads
 * @param {Object} options - Initialization options
 * @param {Object} options.userProfile - User profile object (optional)
 * @param {string} options.deliveryCountry - Delivery country code (optional)
 * @returns {string} Resolved language code
 */
export function initializeLanguage({ userProfile = null, deliveryCountry = null } = {}) {
  // If user has manually overridden, use saved language
  if (hasLanguageOverride()) {
    const savedLang = getSavedLanguage();
    if (savedLang && ['en', 'fr', 'ar', 'pt'].includes(savedLang)) {
      return savedLang;
    }
  }
  
  // Otherwise, auto-detect
  const detectedLang = detectLanguage({ userProfile, deliveryCountry });
  
  // Save detected language (but don't set override flag)
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLang);
  }
  
  return detectedLang;
}

/**
 * Set language with override flag
 * Call this when user manually selects a language
 * @param {string} lang - Language code
 * @param {Object} options - Options
 * @param {Object} options.userProfile - User profile to update (optional)
 */
export async function setLanguageWithOverride(lang, { userProfile = null } = {}) {
  if (typeof window === 'undefined') return;
  
  // Validate language
  if (!['en', 'fr', 'ar', 'pt'].includes(lang)) {
    console.warn(`Invalid language code: ${lang}`);
    return;
  }
  
  // Save to localStorage
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  
  // Set override flag to disable auto-detection
  setLanguageOverride(true);
  
  // Update user profile if available
  if (userProfile && userProfile.id) {
    try {
      const { supabase } = await import('@/api/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          language: lang,
          preferred_language: lang 
        })
        .eq('id', userProfile.id);
    } catch (error) {
      console.warn('Failed to update user profile language:', error);
      // Don't throw - localStorage update is sufficient
    }
  }
}

