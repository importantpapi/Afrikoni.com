/**
 * Verified Suppliers Section Component
 * Phase 2.1 - Shows 4-6 verified suppliers in a grid
 * Mobile: 2 columns, Desktop: 4 columns
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';
import { Shield, MapPin, Building, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { supabase } from '@/api/supabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import { Logo } from '@/components/shared/ui/Logo';

// Country name to flag mapping (same as ProductCard)
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

export default function VerifiedSuppliersSection() {
  const navigate = useNavigate();
  const { language = 'en' } = useLanguage();
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
      <section className="py-8 md:py-12 bg-afrikoni-offwhite">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-os-xl md:text-os-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-os-accent" />
              Verified African Suppliers
            </h2>
            <Link
              to={`/${language}/marketplace?verified=true`}
              className="text-os-sm md:text-os-base text-os-accent font-medium hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border border-os-accent/10 bg-white animate-pulse">
                <CardContent className="p-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
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
    <section className="py-6 md:py-12 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-os-xl md:text-os-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-os-accent" />
            Verified African Suppliers
          </h2>
          <Link
            to={`/${language}/marketplace?verified=true`}
            className="text-os-sm md:text-os-base text-os-accent font-medium hover:underline"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {suppliers.map((supplier, index) => {
            const flag = getCountryFlag(supplier.country);
            const logoUrl = supplier.logo_url || supplier.logo;

            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-os-accent/10 hover:border-os-accent/30 transition-all h-full bg-white overflow-hidden group">
                  <CardContent className="p-4 md:p-6 text-center">
                    {/* Company Logo */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full overflow-hidden bg-afrikoni-cream flex items-center justify-center">
                      {logoUrl ? (
                        <OptimizedImage
                          src={logoUrl}
                          alt={supplier.company_name || 'Company logo'}
                          className="w-full h-full object-cover"
                          width={80}
                          height={80}
                          quality={85}
                          placeholder="/company-placeholder.svg"
                        />
                      ) : (
                        <Building className="w-8 h-8 md:w-10 md:h-10 text-os-accent/50" />
                      )}
                      {/* Verification Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        <Shield className="w-4 h-4 text-os-accent" />
                      </div>
                    </div>

                    {/* Company Name */}
                    <h3 className="text-os-sm md:text-os-base font-semibold text-afrikoni-chestnut mb-2 line-clamp-2 min-h-[40px]">
                      {supplier.company_name}
                    </h3>

                    {/* Country */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {flag && <span className="text-os-sm">{flag}</span>}
                      <span className="text-os-xs md:text-os-sm text-afrikoni-deep/70">
                        {supplier.country || 'N/A'}
                      </span>
                    </div>

                    {/* Main Categories (if available) */}
                    {supplier.main_categories && Array.isArray(supplier.main_categories) && supplier.main_categories.length > 0 && (
                      <div className="mb-3">
                        <p className="text-os-xs md:text-os-xs text-afrikoni-deep/60">
                          {supplier.main_categories.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Contact Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-os-xs md:text-os-sm border-os-accent/30 text-afrikoni-chestnut hover:bg-os-accent/10 min-h-[36px] md:min-h-[40px]"
                      onClick={() => navigate(`/${language}/business/${supplier.id}`)}
                    >
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Contact
                    </Button>
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


