import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type={type}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        'flex h-10 sm:h-10 w-full rounded-lg border-[1.5px] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-os-sm sm:text-os-base ring-offset-white file:border-0 file:bg-transparent file:text-os-sm file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 transition-all disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] sm:min-h-0',
        error 
          ? 'border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2' 
          : focused
          ? 'border-os-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-os-accent/30 focus-visible:ring-offset-2 shadow-os-gold-lg'
          : 'border-os-accent/30 dark:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-os-accent focus-visible:ring-offset-2',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
