import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ 
  className, 
  hover = false, 
  selected = false,
  gradientHeader = false,
  ...props 
}, ref) => {
  const cardContent = (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-afrikoni-gold/20 bg-afrikoni-cream text-afrikoni-chestnut shadow-afrikoni transition-all',
        hover && 'hover:shadow-afrikoni-lg hover:border-afrikoni-gold/40',
        selected && 'ring-2 ring-afrikoni-gold border-afrikoni-gold',
        gradientHeader && 'overflow-hidden',
        className
      )}
      {...props}
    />
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, gradient = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 p-5 md:p-6',
      gradient && 'bg-gradient-to-br from-afrikoni-gold to-afrikoni-goldDark text-afrikoni-chestnut',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl md:text-2xl font-bold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
      className={cn('text-sm text-afrikoni-deep', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 md:p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };

