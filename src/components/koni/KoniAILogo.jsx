import React from 'react';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';

/**
 * KoniAI Logo - Text lockup with official emblem and spark icon
 */
export default function KoniAILogo({ size = 'default', className = '' }) {
  const sizeClasses = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-3xl'
  };

  const iconSizes = {
    small: 'sm',
    default: 'sm',
    large: 'md'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Logo type="icon" size={iconSizes[size]} className="opacity-80 scale-75" />
        <Sparkles
          className="absolute -top-1 -right-1 w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          strokeWidth={3}
        />
      </div>
      <span className={`${sizeClasses[size]} font-black tracking-tighter bg-gradient-to-r from-afrikoni-charcoal to-afrikoni-gold bg-clip-text text-transparent`}>
        KoniAI
      </span>
    </div>
  );
}

