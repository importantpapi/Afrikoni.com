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
  Zap,
  Truck,
  ShieldCheck,
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
import { cn } from '@/lib/utils';

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
  const SORT_OPTIONS = [
    { value: '-created_at', label: 'Newest Arrivals' },
    { value: 'fast_response', label: 'Fastest Response' },
    { value: 'most_trusted', label: 'Most Trusted Suppliers' },
    { value: 'best_value', label: 'Best Value for money' },
    { value: 'relevance', label: 'AI Best Match' }
  ];
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
          name,
          description,
          category_id,
          country_of_origin,
          moq,
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
            company_name,
            country,
            verified,
            logo_url
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
      if (sortBy === 'relevance' || sortBy === 'most_trusted' || sortBy === 'fast_response') {
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
          company_country: product.companies?.country,
          company_verified: product.companies?.verified,
          company_logo: product.companies?.logo_url,

          companies: {
            company_name: product.companies?.company_name,
            country: product.companies?.country,
            verified: product.companies?.verified,
            logo_url: product.companies?.logo_url
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
        const productMOQ = parseInt(product?.moq || 0);
        if (productMOQ < parseInt(moqMin)) return false;
      }

      // Certifications
      if (selectedFilters?.certifications?.length > 0) {
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

      <div className="min-h-screen bg-os-bg text-os-text-primary selection:bg-os-accent/30 selection:text-os-text-primary relative overflow-hidden transition-colors duration-700">
        <div className="relative z-10">
          {/* 🏛️ 2026 Discovery Maison: Luxury Centered Portal */}
          <div className="relative pt-24 pb-20 px-6 bg-os-bg selection:bg-os-accent/30 border-b border-os-stroke/40 overflow-hidden">
            {/* Signature Brand Detail */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-os-accent/40 to-transparent" />

            <div className="max-w-[800px] mx-auto text-center space-y-12 luxury-reveal">
              <div className="space-y-8">
                {/* ✅ PREMIUM HERO TITLE - Hermès Elegance */}
                <h1 className="text-os-4xl md:text-os-5xl font-semibold tracking-[-0.02em] text-os-text-primary leading-[1.15]">
                  Africa's Finest Producers.<br />
                  <span className="text-os-accent">Curated</span> for Serious Trade.
                </h1>

                {/* ✅ PREMIUM INSTITUTIONAL SUBLINE - Apple Warmth */}
                <p className="text-os-lg md:text-os-xl text-os-text-secondary/80 font-normal max-w-[680px] mx-auto leading-[1.7]">
                  A private marketplace of verified manufacturers and suppliers. Built for trust, scale, and long-term partnerships.
                </p>

                {/* ✅ MICRO-TRUST LINE - Refined Typography */}
                <div className="flex items-center justify-center gap-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-os-text-secondary/40 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-os-accent opacity-60" />
                  <span>Every supplier is identity-verified and continuously monitored by Afrikoni</span>
                </div>
              </div>

              {/* ✅ PREMIUM SEARCH EXPERIENCE */}
              <div className="relative group max-w-[640px] mx-auto z-50">
                <Surface variant="soft" className="relative group-focus-within:shadow-os-lg group-focus-within:ring-4 group-focus-within:ring-os-accent/5 transition-all duration-500 rounded-full border-os-accent/20">
                  <Search className="w-5 h-5 text-os-accent absolute left-6 top-1/2 -translate-y-1/2 z-10 opacity-40 group-focus-within:opacity-70 transition-opacity" />
                  <Input
                    placeholder="Search producers, commodities, or supply chains..."
                    className="pl-16 pr-6 h-16 w-full bg-white/80 backdrop-blur border-os-stroke group-focus-within:border-os-accent/50 rounded-full text-os-base font-normal placeholder:text-os-text-secondary/35 transition-all shadow-os-sm border-2 focus:outline-none"
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
                  />
                </Surface>

                {/* ✅ UNDER-SEARCH TRUST COPY - Hermès Refinement */}
                <div className="flex items-center justify-center gap-8 mt-6">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-medium text-os-text-secondary/50">
                    <span className="w-1 h-1 rounded-full bg-os-accent opacity-60" />
                    Private Network
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-medium text-os-text-secondary/50">
                    <span className="w-1 h-1 rounded-full bg-os-accent opacity-60" />
                    Verified Partners
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-medium text-os-text-secondary/50">
                    <span className="w-1 h-1 rounded-full bg-os-accent opacity-60" />
                    Protected Trade
                  </div>
                </div>

                {/* Curated Discovery Prompts - Apple Warmth */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-os-text-secondary/35">Explore:</span>
                  <button onClick={() => setSearchQuery('Premium Cocoa Ghana')} className="text-[11px] font-medium text-os-text-primary/50 hover:text-os-accent border-b border-os-stroke/40 hover:border-os-accent transition-all pb-0.5">Cocoa from Ghana</button>
                  <button onClick={() => setSearchQuery('Shea Butter Nigeria')} className="text-[11px] font-medium text-os-text-primary/50 hover:text-os-accent border-b border-os-stroke/40 hover:border-os-accent transition-all pb-0.5">Shea Butter producers</button>
                  <button onClick={() => setSearchQuery('Industrial Cotton')} className="text-[11px] font-medium text-os-text-primary/50 hover:text-os-accent border-b border-os-stroke/40 hover:border-os-accent transition-all pb-0.5">Industrial Cotton</button>
                </div>

                {/* ✅ FIX: Floating overlay panel (Apple Spotlight style) */}
                {showSuggestions && searchFocused && (
                  <div className="absolute top-[calc(100%+16px)] left-0 right-0 z-[100] pointer-events-auto">
                    <Surface variant="glass" className="p-3 border border-os-stroke shadow-premium backdrop-blur-xl overflow-hidden rounded-os-md bg-white/95">
                      <SearchSuggestions
                        query={searchQuery}
                        onSelectSuggestion={(query, type) => {
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
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-[1440px] mx-auto px-6 py-12 relative overflow-hidden">
            {/* ✅ FIX: Institutional background for content area */}
            <div className="absolute inset-0 bg-os-bg/50 -z-10 rounded-os-lg" />

            {/* 🟦 THE MAISON REVEAL: Curated Intelligence Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12 px-6">
              <div className="flex flex-wrap items-center gap-4">
                <FilterChip
                  label="Verified Only"
                  active={selectedFilters.verified}
                  onRemove={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
                  className={cn("bg-os-emerald/5 border-os-emerald/20 text-os-emerald")}
                  icon={<Shield className="w-3.5 h-3.5" />}
                />
                <FilterChip
                  label="Fast Response"
                  active={selectedFilters.fastResponse}
                  onRemove={() => setSelectedFilters({ ...selectedFilters, fastResponse: !selectedFilters.fastResponse })}
                  className={cn("bg-os-blue/5 border-os-blue/20 text-os-blue")}
                  icon={<Zap className="w-3.5 h-3.5" />}
                />

                <div className="h-4 w-px bg-os-stroke mx-2 hidden md:block" />

                <Button
                  variant="ghost"
                  onClick={() => setFiltersOpen(true)}
                  className="h-10 px-6 rounded-full border border-os-stroke hover:border-os-accent hover:bg-os-accent/5 text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-all flex items-center gap-2 shadow-os-sm bg-white"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-os-accent" />
                  Refine Selection
                </Button>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/40">Sort by</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 h-8 bg-transparent border-b border-os-stroke rounded-none text-os-xs font-bold text-os-text-primary hover:border-os-accent transition-all px-0 shadow-none ring-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-os-surface-solid border-os-stroke text-os-text-primary">
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-12">
              {/* MAIN DISCOVERY AREA - Full Width */}
              <main className="flex-1 min-w-0">
                <div className="mb-6 md:mb-8">
                  <div className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-os-accent/5 border border-os-accent/10">
                      <span className="w-1 h-1 rounded-full bg-os-accent animate-pulse opacity-60" />
                      <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-os-accent">Selected for Your Trade</span>
                    </div>
                    <h2 className="text-os-3xl font-semibold text-os-text-primary tracking-[-0.01em]">Selected Producers</h2>
                    <p className="text-os-sm text-os-text-secondary/60 font-normal max-w-[520px] mx-auto leading-relaxed">
                      Verified manufacturers and suppliers matched to your business requirements.
                    </p>
                  </div>

                  <div className="mb-10">
                    {/* Active Filters Display - Minimalist Presentation */}
                    {(selectedFilters.category || selectedFilters.country || selectedFilters.verification ||
                      priceMin || priceMax || moqMin || selectedFilters?.certifications?.length > 0 ||
                      selectedFilters.deliveryTime || selectedFilters.verified || selectedFilters.fastResponse ||
                      selectedFilters.readyToShip || debouncedSearchQuery) && (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          {debouncedSearchQuery && (
                            <Badge variant="ghost" className="text-[10px] font-bold uppercase tracking-widest bg-os-accent/5 border border-os-accent/10 px-4 py-1.5 rounded-full text-os-accent">
                              "{debouncedSearchQuery}"
                              <X className="w-3 h-3 ml-2 cursor-pointer hover:text-os-accentDark" onClick={() => setSearchQuery('')} />
                            </Badge>
                          )}
                          {selectedFilters.category && (
                            <Badge variant="ghost" className="text-[10px] font-bold uppercase tracking-widest bg-white border border-os-stroke px-4 py-1.5 rounded-full text-os-text-primary/60">
                              {(() => {
                                const category = (Array.isArray(categories) ? categories : []).find(cat => cat && (cat.id === selectedFilters.category || cat.name === selectedFilters.category));
                                return category?.name || selectedFilters.category;
                              })()}
                              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })} />
                            </Badge>
                          )}
                          {selectedFilters.country && (
                            <Badge variant="ghost" className="text-[10px] font-bold uppercase tracking-widest bg-white border border-os-stroke px-4 py-1.5 rounded-full text-os-text-primary/60">
                              {selectedFilters.country}
                              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })} />
                            </Badge>
                          )}
                          <button
                            onClick={() => {
                              setSelectedFilters({ category: '', country: '', verification: '', priceRange: '', moq: '', certifications: [], deliveryTime: '', verified: false, fastResponse: false, readyToShip: false });
                              setPriceMin(''); setPriceMax(''); setMoqMin(''); setSearchQuery('');
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-os-accent hover:underline ml-4"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                  </div>
                </div>
                {/* Top toolbar: AI best match, sort, and view toggle */}
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap bg-os-surface-1 rounded-os-sm p-5 border border-os-stroke hover:border-os-accent/20 transition-all">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] md:text-os-sm font-medium text-os-text-primary uppercase tracking-[0.2em]">
                      Recommended for Your Trade Profile
                    </span>
                    <span className="text-os-xs md:text-os-sm text-os-text-secondary/50 font-normal">
                      Our intelligence engine selects the most aligned producer for your sourcing profile.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <AICopilotButton
                      label="AI Sourcing Intelligence"
                      size="sm"
                      variant="secondary"
                      className="bg-os-accent/10 border border-os-accent/30 text-os-accent hover:bg-os-accent/20 font-semibold"
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
                      <SelectTrigger className="w-40 md:w-52 h-11 md:h-10 min-h-[44px] md:min-h-0 border-2 border-os-accent/30 hover:border-os-accent/50 rounded-os-sm shadow-sm font-medium bg-os-surface-0 touch-manipulation">
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
                        className="text-afrikoni-chestnut hover:bg-os-accent/10 font-medium"
                      >
                        {t('marketplace.grid') || 'Grid'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-afrikoni-chestnut hover:bg-os-accent/10 font-medium"
                      >
                        {t('marketplace.list') || 'List'}
                      </Button>
                    </div>
                  </div>
                </div>

                {
                  aiBestMatch && (
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
                  )
                }

                {
                  isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[...Array(8)].map((_, i) => (
                        <Surface key={i} variant="glass" className="animate-pulse border-white/5 h-[380px] flex flex-col">
                          <div className="h-48 bg-os-accent/5 animate-pulse rounded-t-xl" />
                          <div className="p-5 space-y-3 flex-1">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-4 bg-white/5 rounded w-1/2" />
                          </div>
                        </Surface>
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <Surface variant="glass" className="p-20 text-center border-white/5">
                      <Package className="w-16 h-16 text-os-accent/40 mx-auto mb-6" />
                      <h3 className="text-os-2xl font-black text-white/90 mb-4">{t('marketplace.noProductsFound')}</h3>
                      <p className="text-white/40 text-os-lg mb-8 max-w-md mx-auto">
                        {t('marketplace.changeFiltersOrSearch')}
                      </p>
                      <div className="flex flex-col items-center gap-6 justify-center">
                        <div className="space-y-2">
                          <h4 className="text-os-lg font-bold text-white/90">Specialized Sourcing Required?</h4>
                          <p className="text-white/40 text-os-sm">Our private network can connect you with verified producers tailored to your specifications.</p>
                        </div>
                        <Button
                          className="bg-os-accent hover:bg-os-accent/90 text-white h-12 px-10 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-premium transition-all active:scale-95"
                          asChild
                        >
                          <Link to="/rfq/create">Request Private Sourcing →</Link>
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
                        <Surface variant="glass" className="hidden lg:flex flex-col items-center justify-center p-8 text-center border-os-stroke bg-os-accent/5">
                          <Package className="w-10 h-10 text-os-accent/30 mb-4" />
                          <div className="space-y-2 mb-6">
                            <h3 className="font-bold text-white/90">Custom Requirements?</h3>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                              Our concierge team sources verified producers matched to your exact specifications.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-os-accent/10 text-os-accent hover:bg-os-accent/20 font-bold uppercase tracking-widest text-[9px] h-9 px-6 rounded-full border border-os-accent/20"
                            asChild
                          >
                            <Link to="/rfq/create">Request Sourcing →</Link>
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
                  )
                }

                {/* Pagination */}
                <PaginationFooter
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  pageSize={pagination.pageSize}
                  onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                />
              </main >
            </div >
          </div >

          {/* Mobile Filters Drawer */}
          < Drawer
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            position="right"
            title="Refine Selection"
          >
            <div className="space-y-10 p-2">
              {/* Markets Section */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">Discovery Clusters</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id || cat}
                      onClick={() => setSelectedFilters({ ...selectedFilters, category: cat.id || cat })}
                      className={`px-4 py-3 rounded-os-md text-[10px] font-bold uppercase tracking-widest transition-all text-center border ${selectedFilters.category === (cat.id || cat)
                        ? 'bg-os-accent/10 border-os-accent text-os-accent'
                        : 'bg-os-surface-solid border-os-stroke text-os-text-primary/60 hover:border-os-accent/30 hover:bg-os-accent/5'
                        }`}
                    >
                      {cat.name || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin Section */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">Origin of Goods</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_COUNTRIES.map((country) => (
                    <button
                      key={country}
                      onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedFilters.country === country
                        ? 'bg-os-action text-white border-os-action'
                        : 'bg-white border-os-stroke text-os-text-primary/60 hover:border-os-accent'
                        }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thresholds Section */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">Scale & Capacity</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary/60">Min Order</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={moqMin}
                      onChange={(e) => setMoqMin(e.target.value)}
                      className="h-10 border-os-stroke rounded-os-sm text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary/60">Max Price</label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="h-10 border-os-stroke rounded-os-sm text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-os-stroke">
                <Button
                  variant="primary"
                  className="w-full h-14 rounded-full bg-os-action text-white font-black uppercase tracking-[0.2em] text-xs shadow-os-sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  Show Results
                </Button>
              </div>
            </div>
          </Drawer >
        </div>
      </div>
    </>
  );
}
