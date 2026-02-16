import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GitCompare, X, Trash2, Package, MapPin, Star, DollarSign, 
  Clock, Building, ShoppingCart, MessageCircle, FileText,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { getPrimaryImageFromProduct } from '@/utils/productImages';

export default function CompareProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadComparisonProducts();
  }, []);

  const loadComparisonProducts = async () => {
    try {
      setLoading(true);
      const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
      
      if (compareList.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // Fetch product details from Supabase - Simplified query
      const productIds = compareList.map(p => p.id);
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, description, price_min, price_max, currency, status, company_id, category_id, country_of_origin, moq, min_order_quantity, moq_unit, lead_time_min_days, lead_time_max_days, delivery_time, supply_ability_qty, supply_ability_unit, certifications, unit, product_images(*)')
        .in('id', productIds)
        .eq('status', 'active');
      
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
            console.warn('Error loading companies for comparison:', err);
            // Continue without company data
          }
        }
      }

      if (error) throw error;

      // Merge with comparison list to preserve order and add company data
      const orderedProducts = compareList
        .map(item => {
          const product = productsData?.find(p => p.id === item.id);
          if (!product) return null;
          return {
            ...product,
            companies: companiesMap.get(product.company_id) || null
          };
        })
        .filter(Boolean);

      setProducts(orderedProducts);
    } catch (error) {
      toast.error('Failed to load comparison products');
      console.error('Comparison load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (productId) => {
    const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    const updatedList = compareList.filter(p => p.id !== productId);
    localStorage.setItem('compareProducts', JSON.stringify(updatedList));
    // Dispatch custom event to update navbar count
    window.dispatchEvent(new Event('compareUpdated'));
    setProducts(products.filter(p => p.id !== productId));
    toast.success('Product removed from comparison');
    
    if (updatedList.length === 0) {
      // Redirect to marketplace if no products left
      setTimeout(() => navigate('/marketplace'), 1000);
    }
  };

  const clearAll = () => {
    localStorage.removeItem('compareProducts');
    // Dispatch custom event to update navbar count
    window.dispatchEvent(new Event('compareUpdated'));
    setProducts([]);
    toast.success('Comparison cleared');
    navigate('/marketplace');
  };

  const getProductImage = (product) => {
    return getPrimaryImageFromProduct(product);
  };

  const getPriceDisplay = (product) => {
    if (product.price_min && product.price_max) {
      return `${product.currency || 'USD'} ${product.price_min} - ${product.price_max}`;
    }
    if (product.price_min) {
      return `${product.currency || 'USD'} ${product.price_min}+`;
    }
    if (product.price) {
      return `${product.currency || 'USD'} ${product.price}`;
    }
    return 'Price on request';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <SEO 
          title="Compare Products - Afrikoni"
          description="Compare products side-by-side to make informed purchasing decisions"
        />
        <div className="min-h-screen bg-afrikoni-offwhite py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-24 h-24 bg-os-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <GitCompare className="w-12 h-12 text-os-accent" />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-4">
                No Products to Compare
              </h1>
              <p className="text-afrikoni-deep/70 mb-8">
                Add products to your comparison list to see them side-by-side.
              </p>
              <Link to="/marketplace">
                <Button className="bg-os-accent hover:bg-os-accentDark">
                  Browse Products
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  const comparisonFields = [
    { key: 'image', label: 'Product', type: 'image' },
    { key: 'title', label: 'Product Name', type: 'text' },
    { key: 'price', label: 'Price', type: 'price' },
    { key: 'moq', label: 'MOQ', type: 'text' },
    { key: 'leadTime', label: 'Lead Time', type: 'text' },
    { key: 'country', label: 'Country of Origin', type: 'text' },
    { key: 'supplyAbility', label: 'Supply Ability', type: 'text' },
    { key: 'supplier', label: 'Supplier', type: 'supplier' },
    { key: 'certifications', label: 'Certifications', type: 'badges' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  return (
    <>
      <SEO 
        title={`Compare ${products.length} Products - Afrikoni`}
        description={`Compare ${products.length} products side-by-side: ${products.map(p => p.name || p.title).join(', ')}`}
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-os-accent/20 rounded-full flex items-center justify-center">
                  <GitCompare className="w-6 h-6 text-os-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-afrikoni-chestnut">
                    Compare Products
                  </h1>
                  <p className="text-os-sm text-afrikoni-deep/70">
                    {products.length} product{products.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Link to="/marketplace">
                  <Button variant="outline">
                    Add More Products
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Comparison Table */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <Card className="border-os-accent/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] md:min-w-[800px]">
                    <thead>
                      <tr className="border-b border-os-accent/20 bg-afrikoni-offwhite">
                        <th className="text-left p-4 font-semibold text-afrikoni-chestnut sticky left-0 bg-afrikoni-offwhite z-10">
                          Feature
                        </th>
                        {products.map((product, idx) => (
                          <th
                            key={product.id}
                            className="text-center p-2 md:p-4 min-w-[180px] md:min-w-[250px] border-l border-os-accent/10"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => removeProduct(product.id)}
                                className="ml-auto p-1.5 md:p-1 hover:bg-red-50 active:bg-red-100 rounded text-red-600 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                                title="Remove from comparison"
                                aria-label="Remove product"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/product?id=${product.id}`}
                                className="block hover:opacity-80 transition-opacity w-full"
                              >
                                {getProductImage(product) ? (
                                  <img
                                    src={getProductImage(product)}
                                    alt={product.title}
                                    className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-lg mb-2 mx-auto"
                                  />
                                ) : (
                                  <div className="w-20 h-20 md:w-32 md:h-32 bg-afrikoni-cream rounded-lg flex items-center justify-center mb-2 mx-auto">
                                    <Package className="w-8 h-8 md:w-12 md:h-12 text-afrikoni-deep/50" />
                                  </div>
                                )}
                                <h3 className="font-semibold text-afrikoni-chestnut text-os-xs md:text-os-sm line-clamp-2 px-1">
                                  {product.name || product.title}
                                </h3>
                              </Link>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price */}
                      <tr className="border-b border-os-accent/10">
                        <td className="p-2 md:p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10 text-os-xs md:text-os-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-os-accent flex-shrink-0" />
                            <span className="whitespace-nowrap">Price</span>
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-2 md:p-4 text-center border-l border-os-accent/10">
                            <div className="text-os-base md:text-os-lg font-bold text-os-accent">
                              {getPriceDisplay(product)}
                            </div>
                            {product.unit && (
                              <div className="text-os-xs text-afrikoni-deep/70">
                                per {product.unit}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* MOQ */}
                      <tr className="border-b border-os-accent/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-os-accent" />
                            Minimum Order Quantity
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            <span className="font-semibold text-afrikoni-chestnut">
                              {product.min_order_quantity || product.moq || 'N/A'}
                            </span>
                            {(product.moq_unit || product.unit) && (
                              <span className="text-os-sm text-afrikoni-deep/70 ml-1">
                                {product.moq_unit || product.unit}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Lead Time */}
                      <tr className="border-b border-os-accent/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-os-accent" />
                            Lead Time
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            {product.lead_time_min_days && product.lead_time_max_days ? (
                              <span className="text-afrikoni-chestnut">
                                {product.lead_time_min_days} - {product.lead_time_max_days} days
                              </span>
                            ) : product.lead_time_min_days ? (
                              <span className="text-afrikoni-chestnut">
                                {product.lead_time_min_days} days
                              </span>
                            ) : product.delivery_time ? (
                              <span className="text-afrikoni-chestnut">{product.delivery_time}</span>
                            ) : (
                              <span className="text-afrikoni-deep/50">Contact supplier</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Country of Origin */}
                      <tr className="border-b border-os-accent/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-os-accent" />
                            Country of Origin
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            <span className="text-afrikoni-chestnut">
                              {product.country_of_origin || 'N/A'}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Supply Ability */}
                      <tr className="border-b border-os-accent/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-os-accent" />
                            Supply Ability
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            {product.supply_ability_qty ? (
                              <span className="text-afrikoni-chestnut">
                                {product.supply_ability_qty} {product.supply_ability_unit || 'units'}
                              </span>
                            ) : (
                              <span className="text-afrikoni-deep/50">N/A</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Supplier */}
                      <tr className="border-b border-os-accent/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-os-accent" />
                            Supplier
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            {product.companies ? (
                              <div className="space-y-1">
                                <Link
                                  to={`/business/${product.companies.id}`}
                                  className="font-semibold text-afrikoni-chestnut hover:text-os-accent transition-colors"
                                >
                                  {product.companies.company_name}
                                </Link>
                                {product.companies.verified && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-os-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-afrikoni-deep/50">N/A</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Certifications */}
                      <tr className="border-b border-os-accent/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          Certifications
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-os-accent/10">
                            {product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {product.certifications.slice(0, 3).map((cert, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-green-50 text-green-700 border-green-200 text-os-xs"
                                  >
                                    {cert}
                                  </Badge>
                                ))}
                                {product.certifications.length > 3 && (
                                  <Badge variant="outline" className="text-os-xs">
                                    +{product.certifications.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-afrikoni-deep/50">None</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Actions */}
                      <tr className="bg-afrikoni-offwhite/50">
                        <td className="p-2 md:p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10 text-os-xs md:text-os-sm">
                          Actions
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-2 md:p-4 text-center border-l border-os-accent/10">
                            <div className="flex flex-col gap-1.5 md:gap-2">
                              <Link to={`/product?id=${product.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-os-xs md:text-os-sm touch-manipulation min-h-[36px] md:min-h-0"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Link to={`/messages?recipient=${product.companies?.id || product.company_id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-os-xs md:text-os-sm touch-manipulation min-h-[36px] md:min-h-0"
                                >
                                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  <span className="hidden sm:inline">Contact Supplier</span>
                                  <span className="sm:hidden">Contact</span>
                                </Button>
                              </Link>
                              <Link to={`/dashboard/rfqs/new?product=${product.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-os-xs md:text-os-sm touch-manipulation min-h-[36px] md:min-h-0"
                                >
                                  <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  <span className="hidden sm:inline">Request Quote</span>
                                  <span className="sm:hidden">RFQ</span>
                                </Button>
                              </Link>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8"
          >
            <Card className="border-os-accent/20 bg-os-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">
                      Comparison Tips
                    </h3>
                    <ul className="text-os-sm text-afrikoni-deep/70 space-y-1 list-disc list-inside">
                      <li>Compare prices, MOQ, and lead times to find the best deal</li>
                      <li>Check supplier verification status and certifications</li>
                      <li>Contact suppliers directly for custom requirements</li>
                      <li>Request quotes for accurate pricing based on your order quantity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}

