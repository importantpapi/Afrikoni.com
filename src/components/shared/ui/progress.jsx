import React from 'react';
import { cn } from '@/lib/utils';

const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-afrikoni-cream', className)}
      {...props}
    >
      <div
        className={cn('h-full w-full flex-1 bg-afrikoni-gold transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };

