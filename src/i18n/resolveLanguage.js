/**
 * Single Language Resolver
 * 
 * This is the ONLY function that determines which language to use.
 * Priority:
 * 1. Manual override (user explicitly selected)
 * 2. Country code (cultural language of selected country)
 * 3. User profile language
 * 4. Browser language
 * 5. Fallback: English
 * 
 * CRITICAL: English must NEVER override country-based language unless explicitly chosen.
 */

import { getLanguageForCountry } from './countryLanguageMap.js';

const MANUAL_OVERRIDE_KEY = 'afrikoni_language_override';
const MANUAL_LANGUAGE_KEY = 'afrikoni_language_manual';

/**
 * Check if user has manually overridden language
 */
export function hasManualOverride() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MANUAL_OVERRIDE_KEY) === 'true';
}

/**
 * Get manually selected language
 */
export function getManualLanguage() {
  if (typeof window === 'undefined') return null;
  if (hasManualOverride()) {
    return localStorage.getItem(MANUAL_LANGUAGE_KEY) || null;
  }
  return null;
}

/**
 * Set manual language override
 */
export function setManualLanguage(lang) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANUAL_OVERRIDE_KEY, 'true');
  localStorage.setItem(MANUAL_LANGUAGE_KEY, lang);
}

/**
 * Clear manual language override
 */
export function clearManualOverride() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MANUAL_OVERRIDE_KEY);
  localStorage.removeItem(MANUAL_LANGUAGE_KEY);
}

/**
 * Get language from user profile
 */
function getProfileLanguage(userProfile) {
  if (!userProfile) return null;
  if (userProfile.language) return userProfile.language;
  if (userProfile.preferred_language) return userProfile.preferred_language;
  if (userProfile.locale) return userProfile.locale;
  return null;
}

/**
 * Get browser language
 */
function getBrowserLanguage() {
  if (typeof window === 'undefined') return null;
  try {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Map to supported languages
    const supported = ['en', 'fr', 'ar', 'pt'];
    if (supported.includes(langCode)) {
      return langCode;
    }
    
    // Map common languages to supported ones
    const langMap = {
      'es': 'en', // Spanish -> English
      'de': 'en', // German -> English
      'it': 'en', // Italian -> English
      'nl': 'en', // Dutch -> English
    };
    
    return langMap[langCode] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Resolve language with priority order
 * 
 * @param {Object} options
 * @param {string} options.manualOverride - Manually selected language (if any)
 * @param {string} options.countryCode - Selected country code
 * @param {Object} options.userProfile - User profile object
 * @param {string} options.browserLang - Browser language (optional, will be detected if not provided)
 * @returns {string} Resolved language code
 */
export function resolveLanguage({
  manualOverride = null,
  countryCode = null,
  userProfile = null,
  browserLang = null
} = {}) {
  // Priority 1: Manual override (user explicitly selected)
  const manualLang = manualOverride || getManualLanguage();
  if (manualLang && ['en', 'fr', 'ar', 'pt'].includes(manualLang)) {
    return manualLang;
  }
  
  // Priority 2: Country code (cultural language of selected country)
  // CRITICAL: This must come before browser/user profile to respect country culture
  if (countryCode && countryCode !== 'DEFAULT') {
    const countryLang = getLanguageForCountry(countryCode);
    if (countryLang && ['en', 'fr', 'ar', 'pt'].includes(countryLang)) {
      return countryLang;
    }
  }
  
  // Priority 3: User profile language
  const profileLang = getProfileLanguage(userProfile);
  if (profileLang && ['en', 'fr', 'ar', 'pt'].includes(profileLang)) {
    return profileLang;
  }
  
  // Priority 4: Browser language
  const detectedBrowserLang = browserLang || getBrowserLanguage();
  if (detectedBrowserLang && ['en', 'fr', 'ar', 'pt'].includes(detectedBrowserLang)) {
    return detectedBrowserLang;
  }
  
  // Priority 5: Fallback to English
  return 'en';
}

