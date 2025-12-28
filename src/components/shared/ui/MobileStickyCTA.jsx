/**
 * Mobile Sticky CTA Component
 * 
 * Sticky call-to-action button for mobile devices
 * Always visible at bottom of viewport for key conversion actions
 * 
 * Usage:
 * - Product pages: "Contact Supplier", "Request Quote"
 * - RFQ pages: "Send RFQ"
 * - Deal pages: "Start Deal"
 * 
 * Features:
 * - 44px+ tap target
 * - High contrast for visibility
 * - Safe area support
 * - Smooth animations
 */

import React from 'react';
import { Button } from './button';
import { motion } from 'framer-motion';

export default function MobileStickyCTA({
  label,
  onClick,
  variant = 'default',
  icon: Icon,
  className = '',
  disabled = false,
  secondaryAction,
  secondaryLabel
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t-2 border-afrikoni-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-safe">
      <div className="flex items-center gap-2 px-4 py-3">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction}
            disabled={disabled}
            className="flex-1 min-h-[44px] text-base font-semibold border-afrikoni-gold/40 text-afrikoni-deep hover:bg-afrikoni-gold/10 touch-manipulation"
          >
            {secondaryLabel}
          </Button>
        )}
        <Button
          variant={variant}
          onClick={onClick}
          disabled={disabled}
          className={`
            flex-1 min-h-[44px] text-base font-semibold
            ${variant === 'default' 
              ? 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut' 
              : ''
            }
            touch-manipulation active:scale-95
            ${className}
          `}
        >
          {Icon && <Icon className="w-5 h-5 mr-2" aria-hidden="true" />}
          {label}
        </Button>
      </div>
    </div>
  );
}

