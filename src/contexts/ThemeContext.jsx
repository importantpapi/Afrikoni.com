import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { }, setTheme: () => { } });

/**
 * ThemeProvider - Route-aware theme management
 *
 * DARK MODE SCOPE:
 * - Dashboard routes (/dashboard/*): Always dark mode (Trade OS aesthetic)
 * - Public routes (/, /marketplace, /login, etc.): Always light mode (premium feel)
 *
 * Users can toggle theme, but it only affects dashboard.
 * Public pages are always light for premium branding.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      // ✅ IMMEDIATE ROUTE CHECK to prevent "Dark Flash" on public pages
      if (!window.location.pathname.startsWith('/dashboard')) {
        return 'light';
      }

      const stored = localStorage.getItem('afrikoni-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // Default to dark for dashboard users
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  // Track pathname changes for route-based theming
  const [pathname, setPathname] = useState(window.location.pathname);

  // Listen for route changes (works with React Router)
  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', handleLocationChange);

    // Also check pathname periodically for SPA navigation
    const interval = setInterval(handleLocationChange, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Apply theme class based on state
  useEffect(() => {
    const root = document.documentElement;
    const isDashboard = pathname.startsWith('/dashboard');

    // ✅ STRICT THEME ENFORCEMENT:
    // Dashboard: Respects user preference (Dark/Light)
    // Public Pages: ALWAYS Light Mode (Premium Brand Standard)
    if (isDashboard) {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      // Force Light Mode on public pages regardless of preference
      root.classList.remove('dark');
    }

    // Persist theme preference
    try {
      localStorage.setItem('afrikoni-theme', theme);
    } catch {
      // Storage unavailable
    }
  }, [theme, pathname]);

  // Route-based default themes (optional: reset to specific defaults on nav)
  useEffect(() => {
    // If we want to enforce defaults per section but allow overrides:
    if (pathname.startsWith('/dashboard') && !localStorage.getItem('afrikoni-theme')) {
      setThemeState('dark');
    } else if (!pathname.startsWith('/dashboard') && !localStorage.getItem('afrikoni-theme')) {
      setThemeState('light');
    }
  }, [pathname]);

  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
