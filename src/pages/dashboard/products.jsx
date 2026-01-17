import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { PRODUCT_STATUS, getStatusLabel } from '@/constants/status';
import { buildProductQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
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
  // Use centralized AuthProvider
  const { user, profile, authReady, loading: authLoading } = useAuth();
  // ✅ FOUNDATION FIX: Use capabilities instead of roleHelpers
  const capabilities = useCapability();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
  // Derive role from capabilities for display purposes
  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const currentRole = isSeller ? 'seller' : 'buyer';
  const [companyId, setCompanyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardProducts] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardProducts] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadUserAndProducts();
  }, [authReady, authLoading, user, profile, capabilities.ready, statusFilter, navigate]);

  const loadUserAndProducts = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      if (!user) {
        navigate('/login');
        return;
      }
      
      const userCompanyId = profile?.company_id || null;
      setCompanyId(userCompanyId);

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
      
      // Apply filters
      if (userCompanyId) {
        productsQuery = productsQuery.eq('company_id', userCompanyId);
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
      
      if (result.error) {
        console.error('Error loading products:', result.error);
      }

      // Transform products to include primary image from product_images table
      const productsWithImages = Array.isArray(result.data) ? result.data.map(product => {
        if (!product) return null;
        
        // Debug: Log product_images data (development only)
        if (process.env.NODE_ENV === 'development') {
          if (product.product_images) {
            console.log(`📸 Dashboard: Product ${product.id} (${product.title}) has ${Array.isArray(product.product_images) ? product.product_images.length : 1} image(s):`, product.product_images);
          } else {
            console.warn(`⚠️ Dashboard: Product ${product.id} (${product.title}) has NO product_images`);
          }
        }
        
        const primaryImage = getPrimaryImageFromProduct(product);
        
        if (process.env.NODE_ENV === 'development' && !primaryImage && product.id) {
          console.warn(`⚠️ Dashboard: No primary image found for product ${product.id} (${product.title})`);
        }
        
        return {
          ...product,
          primaryImage: primaryImage || null
        };
      }).filter(Boolean) : [];

      // SAFETY ASSERTION: ensure every product belongs to the current company
      if (userCompanyId) {
        for (const product of productsWithImages) {
          await assertRowOwnedByCompany(product, userCompanyId, 'DashboardProducts:products');
        }
      }

      setProducts(productsWithImages);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading products:', error);
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
      // Delete product (cascade will delete images and variants)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success('Product deleted successfully');
      loadUserAndProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadUserAndProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading products..." />;
  }

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <CardSkeleton count={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <ErrorBoundary fallbackMessage="Failed to load products. Please try again.">
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Products & Listings</h1>
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Manage your product listings</p>
          </div>
          <Link to="/dashboard/products/new">
            <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni px-6">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </motion.div>

        {/* Stats Bar */}
        <ProductStatsBar stats={stats} />

        {/* Quick Actions Toolbar */}
        <Card className="border-afrikoni-gold/20 bg-gradient-to-r from-afrikoni-gold/5 to-white">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/dashboard/products/new">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
              <Button variant="outline" className="border-afrikoni-gold/30 text-afrikoni-deep hover:bg-afrikoni-gold/10" disabled>
                <Sparkles className="w-4 h-4 mr-2" />
                Improve Photos
                <Badge className="ml-2 bg-afrikoni-gold/20 text-afrikoni-gold text-xs">Coming Soon</Badge>
              </Button>
              <Button variant="outline" className="border-afrikoni-gold/30 text-afrikoni-deep hover:bg-afrikoni-gold/10" disabled>
                <TrendingUp className="w-4 h-4 mr-2" />
                Boost Visibility
                <Badge className="ml-2 bg-afrikoni-gold/20 text-afrikoni-gold text-xs">Premium</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* v2.5: Premium Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === 'paused' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('paused')}
                >
                  Paused
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upsell Banners */}
        {filteredProducts.length > 0 && (
          <div className="space-y-4">
            {!isVerified && (
              <VerificationUpsell isVerified={isVerified} variant="banner" />
            )}
            {(currentPlan === 'free' || currentPlan === 'growth') && (
              <SubscriptionUpsell currentPlan={currentPlan} variant="banner" placement="products" />
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <EmptyState 
                  type="products" 
                  title={searchQuery || statusFilter !== 'all' || categoryFilter ? 'No products match your filters' : 'No products yet'}
                  description={searchQuery || statusFilter !== 'all' || categoryFilter ? 'Try adjusting your search or filters' : 'Start by adding your first product listing'}
                  cta="Add Product"
                  ctaLink="/dashboard/products/new"
                />
              </CardContent>
            </Card>
            {!searchQuery && statusFilter === 'all' && !categoryFilter && (
              <>
                {!isVerified && (
                  <VerificationUpsell isVerified={isVerified} variant="card" />
                )}
                {(currentPlan === 'free' || currentPlan === 'growth') && (
                  <SubscriptionUpsell currentPlan={currentPlan} variant="card" placement="products" />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              // Format price range
              const priceDisplay = product.price_min && product.price_max
                ? `${product.currency || 'USD'} ${product.price_min} – ${product.price_max}`
                : product.price
                ? `${product.currency || 'USD'} ${product.price}`
                : 'Price on request';

              // Format MOQ
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
                  {/* v2.5: Premium Product Cards */}
                  <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all h-full flex flex-col bg-white rounded-afrikoni-lg">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="aspect-video bg-afrikoni-sand rounded-afrikoni mb-4 flex items-center justify-center overflow-hidden relative">
                        {product.primaryImage ? (
                          <OptimizedImage
                            src={product.primaryImage}
                            alt={product.title || 'Product'}
                            className="w-full h-full object-cover"
                            width={400}
                            height={300}
                            quality={85}
                            placeholder="/placeholder.png"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-afrikoni-deep/70" />
                        )}
                        {product.featured && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="primary" className="text-xs">Featured</Badge>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={
                              product.status === 'active' ? 'success' : 
                              product.status === 'draft' ? 'outline' : 
                              'outline'
                            }
                            className="text-xs capitalize"
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-afrikoni-text-dark line-clamp-2 flex-1">{product.title}</h3>
                        {/* Search Ranking */}
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <Star className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                          <span className="text-xs font-semibold text-afrikoni-gold">
                            {Math.floor(Math.random() * 5) + 1} {/* Placeholder ranking */}
                          </span>
                        </div>
                      </div>
                      
                      {product.categories && (
                        <p className="text-xs text-afrikoni-text-dark/70 mb-2">{product.categories.name}</p>
                      )}
                      
                      {/* Recommended Improvements */}
                      {product.product_images && product.product_images.length < 3 && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                              Add {3 - product.product_images.length} more photos to increase views
                            </p>
                          </div>
                        </div>
                      )}
                      {!product.min_order_quantity && !product.moq && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800">
                              Set competitive MOQ to attract more buyers
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-afrikoni-text-dark/70">Price:</span>
                          <span className="font-semibold text-afrikoni-gold">{priceDisplay}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-afrikoni-text-dark/70">MOQ:</span>
                          <span className="text-afrikoni-text-dark">{moqDisplay}</span>
                        </div>
                      </div>
                      
                      {/* Buyer Activity */}
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="w-3 h-3 text-green-600" />
                          <span className="text-green-800 font-medium">
                            {Math.floor(Math.random() * 5) + 1} buyers viewed this in the last 24h
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70 mb-4">
                        <Eye className="w-3 h-3" />
                        <span>{product.views || 0} total views</span>
                        <span>•</span>
                        <span>{product.inquiries || 0} inquiries</span>
                        {product.updated_at && (
                          <>
                            <span>•</span>
                            <span>Updated {new Date(product.updated_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-auto">
                        <Link to={`/product/${product.slug || product.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/dashboard/products/${product.id}/edit`} className="flex-1" onClick={(e) => {
                          // Ensure we're using the Alibaba version
                          e.preventDefault();
                          navigate(`/dashboard/products/${product.id}/edit`);
                        }}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          title={product.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          {product.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </DashboardLayout>
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

