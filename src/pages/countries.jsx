import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import SEO from '@/components/SEO';

// All 54 African countries with flags (alphabetically sorted)
const ALL_AFRICAN_COUNTRIES = [
  { name: 'Algeria', flag: '🇩🇿', code: 'algeria' },
  { name: 'Angola', flag: '🇦🇴', code: 'angola' },
  { name: 'Benin', flag: '🇧🇯', code: 'benin' },
  { name: 'Botswana', flag: '🇧🇼', code: 'botswana' },
  { name: 'Burkina Faso', flag: '🇧🇫', code: 'burkina-faso' },
  { name: 'Burundi', flag: '🇧🇮', code: 'burundi' },
  { name: 'Cameroon', flag: '🇨🇲', code: 'cameroon' },
  { name: 'Cape Verde', flag: '🇨🇻', code: 'cape-verde' },
  { name: 'Central African Republic', flag: '🇨🇫', code: 'central-african-republic' },
  { name: 'Chad', flag: '🇹🇩', code: 'chad' },
  { name: 'Comoros', flag: '🇰🇲', code: 'comoros' },
  { name: 'Congo', flag: '🇨🇬', code: 'congo' },
  { name: 'DR Congo', flag: '🇨🇩', code: 'dr-congo' },
  { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'ivory-coast' },
  { name: 'Djibouti', flag: '🇩🇯', code: 'djibouti' },
  { name: 'Egypt', flag: '🇪🇬', code: 'egypt' },
  { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'equatorial-guinea' },
  { name: 'Eritrea', flag: '🇪🇷', code: 'eritrea' },
  { name: 'Eswatini', flag: '🇸🇿', code: 'eswatini' },
  { name: 'Ethiopia', flag: '🇪🇹', code: 'ethiopia' },
  { name: 'Gabon', flag: '🇬🇦', code: 'gabon' },
  { name: 'Gambia', flag: '🇬🇲', code: 'gambia' },
  { name: 'Ghana', flag: '🇬🇭', code: 'ghana' },
  { name: 'Guinea', flag: '🇬🇳', code: 'guinea' },
  { name: 'Guinea-Bissau', flag: '🇬🇼', code: 'guinea-bissau' },
  { name: 'Kenya', flag: '🇰🇪', code: 'kenya' },
  { name: 'Lesotho', flag: '🇱🇸', code: 'lesotho' },
  { name: 'Liberia', flag: '🇱🇷', code: 'liberia' },
  { name: 'Libya', flag: '🇱🇾', code: 'libya' },
  { name: 'Madagascar', flag: '🇲🇬', code: 'madagascar' },
  { name: 'Malawi', flag: '🇲🇼', code: 'malawi' },
  { name: 'Mali', flag: '🇲🇱', code: 'mali' },
  { name: 'Mauritania', flag: '🇲🇷', code: 'mauritania' },
  { name: 'Mauritius', flag: '🇲🇺', code: 'mauritius' },
  { name: 'Morocco', flag: '🇲🇦', code: 'morocco' },
  { name: 'Mozambique', flag: '🇲🇿', code: 'mozambique' },
  { name: 'Namibia', flag: '🇳🇦', code: 'namibia' },
  { name: 'Niger', flag: '🇳🇪', code: 'niger' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'nigeria' },
  { name: 'Rwanda', flag: '🇷🇼', code: 'rwanda' },
  { name: 'São Tomé and Príncipe', flag: '🇸🇹', code: 'sao-tome-and-principe' },
  { name: 'Senegal', flag: '🇸🇳', code: 'senegal' },
  { name: 'Seychelles', flag: '🇸🇨', code: 'seychelles' },
  { name: 'Sierra Leone', flag: '🇸🇱', code: 'sierra-leone' },
  { name: 'Somalia', flag: '🇸🇴', code: 'somalia' },
  { name: 'South Africa', flag: '🇿🇦', code: 'south-africa' },
  { name: 'South Sudan', flag: '🇸🇸', code: 'south-sudan' },
  { name: 'Sudan', flag: '🇸🇩', code: 'sudan' },
  { name: 'Tanzania', flag: '🇹🇿', code: 'tanzania' },
  { name: 'Togo', flag: '🇹🇬', code: 'togo' },
  { name: 'Tunisia', flag: '🇹🇳', code: 'tunisia' },
  { name: 'Uganda', flag: '🇺🇬', code: 'uganda' },
  { name: 'Zambia', flag: '🇿🇲', code: 'zambia' },
  { name: 'Zimbabwe', flag: '🇿🇼', code: 'zimbabwe' }
];

