import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RFQProcessPanel from './RFQProcessPanel';

export default function RFQCard() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-goldDark/10 to-afrikoni-chestnut/10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Dominant RFQ CTA */}
          <Card className="border-2 border-afrikoni-gold/40 bg-gradient-to-br from-afrikoni-gold/20 via-white to-afrikoni-cream shadow-afrikoni-lg">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-afrikoni-gold rounded-xl flex items-center justify-center flex-shrink-0 shadow-afrikoni-lg">
                    <FileText className="w-8 h-8 text-afrikoni-chestnut" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-chestnut mb-3">
                      Post a Trade Request (RFQ)
                    </h3>
                    <p className="text-lg md:text-xl text-afrikoni-deep/80 mb-4">
                      Get matched with verified African suppliers. Reviewed within 24–48 hours.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto">
                  <Link to="/rfq/create" className="block">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        size="lg" 
                        className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-bold px-8 py-6 text-lg md:text-xl shadow-afrikoni-xl hover:shadow-afrikoni-2xl transition-all"
                      >
                        Post a Trade Request (RFQ)
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQ Process Panel */}
          <RFQProcessPanel />
        </motion.div>
      </div>
    </section>
  );
}

