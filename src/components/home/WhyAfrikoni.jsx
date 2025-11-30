import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Award, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function WhyAfrikoni() {
  const scrollContainerRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (scrollContainerRef.current) {
      if (isLeftSwipe) {
        scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
      if (isRightSwipe) {
        scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      }
    }
  };
  const features = [
    {
      icon: Shield,
      subtitle: '100% VERIFIED',
      title: 'Verified Suppliers Only',
      description: 'Every supplier undergoes rigorous verification including business registration, quality certifications, and background checks.',
      color: 'text-green-600',
      borderColor: 'border-green-600',
      iconBg: 'bg-green-50'
    },
    {
      icon: Lock,
      subtitle: 'BANK GRADE SECURITY',
      title: 'Secure Escrow Payments',
      description: 'Your payments are protected until you confirm receipt and satisfaction with your order.',
      color: 'text-blue-600',
      borderColor: 'border-blue-600',
      iconBg: 'bg-blue-50'
    },
    {
      icon: Award,
      subtitle: 'QUALITY ASSURED',
      title: 'Quality Guarantee',
      description: 'Money-back guarantee on all orders. If you\'re not satisfied, we\'ll make it right.',
      color: 'text-yellow-600',
      borderColor: 'border-yellow-600',
      iconBg: 'bg-yellow-50'
    },
    {
      icon: Users,
      subtitle: 'GROWING COMMUNITY',
      title: 'Trusted by 50,000+ Buyers',
      description: 'Join thousands of successful businesses who have grown their trade through Afrikoni.',
      color: 'text-purple-600',
      borderColor: 'border-purple-600',
      iconBg: 'bg-purple-50'
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
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3 md:mb-4">
            Why 50,000+ Buyers Trust Afrikoni
          </h2>
          <p className="text-base md:text-lg text-afrikoni-deep max-w-3xl mx-auto">
            We've built Africa's most trusted B2B marketplace with security and quality at the core.
          </p>
        </motion.div>
        
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
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
                  <Card className={`border-l-4 ${feature.borderColor} rounded-lg shadow-md hover:shadow-xl transition-all`}>
                    <CardContent className="p-5 md:p-6">
                      <Icon className={`w-10 h-10 ${feature.color} mb-4`} />
                      <p className="text-sm text-afrikoni-deep/70 mb-1">{feature.subtitle}</p>
                      <h3 className={`font-bold text-lg md:text-xl ${feature.color} mb-3`}>
                        {feature.title}
                      </h3>
                      <p className="text-afrikoni-deep text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Scrollable */}
        <div 
          ref={scrollContainerRef}
          className="md:hidden overflow-x-auto scrollbar-hide"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card 
                    className={`border-l-4 ${feature.borderColor} rounded-lg shadow-md min-w-[280px]`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <CardContent className="p-5">
                      <Icon className={`w-10 h-10 ${feature.color} mb-4`} />
                      <p className="text-sm text-afrikoni-deep/70 mb-1">{feature.subtitle}</p>
                      <h3 className={`font-bold text-lg ${feature.color} mb-3`}>
                        {feature.title}
                      </h3>
                      <p className="text-afrikoni-deep text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
