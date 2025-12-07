import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Shield, Percent, Truck, TrendingUp, Heart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function TransparencySection() {
  const { t } = useLanguage();

  const revenueSources = [
    {
      icon: Percent,
      title: t('transparency.transactionFee.title') || 'Transaction Fee',
      description: t('transparency.transactionFee.description') || 'An 8% fee is charged on successful transactions using Escrow (Trade Assurance).',
      percentage: t('transparency.transactionFee.badge') || '8%',
      color: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      icon: Shield,
      title: t('transparency.verificationFee.title') || 'Supplier Verification',
      description: t('transparency.verificationFee.description') || 'Optional business verification to improve trust and increase buyer visibility.',
      percentage: t('transparency.verificationFee.badge') || 'Optional',
      color: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-700'
    },
    {
      icon: TrendingUp,
      title: t('transparency.premiumPlans.title') || 'Premium Plans',
      description: t('transparency.premiumPlans.description') || 'Optional plans that boost your visibility and ranking in search results.',
      percentage: t('transparency.premiumPlans.badge') || 'Optional',
      color: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-700'
    },
    {
      icon: Truck,
      title: t('transparency.logisticsFee.title') || 'Logistics Commission',
      description: t('transparency.logisticsFee.description') || 'Afrikoni earns a small commission when logistics services are arranged through the platform.',
      percentage: t('transparency.logisticsFee.badge') || 'Commission',
      color: 'text-orange-600',
      badgeColor: 'bg-orange-100 text-orange-700'
    }
  ];

  const principles = [
    {
      icon: Heart,
      title: t('transparency.principle1.title') || '100% Transparent',
      text: t('transparency.principle1.text') || 'All fees are clearly displayed before any transaction. No hidden costs.'
    },
    {
      icon: Shield,
      title: t('transparency.principle2.title') || 'Buyer Protection',
      text: t('transparency.principle2.text') || 'Our escrow system protects buyers. Fees only apply on successful transactions.'
    },
    {
      icon: DollarSign,
      title: t('transparency.principle3.title') || 'Fair Pricing',
      text: t('transparency.principle3.text') || 'We keep fees low to make African trade accessible. Most features are free.'
    }
  ];

  return (
    <div className="py-16 md:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            {t('transparency.title') || 'Transparent & Fair Pricing'}
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto">
            {t('transparency.subtitle') || 'Afrikoni earns only when trade happens successfully — no hidden fees.'}
          </p>
        </motion.div>

        {/* Revenue Sources */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {revenueSources.map((source, idx) => {
            const Icon = source.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all shadow-md hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        source.color === 'text-blue-600' ? 'bg-blue-100' :
                        source.color === 'text-purple-600' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${source.color}`} />
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${source.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                        {source.percentage}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-afrikoni-chestnut">
                      {source.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-afrikoni-deep leading-relaxed">
                      {source.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Core Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-chestnut/10 rounded-2xl p-8 md:p-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-8 text-center">
            {t('transparency.principlesTitle') || 'Our Core Principles'}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {principles.map((principle, idx) => {
              const Icon = principle.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                  <h4 className="text-lg font-bold text-afrikoni-chestnut mb-2">
                    {principle.title}
                  </h4>
                  <p className="text-afrikoni-deep">
                    {principle.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-afrikoni-deep/80 text-sm md:text-base max-w-2xl mx-auto">
            {t('transparency.footer') || '💡 Most features on Afrikoni are completely free. Browse products, create RFQs, message suppliers, and discover opportunities at no cost. We only charge when you complete a transaction or choose premium features.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

