import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole } from '@/utils/roleHelpers';
import { PRODUCT_STATUS, getStatusLabel } from '@/constants/status';
import { buildProductQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { CardSkeleton } from '@/components/ui/skeletons';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, Edit, Trash2, Eye, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import ProductStatsBar from '@/components/products/ProductStatsBar';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

export default function DashboardProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('seller');
  const [companyId, setCompanyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndProducts();
  }, [statusFilter]);

  const loadUserAndProducts = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentRole(getUserRole(profile || user));
      setCompanyId(userCompanyId);

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // Build product query
      let productsQuery = buildProductQuery({
        companyId: userCompanyId,
        status: statusFilter === 'all' ? null : statusFilter,
        categoryId: categoryFilter || null,
        country: countryFilter || null
      });
      
      // Use pagination
      const result = await paginateQuery(productsQuery, {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      // Transform products to include primary image
      const productsWithImages = (result.data || []).map(product => {
        const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
        return {
          ...product,
          primaryImage: primaryImage?.url || product.images?.[0] || null
        };
      });

      setProducts(productsWithImages);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
    } catch (error) {
      toast.error('Failed to load products');
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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Products & Listings</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">Manage your product listings</p>
          </div>
          <Link to="/dashboard/products/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </motion.div>

        {/* Stats Bar */}
        <ProductStatsBar stats={stats} />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
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

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
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
                  <Card className="hover:shadow-afrikoni-lg transition-shadow h-full flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="aspect-video bg-afrikoni-cream rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                        {product.primaryImage ? (
                          <img 
                            src={product.primaryImage} 
                            alt={product.title} 
                            className="w-full h-full object-cover"
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
                      
                      <h3 className="font-semibold text-afrikoni-chestnut mb-2 line-clamp-2">{product.title}</h3>
                      
                      {product.categories && (
                        <p className="text-xs text-afrikoni-deep/70 mb-2">{product.categories.name}</p>
                      )}
                      
                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-afrikoni-deep/70">Price:</span>
                          <span className="font-semibold text-afrikoni-gold">{priceDisplay}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-afrikoni-deep/70">MOQ:</span>
                          <span className="text-afrikoni-chestnut">{moqDisplay}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-afrikoni-deep/70 mb-4">
                        <Eye className="w-3 h-3" />
                        <span>{product.views || 0} views</span>
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
                        <Link to={`/dashboard/products/${product.id}/edit`} className="flex-1">
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

