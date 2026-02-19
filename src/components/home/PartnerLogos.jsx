/**
 * Partner/Client Logos Section
 * Pulls partner logos from Supabase 'partner_logos' table
 * Always includes institutional base partners
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/api/supabaseClient';

// Institutional Base Partners (Placeholders for maturity & scale)
const INSTITUTIONAL_PARTNERS = [
  { id: 'au', name: 'African Union', placeholder: true },
  { id: 'afdb', name: 'AfDB Group', placeholder: true },
  { id: 'ecowas', name: 'ECOWAS', placeholder: true },
  { id: 'stripe', name: 'Stripe', placeholder: true },
  { id: 'flutterwave', name: 'Flutterwave', placeholder: true },
  { id: 'pawa', name: 'PawaPay', placeholder: true }
];

export default function PartnerLogos() {
  const { t } = useTranslation();
  const [dbPartners, setDbPartners] = useState([]);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_logos')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .limit(12);

      if (!error && data) {
        setDbPartners(data);
      }
    } catch (error) {
      console.error('Error loading partner logos:', error);
    }
  };

  // Combine institutional base with dynamic partners
  const displayPartners = [...INSTITUTIONAL_PARTNERS, ...dbPartners];

  // Duplicate for seamless loop
  const duplicatedPartners = [...displayPartners, ...displayPartners];

  return (
    <section className="py-12 md:py-20 bg-white border-y border-afrikoni-chestnut/5 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[10px] md:text-xs font-bold text-os-accent uppercase tracking-[0.3em] mb-3 block">
            Infrastructure & Network
          </span>
          <h2 className="text-os-lg md:text-os-xl text-afrikoni-deep font-medium tracking-tight">
            The backbone of Pan-African trade
          </h2>
        </motion.div>

        {/* Seamless Scrolling Carousel */}
        <div className="relative">
          {/* Fading Edge Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="flex animate-marquee whitespace-nowrap items-center py-4">
            {duplicatedPartners.map((partner, idx) => (
              <div
                key={`${partner.id}-${idx}`}
                className="inline-block mx-8 md:mx-16 flex-shrink-0"
              >
                <div className="h-10 md:h-12 w-28 md:w-36 flex items-center justify-center filter grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out cursor-default">
                  {partner.logo_url && !partner.placeholder ? (
                    <img
                      src={partner.logo_url}
                      alt={`${partner.name} logo`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] md:text-xs text-afrikoni-deep font-bold tracking-widest uppercase text-center leading-tight">
                        {partner.name}
                      </span>
                      <div className="h-[1px] w-4 bg-os-accent mt-1 opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-afrikoni-offwhite/5 to-transparent pointer-events-none" />
    </section>
  );
}


