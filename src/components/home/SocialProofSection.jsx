/**
 * Social Proof Section - "Trusted by Africa's Builders"
 * Shows partner logos, testimonials, and KPI counters
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, CheckCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function SocialProofSection() {
  const countersRef = useRef(null);
  const isInView = useInView(countersRef, { once: true, margin: '-100px' });

  const [counters, setCounters] = useState({
    businesses: 0,
    countries: 0,
    tradeValue: 0
  });

  const targets = {
    businesses: 100,
    countries: 5,
    tradeValue: 250 // $250K
  };

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timers = Object.keys(targets).map((key) => {
      const target = targets[key];
      let current = 0;
      const increment = target / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounters((prev) => ({ ...prev, [key]: Math.floor(current) }));
      }, interval);

      return timer;
    });

    return () => timers.forEach((timer) => clearInterval(timer));
  }, [isInView]);

  // Placeholder partner logos (10)
  const partners = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Partner ${i + 1}`,
    logo: `/images/partners/partner-${i + 1}.png` // Placeholder path
  }));

  const testimonials = [
    {
      name: 'Amina Hassan',
      country: 'Kenya',
      company: 'East Africa Exports Ltd',
      quote: 'Afrikoni has transformed how we connect with international buyers. The verification process gives us credibility we never had before.',
      rating: 5
    },
    {
      name: 'Kwame Mensah',
      country: 'Ghana',
      company: 'Ghana Trade Solutions',
      quote: 'The escrow protection and logistics support make cross-border trade seamless. We\'ve doubled our export volume in 6 months.',
      rating: 5
    },
    {
      name: 'Fatima Al-Mansouri',
      country: 'Morocco',
      company: 'North African Imports Co',
      quote: 'As a buyer, finding verified suppliers was always a challenge. Afrikoni solved that problem completely. Highly recommended.',
      rating: 5
    }
  ];

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Star className="w-8 h-8 text-afrikoni-gold" aria-hidden="true" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut">
              Trusted by Africa's Builders
            </h2>
          </div>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
            Join the growing community of businesses building Africa's trade future
          </p>
        </motion.div>

        {/* KPI Counters */}
        <motion.div
          ref={countersRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16"
        >
          <Card className="border-afrikoni-gold/20 text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-afrikoni-gold" aria-hidden="true" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-2">
                {counters.businesses}+
              </p>
              <p className="text-sm md:text-base text-afrikoni-deep/80 uppercase tracking-wide">
                Verified Businesses
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20 text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-afrikoni-gold" aria-hidden="true" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-2">
                {counters.countries}
              </p>
              <p className="text-sm md:text-base text-afrikoni-deep/80 uppercase tracking-wide">
                Countries in Pilot Phase
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20 text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-afrikoni-gold" aria-hidden="true" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-2">
                ${counters.tradeValue}K
              </p>
              <p className="text-sm md:text-base text-afrikoni-deep/80 uppercase tracking-wide">
                Trade Value Facilitated
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Partner Logos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 md:mb-16"
        >
          <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut text-center mb-8">
            Our Partners
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            {partners.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ scale: 1.1, y: -4 }}
                className="flex items-center justify-center h-20 bg-afrikoni-offwhite border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold transition-all"
              >
                <div className="text-afrikoni-gold/40 text-xs font-semibold">
                  {partner.name}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut text-center mb-8">
            What Our Partners Say
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-afrikoni-gold/30 mb-4" aria-hidden="true" />
                    <p className="text-afrikoni-deep mb-4 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-1 mb-3" role="img" aria-label={`Rating: ${testimonial.rating} out of 5 stars`}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'fill-afrikoni-gold text-afrikoni-gold'
                              : 'text-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <div className="border-t border-afrikoni-gold/20 pt-4">
                      <p className="font-semibold text-afrikoni-chestnut text-sm mb-1">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-afrikoni-deep/70 mb-1">
                        {testimonial.company}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-afrikoni-deep/70">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>{testimonial.country}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


