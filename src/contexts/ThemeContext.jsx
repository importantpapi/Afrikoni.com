import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} });

/**
 * ThemeProvider - Neutral-first theme with user preference persistence
 *
 * Default: 'light' (neutral)
 * Users can toggle between light/dark via the theme button
 * Persists choice in localStorage as 'afrikoni-theme'
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('afrikoni-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // No stored preference - default to light (neutral)
      return 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme class synchronously on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('afrikoni-theme', theme);
    } catch {
      // Storage unavailable
    }
  }, [theme]);

  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
