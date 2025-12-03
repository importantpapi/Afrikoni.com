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
        'flex h-10 sm:h-10 w-full rounded-lg border-[1.5px] bg-afrikoni-offwhite px-3 py-2 text-sm sm:text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-afrikoni-earth/60 text-afrikoni-earth transition-all disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] sm:min-h-0',
        error 
          ? 'border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2' 
          : focused
          ? 'border-afrikoni-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-afrikoni-gold/30 focus-visible:ring-offset-2 shadow-afrikoni-lg'
          : 'border-afrikoni-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-afrikoni-gold focus-visible:ring-offset-2',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };

