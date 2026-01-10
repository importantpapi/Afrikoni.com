import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Lock, CheckCircle, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function ProtectionSection() {
  const steps = [
    {
      number: 1,
      icon: ShoppingCart,
      title: 'Place Order',
      description: 'Order from verified suppliers with Afrikoni protection.',
      color: 'bg-afrikoni-gold',
      badgeColor: 'bg-green-600'
    },
    {
      number: 2,
      icon: Lock,
      title: 'Secure Payment',
      description: 'Your payment is held in escrow until delivery confirmation.',
      color: 'bg-afrikoni-gold',
      badgeColor: 'bg-green-600'
    },
    {
      number: 3,
      icon: CheckCircle,
      title: 'Quality Check',
      description: 'Inspect products and confirm they meet your requirements.',
      color: 'bg-green-600',
      badgeColor: 'bg-green-600'
    },
    {
      number: 4,
      icon: Wallet,
      title: 'Release Payment',
      description: 'Payment is released to supplier only after your approval.',
      color: 'bg-purple-600',
      badgeColor: 'bg-green-600'
    }
  ];

  return (
    <div className="py-12 md:py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-afrikoni-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12 text-center"
        >
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Buyer Protection</span>
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mt-2 mb-3 md:mb-4">Trade with Complete Confidence</h2>
          <p className="text-base md:text-lg text-afrikoni-deep max-w-3xl mx-auto">
            Afrikoni Buyer Protection ensures your transactions are secure, products meet quality standards, and deliveries arrive on time. Your business is protected every step of the way.
          </p>
        </motion.div>
        
        {/* Horizontal Flow with Animation */}
        <div className="relative">
          <div className="hidden md:block absolute top-20 md:top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200" style={{ marginLeft: '10%', marginRight: '10%' }} />
          <div className="grid md:grid-cols-4 gap-4 md:gap-6 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <motion.div
                    whileHover={{ y: -5, scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite hover:shadow-2xl transition-all rounded-xl">
                      <CardContent className="p-5 md:p-6 text-center">
                        <div className="relative inline-block mb-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-creamfont-bold text-base md:text-lg absolute -top-2 left-1/2 -translate-x-1/2 z-10 shadow-lg">
                            {step.number}
                          </div>
                          <motion.div 
                            className={`w-16 h-16 md:w-20 md:h-20 ${step.color} rounded-lg flex items-center justify-center mx-auto mt-5 md:mt-6 shadow-md`}
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon className="w-8 h-8 md:w-10 md:h-10 text-afrikoni-cream" />
                          </motion.div>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-afrikoni-chestnut mb-2">{step.title}</h3>
                        <p className="text-xs md:text-sm text-afrikoni-deep">{step.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
