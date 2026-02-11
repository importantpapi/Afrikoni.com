import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Link } from 'react-router-dom';
import TrustBadge from '@/components/shared/ui/TrustBadge';
import { useLanguage } from '@/i18n/LanguageContext';

const testimonials = [
  {
    id: 1,
    company: 'Ghana Cocoa Exports Ltd',
    name: 'Kwame Mensah',
    role: 'Export Manager',
    country: 'Ghana',
    rating: 5,
    text: 'Afrikoni has transformed our export business. We\'ve connected with buyers from 12 countries and increased our sales by 300% in just 6 months. The escrow system gives buyers confidence, and we get paid faster.',
    image: null,
    verified: true,
    trustScore: 95
  },
  {
    id: 2,
    company: 'Nairobi Textile Co.',
    name: 'Amina Hassan',
    role: 'Business Owner',
    country: 'Kenya',
    rating: 5,
    text: 'As a small manufacturer, finding reliable buyers was always a challenge. Afrikoni\'s verification system and secure payments have opened doors we never thought possible. Highly recommended!',
    image: null,
    verified: true,
    trustScore: 88
  },
  {
    id: 3,
    company: 'Lagos Electronics Wholesale',
    name: 'Chukwu Emeka',
    role: 'CEO',
    country: 'Nigeria',
    rating: 5,
    text: 'The platform is intuitive, the support team is responsive, and most importantly, every transaction is secure. We\'ve completed over 50 orders with zero disputes. That\'s trust.',
    image: null,
    verified: true,
    trustScore: 92
  },
  {
    id: 4,
    company: 'Cape Town Agricultural Supplies',
    name: 'Sarah van der Merwe',
    role: 'Operations Director',
    country: 'South Africa',
    rating: 5,
    text: 'Buying from verified African suppliers has never been easier. The transparency, escrow protection, and quality assurance give us peace of mind with every purchase.',
    image: null,
    verified: true,
    trustScore: 90
  },
  {
    id: 5,
    company: 'Casablanca Trading Group',
    name: 'Youssef Alami',
    role: 'Import Manager',
    country: 'Morocco',
    rating: 5,
    text: 'We source products from 8 African countries through Afrikoni. The logistics integration and real-time tracking make cross-border trade seamless.',
    image: null,
    verified: true,
    trustScore: 87
  }
];

export default function SocialProof() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            Trusted by Early Businesses in Africa
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto">
            Join hundreds of suppliers and buyers building successful B2B relationships across the continent
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 shadow-xl max-w-4xl mx-auto">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-6">
                    {/* Quote Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                        <Quote className="w-8 h-8 text-afrikoni-gold" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${star <= currentTestimonial.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-afrikoni-deep/30'
                              }`}
                          />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <p className="text-lg md:text-xl text-afrikoni-deep mb-6 leading-relaxed italic">
                        "{currentTestimonial.text}"
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-afrikoni-chestnut">{currentTestimonial.name}</h4>
                            {currentTestimonial.verified && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-afrikoni-deep">
                            {currentTestimonial.role}, {currentTestimonial.company}
                          </p>
                          <p className="text-xs text-afrikoni-deep/70">{currentTestimonial.country}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentTestimonial.verified && (
                            <TrustBadge type="verified-supplier" size="sm" />
                          )}
                          {currentTestimonial.trustScore > 0 && (
                            <TrustBadge type="trust-score" score={currentTestimonial.trustScore} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                      ? 'bg-afrikoni-gold w-8'
                      : 'bg-afrikoni-gold/30'
                    }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
              Become a Verified Supplier
            </h3>
            <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
              Join our trusted network of suppliers and start connecting with serious buyers across Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard/verification-center">
                <Button variant="outline" className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-sand/20">
                  Learn About Verification
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

