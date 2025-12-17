import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setCurrentLanguage as saveLanguage, t } from './translations';
import { initializeLanguage, setLanguageWithOverride } from './languageDetection';

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

