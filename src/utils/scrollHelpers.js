/**
 * Utility functions for scroll behavior
 */

/**
 * Scrolls to the top of the page instantly
 * Use this before navigate() calls to ensure users start at the top
 */
export function scrollToTop() {
  window.scrollTo(0, 0);
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }
}

/**
 * Wrapper for navigate that scrolls to top before navigation
 * Usage: navigateWithScroll(navigate, '/dashboard/orders')
 */
export function navigateWithScroll(navigate, path, options = {}) {
  scrollToTop();
  // Small delay to ensure scroll happens before navigation
  setTimeout(() => {
    navigate(path, options);
  }, 10);
}

