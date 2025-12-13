/**
 * Browser Navigation Hook
 * Handles browser back/forward button support and keyboard shortcuts
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useBrowserNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      // React Router handles this automatically, but we ensure smooth navigation
      if (event.state) {
        // Scroll to top on navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Handle keyboard shortcuts for back/forward
    const handleKeyDown = (event) => {
      // Alt + Left Arrow = Back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      }
      // Alt + Right Arrow = Forward
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      }
      // Browser back button (mouse back button) - handled by browser
      // Browser forward button (mouse forward button) - handled by browser
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname]);
}

