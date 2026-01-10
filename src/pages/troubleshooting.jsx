import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Shield, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Troubleshooting section highlighting major customer problems and Afrikoni solutions
 */
export default function Troubleshooting() {
  const { t } = useLanguage();

  const problems = [
    {
      problem: 'Payment Fraud & Trust Issues',
      description: 'Buyers worry about sending money to unknown suppliers. Sellers fear non-payment after shipping.',
      solution: 'Afrikoni Shield™ Escrow Protection',
      details: [
        'Secure escrow payments held until order completion',
        'Verified supplier network with KYC/AML checks',
        'Buyer protection with money-back guarantee',
        'Transparent transaction tracking'
      ],
      icon: Shield
    },
    {
      problem: 'Cross-Border Payment Challenges',
      description: 'Difficulties with currency conversion, international transfers, and payment methods.',
      solution: 'Multi-Currency Payment Gateway',
      details: [
        'Support for USD, EUR, NGN, ZAR, and more',
        'Secure payment processing',
        'Real-time currency conversion',
        'Multiple payment methods accepted'
      ],
      icon: CheckCircle
    },
    {
      problem: 'Logistics & Shipping Complexity',
      description: 'Uncertain shipping costs, delivery times, and customs procedures across African countries.',
      solution: 'Integrated Logistics Network',
      details: [
        'Shipping calculator for accurate quotes',
        'Verified logistics partners across 54 countries',
        'Customs documentation support',
        'Real-time shipment tracking'
      ],
      icon: Lightbulb
    },
    {
      problem: 'Finding Reliable Suppliers',
      description: 'Difficulty verifying supplier credibility, product quality, and business legitimacy.',
      solution: 'Verified Supplier Network',
      details: [
        'KYC/AML verification for all suppliers',
        'Business registration verification',
        'Product quality certifications',
        'Customer reviews and ratings'
      ],
      icon: Shield
    },
    {
      problem: 'Communication Barriers',
      description: 'Language differences, time zones, and communication gaps between buyers and sellers.',
      solution: 'Built-in Messaging System',
      details: [
        'Multi-language support (EN, FR, AR, PT)',
        'Real-time messaging platform',
        'Translation assistance',
        'RFQ management tools'
      ],
      icon: AlertCircle
    },
    {
      problem: 'Dispute Resolution',
      description: 'Lack of clear processes for handling order disputes, returns, and quality issues.',
      solution: 'Dedicated Dispute Resolution',
      details: [
        'Structured dispute process',
        'Mediation support',
        'Fair resolution policies',
        'Escrow protection during disputes'
      ],
      icon: CheckCircle
    }
  ];

  return (
    <>
      <SEO 
        title="Troubleshooting & Solutions - Afrikoni Support | AFRIKONI"
        description="Learn how Afrikoni solves common B2B trade challenges: payment security, logistics, supplier verification, and more across Africa."
        url="/troubleshooting"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-gold/20 via-afrikoni-cream to-afrikoni-offwhite border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6">
                Common Problems, Proven Solutions
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep mb-8">
                See how Afrikoni addresses the biggest challenges in African B2B trade
              </p>
            </motion.div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6">
              {problems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-afrikoni-chestnut text-lg mb-1">
                              {item.problem}
                            </h3>
                            <p className="text-sm text-afrikoni-deep/70 mb-3">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-afrikoni-gold/10 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-afrikoni-chestnut">
                              {item.solution}
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {item.details.map((detail, detailIdx) => (
                              <li key={detailIdx} className="flex items-start gap-2 text-sm text-afrikoni-deep">
                                <span className="text-afrikoni-gold mt-1">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


