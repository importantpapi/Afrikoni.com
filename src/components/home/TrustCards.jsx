import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

export default function TrustCards() {
  const { t } = useLanguage();
  
  const trustCards = [
    {
      icon: Users,
      title: t('trust.verified.title'),
      description: t('trust.verified.description'),
      link: '/suppliers',
      color: 'from-os-accent to-os-accentDark',
      iconBg: 'bg-os-accent/20',
      iconColor: 'text-os-accent'
    },
    {
      icon: Shield,
      title: t('trust.shield.title'),
      description: t('trust.shield.description'),
      link: '/order-protection',
      color: 'from-os-accent to-os-accentDark',
      iconBg: 'bg-os-accent/20',
      iconColor: 'text-os-accent'
    },
    {
      icon: Truck,
      title: t('trust.logistics.title'),
      description: t('trust.logistics.description'),
      link: '/logistics',
      color: 'from-os-accent to-os-accentDark',
      iconBg: 'bg-os-accent/20',
      iconColor: 'text-os-accent'
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut mb-4 tracking-tight">
            {t('trust.title') || 'Trade with Confidence'}
          </h2>
          <p className="text-os-lg md:text-os-xl text-afrikoni-deep/80 max-w-3xl mx-auto leading-relaxed">
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
                <Card className="h-full hover:shadow-os-gold-lg transition-all duration-300 border-2 border-os-accent/20 hover:border-os-accent/40 bg-white group">
                  <CardContent className="p-8">
                    <div className={`w-20 h-20 ${card.iconBg} rounded-os-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-os-md`}>
                      <Icon className={`w-10 h-10 ${card.iconColor}`} />
                    </div>
                    <h3 className="text-os-2xl font-bold text-afrikoni-chestnut mb-3 leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-afrikoni-deep/80 mb-6 leading-relaxed text-os-base">
                      {card.description}
                    </p>
                    <Link to={card.link}>
                      <Button variant="secondary" className="w-full border-2 border-os-accent/30 hover:border-os-accent hover:bg-os-accent/5 font-semibold">
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

