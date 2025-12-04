import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * KoniAI Logo - Text lockup with spark icon
 */
export default function KoniAILogo({ size = 'default', className = '' }) {
  const sizeClasses = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Sparkles 
        className={`${sizeClasses[size]} text-afrikoni-gold`}
        strokeWidth={2.5}
      />
      <span className={`${sizeClasses[size]} font-bold text-afrikoni-charcoal`}>
        KoniAI
      </span>
    </div>
  );
}

