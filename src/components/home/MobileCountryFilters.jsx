/**
 * Mobile Country Filters Component
 * Institutional premium design - text-first, calm
 * No gamification badges or playful circles
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Top 5 Active Countries - institutional text presentation
const ACTIVE_COUNTRIES = [
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Morocco', flag: '🇲🇦' },
];

export default function MobileCountryFilters() {
  const navigate = useNavigate();

  const handleCountryClick = (country) => {
    navigate(`/marketplace?country=${encodeURIComponent(country.name)}`);
  };

  const handleViewAll = () => {
    navigate('/countries');
  };

  return (
    <section className="md:hidden py-8 bg-[#FDFBF7] border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider">Source by Country</h3>
          <button
            onClick={handleViewAll}
            className="text-[12px] text-gray-400 hover:text-gray-600 font-normal transition-colors"
          >
            All countries
          </button>
        </div>

        {/* Elite country list - compact precision */}
        <div className="space-y-1.5">
          {ACTIVE_COUNTRIES.map((country) => (
            <button
              key={country.name}
              onClick={() => handleCountryClick(country)}
              className="w-full flex items-center justify-between px-3.5 py-3 bg-white border border-gray-100 rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[18px]">{country.flag}</span>
                <span className="text-[14px] font-normal text-gray-900">{country.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
