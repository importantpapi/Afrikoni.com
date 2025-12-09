import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SourceByCountry() {
  const countries = [
    { name: 'Ghana', flag: '🇬🇭', products: '2,500+', link: '/marketplace?country=ghana' },
    { name: 'Kenya', flag: '🇰🇪', products: '3,200+', link: '/marketplace?country=kenya' },
    { name: 'Nigeria', flag: '🇳🇬', products: '5,800+', link: '/marketplace?country=nigeria' },
    { name: 'Côte d\'Ivoire', flag: '🇨🇮', products: '1,900+', link: '/marketplace?country=ivory-coast' },
    { name: 'Morocco', flag: '🇲🇦', products: '2,100+', link: '/marketplace?country=morocco' },
    { name: 'South Africa', flag: '🇿🇦', products: '4,500+', link: '/marketplace?country=south-africa' },
    { name: 'Egypt', flag: '🇪🇬', products: '3,000+', link: '/marketplace?country=egypt' },
    { name: 'Tanzania', flag: '🇹🇿', products: '1,800+', link: '/marketplace?country=tanzania' }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            Source by Country
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
            Discover products and suppliers from specific African countries
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {countries.map((country, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Link to={country.link}>
                <Card className="h-full hover:shadow-afrikoni-lg transition-all cursor-pointer border-[1.5px] border-afrikoni-gold bg-afrikoni-offwhite">
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{country.flag}</div>
                    <h3 className="font-bold text-afrikoni-chestnut mb-1">
                      {country.name}
                    </h3>
                    <p className="text-sm text-afrikoni-deep mb-2">
                      {country.products} products
                    </p>
                    <div className="flex items-center justify-center gap-1 text-afrikoni-gold text-sm font-medium">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link to="/countries">
            <Button>
              View All Countries
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

