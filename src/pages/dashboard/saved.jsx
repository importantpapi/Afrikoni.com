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

      // Load saved products
      const { data: savedProductsData } = await supabase
        .from('saved_items')
        .select(`
          *,
          products:item_id(*, product_images(*))
        `)
        .eq('user_id', userData.id)
        .eq('item_type', 'product');

      const products = (savedProductsData || [])
        .filter(item => item.products)
        .map(item => ({
          ...item.products,
          saved_item_id: item.id
        }));
      setSavedProducts(products);

      // Load saved suppliers (companies)
      const { data: savedSuppliersData } = await supabase
        .from('saved_items')
        .select(`
          *,
          companies:item_id(*)
        `)
        .eq('user_id', userData.id)
        .eq('item_type', 'supplier');

      const suppliers = (savedSuppliersData || [])
        .filter(item => item.companies)
        .map(item => ({
          ...item.companies,
          saved_item_id: item.id
        }));
      setSavedSuppliers(suppliers);
    } catch (error) {
      toast.error('Failed to load saved items');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* v2.5: Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium">
            <TabsTrigger value="products" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">Saved Products</TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">Saved Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {savedProducts.length === 0 ? (
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
                {savedProducts.map((product) => (
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
            {savedSuppliers.length === 0 ? (
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
                {savedSuppliers.map((supplier) => (
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