export default function Countries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [productCounts, setProductCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load product counts for each country
  React.useEffect(() => {
    const loadProductCounts = async () => {
      try {
        // Get product counts grouped by country
        const { data: products } = await supabase
          .from('products')
          .select('country_of_origin')
          .eq('status', 'active');

        if (Array.isArray(products)) {
          const counts = {};
          products.forEach(product => {
            if (product?.country_of_origin) {
              const countryName = product.country_of_origin;
              counts[countryName] = (counts[countryName] || 0) + 1;
            }
          });
          setProductCounts(counts);
        }
      } catch (error) {
        // Silently fail - counts are optional
      } finally {
        setIsLoading(false);
      }
    };

    loadProductCounts();
  }, []);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_AFRICAN_COUNTRIES;
    }

    const query = searchQuery.toLowerCase().trim();
    return ALL_AFRICAN_COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getProductCount = (countryName) => {
    const count = productCounts[countryName] || 0;
    if (count === 0) return 'Coming soon';
    if (count < 100) return `${count}+`;
    return `${Math.floor(count / 100) * 100}+`;
  };

  return (
    <>
      <SEO
        title="Source by Country - African Suppliers by Country | Afrikoni"
        description="Discover products and verified suppliers across all 54 African countries. Browse by country of origin and explore regional opportunities on Afrikoni."
        url="/countries"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            All African Countries
          </h1>
          <p className="text-lg md:text-xl text-afrikoni-deep max-w-2xl mx-auto mb-6">
            Discover products and suppliers from all 54 African countries
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
              <Input
                type="text"
                placeholder="Search countries by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg border-2 border-afrikoni-gold/30 focus:border-afrikoni-gold bg-afrikoni-cream"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-afrikoni-deep/70 mt-3">
                {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
              </p>
            )}
          </div>
        </motion.div>

        {/* Countries Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
          >
            {filteredCountries.map((country, idx) => {
              const productCount = getProductCount(country.name);
              const hasProducts = productCounts[country.name] > 0;

              return (
                <motion.div
                  key={country.code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <Link to={`/marketplace?country=${country.code}`}>
                    <Card className="h-full hover:shadow-afrikoni-lg transition-all cursor-pointer border-[1.5px] border-afrikoni-gold/30 bg-afrikoni-cream hover:border-afrikoni-gold">
                      <CardContent className="p-3 md:p-4 text-center">
                        <div className="text-3xl md:text-4xl mb-2">{country.flag}</div>
                        <h3 className="font-bold text-afrikoni-chestnut mb-1 text-sm md:text-base leading-tight whitespace-normal break-words">
                          {country.name}
                        </h3>
                        <p className={`text-xs md:text-sm mb-2 ${hasProducts ? 'text-afrikoni-deep' : 'text-afrikoni-deep/60'}`}>
                          {productCount} {hasProducts ? 'products' : ''}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-afrikoni-gold text-xs md:text-sm font-medium">
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCountries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <MapPin className="w-16 h-16 mx-auto mb-4 text-afrikoni-deep/50" />
            <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">No countries found</h3>
            <p className="text-afrikoni-deep/70 mb-4">
              Try a different search term
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 md:mt-16 text-center"
        >
          <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-gold/5 border-afrikoni-gold/30">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut mb-3">
                Trade Across All 54 African Countries
              </h3>
              <p className="text-afrikoni-deep max-w-2xl mx-auto mb-4">
                Afrikoni connects you with verified suppliers and buyers across every African nation. 
                Whether you're sourcing from North, South, East, West, or Central Africa, we've got you covered.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-afrikoni-deep/70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-afrikoni-gold" />
                  <span>54 Countries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>Verified Suppliers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>Secure Transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </>
  );
}

