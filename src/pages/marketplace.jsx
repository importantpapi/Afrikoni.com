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
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Globe,
  Shield,
  Star,
  MessageSquare,
  FileText,
  X,
  CheckCircle,
  Building,
  Package,
  TrendingUp,
  Clock,
  Award,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Eye,
  Smile,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Tooltip } from '@/components/shared/ui/tooltip';
import { VerificationBadgeTooltip } from '@/components/trust/VerificationBadgeTooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Drawer } from '@/components/shared/ui/drawer';
import FilterChip from '@/components/shared/ui/FilterChip';
import SaveButton from '@/components/shared/ui/SaveButton';
import { PaginationFooter } from '@/components/shared/ui/reusable/PaginationFooter';
import OptimizedImage from '@/components/OptimizedImage';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import SearchHistory from '@/components/search/SearchHistory';
import Price from '@/components/shared/ui/Price';
import TrustBadge from '@/components/shared/ui/TrustBadge';
import { toast } from 'sonner';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';
import { AFRICAN_COUNTRIES, AFRICAN_COUNTRY_CODES } from '@/constants/countries';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import { trackProductView } from '@/lib/supabaseQueries/products';
import { Logo } from '@/components/shared/ui/Logo';
import ProductCard from '@/components/products/ProductCard';
import { Surface } from '@/components/system/Surface';

