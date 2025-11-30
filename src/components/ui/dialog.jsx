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
    <div className={cn('bg-afrikoni-offwhite rounded-xl shadow-2xl p-6', className)}>
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
    <h2 className={cn('text-2xl font-bold text-afrikoni-chestnut', className)}>
      {children}
    </h2>
  );
};

export const DialogClose = ({ onClose }) => {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-white transition-opacity hover:opacity-100 hover:bg-afrikoni-cream p-1 focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 text-afrikoni-deep"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
};

