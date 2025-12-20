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
  Building2,
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { VerificationBadgeTooltip } from '@/components/trust/VerificationBadgeTooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import Price from '@/components/ui/Price';
import TrustBadge from '@/components/ui/TrustBadge';
import { toast } from 'sonner';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';
import { AFRICAN_COUNTRIES, AFRICAN_COUNTRY_CODES } from '@/constants/countries';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import { trackProductView } from '@/lib/supabaseQueries/products';
import { Logo } from '@/components/ui/Logo';

export default function Marketplace() {
  const { t } = useTranslation();
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
    
    // Load current user for tracking
    const loadUser = async () => {
      try {
        const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
        const { user, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        setCurrentUser(user);
        setCurrentCompanyId(companyId);
      } catch (error) {
        // Silent fail - user tracking is optional
      }
    };
    loadUser();
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
      // Use buildProductQuery for server-side filtering
      // buildProductQuery already includes product_images(*), so we just need to add companies
      let query = buildProductQuery({
        status: 'active',
        categoryId: selectedFilters.category || null,
        country: selectedFilters.country || null
      });
      
      // Rebuild query to include companies (buildProductQuery already includes product_images)
      // NOTE: product_images is the single source of truth for product images
      // We rebuild the query to ensure companies are included
      const selectString = `
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
      `;
      
      query = supabase
        .from('products')
        .select(selectString);
      
      // Re-apply filters
      query = query.eq('status', 'active');
      if (selectedFilters.category) {
        query = query.eq('category_id', selectedFilters.category);
      }
      if (selectedFilters.country) {
        query = query.eq('country_of_origin', selectedFilters.country);
      }
      
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
          ascending,
          selectOverride: selectString
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
        // Debug: Log product_images data (development only)
        if (process.env.NODE_ENV === 'development') {
          if (product.product_images) {
            const imageCount = Array.isArray(product.product_images) ? product.product_images.length : 1;
            console.log(`📸 Marketplace: Product ${product.id} (${product.title}) has ${imageCount} image(s):`, product.product_images);
          } else {
            console.warn(`⚠️ Marketplace: Product ${product.id} (${product.title}) has NO product_images`);
          }
        }
        
        // Get primary image from product_images (preferred) or legacy products.images
        let primaryImage = getPrimaryImageFromProduct(product);
        let allImages = getAllImagesFromProduct(product);
        
        // Normalize all image URLs to ensure they're full URLs
        if (primaryImage) {
          primaryImage = normalizeProductImageUrl(primaryImage) || primaryImage;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Marketplace: Primary image for ${product.id}:`, primaryImage);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Marketplace: No primary image found for product ${product.id} (${product.title})`);
            console.warn(`   Product data:`, { 
              hasProductImages: !!product.product_images, 
              productImagesType: typeof product.product_images,
              productImagesLength: Array.isArray(product.product_images) ? product.product_images.length : 'not array',
              productImagesContent: product.product_images,
              hasLegacyImages: !!product.images
            });
          }
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

  const ProductCard = React.memo(({ product, priority = false }) => {
    const [quickViewOpen, setQuickViewOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(product.primaryImage || null);

    const allImages = Array.isArray(product.allImages) ? product.allImages.filter(Boolean) : [];

    const goToPrevImage = (e) => {
      e.stopPropagation();
      if (!allImages.length) return;
      setActiveImage((current) => {
        if (!current) return allImages[0];
        const currentIndex = allImages.indexOf(current);
        const prevIndex = currentIndex <= 0 ? allImages.length - 1 : currentIndex - 1;
        return allImages[prevIndex];
      });
    };

    const goToNextImage = (e) => {
      e.stopPropagation();
      if (!allImages.length) return;
      setActiveImage((current) => {
        if (!current) return allImages[0];
        const currentIndex = allImages.indexOf(current);
        const nextIndex = currentIndex === -1 || currentIndex >= allImages.length - 1 ? 0 : currentIndex + 1;
        return allImages[nextIndex];
      });
    };
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
      <div className="h-full">
          <Card 
            className="h-full cursor-pointer border border-afrikoni-gold/20 shadow-md overflow-hidden"
            onClick={handleCardClick}
          >
            <div className="relative h-56 bg-gradient-to-br from-afrikoni-cream to-afrikoni-gold/10 rounded-t-xl overflow-hidden">
              {activeImage ? (
                <OptimizedImage
                  src={activeImage}
                  alt={product.title || product.name || 'Product'}
                  className="w-full h-full object-cover"
                  width={400}
                  height={300}
                  priority={priority}
                  quality={85}
                  placeholder="/product-placeholder.svg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-cream flex items-center justify-center">
                  <Package className="w-12 h-12 text-afrikoni-gold/50" />
                </div>
              )}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center"
                    onClick={goToPrevImage}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center"
                    onClick={goToNextImage}
                  >
                    ›
                  </button>
                </>
              )}
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <Badge variant="primary" className="text-xs">⭐ {t('marketplace.featured')}</Badge>
                </div>
              )}
              {/* Save Button - Top Right */}
              <div className="absolute top-2 right-2 z-20">
                <SaveButton itemId={product.id} itemType="product" />
              </div>
              {/* Supplier verification / trust badge */}
              {product.companies?.verification_status === 'verified' && (
                <div className="absolute top-12 right-2 flex items-center gap-1 bg-black/65 text-white px-2 py-1 rounded-full shadow-sm">
                  <Logo type="icon" size="sm" link={false} className="w-5 h-5" />
                  <Smile className="w-3 h-3 text-afrikoni-gold" />
                </div>
              )}
              {Array.isArray(product.allImages) && product.allImages.length > 1 && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {product.allImages.length} photos
                </div>
              )}
            </div>
            <CardContent className="p-5 bg-white" style={{ overflow: 'visible' }}>
              {/* Product Name - Highest Priority */}
              <h3 className="font-bold text-afrikoni-chestnut mb-3 line-clamp-2 text-lg md:text-xl leading-tight group-hover:text-afrikoni-gold transition-colors">
                {product.title || product.name}
              </h3>
              
              {/* City + Country - Second Priority */}
              <div className="flex items-center gap-1 flex-wrap mb-3">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-afrikoni-deep/70 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-afrikoni-deep/80 font-medium flex items-center gap-1">
                  {(() => {
                    const city =
                      product?.city ||
                      product?.companies?.city ||
                      product?.companies?.town ||
                      '';
                    const country =
                      product?.country_of_origin ||
                      product?.companies?.country ||
                      '';
                    const flag = getCountryFlagEmoji(country);
                    if (city && country) return `${city}, ${country}`;
                    if (country) return country;
                    return 'N/A';
                  })()}
                  {(() => {
                    const country =
                      product?.country_of_origin ||
                      product?.companies?.country ||
                      '';
                    const flag = getCountryFlagEmoji(country);
                    return flag ? <span className="ml-0.5">{flag}</span> : null;
                  })()}
                </span>
              </div>

              {/* Price Range - Core info */}
              <div className="flex items-center gap-2 mb-3">
                {product.price_min && product.price_max ? (
                  <Price
                    amount={product.price_min}
                    fromCurrency={product.currency || 'USD'}
                    unit={product.unit || 'kg'}
                    className="text-lg sm:text-xl font-bold text-afrikoni-gold"
                  />
                ) : product.price_min ? (
                  <Price
                    amount={product.price_min}
                    fromCurrency={product.currency || 'USD'}
                    unit={product.unit || 'kg'}
                    className="text-lg sm:text-xl font-bold text-afrikoni-gold"
                  />
                ) : product.price ? (
                  <Price
                    amount={product.price}
                    fromCurrency={product.currency || 'USD'}
                    unit={product.unit || 'kg'}
                    className="text-lg sm:text-xl font-bold text-afrikoni-gold"
                  />
                ) : (
                  <div className="text-sm text-afrikoni-deep/70">{t('marketplace.priceOnRequest')}</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickViewOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Quick view
                </Button>
              </div>
            </CardContent>
            {/* Quick View Dialog */}
            <Dialog open={quickViewOpen} onOpenChange={(open) => setQuickViewOpen(open)}>
              <DialogContent
                className="max-w-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogHeader>
                  <DialogTitle className="flex flex-col gap-1">
                    <span className="text-xl md:text-2xl font-bold text-afrikoni-chestnut leading-snug">
                      {product.title || product.name}
                    </span>
                    <span className="text-xs md:text-sm text-afrikoni-deep/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-afrikoni-gold flex-shrink-0" />
                      {(() => {
                        const city =
                          product?.city ||
                          product?.companies?.city ||
                          product?.companies?.town ||
                          '';
                        const country =
                          product?.country_of_origin ||
                          product?.companies?.country ||
                          '';
                        if (city && country) return `${city}, ${country}`;
                        if (country) return country;
                        return 'Location not specified';
                      })()}
                      {(() => {
                        const country =
                          product?.country_of_origin ||
                          product?.companies?.country ||
                          '';
                        const flag = getCountryFlagEmoji(country);
                        return flag ? <span className="ml-0.5">{flag}</span> : null;
                      })()}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="aspect-video rounded-lg overflow-hidden bg-afrikoni-cream">
                      {activeImage ? (
                        <OptimizedImage
                          src={activeImage}
                          alt={product.title || product.name || 'Product'}
                          className="w-full h-full object-cover"
                          width={600}
                          height={400}
                          quality={85}
                          placeholder="/product-placeholder.svg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-afrikoni-gold/60" />
                        </div>
                      )}
                    </div>
                    {Array.isArray(product.allImages) && product.allImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {product.allImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-16 h-16 rounded-md overflow-hidden border border-afrikoni-gold/30 flex-shrink-0"
                            onClick={() => setActiveImage(img)}
                          >
                            <OptimizedImage
                              src={img}
                              alt={`${product.title || product.name} - Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              width={64}
                              height={64}
                              quality={75}
                              priority={idx < 3} // Load first 3 thumbnails immediately
                              placeholder="/product-placeholder.svg"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {/* Pricing & MOQ */}
                    <div className="text-lg font-semibold text-afrikoni-chestnut">
                      {product.price_min || product.price || product.price_max ? (
                        <>
                          <Price
                            amount={product.price_min || product.price}
                            fromCurrency={product.currency || 'USD'}
                            unit={product.unit || 'kg'}
                            className="text-xl font-bold text-afrikoni-gold"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-afrikoni-deep/70">
                          {t('marketplace.priceOnRequest')}
                        </span>
                      )}
                    </div>
                    {product.min_order_quantity && (
                      <div className="text-sm text-afrikoni-deep/80">
                        {t('marketplace.moq')}:{' '}
                        <span className="font-medium">
                          {product.min_order_quantity} {product.moq_unit || product.unit || t('marketplace.units')}
                        </span>
                      </div>
                    )}
                    {/* Product overview */}
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-afrikoni-deep/60">
                        Product overview
                      </p>
                      <p className="text-sm md:text-[0.95rem] leading-relaxed text-afrikoni-deep/80">
                        {product.short_description ||
                          product.description ||
                          'Supplier has not added a detailed description yet.'}
                      </p>
                    </div>
                    {/* Trust & compliance badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <VerificationBadgeTooltip
                        verified={product.companies?.verification_status === 'verified' || product.companies?.verified}
                        verificationStatus={product.companies?.verification_status}
                        companyName={product.companies?.company_name || 'This supplier'}
                        size="sm"
                      />
                      {(product.companies?.verification_status !== 'verified' && !product.companies?.verified) && (
                        <Badge className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                          <Shield className="w-3 h-3 mr-1" />
                          {t('marketplace.tradeShieldEligible')}
                        </Badge>
                      )}
                    </div>
                    {/* Why buyers trust this supplier */}
                    {(product?.companies ||
                      (Array.isArray(product?.certifications) && product.certifications.length > 0)) && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-afrikoni-deep/60">
                          {t('marketplace.whyBuyersTrust')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {product.companies?.verification_status === 'verified' && (
                            <Badge
                              variant="outline"
                              className="text-[0.7rem] bg-white text-afrikoni-deep border-green-200"
                            >
                              <Shield className="w-3 h-3 mr-1 text-green-600" />
                              {t('marketplace.afrikoniVerified')}
                            </Badge>
                          )}
                          {hasFastResponse(product?.companies) && (
                            <Badge
                              variant="outline"
                              className="text-[0.7rem] bg-white text-afrikoni-deep border-afrikoni-gold/40"
                            >
                              <Clock className="w-3 h-3 mr-1 text-afrikoni-gold" />
                              {t('marketplace.fastResponse')}
                            </Badge>
                          )}
                          {isReadyToShip(product) && (
                            <Badge
                              variant="outline"
                              className="text-[0.7rem] bg-white text-afrikoni-deep border-afrikoni-gold/40"
                            >
                              <Package className="w-3 h-3 mr-1 text-afrikoni-gold" />
                              {t('marketplace.readyToShip')}
                            </Badge>
                          )}
                          {Array.isArray(product?.certifications) &&
                            product.certifications.slice(0, 4).map((cert) => (
                              <Badge
                                key={cert}
                                variant="outline"
                                className="text-[0.7rem] bg-white text-afrikoni-deep border-afrikoni-gold/40"
                              >
                                <Award className="w-3 h-3 mr-1 text-afrikoni-gold" />
                                {cert}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                    {/* Typical use cases */}
                    {(Array.isArray(product?.use_cases) && product.use_cases.length > 0) ||
                    (Array.isArray(product?.tags) && product.tags.length > 0) ? (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-afrikoni-deep/60">
                          {t('marketplace.typicalUseCases')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(product?.use_cases) && product.use_cases.length > 0
                            ? product.use_cases
                            : product.tags
                          )
                            .slice(0, 6)
                            .map((useCase) => (
                              <span
                                key={useCase}
                                className="text-[0.7rem] px-2 py-1 rounded-full bg-afrikoni-offwhite text-afrikoni-deep/80"
                              >
                                {useCase}
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    {/* CTA hierarchy */}
                    <div className="mt-5 space-y-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full md:w-auto md:min-w-[220px] h-11 text-sm font-semibold shadow-lg bg-gradient-to-r from-afrikoni-gold to-afrikoni-gold/90 hover:from-afrikoni-gold/90 hover:to-afrikoni-gold"
                        onClick={() => navigate(`/dashboard/rfqs/new?product=${product.id}`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {t('marketplace.requestDetailedQuote')}
                      </Button>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={() => {
                            if (product?.id) {
                              sessionStorage.setItem(
                                'contactProductContext',
                                JSON.stringify({
                                  productId: product.id,
                                  productTitle: product.title,
                                  productPrice: product.price || product.price_min,
                                  productCurrency: product.currency,
                                  productMOQ: product.moq || product.min_order_quantity,
                                  supplierName: product?.companies?.company_name || t('marketplace.supplier'),
                                  supplierCountry:
                                    product?.country_of_origin || product?.companies?.country,
                                }),
                              );
                            }
                            navigate(
                              `/messages?recipient=${
                                product?.companies?.id ||
                                product?.supplier_id ||
                                product?.company_id ||
                                ''
                              }&product=${product?.id || ''}&productTitle=${encodeURIComponent(
                                product?.title || '',
                              )}`,
                            );
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {t('marketplace.contactSupplier')}
                        </Button>
                        {product?.companies?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={() => navigate(`/business/${product.companies.id}`)}
                          >
                            <Building2 className="w-4 h-4 mr-1" />
                            {t('marketplace.viewSupplierProfile')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs md:text-sm text-afrikoni-chestnut"
                          onClick={() =>
                            navigate(`/dashboard/rfqs/new?product=${product.id}&mode=ai`)
                          }
                        >
                          <Sparkles className="w-4 h-4 mr-1 text-afrikoni-gold" />
                          {t('marketplace.generateRFQWithAI')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
      </div>
    );
  });

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
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-offwhite via-white to-afrikoni-cream/30">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-afrikoni-gold/30 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-afrikoni-gold absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <Input
                placeholder={t('marketplace.searchPlaceholder') || 'Search products, suppliers, categories...'}
                className="pl-12 pr-4 h-12 text-base border-2 border-afrikoni-gold/30 focus:border-afrikoni-gold rounded-xl shadow-sm hover:shadow-md transition-all"
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
            {/* Enhanced Quick Filter Chips */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
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
              {priceMin || priceMax ? null : (
                  <FilterChip
                  label={t('marketplace.under100')}
                  active={false}
                  onRemove={() => {
                    setPriceMin('');
                    setPriceMax('100');
                  }}
                />
              )}
              {moqMin ? null : (
                  <FilterChip
                  label={t('marketplace.lowMOQ')}
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
          
          {/* Enhanced Country marketplace selector */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-afrikoni-gold" />
                <span className="text-sm md:text-base font-medium text-afrikoni-chestnut">
                  {selectedFilters.country && selectedFilters.country !== t('marketplace.allCountries')
                    ? t('marketplace.productsFrom', { country: selectedFilters.country })
                    : t('marketplace.allAfricanMarkets')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-afrikoni-deep/70 hidden md:inline text-sm">{t('marketplace.countryMarketplace') || 'Country:'}</span>
                <Select
                  value={selectedFilters.country || t('marketplace.allCountries')}
                  onValueChange={(value) => {
                    const countryValue = value === t('marketplace.allCountries') ? '' : value;
                    setSelectedFilters({ ...selectedFilters, country: countryValue });
                  }}
                >
                  <SelectTrigger className="w-44 md:w-52 h-10 border-2 border-afrikoni-gold/40 bg-white hover:border-afrikoni-gold/60 text-afrikoni-deep text-sm font-medium rounded-xl shadow-sm">
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
            {/* Market Scope Selector - Global vs Countries */}
            <div className="flex flex-col gap-4">
              {/* Global Market Scope - Primary */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-meta font-medium text-afrikoni-chestnut/90">{t('marketplace.popularMarkets') || 'Popular Markets'}:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                  aria-label={`Market scope: ${t('marketplace.allAfricanMarkets') || 'All African Markets'}`}
                  className={`group inline-flex items-center gap-2.5 px-6 py-3 rounded-lg border-2 text-meta font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 ${
                    !selectedFilters.country
                      ? 'bg-afrikoni-gold text-white border-afrikoni-gold shadow-md hover:bg-afrikoni-goldDark hover:shadow-lg'
                      : 'bg-white border-afrikoni-gold/30 text-afrikoni-deep hover:bg-afrikoni-gold/5 hover:border-afrikoni-gold/50'
                  }`}
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>{t('marketplace.allAfricanMarkets') || 'All African Markets'}</span>
                </button>
              </div>
              
              {/* Country Filters - Secondary */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-meta font-medium text-afrikoni-chestnut/70">Countries:</span>
                {POPULAR_COUNTRIES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => setSelectedFilters({ ...selectedFilters, country })}
                    aria-label={`Filter by country: ${country}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-meta font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 ${
                      selectedFilters.country === country
                        ? 'bg-afrikoni-gold text-white border-afrikoni-gold shadow-md hover:bg-afrikoni-goldDark hover:shadow-lg'
                        : 'bg-white border-afrikoni-gold/20 text-afrikoni-deep hover:bg-afrikoni-gold/5 hover:border-afrikoni-gold/40'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{country}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Enhanced Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <Card className="border-2 border-afrikoni-gold/20 shadow-lg">
              <CardContent className="p-5 space-y-6">
                <div>
                  <h3 className="font-bold text-base text-afrikoni-chestnut mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-afrikoni-gold" />
                    {t('marketplace.category') || 'Category'}
                  </h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => setSelectedFilters({ ...selectedFilters, category: '' })}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        !selectedFilters.category
                          ? 'bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-gold/10 text-afrikoni-gold font-bold border-2 border-afrikoni-gold/40 shadow-sm'
                          : 'text-afrikoni-deep hover:bg-afrikoni-gold/5 hover:border hover:border-afrikoni-gold/20 rounded-xl'
                      }`}
                    >
                      {t('marketplace.allCategories')}
                    </button>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <button
                        key={cat.id || cat}
                        onClick={() => setSelectedFilters({ ...selectedFilters, category: cat.id || cat })}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedFilters.category === (cat.id || cat)
                            ? 'bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-gold/10 text-afrikoni-gold font-bold border-2 border-afrikoni-gold/40 shadow-sm'
                            : 'text-afrikoni-deep hover:bg-afrikoni-gold/5 hover:border hover:border-afrikoni-gold/20'
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
                    {/* Popular Countries - Always visible */}
                    <div>
                      <p className="text-xs text-afrikoni-deep/70 mb-2 font-medium">Popular Countries</p>
                      {POPULAR_COUNTRIES.map((country) => (
                        <button
                          key={country}
                          onClick={() => setSelectedFilters({ ...selectedFilters, country: country })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedFilters.country === country
                              ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                              : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
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
                      <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => setSelectedFilters({ ...selectedFilters, country: '' })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            !selectedFilters.country
                              ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                              : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
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
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedFilters.country === country
                                  ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
                                  : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
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
                    {(Array.isArray(savedSearches) ? savedSearches : []).map((saved) => (
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
                  <SelectTrigger className="w-40 md:w-52 h-10 border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold/50 rounded-xl shadow-sm font-medium bg-white">
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
                  <Card key={i} className="animate-pulse border-2 border-afrikoni-gold/10 overflow-hidden">
                    <div className="h-56 bg-gradient-to-br from-afrikoni-cream to-afrikoni-gold/10" />
                    <CardContent className="p-5 space-y-3">
                      <div className="h-5 bg-afrikoni-cream rounded-lg w-3/4" />
                      <div className="h-4 bg-afrikoni-cream rounded-lg w-1/2" />
                      <div className="h-4 bg-afrikoni-cream rounded-lg w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-white to-afrikoni-cream/30 shadow-xl overflow-hidden">
                <CardContent className="p-12 md:p-16 text-center">
                  <div className="w-20 h-20 bg-afrikoni-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-afrikoni-gold" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
                    {t('marketplace.noExactMatches')}
                  </h3>
                  <p className="text-base md:text-lg text-afrikoni-deep/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                    {t('marketplace.afrikoniWorksThroughRFQs')}
                  </p>
                  
                  {/* Enhanced Primary CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-afrikoni-gold to-afrikoni-gold/90 hover:from-afrikoni-gold/90 hover:to-afrikoni-gold text-white font-bold shadow-lg hover:shadow-xl transition-all px-8 py-6 h-auto rounded-xl"
                      asChild
                    >
                      <Link to="/rfq/create">
                        <FileText className="w-5 h-5 mr-2" />
                        {t('marketplace.postRequestRFQ')}
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-semibold px-8 py-6 h-auto rounded-xl shadow-sm hover:shadow-md"
                      asChild
                    >
                      <Link to="/contact">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        {t('marketplace.talkToTradeAdvisor')}
                      </Link>
                    </Button>
                  </div>
                  
                  {/* Enhanced Visual Reassurance */}
                  <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-afrikoni-gold/20 shadow-sm">
                      <Shield className="w-4 h-4 text-afrikoni-gold" />
                      <span className="text-sm font-medium text-afrikoni-chestnut">{t('marketplace.verifiedSuppliersOnly')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-afrikoni-gold/20 shadow-sm">
                      <MessageSquare className="w-4 h-4 text-afrikoni-purple" />
                      <span className="text-sm font-medium text-afrikoni-chestnut">{t('marketplace.humanLedSourcing')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-afrikoni-gold/20 shadow-sm">
                      <Award className="w-4 h-4 text-afrikoni-gold" />
                      <span className="text-sm font-medium text-afrikoni-chestnut">{t('marketplace.escrowProtected')}</span>
                    </div>
                  </div>
                  
                  {/* Optional Smart Hint */}
                  <p className="text-xs text-afrikoni-deep/60 italic max-w-xl mx-auto">
                    {t('marketplace.mostSuccessfulTradesHint')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                {Array.isArray(filteredProducts) && filteredProducts.map((product, idx) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    priority={idx < 2} // Load first 2 images immediately on mobile, more on desktop (handled by OptimizedImage)
                  />
                ))}
                {/* Fill empty space when there are few products */}
                {filteredProducts.length > 0 && filteredProducts.length < 4 && (
                  <div className="hidden lg:block">
                    <Card className="border-afrikoni-gold/10 bg-gradient-to-br from-afrikoni-offwhite to-white h-full">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                        <Package className="w-12 h-12 text-afrikoni-gold/40 mb-4" />
                        <h3 className="font-semibold text-afrikoni-chestnut mb-2">{t('marketplace.moreVerifiedSuppliers')}</h3>
                        <p className="text-sm text-afrikoni-deep/70 mb-4">
                          {t('marketplace.moreSuppliersOnboardedDaily')}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10"
                          asChild
                        >
                          <Link to="/rfq/create">{t('marketplace.postAnRFQ')}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {/* Show skeleton loaders for remaining grid slots when < 8 products */}
                {filteredProducts.length > 0 && filteredProducts.length < 8 && (
                  <>
                    {[...Array(Math.min(8 - filteredProducts.length, 4))].map((_, i) => (
                      <Card key={`skeleton-${i}`} className="animate-pulse opacity-30">
                        <div className="h-48 bg-afrikoni-cream rounded-t-xl" />
                        <CardContent className="p-4 space-y-2">
                          <div className="h-4 bg-afrikoni-cream rounded w-3/4" />
                          <div className="h-4 bg-afrikoni-cream rounded w-1/2" />
                        </CardContent>
                      </Card>
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

