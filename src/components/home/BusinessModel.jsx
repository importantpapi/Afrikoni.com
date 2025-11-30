import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BusinessModel() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Browse products & suppliers',
        'Basic search & filters',
        'Send inquiries',
        'Access to RFQ system',
        'Community support'
      ],
      color: 'border-afrikoni-gold/30',
      buttonColor: 'bg-zinc-600 hover:bg-zinc-700',
      icon: Star
    },
    {
      name: 'Verified',
      price: '$99',
      period: 'per month',
      description: 'For serious traders',
      features: [
        'Everything in Free',
        'Business verification badge',
        'Priority customer support',
        'Advanced analytics',
        'AI-powered matching',
        'Trade finance access'
      ],
      color: 'border-blue-500',
      buttonColor: 'bg-afrikoni-gold hover:bg-afrikoni-goldDark',
      icon: Shield,
      popular: true
    },
    {
      name: 'Premium',
      price: '$299',
      period: 'per month',
      description: 'For enterprise businesses',
      features: [
        'Everything in Verified',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'Advanced security features',
        'Priority dispute resolution',
        'Exclusive supplier access'
      ],
      color: 'border-afrikoni-gold',
      buttonColor: 'bg-afrikoni-gold hover:bg-afrikoni-goldDark',
      icon: Zap
    }
  ];

  return (
    <div className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-3 md:mb-4">Choose Your Plan</h2>
          <p className="text-base md:text-lg text-afrikoni-deep max-w-3xl mx-auto">
            Flexible pricing options for businesses of all sizes
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {tiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className={`relative ${tier.popular ? 'md:scale-105' : ''}`}
                >
                  {tier.popular && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 bg-afrikoni-gold text-afrikoni-creampx-4 py-1 rounded-full text-sm font-semibold shadow-lg z-10"
                    >
                      Most Popular
                    </motion.div>
                  )}
                  <Card 
                    className={`border-2 ${tier.color} relative hover:shadow-2xl transition-all rounded-xl ${
                      tier.popular ? 'ring-4 ring-afrikoni-gold/30 shadow-afrikoni-xl' : ''
                    }`}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className={`w-14 h-14 md:w-16 md:h-16 ${tier.color.replace('border-', 'bg-').replace('-500', '-100')} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-7 h-7 md:w-8 md:h-8 ${tier.color.replace('border-', 'text-')}`} />
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">{tier.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut">{tier.price}</span>
                        <span className="text-afrikoni-deep ml-2 text-sm md:text-base">/{tier.period}</span>
                      </div>
                      <p className="text-xs md:text-sm text-afrikoni-deep/70 mt-2">{tier.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2.5 md:space-y-3 mb-5 md:mb-6">
                        {tier.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs md:text-sm text-afrikoni-deep">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to={createPageUrl('Signup')}>
                          <Button className={`w-full ${tier.buttonColor} text-afrikoni-cream shadow-md hover:shadow-lg transition-shadow`}>
                            Get Started
                          </Button>
                        </Link>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Verification Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 md:mt-16 text-center"
        >
          <h3 className="text-xl md:text-2xl font-bold font-serif text-afrikoni-chestnut mb-6 md:mb-8">Supplier Verification Badges</h3>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { icon: Shield, label: 'Verified Business', color: 'green' },
              { icon: CheckCircle, label: 'Quality Certified', color: 'blue' },
              { icon: Star, label: 'Top Rated', color: 'orange' },
              { icon: Zap, label: 'Premium Partner', color: 'purple' }
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 bg-${badge.color}-50 rounded-lg border border-${badge.color}-200 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 text-${badge.color}-600`} />
                  <span className={`font-semibold text-${badge.color}-700 text-sm md:text-base`}>{badge.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

