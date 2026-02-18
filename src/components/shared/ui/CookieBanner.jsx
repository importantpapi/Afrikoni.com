import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import CookieSettingsModal from './CookieSettingsModal';

/**
 * Enhanced Cookie consent banner component with GDPR compliance
 * Stores granular consent preferences in localStorage
 */
export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already consented using new system
    const consent = localStorage.getItem('afrikoni-cookie-consent');
    if (!consent) {
      // Show banner immediately - no delay
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('afrikoni-cookie-consent', JSON.stringify(consentData));
    setShowBanner(false);
  };

  const handleReject = () => {
    const consentData = {
      necessary: true, // Always true
      preferences: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('afrikoni-cookie-consent', JSON.stringify(consentData));
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowModal(true);
  };

  const handleSavePreferences = (preferences) => {
    // Preferences are already saved in modal
    setShowBanner(false);
    setShowModal(false);
  };

  return (
    <>
      {showBanner && (
        <AnimatePresence>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-afrikoni-chestnut border-t-4 border-os-accent shadow-os-gold-xl"
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
                    <Cookie className="w-6 h-6 text-os-accent flex-shrink-0 mt-1" aria-hidden="true" />
                  </motion.div>
                  <div className="flex-1">
                    <h3
                      id="cookie-banner-title"
                      className="text-os-lg md:text-os-xl font-bold text-afrikoni-cream mb-2"
                    >
                      Afrikoni respects your privacy
                    </h3>
                    <p
                      id="cookie-banner-description"
                      className="text-os-sm md:text-os-base text-afrikoni-cream/90 mb-2"
                    >
                      Afrikoni and 3rd parties use essential and non-essential cookies to provide, secure, analyze and improve our Services, and to show you relevant ads (including professional and job ads) on and off Afrikoni.
                      <Link
                        to="/cookie-policy"
                        className="text-os-accent hover:underline ml-1 font-semibold"
                        aria-label="Learn more about our cookie policy"
                      >
                        Learn more in our Cookie Policy.
                      </Link>
                    </p>
                    <p className="text-os-xs md:text-os-sm text-afrikoni-cream/80">
                      Select Accept to consent or Reject to decline non-essential cookies for this use. You can update your choices at any time in your settings.
                    </p>
                    <motion.div
                      className="flex flex-wrap gap-2 text-os-xs text-afrikoni-cream/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <Link to="/legal/privacy" className="hover:text-os-accent hover:underline">
                        Privacy Policy
                      </Link>
                      <span>•</span>
                      <Link to="/cookie-policy" className="hover:text-os-accent hover:underline">
                        Cookie Policy
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 w-full md:w-auto flex-wrap"
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
                      className="border-os-accent/50 text-afrikoni-cream hover:bg-os-accent/10"
                    >
                      Reject
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleCustomize}
                      variant="outline"
                      size="sm"
                      className="border-os-accent/50 text-afrikoni-cream hover:bg-os-accent/10"
                    >
                      Customize
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleAcceptAll}
                      size="sm"
                      className="bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight"
                    >
                      Accept All
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Cookie Settings Modal */}
      <CookieSettingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSavePreferences}
      />
    </>
  );
}


