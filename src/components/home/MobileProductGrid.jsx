/**
 * Mobile Product Grid Component
 * Phase 2 - Infinite Discovery Flow
 * Mobile-only product grid with country-first relevance
 * 2 products per row, high density, immediate product discovery
 *
 * ✅ REFACTORED: Now uses GeoService singleton (no direct ipapi.co calls)
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import ProductCard from '@/components/products/ProductCard';
import * as GeoService from '@/services/GeoService';

// Country code to name mapping
const CODE_TO_NAME = {
  'NG': 'Nigeria', 'KE': 'Kenya', 'GH': 'Ghana', 'ZA': 'South Africa',
  'ET': 'Ethiopia', 'TZ': 'Tanzania', 'UG': 'Uganda', 'EG': 'Egypt',
  'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'SN': 'Senegal',
  'CI': "Côte d'Ivoire", 'CM': 'Cameroon', 'ZW': 'Zimbabwe', 'MZ': 'Mozambique',
  'MG': 'Madagascar', 'ML': 'Mali', 'BF': 'Burkina Faso', 'NE': 'Niger',
  'RW': 'Rwanda', 'BJ': 'Benin', 'GN': 'Guinea', 'TD': 'Chad',
  'ZM': 'Zambia', 'MW': 'Malawi', 'SO': 'Somalia', 'BI': 'Burundi',
  'TG': 'Togo', 'SL': 'Sierra Leone', 'LY': 'Libya', 'MR': 'Mauritania',
  'ER': 'Eritrea', 'GM': 'Gambia', 'BW': 'Botswana', 'NA': 'Namibia',
  'GA': 'Gabon', 'LS': 'Lesotho', 'GW': 'Guinea-Bissau', 'LR': 'Liberia',
  'CF': 'Central African Republic', 'CG': 'Congo', 'CD': 'DR Congo',
  'ST': 'São Tomé and Príncipe', 'SC': 'Seychelles', 'CV': 'Cape Verde',
  'KM': 'Comoros', 'MU': 'Mauritius', 'GQ': 'Equatorial Guinea',
  'SZ': 'Eswatini', 'SS': 'South Sudan', 'AO': 'Angola'
};

// Country name to flag mapping
const COUNTRY_FLAGS = {
  'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Egypt': '🇪🇬',
  'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Senegal': '🇸🇳',
  "Côte d'Ivoire": '🇨🇮', 'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲', 'Zimbabwe': '🇿🇼',
  'Mozambique': '🇲🇿', 'Madagascar': '🇲🇬', 'Mali': '🇲🇱', 'Burkina Faso': '🇧🇫',
  'Niger': '🇳🇪', 'Rwanda': '🇷🇼', 'Benin': '🇧🇯', 'Guinea': '🇬🇳', 'Chad': '🇹🇩',
  'Zambia': '🇿🇲', 'Malawi': '🇲🇼', 'Somalia': '🇸🇴', 'Burundi': '🇧🇮',
  'Togo': '🇹🇬', 'Sierra Leone': '🇸🇱', 'Libya': '🇱🇾', 'Mauritania': '🇲🇷',
  'Eritrea': '🇪🇷', 'Gambia': '🇬🇲', 'Botswana': '🇧🇼', 'Namibia': '🇳🇦',
  'Gabon': '🇬🇦', 'Lesotho': '🇱🇸', 'Guinea-Bissau': '🇬🇼', 'Liberia': '🇱🇷',
  'Central African Republic': '🇨🇫', 'Congo': '🇨🇬', 'DR Congo': '🇨🇩',
  'São Tomé and Príncipe': '🇸🇹', 'Seychelles': '🇸🇨', 'Cape Verde': '🇨🇻',
  'Comoros': '🇰🇲', 'Mauritius': '🇲🇺', 'Equatorial Guinea': '🇬🇶',
  'Eswatini': '🇸🇿', 'South Sudan': '🇸🇸', 'Angola': '🇦🇴'
};

const getCountryFlag = (countryName) => {
  if (!countryName) return '';
  return COUNTRY_FLAGS[countryName] || '';
};

export default function MobileProductGrid({
  country = null,
  limit = 8,
  title = null,
  showHeader = false
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState(null);

  useEffect(() => {
    // ✅ REFACTORED: Only detect country if not provided via props
    // This prevents duplicate ipapi.co calls when parent already detected country
    const initializeAndLoad = async () => {
      if (!country) {
        await detectUserCountry();
      }
      await loadProducts();
    };

    initializeAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]); // Only re-run if country prop changes

  const detectUserCountry = async () => {
    // ✅ REFACTORED: Uses GeoService singleton (no direct ipapi.co fetch)
    try {
      const { country_code } = await GeoService.getCountry();
      if (country_code && CODE_TO_NAME[country_code]) {
        setDetectedCountry(CODE_TO_NAME[country_code]);
      }
    } catch (err) {
      // GeoService never throws, but just in case
      // Silently fail - country detection is optional
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Determine which country to filter by
      const filterCountry = country || detectedCountry;
      
      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // Simplified query - PostgREST friendly (no complex joins)
      let query = supabase
        .from('products')
        .select('id, name, description, price_min, price_max, currency, status, company_id, category_id, country_of_origin, views, created_at')
        .eq('status', 'active');

      // Filter by country if specified (simplified - only use country_of_origin)
      if (filterCountry) {
        query = query.eq('country_of_origin', filterCountry);
      }

      // Prioritize verified suppliers, then by views
      query = query
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Load companies separately if needed
      let companiesMap = new Map();
      if (productsData && productsData.length > 0) {
        const companyIds = [...new Set(productsData.map(p => p.company_id).filter(Boolean))];
        if (companyIds.length > 0) {
          try {
            const { data: companies } = await supabase
              .from('companies')
              .select('id, company_name, verification_status, country')
              .in('id', companyIds);
            
            if (companies) {
              companies.forEach(c => companiesMap.set(c.id, c));
            }
          } catch (err) {
            console.warn('Error loading companies for mobile products:', err);
            // Continue without company data
          }
        }
      }

      // Merge company data with products
      const productsWithCompanies = (productsData || []).map(product => ({
        ...product,
        companies: companiesMap.get(product.company_id) || null
      }));

      // Sort: verified suppliers first, then by views
      const sorted = productsWithCompanies.sort((a, b) => {
        const aVerified = a.companies?.verification_status === 'verified' ? 1 : 0;
        const bVerified = b.companies?.verification_status === 'verified' ? 1 : 0;
        if (aVerified !== bVerified) return bVerified - aVerified;
        return (b.views || 0) - (a.views || 0);
      });

      setProducts(sorted);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate header text
  const getHeaderText = () => {
    if (title) return title;
    const filterCountry = country || detectedCountry;
    if (filterCountry) {
      const flag = getCountryFlag(filterCountry);
      return `${flag} Popular products from ${filterCountry}`;
    }
    return 'Popular products';
  };

  if (loading) {
    return (
      <div className="md:hidden px-4 py-2">
        {showHeader && (
          <h3 className="text-sm font-semibold text-afrikoni-chestnut mb-3">
            {getHeaderText()}
          </h3>
        )}
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-afrikoni-cream rounded-lg mb-2" />
              <div className="h-4 bg-afrikoni-cream rounded mb-1" />
              <div className="h-3 bg-afrikoni-cream rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden px-4 py-2">
      {/* Header - Compact */}
      {showHeader && (
        <h3 className="text-sm font-semibold text-afrikoni-chestnut mb-3">
          {getHeaderText()}
        </h3>
      )}

      {/* Product Grid - 2 columns, tight spacing */}
      <div className="grid grid-cols-2 gap-2">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={idx < 2} // Load first 2 images immediately
          />
        ))}
      </div>
    </div>
  );
}

