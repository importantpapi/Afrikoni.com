/**
 * Language Context - Single Source of Truth
 * 
 * Architecture:
 * - Uses resolveLanguage() as the ONLY resolver
 * - Runs on mount and when country changes
 * - NEVER falls back to stored language during init
 * - Country changes trigger immediate language update (unless manual override)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCurrentLanguage as saveLanguage, t } from './translations';
import { resolveLanguage, hasManualOverride, setManualLanguage, clearManualOverride } from './resolveLanguage.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en'); // Start with default, will resolve immediately
  const [isInitialized, setIsInitialized] = useState(false);

  const updateHTMLAttributes = (lang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    }
  };

  /**
   * Set resolved language and update all systems
   */
  const setResolvedLanguage = (lang) => {
    if (!['en', 'fr', 'ar', 'pt'].includes(lang)) {
      console.warn(`Invalid language code: ${lang}`);
      return;
    }
    
    setLanguageState(lang);
    saveLanguage(lang);
    updateHTMLAttributes(lang);
  };

  /**
   * Initialize language on mount - SINGLE EFFECT
   */
  useEffect(() => {
    const initLanguage = async () => {
      try {
        // Get manual override
        const manualOverride = hasManualOverride() ? localStorage.getItem('afrikoni_language_manual') : null;
        
        // Get country code
        const countryCode = typeof window !== 'undefined' 
          ? localStorage.getItem('afrikoni_detected_country') 
          : null;
        
        // Get user profile if available
        let userProfile = null;
        try {
          const { supabase, supabaseHelpers } = await import('@/api/supabaseClient');
          const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
          const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
          userProfile = profile;
        } catch (error) {
          // Silently fail - user might not be logged in
        }
        
        // Resolve language using single resolver
        const resolvedLang = resolveLanguage({
          manualOverride,
          countryCode,
          userProfile
        });
        
        // Set resolved language
        setResolvedLanguage(resolvedLang);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        // Fallback to English only on error
        setResolvedLanguage('en');
      } finally {
        setIsInitialized(true);
      }
    };
    
    initLanguage();
  }, []);

  /**
   * Listen for country changes and re-resolve language
   */
  useEffect(() => {
    if (!isInitialized) return; // Wait for initial load
    
    const handleCountryChange = async (e) => {
      // Check if user has manually overridden
      if (hasManualOverride()) {
        return; // Don't change language if manually overridden
      }
      
      const countryCode = e.detail?.countryCode || 
        (typeof window !== 'undefined' ? localStorage.getItem('afrikoni_detected_country') : null);
      
      if (!countryCode || countryCode === 'DEFAULT') return;
      
      try {
        // Get user profile if available
        let userProfile = null;
        try {
          const { supabase, supabaseHelpers } = await import('@/api/supabaseClient');
          const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
          const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
          userProfile = profile;
        } catch (error) {
          // Silently fail
        }
        
        // Re-resolve language with new country
        const resolvedLang = resolveLanguage({
          countryCode,
          userProfile
        });
        
        // Update language immediately
        if (resolvedLang !== language) {
          setResolvedLanguage(resolvedLang);
        }
      } catch (error) {
        console.warn('Failed to update language on country change:', error);
      }
    };
    
    // Listen for custom country change event
    window.addEventListener('afrikoni:countryChanged', handleCountryChange);
    
    // Also listen for localStorage changes (cross-tab)
    const handleStorageChange = (e) => {
      if (e.key === 'afrikoni_detected_country' && e.newValue) {
        handleCountryChange({ detail: { countryCode: e.newValue } });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('afrikoni:countryChanged', handleCountryChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isInitialized, language]);

  /**
   * Set language (when user manually selects)
   */
  const setLanguage = async (lang) => {
    if (!['en', 'fr', 'ar', 'pt'].includes(lang)) {
      console.warn(`Invalid language code: ${lang}`);
      return;
    }
    
    // Set manual override
    setManualLanguage(lang);
    
    // Update language
    setResolvedLanguage(lang);
    
    // Update user profile if available
    try {
      const { supabase, supabaseHelpers } = await import('@/api/supabaseClient');
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ 
            language: lang,
            preferred_language: lang 
          })
          .eq('id', profile.id);
      }
    } catch (error) {
      // Silently fail - localStorage update is sufficient
    }
  };

  const translate = (key) => t(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate, isInitialized }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => key,
      isInitialized: false
    };
  }
  return context;
}
