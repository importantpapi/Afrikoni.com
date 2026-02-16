/**
 * Mobile Header Component
 * 
 * Compact 56px header for mobile viewports
 * - Logo on left
 * - Language selector OR country (not both)
 * - Profile icon only (no text menus)
 * - No overflow
 * - Sticky positioning
 * - z-index: 30
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/ui/Logo';
import { User, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/shared/ui/button';

interface MobileHeaderProps {
  user?: any;
}

export default function MobileHeader({ user }: MobileHeaderProps) {
  const { language, setLanguage, t, i18n } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Ensure translations are initialized
  const isTranslationsReady = i18n.isInitialized;

  // Language options
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
    { code: 'pt', label: 'PT' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <header 
      className="mobile-header fixed top-0 left-0 right-0 h-14 bg-afrikoni-chestnut border-b border-os-accent/20 z-30 flex items-center justify-between px-3"
      role="banner"
    >
      {/* Left: Logo */}
      <Link to="/" className="flex-shrink-0">
        <Logo type="icon" size="sm" link={false} className="text-os-accent" />
      </Link>

      {/* Center: Empty space for balance */}
      <div className="flex-1" />

      {/* Right: Language selector and Profile */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Language Selector - Compact */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => {
              if (isTranslationsReady) {
                setLanguage(e.target.value);
              }
            }}
            className="appearance-none bg-os-accent/10 border border-os-accent/30 rounded-lg px-2 py-1.5 text-os-xs text-os-accent font-medium focus:outline-none focus:ring-1 focus:ring-os-accent"
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Profile Icon */}
        {user ? (
          <Link
            to="/dashboard"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-os-accent/10 border border-os-accent/30 text-os-accent hover:bg-os-accent/20 transition-colors"
            aria-label="Go to dashboard"
          >
            <User className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-os-accent/10 border border-os-accent/30 text-os-accent hover:bg-os-accent/20 transition-colors"
            aria-label="Login or signup"
          >
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </header>
  );
}