export default function Marketplace() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackPageView } = useAnalytics();
  const { profile } = useAuth();
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
  // Use user and companyId from AuthProvider context (no local state needed)

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

    // Use auth from context (no separate loadUser needed)
    // User and companyId available from AuthProvider
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
    const updated = (Array.isArray(savedSearches) ? savedSearches : []).filter(s => s && s.id !== id);
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
      // ✅ UNIFIED DASHBOARD KERNEL: Fixed 404 by using real table + joins
      // 'public_products' view was missing. Now querying 'products' directly.
      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          category_id,
          country_of_origin,
          min_order_quantity,
          moq_unit,
          price_min,
          price_max,
          currency,
          created_at,
          slug,
          lead_time_min_days,
          images,
          categories!inner (
            name
          ),
          companies!inner (
            company_name:name,
            company_country:country,
            company_verified:verified,
            company_logo:logo_url
          )
        `, { count: 'exact' })
        .eq('status', 'active'); // Only active products

      // Filter Logic
      if (selectedFilters.category) {
        query = query.eq('category_id', selectedFilters.category);
      }
      if (selectedFilters.country) {
        query = query.eq('country_of_origin', selectedFilters.country);
      }

      // Apply sorting
      let sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      let ascending = !sortBy.startsWith('-');

      // Handle relevance sorting
      if (sortBy === 'relevance') {
        sortField = 'created_at';
        ascending = false;
      }

      const validSortFields = ['created_at', 'price_min', 'min_order_quantity', 'title'];
      if (!validSortFields.includes(sortField)) {
        sortField = 'created_at';
        ascending = false;
      }

      query = query.order(sortField, { ascending });

      const result = await paginateQuery(
        query,
        {
          page: pagination.page,
          pageSize: 20,
        }
      );

      const { data, error } = result;

      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));

      if (error) {
        console.error('Marketplace query error:', error);
        throw error;
      }

      // Transform products from JOINS structure
      const productsWithImages = Array.isArray(data) ? data.map(product => {
        let allImages = Array.isArray(product.images) ? product.images : [];
        let primaryImage = allImages.length > 0 ? allImages[0] : null;

        return {
          ...product,
          // Map JOIN columns to component expectations
          category_name: product.categories?.name,
          company_name: product.companies?.company_name,
          company_country: product.companies?.company_country,
          company_verified: product.companies?.company_verified,
          company_logo: product.companies?.company_logo,

          companies: {
            company_name: product.companies?.company_name,
            country: product.companies?.company_country,
            verified: product.companies?.company_verified,
            logo_url: product.companies?.company_logo
          },
          categories: {
            name: product.categories?.name
          },
          primaryImage: normalizeProductImageUrl(primaryImage),
          allImages: allImages.map(normalizeProductImageUrl)
        };
      }) : [];

      // Apply client-side filters
      const filtered = applyClientSideFilters(productsWithImages);
      setProducts(filtered);

      // Log search event
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

  // Country name to ISO code mapping for flags
  const COUNTRY_NAME_TO_ISO = {
    'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
    'Egypt': 'EG', 'Morocco': 'MA', 'Senegal': 'SN', 'Tanzania': 'TZ',
    'Ethiopia': 'ET', 'Angola': 'AO', 'Cameroon': 'CM', "Côte d'Ivoire": 'CI',
    'Ivory Coast': 'CI', 'Uganda': 'UG', 'Algeria': 'DZ', 'Sudan': 'SD',
    'Mozambique': 'MZ', 'Madagascar': 'MG', 'Mali': 'ML', 'Burkina Faso': 'BF',
    'Niger': 'NE', 'Rwanda': 'RW', 'Benin': 'BJ', 'Guinea': 'GN', 'Chad': 'TD',
    'Zimbabwe': 'ZW', 'Zambia': 'ZM', 'Malawi': 'MW', 'Gabon': 'GA',
    'Botswana': 'BW', 'Gambia': 'GM', 'Guinea-Bissau': 'GW', 'Liberia': 'LR',
    'Sierra Leone': 'SL', 'Togo': 'TG', 'Mauritania': 'MR', 'Namibia': 'NA',
    'Lesotho': 'LS', 'Eritrea': 'ER', 'Djibouti': 'DJ', 'South Sudan': 'SS',
    'Central African Republic': 'CF', 'Republic of the Congo': 'CG', 'Congo': 'CG',
    'DR Congo': 'CD', 'São Tomé and Príncipe': 'ST', 'Seychelles': 'SC',
    'Cape Verde': 'CV', 'Comoros': 'KM', 'Mauritius': 'MU', 'Somalia': 'SO',
    'Burundi': 'BI', 'Equatorial Guinea': 'GQ', 'Eswatini': 'SZ', 'Libya': 'LY',
    'Tunisia': 'TN'
  };

  const COUNTRY_FLAGS = {
    'NG': '🇳🇬', 'GH': '🇬🇭', 'KE': '🇰🇪', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'MA': '🇲🇦',
    'SN': '🇸🇳', 'TZ': '🇹🇿', 'ET': '🇪🇹', 'AO': '🇦🇴', 'CM': '🇨🇲', 'CI': '🇨🇮',
    'UG': '🇺🇬', 'DZ': '🇩🇿', 'SD': '🇸🇩', 'MZ': '🇲🇿', 'MG': '🇲🇬', 'ML': '🇲🇱',
    'BF': '🇧🇫', 'NE': '🇳🇪', 'RW': '🇷🇼', 'BJ': '🇧🇯', 'GN': '🇬🇳', 'TD': '🇹🇩',
    'ZW': '🇿🇼', 'ZM': '🇿🇲', 'MW': '🇲🇼', 'GA': '🇬🇦', 'BW': '🇧🇼', 'GM': '🇬🇲',
    'GW': '🇬🇼', 'LR': '🇱🇷', 'SL': '🇸🇱', 'TG': '🇹🇬', 'MR': '🇲🇷', 'NA': '🇳🇦',
    'LS': '🇱🇸', 'ER': '🇪🇷', 'DJ': '🇩🇯', 'SS': '🇸🇸', 'CF': '🇨🇫', 'CG': '🇨🇬',
    'CD': '🇨🇩', 'ST': '🇸🇹', 'SC': '🇸🇨', 'CV': '🇨🇻', 'KM': '🇰🇲', 'MU': '🇲🇺',
    'SO': '🇸🇴', 'BI': '🇧🇮', 'GQ': '🇬🇶', 'SZ': '🇸🇿', 'LY': '🇱🇾', 'TN': '🇹🇳'
  };

  const getCountryFlagEmoji = (countryName) => {
    if (!countryName) return '';
    const normalizedName = countryName.trim();
    // Try direct match first
    const isoCode = COUNTRY_NAME_TO_ISO[normalizedName];
    if (isoCode && COUNTRY_FLAGS[isoCode]) {
      return COUNTRY_FLAGS[isoCode];
    }
    // Try case-insensitive match
    const matchedKey = Object.keys(COUNTRY_NAME_TO_ISO).find(
      key => key.toLowerCase() === normalizedName.toLowerCase()
    );
    if (matchedKey) {
      const code = COUNTRY_NAME_TO_ISO[matchedKey];
      return COUNTRY_FLAGS[code] || '';
    }
    return '';
  };

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

      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-afrikoni-gold/30 selection:text-white relative overflow-hidden">
        {/* 2026 Global Ambient Flow - Fused Experience */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] bg-afrikoni-gold/5 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-afrikoni-chestnut/10 blur-[100px] rounded-full opacity-30" />
          <div className="absolute top-[60%] left-[40%] w-[40%] h-[40%] bg-afrikoni-gold/5 blur-[150px] rounded-full opacity-20" />
        </div>

        <div className="relative z-10">
          {/* Enhanced Sticky Hub */}
          <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-2xl border-b border-white/5">
            <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full relative group">
                  <Search className="w-5 h-5 text-afrikoni-gold absolute left-5 top-1/2 -translate-y-1/2 z-10 opacity-60 group-focus-within:opacity-100 transition-opacity" />
                  <Input
                    placeholder={t('marketplace.searchPlaceholder') || 'Search products, suppliers, categories...'}
                    className="pl-14 pr-6 h-16 w-full bg-white/5 border-white/10 focus:border-afrikoni-gold/50 rounded-2xl text-lg font-medium placeholder:text-white/20 transition-all focus:ring-afrikoni-gold/20"
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
                    <Surface variant="glass" className="absolute top-[calc(100%+12px)] left-0 right-0 z-50 p-2 border-white/10 shadow-2xl overflow-hidden">
                      <SearchSuggestions
                        query={searchQuery}
                        onSelectSuggestion={(query, type, id) => {
                          setSearchQuery(query);
                          addSearchToHistory(query);
                          setShowSuggestions(false);
                          setSearchFocused(false);
                          if (type === 'category') {
                            setSelectedFilters({ ...selectedFilters, category: query });
                          }
                        }}
                        showHistory={!searchQuery}
                        showTrending={!searchQuery}
                      />
                    </Surface>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    variant="secondary"
                    className="h-16 px-8 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl transition-all flex items-center gap-3 flex-1 md:flex-auto"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="w-5 h-5 text-afrikoni-gold" />
                    <span className="font-bold uppercase tracking-widest text-xs">{t('marketplace.filters')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-6 py-12">
            {/* Market Intelligence Feed - Quick Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <FilterChip
                label={t('marketplace.verifiedOnly') || 'Verified Only'}
                active={selectedFilters.verified}
                onRemove={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
              />
              <FilterChip
                label={t('marketplace.fastResponse') || 'Fast Response'}
                active={selectedFilters.fastResponse}
                onRemove={() => setSelectedFilters({ ...selectedFilters, fastResponse: !selectedFilters.fastResponse })}
              />
              <FilterChip
                label={t('marketplace.readyToShip') || 'Ready to Ship'}
                active={selectedFilters.readyToShip}
                onRemove={() => setSelectedFilters({ ...selectedFilters, readyToShip: !selectedFilters.readyToShip })}
              />

              <div className="h-4 w-px bg-white/10 mx-2 hidden md:block" />

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-afrikoni-gold" />
                <Select
                  value={selectedFilters.country || t('marketplace.allCountries')}
                  onValueChange={(value) => {
                    const countryValue = value === t('marketplace.allCountries') ? '' : value;
                    setSelectedFilters({ ...selectedFilters, country: countryValue });
                  }}
                >
                  <SelectTrigger className="w-48 h-10 bg-white/5 border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                    {Array.isArray(countries) && countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country === t('marketplace.allCountries') ? t('countries.title') : country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">

              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                <div className="flex gap-6 lg:gap-8">
                  <aside className="hidden lg:block w-80 flex-shrink-0">
                    <div className="sticky top-32 space-y-6">
                      <Surface variant="glass" className="border-white/5 p-6 space-y-8">
                        <div>
                          <h3 className="font-bold text-base text-white/90 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4 text-afrikoni-gold" />
                            {t('marketplace.category') || 'Category'}
                          </h3>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                            <button
                              onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${!selectedFilters.category
                                ? 'bg-afrikoni-gold/20 text-afrikoni-gold border border-afrikoni-gold/30'
                                : 'text-white/40 border border-transparent hover:border-white/10 hover:bg-white/5'
                                }`}
                            >
                              {t('marketplace.allCategories')}
                            </button>
                            {Array.isArray(categories) && categories.map((cat) => (
                              <button
                                key={cat.id || cat}
                                onClick={() => setSelectedFilters({ ...selectedFilters, category: cat.id || cat })}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${selectedFilters.category === (cat.id || cat)
                                  ? 'bg-afrikoni-gold/20 text-afrikoni-gold border border-afrikoni-gold/30'
                                  : 'text-white/40 border border-transparent hover:border-white/10 hover:bg-white/5'
                                  }`}
                              >
                                {cat.name || cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-white/90 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-afrikoni-gold" />
                            {t('marketplace.country') || 'Country'}
                          </h3>
                          <div className="space-y-2">
                            {/* Popular Countries - Always visible */}
                            <div>
                              <p className="text-xs text-white/40 mb-2 font-medium">Popular Countries</p>
                              {POPULAR_COUNTRIES.map((country) => (
                                <button
                                  key={country}
                                  onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                                  className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${selectedFilters.country === country
                                    ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/90'
                                    }`}
                                >
                                  {country}
                                </button>
                              ))}
                            </div>
                            {/* All Countries - Collapsible */}
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-afrikoni-gold hover:text-afrikoni-goldLight mb-2 list-none">
                                <span className="flex items-center gap-1">
                                  {t('marketplace.viewAllCountries')}
                                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                                </span>
                              </summary>
                              <div className="space-y-2 mt-2 max-h-64 overflow-y-auto custom-scrollbar">
                                <button
                                  onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                                  className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${!selectedFilters.country
                                    ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/90'
                                    }`}
                                >
                                  {t('marketplace.allCountries')}
                                </button>
                                {Array.isArray(countries) && countries
                                  .filter(c => c !== t('marketplace.allCountries') && !POPULAR_COUNTRIES.includes(c))
                                  .map((country) => (
                                    <button
                                      key={country}
                                      onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                                      className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${selectedFilters.country === country
                                        ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/90'
                                        }`}
                                    >
                                      {country}
                                    </button>
                                  ))}
                              </div>
                            </details>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            Authentication Matrix
                          </h3>
                          <div className="space-y-2">
                            {Array.isArray(verificationOptions) && verificationOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setSelectedFilters({ ...selectedFilters, verification: opt })}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-3 transition-all ${selectedFilters.verification === opt
                                  ? 'bg-afrikoni-gold/20 text-afrikoni-gold border border-afrikoni-gold/30'
                                  : 'text-white/40 border border-transparent hover:border-white/10 hover:bg-white/5'
                                  }`}
                              >
                                {opt !== 'All' && <Shield className="w-4 h-4" />}
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            Fiscal Boundaries
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Input
                                placeholder={t('marketplace.minPrice')}
                                type="number"
                                className="text-sm min-h-[44px] md:min-h-0 touch-manipulation bg-white/5 border-white/10 focus:border-afrikoni-gold/50 rounded-xl text-white placeholder:text-white/20"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                              />
                              <Input
                                placeholder={t('marketplace.maxPrice')}
                                type="number"
                                className="text-sm min-h-[44px] md:min-h-0 touch-manipulation bg-white/5 border-white/10 focus:border-afrikoni-gold/50 rounded-xl text-white placeholder:text-white/20"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            Minimum Order
                          </h3>
                          <div className="space-y-2">
                            <Input
                              placeholder={t('marketplace.minQuantity')}
                              type="number"
                              className="text-sm min-h-[44px] md:min-h-0 touch-manipulation bg-white/5 border-white/10 focus:border-afrikoni-gold/50 rounded-xl text-white placeholder:text-white/20"
                              value={moqMin}
                              onChange={(e) => setMoqMin(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            Certifications
                          </h3>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                              <input
                                type="checkbox"
                                className="rounded bg-white/10 border-white/20 text-afrikoni-gold focus:ring-afrikoni-gold"
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
                            <label className="flex items-center gap-2 text-sm text-white/70">
                              <input
                                type="checkbox"
                                className="rounded bg-white/10 border-white/20 text-afrikoni-gold focus:ring-afrikoni-gold"
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
                          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            Lead Time
                          </h3>
                          <div className="space-y-2">
                            <button
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${selectedFilters.deliveryTime === 'ready'
                                ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                : 'text-white/40 hover:bg-white/5 hover:text-white/90'
                                }`}
                              onClick={() => setSelectedFilters({
                                ...selectedFilters,
                                deliveryTime: selectedFilters.deliveryTime === 'ready' ? '' : 'ready'
                              })}
                            >
                              {t('marketplace.ready')}
                            </button>
                            <button
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${selectedFilters.deliveryTime === '7days'
                                ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                : 'text-white/40 hover:bg-white/5 hover:text-white/90'
                                }`}
                              onClick={() => setSelectedFilters({
                                ...selectedFilters,
                                deliveryTime: selectedFilters.deliveryTime === '7days' ? '' : '7days'
                              })}
                            >
                              {t('marketplace.within7Days')}
                            </button>
                            <button
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all ${selectedFilters.deliveryTime === '30days'
                                ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-black'
                                : 'text-white/40 hover:bg-white/5 hover:text-white/90'
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
                          className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                          size="lg"
                          onClick={applyFilters}
                        >
                          {t('marketplace.applyFilters')}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-white/70 hover:bg-white/5"
                          size="lg"
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
                      </Surface>

                      {/* Search History */}
                      <SearchHistory
                        onSelectSearch={(query) => {
                          setSearchQuery(query);
                          addSearchToHistory(query);
                        }}
                        onClearHistory={() => { }}
                      />

                      {/* Saved Searches */}
                      {savedSearches.length > 0 && (
                        <Surface variant="glass" className="mt-4 border-white/5 p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white/90 flex items-center gap-2">
                              <Bookmark className="w-4 h-4 text-afrikoni-gold" />
                              {t('marketplace.savedSearches')}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {(Array.isArray(savedSearches) ? savedSearches : []).map((saved) => (
                              <div
                                key={saved.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group"
                              >
                                <button
                                  onClick={() => loadSavedSearch(saved)}
                                  className="flex-1 text-left text-sm text-white/70 hover:text-afrikoni-gold"
                                >
                                  {saved.name}
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:bg-white/10"
                                  onClick={() => deleteSavedSearch(saved.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Surface>
                      )}

                      {/* Save Current Search Button */}
                      {(searchQuery || selectedFilters.category || selectedFilters.country || priceMin || priceMax || moqMin) && (
                        <Surface variant="glass" className="mt-4 border-white/5 p-6">
                          <Button
                            variant="outline"
                            className="w-full border-afrikoni-gold/30 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                            size="lg"
                            onClick={saveCurrentSearch}
                          >
                            <BookmarkCheck className="w-4 h-4 mr-2" />
                            {t('marketplace.saveThisSearch')}
                          </Button>
                        </Surface>
                      )}
                    </div>
                  </aside>

                  {/* Enhanced Products Grid */}
                  <main className="flex-1 min-w-0">
                    <div className="mb-6 md:mb-8">
                      {/* Active Filters Display */}
                      {(selectedFilters.category || selectedFilters.country || selectedFilters.verification ||
                        priceMin || priceMax || moqMin || selectedFilters.certifications.length > 0 ||
                        selectedFilters.deliveryTime || selectedFilters.verified || selectedFilters.fastResponse ||
                        selectedFilters.readyToShip || debouncedSearchQuery) && (
                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            <span className="text-xs text-white/70">{t('marketplace.activeFilters')}</span>
                            {debouncedSearchQuery && (
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
                                {t('common.search')}: "{debouncedSearchQuery}"
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setSearchQuery('')}
                                />
                              </Badge>
                            )}
                            {selectedFilters.category && selectedFilters.category !== t('categories.all') && (
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
                                {(() => {
                                  // Find category name by ID if it's a UUID, otherwise use the value directly
                                  const category = (Array.isArray(categories) ? categories : []).find(cat => cat && (cat.id === selectedFilters.category || cat.name === selectedFilters.category));
                                  return category?.name || selectedFilters.category;
                                })()}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                                />
                              </Badge>
                            )}
                            {selectedFilters.country && selectedFilters.country !== t('marketplace.allCountries') && (
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
                                {selectedFilters.country}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                                />
                              </Badge>
                            )}
                            {selectedFilters.verified && (
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
                                {t('products.verified')}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer"
                                  onClick={() => setSelectedFilters({ ...selectedFilters, verified: false })}
                                />
                              </Badge>
                            )}
                            {(priceMin || priceMax) && (
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
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
                              <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/80">
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
                    {/* Top toolbar: AI best match, sort, and view toggle */}
                    <div className="flex items-center justify-between gap-3 mb-6 flex-wrap bg-white/50 rounded-xl p-4 border border-afrikoni-gold/20">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm md:text-base font-semibold text-afrikoni-chestnut">
                          {t('marketplace.bestMatchForYou') || 'Best match for you'}
                        </span>
                        <span className="text-xs md:text-sm text-afrikoni-deep/70">
                          Let AI highlight the single best product for your company.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <AICopilotButton
                          label={t('marketplace.bestMatchForYou') || 'Best match for you'}
                          size="sm"
                          variant="secondary"
                          className="bg-white border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-semibold"
                          loading={aiBestMatchLoading}
                          onClick={async () => {
                            setAiBestMatch(null);
                            if (!Array.isArray(filteredProducts) || filteredProducts.length === 0) return;
                            setAiBestMatchLoading(true);
                            try {
                              // Use auth from context
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
                          <SelectTrigger className="w-40 md:w-52 h-11 md:h-10 min-h-[44px] md:min-h-0 border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold/50 rounded-xl shadow-sm font-medium bg-white touch-manipulation">
                            <SelectValue placeholder={t('marketplace.sortBy') || 'Sort by: Newest First'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="-created_at">🆕 {t('marketplace.newestListings') || 'Newest First'}</SelectItem>
                            <SelectItem value="price_min">💰 {t('marketplace.lowestPrice') || 'Price: Low to High'}</SelectItem>
                            <SelectItem value="-price_min">💎 {t('marketplace.highestPrice') || 'Price: High to Low'}</SelectItem>
                            <SelectItem value="min_order_quantity">📦 {t('marketplace.lowestMOQ') || 'MOQ: Low to High'}</SelectItem>
                            <SelectItem value="-min_order_quantity">📦 {t('marketplace.highestMOQ') || 'MOQ: High to Low'}</SelectItem>
                            <SelectItem value="relevance">⭐ {t('marketplace.bestMatch') || 'Best Match'}</SelectItem>
                            <SelectItem value="-views">👁️ {t('marketplace.mostViewed') || 'Most Viewed'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="hidden md:flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-medium"
                          >
                            {t('marketplace.grid') || 'Grid'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-medium"
                          >
                            {t('marketplace.list') || 'List'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {aiBestMatch && (
                      <div className="mb-12">
                        <AISuggestionCard
                          suggestion={{
                            type: 'product',
                            name: aiBestMatch.name || aiBestMatch.title,
                            product: aiBestMatch
                          }}
                          onAction={() => {
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                          <Surface key={i} variant="glass" className="animate-pulse border-white/5 h-[380px] flex flex-col">
                            <div className="h-48 bg-white/5 rounded-t-xl" />
                            <div className="p-5 space-y-3 flex-1">
                              <div className="h-4 bg-white/5 rounded w-3/4" />
                              <div className="h-4 bg-white/5 rounded w-1/2" />
                            </div>
                          </Surface>
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <Surface variant="glass" className="p-20 text-center border-white/5">
                        <Package className="w-16 h-16 text-afrikoni-gold/40 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-white/90 mb-4">{t('marketplace.noProductsFound')}</h3>
                        <p className="text-white/40 text-lg mb-8 max-w-md mx-auto">
                          {t('marketplace.changeFiltersOrSearch')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white h-12 px-8 rounded-xl"
                            asChild
                          >
                            <Link to="/rfq/create">{t('marketplace.postAnRFQ')}</Link>
                          </Button>
                        </div>
                      </Surface>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.isArray(filteredProducts) && filteredProducts.map((product, idx) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            priority={idx < 2}
                          />
                        ))}
                        {/* Fill empty space when there are few products */}
                        {filteredProducts.length > 0 && filteredProducts.length < 4 && (
                          <Surface variant="glass" className="hidden lg:flex flex-col items-center justify-center p-8 text-center border-white/5 bg-white/5">
                            <Package className="w-10 h-10 text-afrikoni-gold/30 mb-4" />
                            <h3 className="font-bold text-white/90 mb-2">{t('marketplace.moreVerifiedSuppliers')}</h3>
                            <p className="text-xs text-white/40 mb-6">
                              {t('marketplace.moreSuppliersOnboardedDaily')}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-afrikoni-gold/30 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                              asChild
                            >
                              <Link to="/rfq/create">{t('marketplace.postAnRFQ')}</Link>
                            </Button>
                          </Surface>
                        )}

                        {/* Skeleton Loaders for remaining grid slots when < 8 products */}
                        {filteredProducts.length > 0 && filteredProducts.length < 8 && (
                          <>
                            {[...Array(Math.min(8 - filteredProducts.length, 4))].map((_, i) => (
                              <Surface key={`skeleton-${i}`} variant="glass" className="animate-pulse border-white/5 h-[380px] flex flex-col">
                                <div className="h-48 bg-white/5 rounded-t-xl" />
                                <div className="p-4 space-y-3 flex-1">
                                  <div className="h-4 bg-white/5 rounded w-3/4" />
                                  <div className="h-4 bg-white/5 rounded w-1/2" />
                                </div>
                              </Surface>
                            ))}
                          </>
                        )}
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
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Market Clusters</h3>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id || cat}
                          onClick={() => setSelectedFilters({ ...selectedFilters, category: cat.id || cat })}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${selectedFilters.category === (cat.id || cat)
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold border border-afrikoni-gold/30'
                            : 'text-white/40 border border-transparent hover:border-white/10 hover:bg-white/5'
                            }`}
                        >
                          {cat.name || cat}
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
          </div>
        </div>
      </div>
    </>
  );
}
