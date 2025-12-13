/**
 * Case Studies / Impact Stories Section
 * Static placeholders for now (can be made dynamic with Supabase later)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Globe, DollarSign, ArrowRight,
  CheckCircle, Users, Package
} from 'lucide-react';

export default function CaseStudies() {
  // No fake case studies - only show when we have real ones
  const caseStudies = [];

  // Hide section if no real case studies
  if (caseStudies.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-afrikoni-deep/80 max-w-3xl mx-auto">
            Real businesses achieving real results on Afrikoni
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {caseStudies.map((study, idx) => {
            const Icon = study.icon;
            return (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-xl">
                  <CardContent className="p-6 md:p-8">
                    {/* Category Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-afrikoni-gold/10 rounded-full mb-4">
                      <Icon className="w-4 h-4 text-afrikoni-gold" />
                      <span className="text-xs font-semibold text-afrikoni-gold">
                        {study.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-3" aria-label={`Case study: ${study.title}`}>
                      {study.title}
                    </h3>

                    {/* Description */}
                    <p className="text-afrikoni-deep/80 mb-6 leading-relaxed" aria-label="Case study description">
                      {study.description}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-afrikoni-gold/20">
                      {Object.entries(study.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-2xl font-bold text-afrikoni-gold">
                            {value}
                          </p>
                          <p className="text-xs text-afrikoni-deep/70 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="w-full border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10"
                      asChild
                      aria-label={`Read full story about ${study.title}`}
                    >
                      <Link to="/about">
                        Read Full Story
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </Link>
                    </Button>
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

