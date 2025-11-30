import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Tooltip({ children, content, position = 'top', className }) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-1.5 text-xs font-medium text-afrikoni-cream bg-afrikoni-chestnut rounded-lg shadow-afrikoni-lg whitespace-nowrap pointer-events-none',
              positions[position],
              className
            )}
          >
            {content}
            <div className={cn(
              'absolute w-2 h-2 bg-afrikoni-chestnut rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1/2'
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

