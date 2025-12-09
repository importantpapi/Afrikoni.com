/**
 * Partner/Client Logos Section
 * Pulls partner logos from Supabase 'partner_logos' table
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';

export default function PartnerLogos() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_logos')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true })
        .limit(12);

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partner logos:', error);
      // Fallback to empty array
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  // Create placeholder logos if none exist
  const displayPartners = partners.length > 0 
    ? partners 
    : Array.from({ length: 8 }, (_, i) => ({
        id: `placeholder-${i}`,
        name: `Partner ${i + 1}`,
        logo_url: null,
        placeholder: true
      }));

  // Duplicate for seamless loop
  const duplicatedPartners = [...displayPartners, ...displayPartners];

  return (
    <section className="py-8 md:py-12 bg-white border-y border-afrikoni-gold/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-sm md:text-base text-afrikoni-deep/60 mb-6">
            Trusted by leading businesses across Africa
          </p>
        </motion.div>

        {/* Auto-scrolling carousel */}
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {duplicatedPartners.map((partner, idx) => (
              <motion.div
                key={`${partner.id}-${idx}`}
                className="inline-block mx-8 flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="h-12 md:h-16 w-32 md:w-40 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                  {partner.logo_url && !partner.placeholder ? (
                    <img
                      src={partner.logo_url}
                      alt={`${partner.name || 'Partner'} logo`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      width="120"
                      height="60"
                    />
                  ) : (
                    <div className="h-12 md:h-16 w-32 md:w-40 bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-gold/5 rounded-lg flex items-center justify-center border border-afrikoni-gold/20">
                      <span className="text-xs text-afrikoni-deep/40 font-medium">
                        {partner.name || 'Partner'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

