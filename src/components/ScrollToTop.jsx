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
      const isOAuthCallback = hash.includes('access_token') || 
                             hash.includes('expires_at') || 
                             hash.includes('provider_token') ||
                             hash.includes('refresh_token') ||
                             hash.includes('token_type');
      
      if (isOAuthCallback) {
        // This is an OAuth callback, don't try to use it as a selector
        return;
      }

      // Validate that hash looks like a valid CSS selector
      // Should start with # followed by alphanumeric, dash, underscore, or colon
      const isValidSelector = /^#[a-zA-Z0-9_-]+/.test(hash);
      
      if (!isValidSelector) {
        // Not a valid selector, skip
        return;
      }

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // If hash element not found, scroll to top
            window.scrollTo(0, 0);
          }
        } catch (error) {
          // If querySelector fails (invalid selector), just scroll to top
          console.warn('Invalid hash selector:', hash, error);
          window.scrollTo(0, 0);
        }
      }, 100);
    }
  }, [hash]);

  return null;
}

