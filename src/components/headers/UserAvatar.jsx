import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * UserAvatar - Shared user menu trigger for all headers
 * Renders user initial with dropdown indicator
 */
export default function UserAvatar({
  user,
  profile,
  userMenuOpen,
  setUserMenuOpen,
  userMenuButtonRef,
  getUserInitial
}) {
  return (
    <button
      ref={userMenuButtonRef}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setUserMenuOpen?.(prev => !prev);
      }}
      className="flex items-center gap-2 p-1.5 rounded-lg
                 hover:bg-afrikoni-sand/20 transition-all
                 cursor-pointer relative"
      type="button"
      aria-label="User menu"
      aria-expanded={userMenuOpen}
    >
      {/* User Initial Circle */}
      <div className="w-9 h-9 bg-afrikoni-gold rounded-full
                      flex items-center justify-center
                      text-afrikoni-charcoal font-bold text-sm
                      shadow-sm border-2 border-afrikoni-gold/20">
        {(() => {
          try {
            return getUserInitial?.(user || null, profile || null) || 'U';
          } catch (error) {
            console.warn('Error getting user initial:', error);
            return 'U';
          }
        })()}
      </div>
      
      {/* Dropdown Indicator */}
      <ChevronDown 
        className={`w-4 h-4 text-afrikoni-text-dark transition-transform
                    ${userMenuOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

