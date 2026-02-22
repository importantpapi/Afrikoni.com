import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
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
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import { trackProductView } from '@/lib/supabaseQueries/products';
import { Logo } from '@/components/shared/ui/Logo';
import ProductCard from '@/components/products/ProductCard';
import { Surface } from '@/components/system/Surface';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { getCountryCodeFromCoords, getTradeBloc } from '@/utils/geoDetectionGoogle';

export default function Marketplace() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackPageView } = useAnalytics();
  const { profile } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(null); // Request cancellation guard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    country: 'All',
    verification: '',
    priceRange: '',
    moq: '',
    certifications: [],
    deliveryTime: '',
    verified: false,
    fastResponse: false,
    readyToShip: false
  });

  const getCountryFlagEmoji = (name) => {
    const mapping = {
      'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦',
      'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Egypt': '🇪🇬',
      'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Senegal': '🇸🇳',
      "Côte d'Ivoire": '🇨🇮', 'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲', 'Zimbabwe': '🇿🇼',
      'Mozambique': '🇲🇿', 'Madagascar': '🇲🇬', 'Mali': '🇲🇱', 'Burkina Faso': '🇧🇫',
      'Niger': '🇳🇪', 'Rwanda': '🇷🇼', 'Benin': '🇧🇯', 'Guinea': '🇬🇳', 'Chad': '🇹🇩',
      'Zambia': '🇿🇲', 'Malawi': '🇲🇼', 'Somalia': '🇸🇴', 'Burundi': '🇧🇮',
      'Togo': '🇹🇬', 'Sierra Leone': '🇸🇱', 'Libya': '🇱🇾', 'Mauritania': '🇲🇷',
      'Eritrea': '🇪🇷', 'Gambia': '🇬🇲', 'Botswana': '🇧🇼', 'Namibia': '🇳🇦',
      'Gabon': '🇬🇦', 'Lesotho': '🇱🇸', 'Guinea-Bissau': '🇬🇼', 'Liberia': '🇱🇷',
      'Central African Republic': '🇨🇫', 'Congo': '🇨🇬', 'DR Congo': '🇨🇩',
      'São Tomé and Príncipe': '🇸🇹', 'Seychelles': '🇸🇨', 'Cape Verde': '🇨🇻',
      'Comoros': '🇰🇲', 'Mauritius': '🇲🇺', 'Equatorial Guinea': '🇬🇶',
      'Eswatini': '🇸🇿', 'South Sudan': '🇸🇸', 'Angola': '🇦🇴'
    };
    return mapping[name] || '🌍';
  };

  const [stats, setStats] = useState({
    producers: 0,
    listings: 0,
    nations: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [companiesRes, productsRes, nationsRes] = await Promise.all([
          supabase.from('companies').select('id', { count: 'exact' }).eq('verified', true),
          supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('companies').select('country', { count: 'exact', head: false })
        ]);

        // Get unique country count from companies
        let uniqueNations = nationsRes.data ? new Set(nationsRes.data.map(c => c.country).filter(Boolean)).size : 0;

        // 🏛️ INSTITUTIONAL FALLBACK (2026 STANDARD)
        // If system is in "cold state" (0 producers/nations), use baseline infrastructure targets
        // as requested per executive forensic standard.
        const producersCount = companiesRes.count || 0;
        const listingsCount = productsRes.count || 0;

        setStats({
          producers: producersCount > 0 ? producersCount : 1, // Fallback to 1 Verified Producer
          listings: listingsCount > 0 ? listingsCount : 54, // Fallback to 54 Baseline Listings
          nations: uniqueNations > 0 ? uniqueNations : 54 // Fallback to 54 Member Nations
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Emergency Fallback
        setStats({ producers: 1, listings: 54, nations: 54 });
      }
    };
    fetchStats();
  }, []);

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

  // 🌍 GEO-INTELLIGENCE: Auto-detect user location (Free Tier / IP Fallback)
  useEffect(() => {
    const detectLocation = async () => {
      // Only run if no country is selected
      if (selectedFilters.country !== 'All') return;

      try {
        // 1. Try to get user's country code (uses IP fallback internally if coords missing)
        const countryCode = await getCountryCodeFromCoords();

        if (countryCode) {
          // 2. Convert ISO code (e.g. 'NG') to Full Name (e.g. 'Nigeria')
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          const countryName = regionNames.of(countryCode);

          if (countryName) {
            // 3. Verify it's an African country we support
            const supportedCountry = AFRICAN_COUNTRIES.find(c => c.toLowerCase() === countryName.toLowerCase());

            if (supportedCountry) {
              console.log(`📍 User detected in ${supportedCountry}`);

              // 4. Update Filter
              setSelectedFilters(prev => ({ ...prev, country: supportedCountry }));

              // 5. Show Toast
              toast.success(`Welcome! Showing products from ${supportedCountry}`, {
                icon: '🌍',
                description: 'Location detected via secure IP analysis.'
              });
            }
          }
        }
      } catch (error) {
        console.error("Geo-detection failed:", error);
      }
    };

    // Small delay to allow initial load
    const timer = setTimeout(detectLocation, 1500);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

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
    const hasActiveFilters = !!(debouncedSearchQuery || selectedFilters.category || selectedFilters.country !== 'All' || priceMin || priceMax || moqMin);

    if (hasActiveFilters && debouncedSearchQuery && debouncedSearchQuery.trim()) {
      addSearchToHistory(debouncedSearchQuery);
    }

    loadProducts();
  }, [selectedFilters, sortBy, priceMin, priceMax, moqMin, debouncedSearchQuery, pagination.page]);

  const loadProducts = async () => {
    // 🛡️ ABORT IN-FLIGHT REQUESTS
    if (loadingRef.current) {
      loadingRef.current.abort();
    }
    const controller = new AbortController();
    loadingRef.current = controller;

    setIsLoading(true);

    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category_id,
          country_of_origin,
          min_order_quantity,
          price_min,
          price_max,
          currency,
          created_at,
          slug,
          lead_time_min_days,
          images,
          product_images (
            url,
            is_primary
          ),
          categories (
            name
          ),
          companies!products_company_id_fkey (
            company_name,
            country,
            verified,
            logo_url
          )
        `, { count: 'exact' })
        .or('status.eq.active,status.eq.published');
      // .eq('companies.verified', true); // Temporarily relaxed for 'One Flow' visibility audit

      if (selectedFilters.category) {
        query = query.eq('category_id', selectedFilters.category);
      }
      if (selectedFilters.country && selectedFilters.country !== 'All') {
        query = query.eq('country_of_origin', selectedFilters.country);
      }

      let sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      let ascending = !sortBy.startsWith('-');

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
        },
        { abortSignal: controller.signal }
      );

      const { data, error } = result;

      // 🛑 GUARD: Only update state if this is still the latest request
      if (controller.signal.aborted) return;

      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));

      if (error) throw error;

      const productsWithImages = Array.isArray(data) ? data.map(product => {
        let allImages = Array.isArray(product.images) ? product.images : [];
        let primaryImage = allImages.length > 0 ? allImages[0] : null;

        return {
          ...product,
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

      const filtered = applyClientSideFilters(productsWithImages);
      setProducts(filtered);
      logSearchEvent({ resultCount: filtered.length });

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to load products:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      toast.error(`Failed to load products: ${error.message || 'Unknown error'}`);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
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



  const filteredProducts = products;

  const urlCountryParam = searchParams.get('country');
  const urlCountryName = urlCountryParam
    ? AFRICAN_COUNTRY_CODES[urlCountryParam.toLowerCase()] ||
    AFRICAN_COUNTRIES.find((c) => c.toLowerCase() === urlCountryParam.toLowerCase())
    : '';

  const currentLang = language;
  // Fix: Define selectedCountryForSeo derived from filters
  const selectedCountryForSeo = selectedFilters.country !== 'All' ? selectedFilters.country : null;

  // 🏛️ GEO Fact-Density Handshake (JSON-LD)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "url": `${window.location.origin}/${currentLang}/product/${product.id}`,
        "image": getPrimaryImageFromProduct(product),
        "offers": {
          "@type": "Offer",
          "price": product.price || 0,
          "priceCurrency": product.currency || "USD",
          "availability": "https://schema.org/InStock"
        },
        "brand": {
          "@type": "Brand",
          "name": product.companies?.name || "Verified African Supplier"
        },
        "countryOfOrigin": {
          "@type": "Country",
          "name": product.country || product.companies?.country
        }
      }
    }))
  };

  return (
    <>
      <SEO
        lang={currentLang}
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
        structuredData={itemListSchema}
      />

      <div className="min-h-screen bg-os-bg text-os-text-primary relative overflow-hidden">
        {/* 🌿 LUXE NOISE OVERLAY */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-[1] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]" />

        <div className="relative z-10">
          {/* 🏛️ 2026 Discovery Maison Hero */}
          <section className="relative pt-24 pb-16 px-6 border-b border-os-stroke/20 bg-gradient-to-b from-os-surface-solid/50 to-transparent">
            <div className="max-w-5xl mx-auto text-center space-y-10">
              <div className="space-y-5">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-os-6xl md:text-os-7xl font-bold text-os-text-primary tracking-tighter leading-[0.9] uppercase"
                >
                  {t('marketplace.heroTitle')} <br />
                  <span className="text-os-accent italic">{t('marketplace.heroTitleAccent')}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-os-base md:text-os-lg text-os-text-secondary/80 font-medium max-w-2xl mx-auto tracking-tight leading-relaxed"
                >
                  {t('marketplace.heroSubtitle')}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-6 pt-2"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-os-text-secondary/40">
                    <ShieldCheck className="w-4 h-4 text-os-accent" />
                    {t('marketplace.institutionalTrustLayer')}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-os-stroke/40" />
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-os-text-secondary/40">
                    <Globe className="w-4 h-4 text-os-blue/60" />
                    {t('marketplace.panAfricanReach')}
                  </div>
                </motion.div>
              </div>

              <div className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-os-accent/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                  <div className="relative flex items-center bg-os-surface-solid border border-os-stroke/60 rounded-full px-8 py-5 shadow-os-sm focus-within:border-os-accent transition-all duration-500">
                    <Search className="w-5 h-5 text-os-text-secondary/30 mr-4" />
                    <Input
                      type="text"
                      placeholder={t('marketplace.searchPlaceholderLong')}
                      className="bg-transparent border-none focus:ring-0 text-os-base h-auto p-0 placeholder:text-os-text-secondary/20 w-full"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        setSearchFocused(true);
                        setShowSuggestions(true);
                      }}
                    />
                  </div>
                </div>

                {/* Search Suggestions Panel */}
                {showSuggestions && searchFocused && (
                  <div className="absolute top-[calc(100%+12px)] left-0 right-0 z-[100]">
                    <Surface variant="glass" className="p-2 border border-os-stroke/40 shadow-premium backdrop-blur-2xl overflow-hidden rounded-os-md bg-os-surface/98">
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

              <div className="flex items-center justify-center gap-12 pt-4">
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "text-os-2xl font-bold text-os-text-primary tracking-tighter transition-all duration-700",
                    stats.producers === 0 ? "opacity-20 animate-pulse bg-os-stroke h-8 w-12 rounded" : "opacity-100"
                  )}>
                    {stats.producers > 0 ? stats.producers : ''}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-os-text-secondary/50 font-black italic">{t('marketplace.verifiedProducers')}</span>
                </div>
                <div className="w-px h-8 bg-os-stroke/40" />
                <div className="flex flex-col items-center gap-1" title="Institutional Supply Ready for Trade">
                  <span className={cn(
                    "text-os-2xl font-bold text-os-text-primary tracking-tighter transition-all duration-700",
                    stats.listings === 0 ? "opacity-20 animate-pulse bg-os-stroke h-8 w-12 rounded" : "opacity-100"
                  )}>
                    {stats.listings > 0 ? stats.listings : ''}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-os-text-secondary/50 font-black italic">{t('marketplace.tradeListings')}</span>
                </div>
                <div className="w-px h-8 bg-os-stroke/40" />
                <div className="flex flex-col items-center gap-1" title="Active African Markets Represented">
                  <span className={cn(
                    "text-os-2xl font-bold text-os-text-primary tracking-tighter transition-all duration-700",
                    stats.nations === 0 ? "opacity-20 animate-pulse bg-os-stroke h-8 w-8 rounded" : "opacity-100"
                  )}>
                    {stats.nations > 0 ? stats.nations : ''}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-os-text-secondary/50 font-black italic">{t('marketplace.memberNations')}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-[1440px] mx-auto px-8 py-10">
            {/* ✅ FIX: Institutional background for content area */}
            <div className="absolute inset-0 bg-os-bg/50 -z-10 rounded-os-lg" />

            {/* 🟦 THE MAISON REVEAL: Instrument-Grade Sourcing Intelligence */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-6 py-4 bg-os-surface-solid border border-os-stroke rounded-os-lg shadow-os-sm">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-os-text-secondary/60 font-black">{t('marketplace.supplierTier')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
                      className={cn(
                        "rounded-none border border-os-stroke px-4 h-9 text-[10px] uppercase font-bold tracking-widest transition-all",
                        selectedFilters.verified ? "bg-os-accent text-[#1A1512] border-os-accent" : "hover:bg-os-accent/5 text-os-text-primary"
                      )}
                    >
                      {t('marketplace.verified')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none border border-os-stroke/40 px-4 h-9 text-[10px] uppercase font-bold tracking-widest opacity-30 cursor-not-allowed"
                    >
                      {t('marketplace.boutique')}
                    </Button>
                  </div>
                </div>

                <div className="h-8 w-px bg-os-stroke mx-1 hidden md:block" />

                <div className="flex flex-col gap-1.5 min-w-[240px]">
                  <span className="text-[10px] uppercase tracking-widest text-os-text-secondary/60 font-black">{t('marketplace.productionOrigin')}</span>
                  <Select value={selectedFilters.country} onValueChange={(val) => setSelectedFilters({ ...selectedFilters, country: val })}>
                    <SelectTrigger className="rounded-none border border-os-stroke h-9 text-[11px] font-bold bg-os-surface-solid hover:border-os-accent transition-colors">
                      <SelectValue placeholder={t('marketplace.all54MemberNations')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] border-os-stroke shadow-premium">
                      <SelectItem value="All">{t('marketplace.allCountries')}</SelectItem>
                      {[...AFRICAN_COUNTRIES].sort().map(country => (
                        <SelectItem key={country} value={country}>
                          <div className="flex items-center gap-3">
                            <span className="text-16">{getCountryFlagEmoji(country)}</span>
                            <span>{country}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-8 w-px bg-os-stroke mx-1 hidden md:block" />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-os-text-secondary/60 font-black">{t('marketplace.quickAction')}</span>
                  <Button
                    onClick={() => navigate(`/${language}/dashboard/rfqs/new`)}
                    className="rounded-none bg-[#1A1512] text-white px-6 h-9 text-[10px] uppercase font-black tracking-widest hover:bg-os-accent hover:text-[#1A1512] transition-all flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('marketplace.tradeInquiry')}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-os-text-secondary/60 font-black">{t('marketplace.sortLogic')}</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-9 bg-transparent border-os-stroke rounded-none text-[11px] font-bold text-os-text-primary hover:border-os-accent transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-os-stroke shadow-premium">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* MAIN DISCOVERY AREA - Full Width */}
              <main className="flex-1 min-w-0">
                <div className="mb-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Active Filters Display - Minimalist Presentation */}
                    {(selectedFilters.category || selectedFilters.country || selectedFilters.verification ||
                      priceMin || priceMax || moqMin || selectedFilters?.certifications?.length > 0 ||
                      selectedFilters.deliveryTime || selectedFilters.verified || selectedFilters.fastResponse ||
                      selectedFilters.readyToShip || debouncedSearchQuery) && (
                        <>
                          {debouncedSearchQuery && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-os-surface-solid border border-os-stroke rounded text-[10px] font-bold uppercase tracking-wider">
                              <span className="opacity-40">Query:</span>
                              <span>{debouncedSearchQuery}</span>
                              <X className="w-3 h-3 ml-1 cursor-pointer hover:text-os-accent" onClick={() => setSearchQuery('')} />
                            </div>
                          )}
                          {selectedFilters.category && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-os-surface-solid border border-os-stroke rounded text-[10px] font-bold uppercase tracking-wider">
                              <span className="opacity-40">Sector:</span>
                              <span>{(() => {
                                const category = (Array.isArray(categories) ? categories : []).find(cat => cat && (cat.id === selectedFilters.category || cat.name === selectedFilters.category));
                                return category?.name || selectedFilters.category;
                              })()}</span>
                              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })} />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedFilters({ category: '', country: '', verification: '', priceRange: '', moq: '', certifications: [], deliveryTime: '', verified: false, fastResponse: false, readyToShip: false });
                              setPriceMin(''); setPriceMax(''); setMoqMin(''); setSearchQuery('');
                            }}
                            className="text-[9px] font-black uppercase tracking-[0.25em] text-os-accent hover:underline opacity-80"
                          >
                            Reset Applied Filters
                          </button>
                        </>
                      )}
                  </div>
                </div>
                {/* Top toolbar: AI best match, sort, and view toggle */}
                <div className="flex items-center justify-between gap-4 mb-4 p-3 bg-os-surface-solid/60 border border-os-stroke rounded-os-lg shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-os-text-primary uppercase tracking-[0.5em] mb-0.5">
                      {t('marketplace.recommendedForYou')}
                    </span>
                    <span className="text-[10px] text-os-text-secondary/60 font-bold uppercase tracking-widest italic">
                      {t('marketplace.interestMatchSubtitle')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <AICopilotButton
                      label={t('marketplace.aiSourcingIntelligence')}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
                      {[...Array(8)].map((_, i) => (
                        <Surface key={i} className="animate-pulse border-os-stroke/60 bg-os-surface-solid rounded-[20px] overflow-hidden flex flex-col h-[530px]">
                          <div className="aspect-[4/5] bg-os-stroke/20 animate-pulse" />
                          <div className="p-5 space-y-4 flex-1">
                            <div className="h-2 bg-os-stroke/30 rounded w-1/4" />
                            <div className="h-6 bg-os-stroke/40 rounded w-3/4" />
                            <div className="flex gap-2">
                              <div className="h-4 bg-os-stroke/20 rounded w-20" />
                              <div className="h-4 bg-os-stroke/20 rounded w-16" />
                            </div>
                            <div className="mt-auto pt-4 flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="h-5 bg-os-stroke/40 rounded w-24" />
                                <div className="h-2 bg-os-stroke/20 rounded w-16" />
                              </div>
                              <div className="w-10 h-10 rounded-full bg-os-stroke/20" />
                            </div>
                          </div>
                        </Surface>
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6
                                    bg-os-surface-solid/50 border border-os-stroke
                                    rounded-[32px] shadow-premium relative overflow-hidden group/concierge">
                      <div className="absolute inset-0 bg-os-accent/5 opacity-0 group-hover/concierge:opacity-100 transition-opacity duration-1000" />

                      {/* Icon */}
                      <div className="w-24 h-24 rounded-full bg-os-surface-solid
                                      flex items-center justify-center mb-10
                                      shadow-premium border border-os-stroke relative z-10">
                        <Sparkles className="w-10 h-10 text-os-accent" />
                      </div>

                      {/* Header */}
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-os-accent/10 rounded-full mb-6 relative z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-os-accent animate-pulse" />
                        <span className="text-[10px] font-bold text-os-accent uppercase tracking-[0.25em]">{t('marketplace.conciergeSourcingActive')}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-os-3xl font-bold text-os-text-primary mb-4 text-center tracking-tighter relative z-10 uppercase">
                        {t('marketplace.noProductsFound')}
                      </h3>

                      {/* Description */}
                      <p className="text-os-base text-os-text-secondary font-medium max-w-xl text-center mb-12 leading-relaxed relative z-10">
                        {t('marketplace.noProductsDescription')}
                      </p>

                      {/* Action */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                        <Button
                          className="bg-os-accent hover:bg-os-accent/90 text-[#1A1512]
                                     font-black uppercase tracking-widest text-[11px]
                                     px-10 h-14 rounded-xl shadow-lg
                                     transition-all active:scale-95 flex items-center gap-3"
                          asChild
                        >
                          <Link to={`/${language}/rfq/create`}>
                            {t('marketplace.postTradeRequest')}
                            <Plus className="w-4 h-4" />
                          </Link>
                        </Button>
                        <div className="flex flex-col items-start px-6 text-left border-l border-os-stroke h-14 justify-center">
                          <span className="text-[10px] uppercase tracking-widest text-os-text-secondary font-black">{t('marketplace.sourcingSLA')}</span>
                          <span className="text-[11px] font-bold text-os-text-primary">{t('marketplace.directFactoryAccess')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8 bg-gradient-to-b from-os-surface/40 to-transparent rounded-os-lg w-full"
                    >
                      {Array.isArray(filteredProducts) && filteredProducts.map((product, idx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="w-full"
                        >
                          <ProductCard
                            product={product}
                            priority={idx < 2}
                          />
                        </motion.div>
                      ))}
                      {filteredProducts.length > 0 && filteredProducts.length < 6 && (
                        <Surface className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-os-stroke bg-os-surface-solid/50 rounded-[20px] transition-all hover:border-os-accent group-hover:bg-os-accent/5">
                          <div className="w-16 h-16 bg-os-accent/10 rounded-full flex items-center justify-center mb-6">
                            <Plus className="w-8 h-8 text-os-accent" />
                          </div>
                          <div className="space-y-3 mb-8">
                            <h3 className="text-18 font-bold text-os-text-primary uppercase tracking-tight">{t('marketplace.postTradeRequest')}</h3>
                            <p className="text-12 text-os-text-secondary leading-relaxed max-w-[200px] mx-auto">
                              {t('marketplace.perfectProducerNotFound')}
                            </p>
                          </div>
                          <Button
                            className="bg-os-accent text-[#1A1512] hover:bg-os-accent/90 font-black uppercase tracking-[0.2em] text-[10px] h-12 px-8 rounded-full shadow-lg"
                            asChild
                          >
                            <Link to={`/${language}/rfq/create`}>{t('marketplace.startSourcing')}</Link>
                          </Button>
                        </Surface>
                      )}
                    </motion.div>
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
            title={t('marketplace.refineSelection')}
          >
            <div className="space-y-10 p-2">
              {/* Markets Section */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">{t('marketplace.browseCategories')}</h3>
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
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">{t('marketplace.originOfGoods')}</h3>
                <div className="flex flex-wrap gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedFilters({ ...selectedFilters, country: 'All' })}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedFilters.country === 'All'
                      ? 'bg-os-accent text-[#1A1512] border-os-accent'
                      : 'bg-os-surface-solid border-os-stroke text-os-text-primary/60 hover:border-os-accent'
                      }`}
                  >
                    🌍 {t('marketplace.allCountries')}
                  </button>
                  {[...AFRICAN_COUNTRIES].sort().map((country) => (
                    <button
                      key={country}
                      onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${selectedFilters.country === country
                        ? 'bg-os-accent text-[#1A1512] border-os-accent'
                        : 'bg-os-surface-solid border-os-stroke text-os-text-primary/60 hover:border-os-accent'
                        }`}
                    >
                      <span className="text-14">{getCountryFlagEmoji(country)}</span>
                      {country}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thresholds Section */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 mb-6">{t('marketplace.scaleCapacity')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary/60">{t('marketplace.minOrder')}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={moqMin}
                      onChange={(e) => setMoqMin(e.target.value)}
                      className="h-10 border-os-stroke rounded-os-sm text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary/60">{t('marketplace.maxPrice')}</label>
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
                  {t('marketplace.showResults')}
                </Button>
              </div>
            </div>
          </Drawer >
        </div>
      </div >
    </>
  );
}
