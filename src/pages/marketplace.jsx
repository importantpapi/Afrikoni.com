import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, SlidersHorizontal, MapPin, Shield, Star, MessageSquare, FileText,
  X, CheckCircle, Building2, Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/drawer';
import { supabase } from '@/api/supabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Marketplace() {
  const { trackPageView } = useAnalytics();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    country: '',
    verification: '',
    priceRange: '',
    moq: '',
    certifications: [],
    deliveryTime: ''
  });

  const categories = ['All Categories', 'Agriculture', 'Textiles', 'Industrial', 'Beauty & Health'];
  const countries = ['All Countries', 'Nigeria', 'Ghana', 'Egypt', 'Kenya', 'South Africa'];
  const verificationOptions = ['All', 'Verified', 'Premium Partner'];

  useEffect(() => {
    trackPageView('Marketplace');
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          companies(*),
          categories(*),
          product_images(*)
        `)
        .eq('status', 'active')
        .order('featured DESC, created_at DESC')
        .limit(100);
      
      if (error) throw error;
      
      // Transform products to include primary image
      const productsWithImages = (data || []).map(product => {
        const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
        return {
          ...product,
          primaryImage: primaryImage?.url || product.images?.[0] || null
        };
      });
      
      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (selectedFilters.category && product.category_id !== selectedFilters.category) return false;
    if (selectedFilters.country && (product.companies?.country !== selectedFilters.country && product.country_of_origin !== selectedFilters.country)) return false;
    if (selectedFilters.verification === 'Verified' && !product.companies?.verified) return false;
    if (selectedFilters.verification === 'Premium Partner' && product.companies?.trust_score < 80) return false;
    
    // Price range filter
    if (selectedFilters.priceRange) {
      const [min, max] = selectedFilters.priceRange.split('-').map(Number);
      const productPrice = product.price_min || product.price || 0;
      if (productPrice < min || (max && productPrice > max)) return false;
    }
    
    return true;
  });

  const ProductCard = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${product.slug || product.id}`}>
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card hover className="h-full">
            <div className="relative h-48 bg-afrikoni-cream rounded-t-xl overflow-hidden">
              <OptimizedImage
                src={product.primaryImage || product.images?.[0] || '/placeholder.png'}
                alt={product.title || product.name || 'Product'}
                className="w-full h-full object-cover"
              />
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <Badge variant="primary" className="text-xs">⭐ Featured</Badge>
                </div>
              )}
              {product.companies?.verified && (
                <div className="absolute top-2 right-2">
                  <Badge variant="verified" className="text-xs">✓ Verified</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-afrikoni-chestnut mb-2 line-clamp-2 text-sm md:text-base">
                {product.title || product.name}
              </h3>
              <p className="text-xs text-afrikoni-deep/70 mb-2 line-clamp-2">
                {product.short_description || product.description}
              </p>
              
              {/* Price Range */}
              <div className="flex items-center gap-2 mb-2">
                {product.price_min && product.price_max ? (
                  <div className="text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {product.price_min} – {product.price_max}
                  </div>
                ) : product.price_min ? (
                  <div className="text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {product.price_min}+
                  </div>
                ) : product.price ? (
                  <div className="text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {product.price}
                  </div>
                ) : (
                  <div className="text-sm text-afrikoni-deep/70">Price on request</div>
                )}
              </div>
              
              {/* MOQ */}
              {product.min_order_quantity && (
                <div className="text-xs text-afrikoni-deep/70 mb-2">
                  MOQ: {product.min_order_quantity} {product.moq_unit || product.unit || 'units'}
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-afrikoni-deep/70" />
                  <span className="text-xs text-afrikoni-deep">{product.companies?.company_name || 'Supplier'}</span>
                  <span className="text-xs text-afrikoni-deep/70">• {product.country_of_origin || product.companies?.country || 'N/A'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs" asChild>
                  <Link to={`/messages?recipient=${product.companies?.id || product.supplier_id || product.company_id}`}>
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Contact
                  </Link>
                </Button>
                <Button variant="primary" size="sm" className="flex-1 text-xs" asChild>
                  <Link to={`/rfq/create?product=${product.id}`}>
                    <FileText className="w-3 h-3 mr-1" />
                    Quote
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );


  return (
    <>
      <SEO 
        title="Marketplace - Browse African Products & Suppliers"
        description="Browse thousands of verified products and suppliers across Africa. Filter by category, country, verification status, and more."
        url="/marketplace"
      />
      <StructuredData type="WebSite" />
      <div className="min-h-screen bg-afrikoni-offwhite">
      {/* Header */}
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-afrikoni-deep/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search products, suppliers, or services..."
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFiltersOpen(true)}
              className="md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4 space-y-6">
                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedFilters({ ...selectedFilters, category: cat })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFilters.category === cat
                            ? 'bg-afrikoni-gold-50 text-afrikoni-gold font-semibold'
                            : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Country</h3>
                  <div className="space-y-2">
                    {countries.map((country) => (
                      <button
                        key={country}
                        onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFilters.country === country
                            ? 'bg-afrikoni-gold-50 text-afrikoni-gold font-semibold'
                            : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Verification</h3>
                  <div className="space-y-2">
                    {verificationOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedFilters({ ...selectedFilters, verification: opt })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedFilters.verification === opt
                            ? 'bg-afrikoni-gold-50 text-afrikoni-gold font-semibold'
                            : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                        }`}
                      >
                        {opt !== 'All' && <Shield className="w-4 h-4" />}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <Input placeholder="Min $" type="number" className="text-sm" />
                    <Input placeholder="Max $" type="number" className="text-sm" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Minimum Order (MOQ)</h3>
                  <div className="space-y-2">
                    <Input placeholder="Min quantity" type="number" className="text-sm" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Certifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
                      <input type="checkbox" className="rounded" />
                      <span>ISO Certified</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
                      <input type="checkbox" className="rounded" />
                      <span>Trade Shield Eligible</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Lead Time</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
                      Ready to Ship
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
                      Within 7 days
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
                      Within 30 days
                    </button>
                  </div>
                </div>

                <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream size="sm">
                  Apply Filters
                </Button>
                <Button variant="ghost" className="w-full" size="sm">
                  Clear All
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                  Marketplace
                </h1>
                <p className="text-sm text-afrikoni-deep">
                  {filteredProducts.length} products found
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm">Grid</Button>
                <Button variant="ghost" size="sm">List</Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-afrikoni-cream" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-afrikoni-cream rounded" />
                      <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-afrikoni-gold/20">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No products found</h3>
                  <p className="text-afrikoni-deep">Try adjusting your filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="ghost" size="sm">Previous</Button>
              {[1, 2, 3, 4, 5].map((page) => (
                <Button
                  key={page}
                  variant={page === 1 ? 'primary' : 'ghost'}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              <Button variant="ghost" size="sm">Next</Button>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        position="bottom"
        title="Filters"
      >
        <div className="space-y-6">
          {/* Same filter content as sidebar */}
          <div>
            <h3 className="font-semibold text-afrikoni-chestnut mb-3">Category</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilters({ ...selectedFilters, category: cat })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFilters.category === cat
                      ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                      : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" className="w-full">
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </div>
    </>
  );
}

