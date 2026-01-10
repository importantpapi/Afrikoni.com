import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Upload, X, Sparkles, Lightbulb, Image, FileText, DollarSign, Shield, TrendingUp } from 'lucide-react';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import SmartImageUploader from '@/components/products/SmartImageUploader';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { validateNumeric, sanitizeString } from '@/utils/security';
import { useLanguage } from '@/i18n/LanguageContext';
import { checkProductLimit } from '@/utils/subscriptionLimits';
import ProductLimitGuard from '@/components/subscription/ProductLimitGuard';

export default function AddProduct() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLimitGuard, setShowLimitGuard] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    images: [],
    price: '',
    moq: '',
    unit: 'pieces',
    delivery_time: '',
    packaging: '',
    currency: 'USD',
    status: 'active'
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[AddProduct] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const catsRes = await supabase.from('categories').select('*');

      if (catsRes.error) throw catsRes.error;

      setCategories(catsRes.data || []);

      // Get or create company (non-blocking)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = profile?.company_id || await getOrCreateCompany(supabase, user);
      
      if (cid) {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', cid)
          .maybeSingle();
        if (!error && companyData) {
          setCompany(companyData);
        }
      }
      // Continue even without company - don't block
    } catch (error) {
      // Error logged (removed for production)
      supabaseHelpers.auth.redirectToLogin();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Images are now handled by SmartImageUploader component
  const handleImagesChange = (newImages) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      toast.error('Please enter a product title first.');
      return;
    }
    setIsGenerating(true);
    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      const result = await AIDescriptionService.generateProductDescription({
        title: formData.title,
        category: selectedCategory?.name,
        country: company?.country
      });
      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.optimized_title || prev.title,
          description: `${result.full_description}\n\n**Key Selling Points:**\n${result.selling_points.map(p => `- ${p}`).join('\n')}`
        }));
        toast.success(t('addProduct.generateSuccess') || 'AI description generated!');
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error(t('addProduct.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.moq) {
      toast.error(t('addProduct.fillRequired'));
      return;
    }
    
    // Security: Validate and sanitize inputs
    const price = validateNumeric(formData.price, { min: 0 });
    const moq = validateNumeric(formData.moq, { min: 1 });
    
    if (price === null || price <= 0) {
      toast.error(t('addProduct.validPrice'));
      return;
    }
    
    if (moq === null || moq < 1) {
      toast.error(t('addProduct.validMOQ'));
      return;
    }
    
    setIsLoading(true);
    try {
      // Get or create company (always from authenticated user)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const cid = companyId || await getOrCreateCompany(supabase, user);
      
      if (!cid) {
        toast.error(t('addProduct.noCompany'));
        setIsLoading(false);
        return;
      }

      // Check product limit before creating
      const limitInfo = await checkProductLimit(cid);
      if (!limitInfo.canAdd) {
        if (limitInfo.needsUpgrade) {
          setShowLimitGuard(true);
          toast.error(limitInfo.message || 'Product limit reached. Please upgrade your plan.');
        } else {
          toast.error(limitInfo.message || 'Cannot add more products');
        }
        setIsLoading(false);
        return;
      }
      
      // Security: Sanitize text inputs
      const { data: newProduct, error } = await supabase.from('products').insert({
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description),
        category_id: formData.category_id, // UUID validated by RLS
        images: formData.images || [],
        price: price,
        price_min: price,
        min_order_quantity: moq,
        moq: moq,
        unit: sanitizeString(formData.unit || 'pieces'),
        delivery_time: sanitizeString(formData.delivery_time || ''),
        packaging: sanitizeString(formData.packaging || ''),
        currency: formData.currency || 'USD',
        status: 'draft', // New products start as draft, admin can activate later
        company_id: cid, // Always from authenticated user, never from input
        views: 0,
        inquiries: 0
      }).select('id').single();
      
      if (error) throw error;
      
      // Save images to product_images table
      if (newProduct?.id && formData.images && formData.images.length > 0) {
        const imageRecords = formData.images.map((img, index) => ({
          product_id: newProduct.id,
          url: typeof img === 'string' ? img : img.url || img,
          alt_text: formData.title || 'Product image',
          is_primary: img.is_primary || index === 0,
          sort_order: img.sort_order !== undefined ? img.sort_order : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('Error saving product images:', imagesError);
          // Don't fail the whole operation, just log it
        }
      }
      
      toast.success(t('addProduct.success'));
      setTimeout(() => {
        navigate(`/product?id=${newProduct.id}&from=seller_create`);
      }, 1000);
    } catch (error) {
      // Error logged (removed for production)
      toast.error(t('addProduct.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Intro Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">{t('addProduct.title')}</h1>
          <p className="text-base sm:text-lg text-afrikoni-deep max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            {t('addProduct.subtitle')}
          </p>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                    <span className="text-afrikoni-creamfont-bold text-xl">+</span>
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">{t('addProduct.reachBuyers')}</h3>
                <p className="text-sm text-afrikoni-deep">{t('addProduct.reachBuyersDesc')}</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-afrikoni-cream" />
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">{t('addProduct.secureTransactions')}</h3>
                <p className="text-sm text-afrikoni-deep">{t('addProduct.secureTransactionsDesc')}</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-afrikoni-cream" />
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">{t('addProduct.boostSales')}</h3>
                <p className="text-sm text-afrikoni-deep">{t('addProduct.boostSalesDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mb-6 text-center space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">{t('addProduct.productDetails')}</h2>
            <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
              {t('addProduct.productDetailsDesc')}
            </p>
          </div>
          {/* Simple guidance strip */}
          <Card className="border-afrikoni-gold/25 bg-white/90 text-left">
            <CardContent className="p-4 md:p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs md:text-sm text-afrikoni-text-dark">
                <Shield className="w-4 h-4 text-afrikoni-gold" />
                <span className="font-semibold">{t('addProduct.tipTitle')}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-[11px] md:text-xs text-afrikoni-text-dark/80">
                <p>{t('addProduct.tip1')}</p>
                <p>{t('addProduct.tip2')}</p>
                <p>{t('addProduct.tip3')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base">{t('addProduct.productTitle')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('addProduct.productNamePlaceholder')}
                  className="text-sm sm:text-base min-h-[44px] sm:min-h-0 mt-1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label htmlFor="description" className="text-sm sm:text-base">{t('addProduct.description')}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.title}
                    className="flex items-center gap-1 text-xs sm:text-sm border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10 min-h-[36px] sm:min-h-0"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isGenerating ? t('addProduct.generating') : t('addProduct.letAiHelp')}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('addProduct.descriptionPlaceholder')}
                  rows={4}
                  className="text-sm sm:text-base min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">{t('addProduct.category')}</Label>
                <Select value={formData.category_id} onValueChange={(v) => handleChange('category_id', v)}>
                  <SelectTrigger className="min-h-[44px] sm:min-h-0 text-sm sm:text-base mt-1">
                    <SelectValue placeholder={t('addProduct.selectCategoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country" className="text-sm sm:text-base">Country *</Label>
                <Input
                  id="country"
                  value={company?.country || ''}
                  placeholder="Enter country"
                  disabled
                  className="text-sm sm:text-base min-h-[44px] sm:min-h-0 mt-1"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm sm:text-base">{t('addProduct.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder={t('addProduct.pricePlaceholder')}
                    className="text-sm sm:text-base min-h-[44px] sm:min-h-0 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-sm sm:text-base">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                    <SelectTrigger className="min-h-[44px] sm:min-h-0 text-sm sm:text-base mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="moq" className="text-sm sm:text-base">Minimum Order Quantity *</Label>
                  <Input
                    id="moq"
                    type="number"
                    value={formData.moq || '1'}
                    onChange={(e) => handleChange('moq', e.target.value)}
                    placeholder="1"
                    className="text-sm sm:text-base min-h-[44px] sm:min-h-0 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="available" className="text-sm sm:text-base">Available Quantity</Label>
                  <Input
                    id="available"
                    type="number"
                    placeholder="Enter available quantity"
                    className="text-sm sm:text-base min-h-[44px] sm:min-h-0 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger className="min-h-[44px] sm:min-h-0 text-sm sm:text-base mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="images" className="text-sm sm:text-base mb-2 block">
                  Product Images {formData.images.length > 0 && <span className="text-afrikoni-deep/70 font-normal">({formData.images.length}/5)</span>}
                </Label>
                <SmartImageUploader
                  images={formData.images}
                  onImagesChange={handleImagesChange}
                  userId={user?.id}
                  maxImages={5}
                  maxSizeMB={5}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-afrikoni-gold/20">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('SellerDashboard'))}
                className="flex-1 min-h-[44px] sm:min-h-0 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || uploadingImages}
                className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream min-h-[44px] sm:min-h-0 text-sm sm:text-base touch-manipulation"
              >
                {isLoading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-afrikoni-chestnut">Success Tips</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Image className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">High-Quality Images</h3>
                <p className="text-sm text-afrikoni-deep">Upload clear, professional photos from multiple angles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">Detailed Descriptions</h3>
                <p className="text-sm text-afrikoni-deep">Include specifications, materials, and use cases.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-afrikoni-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">Competitive Pricing</h3>
                <p className="text-sm text-afrikoni-deep">Research market prices and offer fair rates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Limit Guard */}
      {showLimitGuard && companyId && (
        <ProductLimitGuard
          companyId={companyId}
          onUpgrade={() => {
            setShowLimitGuard(false);
            navigate('/dashboard/subscriptions');
          }}
        />
      )}
    </div>
  );
}

