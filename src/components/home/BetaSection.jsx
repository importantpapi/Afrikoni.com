import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, CheckCircle, Target, Shield } from 'lucide-react';

export default function BetaSection() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-afrikoni-gold/20 border border-afrikoni-gold/40 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-afrikoni-gold" />
            <span className="text-sm font-semibold text-afrikoni-chestnut">BETA LIVE</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-3">
            Afrikoni Beta is Live
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto mb-6">
            We onboard buyers first, then suppliers based on real demand. Quality &gt; quantity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/50">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-afrikoni-gold mx-auto mb-3" />
                <h3 className="font-semibold text-afrikoni-chestnut mb-2">Demand-Driven</h3>
                <p className="text-sm text-afrikoni-deep">
                  Buyers post requests. Suppliers respond to real demand.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/50">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-afrikoni-gold mx-auto mb-3" />
                <h3 className="font-semibold text-afrikoni-chestnut mb-2">Verified Only</h3>
                <p className="text-sm text-afrikoni-deep">
                  Every supplier is verified. No fake listings.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-afrikoni-gold mx-auto mb-3" />
                <h3 className="font-semibold text-afrikoni-chestnut mb-2">Real Transactions</h3>
                <p className="text-sm text-afrikoni-deep">
                  Real trades, real suppliers, real results.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

