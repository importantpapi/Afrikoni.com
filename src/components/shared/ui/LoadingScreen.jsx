import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/ui/Logo';

/**
 * Unified Loading Screen Component
 * Clean, institutional — calm white background, simple spinner.
 */
export const LoadingScreen = ({
  message = 'Loading...',
  showLogo = true,
  size = 'lg'
}) => {
  return (
    <div className="min-h-screen bg-os-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-10"
          >
            <Logo type="symbol" size={size} />
          </motion.div>
        )}

        <div className="flex justify-center mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <p className="text-sm text-gray-500 font-medium">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
