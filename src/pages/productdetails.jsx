import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { addToViewHistory, getViewHistory } from '@/utils/viewHistory';
import { getSimilarProducts } from '@/utils/recommendations';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import { trackProductView } from '@/lib/supabaseQueries/products';
import SaveButton from '@/components/shared/ui/SaveButton';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import {
  Package, MapPin, Star, Shield, ShieldCheck, Building, MessageCircle,
  FileText, CheckCircle, Clock, Zap, Award, Globe, ChevronLeft, ChevronRight,
  Send, ChevronDown, ChevronUp, Truck, RotateCcw, Lock, HelpCircle, Plus, X, PenTool
} from 'lucide-react';
import QuickQuoteModal from '@/components/products/QuickQuoteModal';
import { SampleOrderButton } from '@/components/products/SampleOrderButton';
import ShippingCalculator from '@/components/shipping/ShippingCalculator';
import { toast } from 'sonner';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import ReviewList from '@/components/reviews/ReviewList';
import SEO from '@/components/SEO';
import ProductSchema from '@/components/ProductSchema';
import { useAnalytics } from '@/hooks/useAnalytics';
import { isValidUUID } from '@/utils/security';
import { cn } from '@/lib/utils';
import ProductVariants from '@/components/products/ProductVariants';
import BulkPricingTiers from '@/components/products/BulkPricingTiers';
import { useLanguage } from '@/i18n/LanguageContext';
import { OffPlatformDisclaimerCompact } from '@/components/OffPlatformDisclaimer';
import Breadcrumb from '@/components/shared/ui/Breadcrumb';
import Price, { PriceRange } from '@/components/shared/ui/Price';
import MobileStickyCTA from '@/components/shared/ui/MobileStickyCTA';
import { createTrade, TRADE_STATE } from '@/services/tradeKernel';
import { getPrimaryImageFromProduct, getAllImagesFromProduct } from '@/utils/productImages';

