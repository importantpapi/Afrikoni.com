import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  palette: 'gold',
  toggleTheme: () => { },
  setTheme: () => { },
  setPalette: () => { }
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const pathParts = window.location.pathname.split('/');
      const isAppSpace = pathParts.includes('dashboard') || pathParts.includes('onboarding');
      if (!isAppSpace) {
        return 'light';
      }
      const stored = localStorage.getItem('afrikoni-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [palette, setPaletteState] = useState(() => {
    try {
      const stored = localStorage.getItem('afrikoni-palette');
      const validPalettes = ['gold', 'cobalt', 'emerald', 'crimson'];
      if (validPalettes.includes(stored)) return stored;
      return 'gold';
    } catch {
      return 'gold';
    }
  });

  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);

    // Intercept pushState/replaceState to detect SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const pathParts = pathname.split('/');
    const isAppSpace = pathParts.includes('dashboard') || pathParts.includes('onboarding');

    // Theme Class — single source of truth for dark/light
    if (isAppSpace && theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Palette Class
    root.classList.forEach(className => {
      if (className.startsWith('palette-')) root.classList.remove(className);
    });
    root.classList.add(`palette-${palette}`);

    try {
      localStorage.setItem('afrikoni-theme', theme);
      localStorage.setItem('afrikoni-palette', palette);
    } catch { }
  }, [theme, palette, pathname]);

  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  const setTheme = (t) => setThemeState(t);
  const setPalette = (p) => setPaletteState(p);

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
