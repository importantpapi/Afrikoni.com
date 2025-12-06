import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { hasFastResponse, isReadyToShip } from '@/utils/marketplaceHelpers';
import { addToViewHistory } from '@/utils/viewHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Package, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import FilterChip from '@/components/ui/FilterChip';
import SaveButton from '@/components/ui/SaveButton';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getProductPrimaryImage } from '@/utils/imageUrlHelper';
import OptimizedImage from '@/components/OptimizedImage';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [pagination, setPagination] = useState(createPaginationState());
  const [chipFilters, setChipFilters] = useState({
    verified: false,
    fastResponse: false,
    readyToShip: false
  });
  const { trackPageView } = useAnalytics();
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadData();
    trackPageView('Products');
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedCountry, priceRange, sortBy, debouncedSearchQuery, chipFilters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsResult, categoriesRes] = await Promise.all([
        paginateQuery(
          supabase
            .from('products')
            .select('*, companies!company_id(*), categories(*)')
            .eq('status', 'active'),
          { page: pagination.page, pageSize: 20, orderBy: 'created_at', ascending: false }
        ),
        supabase.from('categories').select('*')
      ]);
      
      const productsRes = { data: productsResult.data, error: productsResult.error };

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setPagination(prev => ({
        ...prev,
        ...productsResult,
        isLoading: false
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, companies(*), categories(*)')
        .eq('status', 'active');

      // Apply sorting
      const sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      const ascending = !sortBy.startsWith('-');
      query = query.order(sortField, { ascending });

      const result = await paginateQuery(query, {
        page: pagination.page,
        pageSize: 20,
        orderBy: sortField,
        ascending
      });
      
      const { data, error } = { data: result.data, error: result.error };
      
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
      
      if (error) throw error;

      let filtered = data || [];

      // Client-side filtering
      if (debouncedSearchQuery) {
        filtered = filtered.filter(p =>
          p.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      }

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id === selectedCategory);
      }

      if (selectedCountry !== 'all') {
        filtered = filtered.filter(p => 
          p.country_of_origin === selectedCountry || 
          p.companies?.country === selectedCountry
        );
      }

      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(p => {
          const productPrice = parseFloat(p?.price || p?.price_min || 0);
          if (max && !isNaN(max)) return productPrice >= min && productPrice <= max;
          return productPrice >= min;
        });
      }

      setProducts(filtered);
      setError(null);
    } catch (err) {
      setError('Failed to filter products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const AFRICAN_COUNTRIES = [
    'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Ethiopia',
    'Tanzania', 'Uganda', 'Rwanda', 'Senegal'
  ];

  // Memoize filtered products to avoid unnecessary re-renders
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (chipFilters.verified && !product.companies?.verified) return false;
      if (chipFilters.fastResponse && !hasFastResponse(product.companies)) return false;
      if (chipFilters.readyToShip && !isReadyToShip(product)) return false;
      return true;
    });
  }, [products, chipFilters]);

  return (
    <>
      <SEO 
        title="Products - Browse African Products"
        description="Browse thousands of verified products from African suppliers. Find quality products across all categories."
        url="/products"
      />
      <StructuredData type="WebSite" />
      <div className="min-h-screen bg-stone-50">
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">Discover Products</h1>
          <p className="text-lg text-afrikoni-deep mb-6">Browse thousands of products from verified African suppliers</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
              <Input
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Button size="lg" className="bg-afrikoni-gold hover:bg-amber-700">Search</Button>
          </div>
          {/* Chip Filters */}
          <div className="flex items-center gap-2 mt-4">
            <FilterChip
              label="Verified"
              active={chipFilters.verified}
              onRemove={() => setChipFilters({ ...chipFilters, verified: !chipFilters.verified })}
            />
            <FilterChip
              label="Fast Response"
              active={chipFilters.fastResponse}
              onRemove={() => setChipFilters({ ...chipFilters, fastResponse: !chipFilters.fastResponse })}
            />
            <FilterChip
              label="Ready to Ship"
              active={chipFilters.readyToShip}
              onRemove={() => setChipFilters({ ...chipFilters, readyToShip: !chipFilters.readyToShip })}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Card className="border-afrikoni-gold/20 sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-afrikoni-chestnut mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                  </h3>
                </div>
                <div>
                  <label className="text-sm font-medium text-afrikoni-deep mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-afrikoni-deep mb-2 block">Country</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {AFRICAN_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-afrikoni-deep mb-2 block">Price Range (USD)</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                      <SelectItem value="5000">$5,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCountry('all');
                    setPriceRange('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-afrikoni-deep">{products.length} products found</p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Newest First</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="-price">Price: High to Low</SelectItem>
                  <SelectItem value="-views">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-afrikoni-cream" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-afrikoni-cream rounded" />
                      <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="border-afrikoni-gold/20">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No products found</h3>
                  <p className="text-afrikoni-deep">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="group">
                    <Link
                      to={createPageUrl('ProductDetail') + '?id=' + product.id}
                      onClick={() => addToViewHistory(product.id, 'product', {
                        title: product.title,
                        category_id: product.category_id,
                        country: product.country_of_origin
                      })}
                    >
                      <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <div className="h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden relative">
                          {(() => {
                            const imageUrl = getProductPrimaryImage(product);
                            return imageUrl ? (
                              <OptimizedImage
                                src={imageUrl}
                                alt={product.title || 'Product image'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                width={400}
                                height={300}
                                quality={85}
                                placeholder="/placeholder.png"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-afrikoni-deep/70" />
                              </div>
                            );
                          })()}
                          {product.views > 50 && (
                            <Badge className="absolute top-3 left-3 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                              <TrendingUp className="w-3 h-3 mr-1" /> Trending
                            </Badge>
                          )}
                          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
                            <SaveButton itemId={product.id} itemType="product" />
                          </div>
                        </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-afrikoni-chestnut group-hover:text-afrikoni-gold transition mb-2 line-clamp-2 h-12">
                          {product.title}
                        </h3>
                        {/* Trust Signals */}
                        {product.companies && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {product.companies.verified && (
                              <Badge variant="verified" className="text-xs">Verified</Badge>
                            )}
                            {product.companies.trust_score > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Trust: {product.companies.trust_score}%
                              </Badge>
                            )}
                            {product.companies.response_rate > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {product.companies.response_rate}% Response
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-2xl font-bold text-amber-600">${product.price}</span>
                          <span className="text-sm text-afrikoni-deep/70">/ {product.unit}</span>
                        </div>
                        <div className="space-y-1.5 text-sm text-afrikoni-deep">
                          <div>MOQ: {product.moq} {product.unit}</div>
                          {product.delivery_time && (
                            <div className="text-xs text-afrikoni-deep/70">Delivery: {product.delivery_time}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

