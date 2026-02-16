/**
 * Country Quick Filters Component
 * Horizontal scrollable country flags with supplier counts
 * Core Afrikoni differentiator - "Africa is the interface"
 */

import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';

// All 54 African countries with flags
const ALL_AFRICAN_COUNTRIES = [
  { name: 'Algeria', flag: '🇩🇿', code: 'algeria' },
  { name: 'Angola', flag: '🇦🇴', code: 'angola' },
  { name: 'Benin', flag: '🇧🇯', code: 'benin' },
  { name: 'Botswana', flag: '🇧🇼', code: 'botswana' },
  { name: 'Burkina Faso', flag: '🇧🇫', code: 'burkina-faso' },
  { name: 'Burundi', flag: '🇧🇮', code: 'burundi' },
  { name: 'Cameroon', flag: '🇨🇲', code: 'cameroon' },
  { name: 'Cape Verde', flag: '🇨🇻', code: 'cape-verde' },
  { name: 'Central African Republic', flag: '🇨🇫', code: 'central-african-republic' },
  { name: 'Chad', flag: '🇹🇩', code: 'chad' },
  { name: 'Comoros', flag: '🇰🇲', code: 'comoros' },
  { name: 'Congo', flag: '🇨🇬', code: 'congo' },
  { name: 'DR Congo', flag: '🇨🇩', code: 'dr-congo' },
  { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'ivory-coast' },
  { name: 'Djibouti', flag: '🇩🇯', code: 'djibouti' },
  { name: 'Egypt', flag: '🇪🇬', code: 'egypt' },
  { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'equatorial-guinea' },
  { name: 'Eritrea', flag: '🇪🇷', code: 'eritrea' },
  { name: 'Eswatini', flag: '🇸🇿', code: 'eswatini' },
  { name: 'Ethiopia', flag: '🇪🇹', code: 'ethiopia' },
  { name: 'Gabon', flag: '🇬🇦', code: 'gabon' },
  { name: 'Gambia', flag: '🇬🇲', code: 'gambia' },
  { name: 'Ghana', flag: '🇬🇭', code: 'ghana' },
  { name: 'Guinea', flag: '🇬🇳', code: 'guinea' },
  { name: 'Guinea-Bissau', flag: '🇬🇼', code: 'guinea-bissau' },
  { name: 'Kenya', flag: '🇰🇪', code: 'kenya' },
  { name: 'Lesotho', flag: '🇱🇸', code: 'lesotho' },
  { name: 'Liberia', flag: '🇱🇷', code: 'liberia' },
  { name: 'Libya', flag: '🇱🇾', code: 'libya' },
  { name: 'Madagascar', flag: '🇲🇬', code: 'madagascar' },
  { name: 'Malawi', flag: '🇲🇼', code: 'malawi' },
  { name: 'Mali', flag: '🇲🇱', code: 'mali' },
  { name: 'Mauritania', flag: '🇲🇷', code: 'mauritania' },
  { name: 'Mauritius', flag: '🇲🇺', code: 'mauritius' },
  { name: 'Morocco', flag: '🇲🇦', code: 'morocco' },
  { name: 'Mozambique', flag: '🇲🇿', code: 'mozambique' },
  { name: 'Namibia', flag: '🇳🇦', code: 'namibia' },
  { name: 'Niger', flag: '🇳🇪', code: 'niger' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'nigeria' },
  { name: 'Rwanda', flag: '🇷🇼', code: 'rwanda' },
  { name: 'São Tomé and Príncipe', flag: '🇸🇹', code: 'sao-tome-and-principe' },
  { name: 'Senegal', flag: '🇸🇳', code: 'senegal' },
  { name: 'Seychelles', flag: '🇸🇨', code: 'seychelles' },
  { name: 'Sierra Leone', flag: '🇸🇱', code: 'sierra-leone' },
  { name: 'Somalia', flag: '🇸🇴', code: 'somalia' },
  { name: 'South Africa', flag: '🇿🇦', code: 'south-africa' },
  { name: 'South Sudan', flag: '🇸🇸', code: 'south-sudan' },
  { name: 'Sudan', flag: '🇸🇩', code: 'sudan' },
  { name: 'Tanzania', flag: '🇹🇿', code: 'tanzania' },
  { name: 'Togo', flag: '🇹🇬', code: 'togo' },
  { name: 'Tunisia', flag: '🇹🇳', code: 'tunisia' },
  { name: 'Uganda', flag: '🇺🇬', code: 'uganda' },
  { name: 'Zambia', flag: '🇿🇲', code: 'zambia' },
  { name: 'Zimbabwe', flag: '🇿🇼', code: 'zimbabwe' }
];

export default function CountryQuickFilters() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [countryCounts, setCountryCounts] = useState({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load supplier counts per country
  useEffect(() => {
    const loadCountryCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('country')
          .in('verification_status', ['verified', 'pending']);

        if (error) throw error;

        // Count suppliers per country
        const counts = {};
        data?.forEach((company) => {
          if (company.country) {
            counts[company.country] = (counts[company.country] || 0) + 1;
          }
        });

        setCountryCounts(counts);
      } catch (err) {
        console.error('Error loading country counts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCountryCounts();
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleCountryClick = (country) => {
    navigate(`/marketplace?country=${encodeURIComponent(country.name)}`);
  };

  return (
    <div className="relative w-full">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md border border-os-accent/20 hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <span className="text-afrikoni-chestnut">‹</span>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* "All Countries" option */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/marketplace')}
          className="flex flex-col items-center gap-1 min-w-[100px] px-3 py-2 rounded-lg bg-white/60 border border-afrikoni-chestnut/10 hover:bg-white/80 active:scale-95 transition-all touch-manipulation"
        >
          <span className="text-os-2xl">🌍</span>
          <span className="text-os-xs font-medium text-afrikoni-chestnut text-center leading-tight">
            All Countries
          </span>
        </motion.button>

        {/* Country flags */}
        {ALL_AFRICAN_COUNTRIES.map((country, index) => {
          const count = countryCounts[country.name] || 0;
          
          return (
            <motion.button
              key={country.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => handleCountryClick(country)}
              className="flex flex-col items-center gap-1 min-w-[100px] px-3 py-2 rounded-lg bg-white/50 border border-afrikoni-chestnut/10 hover:bg-white/80 hover:border-os-accent/30 active:scale-95 transition-all touch-manipulation"
            >
              <span className="text-os-2xl">{country.flag}</span>
              <span className="text-os-xs font-medium text-afrikoni-chestnut text-center leading-tight max-w-[90px] truncate">
                {country.name}
              </span>
              {!loading && count > 0 && (
                <span className="text-os-xs text-afrikoni-deep/60">
                  {count} {count === 1 ? 'supplier' : 'suppliers'}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md border border-os-accent/20 hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <span className="text-afrikoni-chestnut">›</span>
        </button>
      )}
    </div>
  );
}


