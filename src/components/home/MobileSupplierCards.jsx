/**
 * Mobile Supplier Cards Component (Bento Architecture)
 * Horizontal layout for verified suppliers on mobile
 * Left: Small profile image, Right: Business name, Verified badge, Location
 * Shows 2-3 suppliers on screen at once
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, MapPin, Building2, MessageSquare, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { supabase } from '@/api/supabaseClient';
import OptimizedImage from '@/components/OptimizedImage';

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

export default function MobileSupplierCards() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifiedSuppliers();
  }, []);

  const loadVerifiedSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error loading verified suppliers:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="md:hidden py-6 bg-afrikoni-offwhite">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
              <Shield className="w-5 h-5 text-afrikoni-gold" />
              Verified Suppliers
            </h2>
            <Link
              to="/marketplace?verified=true"
              className="text-sm text-afrikoni-gold font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-afrikoni-gold/10 bg-white animate-pulse">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (suppliers.length === 0) {
    return null;
  }

  return (
    <section className="md:hidden py-6 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
            <Shield className="w-5 h-5 text-afrikoni-gold" />
            Verified Suppliers
          </h2>
          <Link
            to="/marketplace?verified=true"
            className="text-sm text-afrikoni-gold font-medium"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal Cards - 2-3 visible on screen */}
        <div className="space-y-2.5">
          {suppliers.slice(0, 6).map((supplier, index) => {
            const flag = getCountryFlag(supplier.country);
            const logoUrl = supplier.logo_url || supplier.logo;

            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="border border-afrikoni-gold/15 hover:border-afrikoni-gold/30 transition-all bg-white overflow-hidden active:scale-[0.98]"
                  onClick={() => navigate(`/business/${supplier.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Left: Small Profile Image */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-afrikoni-cream flex-shrink-0 flex items-center justify-center border border-afrikoni-gold/10">
                        {logoUrl ? (
                          <OptimizedImage
                            src={logoUrl}
                            alt={supplier.company_name || 'Company logo'}
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                            quality={85}
                            placeholder="/company-placeholder.svg"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-afrikoni-gold/50" />
                        )}
                        {/* Verification Badge */}
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-afrikoni-gold/20">
                          <Shield className="w-3 h-3 text-afrikoni-gold" />
                        </div>
                      </div>

                      {/* Right: Business Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-afrikoni-chestnut line-clamp-1 flex-1">
                            {supplier.company_name}
                          </h3>
                          {/* Verified Badge */}
                          <div className="flex items-center gap-1 bg-afrikoni-gold/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <Shield className="w-3 h-3 text-afrikoni-gold" />
                            <span className="text-[10px] font-semibold text-afrikoni-gold">Verified</span>
                          </div>
                        </div>
                        
                        {/* Location */}
                        <div className="flex items-center gap-1 mb-1">
                          {flag && <span className="text-xs">{flag}</span>}
                          <span className="text-xs text-afrikoni-deep/70 line-clamp-1">
                            {supplier.country || 'N/A'}
                          </span>
                        </div>

                        {/* Categories (if available) */}
                        {supplier.main_categories && Array.isArray(supplier.main_categories) && supplier.main_categories.length > 0 && (
                          <p className="text-[10px] text-afrikoni-deep/60 line-clamp-1">
                            {supplier.main_categories.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Arrow Icon */}
                      <ChevronRight className="w-4 h-4 text-afrikoni-gold/40 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
