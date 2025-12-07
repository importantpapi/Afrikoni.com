import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { addToViewHistory, getViewHistory } from '@/utils/viewHistory';
import { getSimilarProducts, getRecommendedProducts } from '@/utils/recommendations';
import { getProductRecommendations } from '@/lib/supabaseQueries/ai';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import { trackProductView } from '@/lib/supabaseQueries/products';
import AISummaryBox from '@/components/ai/AISummaryBox';
import AICopilotButton from '@/components/ai/AICopilotButton';
import { rewriteDescription } from '@/ai/aiRewrite';
import { generateRFQFromProduct } from '@/ai/aiFunctions';
import SaveButton from '@/components/ui/SaveButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, Star, Shield, Building2, MessageCircle, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import ReviewList from '@/components/reviews/ReviewList';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { isValidUUID } from '@/utils/security';
import ShippingCalculator from '@/components/shipping/ShippingCalculator';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import ProductVariants from '@/components/products/ProductVariants';
import BulkPricingTiers from '@/components/products/BulkPricingTiers';
import ShareProduct from '@/components/products/ShareProduct';
import { Share2, GitCompare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ProductDetail() {
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [aiRFQLoading, setAiRFQLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const navigate = useNavigate();
  const [fromSellerCreate, setFromSellerCreate] = useState(false);

  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFromSellerCreate(urlParams.get('from') === 'seller_create');
    loadData();
    loadUser();
    trackPageView('Product Details');
  }, []);

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadData = async () => {
    // Support both /product/:slug and /product?id=uuid
    const pathParts = window.location.pathname.split('/');
    const slugOrId = pathParts[pathParts.length - 1];
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || slugOrId;
    
    if (!productId) {
      toast.error('Product not found');
      navigate('/marketplace');
      return;
    }

    try {
      // Try to find by slug first, then by ID
      // Only show active products to non-owners, but allow owners to see their own products
      // Note: Use explicit relationship name since products has multiple FKs to companies
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(*),
          product_images(*),
          companies!company_id(*),
          product_variants(*)
        `)
        .eq('status', 'active'); // Only show active products to public

      // Check if it's a UUID or slug
      if (isValidUUID(productId)) {
        query = query.eq('id', productId);
      } else {
        query = query.eq('slug', productId);
      }

      const { data: foundProduct, error: productError } = await query.single();

      if (productError) {
        console.error('Product load error:', productError);
        console.error('Product ID searched:', productId);
        console.error('Error details:', JSON.stringify(productError, null, 2));
        
        // If it's a permission error, try loading without joins first
        if (productError.code === 'PGRST116' || productError.message?.includes('permission') || productError.message?.includes('row-level security')) {
          // Try loading product without joins to see if it's a join issue
          const { data: simpleProduct, error: simpleError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('status', 'active')
            .single();
            
          if (simpleError || !simpleProduct) {
            toast.error('Product not found or you do not have permission to view it');
            navigate('/marketplace');
            return;
          }
          
          // If simple query works, the issue is with joins - load them separately
          const [categoriesRes, imagesRes, companiesRes] = await Promise.all([
            supabase.from('categories').select('*').eq('id', simpleProduct.category_id).maybeSingle(),
            supabase.from('product_images').select('*').eq('product_id', simpleProduct.id).order('sort_order'),
            supabase.from('companies').select('*').eq('id', simpleProduct.company_id).maybeSingle()
          ]);
          
          const productWithJoins = {
            ...simpleProduct,
            categories: categoriesRes.data ? [categoriesRes.data] : [],
            product_images: imagesRes.data || [],
            companies: companiesRes.data || null
          };
          
          setProduct({
            ...productWithJoins,
            // NOTE: product_images is the single source of truth. products.images is deprecated.
            primaryImage: getPrimaryImageFromProduct(productWithJoins),
            allImages: getAllImagesFromProduct(productWithJoins)
          });
          
          return;
        }
        
        toast.error('Failed to load product: ' + (productError.message || 'Unknown error'));
        navigate('/marketplace');
        return;
      }

      if (!foundProduct) {
        console.error('Product not found for ID:', productId);
        toast.error('Product not found');
        navigate('/marketplace');
        return;
      }

      // Get primary image or first image
      const productImages = Array.isArray(foundProduct.product_images) ? foundProduct.product_images : [];
      const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
      const allImages = productImages.length > 0 
        ? productImages.map(img => img.url).filter(Boolean)
        : (Array.isArray(foundProduct.images) ? foundProduct.images : []).filter(Boolean);

      setProduct({
        ...foundProduct,
        primaryImage: primaryImage?.url,
        allImages: allImages.length > 0 ? allImages : (foundProduct.images || [])
      });

      // Load product variants
      if (foundProduct.product_variants && Array.isArray(foundProduct.product_variants)) {
        setVariants(foundProduct.product_variants);
      } else {
        // Try to load variants separately
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', foundProduct.id)
          .order('created_at', { ascending: true });
        
        if (variantsData) {
          setVariants(variantsData);
        }
      }

      // Update views
      await supabase
        .from('products')
        .update({ views: (foundProduct.views || 0) + 1 })
        .eq('id', foundProduct.id);

      // Track view history
      addToViewHistory(foundProduct.id, 'product', {
        title: foundProduct.title,
        category_id: foundProduct.category_id,
        country: foundProduct.country_of_origin,
        price: foundProduct.price_min || foundProduct.price
      });

      // Track product view in database
      if (user?.id) {
        try {
          await trackProductView(foundProduct.id, {
            profile_id: user.id,
            company_id: user.company_id,
            source_page: 'product_detail'
          });
        } catch (error) {
          // Silent fail - tracking is non-critical
        }
      }

      // Load AI recommendations
      try {
        const aiRecs = await getProductRecommendations(foundProduct.id, 12);
        setAiRecommendations(aiRecs || []);
      } catch (error) {
        console.error('Error loading AI recommendations:', error);
        setAiRecommendations([]);
      }

      // Load similar and recommended products (fallback)
      const allProductsRes = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(100);
      
      if (allProductsRes.data) {
        setSimilarProducts(getSimilarProducts(foundProduct, allProductsRes.data));
        const viewHistory = getViewHistory('product');
        setRecommendedProducts(getRecommendedProducts(viewHistory, allProductsRes.data));
      }

      // Load supplier company
      const supplierId = foundProduct.supplier_id || foundProduct.company_id;
      if (supplierId) {
        const [companiesRes, reviewsRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', supplierId).single(),
          supabase.from('reviews').select('*').eq('product_id', foundProduct.id).order('created_at', { ascending: false })
        ]);

        if (companiesRes.data) {
          setSupplier(companiesRes.data);
        }
        if (reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
      }
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupplier = () => {
    if (!user) {
      const redirect = `/product?id=${product.id}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}&intent=message`);
      return;
    }
    setShowMessageDialog(true);
  };

  const handleCreateRFQ = () => {
    const targetUrl = createPageUrl('CreateRFQ') + '?product=' + product.id;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}&intent=rfq`);
      return;
    }
    navigate(targetUrl);
  };

  const handleGenerateAISummary = async () => {
    if (!product?.description) return;
    setAiSummaryLoading(true);
    try {
      const { compressLongDescription } = await import('@/ai/aiFunctions');
      const result = await compressLongDescription(product.description);
      if (result?.success && result.text) {
        setAiSummary(result.text);
        toast.success('AI summary ready');
      }
    } catch {
      // Silent failure; aiClient already handles toasts for outages
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleRewriteDescription = async () => {
    if (!product?.description) return;
    setAiDescriptionLoading(true);
    try {
      const result = await rewriteDescription(product.description);
      if (result?.success && result.text) {
        setAiDescription(result.text);
        toast.success('AI rewritten description ready');
      }
    } catch {
      // Silent failure
    } finally {
      setAiDescriptionLoading(false);
    }
  };

  const handleGenerateRFQWithAI = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    setAiRFQLoading(true);
    try {
      const result = await generateRFQFromProduct(product);
      if (result?.success && result.data) {
        const params = new URLSearchParams();
        params.set('product', product.id);
        try {
          params.set('draft', encodeURIComponent(JSON.stringify(result.data)));
        } catch {
          // ignore encoding issues, still pass product id
        }
        toast.success('AI RFQ draft ready');
        navigate(`/dashboard/rfqs/new?${params.toString()}`);
      }
    } catch {
      // Silent failure beyond aiClient handling
    } finally {
      setAiRFQLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <SEO 
        title={product.title || 'Product Details'}
        description={product.description || `View details for ${product.title}`}
        url={`/product?id=${product.id}`}
        type="product"
      />
      {product && (
        <StructuredData 
          type="Product" 
          data={{
            name: product.title,
            description: product.description,
            image: product.images?.[0] || '',
            price: product.price,
            currency: product.currency || 'USD',
            brand: supplier?.company_name || 'AFRIKONI Supplier'
          }}
        />
      )}
      <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {fromSellerCreate && supplier && user && user.company_id === supplier.id && (
          <div className="mb-4 rounded-lg border border-afrikoni-gold/30 bg-afrikoni-cream px-4 py-3 text-xs sm:text-sm text-afrikoni-deep flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="font-semibold text-afrikoni-chestnut">
              You’re viewing your own product as buyers see it.
            </span>
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="inline-flex items-center text-xs sm:text-sm font-medium text-afrikoni-gold hover:text-afrikoni-goldDark underline-offset-2 hover:underline"
            >
              Go to product list in your seller dashboard
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-afrikoni-deep mb-6">
          <Link to={createPageUrl('Home')} className="hover:text-amber-600">{t('product.home')}</Link>
          <span>/</span>
          <Link to={createPageUrl('Products')} className="hover:text-amber-600">{t('product.products')}</Link>
          <span>/</span>
          <span className="text-afrikoni-chestnut">{product.title}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-8">
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <Card className="border-afrikoni-gold/20">
              <CardContent className="p-3 md:p-6">
                <ProductImageGallery 
                  images={product.allImages || []} 
                  productTitle={product.title}
                />
              </CardContent>
            </Card>

            {/* Product Variants */}
            {variants.length > 0 && (
              <Card className="border-afrikoni-gold/20">
                <CardContent className="p-6">
                  <ProductVariants
                    variants={variants}
                    onVariantSelect={setSelectedVariant}
                    selectedVariantId={selectedVariant?.id}
                  />
                </CardContent>
              </Card>
            )}

            {/* Bulk Pricing Tiers */}
            <BulkPricingTiers product={selectedVariant || product} />

            <Card className="border-afrikoni-gold/20">
              <Tabs defaultValue="description">
                <CardHeader className="border-b">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="description">{t('product.description')}</TabsTrigger>
                    <TabsTrigger value="specifications">{t('product.specifications')}</TabsTrigger>
                    <TabsTrigger value="packaging">{t('product.packaging')}</TabsTrigger>
                    <TabsTrigger value="reviews">{t('product.reviews')} ({reviews.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="p-6">
                  <TabsContent value="description">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <AICopilotButton
                          label={t('product.generateAISummary')}
                          loading={aiSummaryLoading}
                          onClick={handleGenerateAISummary}
                          size="xs"
                        />
                        <AICopilotButton
                          label={t('product.rewriteDescription')}
                          loading={aiDescriptionLoading}
                          onClick={handleRewriteDescription}
                          size="xs"
                          variant="ghost"
                          className="text-afrikoni-deep"
                        />
                      </div>
                      {aiSummary && (
                        <AISummaryBox title={t('product.aiSummary')}>
                          {aiSummary}
                        </AISummaryBox>
                      )}
                      <div className="prose prose-zinc max-w-none">
                        <p className="text-afrikoni-deep leading-relaxed whitespace-pre-wrap">
                          {aiDescription || product.description}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="specifications">
                    {product.specifications ? (
                      <div className="space-y-3">
                        {Object.entries(product?.specifications || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-zinc-100">
                            <span className="font-medium text-afrikoni-deep">{key}</span>
                            <span className="text-afrikoni-chestnut">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-afrikoni-deep/70">{t('product.noSpecifications')}</p>
                    )}
                  </TabsContent>
                  <TabsContent value="packaging">
                    <div className="space-y-4">
                      {product.packaging_details && (
                        <div>
                          <h4 className="font-semibold text-afrikoni-chestnut mb-2">{t('product.packagingDetails')}</h4>
                          <p className="text-afrikoni-deep whitespace-pre-wrap">{product.packaging_details}</p>
                        </div>
                      )}
                      
                      {(product.lead_time_min_days || product.lead_time_max_days) && (
                        <div>
                          <h4 className="font-semibold text-afrikoni-chestnut mb-2">{t('product.leadTime')}</h4>
                          <p className="text-afrikoni-deep">
                            {product.lead_time_min_days && product.lead_time_max_days
                              ? `${product.lead_time_min_days} - ${product.lead_time_max_days} days`
                              : product.lead_time_min_days
                              ? `${product.lead_time_min_days} days`
                              : product.lead_time_max_days
                              ? `Up to ${product.lead_time_max_days} days`
                              : product.delivery_time || 'Contact supplier'}
                          </p>
                        </div>
                      )}
                      
                      {(product.supply_ability_qty && product.supply_ability_unit) && (
                        <div>
                          <h4 className="font-semibold text-afrikoni-chestnut mb-2">Supply Ability</h4>
                          <p className="text-afrikoni-deep">
                            {product.supply_ability_qty} {product.supply_ability_unit}
                          </p>
                        </div>
                      )}
                      
                      {Array.isArray(product?.shipping_terms) && product.shipping_terms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-afrikoni-chestnut mb-2">Shipping Terms</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(product?.shipping_terms) && product.shipping_terms.map((term, idx) => (
                              <Badge key={idx} variant="outline" className="text-afrikoni-deep">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {Array.isArray(product?.certifications) && product.certifications.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-afrikoni-chestnut mb-2">Certifications & Standards</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(product?.certifications) && product.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" /> {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews">
                    <ReviewList reviews={reviews} companies={companies} isSeller={user?.company_id === product.company_id} onUpdate={loadData} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card className="border-afrikoni-gold/20 md:sticky md:top-24">
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h1 className="text-2xl font-bold text-afrikoni-chestnut">{product.title}</h1>
                      <div className="flex flex-wrap gap-2 items-center">
                        {product.categories && (
                          <Badge variant="outline">
                            {product.categories.name}
                          </Badge>
                        )}
                        {/* Supplier verification / trust badge */}
                        {supplier?.verification_status === 'verified' && (
                          <Badge className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Verified by Afrikoni Shield™</span>
                            <span className="sm:hidden">Verified</span>
                          </Badge>
                        )}
                        {supplier?.verification_status === 'pending' && (
                          <Badge className="text-[10px] sm:text-xs bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Supplier Under Review</span>
                            <span className="sm:hidden">Pending</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SaveButton itemId={product.id} itemType="product" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
                          if (!compareList.find(p => p.id === product.id)) {
                            compareList.push({ id: product.id, title: product.title });
                            localStorage.setItem('compareProducts', JSON.stringify(compareList));
                            // Dispatch custom event to update navbar count
                            window.dispatchEvent(new Event('compareUpdated'));
                            toast.success('Product added to comparison');
                          } else {
                            toast.info('Product already in comparison');
                          }
                        }}
                        className="p-2"
                      >
                        <GitCompare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      {/* Price Range Display - Use selected variant price if available */}
                      {selectedVariant?.price ? (
                        <>
                          <div className="text-3xl font-bold text-afrikoni-gold mb-1">
                            {product.currency || 'USD'} {selectedVariant.price}
                          </div>
                          <div className="text-sm text-afrikoni-deep">per {product.unit || 'unit'}</div>
                        </>
                      ) : product.price_min && product.price_max ? (
                        <>
                          <div className="text-3xl font-bold text-afrikoni-gold mb-1">
                            {product.currency || 'USD'} {product.price_min} – {product.price_max}
                          </div>
                          <div className="text-sm text-afrikoni-deep">Price range per {product.moq_unit || product.unit || 'unit'}</div>
                        </>
                      ) : product.price_min ? (
                        <>
                          <div className="text-3xl font-bold text-afrikoni-gold mb-1">
                            {product.currency || 'USD'} {product.price_min}+
                          </div>
                          <div className="text-sm text-afrikoni-deep">Starting from</div>
                        </>
                      ) : product.price ? (
                        <>
                          <div className="text-3xl font-bold text-afrikoni-gold mb-1">
                            {product.currency || 'USD'} {product.price}
                          </div>
                          <div className="text-sm text-afrikoni-deep">per {product.unit || 'unit'}</div>
                        </>
                      ) : (
                        <div className="text-lg font-semibold text-afrikoni-deep">Price on request</div>
                      )}
                      
                      {Array.isArray(reviews) && reviews.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const avgRating = reviews.reduce((sum, r) => sum + (parseInt(r?.rating) || 0), 0) / reviews.length;
                              return (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.round(avgRating)
                                      ? 'fill-afrikoni-gold text-afrikoni-gold'
                                      : 'text-afrikoni-deep/50'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-sm text-afrikoni-deep">({reviews.length} reviews)</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-afrikoni-gold/20 space-y-3 text-sm">
                      {/* MOQ */}
                      {product.min_order_quantity ? (
                        <div className="flex justify-between">
                          <span className="text-afrikoni-deep">MOQ:</span>
                          <span className="font-semibold text-afrikoni-chestnut">
                            {product.min_order_quantity} {product.moq_unit || product.unit || 'units'}
                          </span>
                        </div>
                      ) : product.moq && (
                        <div className="flex justify-between">
                          <span className="text-afrikoni-deep">MOQ:</span>
                          <span className="font-semibold text-afrikoni-chestnut">{product.moq} {product.unit || 'units'}</span>
                        </div>
                      )}
                      
                      {/* Lead Time */}
                      {(product.lead_time_min_days || product.lead_time_max_days) && (
                        <div className="flex justify-between">
                          <span className="text-afrikoni-deep">Lead Time:</span>
                          <span className="font-semibold text-afrikoni-chestnut">
                            {product.lead_time_min_days && product.lead_time_max_days
                              ? `${product.lead_time_min_days}-${product.lead_time_max_days} days`
                              : product.lead_time_min_days
                              ? `${product.lead_time_min_days} days`
                              : `${product.lead_time_max_days} days`}
                          </span>
                        </div>
                      )}
                      
                      {/* Supply Ability */}
                      {product.supply_ability_qty && (
                        <div className="flex justify-between">
                          <span className="text-afrikoni-deep">Supply Ability:</span>
                          <span className="font-semibold text-afrikoni-chestnut">
                            {product.supply_ability_qty} {product.supply_ability_unit}
                          </span>
                        </div>
                      )}
                      
                      {/* Country of Origin */}
                      {product.country_of_origin && (
                        <div className="flex justify-between">
                          <span className="text-afrikoni-deep">Origin:</span>
                          <span className="font-semibold text-afrikoni-chestnut">{product.country_of_origin}</span>
                        </div>
                      )}
                      
                      {/* Currency */}
                      <div className="flex justify-between">
                        <span className="text-afrikoni-deep">Currency:</span>
                        <span className="font-semibold text-afrikoni-chestnut">{product.currency || 'USD'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <Button 
                    onClick={handleContactSupplier} 
                    className="w-full bg-afrikoni-gold hover:bg-amber-700 touch-manipulation min-h-[44px]" 
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> <span className="text-sm sm:text-base">{t('product.contactSupplier')}</span>
                  </Button>
                  <Button 
                    onClick={handleCreateRFQ} 
                    variant="outline" 
                    className="w-full touch-manipulation min-h-[44px]" 
                    size="lg"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> <span className="text-sm sm:text-base">{t('product.requestQuote')}</span>
                  </Button>
                  <p className="text-xs sm:text-sm text-afrikoni-deep/70 text-center pt-1">
                    {t('product.actionsHelp')}
                  </p>
                  <AICopilotButton
                    label="Generate RFQ with AI"
                    onClick={handleGenerateRFQWithAI}
                    loading={aiRFQLoading}
                    className="w-full touch-manipulation min-h-[44px]"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Share Product */}
            <ShareProduct 
              product={product} 
              productUrl={`${window.location.origin}/product?id=${product.id}`}
            />

            {/* Shipping Calculator */}
            <ShippingCalculator
              compact={true}
              defaultOrigin={product.country_of_origin || supplier?.country || ''}
              defaultWeight={product.supply_ability_qty ? `${product.supply_ability_qty}` : ''}
            />

            {supplier && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-afrikoni-chestnut mb-1">{supplier.company_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-afrikoni-deep">
                      <MapPin className="w-4 h-4" /> {supplier.city}, {supplier.country}
                    </div>
                  </div>
                  {supplier.verified && (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <Shield className="w-3 h-3 mr-1" /> Verified Supplier
                    </Badge>
                  )}
                  {supplier?.trust_score && parseFloat(supplier.trust_score) > 0 && (
                    <div>
                      <div className="text-sm text-afrikoni-deep mb-1">Trust Score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-afrikoni-cream rounded-full overflow-hidden">
                          <div className="h-full bg-afrikoni-gold rounded-full" style={{ width: `${Math.min(100, Math.max(0, parseFloat(supplier.trust_score)))}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-afrikoni-chestnut">{parseFloat(supplier.trust_score)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/business/${supplier.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">View Business Profile</Button>
                    </Link>
                    <Link to={createPageUrl('SupplierProfile') + '?id=' + supplier.id} className="flex-1">
                      <Button variant="outline" className="w-full">Legacy Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <ProductRecommendations 
            productId={product.id}
            currentUserId={user?.id}
            currentCompanyId={user?.company_id}
          />
        </section>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-6">{t('product.similarProducts')}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Array.isArray(similarProducts) && similarProducts.map(product => (
              product && (
                <Link key={product.id} to={`/product?id=${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-afrikoni-chestnut mb-2 line-clamp-2">{product?.title || 'Product'}</h3>
                      <p className="text-lg font-bold text-afrikoni-gold">
                        {product?.price_min || product?.price ? `$${product.price_min || product.price}` : 'Price on request'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You (fallback if no AI recommendations) */}
      {recommendedProducts.length > 0 && aiRecommendations.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-6">Recommended for You</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Array.isArray(recommendedProducts) && recommendedProducts.map(product => (
              product && (
                <Link key={product.id} to={`/product?id=${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-afrikoni-chestnut mb-2 line-clamp-2">{product?.title || 'Product'}</h3>
                      <p className="text-lg font-bold text-afrikoni-gold">
                        {product?.price_min || product?.price ? `$${product.price_min || product.price}` : 'Price on request'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            ))}
          </div>
        </div>
      )}

      {supplier && (
        <NewMessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          recipientCompany={supplier}
          relatedTo={product.id}
          relatedType="product"
          subject={`Inquiry about: ${product.title}`}
        />
      )}
    </div>
    </>
  );
}

