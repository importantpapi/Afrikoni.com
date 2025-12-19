import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, Package, Users, Search, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function DashboardSavedInner() {
  const [savedProducts, setSavedProducts] = useState([]);
  const [savedSuppliers, setSavedSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData) {
        navigate('/login');
        return;
      }

      // Load saved products - Manual join (more reliable)
      const { data: savedItems, error: savedItemsError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userData.id)
        .eq('item_type', 'product');

      if (savedItemsError) {
        console.error('Error loading saved items:', savedItemsError);
        setSavedProducts([]);
      } else if (savedItems && savedItems.length > 0) {
        const productIds = savedItems.map(item => item.item_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, product_images(*)')
          .in('id', productIds);
        
        if (productsError) {
          console.error('Error loading products:', productsError);
          setSavedProducts([]);
        } else {
          const products = (productsData || []).map(product => ({
            ...product,
            saved_item_id: savedItems.find(item => item.item_id === product.id)?.id
          }));
          setSavedProducts(products);
        }
      } else {
        setSavedProducts([]);
      }

      // Load saved suppliers (companies) - Manual join (more reliable)
      const { data: savedSupplierItems, error: savedSupplierItemsError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userData.id)
        .eq('item_type', 'supplier');

      if (savedSupplierItemsError) {
        console.error('Error loading saved supplier items:', savedSupplierItemsError);
        setSavedSuppliers([]);
      } else if (savedSupplierItems && savedSupplierItems.length > 0) {
        const companyIds = savedSupplierItems.map(item => item.item_id);
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);
        
        if (companiesError) {
          console.error('Error loading companies:', companiesError);
          setSavedSuppliers([]);
        } else {
          const suppliers = (companiesData || []).map(company => ({
            ...company,
            saved_item_id: savedSupplierItems.find(item => item.item_id === company.id)?.id
          }));
          setSavedSuppliers(suppliers);
        }
      } else {
        setSavedSuppliers([]);
      }
    } catch (error) {
      toast.error('Failed to load saved items');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = savedProducts.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const filteredSuppliers = savedSuppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.company_name?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q)
    );
  });

  const handleUnsave = async (itemId, itemType) => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData) return;

      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', userData.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) throw error;
      toast.success('Item removed from saved');
      loadSavedItems();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole="buyer">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="buyer">
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Saved Items</h1>
          <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Your saved products and suppliers</p>
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

        {/* v2.5: Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium">
            <TabsTrigger value="products" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">Saved Products</TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">Saved Suppliers</TabsTrigger>
          </TabsList>
        </Tabs>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden" /> 

          <TabsContent value="products" className="space-y-4">
            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState 
                    type="products"
                    title="No saved products yet"
                    description="Save products you're interested in to access them quickly later."
                    cta="Browse Products"
                    ctaLink="/products"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                    <CardContent className="p-5 md:p-6">
                      <div className="aspect-video bg-afrikoni-sand rounded-afrikoni mb-4 flex items-center justify-center">
                        <Package className="w-12 h-12 text-afrikoni-text-dark/50" />
                      </div>
                      <h3 className="font-semibold text-afrikoni-text-dark mb-2">{product.title}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-afrikoni-gold">
                          {product.price_min && product.price_max 
                            ? `${product.currency || 'USD'} ${product.price_min} - ${product.price_max}`
                            : product.price 
                            ? `${product.currency || 'USD'} ${product.price}`
                            : 'Price on request'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnsave(product.id, 'product')}
                        >
                          <Heart className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                        </Button>
                      </div>
                      <Link to={`/product?id=${product.id}`}>
                        <Button variant="outline" className="w-full" size="sm">View Product</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardSaved() {
  return (
    <RequireDashboardRole allow={['buyer', 'hybrid']}>
      <DashboardSavedInner />
    </RequireDashboardRole>
  );
}

