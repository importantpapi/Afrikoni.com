import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenChange(false);
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-50 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogContent = ({ children, className }) => {
  return (
    <div className={cn('bg-afrikoni-offwhite rounded-os-sm shadow-2xl p-6', className)}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className }) => {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ children, className }) => {
  return (
    <h2 className={cn('text-os-2xl font-bold text-afrikoni-chestnut', className)}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({ children, className }) => {
  return (
    <p className={cn('text-os-sm text-afrikoni-deep/70 mt-1', className)}>
      {children}
    </p>
  );
};

export const DialogClose = ({ onClose }) => {
  return (
    <button
      onClick={onClose}
      className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-lg opacity-70 ring-offset-white transition-opacity hover:opacity-100 hover:bg-afrikoni-cream p-2.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-os-accent focus:ring-offset-2 text-afrikoni-deep touch-manipulation"
    >
      <X className="h-5 w-5 sm:h-4 sm:w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
};

export const DialogFooter = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-os-stroke', className)}>
      {children}
    </div>
  );
};

export const DialogTrigger = ({ children, asChild, ...props }) => {
  if (asChild) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
};

