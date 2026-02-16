import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-os-accent/10 text-os-accent border-os-accent/20',
    secondary: 'bg-white/5 text-os-text-secondary border-white/10',
    outline: 'border border-os-accent/30 bg-transparent text-os-accent',
    success: 'bg-os-green/10 text-os-green border-os-green/20 font-bold',
    warning: 'bg-os-accent/15 text-os-accent border-os-accent/20',
    info: 'bg-os-blue/10 text-os-blue border-os-blue/20',
    neutral: 'bg-white/5 text-os-text-secondary border-white/10',
    verified: 'bg-os-green text-white border-os-green/20 shadow-os-sm',
    premium: 'bg-os-accent text-white border-os-accent-dark shadow-os-gold',
    danger: 'bg-os-red/10 text-os-red border-os-red/20'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-os-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-os-accent focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge };

