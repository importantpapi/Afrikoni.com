import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

/**
 * Loading Screen Component
 * Displays Afrikoni logo with pulsing animation and tagline
 */
export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Pulsing Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <Logo type="full" size="xl" link={false} />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-amber-700 font-medium text-sm md:text-base mb-4"
        >
          Africa's leading B2B marketplace
        </motion.p>

        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </motion.div>

        {/* Loading Message */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-stone-600 text-xs mt-4"
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;

