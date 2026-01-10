import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Check, Info } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';

interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
}

export default function CookieSettingsModal({ isOpen, onClose, onSave }: CookieSettingsModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    preferences: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    if (isOpen) {
      // Load existing preferences
      const stored = localStorage.getItem('afrikoni-cookie-consent');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({
            necessary: true, // Always enabled
            preferences: parsed.preferences || false,
            analytics: parsed.analytics || false,
            marketing: parsed.marketing || false
          });
        } catch (e) {
          console.error('Error parsing cookie preferences:', e);
        }
      }
    }
  }, [isOpen]);

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const consentData = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('afrikoni-cookie-consent', JSON.stringify(consentData));
    onSave(preferences);
    onClose();
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    const consentData = {
      ...allAccepted,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('afrikoni-cookie-consent', JSON.stringify(consentData));
    onSave(allAccepted);
    onClose();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false
    };
    setPreferences(onlyNecessary);
    const consentData = {
      ...onlyNecessary,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('afrikoni-cookie-consent', JSON.stringify(consentData));
    onSave(onlyNecessary);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-afrikoni-chestnut">
            <Cookie className="w-6 h-6 text-afrikoni-gold" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Manage your cookie preferences. You can enable or disable different types of cookies below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Necessary Cookies */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="necessary" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Necessary Cookies
                  </Label>
                  <Info className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Essential for the website to function. These cannot be disabled.
                </p>
              </div>
              <Switch
                id="necessary"
                checked={preferences.necessary}
                disabled={true}
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Preference Cookies */}
          <div className="space-y-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="preferences" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Preference Cookies
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your settings and preferences (language, currency, etc.)
                </p>
              </div>
              <Switch
                id="preferences"
                checked={preferences.preferences}
                onCheckedChange={() => handleToggle('preferences')}
              />
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="analytics" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Analytics Cookies
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Help us understand how visitors use our website to improve performance
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={() => handleToggle('analytics')}
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="marketing" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Marketing Cookies
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Used for targeted advertising (currently not in use, reserved for future)
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={() => handleToggle('marketing')}
              />
            </div>
          </div>

          {/* Cookie Policy Link */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Learn more about how we use cookies in our{' '}
              <Link to="/cookie-policy" className="text-afrikoni-gold hover:underline font-medium">
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleRejectAll}
            className="flex-1 border-gray-300 dark:border-gray-600"
          >
            Reject All
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptAll}
            className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-charcoal"
          >
            Accept All
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-afrikoni-chestnut hover:bg-afrikoni-chestnut/90 text-white"
          >
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

