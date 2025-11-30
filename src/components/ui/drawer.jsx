import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Drawer({ open, onOpenChange, children, position = 'bottom', title }) {
  const positions = {
    bottom: 'bottom-0 left-0 right-0',
    top: 'top-0 left-0 right-0',
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0'
  };

  const animations = {
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' }
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' }
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' }
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
    }
  };

  const anim = animations[position];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed z-50 bg-afrikoni-offwhite shadow-2xl',
              position === 'bottom' && 'rounded-t-xl max-h-[90vh]',
              position === 'top' && 'rounded-b-xl max-h-[90vh]',
              position === 'left' && 'rounded-r-xl max-w-md w-full',
              position === 'right' && 'rounded-l-xl max-w-md w-full',
              positions[position]
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-afrikoni-gold/20">
                <h2 className="text-lg font-bold text-afrikoni-chestnut">{title}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-1 hover:bg-afrikoni-cream transition-colors"
                >
                  <X className="h-5 w-5 text-afrikoni-deep" />
                </button>
              </div>
            )}
            <div className={cn('overflow-y-auto', title ? 'p-4' : 'p-6')}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

