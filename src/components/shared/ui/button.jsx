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
  asChild = false,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-os-accent text-afrikoni-deep hover:bg-afrikoni-gold-crest shadow-os-gold hover:shadow-os-md rounded-os-md',
    secondary: 'bg-transparent text-os-accent border-[1.5px] border-os-accent hover:bg-os-accent/5 hover:shadow-os-sm rounded-os-md',
    ghost: 'hover:bg-afrikoni-cream/50 text-afrikoni-deep',
    link: 'text-os-accent hover:text-os-accent/80 hover:underline p-0'
  };

  const sizes = {
    sm: 'h-9 sm:h-9 min-h-[44px] sm:min-h-0 px-3 text-os-sm rounded-os-md touch-manipulation',
    md: 'h-10 sm:h-10 min-h-[44px] sm:min-h-0 px-4 py-2 rounded-os-md touch-manipulation',
    lg: 'h-11 sm:h-11 min-h-[44px] sm:min-h-0 px-8 text-os-base rounded-os-md touch-manipulation',
    icon: 'h-10 w-10 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-os-md touch-manipulation'
  };

  const buttonContent = (
    <>
      {LeftIcon && <LeftIcon className="w-4 h-4 mr-2" />}
      {children}
      {RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
    </>
  );

  const buttonClasses = cn(
    'inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-os-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  );

  // If asChild is true, clone the child and apply props to it
  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      className: cn(buttonClasses, children.props.className),
      ref,
      ...props
    });
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0.0, 0.2, 1] }}
      className={buttonClasses}
      ref={ref}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button };

