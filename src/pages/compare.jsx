import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GitCompare, X, Trash2, Package, MapPin, Star, DollarSign, 
  Clock, Building2, ShoppingCart, MessageCircle, FileText,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

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

      // Fetch product details from Supabase
      const productIds = compareList.map(p => p.id);
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(*),
          product_images(*),
          companies!company_id(*)
        `)
        .in('id', productIds)
        .eq('status', 'active');

      if (error) throw error;

      // Merge with comparison list to preserve order
      const orderedProducts = compareList
        .map(item => productsData?.find(p => p.id === item.id))
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
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
      return primaryImage.url;
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return null;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
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
              <div className="w-24 h-24 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <GitCompare className="w-12 h-12 text-afrikoni-gold" />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-4">
                No Products to Compare
              </h1>
              <p className="text-afrikoni-deep/70 mb-8">
                Add products to your comparison list to see them side-by-side.
              </p>
              <Link to="/marketplace">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark">
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
        description={`Compare ${products.length} products side-by-side: ${products.map(p => p.title).join(', ')}`}
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
                <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                  <GitCompare className="w-6 h-6 text-afrikoni-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-afrikoni-chestnut">
                    Compare Products
                  </h1>
                  <p className="text-sm text-afrikoni-deep/70">
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
            <Card className="border-afrikoni-gold/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] md:min-w-[800px]">
                    <thead>
                      <tr className="border-b border-afrikoni-gold/20 bg-afrikoni-offwhite">
                        <th className="text-left p-4 font-semibold text-afrikoni-chestnut sticky left-0 bg-afrikoni-offwhite z-10">
                          Feature
                        </th>
                        {products.map((product, idx) => (
                          <th
                            key={product.id}
                            className="text-center p-2 md:p-4 min-w-[180px] md:min-w-[250px] border-l border-afrikoni-gold/10"
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
                                <h3 className="font-semibold text-afrikoni-chestnut text-xs md:text-sm line-clamp-2 px-1">
                                  {product.title}
                                </h3>
                              </Link>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price */}
                      <tr className="border-b border-afrikoni-gold/10">
                        <td className="p-2 md:p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10 text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-afrikoni-gold flex-shrink-0" />
                            <span className="whitespace-nowrap">Price</span>
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-2 md:p-4 text-center border-l border-afrikoni-gold/10">
                            <div className="text-base md:text-lg font-bold text-afrikoni-gold">
                              {getPriceDisplay(product)}
                            </div>
                            {product.unit && (
                              <div className="text-xs text-afrikoni-deep/70">
                                per {product.unit}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* MOQ */}
                      <tr className="border-b border-afrikoni-gold/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-afrikoni-gold" />
                            Minimum Order Quantity
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
                            <span className="font-semibold text-afrikoni-chestnut">
                              {product.min_order_quantity || product.moq || 'N/A'}
                            </span>
                            {(product.moq_unit || product.unit) && (
                              <span className="text-sm text-afrikoni-deep/70 ml-1">
                                {product.moq_unit || product.unit}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Lead Time */}
                      <tr className="border-b border-afrikoni-gold/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-afrikoni-gold" />
                            Lead Time
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
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
                      <tr className="border-b border-afrikoni-gold/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-afrikoni-gold" />
                            Country of Origin
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
                            <span className="text-afrikoni-chestnut">
                              {product.country_of_origin || 'N/A'}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Supply Ability */}
                      <tr className="border-b border-afrikoni-gold/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-afrikoni-gold" />
                            Supply Ability
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
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
                      <tr className="border-b border-afrikoni-gold/10 bg-afrikoni-offwhite/50">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-afrikoni-gold" />
                            Supplier
                          </div>
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
                            {product.companies ? (
                              <div className="space-y-1">
                                <Link
                                  to={`/business/${product.companies.id}`}
                                  className="font-semibold text-afrikoni-chestnut hover:text-afrikoni-gold transition-colors"
                                >
                                  {product.companies.company_name}
                                </Link>
                                {product.companies.verified && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
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
                      <tr className="border-b border-afrikoni-gold/10">
                        <td className="p-4 font-medium text-afrikoni-deep sticky left-0 bg-white z-10">
                          Certifications
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-4 text-center border-l border-afrikoni-gold/10">
                            {product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {product.certifications.slice(0, 3).map((cert, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-green-50 text-green-700 border-green-200 text-xs"
                                  >
                                    {cert}
                                  </Badge>
                                ))}
                                {product.certifications.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
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
                        <td className="p-2 md:p-4 font-medium text-afrikoni-deep sticky left-0 bg-afrikoni-offwhite/50 z-10 text-xs md:text-sm">
                          Actions
                        </td>
                        {products.map((product) => (
                          <td key={product.id} className="p-2 md:p-4 text-center border-l border-afrikoni-gold/10">
                            <div className="flex flex-col gap-1.5 md:gap-2">
                              <Link to={`/product?id=${product.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs md:text-sm touch-manipulation min-h-[36px] md:min-h-0"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Link to={`/messages?recipient=${product.companies?.id || product.company_id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs md:text-sm touch-manipulation min-h-[36px] md:min-h-0"
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
                                  className="w-full text-xs md:text-sm touch-manipulation min-h-[36px] md:min-h-0"
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
            <Card className="border-afrikoni-gold/20 bg-afrikoni-gold/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">
                      Comparison Tips
                    </h3>
                    <ul className="text-sm text-afrikoni-deep/70 space-y-1 list-disc list-inside">
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

