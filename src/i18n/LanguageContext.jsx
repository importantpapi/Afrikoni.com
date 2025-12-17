import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setCurrentLanguage as saveLanguage, t } from './translations';
import { initializeLanguage, setLanguageWithOverride, hasLanguageOverride } from './languageDetection';
import { getLanguageForCountry } from './countryLanguageMap.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    // Initialize with saved language or default
    return getCurrentLanguage();
  });
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

  // Initialize language on mount and react to country changes
  useEffect(() => {
    // Initialize language on mount with auto-detection
    const initLanguage = async () => {
      try {
        // Try to get user profile if available
        let userProfile = null;
        try {
          const { supabase, supabaseHelpers } = await import('@/api/supabaseClient');
          const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
          const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
          userProfile = profile;
        } catch (error) {
          // Silently fail - user might not be logged in
        }
        
        // Get delivery country from localStorage
        const deliveryCountry = typeof window !== 'undefined' 
          ? localStorage.getItem('afrikoni_detected_country') 
          : null;
        
        // Initialize language with auto-detection
        const detectedLang = initializeLanguage({ 
          userProfile, 
          deliveryCountry 
        });
        
        setLanguageState(detectedLang);
        saveLanguage(detectedLang);
        updateHTMLAttributes(detectedLang);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        // Fallback to saved language
        const currentLang = getCurrentLanguage();
        setLanguageState(currentLang);
        saveLanguage(currentLang);
        updateHTMLAttributes(currentLang);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initLanguage();
  }, []);

  // Listen for country changes and update language automatically
  useEffect(() => {
    if (!isInitialized) return; // Wait for initial load
    
    const handleStorageChange = (e) => {
      // Only react to country changes, not language changes (to avoid loops)
      if (e.key === 'afrikoni_detected_country' && e.newValue) {
        // Check if user has manually overridden language
        if (hasLanguageOverride()) {
          return; // Don't auto-update if user has manually set language
        }
        
        // Get language for new country
        const newLang = getLanguageForCountry(e.newValue);
        
        if (newLang && newLang !== language) {
          setLanguageState(newLang);
          saveLanguage(newLang);
          updateHTMLAttributes(newLang);
        }
      }
    };
    
    // Listen for localStorage changes (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (from same tab)
    const handleCountryChange = (e) => {
      if (e.detail?.countryCode) {
        if (hasLanguageOverride()) {
          return;
        }
        
        const newLang = getLanguageForCountry(e.detail.countryCode);
        
        if (newLang && newLang !== language) {
          setLanguageState(newLang);
          saveLanguage(newLang);
          updateHTMLAttributes(newLang);
        }
      }
    };
    
    window.addEventListener('afrikoni:countryChanged', handleCountryChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('afrikoni:countryChanged', handleCountryChange);
    };
  }, [isInitialized, language]);

  const setLanguage = async (lang) => {
    // Validate language
    if (!['en', 'fr', 'ar', 'pt'].includes(lang)) {
      console.warn(`Invalid language code: ${lang}`);
      return;
    }
    
    setLanguageState(lang);
    saveLanguage(lang);
    updateHTMLAttributes(lang);
    
    // Set override flag and update user profile
    try {
      let userProfile = null;
      try {
        const { supabase, supabaseHelpers } = await import('@/api/supabaseClient');
        const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
        const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        userProfile = profile;
      } catch (error) {
        // User might not be logged in
      }
      
      await setLanguageWithOverride(lang, { userProfile });
    } catch (error) {
      console.warn('Failed to set language override:', error);
      // Continue anyway - language is already set
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
      t: (key) => key
    };
  }
  return context;
}

