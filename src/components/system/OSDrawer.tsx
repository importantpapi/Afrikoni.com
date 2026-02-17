import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OSDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  widthClassName?: string;
  children: React.ReactNode;
}

export function OSDrawer({ open, onClose, title, widthClassName, children }: OSDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Background Dimming Layer - Pauses underlying content */}
          <motion.div
            className="fixed inset-0 bg-black/15 backdrop-blur-[2px]"
            style={{ zIndex: 90 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          
          {/* Menu Panel - Solid Premium Surface */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed top-0 right-0 h-full',
              'bg-os-bg', // Warm ivory - fully opaque
              'border-l border-os-accent/20',
              'shadow-[-8px_0_40px_rgba(0,0,0,0.12)]', // Premium left shadow
              'rounded-l-[28px]', // Soft rounded left edge
              'w-full sm:w-[420px] lg:w-[480px]',
              widthClassName
            )}
            style={{ zIndex: 100 }}
          >
            <div className="h-full flex flex-col">
              {/* Header - More spacious */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-os-accent/10">
                <div className="text-lg font-semibold text-afrikoni-deep tracking-tight">
                  {title || 'Menu'}
                </div>
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-afrikoni-deep/60 hover:text-os-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-os-accent/8 active:scale-95"
                >
                  Close
                </button>
              </div>
              
              {/* Content - Generous padding */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {children}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
