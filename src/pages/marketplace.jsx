import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { buildProductQuery } from '@/utils/queryBuilders';
import { hasFastResponse, isReadyToShip } from '@/utils/marketplaceHelpers';
import { addToViewHistory } from '@/utils/viewHistory';
import { useDebounce } from '@/hooks/useDebounce';
import AICopilotButton from '@/components/ai/AICopilotButton';
import AISuggestionCard from '@/components/ai/AISuggestionCard';
import { suggestProductsForBuyer } from '@/ai/aiFunctions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import {
  Search, Filter, SlidersHorizontal, MapPin, Shield, Star, MessageSquare, FileText,
  X, CheckCircle, Building2, Package, TrendingUp, Clock, Award, Bookmark, BookmarkCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer } from '@/components/ui/drawer';
import FilterChip from '@/components/ui/FilterChip';
import SaveButton from '@/components/ui/SaveButton';
import { PaginationFooter } from '@/components/ui/reusable/PaginationFooter';
import OptimizedImage from '@/components/OptimizedImage';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Marketplace() {
  const { trackPageView } = useAnalytics();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    country: '',
    verification: '',
    priceRange: '',
    moq: '',
    certifications: [],
    deliveryTime: '',
    verified: false,
    fastResponse: false,
    readyToShip: false
  });
  const [sortBy, setSortBy] = useState('-created_at');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [moqMin, setMoqMin] = useState('');

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  
  // Load categories and countries from database
  useEffect(() => {
    const loadCategoriesAndCountries = async () => {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          supabase.from('categories').select('id, name').order('name'),
          supabase.from('companies').select('country').not('country', 'is', null)
        ]);
        
        if (categoriesRes.data) {
          setCategories(['All Categories', ...categoriesRes.data.map(c => c.name)]);
        }
        
        if (countriesRes.data) {
          const uniqueCountries = [...new Set(countriesRes.data.map(c => c.country).filter(Boolean))].sort();
          setCountries(['All Countries', ...uniqueCountries]);
        }
      } catch (error) {
        // Fallback to default categories
        setCategories(['All Categories', 'Agriculture', 'Textiles', 'Industrial', 'Beauty & Health']);
        setCountries(['All Countries', 'Nigeria', 'Ghana', 'Egypt', 'Kenya', 'South Africa']);
      }
    };
    
    loadCategoriesAndCountries();
  }, []);
  const verificationOptions = ['All', 'Verified', 'Premium Partner'];
  const [pagination, setPagination] = useState(createPaginationState());
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [aiBestMatch, setAiBestMatch] = useState(null);
  const [aiBestMatchLoading, setAiBestMatchLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);

  useEffect(() => {
    trackPageView('Marketplace');
    loadProducts();
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('afrikoni_saved_searches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      // Silently fail
    }
  };

  const saveCurrentSearch = () => {
    const searchName = prompt('Name this search:');
    if (!searchName) return;

    const search = {
      id: Date.now().toString(),
      name: searchName,
      query: searchQuery,
      filters: selectedFilters,
      priceMin,
      priceMax,
      moqMin,
      sortBy,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSearches, search];
    setSavedSearches(updated);
    localStorage.setItem('afrikoni_saved_searches', JSON.stringify(updated));
    setShowSaveSearch(false);
  };

  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query || '');
    setSelectedFilters(savedSearch.filters || {
      category: '',
      country: '',
      verification: '',
      priceRange: '',
      moq: '',
      certifications: [],
      deliveryTime: '',
      verified: false,
      fastResponse: false,
      readyToShip: false
    });
    setPriceMin(savedSearch.priceMin || '');
    setPriceMax(savedSearch.priceMax || '');
    setMoqMin(savedSearch.moqMin || '');
    setSortBy(savedSearch.sortBy || '-created_at');
  };

  const deleteSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('afrikoni_saved_searches', JSON.stringify(updated));
  };

  useEffect(() => {
    applyFilters();
  }, [selectedFilters, searchQuery, sortBy, priceMin, priceMax, moqMin, debouncedSearchQuery]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Use buildProductQuery for server-side filtering
      let query = buildProductQuery({
        status: 'active',
        categoryId: selectedFilters.category || null,
        country: selectedFilters.country || null
      });
      
      // Add companies to select
      query = query.select(`
        *,
        companies(*),
        categories(*),
        product_images(*)
      `);
      
      // Apply sorting
      let sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      let ascending = !sortBy.startsWith('-');
      
      // Handle relevance sorting (default to created_at desc if no search query)
      if (sortBy === 'relevance') {
        if (debouncedSearchQuery) {
          // For relevance, we'll sort by views and created_at (client-side will handle better relevance)
          sortField = 'views';
          ascending = false;
        } else {
          sortField = 'created_at';
          ascending = false;
        }
      }
      
      query = query.order(sortField, { ascending });
      
      const result = await paginateQuery(
        query,
        { 
          page: pagination.page, 
          pageSize: 20,
          orderBy: sortField,
          ascending
        }
      );
      
      const { data, error } = result;
      
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
      
      if (error) throw error;
      
      // Transform products to include primary image
      const productsWithImages = Array.isArray(data) ? data.map(product => {
        const primaryImage = Array.isArray(product.product_images) ? product.product_images.find(img => img.is_primary) || product.product_images[0] : null;
        return {
          ...product,
          primaryImage: primaryImage?.url || (Array.isArray(product.images) ? product.images[0] : null) || null
        };
      }) : [];
      
      // Apply client-side filters (search, price range, MOQ, certifications, lead time, chip filters)
      const filtered = applyClientSideFilters(productsWithImages);
      setProducts(filtered);
    } catch (error) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyClientSideFilters = (productsList) => {
if (!Array.isArray(productsList)) return [];
    return productsList.filter(product => {
      // Enhanced search query - search across multiple fields
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const searchableFields = [
          product?.title,
          product?.name,
          product?.description,
          product?.short_description,
          product?.companies?.company_name,
          product?.country_of_origin,
          product?.companies?.country,
          product?.categories?.name,
          product?.tags?.join(' '),
          product?.keywords?.join(' ')
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(query)) {
          return false;
        }
      }
      
      // Price range
      if (priceMin || priceMax) {
        const productPrice = parseFloat(product?.price_min || product?.price || 0);
        if (priceMin && productPrice < parseFloat(priceMin)) return false;
        if (priceMax && productPrice > parseFloat(priceMax)) return false;
      }
      
      // MOQ
      if (moqMin) {
        const productMOQ = parseInt(product?.min_order_quantity || 0);
        if (productMOQ < parseInt(moqMin)) return false;
      }
      
      // Certifications
      if (selectedFilters.certifications.length > 0) {
        const productCerts = Array.isArray(product?.certifications) ? product.certifications : [];
        if (!selectedFilters.certifications.some(cert => productCerts.includes(cert))) return false;
      }
      
      // Lead time
      if (selectedFilters.deliveryTime) {
        const leadTime = parseInt(product?.lead_time_min_days || 0);
        if (selectedFilters.deliveryTime === 'ready' && leadTime > 0) return false;
        if (selectedFilters.deliveryTime === '7days' && leadTime > 7) return false;
        if (selectedFilters.deliveryTime === '30days' && leadTime > 30) return false;
      }
      
      // Chip filters
      if (selectedFilters.verified && !product?.companies?.verified) return false;
      if (selectedFilters.fastResponse && !hasFastResponse(product?.companies)) return false;
      if (selectedFilters.readyToShip && !isReadyToShip(product)) return false;
      
      return true;
    });
  };

  const applyFilters = () => {
    loadProducts();
  };

  const filteredProducts = products;

  const ProductCard = React.memo(({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
    >
      <Link 
        to={`/product?id=${product.id}`}
        onClick={(e) => {
          addToViewHistory(product.id, 'product', {
            title: product.title || product.name,
            category_id: product.category_id,
            country: product.country_of_origin
          });
        }}
      >
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
              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
                <SaveButton itemId={product.id} itemType="product" />
              </div>
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
                    {product.currency || 'USD'} {parseFloat(product.price_min).toLocaleString()} – {parseFloat(product.price_max).toLocaleString()}
                  </div>
                ) : product.price_min ? (
                  <div className="text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {parseFloat(product.price_min).toLocaleString()}+
                  </div>
                ) : product.price ? (
                  <div className="text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {parseFloat(product.price).toLocaleString()}
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
                  <span className="text-xs text-afrikoni-deep">{product?.companies?.company_name || 'Supplier'}</span>
                  <span className="text-xs text-afrikoni-deep/70">• {product?.country_of_origin || product?.companies?.country || 'N/A'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs" asChild>
                  <Link to={`/messages?recipient=${product?.companies?.id || product?.supplier_id || product?.company_id || ''}`}>
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Contact
                  </Link>
                </Button>
                <Button variant="primary" size="sm" className="flex-1 text-xs" asChild>
                  <Link to={`/dashboard/rfqs/new?product=${product.id}`}>
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
  ));

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Quick Filter Chips */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <FilterChip
                label="Verified Only"
                active={selectedFilters.verified}
                onRemove={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
              />
              <FilterChip
                label="Fast Response"
                active={selectedFilters.fastResponse}
                onRemove={() => setSelectedFilters({ ...selectedFilters, fastResponse: !selectedFilters.fastResponse })}
              />
              <FilterChip
                label="Ready to Ship"
                active={selectedFilters.readyToShip}
                onRemove={() => setSelectedFilters({ ...selectedFilters, readyToShip: !selectedFilters.readyToShip })}
              />
              {priceMin || priceMax ? null : (
                <FilterChip
                  label="Under $100"
                  active={false}
                  onRemove={() => {
                    setPriceMin('');
                    setPriceMax('100');
                  }}
                />
              )}
              {moqMin ? null : (
                <FilterChip
                  label="Low MOQ"
                  active={false}
                  onRemove={() => setMoqMin('1')}
                />
              )}
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
                    {Array.isArray(countries) && countries.map((country) => (
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
                    {Array.isArray(verificationOptions) && verificationOptions.map((opt) => (
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
                    <Input 
                      placeholder="Min $" 
                      type="number" 
                      className="text-sm"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <Input 
                      placeholder="Max $" 
                      type="number" 
                      className="text-sm"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Minimum Order (MOQ)</h3>
                  <div className="space-y-2">
                    <Input 
                      placeholder="Min quantity" 
                      type="number" 
                      className="text-sm"
                      value={moqMin}
                      onChange={(e) => setMoqMin(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Certifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedFilters.certifications.includes('ISO')}
                        onChange={(e) => {
                          const certs = e.target.checked
                            ? [...selectedFilters.certifications, 'ISO']
                            : selectedFilters.certifications.filter(c => c !== 'ISO');
                          setSelectedFilters({ ...selectedFilters, certifications: certs });
                        }}
                      />
                      <span>ISO Certified</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedFilters.certifications.includes('Trade Shield')}
                        onChange={(e) => {
                          const certs = e.target.checked
                            ? [...selectedFilters.certifications, 'Trade Shield']
                            : selectedFilters.certifications.filter(c => c !== 'Trade Shield');
                          setSelectedFilters({ ...selectedFilters, certifications: certs });
                        }}
                      />
                      <span>Trade Shield Eligible</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">Lead Time</h3>
                  <div className="space-y-2">
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilters.deliveryTime === 'ready'
                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                      }`}
                      onClick={() => setSelectedFilters({ 
                        ...selectedFilters, 
                        deliveryTime: selectedFilters.deliveryTime === 'ready' ? '' : 'ready' 
                      })}
                    >
                      Ready to Ship
                    </button>
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilters.deliveryTime === '7days'
                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                      }`}
                      onClick={() => setSelectedFilters({ 
                        ...selectedFilters, 
                        deliveryTime: selectedFilters.deliveryTime === '7days' ? '' : '7days' 
                      })}
                    >
                      Within 7 days
                    </button>
                    <button 
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilters.deliveryTime === '30days'
                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                      }`}
                      onClick={() => setSelectedFilters({ 
                        ...selectedFilters, 
                        deliveryTime: selectedFilters.deliveryTime === '30days' ? '' : '30days' 
                      })}
                    >
                      Within 30 days
                    </button>
                  </div>
                </div>

                <Button 
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream" 
                  size="sm"
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  size="sm"
                  onClick={() => {
                    setSelectedFilters({
                      category: '',
                      country: '',
                      verification: '',
                      priceRange: '',
                      moq: '',
                      certifications: [],
                      deliveryTime: '',
                      verified: false,
                      fastResponse: false,
                      readyToShip: false
                    });
                    setPriceMin('');
                    setPriceMax('');
                    setMoqMin('');
                    setSearchQuery('');
                  }}
                >
                  Clear All
                </Button>
              </CardContent>
            </Card>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-afrikoni-chestnut flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Saved Searches
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-afrikoni-offwhite group"
                      >
                        <button
                          onClick={() => loadSavedSearch(saved)}
                          className="flex-1 text-left text-sm text-afrikoni-deep hover:text-afrikoni-gold"
                        >
                          {saved.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteSavedSearch(saved.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Current Search Button */}
            {(searchQuery || selectedFilters.category || selectedFilters.country || priceMin || priceMax || moqMin) && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={saveCurrentSearch}
                  >
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Save This Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                  Marketplace
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-afrikoni-deep">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  </p>
                  {/* Active Filters Display */}
                  {(selectedFilters.category || selectedFilters.country || selectedFilters.verification || 
                    priceMin || priceMax || moqMin || selectedFilters.certifications.length > 0 ||
                    selectedFilters.deliveryTime || selectedFilters.verified || selectedFilters.fastResponse ||
                    selectedFilters.readyToShip || debouncedSearchQuery) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-afrikoni-deep/70">Active filters:</span>
                      {debouncedSearchQuery && (
                        <Badge variant="outline" className="text-xs">
                          Search: "{debouncedSearchQuery}"
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSearchQuery('')}
                          />
                        </Badge>
                      )}
                      {selectedFilters.category && selectedFilters.category !== 'All Categories' && (
                        <Badge variant="outline" className="text-xs">
                          {selectedFilters.category}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                          />
                        </Badge>
                      )}
                      {selectedFilters.country && selectedFilters.country !== 'All Countries' && (
                        <Badge variant="outline" className="text-xs">
                          {selectedFilters.country}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                          />
                        </Badge>
                      )}
                      {selectedFilters.verified && (
                        <Badge variant="outline" className="text-xs">
                          Verified
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSelectedFilters({ ...selectedFilters, verified: false })}
                          />
                        </Badge>
                      )}
                      {(priceMin || priceMax) && (
                        <Badge variant="outline" className="text-xs">
                          ${priceMin || '0'} - ${priceMax || '∞'}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => {
                              setPriceMin('');
                              setPriceMax('');
                            }}
                          />
                        </Badge>
                      )}
                      {moqMin && (
                        <Badge variant="outline" className="text-xs">
                          MOQ: {moqMin}+
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setMoqMin('')}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AICopilotButton
                  label="Best match for you"
                  size="xs"
                  loading={aiBestMatchLoading}
                  onClick={async () => {
                    setAiBestMatch(null);
                    if (!Array.isArray(filteredProducts) || filteredProducts.length === 0) return;
                    setAiBestMatchLoading(true);
                    try {
                      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
                      const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
                      if (!profile) {
                        setAiBestMatch(null);
                        return;
                      }
                      const { success, productIds } = await suggestProductsForBuyer(
                        {
                          id: profile.id,
                          company_name: profile.company_name,
                          country: profile.country,
                          categories: profile.categories
                        },
                        filteredProducts
                      );
                      if (success && Array.isArray(productIds) && productIds.length > 0) {
                        const bestId = productIds.find(id =>
                          filteredProducts.some(p => p.id === id)
                        );
                        const match = filteredProducts.find(p => p.id === bestId) || null;
                        setAiBestMatch(match);
                      }
                    } catch {
                      setAiBestMatch(null);
                    } finally {
                      setAiBestMatchLoading(false);
                    }
                  }}
                />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 md:w-48 border-afrikoni-gold/30">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="-created_at">Newest First</SelectItem>
                    <SelectItem value="created_at">Oldest First</SelectItem>
                    <SelectItem value="price_min">Price: Low to High</SelectItem>
                    <SelectItem value="-price_min">Price: High to Low</SelectItem>
                    <SelectItem value="-views">Most Popular</SelectItem>
                    <SelectItem value="-rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm">Grid</Button>
                  <Button variant="ghost" size="sm">List</Button>
                </div>
              </div>
            </div>

            {aiBestMatch && (
              <div className="mb-4">
                <AISuggestionCard
                  title={aiBestMatch.title || aiBestMatch.name}
                  description={aiBestMatch.short_description || aiBestMatch.description}
                  badges={[
                    aiBestMatch?.companies?.country
                      ? { label: aiBestMatch.companies.country }
                      : null
                  ].filter(Boolean)}
                  onClick={() => {
                    addToViewHistory(aiBestMatch.id, 'product', {
                      title: aiBestMatch.title || aiBestMatch.name,
                      category_id: aiBestMatch.category_id,
                      country: aiBestMatch.country_of_origin
                    });
                  }}
                />
              </div>
            )}

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
                {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <PaginationFooter
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
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

