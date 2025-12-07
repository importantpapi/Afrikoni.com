import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
import SearchHistory from '@/components/search/SearchHistory';
import { toast } from 'sonner';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';
import { AFRICAN_COUNTRIES, AFRICAN_COUNTRY_CODES } from '@/constants/countries';
import { useLanguage } from '@/i18n/LanguageContext';
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import { trackProductView } from '@/lib/supabaseQueries/products';

export default function Marketplace() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        const [categoriesRes] = await Promise.all([
          supabase.from('categories').select('id, name').order('name')
        ]);
        
        if (categoriesRes.data) {
          // Store categories with both ID and name for filtering
          setCategories(categoriesRes.data);
        }
        
        // Use full static list of African countries for a consistent marketplace selector
        setCountries([t('marketplace.allCountries'), ...AFRICAN_COUNTRIES]);

        // Apply country from URL (e.g. /marketplace?country=Nigeria or ?country=nigeria)
        const urlCountryParam = searchParams.get('country');
        if (urlCountryParam) {
          const lower = urlCountryParam.toLowerCase();
          const mappedName =
            AFRICAN_COUNTRY_CODES[lower] ||
            AFRICAN_COUNTRIES.find((c) => c.toLowerCase() === lower);
          if (mappedName) {
            setSelectedFilters((prev) => ({ ...prev, country: mappedName }));
          }
        }

        // Apply category from URL (e.g. /marketplace?category=category-id or ?category=category-name)
        const urlCategoryParam = searchParams.get('category');
        if (urlCategoryParam && categoriesRes.data) {
          // Try to find by ID first
          const categoryById = categoriesRes.data.find(c => c.id === urlCategoryParam);
          // If not found, try by name
          const categoryByName = categoriesRes.data.find(c => 
            c.name.toLowerCase() === urlCategoryParam.toLowerCase()
          );
          
          if (categoryById) {
            setSelectedFilters((prev) => ({ ...prev, category: categoryById.id }));
          } else if (categoryByName) {
            setSelectedFilters((prev) => ({ ...prev, category: categoryByName.id }));
          }
        }
      } catch (error) {
        // Fallback to default categories
        setCategories(['All Categories', 'Agriculture', 'Textiles', 'Industrial', 'Beauty & Health']);
        setCountries([t('marketplace.allCountries'), ...AFRICAN_COUNTRIES]);
      }
    };
    
    loadCategoriesAndCountries();
  }, [searchParams]);
  const verificationOptions = ['All', 'Verified', 'Premium Partner'];
  const POPULAR_COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco'];
  const [pagination, setPagination] = useState(createPaginationState());
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [aiBestMatch, setAiBestMatch] = useState(null);
  const [aiBestMatchLoading, setAiBestMatchLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);

  // Helper: log search analytics to Supabase (non-blocking)
  const logSearchEvent = async ({ resultCount }) => {
    try {
      const hasQuery = debouncedSearchQuery && debouncedSearchQuery.trim().length > 0;
      const hasFilters =
        selectedFilters.category ||
        selectedFilters.country ||
        selectedFilters.verification ||
        selectedFilters.priceRange ||
        selectedFilters.moq ||
        selectedFilters.certifications.length > 0 ||
        selectedFilters.deliveryTime ||
        selectedFilters.verified ||
        selectedFilters.fastResponse ||
        selectedFilters.readyToShip ||
        priceMin ||
        priceMax ||
        moqMin;

      // Only log meaningful searches (query or filters applied)
      if (!hasQuery && !hasFilters) return;

      await supabase.from('search_events').insert({
        query: hasQuery ? debouncedSearchQuery.trim() : null,
        filters: {
          ...selectedFilters,
          priceMin,
          priceMax,
          moqMin,
          sortBy,
        },
        result_count: typeof resultCount === 'number' ? resultCount : null,
        source_page: 'marketplace',
      });
    } catch (error) {
      // Analytics failures should never block UX
      // eslint-disable-next-line no-console
      console.error('Failed to log search event:', error);
    }
  };

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
    const searchName = prompt(t('marketplace.nameThisSearch'));
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
    // Add to search history when search is performed
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      addSearchToHistory(debouncedSearchQuery);
    }
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
      
      // Add companies and product_images to select
      // NOTE: product_images is the single source of truth for product images
      // products.images column is deprecated and should not be used
      query = query.select(`
          *,
          companies!company_id(*),
          categories(*),
          product_images(
            id,
            url,
            alt_text,
            is_primary,
            sort_order
          )
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
      
      // Transform products and get images from product_images table
      // NOTE: product_images is the single source of truth. products.images is deprecated.
      const productsWithImages = Array.isArray(data) ? data.map(product => {
        // Get primary image from product_images (preferred) or legacy products.images
        let primaryImage = getPrimaryImageFromProduct(product);
        let allImages = getAllImagesFromProduct(product);
        
        // Normalize all image URLs to ensure they're full URLs
        if (primaryImage) {
          primaryImage = normalizeProductImageUrl(primaryImage) || primaryImage;
        }
        allImages = allImages.map(img => normalizeProductImageUrl(img) || img).filter(Boolean);
        
        // Ensure primary image is in allImages
        if (primaryImage && !allImages.includes(primaryImage)) {
          allImages.unshift(primaryImage);
        }
        
        return {
          ...product,
          primaryImage: primaryImage || null,
          allImages: allImages.length > 0 ? allImages : []
        };
      }) : [];
      
      // Apply client-side filters (search, price range, MOQ, certifications, lead time, chip filters)
      const filtered = applyClientSideFilters(productsWithImages);
      setProducts(filtered);

      // Log search event (non-blocking)
      logSearchEvent({ resultCount: filtered.length });
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      toast.error('Failed to load products. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => loadProducts()
        }
      });
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

  const urlCountryParam = searchParams.get('country');
  const urlCountryName = urlCountryParam
    ? AFRICAN_COUNTRY_CODES[urlCountryParam.toLowerCase()] ||
      AFRICAN_COUNTRIES.find((c) => c.toLowerCase() === urlCountryParam.toLowerCase())
    : '';

  const selectedCountryForSeo =
    selectedFilters.country && selectedFilters.country !== t('marketplace.allCountries')
      ? selectedFilters.country
      : urlCountryName || '';

  const ProductCard = React.memo(({ product }) => {
    const handleCardClick = async (e) => {
      // Don't navigate if clicking on buttons or links
      if (e.target.closest('button, a, [role="button"]')) {
        return;
      }
      
      addToViewHistory(product.id, 'product', {
        title: product.title || product.name,
        category_id: product.category_id,
        country: product.country_of_origin
      });
      
      // Track product view in database
      if (currentUser?.id || currentCompanyId) {
        try {
          await trackProductView(product.id, {
            profile_id: currentUser?.id,
            company_id: currentCompanyId,
            source_page: 'marketplace'
          });
        } catch (error) {
          // Silent fail - tracking is non-critical
        }
      }
      
      // Navigate to product page
      navigate(`/product?id=${product.id}`);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            hover 
            className="h-full cursor-pointer"
            onClick={handleCardClick}
          >
            <div className="relative h-48 bg-afrikoni-cream rounded-t-xl overflow-hidden">
              {product.primaryImage ? (
                <OptimizedImage
                  src={product.primaryImage}
                  alt={product.title || product.name || 'Product'}
                  className="w-full h-full object-cover"
                  width={400}
                  height={300}
                  priority={false}
                  quality={85}
                  placeholder="/product-placeholder.svg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-cream flex items-center justify-center">
                  <Package className="w-12 h-12 text-afrikoni-gold/50" />
                </div>
              )}
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <Badge variant="primary" className="text-xs">⭐ {t('marketplace.featured')}</Badge>
                </div>
              )}
              {/* Supplier verification / trust badge */}
              {product.companies?.verification_status === 'verified' && (
                <div className="absolute top-2 right-2">
                  <Badge className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1 px-2 py-1 rounded-full">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('marketplace.verifiedSupplier')}</span>
                    <span className="sm:hidden">{t('products.verified')}</span>
                  </Badge>
                </div>
              )}
              {product.companies?.verification_status === 'pending' && (
                <div className="absolute top-2 right-2">
                  <Badge className="text-[10px] sm:text-xs bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('marketplace.pendingReview')}</span>
                    <span className="sm:hidden">{t('verification.pending')}</span>
                  </Badge>
                </div>
              )}
              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <SaveButton itemId={product.id} itemType="product" />
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-afrikoni-chestnut mb-2 line-clamp-2 text-sm md:text-base">
                {product.title || product.name}
              </h3>
              <p className="text-xs sm:text-sm text-afrikoni-deep/70 mb-2 line-clamp-2">
                {product.short_description || product.description}
              </p>
              
              {/* Price Range */}
              <div className="flex items-center gap-2 mb-2">
                {product.price_min && product.price_max ? (
                  <div className="text-base sm:text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {parseFloat(product.price_min).toLocaleString()} – {parseFloat(product.price_max).toLocaleString()}
                  </div>
                ) : product.price_min ? (
                  <div className="text-base sm:text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {parseFloat(product.price_min).toLocaleString()}+
                  </div>
                ) : product.price ? (
                  <div className="text-base sm:text-lg font-bold text-afrikoni-gold">
                    {product.currency || 'USD'} {parseFloat(product.price).toLocaleString()}
                  </div>
                ) : (
                  <div className="text-sm text-afrikoni-deep/70">{t('marketplace.priceOnRequest')}</div>
                )}
              </div>
              
              {/* MOQ */}
              {product.min_order_quantity && (
                <div className="text-xs sm:text-sm text-afrikoni-deep/70 mb-2">
                  MOQ: {product.min_order_quantity} {product.moq_unit || product.unit || 'units'}
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 flex-wrap">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-afrikoni-deep/70 flex-shrink-0" />
                  {product?.companies?.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/business/${product.companies.id}`);
                      }}
                      className="text-xs sm:text-sm text-afrikoni-deep hover:text-afrikoni-gold truncate font-medium cursor-pointer"
                    >
                      {product?.companies?.company_name || 'Supplier'}
                    </button>
                  ) : (
                    <span className="text-xs sm:text-sm text-afrikoni-deep truncate">{product?.companies?.company_name || 'Supplier'}</span>
                  )}
                  <span className="text-xs sm:text-sm text-afrikoni-deep/70 hidden sm:inline">• {product?.country_of_origin || product?.companies?.country || 'N/A'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {product?.companies?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs sm:text-sm touch-manipulation min-h-[44px] md:min-h-0 px-2" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/business/${product.companies.id}`);
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 text-xs sm:text-sm touch-manipulation min-h-[44px] md:min-h-0 px-2 sm:px-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Store product context for smart message generation
                    if (product?.id) {
                      sessionStorage.setItem('contactProductContext', JSON.stringify({
                        productId: product.id,
                        productTitle: product.title,
                        productPrice: product.price || product.price_min,
                        productCurrency: product.currency,
                        productMOQ: product.moq || product.min_order_quantity,
                        supplierName: product?.companies?.company_name || 'Supplier',
                        supplierCountry: product?.country_of_origin || product?.companies?.country
                      }));
                    }
                    navigate(`/messages?recipient=${product?.companies?.id || product?.supplier_id || product?.company_id || ''}&product=${product?.id || ''}&productTitle=${encodeURIComponent(product?.title || '')}`);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {t('marketplace.contact')}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex-1 text-xs sm:text-sm touch-manipulation min-h-[44px] md:min-h-0 px-2 sm:px-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/rfqs/new?product=${product.id}`);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  {t('marketplace.quote')}
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
        title={
          selectedCountryForSeo
            ? `Marketplace – ${selectedCountryForSeo} Suppliers & Products`
            : 'Marketplace - Browse African Products & Suppliers'
        }
        description={
          selectedCountryForSeo
            ? `Browse verified suppliers and products based in ${selectedCountryForSeo}. Filter by category, MOQ, verification status, and more for trade within and from ${selectedCountryForSeo}.`
            : 'Browse thousands of verified products and suppliers across Africa. Filter by category, country, verification status, and more.'
        }
        url={
          selectedCountryForSeo
            ? `/marketplace?country=${encodeURIComponent(selectedCountryForSeo)}`
            : '/marketplace'
        }
      />
      <StructuredData type="WebSite" />
      <div className="min-h-screen bg-afrikoni-offwhite">
      {/* Header */}
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-afrikoni-deep/70 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder={t('marketplace.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click on suggestions
                  setTimeout(() => {
                    setSearchFocused(false);
                    setShowSuggestions(false);
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    addSearchToHistory(searchQuery);
                    setShowSuggestions(false);
                  }
                }}
              />
              {showSuggestions && searchFocused && (
                <SearchSuggestions
                  query={searchQuery}
                  onSelectSuggestion={(query, type, id) => {
                    setSearchQuery(query);
                    addSearchToHistory(query);
                    setShowSuggestions(false);
                    setSearchFocused(false);
                    // If type is category or company, apply filter
                    if (type === 'category') {
                      setSelectedFilters({ ...selectedFilters, category: query });
                    } else if (type === 'company') {
                      // Could navigate to company profile or filter by company
                    }
                  }}
                  showHistory={!searchQuery}
                  showTrending={!searchQuery}
                />
              )}
            </div>
            {/* Quick Filter Chips */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <FilterChip
                label={t('marketplace.verifiedOnly')}
                active={selectedFilters.verified}
                onRemove={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
              />
              <FilterChip
                label={t('marketplace.fastResponse')}
                active={selectedFilters.fastResponse}
                onRemove={() => setSelectedFilters({ ...selectedFilters, fastResponse: !selectedFilters.fastResponse })}
              />
              <FilterChip
                label={t('marketplace.readyToShip')}
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
              {t('marketplace.filters')}
            </Button>
          </div>
          
          {/* Country marketplace selector */}
          <div className="flex flex-col gap-2 md:gap-1">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
              <div className="text-afrikoni-deep/80">
                {selectedFilters.country && selectedFilters.country !== t('marketplace.allCountries')
                  ? <>{t('marketplace.viewingCountry', { country: selectedFilters.country })}</>
                  : <>{t('marketplace.viewingAllAfrica')}</>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-afrikoni-deep/70 hidden sm:inline">{t('marketplace.countryMarketplace')}</span>
                <Select
                  value={selectedFilters.country || t('marketplace.allCountries')}
                  onValueChange={(value) => {
                    const countryValue = value === t('marketplace.allCountries') ? '' : value;
                    setSelectedFilters({ ...selectedFilters, country: countryValue });
                  }}
                >
                  <SelectTrigger className="w-40 h-9 border-afrikoni-gold/40 bg-white text-afrikoni-deep text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(countries) && countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === t('marketplace.allCountries') ? t('countries.title') : country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Quick access chips for popular markets so users don't scroll 54 countries */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-afrikoni-deep/80">
              <span className="font-semibold text-afrikoni-chestnut/80">{t('marketplace.popularMarkets')}:</span>
              <button
                type="button"
                onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                  !selectedFilters.country
                    ? 'bg-afrikoni-gold text-afrikoni-chestnut border-afrikoni-gold'
                    : 'border-afrikoni-gold/30 text-afrikoni-deep hover:bg-afrikoni-gold/10'
                }`}
              >
                {t('marketplace.allAfrica')}
              </button>
              {POPULAR_COUNTRIES.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => setSelectedFilters({ ...selectedFilters, country })}
                  className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                    selectedFilters.country === country
                      ? 'bg-afrikoni-gold text-afrikoni-chestnut border-afrikoni-gold'
                      : 'border-afrikoni-gold/30 text-afrikoni-deep hover:bg-afrikoni-gold/10'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
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
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.category')}</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !selectedFilters.category
                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                      }`}
                    >
                      All Categories
                    </button>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <button
                        key={cat.id || cat}
                        onClick={() => setSelectedFilters({ ...selectedFilters, category: cat.id || cat })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFilters.category === (cat.id || cat)
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                            : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
                        }`}
                      >
                        {cat.name || cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.country')}</h3>
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
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.verification')}</h3>
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
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.priceRange')}</h3>
                  <div className="space-y-2">
                    <Input 
                      placeholder={t('marketplace.minPrice')} 
                      type="number" 
                      className="text-sm"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <Input 
                      placeholder={t('marketplace.maxPrice')} 
                      type="number" 
                      className="text-sm"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.minimumOrder')}</h3>
                  <div className="space-y-2">
                    <Input 
                      placeholder={t('marketplace.minQuantity')} 
                      type="number" 
                      className="text-sm"
                      value={moqMin}
                      onChange={(e) => setMoqMin(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.certifications')}</h3>
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
                      <span>{t('marketplace.isoCertified')}</span>
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
                      <span>{t('marketplace.tradeShieldEligible')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-3">{t('marketplace.leadTime')}</h3>
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
                      {t('marketplace.ready')}
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
                      {t('marketplace.within7Days')}
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
                      {t('marketplace.within30Days')}
                    </button>
                  </div>
                </div>

                <Button 
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream" 
                  size="sm"
                  onClick={applyFilters}
                >
                  {t('marketplace.applyFilters')}
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
                  {t('marketplace.clearAll')}
                </Button>
              </CardContent>
            </Card>

            {/* Search History */}
            <SearchHistory
              onSelectSearch={(query) => {
                setSearchQuery(query);
                addSearchToHistory(query);
              }}
              onClearHistory={() => {}}
            />

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-afrikoni-chestnut flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      {t('marketplace.savedSearches')}
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
                    {t('marketplace.saveThisSearch')}
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
                  {t('marketplace.title')}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-afrikoni-deep">
                    {filteredProducts.length} {filteredProducts.length === 1 ? t('marketplace.productFound') : t('marketplace.productsFound')}
                  </p>
                  {/* Active Filters Display */}
                  {(selectedFilters.category || selectedFilters.country || selectedFilters.verification || 
                    priceMin || priceMax || moqMin || selectedFilters.certifications.length > 0 ||
                    selectedFilters.deliveryTime || selectedFilters.verified || selectedFilters.fastResponse ||
                    selectedFilters.readyToShip || debouncedSearchQuery) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-afrikoni-deep/70">{t('marketplace.activeFilters')}</span>
                      {debouncedSearchQuery && (
                        <Badge variant="outline" className="text-xs">
                          {t('common.search')}: "{debouncedSearchQuery}"
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSearchQuery('')}
                          />
                        </Badge>
                      )}
                      {selectedFilters.category && selectedFilters.category !== t('categories.all') && (
                        <Badge variant="outline" className="text-xs">
                          {selectedFilters.category}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                          />
                        </Badge>
                      )}
                      {selectedFilters.country && selectedFilters.country !== t('marketplace.allCountries') && (
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
                          {t('products.verified')}
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
                          {t('products.moq')}: {moqMin}+
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
                  label={t('marketplace.bestMatchForYou')}
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
                    <SelectValue placeholder={t('marketplace.sortBy') + '...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">⭐ {t('marketplace.mostPopular') || 'Most Relevant'}</SelectItem>
                    <SelectItem value="-created_at">🆕 {t('marketplace.newest') || 'Newest First'}</SelectItem>
                    <SelectItem value="created_at">📅 {t('marketplace.oldest') || 'Oldest First'}</SelectItem>
                    <SelectItem value="price_min">💰 {t('marketplace.priceLow') || 'Price: Low to High'}</SelectItem>
                    <SelectItem value="-price_min">💎 {t('marketplace.priceHigh') || 'Price: High to Low'}</SelectItem>
                    <SelectItem value="-views">👁️ {t('marketplace.mostViewed') || 'Most Viewed'}</SelectItem>
                  </SelectContent>
                </Select>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm">{t('marketplace.grid')}</Button>
                <Button variant="ghost" size="sm">{t('marketplace.list')}</Button>
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
                  <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">{t('marketplace.noProductsFound')}</h3>
                  <p className="text-afrikoni-deep">{t('marketplace.tryDifferentSearch')}</p>
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
        title={t('marketplace.filters')}
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
          <Button variant="primary" className="w-full min-h-[44px] text-sm sm:text-base touch-manipulation">
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </div>
    </>
  );
}

