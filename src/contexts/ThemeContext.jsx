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
      if (!window.location.pathname.startsWith('/dashboard') &&
        !window.location.pathname.startsWith('/onboarding')) {
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
    const interval = setInterval(handleLocationChange, 100);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isAppSpace = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');

    // Theme Class
    if (isAppSpace) {
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    } else {
      root.classList.remove('dark');
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
