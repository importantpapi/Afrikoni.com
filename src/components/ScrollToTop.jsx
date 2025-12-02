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
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // If hash element not found, scroll to top
          window.scrollTo(0, 0);
        }
      }, 100);
    }
  }, [hash]);

  return null;
}

