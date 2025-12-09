import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Cookie consent banner component
 * Stores consent in localStorage
 */
export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };
  
  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-[100] bg-afrikoni-chestnut border-t-2 border-afrikoni-gold shadow-afrikoni-xl sticky"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <motion.div 
                className="flex items-start gap-3 flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Cookie className="w-6 h-6 text-afrikoni-gold flex-shrink-0 mt-1" aria-hidden="true" />
                </motion.div>
                <div className="flex-1">
                  <h3 
                    id="cookie-banner-title"
                    className="text-lg font-bold text-afrikoni-cream mb-2"
                  >
                    We Use Cookies
                  </h3>
                  <p 
                    id="cookie-banner-description"
                    className="text-sm text-afrikoni-cream/90 mb-2"
                  >
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies. 
                    <Link 
                      to="/cookies" 
                      className="text-afrikoni-gold hover:underline ml-1"
                      aria-label="Learn more about our cookie policy"
                    >
                      Learn more
                    </Link>
                  </p>
                  <motion.div 
                    className="flex flex-wrap gap-2 text-xs text-afrikoni-cream/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Link to="/privacy" className="hover:text-afrikoni-gold hover:underline">
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link to="/terms" className="hover:text-afrikoni-gold hover:underline">
                      Terms & Conditions
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 w-full md:w-auto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    size="sm"
                    className="border-afrikoni-gold/50 text-afrikoni-cream hover:bg-afrikoni-gold/10"
                  >
                    Reject
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleAccept}
                    size="sm"
                    className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight"
                  >
                    Accept All
                  </Button>
                </motion.div>
                <motion.button
                  onClick={handleReject}
                  className="p-2 text-afrikoni-cream/70 hover:text-afrikoni-cream hover:bg-afrikoni-gold/10 rounded-md transition-colors"
                  aria-label="Close cookie banner"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


