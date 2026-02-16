/**
 * Case Studies / Impact Stories Section
 * Static placeholders for now (can be made dynamic with Supabase later)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
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
          <p className="text-os-lg text-afrikoni-deep/80 max-w-3xl mx-auto">
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
                <Card className="h-full border-os-accent/20 hover:border-os-accent transition-all hover:shadow-os-lg">
                  <CardContent className="p-6 md:p-8">
                    {/* Category Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-os-accent/10 rounded-full mb-4">
                      <Icon className="w-4 h-4 text-os-accent" />
                      <span className="text-os-xs font-semibold text-os-accent">
                        {study.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-3" aria-label={`Case study: ${study.title}`}>
                      {study.title}
                    </h3>

                    {/* Description */}
                    <p className="text-afrikoni-deep/80 mb-6 leading-relaxed" aria-label="Case study description">
                      {study.description}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-os-accent/20">
                      {Object.entries(study.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-os-2xl font-bold text-os-accent">
                            {value}
                          </p>
                          <p className="text-os-xs text-afrikoni-deep/70 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="w-full border-os-accent text-afrikoni-chestnut hover:bg-os-accent/10"
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

