import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import RFQProcessPanel from './RFQProcessPanel';

export default function RFQCard() {
  const { t } = useTranslation();
  return (
    <section className="py-8 md:py-16 bg-gradient-to-br from-os-accent/10 via-os-accentDark/10 to-afrikoni-chestnut/10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4 md:space-y-6"
        >
          {/* Mobile: Ultra-compact RFQ card */}
          <Card className="md:hidden border border-os-accent/30 bg-gradient-to-br from-os-accent/10 via-white to-afrikoni-cream">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-os-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-afrikoni-chestnut" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-os-sm text-afrikoni-chestnut font-medium mb-2">
                    Post an RFQ — suppliers send you quotes
                  </p>
                  <Link to="/rfq/create" className="block">
                    <Button
                      size="sm"
                      className="w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-semibold text-os-sm py-2"
                    >
                      Post RFQ
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop: Full RFQ card */}
          <Card className="hidden md:block border-2 border-os-accent/40 bg-gradient-to-br from-os-accent/20 via-white to-afrikoni-cream shadow-os-gold-lg">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-os-accent rounded-os-sm flex items-center justify-center flex-shrink-0 shadow-os-gold-lg">
                    <FileText className="w-8 h-8 text-afrikoni-chestnut" />
                  </div>
                  <div>
                    <h3 className="text-os-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-chestnut mb-3">
                      {t('rfq.postTradeRequest')}
                    </h3>
                    <p className="text-os-lg md:text-os-xl text-afrikoni-deep/80 mb-4">
                      {t('rfq.getMatchedDescription')}
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
                        className="w-full md:w-auto bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-bold px-8 py-6 text-os-lg md:text-os-xl shadow-os-gold-xl hover:shadow-os-gold-2xl transition-all"
                      >
                        {t('rfq.postTradeRequest')}
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQ Process Panel - Desktop only */}
          <div className="hidden md:block">
            <RFQProcessPanel />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

