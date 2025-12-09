import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useLanguage } from '@/i18n/LanguageContext';
import StructuredData from '@/components/StructuredData';

/**
 * FAQ Section with expandable accordions
 * Fetches questions from Supabase
 */
export default function FAQSection() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      // Fallback to empty array
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
              {t('faq.title') || 'Frequently Asked Questions'}
            </h2>
            <p className="text-lg text-afrikoni-deep/80">
              {t('faq.subtitle') || 'Find answers to common questions about Afrikoni'}
            </p>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
              {t('faq.title') || 'Frequently Asked Questions'}
            </h2>
            <p className="text-lg text-afrikoni-deep/80">
              {t('faq.subtitle') || 'Find answers to common questions about Afrikoni'}
            </p>
          </motion.div>
          <div className="text-center text-afrikoni-deep/60 py-12">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-afrikoni-gold/50" />
            <p>{t('faq.noFaqs') || 'No FAQs available yet. Check back soon!'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite">
      {/* FAQ Structured Data */}
      {faqs.length > 0 && (
        <StructuredData 
          type="FAQPage" 
          data={{ items: faqs }}
        />
      )}
      
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-afrikoni-gold/20 mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <HelpCircle className="w-8 h-8 text-afrikoni-gold" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
            {t('faq.title') || 'Frequently Asked Questions'}
          </h2>
          <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
            {t('faq.subtitle') || 'Find answers to common questions about Afrikoni'}
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold hover:shadow-md transition-all bg-white">
                <CardContent className="p-0">
                  <motion.button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full text-left p-5 md:p-6 flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 rounded-lg transition-colors hover:bg-afrikoni-cream/30"
                    aria-expanded={openIndex === idx}
                    aria-controls={`faq-answer-${faq.id}`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-afrikoni-chestnut text-base md:text-lg mb-1 pr-4">
                        {faq.question}
                      </h3>
                      {faq.category && (
                        <span className="inline-block text-xs text-afrikoni-gold bg-afrikoni-gold/10 px-2 py-1 rounded-full mt-1">
                          {faq.category}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === idx ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-1"
                        aria-hidden="true"
                      />
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {openIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div
                          id={`faq-answer-${faq.id}`}
                          className="px-5 md:px-6 pb-5 md:pb-6 text-afrikoni-deep leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA if no FAQs */}
        {faqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <HelpCircle className="w-16 h-16 text-afrikoni-gold/50 mx-auto mb-4" />
            <p className="text-afrikoni-deep/70 mb-6">
              FAQs are being prepared. Check back soon or contact us for immediate assistance.
            </p>
            <a
              href="mailto:hello@afrikoni.com"
              className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold"
            >
              Contact Support
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}

