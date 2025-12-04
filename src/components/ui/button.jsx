import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight shadow-afrikoni hover:shadow-afrikoni-lg rounded-[0.6rem]',
    secondary: 'bg-transparent text-afrikoni-gold border-[1.5px] border-afrikoni-gold hover:bg-afrikoni-goldLight/20 hover:shadow-[0_0_10px_rgba(198,154,71,0.4)] rounded-[0.6rem]',
    ghost: 'hover:bg-afrikoni-cream/50 text-afrikoni-deep',
    link: 'text-afrikoni-gold hover:text-afrikoni-goldLight hover:underline p-0'
  };
  
  const sizes = {
    sm: 'h-9 sm:h-9 min-h-[44px] sm:min-h-0 px-3 text-sm rounded-[0.6rem] touch-manipulation',
    md: 'h-10 sm:h-10 min-h-[44px] sm:min-h-0 px-4 py-2 rounded-[0.6rem] touch-manipulation',
    lg: 'h-11 sm:h-11 min-h-[44px] sm:min-h-0 px-8 text-base rounded-[0.6rem] touch-manipulation',
    icon: 'h-10 w-10 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-[0.6rem] touch-manipulation'
  };

  const buttonContent = (
    <>
      {LeftIcon && <LeftIcon className="w-4 h-4 mr-2" />}
      {children}
      {RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
    </>
  );

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-afrikoni-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button };

