/**
 * Mobile Country Filters Component (Bento Architecture)
 * Replaces 50+ country flags with:
 * 1. Top 5 Trending Countries as circular icons
 * 2. "Search by Country" button/dropdown
 * Mobile only - professional B2B look
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// Top 5 Trending Countries (based on supplier/product activity)
const TRENDING_COUNTRIES = [
  { name: 'Nigeria', flag: '🇳🇬', code: 'nigeria' },
  { name: 'Kenya', flag: '🇰🇪', code: 'kenya' },
  { name: 'Ghana', flag: '🇬🇭', code: 'ghana' },
  { name: 'South Africa', flag: '🇿🇦', code: 'south-africa' },
  { name: 'Morocco', flag: '🇲🇦', code: 'morocco' },
];

export default function MobileCountryFilters() {
  const navigate = useNavigate();
  const [countryCounts, setCountryCounts] = useState({});

  useEffect(() => {
    loadCountryCounts();
  }, []);

  const loadCountryCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('country')
        .in('verification_status', ['verified', 'pending']);

      if (error) throw error;

      const counts = {};
      data?.forEach((company) => {
        if (company.country) {
          counts[company.country] = (counts[company.country] || 0) + 1;
        }
      });

      setCountryCounts(counts);
    } catch (err) {
      console.error('Error loading country counts:', err);
    }
  };

  const handleCountryClick = (country) => {
    navigate(`/marketplace?country=${encodeURIComponent(country.name)}`);
  };

  const handleSearchByCountry = () => {
    navigate('/countries');
  };

  return (
    <section className="md:hidden py-3 bg-afrikoni-offwhite border-b border-afrikoni-gold/10">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-afrikoni-chestnut">Trending Countries</h3>
          <button
            onClick={handleSearchByCountry}
            className="text-xs text-afrikoni-gold font-medium flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            Search All
          </button>
        </div>

        {/* Top 5 Trending Countries - Circular Icons */}
        <div className="flex items-center gap-3 mb-3">
          {TRENDING_COUNTRIES.map((country, index) => {
            const count = countryCounts[country.name] || 0;
            
            return (
              <motion.button
                key={country.code}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCountryClick(country)}
                className="flex flex-col items-center gap-1 flex-1 touch-manipulation active:scale-95 transition-transform"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-afrikoni-gold/20 flex items-center justify-center text-2xl shadow-sm hover:border-afrikoni-gold/40 hover:shadow-md transition-all">
                    {country.flag}
                  </div>
                  {count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-afrikoni-gold text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-afrikoni-chestnut text-center leading-tight line-clamp-1">
                  {country.name.split(' ')[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
