/**
 * Dashboard Layout Configuration
 * 
 * Centralized configuration for dashboard layout dimensions and behavior.
 * Update these values to customize the dashboard layout globally.
 */

export const layoutConfig = {
  sidebar: {
    width: 260,                    // Desktop sidebar width (px)
    collapsedWidth: 80,            // Collapsed sidebar width (px)
    mobileWidth: 256,               // Mobile sidebar width (px) - 16rem
    defaultOpen: true,              // Sidebar open by default on desktop
    defaultOpenMobile: false,       // Sidebar closed by default on mobile
  },
  
  header: {
    height: 64,                      // Desktop header height (px)
    heightMobile: 56,                // Mobile header height (px)
    sticky: true,                   // Header sticks to top
  },
  
  footer: {
    height: 48,                      // Footer height (px)
    showOnMobile: false,            // Show footer on mobile
  },
  
  mobileBottomNav: {
    height: 72,                      // Mobile bottom nav height (px)
    showOnDesktop: false,           // Show bottom nav on desktop
  },
  
  content: {
    padding: {
      x: {
        mobile: 12,                 // Horizontal padding mobile (px)
        tablet: 16,                 // Horizontal padding tablet (px)
        desktop: 24,                // Horizontal padding desktop (px)
      },
      y: {
        mobile: 16,                 // Vertical padding mobile (px)
        desktop: 24,                // Vertical padding desktop (px)
      },
    },
    minHeight: 'calc(100vh - var(--header-height))',
    minHeightMobile: 'calc(100vh - var(--header-height-mobile) - var(--mobile-bottom-nav-height))',
  },
  
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

/**
 * Get CSS variable value for a layout property
 */
export const getLayoutCSSVar = (property) => {
  const varMap = {
    sidebarWidth: 'var(--sidebar-width)',
    sidebarCollapsedWidth: 'var(--sidebar-collapsed-width)',
    sidebarMobileWidth: 'var(--sidebar-mobile-width)',
    headerHeight: 'var(--header-height)',
    headerHeightMobile: 'var(--header-height-mobile)',
    footerHeight: 'var(--footer-height)',
    mobileBottomNavHeight: 'var(--mobile-bottom-nav-height)',
  };
  
  return varMap[property] || null;
};

export default layoutConfig;
