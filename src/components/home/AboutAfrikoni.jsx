import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Shield, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';

export default function AboutAfrikoni() {
  const features = [
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Find exactly what you need with advanced filters and AI-powered matching'
    },
    {
      icon: Users,
      title: 'Verified Suppliers',
      description: 'Connect with pre-verified suppliers you can trust across African markets'
    },
    {
      icon: Shield,
      title: 'Trade Shield Protection',
      description: 'Assisted and secured transaction workflows with quality guarantees protect every transaction'
    },
    {
      icon: Truck,
      title: 'Integrated Logistics',
      description: 'Complete sourcing solution with shipping and logistics support'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
            What Afrikoni Offers
          </h2>
          <p className="text-os-lg text-afrikoni-deep max-w-2xl mx-auto">
            A digital B2B trade platform building trust and structure in African trade
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-os-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-os-accent/20 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-os-accent" />
                    </div>
                    <h3 className="text-os-lg font-bold text-afrikoni-chestnut mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-afrikoni-deep text-os-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut rounded-os-md p-8 md:p-12 text-center text-afrikoni-cream"
        >
          <h3 className="text-os-2xl md:text-3xl font-bold font-serif mb-4">
            Join Afrikoni's B2B Trade Platform
          </h3>
          <p className="text-os-lg text-afrikoni-cream mb-6 max-w-2xl mx-auto">
            Connect with verified suppliers, source products, and grow your business with structured B2B trade across African markets
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight">
                Get Started Free
              </Button>
            </Link>
            <Link to="/buyer-hub">
              <Button size="lg" variant="secondary" className="border-afrikoni-cream text-afrikoni-cream hover:bg-afrikoni-cream/10">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

