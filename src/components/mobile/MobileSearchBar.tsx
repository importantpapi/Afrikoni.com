/**
 * Mobile Search Bar Component
 * 
 * Compact 48px search bar for mobile viewports
 * - Icon button only (no "Search" text)
 * - Rounded but compact
 * - Height: 48px
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

interface MobileSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function MobileSearchBar({ 
  onSearch, 
  placeholder 
}: MobileSearchBarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isTranslationsReady = i18n.isInitialized;
  const searchPlaceholder = placeholder || 
    (isTranslationsReady ? (t('hero.searchPlaceholder') || 'What are you looking for?') : 'What are you looking for?');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      }
      setSearchQuery('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="mobile-search relative w-full"
    >
      <div className={`
        flex items-center gap-2
        bg-white/95
        rounded-full
        shadow-md
        border border-afrikoni-gold/20
        px-3 py-2.5
        h-12
        transition-all duration-200
        focus-within:ring-1 focus-within:ring-afrikoni-gold/30 focus-within:shadow-lg
        ${isFocused ? 'shadow-lg border-afrikoni-gold/30' : ''}
      `}>
        <Search 
          className="w-5 h-5 text-afrikoni-gold/70 flex-shrink-0" 
          aria-hidden="true"
        />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-afrikoni-deep placeholder:text-afrikoni-deep/50 h-auto py-0"
        />
      </div>
    </form>
  );
}

