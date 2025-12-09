import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

export default function TrustCards() {
  const { t } = useLanguage();
  
  const trustCards = [
    {
      icon: Users,
      title: t('trust.verified.title'),
      description: t('trust.verified.description'),
      link: '/suppliers',
      color: 'from-afrikoni-gold to-afrikoni-goldDark',
      iconBg: 'bg-afrikoni-gold/20',
      iconColor: 'text-afrikoni-gold'
    },
    {
      icon: Shield,
      title: t('trust.shield.title'),
      description: t('trust.shield.description'),
      link: '/order-protection',
      color: 'from-afrikoni-gold to-afrikoni-goldDark',
      iconBg: 'bg-afrikoni-gold/20',
      iconColor: 'text-afrikoni-gold'
    },
    {
      icon: Truck,
      title: t('trust.logistics.title'),
      description: t('trust.logistics.description'),
      link: '/logistics',
      color: 'from-afrikoni-gold to-afrikoni-goldDark',
      iconBg: 'bg-afrikoni-gold/20',
      iconColor: 'text-afrikoni-gold'
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            {t('trust.title') || 'Trade with Confidence'}
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
            {t('trust.subtitle') || 'Everything you need for safe and successful B2B trading across Africa'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {trustCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:shadow-afrikoni-lg transition-all border border-afrikoni-gold/20">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-8 h-8 ${card.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                      {card.title}
                    </h3>
                    <p className="text-afrikoni-deep mb-4">
                      {card.description}
                    </p>
                    <Link to={card.link}>
                      <Button variant="secondary" className="w-full">
                        {t('common.learnMore') || 'Learn More'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

