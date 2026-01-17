/**
 * Centralized Z-Index Scale
 * 
 * Use these constants instead of hardcoded z-index values.
 * This prevents z-index conflicts and makes layering predictable.
 * 
 * Usage:
 *   className={`fixed z-[${zIndex.sidebar}]`}
 *   style={{ zIndex: zIndex.modal }}
 */

export const zIndex = {
  // Background layers
  background: 0,
  
  // Content layers
  content: 10,
  
  // Footer and widgets
  footer: 30,
  
  // Overlays (mobile sidebar overlay, etc.)
  overlay: 40,
  
  // Sidebar navigation
  sidebar: 50,
  
  // Header and top navigation
  header: 100,
  
  // Modal and dialog layers
  modalBackdrop: 9998,
  modal: 9999,
  
  // Dropdowns and popovers
  dropdown: 9999,
};

/**
 * CSS Custom Property names for z-index
 * Use these with CSS variables: z-[var(--z-sidebar)]
 */
export const zIndexCSS = {
  background: 'var(--z-background)',
  content: 'var(--z-content)',
  footer: 'var(--z-footer)',
  overlay: 'var(--z-overlay)',
  sidebar: 'var(--z-sidebar)',
  header: 'var(--z-header)',
  modalBackdrop: 'var(--z-modal-backdrop)',
  modal: 'var(--z-modal)',
  dropdown: 'var(--z-dropdown)',
};

export default zIndex;
