import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCurrentLanguage, setCurrentLanguage as saveLanguage, t } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Supported languages
  const supportedLangs = ['en', 'fr', 'pt', 'ar'];

  // Detect language from path (e.g., /pt/marketplace -> pt)
  const getLangFromPath = () => {
    const pathParts = location.pathname.split('/');
    const firstPart = pathParts[1];
    if (supportedLangs.includes(firstPart)) {
      return firstPart;
    }
    return null;
  };

  const [language, setLanguageState] = useState(getLangFromPath() || getCurrentLanguage());

  const updateHTMLAttributes = (lang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  };

  // Sync state when URL changes
  useEffect(() => {
    const langFromUrl = getLangFromPath();
    if (langFromUrl && langFromUrl !== language) {
      setLanguageState(langFromUrl);
      saveLanguage(langFromUrl);
      updateHTMLAttributes(langFromUrl);
    } else if (!langFromUrl && location.pathname !== '/') {
      // If no lang prefix (except home), we might want to stay on current lang or redirect
      // For 2026 Blueprint, we'll keep the current state but ideally we should redirect to /en/...
      updateHTMLAttributes(language);
    } else {
      updateHTMLAttributes(language);
    }
  }, [location.pathname]);

  const setLanguage = (lang) => {
    if (!supportedLangs.includes(lang)) return;

    setLanguageState(lang);
    saveLanguage(lang);
    updateHTMLAttributes(lang);

    // Update URL to include subdirectory (2026 Authority Blueprint)
    const pathParts = location.pathname.split('/');
    if (supportedLangs.includes(pathParts[1])) {
      pathParts[1] = lang;
    } else {
      pathParts.splice(1, 0, lang);
    }
    navigate(pathParts.join('/') || `/${lang}`, { replace: true });
  };

  const translate = (key, options) => t(key, language, options);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t: translate,
      i18n: {
        isInitialized: true,
        supportedLanguages: supportedLangs
      }
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => { },
      t: (key) => key,
      i18n: { isInitialized: true }
    };
  }
  return context;
}

