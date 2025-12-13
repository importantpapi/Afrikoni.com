/**
 * Testimonials Section
 * Pulls testimonials from Supabase 'testimonials' table
 * With slider arrows and auto-transition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  // Auto-transition effect
  useEffect(() => {
    if (!autoPlay || testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, testimonials.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const getDisplayedTestimonials = () => {
    const start = currentIndex * 3;
    return testimonials.slice(start, start + 3);
  };

  const loadTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      // Fallback to empty array
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Loading testimonials...</div>
        </div>
      </section>
    );
  }

  // Only show real testimonials - no placeholders
  const displayed = getDisplayedTestimonials();

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite relative">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-afrikoni-deep/80">
            Trusted by businesses across Africa
          </p>
        </motion.div>

        {/* Slider Container */}
        {displayed.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows */}
            {testimonials.length > 3 && (
            <>
              <motion.button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold shadow-lg flex items-center justify-center text-afrikoni-chestnut hover:bg-afrikoni-gold/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold shadow-lg flex items-center justify-center text-afrikoni-chestnut hover:bg-afrikoni-gold/10 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Next testimonials"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </motion.button>
            </>
          )}

          {/* Testimonials Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {displayed.map((testimonial, idx) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all shadow-md hover:shadow-xl">
                    <CardContent className="p-6">
                      {/* Quote Icon */}
                      <Quote className="w-8 h-8 text-afrikoni-gold/30 mb-4" />

                      {/* Review Text */}
                      <p className="text-afrikoni-deep mb-6 leading-relaxed italic">
                        "{testimonial.review || testimonial.message}"
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (testimonial.rating || 5)
                                ? 'fill-afrikoni-gold text-afrikoni-gold'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Author Info */}
                      <div className="border-t border-afrikoni-gold/20 pt-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-chestnut/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-afrikoni-chestnut font-bold text-lg">
                              {(testimonial.seller_name || testimonial.name || 'C')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-afrikoni-chestnut truncate">
                                {testimonial.seller_name || testimonial.name || 'Customer'}
                              </p>
                              {testimonial.verified && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-afrikoni-gold font-medium mb-1">
                              {testimonial.type === 'buyer' ? 'Verified Buyer' : 
                               testimonial.type === 'supplier' ? 'Verified Supplier' :
                               testimonial.type === 'logistics' ? 'Logistics Partner' : ''}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-afrikoni-deep/70">
                              <span className="truncate">{testimonial.company || ''}</span>
                              {testimonial.location && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{testimonial.location}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        ) : (
          <Card className="border-afrikoni-gold/20 max-w-2xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <Quote className="w-16 h-16 text-afrikoni-gold/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">
                Be the First to Share Your Story
              </h3>
              <p className="text-afrikoni-deep/70 mb-6">
                Complete your first trade and become one of our featured testimonials
              </p>
              <Button
                onClick={() => window.location.href = '/signup'}
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
