import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Globe, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function PoweringAfricanTrade() {
  const sectionRef = useRef(null);
  const [animatedStats, setAnimatedStats] = useState({
    businesses: 0,
    countries: 0,
    tradeVolume: 0,
    suppliers: 0
  });

  useEffect(() => {
    const animateStats = () => {
      const targets = {
        businesses: 50000,
        countries: 54,
        tradeVolume: 200,
        suppliers: 5900
      };
      const duration = 2000;
      const startTime = Date.now();

      const updateStats = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        setAnimatedStats({
          businesses: Math.floor(targets.businesses * easeOutQuart),
          countries: Math.floor(targets.countries * easeOutQuart),
          tradeVolume: Math.floor(targets.tradeVolume * easeOutQuart),
          suppliers: Math.floor(targets.suppliers * easeOutQuart)
        });

        if (progress < 1) {
          requestAnimationFrame(updateStats);
        } else {
          setAnimatedStats(targets);
        }
      };

      requestAnimationFrame(updateStats);
    };

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
      icon: Users,
      value: `${animatedStats.businesses.toLocaleString()}+`,
      label: 'Businesses',
      color: 'text-os-accent',
      iconBg: 'bg-os-accent/20'
    },
    {
      icon: Globe,
      value: `${animatedStats.countries}+`,
      label: 'Countries',
      color: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      icon: DollarSign,
      value: `$${animatedStats.tradeVolume}M+`,
      label: 'Trade Volume',
      color: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      icon: TrendingUp,
      value: `${animatedStats.suppliers.toLocaleString()}+`,
      label: 'Verified Suppliers',
      color: 'text-purple-600',
      iconBg: 'bg-purple-100'
    }
  ];

  return (
    <div ref={sectionRef} className="py-12 md:py-16 bg-gradient-to-br from-os-accent/20 to-afrikoni-cream-200">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3 md:mb-4">Powering African Trade</h2>
          <p className="text-os-base md:text-os-lg text-afrikoni-deep max-w-3xl mx-auto">
            Join thousands of successful businesses transforming trade across Africa
          </p>
        </motion.div>
        
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
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-os-md hover:shadow-2xl transition-all bg-afrikoni-offwhite rounded-os-sm">
                    <CardContent className="p-6 md:p-8 text-center">
                      <div className={`w-14 h-14 md:w-16 md:h-16 ${stat.iconBg} rounded-os-sm flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-7 h-7 md:w-8 md:h-8 ${stat.color}`} />
                      </div>
                      <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                        {stat.value}
                      </div>
                      <div className="text-afrikoni-deep font-medium text-os-sm md:text-os-base">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

