import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls to top of page on route change
 * This ensures that when users click links/buttons, they always start at the top of the new page
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  // Aggressive scroll-to-top on any pathname change
  useEffect(() => {
    // Scroll to top INSTANTLY when route changes (no smooth animation)
    // Multiple methods for maximum browser compatibility
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    // Immediate scroll
    scrollToTop();
    
    // Also scroll after a tiny delay to catch any async rendering
    const timeoutId = setTimeout(scrollToTop, 10);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Handle hash links separately
  useEffect(() => {
    if (hash) {
      // Skip OAuth callback hashes (they contain access_token, expires_at, etc.)
      // These are not CSS selectors and will cause querySelector errors
      // Check for OAuth tokens in hash (can be in format #access_token=... or #/access_token=...)
      const hashWithoutSlash = hash.replace(/^#\/?/, '');
      const isOAuthCallback = hashWithoutSlash.includes('access_token') || 
                             hashWithoutSlash.includes('expires_at') || 
                             hashWithoutSlash.includes('provider_token') ||
                             hashWithoutSlash.includes('refresh_token') ||
                             hashWithoutSlash.includes('token_type') ||
                             hashWithoutSlash.includes('type=recovery') ||
                             hashWithoutSlash.includes('type=email');
      
      if (isOAuthCallback) {
        // This is an OAuth callback or auth-related hash, don't try to use it as a selector
        return;
      }

      // Validate that hash looks like a valid CSS selector
      // Should start with # followed by alphanumeric, dash, underscore, or colon
      // Must NOT contain =, &, or other URL parameter characters
      const isValidSelector = /^#\/?[a-zA-Z0-9_-]+$/.test(hash) && 
                             !hash.includes('=') && 
                             !hash.includes('&');
      
      if (!isValidSelector) {
        // Not a valid selector, skip (likely a URL parameter or OAuth token)
        return;
      }

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          // Double-check it's safe before using querySelector
          const safeHash = hash.startsWith('#') ? hash : `#${hash}`;
          const element = document.querySelector(safeHash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // If hash element not found, scroll to top
            window.scrollTo(0, 0);
          }
        } catch (error) {
          // If querySelector fails (invalid selector), just scroll to top
          // Don't log to console in production to avoid Sentry noise
          if (import.meta.env.DEV) {
            console.warn('Invalid hash selector:', hash, error);
          }
          window.scrollTo(0, 0);
        }
      }, 100);
    }
  }, [hash]);

  return null;
}

