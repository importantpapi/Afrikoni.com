/**
 * Mobile Supplier Cards Component (Bento Architecture)
 * Horizontal layout for verified suppliers on mobile
 * Left: Small profile image, Right: Business name, Verified badge, Location
 * Shows 2-3 suppliers on screen at once
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';
import { Shield, MapPin, Building, MessageSquare, ChevronRight, Clock } from 'lucide-react';
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

// Helper function to calculate years on platform
const getYearsOnPlatform = (createdAt) => {
  if (!createdAt) return null;
  const years = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24 * 365);
  if (years < 1) {
    const months = Math.floor(years * 12);
    return months > 0 ? `${months}m` : '<1m';
  }
  return `${Math.floor(years)}y`;
};

// Helper function to format response rate
const formatResponseRate = (avgHours) => {
  if (!avgHours || avgHours === 0) return null;
  if (avgHours < 4) return '< 4h';
  if (avgHours < 24) return `< ${Math.floor(avgHours)}h`;
  return `< ${Math.floor(avgHours / 24)}d`;
};

// Helper function to check if supplier is online (active in last 24h)
const isSupplierOnline = (lastActivity) => {
  if (!lastActivity) return false;
  const hoursSinceActivity = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60);
  return hoursSinceActivity < 24;
};

export default function MobileSupplierCards() {
  const navigate = useNavigate();
  const { language = 'en' } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifiedSuppliers();
  }, []);

  const loadVerifiedSuppliers = async () => {
    try {
      // Fetch companies with their performance metrics
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(6);

      if (companiesError) throw companiesError;

      // Fetch response rate data from quotes for each company
      const suppliersWithMetrics = await Promise.all(
        (companiesData || []).map(async (company) => {
          // Get quotes with RFQ data to calculate response time
          const { data: quotesData } = await supabase
            .from('quotes')
            .select('created_at, rfq_id')
            .eq('supplier_company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(10);

          let avgResponseHours = null;
          if (quotesData && quotesData.length > 0) {
            // Fetch RFQ creation times for these quotes
            const rfqIds = quotesData.map(q => q.rfq_id).filter(Boolean);
            if (rfqIds.length > 0) {
              const { data: rfqsData } = await supabase
                .from('rfqs')
                .select('id, created_at')
                .in('id', rfqIds);

              if (rfqsData) {
                const rfqMap = new Map(rfqsData.map(r => [r.id, r.created_at]));
                const responseTimes = quotesData
                  .filter(q => rfqMap.has(q.rfq_id))
                  .map(q => {
                    const rfqTime = new Date(rfqMap.get(q.rfq_id));
                    const quoteTime = new Date(q.created_at);
                    return (quoteTime - rfqTime) / (1000 * 60 * 60); // Convert to hours
                  })
                  .filter(t => t > 0 && t < 720); // Filter out negative or unrealistic times

                if (responseTimes.length > 0) {
                  avgResponseHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                }
              }
            }
          }

          // Get last activity (most recent quote)
          const lastActivity = quotesData && quotesData.length > 0
            ? quotesData[0].created_at
            : company.updated_at || company.created_at;

          return {
            ...company,
            avgResponseHours,
            lastActivity,
            isOnline: isSupplierOnline(lastActivity),
          };
        })
      );

      setSuppliers(suppliersWithMetrics);
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
            <h2 className="text-os-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
              <Shield className="w-5 h-5 text-os-accent" />
              Verified Suppliers
            </h2>
            <Link
              to={`/${language}/marketplace?verified=true`}
              className="text-os-sm text-os-accent font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-os-accent/10 bg-white animate-pulse">
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
          <h2 className="text-os-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
            <Shield className="w-5 h-5 text-os-accent" />
            Verified Suppliers
          </h2>
          Label:
          <Link
            to={`/${language}/marketplace?verified=true`}
            className="text-os-sm text-os-accent font-medium"
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
                  className="border border-os-accent/15 hover:border-os-accent/30 transition-all bg-white overflow-hidden active:scale-[0.98]"
                  onClick={() => navigate(`/${language}/business/${supplier.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Left: Small Profile Image */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-afrikoni-cream flex-shrink-0 flex items-center justify-center border border-os-accent/10">
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
                          <Building className="w-6 h-6 text-os-accent/50" />
                        )}
                        {/* Verification Badge with Online Indicator */}
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-os-accent/20 flex items-center gap-0.5">
                          {supplier.isOnline && (
                            <motion.div
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-1.5 h-1.5 bg-green-500 rounded-full"
                            />
                          )}
                          <Shield className="w-3 h-3 text-os-accent" />
                        </div>
                      </div>

                      {/* Right: Business Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-os-sm font-semibold text-afrikoni-chestnut line-clamp-1 flex-1">
                            {supplier.company_name}
                          </h3>
                          {/* Verified Badge */}
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 bg-os-accent/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <Shield className="w-3 h-3 text-os-accent" />
                              <span className="text-os-xs font-semibold text-os-accent">Verified</span>
                            </div>
                            {supplier.trust_score && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-os-text-secondary font-medium">Trust</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1 bg-os-stroke rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${supplier.trust_score >= 80 ? 'bg-emerald-500' : 'bg-os-accent'}`}
                                      style={{ width: `${supplier.trust_score}%` }}
                                    />
                                  </div>
                                  <span className={`text-[10px] font-bold ${supplier.trust_score >= 80 ? 'text-emerald-500' : 'text-os-accent'}`}>
                                    {supplier.trust_score}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Location & Trust Signals */}
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {flag && <span className="text-os-xs">{flag}</span>}
                          <span className="text-os-xs text-afrikoni-deep/70 line-clamp-1">
                            {supplier.country || 'N/A'}
                          </span>

                          {/* Years on Platform */}
                          {getYearsOnPlatform(supplier.created_at) && (
                            <span className="text-os-xs bg-os-accent/10 text-os-accent px-1.5 py-0.5 rounded-full font-medium">
                              {getYearsOnPlatform(supplier.created_at)} on platform
                            </span>
                          )}
                        </div>

                        {/* Response Rate Indicator */}
                        {formatResponseRate(supplier.avgResponseHours) && (
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-green-600" />
                            <span className="text-os-xs text-green-700 font-medium">
                              Responds in {formatResponseRate(supplier.avgResponseHours)}
                            </span>
                          </div>
                        )}

                        {/* Categories (if available) */}
                        {supplier.main_categories && Array.isArray(supplier.main_categories) && supplier.main_categories.length > 0 && (
                          <p className="text-os-xs text-afrikoni-deep/60 line-clamp-1">
                            {supplier.main_categories.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Arrow Icon */}
                      <ChevronRight className="w-4 h-4 text-os-accent/40 flex-shrink-0" />
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
