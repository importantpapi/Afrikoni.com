import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
// Removed Radix Tabs - using plain conditionals instead
import { Heart, Package, Users, Search, Bookmark, FileText, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import OptimizedImage from '@/components/OptimizedImage';
import { useDataFreshness } from '@/hooks/useDataFreshness';

function DashboardSavedInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { userId, isSystemReady, canLoadData } = useDashboardKernel();
  const [savedProducts, setSavedProducts] = useState([]);
  const [savedSuppliers, setSavedSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ FINAL SYNC: Data freshness tracking (30 second threshold)
  const { isStale, markFresh, refresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  // ✅ FORENSIC RECOVERY: Add "Is Initialized" ref to prevent redundant triggers
  const isInitialMount = useRef(true);

  // ✅ FORENSIC RECOVERY: Use ref to track loading state (prevents dependency loops)
  const isLoadingRef = useRef(false);
  
  // ✅ CRITICAL FIX: Store function in ref to prevent dependency loop
  const loadSavedItemsRef = useRef(null);
  
  // ✅ KERNEL MIGRATION: Memoize loadSavedItems with useCallback to prevent infinite loops
  const loadSavedItems = useCallback(async () => {
    // Guard 1: Don't run if already loading or no userId
    if (!canLoadData || !userId || isLoadingRef.current) {
      return;
    }
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      // ✅ KEY FIX: Fetch all saved_items first to check if empty
      const { data: allSavedItems, error: allSavedItemsError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId);

      if (allSavedItemsError) {
        console.error('Error loading saved items:', allSavedItemsError);
        setError(allSavedItemsError.message || 'Failed to load saved items');
        toast.error('Failed to load saved items');
        setSavedProducts([]);
        setSavedSuppliers([]);
        isLoadingRef.current = false;
        setIsLoading(false); // ✅ Stop the spinner
        return;
      }

      // ✅ KEY FIX: If no rows, set empty and STOP LOADING immediately
      if (!allSavedItems || allSavedItems.length === 0) {
        setSavedProducts([]);
        setSavedSuppliers([]);
        isLoadingRef.current = false;
        setIsLoading(false); // ✅ Stop the spinner
        return;
      }

      // ✅ FORENSIC RECOVERY: Use userId from kernel instead of user.id
      // Load saved products - Manual join (more reliable)
      const savedItems = allSavedItems.filter(item => item.item_type === 'product');

      if (savedItems && savedItems.length > 0) {
        const productIds = savedItems.map(item => item.item_id).filter(Boolean);
        
        if (productIds.length === 0) {
          setSavedProducts([]);
          // Continue to load suppliers - don't return early
        } else {
          // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
          // Simplified query - PostgREST friendly (no complex joins)
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name, description, price_min, price_max, currency, status, company_id, category_id, country_of_origin, product_images(*)')
            .in('id', productIds);
          
          // Load companies separately if needed
          let companiesMap = new Map();
          if (productsData && productsData.length > 0) {
            const companyIds = [...new Set(productsData.map(p => p.company_id).filter(Boolean))];
            if (companyIds.length > 0) {
              try {
                const { data: companies } = await supabase
                  .from('companies')
                  .select('id, company_name, country, verification_status, verified')
                  .in('id', companyIds);
                
                if (companies) {
                  companies.forEach(c => companiesMap.set(c.id, c));
                }
              } catch (err) {
                console.warn('Error loading companies for saved products:', err);
                // Continue without company data
              }
            }
          }
          
          if (productsError) {
            console.error('Error loading products:', productsError);
            toast.error('Failed to load product details');
            setSavedProducts([]);
          } else {
            // Map products with saved_item_id, preserving order, and add primary image
            const productMap = new Map((productsData || []).map(p => [p.id, p]));
            const products = savedItems
              .map(item => {
                const product = productMap.get(item.item_id);
                if (!product) {
                  console.warn('Product not found for saved item:', item.item_id);
                  return null;
                }
                
                // Get primary image from product_images
                const primaryImage = getPrimaryImageFromProduct(product);
                
                // Merge company data
                const company = companiesMap.get(product.company_id);
                
                return { 
                  ...product, 
                  saved_item_id: item.id,
                  primaryImage: primaryImage || null,
                  companies: company || null
                };
              })
              .filter(Boolean);
            
            setSavedProducts(products);
          }
        }
      } else {
        setSavedProducts([]);
      }

      // ✅ FORENSIC RECOVERY: Use userId from kernel instead of user.id
      // Load saved suppliers (companies) - Manual join (more reliable)
      const savedSupplierItems = allSavedItems.filter(item => item.item_type === 'supplier');

      if (savedSupplierItems && savedSupplierItems.length > 0) {
        const companyIds = savedSupplierItems.map(item => item.item_id).filter(Boolean);
        
        if (companyIds.length === 0) {
          setSavedSuppliers([]);
          // Continue - don't return early, let finally block handle loading state
        } else {
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .in('id', companyIds);
          
          if (companiesError) {
            console.error('Error loading companies:', companiesError);
            toast.error('Failed to load supplier details');
            setSavedSuppliers([]);
          } else {
            // Map companies with saved_item_id, preserving order
            const companyMap = new Map((companiesData || []).map(c => [c.id, c]));
            const suppliers = savedSupplierItems
              .map(item => {
                const company = companyMap.get(item.item_id);
                return company ? { ...company, saved_item_id: item.id } : null;
              })
              .filter(Boolean);
            setSavedSuppliers(suppliers);
          }
        }
      } else {
        setSavedSuppliers([]);
      }
    } catch (error) {
      console.error('[DashboardSaved] Error loading saved items:', error);
      setError(error?.message || 'Failed to load saved items');
      toast.error('Failed to load saved items');
      setSavedProducts([]);
      setSavedSuppliers([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false); // ✅ ALWAYS stop the spinner here
    }
  }, [canLoadData, userId]); // ✅ Only recreate if userId or canLoadData changes

  // ✅ CRITICAL FIX: Store function in ref to prevent dependency loop
  useEffect(() => {
    loadSavedItemsRef.current = loadSavedItems;
  }, [loadSavedItems]);

  // ✅ FORENSIC RECOVERY: Clean data fetching guard - REMOVED loadSavedItems from deps to prevent loop
  // ✅ FINAL SYNC: Check data freshness before loading
  useEffect(() => {
    if (!isSystemReady || !canLoadData || !userId) {
      if (!userId) {
        console.log('[DashboardSaved] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ FINAL SYNC: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh && loadSavedItemsRef.current && !isLoadingRef.current) {
      console.log('[DashboardSaved] Data is stale or first load - refreshing');
      loadSavedItemsRef.current();
      isInitialMount.current = false;
    } else if (!shouldRefresh) {
      console.log('[DashboardSaved] Data is fresh - skipping reload');
    }
  }, [isSystemReady, canLoadData, userId, location.pathname, isStale, navigate]); // ✅ FINAL SYNC: Include isStale and location.pathname

  // ✅ CRITICAL FIX: Memoize filteredProducts to prevent unnecessary recomputations
  const filteredProducts = useMemo(() => {
    return savedProducts.filter((p) => {
      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) || // Fallback for legacy data
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [savedProducts, search]);

  // Debug: Log only when products count changes (prevents render loop spam)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('📊 Saved products count:', savedProducts.length);
      console.log('🔍 Filtered products count:', filteredProducts.length);
    }
  }, [savedProducts.length, filteredProducts.length]);

  // ✅ CRITICAL FIX: Memoize filteredSuppliers to prevent unnecessary recomputations
  const filteredSuppliers = useMemo(() => {
    return savedSuppliers.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.company_name?.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q)
      );
    });
  }, [savedSuppliers, search]);

  // ✅ FORENSIC RECOVERY: Compute normalized products with useMemo (no state -> effect -> state cycle)
  const normalizedProducts = useMemo(() => {
    return filteredProducts.map((p) => {
      // ✅ KERNEL-SCHEMA ALIGNMENT: Prioritize 'name' over 'title' (DB schema uses 'name')
      const title = p.name || p.title || p.product_name || 'Untitled product';
      
      // Normalize image path/URL (try all possible field names)
      const imagePathOrUrl =
        p.primaryImage ||
        p.image ||
        p.imageUrl ||
        p.image_url ||
        (p.product_images && Array.isArray(p.product_images) && p.product_images.find(i => i.is_primary)?.url) ||
        (p.product_images && Array.isArray(p.product_images) && p.product_images[0]?.url) ||
        (Array.isArray(p.images) && p.images[0]) ||
        null;
      
      // Normalize price
      const price = p.price ?? p.unit_price ?? p.price_min ?? null;
      const priceMax = p.price_max ?? null;
      const currency = p.currency || 'USD';
      
      // Normalize company name
      const companyName = 
        p.companies?.company_name || 
        p.companies?.name || 
        p.company?.company_name || 
        p.company_name || 
        'Supplier';
      
      return {
        ...p,
        title,
        imagePathOrUrl,
        price,
        priceMax,
        currency,
        companyName,
        company: p.companies || p.company || null
      };
    });
  }, [filteredProducts]);

  // ✅ FORENSIC RECOVERY: Resolve image URLs separately (async operation)
  const [imageUrlsResolved, setImageUrlsResolved] = useState(new Map());
  const imageUrlsResolvingRef = useRef(false);
  
  useEffect(() => {
    // ✅ CRITICAL FIX: Prevent concurrent resolution attempts
    if (imageUrlsResolvingRef.current) return;
    
    const resolveImageUrls = async () => {
      if (normalizedProducts.length === 0) {
        setImageUrlsResolved(prev => {
          // Only update if map is not empty
          if (prev.size === 0) return prev;
          return new Map();
        });
        return;
      }
      
      imageUrlsResolvingRef.current = true;
      
      try {
        const urlMap = new Map();
        for (const product of normalizedProducts) {
          if (product.imagePathOrUrl) {
            // If already a full HTTPS URL, use it directly
            if (product.imagePathOrUrl.startsWith('https://')) {
              urlMap.set(product.id, product.imagePathOrUrl);
            } else {
              // Try to get public URL first
              const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(product.imagePathOrUrl);
              
              if (publicUrlData?.publicUrl) {
                urlMap.set(product.id, publicUrlData.publicUrl);
              } else {
                // Fallback: try to create signed URL (for private buckets)
                try {
                  const { data: signedData } = await supabase.storage
                    .from('product-images')
                    .createSignedUrl(product.imagePathOrUrl, 3600);
                  
                  if (signedData?.signedUrl) {
                    urlMap.set(product.id, signedData.signedUrl);
                  }
                } catch (err) {
                  console.warn('Could not create signed URL for product image:', product.id, err);
                  // Will fallback to placeholder
                }
              }
            }
          }
        }
        
        // ✅ CRITICAL FIX: Only update if URLs actually changed
        setImageUrlsResolved(prev => {
          // Compare map sizes and keys to avoid unnecessary updates
          if (prev.size === urlMap.size) {
            let hasChanges = false;
            for (const [id, url] of urlMap.entries()) {
              if (prev.get(id) !== url) {
                hasChanges = true;
                break;
              }
            }
            if (!hasChanges) return prev;
          }
          return urlMap;
        });
      } finally {
        imageUrlsResolvingRef.current = false;
      }
    };
    
    resolveImageUrls();
  }, [normalizedProducts]); // Only depends on normalizedProducts (computed with useMemo)

  const handleUnsave = async (itemId, itemType) => {
    try {
      // ✅ FORENSIC RECOVERY: Use userId from kernel
      if (!userId) return;

      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) throw error;
      toast.success('Item removed from saved');
      // ✅ Use ref to call function (prevents dependency issues)
      if (loadSavedItemsRef.current) {
        loadSavedItemsRef.current();
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading saved items..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        <p className="mt-4 text-sm text-afrikoni-text-dark/70">Loading saved items...</p>
      </div>
    );
  }
  
  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          if (loadSavedItemsRef.current) {
            loadSavedItemsRef.current();
          }
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">Saved Items</h1>
          {activeTab === 'products' && (
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
              {normalizedProducts.length > 0 
                ? `You saved ${normalizedProducts.length} product${normalizedProducts.length !== 1 ? 's' : ''}`
                : 'No saved products yet'}
            </p>
          )}
          {activeTab === 'suppliers' && (
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
              {savedSuppliers.length > 0 
                ? `You saved ${savedSuppliers.length} supplier${savedSuppliers.length !== 1 ? 's' : ''}`
                : 'No saved suppliers yet'}
            </p>
          )}
          </div>
          {/* ✅ FINAL SYNC: Refresh button for manual cache clearing */}
          <Button
            variant="outline"
            onClick={() => {
              refresh();
              if (loadSavedItemsRef.current) {
                loadSavedItemsRef.current();
              }
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Total saved
              </p>
              <p className="text-2xl font-bold text-afrikoni-text-dark mt-1">
                {savedProducts.length + savedSuppliers.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Products
              </p>
              <p className="text-2xl font-bold text-afrikoni-text-dark mt-1">
                {savedProducts.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Suppliers
              </p>
              <p className="text-2xl font-bold text-afrikoni-text-dark mt-1">
                {savedSuppliers.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-text-dark/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved items…"
              className="w-full pl-9 pr-3 py-2 rounded-full border border-afrikoni-gold/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/60"
            />
          </div>

          {/* Plain Tab Buttons (replaces Radix Tabs) */}
          <div className="flex gap-2 bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                activeTab === 'products'
                  ? 'bg-afrikoni-gold text-afrikoni-charcoal shadow-afrikoni'
                  : 'text-afrikoni-text-dark/70 hover:text-afrikoni-gold'
              }`}
            >
              Saved Products
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                activeTab === 'suppliers'
                  ? 'bg-afrikoni-gold text-afrikoni-charcoal shadow-afrikoni'
                  : 'text-afrikoni-text-dark/70 hover:text-afrikoni-gold'
              }`}
            >
              Saved Suppliers
            </button>
          </div>
        </div>

        {/* Debug line removed for production */}

        {/* Products Tab Content - Plain Conditional (no TabsContent) */}
        {activeTab === 'products' && (
          <div className="mt-4 space-y-4">
            {normalizedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Package className="w-16 h-16 text-afrikoni-text-dark/30 mb-4" />
                <h3 className="text-xl font-semibold text-afrikoni-text-dark mb-2">
                  {savedProducts.length === 0 ? "No saved products yet" : "No products match your search"}
                </h3>
                <p className="text-afrikoni-text-dark/70 text-center mb-6 max-w-md">
                  {savedProducts.length === 0 
                    ? "Save products you're interested in to access them quickly later."
                    : `Try a different search term. You have ${savedProducts.length} saved product${savedProducts.length !== 1 ? 's' : ''}.`}
                </p>
                <Link to="/products">
                  <Button 
                    variant="default"
                    className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white"
                  >
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {normalizedProducts.map((p) => {
                  const imageUrlResolved = imageUrlsResolved.get(p.id);
                  
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="rounded-xl border-2 border-afrikoni-gold/20 bg-white p-4 shadow-sm hover:border-afrikoni-gold/60 hover:shadow-xl transition-all duration-300 group">
                        <Link to={`/product?id=${p.id}`} className="block">
                          {/* Image Section - Always renders */}
                          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-afrikoni-ivory mb-3 relative">
                            {imageUrlResolved ? (
                              <img 
                                src={imageUrlResolved} 
                                alt={p.name || p.title} 
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  // Fallback to placeholder on error
                                  e.target.src = '/placeholder.png';
                                  e.target.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm opacity-60">
                                <Package className="w-12 h-12 text-afrikoni-text-dark/40" />
                      </div>
                            )}
                            
                            {/* Un-save button overlay */}
                            <div className="absolute top-2 right-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm h-9 w-9 p-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUnsave(p.id, 'product');
                                }}
                                title="Remove from saved"
                              >
                                <X className="w-5 h-5 text-afrikoni-gold" />
                              </Button>
                            </div>
                            
                            {/* Badges */}
                            {p.featured && (
                              <div className="absolute top-2 left-2">
                                <Badge variant="primary" className="text-xs">⭐ Featured</Badge>
                              </div>
                            )}
                            {p.status === 'active' && (
                              <div className="absolute top-2 left-2" style={{ top: p.featured ? '2.5rem' : '0.5rem' }}>
                                <Badge variant="success" className="text-xs">✓ Active</Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="mt-3">
                            <h3 className="font-semibold text-afrikoni-text-dark mb-1 line-clamp-2 group-hover:text-afrikoni-gold transition-colors">
                              {p.name || p.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/70 mb-2">
                              <Users className="w-3 h-3" />
                              <span>{p.companyName}</span>
                              {p.company?.verified && (
                                <Badge variant="success" className="text-xs ml-1">✓ Verified</Badge>
                              )}
                            </div>
                            {p.price != null && (
                              <div className="text-base font-bold text-afrikoni-gold mb-2">
                                {p.priceMax 
                                  ? `${p.currency} ${p.price} - ${p.priceMax}`
                                  : `${p.currency} ${p.price}`}
                              </div>
                            )}
                            {p.country_of_origin && (
                              <div className="flex items-center gap-1 text-xs text-afrikoni-text-dark/60 mb-3">
                                <span>📍</span>
                                <span>{p.country_of_origin}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Link to={`/product?id=${p.id}`} className="flex-1">
                            <Button 
                              variant="outline" 
                              className="w-full text-sm"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            variant="default"
                            className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white text-sm"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/dashboard/rfqs/new?product=${p.id}`);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Create RFQ
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Suppliers Tab Content - Plain Conditional (no TabsContent) */}
        {activeTab === 'suppliers' && (
          <div className="mt-4 space-y-4">
            {filteredSuppliers.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState 
                    type="default"
                    title="No saved suppliers yet"
                    description="Save suppliers you're interested in working with to access them quickly later."
                    cta="Browse Suppliers"
                    ctaLink="/suppliers"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.id} className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-afrikoni-sand rounded-afrikoni flex items-center justify-center">
                          <Users className="w-8 h-8 text-afrikoni-text-dark/50" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-afrikoni-text-dark">{supplier.company_name}</h3>
                          <p className="text-sm text-afrikoni-text-dark/70">{supplier.country}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnsave(supplier.id, 'supplier')}
                        >
                          <Bookmark className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                        </Button>
                      </div>
                      <Link to={`/business/${supplier.id}`}>
                        <Button variant="outline" className="w-full" size="sm">View Business Profile</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardSaved() {
  return (
    <>
      {/* PHASE 5B: Saved page requires buy capability */}
      <RequireCapability canBuy={true}>
        <DashboardSavedInner />
      </RequireCapability>
    </>
  );
}

