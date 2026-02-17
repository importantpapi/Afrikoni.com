import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { addToViewHistory, getViewHistory } from '@/utils/viewHistory';
import { getSimilarProducts, getRecommendedProducts } from '@/utils/recommendations';
import { getProductRecommendations } from '@/lib/supabaseQueries/ai';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import { trackProductView } from '@/lib/supabaseQueries/products';
import AISummaryBox from '@/components/ai/AISummaryBox';
import AICopilotButton from '@/components/ai/AICopilotButton';
import { rewriteDescription } from '@/ai/aiRewrite';
import { generateRFQFromProduct } from '@/ai/aiFunctions';
import SaveButton from '@/components/shared/ui/SaveButton';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Package, MapPin, Star, Shield, ShieldCheck, Building, MessageCircle, FileText, CheckCircle, Clock, Zap, FlaskConical, Award, Globe } from 'lucide-react';
import QuickQuoteModal from '@/components/products/QuickQuoteModal';
import { SampleOrderButton } from '@/components/products/SampleOrderButton';
import TrustBadge from '@/components/shared/ui/TrustBadge';
import { toast } from 'sonner';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import ReviewList from '@/components/reviews/ReviewList';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { isValidUUID } from '@/utils/security';
import { cn } from '@/lib/utils';
import ShippingCalculator from '@/components/shipping/ShippingCalculator';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import { getPrimaryImageFromProduct, getAllImagesFromProduct, normalizeProductImageUrl } from '@/utils/productImages';
import ProductVariants from '@/components/products/ProductVariants';
import BulkPricingTiers from '@/components/products/BulkPricingTiers';
import { GitCompare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { OffPlatformDisclaimerCompact } from '@/components/OffPlatformDisclaimer';
import Breadcrumb from '@/components/shared/ui/Breadcrumb';
import Price, { PriceRange } from '@/components/shared/ui/Price';
import { PaymentProtectionBanner } from '@/components/trust/PaymentProtectionBanner';
import { VerificationBadgeTooltip } from '@/components/trust/VerificationBadgeTooltip';
import MobileStickyCTA from '@/components/shared/ui/MobileStickyCTA';
import { createTrade, TRADE_STATE } from '@/services/tradeKernel';

/**
 * ⚠️ INSTITUTIONAL PRODUCT PAGE
 * This page is intentionally conservative and trust-first.
 * Do NOT expose internal metrics or experimental features publicly.
 * Changes require founder approval.
 */
export default function ProductDetail() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady } = useAuth();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showQuickQuoteModal, setShowQuickQuoteModal] = useState(false);
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
  const [logoError, setLogoError] = useState(false);

  // Reset logo error when supplier changes
  useEffect(() => {
    setLogoError(false);
  }, [supplier?.logo_url]);

  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFromSellerCreate(urlParams.get('from') === 'seller_create');
    loadData();
    trackPageView('Product Details');
  }, []);

  // User loaded from AuthProvider context (no separate loadUser needed)

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
    // Governance: if listing is clearly incomplete, block RFQs
    if (typeof product?.completeness_score === 'number' && product.completeness_score < MIN_COMPLETENESS_FOR_RFQ) {
      toast.error('Listing incomplete. Please improve details first.');
      return;
    }
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}&intent=rfq`);
      return;
    }
    navigate(targetUrl);
  };

  const handleBuyNow = async () => {
    if (!user) {
      const redirect = `/product?id=${product.id}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}&intent=buy`);
      return;
    }

    const toastId = toast.loading('Initializing Sovereign Trade...');

    try {
      // Step 2: Transaction Initiation (Path A)
      const tradeData = {
        trade_type: 'order',
        buyer_id: user.company_id,
        created_by: user.id,
        title: product.title,
        description: product.description || `Direct purchase of ${product.title}`,
        category_id: product.category_id,
        quantity: product.min_order_quantity || 1,
        quantity_unit: product.unit || 'pieces',
        target_price: product.price || product.price_min,
        currency: product.currency || 'USD',
        status: TRADE_STATE.CONTRACTED, // Direct buy skips RFQ/Quoted
        metadata: {
          product_id: product.id,
          supplier_id: supplier?.id,
          initiator: 'buy_now_button'
        }
      };

      const result = await createTrade(tradeData);

      if (result.success) {
        toast.success('Trade Initialized on the Rail', { id: toastId });
        navigate(`/dashboard/one-flow/${result.data.id}`);
      } else {
        toast.error(`Kernel Blocked Trade: ${result.error}`, { id: toastId });
      }
    } catch (err) {
      toast.error('System Exception during initiation', { id: toastId });
      console.error(err);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
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
      <div className="min-h-screen bg-os-bg selection:bg-os-accent selection:text-white">
        {/* INSTITUTIONAL HEADER / BREADCRUMB */}
        <div className="max-w-screen-2xl mx-auto px-6 pt-12">
          <Breadcrumb
            items={[
              { path: '/', label: 'Home' },
              { path: '/marketplace', label: 'Marketplace' },
              { path: `/product/${product.id}`, label: product.title }
            ]}
            className="mb-8 opacity-60 hover:opacity-100 transition-opacity"
          />

          {fromSellerCreate && supplier && user && user.company_id === supplier.id && (
            <div className="mb-8 p-4 rounded-xl bg-os-accent/5 border border-os-accent/20 backdrop-blur-sm animate-luxury-reveal">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-os-accent animate-pulse" />
                  <span className="text-os-sm font-bold tracking-tight text-os-text-primary uppercase">
                    Seller Preview Mode
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard/products')}
                  className="text-os-xs font-black uppercase tracking-widest text-os-accent hover:bg-os-accent/10"
                >
                  Return to Command Center
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-screen-2xl mx-auto px-6 pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* LEFT COLUMN: THE VISUAL HERITAGE (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
              {/* IMMERSIVE GALLERY */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-b from-os-accent/5 to-transparent rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <Card className="border-none bg-os-surface-solid shadow-[0_32px_80px_rgba(0,0,0,0.06)] rounded-[32px] overflow-hidden relative z-10">
                  <CardContent className="p-0">
                    <ProductImageGallery
                      images={product.allImages || []}
                      productTitle={product.title}
                      className="aspect-[16/10] md:aspect-[16/9]"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* TRUST PROTOCOL METER */}
              <div className="p-8 rounded-[32px] bg-os-surface-solid border border-os-stroke/40 shadow-os-md flex items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-os-accent" />
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-os-accent/5 border border-os-accent/20 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-os-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-os-text-primary mb-2">
                      {product.is_standardized
                        ? "Institutional-Grade Sourcing Intelligence"
                        : "Verification In Progress"}
                    </h3>
                    <p className="text-os-sm text-os-text-secondary max-w-lg leading-relaxed">
                      {product.is_standardized ? (
                        <>
                          This listing meets institutional standards:
                          <strong className="text-os-text-primary"> production capacity verified</strong>,
                          <strong className="text-os-text-primary"> certifications authenticated</strong>,
                          <strong className="text-os-text-primary"> lead times validated</strong>.
                          Escrow protection active for all platform transactions.
                        </>
                      ) : (
                        <>
                          Our verification team is currently auditing this supplier's production capacity,
                          certifications, and export readiness. All platform payments remain protected by
                          <strong className="text-os-text-primary"> Afrikoni's Trade Shield</strong>.
                        </>
                      )}
                    </p>

                    {/* KYB/KYC Verification Status */}
                    {supplier?.kyb_status === 'verified' && (
                      <div className="flex items-center gap-2 text-os-sm text-os-text-secondary mt-4 pt-4 border-t border-os-stroke/20">
                        <CheckCircle className="w-4 h-4 text-os-green" />
                        <span className="font-medium">Business verification complete</span>
                      </div>
                    )}
                    {supplier?.kyb_status === 'pending' && (
                      <div className="flex items-center gap-2 text-os-sm text-os-text-secondary mt-4 pt-4 border-t border-os-stroke/20">
                        <Clock className="w-4 h-4 text-os-accent" />
                        <span className="font-medium">Business verification in progress</span>
                      </div>
                    )}
                  </div>
                </div>
                {supplier?.verification_status === 'verified' && (
                  <div className="hidden md:block">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-os-accent/10 to-transparent px-6 py-3 rounded-full border border-os-accent/20">
                      <ShieldCheck className="w-5 h-5 text-os-accent" />
                      <span className="text-os-xs font-black uppercase tracking-[0.3em] text-os-accent">Verified Heritage</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Certifications Grid */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="mt-6 pt-6 border-t border-os-stroke/20">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-os-text-secondary/40 mb-4">
                    Verified Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-4 py-2
                                   bg-os-accent/5 border border-os-accent/20 rounded-full
                                   text-os-sm font-bold text-os-accent"
                      >
                        <Award className="w-4 h-4" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Variants */}
              {variants.length > 0 && (
                <Card className="border-os-accent/20">
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

              {/* INSTITUTIONAL INTELLIGENCE TABS */}
              <div className="bg-os-surface-solid rounded-[32px] border border-os-stroke/40 shadow-os-sm overflow-hidden">
                <Tabs defaultValue="description" className="w-full">
                  <div className="px-8 pt-8 border-b border-os-stroke/20">
                    <TabsList className="w-full justify-start bg-transparent h-auto gap-8 p-0 pb-4">
                      <TabsTrigger
                        value="description"
                        className="data-[state=active]:text-os-accent data-[state=active]:border-os-accent border-b-2 border-transparent rounded-none px-0 pb-4 text-os-sm font-black uppercase tracking-widest transition-all"
                      >
                        Heritage & Vision
                      </TabsTrigger>
                      <TabsTrigger
                        value="specifications"
                        className="data-[state=active]:text-os-accent data-[state=active]:border-os-accent border-b-2 border-transparent rounded-none px-0 pb-4 text-os-sm font-black uppercase tracking-widest transition-all"
                      >
                        Sourcing Intel
                      </TabsTrigger>
                      <TabsTrigger
                        value="packaging"
                        className="data-[state=active]:text-os-accent data-[state=active]:border-os-accent border-b-2 border-transparent rounded-none px-0 pb-4 text-os-sm font-black uppercase tracking-widest transition-all"
                      >
                        Logistics Blueprint
                      </TabsTrigger>
                      <TabsTrigger
                        value="reviews"
                        className="data-[state=active]:text-os-accent data-[state=active]:border-os-accent border-b-2 border-transparent rounded-none px-0 pb-4 text-os-sm font-black uppercase tracking-widest transition-all"
                      >
                        Verified Registry ({reviews.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-8">
                    <TabsContent value="description" className="mt-0 focus-visible:outline-none">
                      <div className="space-y-8">
                        <div className="flex justify-end gap-3">
                          <AICopilotButton
                            label="Synthesize Vision"
                            loading={aiSummaryLoading}
                            onClick={handleGenerateAISummary}
                            variant="ghost"
                            className="text-[10px] font-black uppercase tracking-widest text-os-accent/60 hover:text-os-accent hover:bg-os-accent/5 px-4 py-2 rounded-full border border-os-accent/10 transition-all"
                          />
                        </div>
                        {aiSummary && (
                          <div className="bg-os-accent/5 border border-os-accent/10 rounded-2xl p-6 italic text-os-text-primary leading-relaxed shadow-inner">
                            {aiSummary}
                          </div>
                        )}
                        <div className="prose prose-os prose-lg max-w-none">
                          <p className="text-os-text-primary/80 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                            {aiDescription || product.description || product.short_description || 'Documentation pending.'}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="specifications" className="mt-0 focus-visible:outline-none">
                      {product.specifications ? (
                        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                          {Object.entries(product?.specifications || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-4 border-b border-os-stroke/20">
                              <span className="text-os-xs font-black uppercase tracking-widest text-os-text-secondary">{key}</span>
                              <span className="text-os-sm font-bold text-os-text-primary">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-os-text-secondary/40 font-mono uppercase tracking-widest text-xs">
                          No intelligence data recorded.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="packaging" className="mt-0 focus-visible:outline-none">
                      {/* Redesigned Logistics Blueprint */}
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Logistics Cards */}
                        <div className="p-6 rounded-2xl bg-os-bg border border-os-stroke/40 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="w-5 h-5 text-os-accent" />
                            <h4 className="text-os-xs font-black uppercase tracking-widest text-os-text-primary">Handling Standards</h4>
                          </div>
                          <p className="text-os-sm text-os-text-secondary leading-relaxed">{product.packaging_details || "Standard export packaging applied."}</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-os-bg border border-os-stroke/40 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-os-accent" />
                            <h4 className="text-os-xs font-black uppercase tracking-widest text-os-text-primary">Fulfillment Velocity</h4>
                          </div>
                          <p className="text-os-sm text-os-text-secondary font-bold">
                            {product.lead_time_min_days && product.lead_time_max_days
                              ? `${product.lead_time_min_days} - ${product.lead_time_max_days} Business Days`
                              : "Contact for specific lead window."}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            {/* RIGHT COLUMN: THE TRADE CONSOLE (4 cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-12 space-y-8">
              <Card className="border-none bg-os-surface-solid shadow-[0_32px_80px_rgba(0,0,0,0.06)] rounded-[32px] overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-os-accent to-transparent" />
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tighter text-os-text-primary leading-[1.1] group-hover:text-os-accent transition-colors duration-500">
                      {product.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3">
                      {product.categories && (
                        <div className="px-3 py-1 rounded-full bg-os-bg border border-os-stroke/40 text-[10px] font-black uppercase tracking-widest text-os-text-secondary">
                          {product.categories.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-os-text-secondary">
                        <MapPin className="w-3 h-3 text-os-accent" />
                        <span>{product.country_of_origin || supplier?.country || 'Origin Network'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TRADE METRICS GRID */}
                  <div className="grid grid-cols-1 gap-1 pt-6 border-t border-os-stroke/20">
                    <div className="p-4 rounded-2xl bg-os-accent/5 border border-os-accent/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-os-accent mb-2">Institutional Pricing</p>
                      <div className="flex items-baseline gap-2">
                        <PriceRange
                          min={product.price_min || product.price}
                          max={product.price_max || product.price}
                          fromCurrency={product.currency || 'USD'}
                          className="text-3xl font-black tracking-tighter text-os-text-primary"
                        />
                        <span className="text-os-xs font-bold text-os-text-secondary">/ {product.unit || 'unit'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      <div className="p-4 rounded-2xl border border-os-stroke/40 hover:bg-os-bg transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary mb-1">Batch Minimum</p>
                        <p className="text-os-sm font-bold text-os-text-primary">
                          {product.min_order_quantity || product.moq || '1'} {product.moq_unit || product.unit || 'units'}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl border border-os-stroke/40 hover:bg-os-bg transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary mb-1">Supply Power</p>
                        <p className="text-os-sm font-bold text-os-text-primary line-clamp-1">
                          {product.supply_ability_qty ? `${product.supply_ability_qty}/${product.supply_ability_unit || 'mo'}` : 'Scale on Request'}
                        </p>
                      </div>

                      {/* Listing Quality Indicator - Completeness Score */}
                      {typeof product.completeness_score === 'number' && (
                        <div className="p-4 rounded-2xl border border-os-stroke/40 bg-os-bg col-span-2 mt-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary mb-2">
                            Listing Completeness
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-os-stroke/20 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-500 rounded-full",
                                  product.completeness_score >= 70 ? "bg-os-green" :
                                    product.completeness_score >= 40 ? "bg-os-accent" :
                                      "bg-os-text-secondary/40"
                                )}
                                style={{ width: `${Math.min(product.completeness_score, 100)}%` }}
                              />
                            </div>
                            <span className="text-os-sm font-bold text-os-text-primary min-w-[3ch]">
                              {product.completeness_score}%
                            </span>
                          </div>
                          {product.completeness_score < 40 && (
                            <p className="text-[9px] text-os-text-secondary/60 mt-2 italic">
                              Supplier completing verification (Quote requests available at 40%+)
                            </p>
                          )}
                          {product.completeness_score >= 70 && (
                            <p className="text-[9px] text-os-green/80 mt-2 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Institutional-grade listing quality
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TRADE EXECUTION ACTIONS - INSTITUTIONAL HIERARCHY */}
                  <div className="space-y-3 pt-4">
                    {/* PRIMARY: Direct Sourcing (unchanged - stays dominant) */}
                    <Button
                      onClick={handleBuyNow}
                      className="w-full bg-os-accent hover:bg-os-accent/90 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap className="w-5 h-5" />
                      Initiate Direct Sourcing
                    </Button>

                    {/* SECONDARY: Request Quote (conditional + toned down) */}
                    {product.completeness_score >= MIN_COMPLETENESS_FOR_RFQ ? (
                      <Button
                        onClick={handleCreateRFQ}
                        variant="ghost"
                        className="w-full border border-os-stroke/40 hover:border-os-accent/30 hover:bg-os-accent/5 text-os-text-primary font-medium text-sm h-12 rounded-xl transition-all"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Request Quote
                      </Button>
                    ) : (
                      <div className="w-full p-4 bg-os-stroke/5 border border-os-stroke/20 rounded-xl text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-os-text-secondary/40">
                          Quote Requests Pending
                        </p>
                        <p className="text-[9px] text-os-text-secondary/60 mt-1">
                          Supplier completing listing ({product.completeness_score}% done, need 40%)
                        </p>
                      </div>
                    )}

                    {/* TERTIARY: Utilities (text links, not buttons) */}
                    <div className="pt-4 flex items-center justify-center gap-6 border-t border-os-stroke/20">
                      <SaveButton itemId={product.id} itemType="product" variant="ghost" size="sm" />
                      <div className="w-px h-4 bg-os-stroke/40" />
                      <button
                        onClick={handleContactSupplier}
                        className="text-[10px] font-medium uppercase tracking-wider text-os-text-secondary/60 hover:text-os-accent transition-colors"
                      >
                        Contact Supplier
                      </button>
                    </div>
                  </div>

                  <OffPlatformDisclaimerCompact className="opacity-40 hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>

              {/* SUPPLIER PASSPORT */}
              {supplier && (
                <Card className="border-none bg-os-bg shadow-sm rounded-[32px] overflow-hidden group hover:shadow-os-md transition-all duration-700">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-os-stroke/40 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                        {supplier.logo_url && !logoError ? (
                          <img src={supplier.logo_url} className="w-full h-full object-cover" width="64" height="64" loading="lazy" onError={() => setLogoError(true)} />
                        ) : (
                          <Building className="w-8 h-8 text-os-text-secondary/20" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link to={`/business/${supplier.id}`} className="block group/link">
                          <h4 className="text-lg font-black tracking-tight text-os-text-primary group-hover/link:text-os-accent transition-colors">
                            {supplier.company_name}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-os-accent" />
                          <span className="text-os-xs font-bold text-os-text-secondary">{supplier.country}</span>
                        </div>

                        {/* AfCFTA Trade Readiness */}
                        {supplier?.afcfta_ready && (
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                                          bg-os-blue/10 border border-os-blue/30
                                          text-[10px] font-black uppercase tracking-widest text-os-blue">
                            <Globe className="w-3.5 h-3.5" />
                            <span>AfCFTA Compliant</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trust Score Display */}
                    {supplier.trust_score && (
                      <div className="pt-3 border-t border-os-stroke/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-os-text-secondary/40">
                            Trust Score
                          </span>
                          <span className="text-os-sm font-bold text-os-text-primary">
                            {supplier.trust_score}%
                          </span>
                        </div>
                        <div className="flex-1 h-2 bg-os-stroke/20 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              supplier.trust_score >= 80 ? "bg-os-green" :
                                supplier.trust_score >= 50 ? "bg-os-accent" :
                                  "bg-os-text-secondary/40"
                            )}
                            style={{ width: `${supplier.trust_score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleContactSupplier}
                      variant="ghost"
                      className="w-full border border-os-stroke/40 hover:bg-white text-os-xs font-black uppercase tracking-widest h-12 rounded-xl transition-all"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Establish Communication
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* INSTITUTIONAL RECOMMENDATIONS */}
        <div className="max-w-screen-2xl mx-auto px-6 pb-24 border-t border-os-stroke/20 pt-24">
          {aiRecommendations.length > 0 ? (
            <section>
              <h2 className="text-os-base font-black uppercase tracking-[0.4em] text-os-text-secondary mb-12 text-center">Curated Trade Intelligence</h2>
              <ProductRecommendations
                productId={product.id}
                currentUserId={user?.id}
                currentCompanyId={user?.company_id}
              />
            </section>
          ) : similarProducts.length > 0 ? (
            <section>
              <h2 className="text-os-base font-black uppercase tracking-[0.4em] text-os-text-secondary mb-12 text-center text-os-accent">Similar Infrastructure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {similarProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ) : recommendedProducts.length > 0 && (
            <section>
              <h2 className="text-os-base font-black uppercase tracking-[0.4em] text-os-text-secondary mb-12 text-center">Recommended for Your Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommendedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>

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

        {/* Quick Quote Modal */}
        {product && supplier && (
          <QuickQuoteModal
            open={showQuickQuoteModal}
            onOpenChange={setShowQuickQuoteModal}
            product={product}
            supplier={supplier}
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

