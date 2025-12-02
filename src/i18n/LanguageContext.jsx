import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setCurrentLanguage as saveLanguage, t } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getCurrentLanguage());

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
    // Initialize language on mount
    const currentLang = getCurrentLanguage();
    setLanguageState(currentLang);
    saveLanguage(currentLang);
    // Set HTML attributes
    updateHTMLAttributes(currentLang);
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    saveLanguage(lang);
    updateHTMLAttributes(lang);
  };

  const translate = (key) => t(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
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

