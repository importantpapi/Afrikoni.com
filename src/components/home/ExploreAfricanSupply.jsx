import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Package } from 'lucide-react';
import { Sprout, Shirt, HardHat, Heart, Home, Smartphone, Coffee, Gem } from 'lucide-react';

// Popular categories (top 6 for compact display)
const popularCategories = [
  {
    name: 'Agriculture & Food',
    description: 'Fresh produce, grains, cocoa, coffee, cashew nuts, and processed foods.',
    icon: Sprout,
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&auto=format&fit=crop'
  },
  {
    name: 'Textiles & Apparel',
    description: 'African print fabrics, traditional garments, modern streetwear.',
    icon: Shirt,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop'
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Natural skincare, shea butter, black soap, cosmetics.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop'
  },
  {
    name: 'Industrial & Construction',
    description: 'Building materials, machinery, tools, construction equipment.',
    icon: HardHat,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop'
  },
  {
    name: 'Home & Living',
    description: 'Locally crafted furniture, home décor, traditional art.',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&auto=format&fit=crop'
  },
  {
    name: 'Consumer Electronics',
    description: 'Smartphones, laptops, accessories, power banks.',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop'
  }
];

// Priority countries (6-8 top sourcing countries)
const priorityCountries = [
  { name: 'Nigeria', flag: '🇳🇬', link: '/marketplace?country=nigeria' },
  { name: 'Ghana', flag: '🇬🇭', link: '/marketplace?country=ghana' },
  { name: 'Kenya', flag: '🇰🇪', link: '/marketplace?country=kenya' },
  { name: 'South Africa', flag: '🇿🇦', link: '/marketplace?country=south-africa' },
  { name: 'Morocco', flag: '🇲🇦', link: '/marketplace?country=morocco' },
  { name: 'Egypt', flag: '🇪🇬', link: '/marketplace?country=egypt' },
  { name: 'Côte d\'Ivoire', flag: '🇨🇮', link: '/marketplace?country=ivory-coast' },
  { name: 'Tanzania', flag: '🇹🇿', link: '/marketplace?country=tanzania' }
];

export default function ExploreAfricanSupply() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            Explore African Supply
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
            Browse products by category and country — or post a trade request to source faster.
          </p>
        </motion.div>

        {/* Two-Column Layout: Categories (Left) | Countries (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* LEFT COLUMN: Popular Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut flex items-center gap-2">
                <Package className="w-6 h-6 text-afrikoni-gold" />
                Popular Categories
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularCategories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <Link to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}>
                      <Card className="h-full hover:shadow-afrikoni-lg transition-all cursor-pointer border-afrikoni-gold/20 hover:border-afrikoni-gold/40 bg-afrikoni-cream overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                          {category.image && (
                            <img 
                              src={category.image} 
                              alt={category.name}
                              className="w-full h-full object-cover opacity-90"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="absolute top-3 left-3 w-10 h-10 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg">
                            <Icon className="w-5 h-5 text-afrikoni-chestnut" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-afrikoni-chestnut mb-2 text-base line-clamp-1">
                            {category.name}
                          </h4>
                          <p className="text-sm text-afrikoni-deep/70 mb-3 line-clamp-2 min-h-[2.5rem]">
                            {category.description}
                          </p>
                          <div className="flex items-center gap-1 text-afrikoni-gold text-sm font-medium">
                            <span>Explore</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Source by Country */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut flex items-center gap-2">
                <MapPin className="w-6 h-6 text-afrikoni-gold" />
                Source by Country
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              {priorityCountries.map((country, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <Link to={country.link}>
                    <Card className="h-full hover:shadow-afrikoni-lg transition-all cursor-pointer border-[1.5px] border-afrikoni-gold/20 hover:border-afrikoni-gold/40 bg-afrikoni-offwhite">
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2">{country.flag}</div>
                        <h4 className="font-bold text-afrikoni-chestnut mb-2 text-sm md:text-base">
                          {country.name}
                        </h4>
                        <div className="flex items-center justify-center gap-1 text-afrikoni-gold text-xs md:text-sm font-medium">
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
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
              className="mt-6"
            >
              <Link to="/countries">
                <Button variant="outline" className="w-full border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10">
                  View All Countries
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* RFQ CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 md:mt-16 pt-12 border-t-2 border-afrikoni-gold/20"
        >
          <div className="bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/5 to-afrikoni-gold/10 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
              Didn't find what you need?
            </h3>
            <p className="text-base md:text-lg text-afrikoni-deep/80 mb-6 max-w-2xl mx-auto">
              Get matched with verified African suppliers within 24–48 hours.
            </p>
            <Link to="/rfq/create">
              <Button 
                size="lg" 
                className="bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut font-semibold px-8 py-6 text-lg shadow-afrikoni-lg hover:shadow-afrikoni-xl transition-all"
              >
                Post a Trade Request (RFQ)
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

