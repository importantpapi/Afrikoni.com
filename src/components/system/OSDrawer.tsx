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
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 90 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className={cn(
              'fixed top-0 right-0 h-full bg-[var(--os-surface-1)] border-l border-os-stroke shadow-2xl',
              'w-full sm:w-[420px] lg:w-[480px]',
              widthClassName
            )}
            style={{ zIndex: 100 }}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="os-label">{title || 'System Drawer'}</div>
                <button
                  onClick={onClose}
                  className="text-sm text-os-muted hover:text-os-gold transition"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                {children}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
