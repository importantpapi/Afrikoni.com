import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-afrikoni-chestnut text-afrikoni-cream hover:bg-afrikoni-deep',
    secondary: 'bg-afrikoni-cream text-afrikoni-chestnut hover:bg-afrikoni-offwhite',
    outline: 'border border-afrikoni-gold/30 bg-afrikoni-offwhite',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-afrikoni-cream text-afrikoni-deep border-afrikoni-gold/20',
    verified: 'bg-green-600 text-afrikoni-creamborder-green-700',
    premium: 'bg-afrikoni-gold text-afrikoni-chestnut border-afrikoni-goldDark',
    danger: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge };

