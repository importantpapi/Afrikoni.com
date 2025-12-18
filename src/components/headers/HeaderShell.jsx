/**
 * HeaderShell - Shared container for all role-based headers
 * 
 * CRITICAL: This provides consistent structure to prevent:
 * - Clipped utility icons
 * - Z-index conflicts
 * - Overflow issues
 * - Width constraints
 * 
 * ALL headers MUST use this wrapper.
 */
export default function HeaderShell({ children }) {
  return (
    <header
      className="
        sticky top-0 z-[100]
        w-full
        bg-afrikoni-offwhite
        border-b border-afrikoni-gold/20
      "
    >
      <div
        className="
          flex items-center
          h-16
          px-6
          w-full
          max-w-none
          overflow-visible
        "
      >
        {children}
      </div>
    </header>
  );
}

