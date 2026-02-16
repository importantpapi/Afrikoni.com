/**
 * Mobile Trust Badge
 * Pinned ribbon at bottom on mobile, auto-hides when scrolling up
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function MobileTrustBadge() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling up, show when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsVisible(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-gradient-to-r from-afrikoni-chestnut to-afrikoni-deep text-afrikoni-cream px-4 py-3 shadow-os-md border-t-2 border-os-accent">
            <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
              <Shield className="w-5 h-5 text-os-accent flex-shrink-0" />
              <span className="text-os-sm font-semibold">
                🛡 Afrikoni Trade Shield — Verified Suppliers Only
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

