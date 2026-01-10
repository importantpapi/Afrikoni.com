import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Search, Users, FileText, Package, Truck, Shield, BarChart3, Star, TrendingUp, Zap, CheckCircle } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { 
      icon: Search, 
      title: 'Find Products', 
      description: 'Search millions of products',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('Products')
    },
    { 
      icon: Users, 
      title: 'Find Suppliers', 
      description: 'Connect with verified suppliers',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('Suppliers')
    },
    { 
      icon: TrendingUp, 
      title: 'Become a Seller', 
      description: 'Start selling on Afrikoni',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('SellerOnboarding')
    },
    { 
      icon: Users, 
      title: 'Become a Buyer', 
      description: 'Join as a verified buyer',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('BuyerCentral')
    },
    { 
      icon: Zap, 
      title: 'AI Matchmaking', 
      description: 'AI-powered supplier matching',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('AIMatchmaking')
    },
    { 
      icon: CheckCircle, 
      title: 'Afrikoni Verification', 
      description: 'Get verified and trusted',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: '/dashboard/verification'
    },
    { 
      icon: FileText, 
      title: 'Post RFQ', 
      description: 'Request for quotations',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('CreateRFQ')
    },
    { 
      icon: Package, 
      title: 'Browse Categories', 
      description: 'Explore product categories',
      iconColor: 'text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20',
      link: createPageUrl('Categories')
    }
  ];

  return (
    <div className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold font-serif text-afrikoni-chestnut text-center mb-3 md:mb-4"
        >
          Quick Actions
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base md:text-lg text-afrikoni-deep text-center mb-8 md:mb-12"
        >
          Everything you need to trade successfully across Africa
        </motion.p>
        <div className="grid md:grid-cols-4 gap-4 md:gap-6">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Link to={action.link}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg h-full">
                      <CardContent className="p-5 md:p-6 text-center">
                        <div className={`w-14 h-14 md:w-16 md:h-16 ${action.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                          <Icon className={`w-7 h-7 md:w-8 md:h-8 ${action.iconColor}`} />
                        </div>
                        <h3 className="font-bold text-afrikoni-chestnut mb-2 text-sm md:text-base">{action.title}</h3>
                        <p className="text-xs md:text-sm text-afrikoni-deep mb-4">{action.description}</p>
                        <Button variant="secondary" className="w-full text-sm">
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
