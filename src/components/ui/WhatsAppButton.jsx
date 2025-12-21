/**
 * Sticky WhatsApp Chat Button
 * Fixed position button that opens WhatsApp community link
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';

import { useLocation } from 'react-router-dom';

export default function WhatsAppButton() {
  const location = useLocation();
  const handleClick = () => {
    openWhatsAppCommunity('sticky_button');
  };

  // Hide on homepage (mobile only) - show on RFQ pages and other pages
  const isHomepage = location.pathname === '/';
  const isRFQPage = location.pathname.includes('/rfq') || location.pathname.includes('/dashboard/rfqs');
  const shouldShow = !isHomepage || isRFQPage;

  // Mobile: Smaller, muted, brown/gold theme
  // Desktop: Keep original
  return (
    <>
      {/* Mobile: Muted, smaller, brown/gold theme */}
      {shouldShow && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="md:hidden fixed bottom-24 right-4 z-40 w-12 h-12 bg-afrikoni-chestnut/90 hover:bg-afrikoni-chestnut text-afrikoni-cream rounded-full shadow-md hover:shadow-lg flex items-center justify-center transition-all border-2 border-afrikoni-gold/30"
          aria-label="Open WhatsApp Community"
          title="Join our WhatsApp Community"
          style={{ 
            bottom: '96px' // 72px bottom nav + 24px spacing
          }}
        >
          <MessageCircle className="w-5 h-5 text-afrikoni-cream" />
        </motion.button>
      )}

      {/* Desktop: Original design */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="hidden md:flex fixed bottom-6 right-6 z-40 w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl items-center justify-center transition-all group"
        aria-label="Open WhatsApp Community"
        title="Join our WhatsApp Community"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full pulse-smooth" />
      </motion.button>
    </>
  );
}

