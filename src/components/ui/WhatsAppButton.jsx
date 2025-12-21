/**
 * Sticky WhatsApp Chat Button
 * Fixed position button that opens WhatsApp community link
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';

export default function WhatsAppButton() {
  const handleClick = () => {
    openWhatsAppCommunity('sticky_button');
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all group"
      aria-label="Open WhatsApp Community"
      title="Join our WhatsApp Community"
      style={{ 
        bottom: '96px' // 72px bottom nav + 24px spacing
      }}
    >
      <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full pulse-smooth" />
    </motion.button>
  );
}