export default function ProductDetail() {
  const { user, profile, authReady } = useAuth();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showQuickQuoteModal, setShowQuickQuoteModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const navigate = useNavigate();
  const { trackPageView } = useAnalytics();

  const MIN_COMPLETENESS_FOR_RFQ = 40;

  useEffect(() => {
    setLogoError(false);
  }, [supplier?.logo_url]);

  useEffect(() => {
    loadData();
    trackPageView('Product Details');
  }, []);

  const loadData = async () => {
    const pathParts = window.location.pathname.split('/');
    const slugOrId = pathParts[pathParts.length - 1];
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || slugOrId;

    if (!productId) {
      toast.error('Product not found');
      navigate(`/${language}/marketplace`);
      return;
    }

    try {
      let query = supabase.from('products').select('*');
      if (isValidUUID(productId)) {
        query = query.eq('id', productId);
      } else {
        query = query.eq('slug', productId);
      }

      const { data: foundProduct, error: productError } = await query.single();

      if (productError || !foundProduct) {
        toast.error('Product not found');
        navigate(`/${language}/marketplace`);
        return;
      }

      if (foundProduct.status !== 'active') {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', authUser.id).single();
          const isOwner = foundProduct.company_id === prof?.company_id || foundProduct.supplier_id === prof?.company_id;
          if (!isOwner) {
            toast.error('Product not found');
            navigate(`/${language}/marketplace`);
            return;
          }
        } else {
          toast.error('Product not found');
          navigate(`/${language}/marketplace`);
          return;
        }
      }

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

      const productWithJoins = {
        ...foundProduct,
        categories: categoriesRes.data ? [categoriesRes.data] : [],
        product_images: imagesRes.data || [],
        companies: companiesRes.data || null,
        product_variants: variantsRes.data || []
      };

      const primaryImage = getPrimaryImageFromProduct(productWithJoins);
      const allImages = getAllImagesFromProduct(productWithJoins);

      setProduct({
        ...productWithJoins,
        primaryImage: primaryImage || null,
        allImages: allImages.length > 0 ? allImages : []
      });

      if (variantsRes.data?.length > 0) setVariants(variantsRes.data);

      await supabase.from('products').update({ views: (foundProduct.views || 0) + 1 }).eq('id', foundProduct.id);

      addToViewHistory(foundProduct.id, 'product', {
        title: foundProduct.name,
        category_id: foundProduct.category_id,
        country: foundProduct.country_of_origin,
        price: foundProduct.price_min || foundProduct.price
      });

      if (user?.id) {
        trackProductView(foundProduct.id, { profile_id: user.id, source_page: 'product_detail' }).catch(() => { });
      }

      const similarityRes = await supabase
        .from('products').select('*').eq('status', 'active')
        .eq('category_id', foundProduct.category_id).neq('id', foundProduct.id).limit(8);
      if (similarityRes.data) setSimilarProducts(getSimilarProducts(foundProduct, similarityRes.data));

      const supplierId = foundProduct.supplier_id || foundProduct.company_id;
      if (supplierId) {
        const [suppRes, reviewsRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', supplierId).single(),
          supabase.from('reviews').select('*').eq('product_id', foundProduct.id).order('created_at', { ascending: false })
        ]);
        if (suppRes.data) setSupplier(suppRes.data);
        if (reviewsRes.data) setReviews(reviewsRes.data);
      }

      try {
        const { data: qData } = await supabase
          .from('product_questions')
          .select('*, profiles!asked_by(full_name, avatar_url)')
          .eq('product_id', foundProduct.id)
          .order('created_at', { ascending: false });
        if (qData) setQuestions(qData);
      } catch { /* table may not exist yet */ }

    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupplier = () => {
    if (!user) {
      navigate(`/${language}/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=message`);
      return;
    }
    setShowMessageDialog(true);
  };

  const handleCreateRFQ = () => {
    if (!user) {
      navigate(`/${language}/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=rfq`);
      return;
    }
    navigate(`/${language}/dashboard/rfqs/new?product=${product.id}`);
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate(`/${language}/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=buy`);
      return;
    }
    navigate(`/${language}/checkout?product=${product.id}`);
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;
    if (!user) {
      navigate(`/${language}/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=question`);
      return;
    }
    setSubmittingQuestion(true);
    try {
      const { data, error } = await supabase.from('product_questions').insert({
        product_id: product.id,
        asked_by: user.id,
        question: newQuestion.trim(),
        answer: null,
        answered_by: null
      }).select('*, profiles(full_name, avatar_url)').single();
      if (!error && data) {
        setQuestions(prev => [data, ...prev]);
        setNewQuestion('');
        toast.success('Question submitted!');
      }
    } catch {
      toast.error('Failed to submit question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);
    try {
      const { error } = await supabase.from('product_questions').update({
        answer: answerText.trim(),
        answered_by: user.id,
        answered_at: new Date().toISOString()
      }).eq('id', questionId);
      if (!error) {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answer: answerText.trim() } : q));
        setAnsweringId(null);
        setAnswerText('');
        toast.success('Answer posted!');
      }
    } catch {
      toast.error('Failed to post answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const isSupplier = supplier && ((user?.company_id === supplier.id) || (profile?.company_id === supplier.id));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-os-accent/20 border-t-os-accent animate-spin" />
          <p className="text-sm text-os-text-secondary">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.allImages || [];
  const currentImage = images[selectedImageIdx] || product.primaryImage;

  return (
    <>
      <SEO
        lang={language}
        title={product.title ? `${product.title} – ${product.country_of_origin || supplier?.country || 'African'} Supplier | AFRIKONI` : 'Product | AFRIKONI'}
        description={product.description?.substring(0, 160) || `Buy ${product.title} from verified African suppliers on AFRIKONI.`}
        url={`/product/${product.id}`}
      />
      <ProductSchema product={product} />

      <div className="min-h-screen bg-os-bg">
        {/* Breadcrumb */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6">
          <Breadcrumb
            items={[
              { path: `/${language}`, label: 'Home' },
              { path: `/${language}/marketplace`, label: 'Marketplace' },
              { path: `/${language}/product/${product.id}`, label: product.title }
            ]}
            className="mb-6 text-sm"
          />
        </div>

        {/* MAIN PRODUCT SECTION */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT: IMAGE GALLERY (5 cols) ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-6">
                {/* Main Image */}
                <div className="relative bg-os-surface-solid rounded-2xl overflow-hidden border border-os-stroke aspect-square mb-3">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-os-text-secondary/20" />
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIdx(i => Math.max(0, i - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-os-surface-solid border border-os-stroke shadow-sm flex items-center justify-center hover:bg-os-accent/10 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIdx(i => Math.min(images.length - 1, i + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-os-surface-solid border border-os-stroke shadow-sm flex items-center justify-center hover:bg-os-accent/10 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="absolute top-3 right-3">
                    <SaveButton itemId={product.id} itemType="product" variant="ghost" size="sm" />
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={cn(
                          "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                          idx === selectedImageIdx
                            ? "border-os-accent shadow-sm"
                            : "border-os-stroke hover:border-os-accent/50"
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER: PRODUCT INFO (4 cols) ── */}
            <div className="lg:col-span-4 space-y-6">
              {/* Title & Badges */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories?.[0]?.name && (
                    <Badge variant="outline" className="text-xs">{product.categories[0].name}</Badge>
                  )}
                  {product.is_standardized && (
                    <Badge className="bg-os-accent/10 text-os-accent border-os-accent/20 text-xs">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified Listing
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold leading-snug text-os-text-primary mb-3">
                  {product.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-os-text-secondary">
                  {avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-os-text-primary">{avgRating}</span>
                      <span>({reviews.length} reviews)</span>
                    </div>
                  )}
                  {product.views > 0 && (
                    <span>{product.views.toLocaleString()} views</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="p-4 bg-os-accent/5 border border-os-accent/15 rounded-xl">
                <p className="text-xs text-os-text-secondary mb-1 font-medium uppercase tracking-wide">Price</p>
                <div className="flex items-baseline gap-2">
                  <PriceRange
                    min={product.price_min || product.price}
                    max={product.price_max || product.price}
                    fromCurrency={product.currency || 'USD'}
                    className="text-3xl font-bold text-os-accent"
                  />
                  <span className="text-sm text-os-text-secondary">/ {product.unit || 'unit'}</span>
                </div>
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-os-surface-solid border border-os-stroke">
                  <p className="text-xs text-os-text-secondary mb-1">Min. Order</p>
                  <p className="font-semibold text-sm">
                    {product.min_order_quantity || product.moq || '1'} {product.moq_unit || product.unit || 'units'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-os-surface-solid border border-os-stroke">
                  <p className="text-xs text-os-text-secondary mb-1">Lead Time</p>
                  <div className="text-sm font-semibold">
                    {product.lead_time_min_days && product.lead_time_max_days ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-os-text-secondary">
                          <span>1 - {product.min_order_quantity || product.moq || 100} units</span>
                          <span>{product.lead_time_min_days} days</span>
                        </div>
                        <div className="flex justify-between text-xs text-os-text-secondary">
                          <span>&gt; {product.min_order_quantity || product.moq || 100} units</span>
                          <span>To be negotiated</span>
                        </div>
                      </div>
                    ) : 'Contact supplier'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-os-surface-solid border border-os-stroke">
                  <p className="text-xs text-os-text-secondary mb-1">Origin</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-os-accent shrink-0" />
                    <p className="font-semibold text-sm truncate">
                      {product.country_of_origin || supplier?.country || '—'}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-os-surface-solid border border-os-stroke">
                  <p className="text-xs text-os-text-secondary mb-1">Supply Capacity</p>
                  <p className="font-semibold text-sm">
                    {product.supply_ability_qty
                      ? `${product.supply_ability_qty}/${product.supply_ability_unit || 'mo'}`
                      : 'On request'}
                  </p>
                </div>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="p-4 bg-os-surface-solid rounded-xl border border-os-stroke">
                  <ProductVariants
                    variants={variants}
                    onVariantSelect={setSelectedVariant}
                    selectedVariantId={selectedVariant?.id}
                  />
                </div>
              )}

              {/* Bulk Pricing */}
              <BulkPricingTiers product={selectedVariant || product} />

              {/* Certifications & Customization */}
              <div className="space-y-4">
                {product.certifications?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-os-text-secondary uppercase tracking-wide mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, idx) => (
                        <div key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-os-accent/5 border border-os-accent/20 rounded-full text-xs font-medium text-os-accent">
                          <Award className="w-3 h-3" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-os-surface-solid border border-os-stroke rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-os-accent/5 rounded-lg shrink-0">
                    <PenTool className="w-4 h-4 text-os-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-os-text-primary uppercase tracking-wide mb-1">Customization</p>
                    <p className="text-xs text-os-text-secondary leading-relaxed">
                      Customized logo (Min. 50 pieces) • Graphic customization (Min. 50 pieces) • Custom packaging (Min. 100 pieces)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: TRADE CONSOLE (3 cols, sticky) ── */}
            <div className="lg:col-span-3">
              <div className="sticky top-6 space-y-4">
                {/* CTA Card */}
                <div className="bg-os-surface-solid rounded-2xl border border-os-stroke shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-os-accent to-os-accent/30" />
                  <div className="p-5 space-y-3">
                    <Button
                      onClick={handleBuyNow}
                      className="w-full bg-os-accent hover:bg-os-accent/90 text-white font-semibold h-12 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Start Order
                    </Button>

                    {(product.completeness_score == null || product.completeness_score >= MIN_COMPLETENESS_FOR_RFQ) ? (
                      <Button
                        onClick={handleCreateRFQ}
                        variant="outline"
                        className="w-full h-11 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Request Quote (RFQ)
                      </Button>
                    ) : (
                      <p className="text-xs text-center text-os-text-secondary py-2">
                        Quote requests available once listing is complete ({product.completeness_score}% / 40% needed)
                      </p>
                    )}

                    <Button
                      onClick={handleContactSupplier}
                      variant="ghost"
                      className="w-full h-11 rounded-xl font-medium border border-os-stroke flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat with Supplier
                    </Button>

                    <div className="pt-2 border-t border-os-stroke/50">
                      <SampleOrderButton
                        product={product}
                        supplier={supplier}
                        variant="secondary"
                        size="default"
                        className="w-full h-11 rounded-xl font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade Protection */}
                <div className="bg-os-surface-solid rounded-2xl border border-os-stroke p-4 space-y-3">
                  <p className="text-xs font-semibold text-os-text-primary uppercase tracking-wide">Afrikoni Trade Protection</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: Lock, label: 'Secure Payments', desc: 'Escrow-protected transactions' },
                      { icon: RotateCcw, label: 'Dispute Resolution', desc: 'Mediated by Afrikoni team' },
                      { icon: Shield, label: 'Verified Supplier', desc: 'KYB-checked business' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-os-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-os-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-os-text-primary">{label}</p>
                          <p className="text-xs text-os-text-secondary">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplier Card */}
                {supplier && (
                  <div className="bg-os-surface-solid rounded-2xl border border-os-stroke p-4">
                    <p className="text-xs font-semibold text-os-text-secondary uppercase tracking-wide mb-3">Supplier</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-os-bg border border-os-stroke flex items-center justify-center overflow-hidden shrink-0">
                        {supplier.logo_url && !logoError ? (
                          <img src={supplier.logo_url} className="w-full h-full object-cover" alt="" onError={() => setLogoError(true)} />
                        ) : (
                          <Building className="w-6 h-6 text-os-text-secondary/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link to={`/${language}/business/${supplier.id}`} className="font-semibold text-sm hover:text-os-accent transition-colors truncate block">
                          {supplier.company_name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-os-text-secondary">
                          <MapPin className="w-3 h-3" />
                          <span>{supplier.country}</span>
                        </div>
                      </div>
                    </div>
                    {supplier.trust_score && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-os-text-secondary">Trust Score</span>
                          <span className="font-semibold">{supplier.trust_score}%</span>
                        </div>
                        <div className="h-1.5 bg-os-stroke rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", supplier.trust_score >= 80 ? "bg-emerald-500" : supplier.trust_score >= 50 ? "bg-os-accent" : "bg-os-text-secondary/40")}
                            style={{ width: `${supplier.trust_score}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {supplier.kyb_status === 'verified' && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Business Verified</span>
                      </div>
                    )}
                    {supplier.afcfta_ready && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>AfCFTA Compliant</span>
                      </div>
                    )}
                  </div>
                )}

                <OffPlatformDisclaimerCompact className="opacity-60" />
              </div>
            </div>
          </div>

          {/* ── TABS: Description, Specs, Shipping, Reviews ── */}
          <div className="mt-12 bg-os-surface-solid rounded-2xl border border-os-stroke overflow-hidden">
            <Tabs defaultValue="description">
              <div className="border-b border-os-stroke px-6 pt-2">
                <TabsList className="w-full justify-start bg-transparent h-auto gap-0 p-0">
                  {[
                    { value: 'description', label: 'Description' },
                    { value: 'specifications', label: 'Specifications' },
                    { value: 'shipping', label: 'Shipping & Packaging' },
                    { value: 'reviews', label: `Reviews (${reviews.length})` },
                    { value: 'qa', label: `Q&A (${questions.length})` },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:text-os-accent data-[state=active]:border-b-2 data-[state=active]:border-os-accent border-b-2 border-transparent rounded-none px-5 py-4 text-sm font-medium text-os-text-secondary transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-8">
                {/* Description */}
                <TabsContent value="description" className="mt-0 focus-visible:outline-none">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-os-text-primary leading-relaxed whitespace-pre-wrap text-base">
                      {product.description || product.short_description || 'No description provided.'}
                    </p>
                  </div>
                  {product.is_standardized && (
                    <div className="mt-6 p-4 bg-os-accent/5 border border-os-accent/15 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-os-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Verified Listing</p>
                          <p className="text-sm text-os-text-secondary">
                            This listing has been reviewed by Afrikoni's team. Production capacity, certifications, and lead times have been validated.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Specifications */}
                <TabsContent value="specifications" className="mt-0 focus-visible:outline-none">
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <div className="divide-y divide-os-stroke">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-3 gap-4">
                          <span className="text-sm text-os-text-secondary font-medium capitalize">{key}</span>
                          <span className="text-sm font-semibold text-os-text-primary text-right">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Package className="w-10 h-10 text-os-text-secondary/20 mx-auto mb-3" />
                      <p className="text-sm text-os-text-secondary">No specifications listed yet.</p>
                      {isSupplier && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(`/${language}/dashboard/products`)}>
                          Add Specifications
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Shipping */}
                <TabsContent value="shipping" className="mt-0 focus-visible:outline-none space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl bg-os-bg border border-os-stroke">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-os-accent" />
                        <h4 className="font-semibold text-sm">Packaging</h4>
                      </div>
                      <p className="text-sm text-os-text-secondary leading-relaxed">
                        {product.packaging_details || 'Standard export packaging. Contact supplier for custom packaging options.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-os-bg border border-os-stroke">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-os-accent" />
                        <h4 className="font-semibold text-sm">Lead Time</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm border-b border-os-stroke pb-1">
                          <span className="text-os-text-secondary">Quantity ({product.unit || 'units'})</span>
                          <span className="text-os-text-secondary">Est. Time (days)</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>1 - {product.min_order_quantity ? product.min_order_quantity * 5 : 500}</span>
                          <span>{product.lead_time_min_days || 7}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>&gt; {product.min_order_quantity ? product.min_order_quantity * 5 : 500}</span>
                          <span>To be negotiated</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl bg-os-bg border border-os-stroke">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-5 h-5 text-os-accent" />
                        <h4 className="font-semibold text-sm">Shipping Methods</h4>
                      </div>
                      <p className="text-sm text-os-text-secondary">
                        {product.shipping_methods || 'Sea freight, Air freight, Express. Get a quote from the supplier.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-os-bg border border-os-stroke">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-5 h-5 text-os-accent" />
                        <h4 className="font-semibold text-sm">Export Markets</h4>
                      </div>
                      <p className="text-sm text-os-text-secondary">
                        {product.export_markets || supplier?.export_markets || 'Worldwide. Contact supplier to confirm your country.'}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Calculator */}
                  <div className="pt-6 border-t border-os-stroke">
                    <h3 className="text-lg font-bold mb-4">Calculate Approximate Shipping Cost</h3>
                    <ShippingCalculator
                      defaultOrigin={product.country_of_origin || supplier?.country}
                      defaultWeight="100"
                      compact={false}
                    />
                  </div>
                </TabsContent>

                {/* Reviews */}
                <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {/* Rating Summary */}
                      <div className="flex items-center gap-6 p-5 bg-os-bg rounded-xl border border-os-stroke">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-os-text-primary">{avgRating}</p>
                          <div className="flex items-center gap-0.5 justify-center mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={cn("w-4 h-4", parseFloat(avgRating) >= s ? "fill-amber-400 text-amber-400" : "text-os-stroke")} />
                            ))}
                          </div>
                          <p className="text-xs text-os-text-secondary mt-1">{reviews.length} reviews</p>
                        </div>
                      </div>
                      <ReviewList reviews={reviews} />
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Star className="w-10 h-10 text-os-text-secondary/20 mx-auto mb-3" />
                      <p className="text-sm text-os-text-secondary">No reviews yet. Be the first to review after your purchase.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Q&A */}
                <TabsContent value="qa" className="mt-0 focus-visible:outline-none">
                  <div className="space-y-6">
                    {/* Ask a question */}
                    <div className="p-5 bg-os-bg rounded-xl border border-os-stroke">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-os-accent" />
                        Ask the Supplier a Question
                      </h4>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newQuestion}
                          onChange={e => setNewQuestion(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSubmitQuestion()}
                          placeholder="e.g. Can you do custom labeling? What's the MOQ for samples?"
                          className="flex-1 h-10 px-4 rounded-lg border border-os-stroke bg-os-surface-solid text-sm focus:outline-none focus:ring-2 focus:ring-os-accent/30 focus:border-os-accent"
                        />
                        <Button
                          onClick={handleSubmitQuestion}
                          disabled={submittingQuestion || !newQuestion.trim()}
                          className="bg-os-accent hover:bg-os-accent/90 text-white h-10 px-4 rounded-lg"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Questions list */}
                    {questions.length === 0 ? (
                      <div className="py-8 text-center">
                        <HelpCircle className="w-10 h-10 text-os-text-secondary/20 mx-auto mb-3" />
                        <p className="text-sm text-os-text-secondary">No questions yet. Ask the supplier anything!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {questions.map(q => (
                          <div key={q.id} className="border border-os-stroke rounded-xl overflow-hidden">
                            {/* Question */}
                            <div className="p-4 bg-os-bg">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-os-accent/10 flex items-center justify-center shrink-0 text-xs font-bold text-os-accent">
                                  {q.profiles?.full_name?.[0]?.toUpperCase() || 'B'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-os-text-primary">
                                      {q.profiles?.full_name || 'Buyer'}
                                    </span>
                                    <span className="text-xs text-os-text-secondary">
                                      {q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}
                                    </span>
                                  </div>
                                  <p className="text-sm text-os-text-primary">{q.question}</p>
                                </div>
                              </div>
                            </div>

                            {/* Answer */}
                            {q.answer ? (
                              <div className="p-4 bg-os-accent/5 border-t border-os-stroke">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-os-accent flex items-center justify-center shrink-0">
                                    <Building className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-os-accent">Supplier Response</span>
                                    </div>
                                    <p className="text-sm text-os-text-primary">{q.answer}</p>
                                  </div>
                                </div>
                              </div>
                            ) : isSupplier ? (
                              <div className="p-4 border-t border-os-stroke">
                                {answeringId === q.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={answerText}
                                      onChange={e => setAnswerText(e.target.value)}
                                      placeholder="Type your answer..."
                                      className="flex-1 h-9 px-3 rounded-lg border border-os-stroke bg-os-surface-solid text-sm focus:outline-none focus:ring-2 focus:ring-os-accent/30 focus:border-os-accent"
                                    />
                                    <Button
                                      onClick={() => handleSubmitAnswer(q.id)}
                                      disabled={submittingAnswer || !answerText.trim()}
                                      size="sm"
                                      className="bg-os-accent text-white"
                                    >
                                      Post
                                    </Button>
                                    <Button
                                      onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => setAnsweringId(q.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-os-accent border-os-accent/30 hover:bg-os-accent/5"
                                  >
                                    Answer this question
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="px-4 py-3 border-t border-os-stroke bg-os-bg/50">
                                <p className="text-xs text-os-text-secondary italic">Awaiting supplier response...</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* ── SIMILAR PRODUCTS ── */}
          {similarProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold mb-6">Similar Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {similarProducts.slice(0, 8).map(p => {
                  const img = getPrimaryImageFromProduct(p);
                  return (
                    <Link
                      key={p.id}
                      to={`/${language}/product/${p.id}`}
                      className="group bg-os-surface-solid rounded-xl border border-os-stroke overflow-hidden hover:shadow-md hover:border-os-accent/30 transition-all"
                    >
                      <div className="aspect-square bg-os-bg overflow-hidden">
                        {img ? (
                          <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-os-text-secondary/20" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-os-accent transition-colors">{p.title}</p>
                        <p className="text-sm font-bold text-os-accent">
                          {p.price_min || p.price ? `$${p.price_min || p.price}` : 'Get Quote'}
                        </p>
                        {(p.min_order_quantity || p.moq) && (
                          <p className="text-xs text-os-text-secondary mt-0.5">MOQ: {p.min_order_quantity || p.moq} {p.unit || 'units'}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Recommendations fallback */}
          {similarProducts.length === 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold mb-6">Recommended for You</h2>
              <ProductRecommendations
                productId={product.id}
                currentUserId={user?.id}
                currentCompanyId={user?.company_id}
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
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

        {product && supplier && (
          <QuickQuoteModal
            open={showQuickQuoteModal}
            onOpenChange={setShowQuickQuoteModal}
            product={product}
            supplier={supplier}
          />
        )}

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
