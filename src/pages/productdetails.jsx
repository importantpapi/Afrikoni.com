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
import { Package, MapPin, Star, Shield, Building2, MessageCircle, FileText, CheckCircle, Clock } from 'lucide-react';
import TrustBadge from '@/components/ui/TrustBadge';
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
import { GitCompare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { OffPlatformDisclaimerCompact } from '@/components/OffPlatformDisclaimer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Price, { PriceRange } from '@/components/ui/Price';
import { PaymentProtectionBanner } from '@/components/trust/PaymentProtectionBanner';
import { VerificationBadgeTooltip } from '@/components/trust/VerificationBadgeTooltip';
import MobileStickyCTA from '@/components/ui/MobileStickyCTA';

/**
 * ⚠️ INSTITUTIONAL PRODUCT PAGE
 * This page is intentionally conservative and trust-first.
 * Do NOT expose internal metrics or experimental features publicly.
 * Changes require founder approval.
 */
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
  const MIN_COMPLETENESS_FOR_RFQ = 40; // below this, we nudge improvement before RFQs
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
      // Load product first without joins to avoid RLS issues
      // Then load related data separately
      let query = supabase
        .from('products')
        .select('*');

      // Check if it's a UUID or slug
      if (isValidUUID(productId)) {
        query = query.eq('id', productId);
      } else {
        query = query.eq('slug', productId);
      }

      const { data: foundProduct, error: productError } = await query.single();

      if (productError || !foundProduct) {
        console.error('Product load error:', productError);
        console.error('Product ID searched:', productId);
        if (productError) {
          console.error('Error details:', JSON.stringify(productError, null, 2));
        }
        
        toast.error('Product not found or you do not have permission to view it');
        navigate('/marketplace');
        return;
      }

      // Check if product is active (RLS allows viewing active products or own products)
      if (foundProduct.status !== 'active') {
        // Check if user owns this product
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
          
          const userCompanyId = profile?.company_id;
          const isOwner = foundProduct.company_id === userCompanyId || foundProduct.supplier_id === userCompanyId;
          
          if (!isOwner) {
            toast.error('Product not found or you do not have permission to view it');
            navigate('/marketplace');
            return;
          }
        } else {
          toast.error('Product not found or you do not have permission to view it');
          navigate('/marketplace');
          return;
        }
      }

      // Load related data separately to avoid RLS issues with joins
      const [categoriesRes, imagesRes, companiesRes, variantsRes] = await Promise.all([
        foundProduct.category_id 
          ? supabase.from('categories').select('*').eq('id', foundProduct.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('product_images').select('*').eq('product_id', foundProduct.id).order('sort_order'),
        foundProduct.company_id
          ? supabase.from('companies').select('*').eq('id', foundProduct.company_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('product_variants').select('*').eq('product_id', foundProduct.id).order('created_at')
      ]);

      // Combine all data
      const productWithJoins = {
        ...foundProduct,
        categories: categoriesRes.data ? [categoriesRes.data] : [],
        product_images: imagesRes.data || [],
        companies: companiesRes.data || null,
        product_variants: variantsRes.data || []
      };

      // Get primary image or first image using helper functions
      const primaryImage = getPrimaryImageFromProduct(productWithJoins);
      const allImages = getAllImagesFromProduct(productWithJoins);

      setProduct({
        ...productWithJoins,
        primaryImage: primaryImage || null,
        allImages: allImages.length > 0 ? allImages : []
      });

      // Set variants
      if (variantsRes.data && variantsRes.data.length > 0) {
        setVariants(variantsRes.data);
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
    // Governance: if listing is clearly incomplete, keep it visible but block RFQs until improved
    if (typeof product?.completeness_score === 'number' && product.completeness_score < MIN_COMPLETENESS_FOR_RFQ) {
      toast.error('This listing needs more details before RFQs can be created. Please improve your product information in the seller dashboard.');
      return;
    }
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 pb-24 md:pb-8">
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
        <Breadcrumb 
          items={[
            { path: '/', label: 'Home' },
            { path: '/marketplace', label: 'Marketplace' },
            { path: `/product?id=${product.id}`, label: product.title }
          ]}
        />

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
          <div className="md:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="border-afrikoni-gold/20 overflow-hidden">
              <CardContent className="p-2 sm:p-2 md:p-3">
                <div className="max-h-[400px] md:max-h-[450px] overflow-hidden">
                  <ProductImageGallery 
                    images={product.allImages || []} 
                    productTitle={product.title}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trust & Verification Status - Elevated prominence */}
            <Card className="border-afrikoni-gold/30 bg-gradient-to-r from-afrikoni-cream/40 to-afrikoni-cream/20">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-afrikoni-gold/20 border-2 border-afrikoni-gold/40">
                    <Shield className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-afrikoni-chestnut flex items-center gap-2">
                      {product.is_standardized ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Reviewed Listing
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-600" />
                          Verification in Progress
                        </>
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-afrikoni-deep/80 mt-1">
                      {product.is_standardized
                        ? "This listing follows Afrikoni's standardized B2B format. Trade Shield protection applies."
                        : 'Supplier onboarding in progress. Additional details available upon request. Trade Shield protection applies.'}
                    </p>
                  </div>
                </div>
                {supplier?.verification_status === 'verified' && (
                  <div className="flex-shrink-0">
                    <TrustBadge type="verified-supplier" size="default" />
                  </div>
                )}
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

            {/* Bulk Pricing Tiers - Helper information */}
            <div className="opacity-90">
              <BulkPricingTiers product={selectedVariant || product} />
            </div>

            <Card className="border-afrikoni-gold/20">
              <Tabs defaultValue="description">
                <CardHeader className="border-b">
                  <TabsList className="w-full justify-start overflow-x-auto touch-manipulation">
                    <TabsTrigger value="description" className="min-h-[44px] md:min-h-0 touch-manipulation active:scale-95 md:active:scale-100 text-xs sm:text-sm">{t('product.description')}</TabsTrigger>
                    <TabsTrigger value="specifications" className="min-h-[44px] md:min-h-0 touch-manipulation active:scale-95 md:active:scale-100 text-xs sm:text-sm">{t('product.specifications')}</TabsTrigger>
                    <TabsTrigger value="packaging" className="min-h-[44px] md:min-h-0 touch-manipulation active:scale-95 md:active:scale-100 text-xs sm:text-sm">{t('product.packaging')}</TabsTrigger>
                    <TabsTrigger value="reviews" className="min-h-[44px] md:min-h-0 touch-manipulation active:scale-95 md:active:scale-100 text-xs sm:text-sm">{t('product.reviews')} ({reviews.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="p-6">
                  <TabsContent value="description">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 justify-end items-center opacity-60">
                        <AICopilotButton
                          label={t('product.generateAISummary')}
                          loading={aiSummaryLoading}
                          onClick={handleGenerateAISummary}
                          size="xs"
                          variant="ghost"
                          className="text-afrikoni-deep/60 text-xs"
                        />
                        <AICopilotButton
                          label={t('product.rewriteDescription')}
                          loading={aiDescriptionLoading}
                          onClick={handleRewriteDescription}
                          size="xs"
                          variant="ghost"
                          className="text-afrikoni-deep/60 text-xs"
                        />
                      </div>
                      {aiSummary && (
                        <div className="bg-afrikoni-cream/30 border border-afrikoni-gold/20 rounded-lg p-3">
                          <AISummaryBox title={t('product.aiSummary')}>
                            {aiSummary}
                          </AISummaryBox>
                        </div>
                      )}
                      <div className="prose prose-zinc max-w-none">
                        <p className="text-afrikoni-deep leading-relaxed text-base md:text-lg whitespace-pre-wrap">
                          {aiDescription || product.description || product.short_description || 'No description available.'}
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
                    <ReviewList 
                      reviews={reviews} 
                      companies={companies} 
                      isSeller={user?.company_id === product.company_id} 
                      product={product}
                      supplier={supplier}
                      onUpdate={loadData} 
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="border-afrikoni-gold/20 md:sticky md:top-24 bg-[#FFF6E1]">
              <CardContent className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-afrikoni-chestnut leading-tight">
                        {product.title}
                      </h1>
                      <div className="flex flex-wrap gap-2 items-center text-xs sm:text-sm">
                        {(product.country_of_origin || supplier) && (
                          <div className="flex items-center gap-1 text-afrikoni-deep/80">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {(() => {
                                // Priority: product.country_of_origin > supplier.country
                                const originCountry = product.country_of_origin || supplier?.country;
                                const originCity = supplier?.city;
                                
                                if (originCity && originCountry) {
                                  return `${originCity}, ${originCountry}`;
                                } else if (originCountry) {
                                  return originCountry;
                                }
                                return 'Origin not specified';
                              })()}
                            </span>
                            <span>
                              {/* Basic flag support for key markets */}
                              {(() => {
                                const originCountry = product.country_of_origin || supplier?.country;
                                if (originCountry === 'Angola') return '🇦🇴';
                                if (originCountry === 'Nigeria') return '🇳🇬';
                                if (originCountry === 'Ghana') return '🇬🇭';
                                if (originCountry === 'Kenya') return '🇰🇪';
                                if (originCountry === 'South Africa') return '🇿🇦';
                                return '';
                              })()}
                            </span>
                          </div>
                        )}
                        {product.categories && (
                          <Badge variant="outline" className="bg-white/70 border-afrikoni-gold/40">
                            {product.categories.name}
                          </Badge>
                        )}
                        {/* Supplier verification / trust badge */}
                        {supplier?.verification_status === 'verified' && (
                          <TrustBadge type="verified-supplier" size="sm" />
                        )}
                        {supplier?.verification_status === 'pending' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                            <Clock className="w-3 h-3 mr-1" /> Verification in Progress
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
                      {(() => {
                        // Map country names to currency codes
                        const countryCurrencyMap = {
                          'Angola': 'AOA', 'Nigeria': 'NGN', 'Ghana': 'GHS', 'Kenya': 'KES',
                          'South Africa': 'ZAR', 'Egypt': 'EGP', 'Morocco': 'MAD', 'Senegal': 'XOF',
                          'Tanzania': 'TZS', 'Ethiopia': 'ETB', 'Cameroon': 'XAF', 'Côte d\'Ivoire': 'XOF',
                          'Uganda': 'UGX', 'Algeria': 'DZD', 'Sudan': 'SDG', 'Mozambique': 'MZN',
                          'Madagascar': 'MGA', 'Mali': 'XOF', 'Burkina Faso': 'XOF', 'Niger': 'XOF',
                          'Rwanda': 'RWF', 'Benin': 'XOF', 'Guinea': 'GNF', 'Chad': 'XAF',
                          'Zimbabwe': 'ZWL', 'Zambia': 'ZMW', 'Malawi': 'MWK', 'Gabon': 'XAF',
                          'Botswana': 'BWP', 'Gambia': 'GMD', 'Guinea-Bissau': 'XOF', 'Liberia': 'LRD',
                          'Sierra Leone': 'SLL', 'Togo': 'XOF', 'Mauritania': 'MRU', 'Namibia': 'NAD',
                          'Lesotho': 'LSL', 'Eritrea': 'ERN', 'Djibouti': 'DJF', 'South Sudan': 'SSP',
                          'Central African Republic': 'XAF', 'Republic of the Congo': 'XAF', 'DR Congo': 'CDF',
                          'São Tomé and Príncipe': 'STN', 'Cape Verde': 'CVE', 'Comoros': 'KMF',
                          'Mauritius': 'MUR', 'Somalia': 'SOS', 'Burundi': 'BIF', 'Equatorial Guinea': 'XAF',
                          'Eswatini': 'SZL', 'Libya': 'LYD', 'Tunisia': 'TND'
                        };
                        
                        // Get currency: country currency > product currency (if not USD) > USD
                        const getProductCurrency = () => {
                          const originCountry = product.country_of_origin || supplier?.country;
                          
                          // If we have a country, use its currency (override USD)
                          if (originCountry && countryCurrencyMap[originCountry]) {
                            return countryCurrencyMap[originCountry];
                          }
                          
                          // Otherwise, use product currency if set and not USD
                          if (product.currency && product.currency !== 'USD') {
                            return product.currency;
                          }
                          
                          // Default fallback
                          return product.currency || 'USD';
                        };
                        const productCurrency = getProductCurrency();
                        
                        if (selectedVariant?.price) {
                          return (
                            <Price
                              amount={selectedVariant.price}
                              fromCurrency={productCurrency}
                              unit={product.unit || 'unit'}
                              className="text-3xl font-bold text-afrikoni-gold mb-1"
                              showUnit={true}
                            />
                          );
                        } else if (product.price_min && product.price_max) {
                          return (
                            <>
                              <PriceRange
                                min={product.price_min}
                                max={product.price_max}
                                fromCurrency={productCurrency}
                                unit={product.moq_unit || product.unit || 'unit'}
                                className="text-3xl font-bold text-afrikoni-gold mb-1"
                              />
                              <div className="text-sm text-afrikoni-deep">Price range per {product.moq_unit || product.unit || 'unit'}</div>
                            </>
                          );
                        } else if (product.price_min) {
                          return (
                            <>
                              <Price
                                amount={product.price_min}
                                fromCurrency={productCurrency}
                                unit={product.unit || 'unit'}
                                className="text-3xl font-bold text-afrikoni-gold mb-1"
                                suffix="+"
                                showUnit={true}
                              />
                              <div className="text-sm text-afrikoni-deep">Starting from</div>
                            </>
                          );
                        } else if (product.price) {
                          return (
                            <Price
                              amount={product.price}
                              fromCurrency={productCurrency}
                              unit={product.unit || 'unit'}
                              className="text-3xl font-bold text-afrikoni-gold mb-1"
                              showUnit={true}
                            />
                          );
                        } else {
                          return <div className="text-lg font-semibold text-afrikoni-deep">Price on request</div>;
                        }
                      })()}
                      
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
                        <span className="font-semibold text-afrikoni-chestnut">
                          {(() => {
                            // Map country names to currency codes
                            const countryCurrencyMap = {
                              'Angola': 'AOA',
                              'Nigeria': 'NGN',
                              'Ghana': 'GHS',
                              'Kenya': 'KES',
                              'South Africa': 'ZAR',
                              'Egypt': 'EGP',
                              'Morocco': 'MAD',
                              'Senegal': 'XOF',
                              'Tanzania': 'TZS',
                              'Ethiopia': 'ETB',
                              'Cameroon': 'XAF',
                              'Côte d\'Ivoire': 'XOF',
                              'Uganda': 'UGX',
                              'Algeria': 'DZD',
                              'Sudan': 'SDG',
                              'Mozambique': 'MZN',
                              'Madagascar': 'MGA',
                              'Mali': 'XOF',
                              'Burkina Faso': 'XOF',
                              'Niger': 'XOF',
                              'Rwanda': 'RWF',
                              'Benin': 'XOF',
                              'Guinea': 'GNF',
                              'Chad': 'XAF',
                              'Zimbabwe': 'ZWL',
                              'Zambia': 'ZMW',
                              'Malawi': 'MWK',
                              'Gabon': 'XAF',
                              'Botswana': 'BWP',
                              'Gambia': 'GMD',
                              'Guinea-Bissau': 'XOF',
                              'Liberia': 'LRD',
                              'Sierra Leone': 'SLL',
                              'Togo': 'XOF',
                              'Mauritania': 'MRU',
                              'Namibia': 'NAD',
                              'Lesotho': 'LSL',
                              'Eritrea': 'ERN',
                              'Djibouti': 'DJF',
                              'South Sudan': 'SSP',
                              'Central African Republic': 'XAF',
                              'Republic of the Congo': 'XAF',
                              'DR Congo': 'CDF',
                              'São Tomé and Príncipe': 'STN',
                              'Cape Verde': 'CVE',
                              'Comoros': 'KMF',
                              'Mauritius': 'MUR',
                              'Somalia': 'SOS',
                              'Burundi': 'BIF',
                              'Equatorial Guinea': 'XAF',
                              'Eswatini': 'SZL',
                              'Libya': 'LYD',
                              'Tunisia': 'TND'
                            };
                            
                            // Get country of origin
                            const originCountry = product.country_of_origin || supplier?.country;
                            
                            // If we have a country, use its currency (even if product.currency is USD)
                            if (originCountry && countryCurrencyMap[originCountry]) {
                              return countryCurrencyMap[originCountry];
                            }
                            
                            // Otherwise, use product currency if set and not USD
                            if (product.currency && product.currency !== 'USD') {
                              return product.currency;
                            }
                            
                            // Default fallback
                            return product.currency || 'USD';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {/* PRIMARY CTA: Request Quote - Hidden on mobile (shown in sticky CTA) */}
                  <div className="hidden md:block space-y-3">
                    <Button 
                      onClick={handleCreateRFQ} 
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldLight text-white font-bold shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-95 md:active:scale-100 min-h-[52px] md:min-h-[52px] text-base md:text-lg" 
                      size="lg"
                    >
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> 
                      <span>{t('product.requestQuote') || 'Request Quote'}</span>
                    </Button>
                    
                    <p className="text-xs text-afrikoni-deep/60 text-center -mt-2 mb-1">
                      All RFQs are reviewed to ensure supplier fit, trade seriousness, and platform protection.
                    </p>

                    {/* Payment Protection - Build Confidence */}
                    <PaymentProtectionBanner variant="compact" className="mt-2 mb-3" />
                    
                    {/* SECONDARY CTA: Contact Supplier - Less prominent */}
                    <Button 
                      onClick={handleContactSupplier} 
                      variant="outline"
                      className="w-full border-2 border-afrikoni-gold/40 hover:border-afrikoni-gold hover:bg-afrikoni-gold/5 touch-manipulation active:scale-95 md:active:scale-100 min-h-[44px] md:min-h-0 text-sm md:text-base" 
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 
                      <span>{t('product.contactSupplier') || 'Contact Supplier'}</span>
                    </Button>
                  </div>
                  
                  {/* Mobile: Show compact info only */}
                  <div className="md:hidden space-y-2">
                    <PaymentProtectionBanner variant="compact" className="mt-2 mb-3" />
                    <p className="text-xs text-afrikoni-deep/60 text-center">
                      All RFQs are reviewed to ensure supplier fit, trade seriousness, and platform protection.
                    </p>
                  </div>
                  
                  {/* TERTIARY CTA: AI RFQ - Subtle, optional */}
                  <div className="pt-1">
                    <AICopilotButton
                      label="Generate RFQ with AI"
                      onClick={handleGenerateRFQWithAI}
                      loading={aiRFQLoading}
                      variant="ghost"
                      className="w-full text-xs md:text-sm text-afrikoni-deep/70 hover:text-afrikoni-chestnut hover:bg-afrikoni-cream/50"
                      size="sm"
                    />
                  </div>
                  
                  <p className="text-xs sm:text-sm text-afrikoni-deep/60 text-center pt-1 italic">
                    {t('product.actionsHelp') || 'Request Quote for formal offers. Contact for quick questions.'}
                  </p>
                  
                  <OffPlatformDisclaimerCompact className="mt-2" />
                </div>
              </CardContent>
            </Card>


            {/* Shipping Calculator - De-emphasized helper tool */}
            <div className="bg-afrikoni-cream/20 border border-afrikoni-gold/10 rounded-lg p-3">
              <ShippingCalculator
                compact={true}
                defaultOrigin={product.country_of_origin || supplier?.country || ''}
                defaultWeight={product.supply_ability_qty ? `${product.supply_ability_qty}` : ''}
              />
            </div>

            {supplier && (
              <Card className="border-2 border-afrikoni-gold/30 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-afrikoni-offwhite">
                <CardHeader className="border-b border-afrikoni-gold/20 bg-gradient-to-r from-afrikoni-gold/5 to-transparent">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-afrikoni-chestnut">
                    <div className="w-10 h-10 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-afrikoni-gold" />
                    </div>
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Supplier Header with Logo */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-chestnut/20 border-2 border-afrikoni-gold/30 flex items-center justify-center flex-shrink-0 shadow-md">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.company_name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<svg class="w-8 h-8 text-afrikoni-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>';
                          }}
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-afrikoni-gold" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-afrikoni-chestnut mb-1 leading-tight">
                        {supplier.company_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-afrikoni-deep/80 mb-2">
                        <MapPin className="w-4 h-4 text-afrikoni-gold flex-shrink-0" />
                        <span>{supplier.city ? `${supplier.city}, ` : ''}{supplier.country}</span>
                      </div>
                      {/* Verification Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {supplier?.verification_status === 'verified' && (
                          <TrustBadge type="verified-supplier" />
                        )}
                        {supplier?.verification_status === 'pending' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Verification in Progress
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Supplier Quick Info */}
                  {(supplier.year_established || supplier.business_type || supplier.employee_count) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                      {supplier.year_established && (
                        <div className="text-center">
                          <p className="text-xs text-afrikoni-deep/60 mb-1">Established</p>
                          <p className="font-bold text-afrikoni-chestnut">{supplier.year_established}</p>
                        </div>
                      )}
                      {supplier.business_type && (
                        <div className="text-center">
                          <p className="text-xs text-afrikoni-deep/60 mb-1">Business Type</p>
                          <p className="font-bold text-afrikoni-chestnut text-sm">{supplier.business_type?.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {supplier.employee_count && (
                        <div className="text-center">
                          <p className="text-xs text-afrikoni-deep/60 mb-1">Team Size</p>
                          <p className="font-bold text-afrikoni-chestnut">{supplier.employee_count}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link to={`/business/${supplier.id}`} className="block">
                      <Button 
                        className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold shadow-md hover:shadow-lg transition-all"
                        size="lg"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        View Complete Business Profile
                      </Button>
                    </Link>
                    <Link to={createPageUrl('SupplierProfile') + '?id=' + supplier.id} className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full text-afrikoni-deep/60 hover:text-afrikoni-deep hover:bg-afrikoni-gold/10 text-xs"
                        size="sm"
                      >
                        View Legacy Profile
                      </Button>
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
                      <div className="text-lg font-bold text-afrikoni-gold">
                        <Price
                          amount={product?.price_min || product?.price}
                          fromCurrency={product?.currency || 'USD'}
                          className="text-lg font-bold text-afrikoni-gold"
                        />
                      </div>
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
                      <div className="text-lg font-bold text-afrikoni-gold">
                        <Price
                          amount={product?.price_min || product?.price}
                          fromCurrency={product?.currency || 'USD'}
                          className="text-lg font-bold text-afrikoni-gold"
                        />
                      </div>
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

      {/* Mobile Sticky CTA - Always visible on mobile for key actions */}
      {product && (
        <MobileStickyCTA
          label={t('product.requestQuote') || 'Request Quote'}
          onClick={handleCreateRFQ}
          icon={FileText}
          variant="default"
          secondaryAction={handleContactSupplier}
          secondaryLabel={t('product.contactSupplier') || 'Contact'}
        />
      )}
    </div>
    </>
  );
}

