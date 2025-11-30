import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RFQCard() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-goldDark/10 to-afrikoni-chestnut/10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-white to-afrikoni-cream-100/30">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
                      Didn't find what you need?
                    </h3>
                    <p className="text-lg text-afrikoni-deep mb-4">
                      Post a Request for Quotation (RFQ) and get competitive quotes from multiple verified suppliers across Africa.
                    </p>
                    <ul className="space-y-2 text-afrikoni-deep">
                      <li className="flex items-center gap-2">
                        <span className="text-afrikoni-gold">✓</span>
                        <span>Get multiple quotes in 24-48 hours</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-afrikoni-gold">✓</span>
                        <span>Compare prices and terms easily</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-afrikoni-gold">✓</span>
                        <span>Connect directly with suppliers</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link to="/rfq/create">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-creampx-8">
                        Post an RFQ
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

