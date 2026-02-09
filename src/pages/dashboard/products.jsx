import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { PRODUCT_STATUS, getStatusLabel } from '@/constants/status';
import { buildProductQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Package, Plus, Search, Edit, Trash2, Eye, Pause, Play, Star, TrendingUp, Users, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import ProductStatsBar from '@/components/products/ProductStatsBar';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import OptimizedImage from '@/components/OptimizedImage';
import SubscriptionUpsell from '@/components/upsell/SubscriptionUpsell';
import VerificationUpsell from '@/components/upsell/VerificationUpsell';
import { getCompanySubscription } from '@/services/subscriptionService';
import RequireCapability from '@/guards/RequireCapability';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

function DashboardProductsInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, isAdmin, capabilities, isSystemReady } = useDashboardKernel();
  
  // Derive role from capabilities for display purposes
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const currentRole = isSeller ? 'seller' : 'buyer';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh, refresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading products..." ready={isSystemReady} />
      </div>
    );
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[DashboardProducts] Data is stale or first load - refreshing');
      loadUserAndProducts();
    } else {
      console.log('[DashboardProducts] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadUserAndProducts = async () => {
    if (!profileCompanyId) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
      }
      setCategories(categoriesData || []);

      // Build product query with explicit product_images select
      // NOTE: product_images is the single source of truth. products.images is deprecated.
      // We need to pass the select string to paginateQuery to preserve product_images relationship
      const selectString = `
        *,
        categories(*),
        product_images(
          id,
          url,
          alt_text,
          is_primary,
          sort_order
        )
      `;
      
      let productsQuery = supabase
        .from('products')
        .select(selectString);
      
      // ✅ UNIFIED DASHBOARD KERNEL: Use profileCompanyId for all queries
      // Apply filters
      if (profileCompanyId) {
        productsQuery = productsQuery.eq('company_id', profileCompanyId);
      }
      if (statusFilter !== 'all') {
        productsQuery = productsQuery.eq('status', statusFilter);
      }
      if (categoryFilter) {
        productsQuery = productsQuery.eq('category_id', categoryFilter);
      }
      if (countryFilter) {
        productsQuery = productsQuery.eq('country_of_origin', countryFilter);
      }
      
      // Use pagination with selectOverride to preserve product_images relationship
      const result = await paginateQuery(productsQuery, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        selectOverride: selectString
      });
      
      // ✅ FINAL HARDENING: Enhanced error logging for RLS detection
      if (result.error) {
        console.error('❌ Error loading products:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint,
          // RLS-specific detection
          isRLSError: result.error.code === 'PGRST116' || result.error.message?.includes('permission denied'),
          fullError: result.error
        });
        
        // Additional RLS-specific logging
        if (result.error.code === 'PGRST116' || result.error.message?.includes('permission denied')) {
          console.error('🔒 RLS BLOCK DETECTED:', {
            table: 'products',
            companyId: profileCompanyId,
            userId: userId,
            error: result.error
          });
        }
        // ✅ SUCCESS-ONLY FRESHNESS: Do NOT mark fresh if there's an error
        return; // Exit early - don't process data or mark fresh
      }

      // Transform products to include primary image from product_images table
      // ✅ SUCCESS-ONLY FRESHNESS: Only process data if result.error is null
      const productsWithImages = Array.isArray(result.data) ? result.data.map(product => {
        if (!product) return null;
        
        // Debug: Log product_images data (development only)
        // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
        if (process.env.NODE_ENV === 'development') {
          if (product.product_images) {
            console.log(`📸 Dashboard: Product ${product.id} (${product.name || product.title}) has ${Array.isArray(product.product_images) ? product.product_images.length : 1} image(s):`, product.product_images);
          } else {
            console.warn(`⚠️ Dashboard: Product ${product.id} (${product.name || product.title}) has NO product_images`);
          }
        }
        
        const primaryImage = getPrimaryImageFromProduct(product);
        
        if (process.env.NODE_ENV === 'development' && !primaryImage && product.id) {
          console.warn(`⚠️ Dashboard: No primary image found for product ${product.id} (${product.name || product.title})`);
        }
        
        return {
          ...product,
          primaryImage: primaryImage || null
        };
      }).filter(Boolean) : [];

      // ✅ UNIFIED DASHBOARD KERNEL: Use profileCompanyId for all security assertions
      // SAFETY ASSERTION: ensure every product belongs to the current company
      if (profileCompanyId) {
        for (const product of productsWithImages) {
          await assertRowOwnedByCompany(product, profileCompanyId, 'DashboardProducts:products');
        }
      }

      setProducts(productsWithImages);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
      
      // ✅ REACTIVE READINESS FIX: Mark data as fresh ONLY after successful 200 OK response
      // Only mark fresh if we got actual data (not an error)
      if (productsWithImages && Array.isArray(productsWithImages)) {
        lastLoadTimeRef.current = Date.now();
        markFresh();
      }
    } catch (error) {
      // ✅ KERNEL MIGRATION: Enhanced error logging and state
      console.error('❌ Exception loading products:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        fullError: error
      });
      setError(error?.message || 'Failed to load products');
      // Fail gracefully - treat as no data instead of error
      setProducts([]);
      setCategories([]);
      setPagination(prev => ({
        ...prev,
        totalCount: 0,
        totalPages: 1,
        isLoading: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      // ✅ UNIFIED DASHBOARD KERNEL: Ensure product belongs to company before delete
      if (!profileCompanyId) {
        toast.error('Company ID not available');
        return;
      }
      
      // Delete product (cascade will delete images and variants)
      // RLS will ensure only company owner can delete
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('company_id', profileCompanyId); // ✅ Security: Ensure company ownership

      if (error) throw error;
      toast.success('Product deleted successfully');
      loadUserAndProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      // ✅ UNIFIED DASHBOARD KERNEL: Ensure product belongs to company before update
      if (!profileCompanyId) {
        toast.error('Company ID not available');
        return;
      }
      
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId)
        .eq('company_id', profileCompanyId); // ✅ Security: Ensure company ownership

      if (error) throw error;
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadUserAndProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) || // Fallback for legacy data
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
    const matchesCountry = !countryFilter || product.country_of_origin === countryFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesCountry;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
    inquiries: products.reduce((sum, p) => sum + (p.inquiries || 0), 0)
  };

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={6} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
          if (shouldRefresh) {
            loadUserAndProducts();
          }
        }}
      />
    );
  }

  return (
    <>
      <ErrorBoundary fallbackMessage="Failed to load products. Please try again.">
      <div className="space-y-5">
        {/* ═══ PAGE HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F5F0E8] leading-tight">Products & Listings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your product listings</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/products/quick-add">
              <Button className="bg-[#D4A937] hover:bg-[#C09830] text-white dark:text-[#0A0A0A] font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </Link>
            <Link to="/dashboard/products/new">
              <Button variant="outline" className="border-gray-200 dark:border-[#2A2A2A] text-gray-700 dark:text-gray-300 hover:border-[#D4A937]/30">
                <Plus className="w-4 h-4 mr-2" />
                Detailed Form
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <ProductStatsBar stats={stats} />

        {/* ═══ FILTERS ═══ */}
        <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2A2A2A] focus:border-[#D4A937]/50 text-gray-900 dark:text-[#F5F0E8]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2A2A2A]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2A2A2A]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1.5 flex-wrap">
                {['all', 'active', 'draft', 'paused'].map(status => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status
                      ? 'bg-[#D4A937] text-white dark:text-[#0A0A0A] border-[#D4A937] hover:bg-[#C09830]'
                      : 'border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-[#D4A937]/30'
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upsell Banners */}
        {filteredProducts.length > 0 && (
          <div className="space-y-3">
            {!isVerified && <VerificationUpsell isVerified={isVerified} variant="banner" />}
            {(currentPlan === 'free' || currentPlan === 'growth') && (
              <SubscriptionUpsell currentPlan={currentPlan} variant="banner" placement="products" />
            )}
          </div>
        )}

        {/* ═══ PRODUCTS GRID ═══ */}
        {filteredProducts.length === 0 ? (
          <div className="space-y-5">
            <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
              <CardContent className="p-0">
                <EmptyState
                  type="products"
                  title={searchQuery || statusFilter !== 'all' || categoryFilter ? 'No products match your filters' : 'No products yet'}
                  description={searchQuery || statusFilter !== 'all' || categoryFilter ? 'Try adjusting your search or filters' : 'Start by adding your first product listing with AI assistance'}
                  cta="Quick Add Product"
                  ctaLink="/dashboard/products/quick-add"
                />
              </CardContent>
            </Card>
            {!searchQuery && statusFilter === 'all' && !categoryFilter && (
              <>
                {!isVerified && <VerificationUpsell isVerified={isVerified} variant="card" />}
                {(currentPlan === 'free' || currentPlan === 'growth') && (
                  <SubscriptionUpsell currentPlan={currentPlan} variant="card" placement="products" />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const priceDisplay = product.price_min && product.price_max
                ? `${product.currency || 'USD'} ${product.price_min} – ${product.price_max}`
                : product.price
                ? `${product.currency || 'USD'} ${product.price}`
                : 'Price on request';

              const moqDisplay = product.min_order_quantity
                ? `MOQ ${product.min_order_quantity} ${product.moq_unit || product.unit || 'units'}`
                : product.moq
                ? `MOQ ${product.moq} ${product.unit || 'units'}`
                : 'MOQ: Contact supplier';

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-gray-200 dark:border-[#1E1E1E] hover:border-[#D4A937]/20 hover:shadow-lg hover:shadow-[#D4A937]/5 transition-all h-full flex flex-col bg-white dark:bg-[#141414] rounded-xl">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="aspect-video bg-gray-100 dark:bg-[#1A1A1A] rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                        {product.primaryImage ? (
                          <OptimizedImage
                            src={product.primaryImage}
                            alt={product.name || product.title || 'Product'}
                            className="w-full h-full object-cover"
                            width={400}
                            height={300}
                            quality={85}
                            placeholder="/placeholder.png"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        )}
                        {product.featured && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-[#D4A937] text-white dark:text-[#0A0A0A] text-[10px] font-semibold">Featured</Badge>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge
                            className={`text-[10px] font-semibold capitalize ${
                              product.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                                : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#2A2A2A]'
                            }`}
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-[#F5F0E8] line-clamp-2 flex-1 text-sm">{product.name || product.title}</h3>
                      </div>

                      {product.categories && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">{product.categories.name}</p>
                      )}

                      {/* Recommendations */}
                      {product.product_images && product.product_images.length < 3 && (
                        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                              Add {3 - product.product_images.length} more photos to increase views
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[12px]">Price:</span>
                          <span className="font-semibold font-mono text-[#D4A937] text-[13px]">{priceDisplay}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[12px]">MOQ:</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-[13px]">{moqDisplay}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                        <Eye className="w-3 h-3" />
                        <span>{product.views || 0} views</span>
                        <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                        <span>{product.inquiries || 0} inquiries</span>
                        {product.updated_at && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                            <span>{new Date(product.updated_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link to={`/product/${product.slug || product.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-[#D4A937]/30 hover:text-[#D4A937]">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/dashboard/products/${product.id}/edit`} className="flex-1" onClick={(e) => {
                          e.preventDefault();
                          navigate(`/dashboard/products/${product.id}/edit`);
                        }}>
                          <Button variant="outline" size="sm" className="w-full border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-[#D4A937]/30 hover:text-[#D4A937]">
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          title={product.status === 'active' ? 'Pause' : 'Activate'}
                          className="border-gray-200 dark:border-[#2A2A2A] text-gray-500 dark:text-gray-400 hover:border-[#D4A937]/30"
                        >
                          {product.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="border-gray-200 dark:border-[#2A2A2A] text-red-500 hover:text-red-600 hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
        </ErrorBoundary>
    </>
  );
}

export default function DashboardProducts() {
  // PHASE 5B: Products page requires sell capability (approved)
  return (
    <RequireCapability canSell={true} requireApproved={true}>
      <DashboardProductsInner />
    </RequireCapability>
  );
}

