import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Users, Shield, Globe, ShoppingBag, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function StatsSection() {
  const [animatedStats, setAnimatedStats] = useState({
    tradeVolume: 0,
    businesses: 0,
    suppliers: 0,
    countries: 0
  });

  const sectionRef = useRef(null);

  useEffect(() => {
    const animateStats = () => {
      const targets = {
        tradeVolume: 200,
        businesses: 200,
        suppliers: 5900,
        countries: 200
      };
      const duration = 2000;
      const startTime = Date.now();

      const updateStats = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        setAnimatedStats({
          tradeVolume: Math.floor(targets.tradeVolume * easeOutQuart),
          businesses: Math.floor(targets.businesses * easeOutQuart),
          suppliers: Math.floor(targets.suppliers * easeOutQuart),
          countries: Math.floor(targets.countries * easeOutQuart)
        });

        if (progress < 1) {
          requestAnimationFrame(updateStats);
        } else {
          setAnimatedStats(targets);
        }
      };

      requestAnimationFrame(updateStats);
    };

    // Trigger animation when component is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateStats();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      icon: DollarSign,
      value: `${animatedStats.tradeVolume}M+`,
      label: 'Trade Volume',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-600'
    },
    {
      icon: Users,
      value: `${animatedStats.businesses}K+`,
      label: 'Businesses',
      color: 'text-afrikoni-gold',
      bgColor: 'bg-afrikoni-gold/20',
      iconBg: 'bg-afrikoni-gold'
    },
    {
      icon: Shield,
      value: animatedStats.suppliers.toLocaleString(),
      label: 'Verified Suppliers',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-600'
    },
    {
      icon: Globe,
      value: `${animatedStats.countries}+`,
      label: 'Countries Reached',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-afrikoni-gold'
    }
  ];

  return (
    <div ref={sectionRef} className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-shadow">
                    <CardContent className="p-6 md:p-8 text-center">
                      <div className={`w-14 h-14 md:w-16 md:h-16 ${stat.iconBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-afrikoni-cream" />
                      </div>
                      <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                        {stat.value}
                      </div>
                      <div className="text-afrikoni-deep font-medium text-sm md:text-base">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        
        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mt-10 md:mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={createPageUrl('BuyerCentral')}>
              <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-creampx-6 md:px-8 py-5 md:py-6 text-base md:text-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Buying
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={createPageUrl('SellerOnboarding')}>
              <Button variant="outline" className="border-2 border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/20 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                <TrendingUp className="w-5 h-5 mr-2" />
                Start Selling
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
