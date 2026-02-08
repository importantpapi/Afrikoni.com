import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import {
  ArrowLeft, Send, Save, Loader2, Wand2,
  ChevronDown, ChevronUp, RefreshCw, X, Plus, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import ProductImageUploader from '@/components/products/ProductImageUploader';
import { sanitizeString } from '@/utils/security';
import { createProduct, updateProduct } from '@/services/productService';
import { AFRICAN_CURRENCIES, formatCurrency } from '@/utils/currencyConverter';
import { validateProductForm } from '@/utils/validation';

const MOQ_UNITS = ['pieces', 'kg', 'grams', 'liters', 'tons', 'containers', 'pallets', 'boxes', 'bags', 'units'];

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

const SHIPPING_TERMS = ['FOB', 'CIF', 'EXW', 'DDP', 'DAP', 'CFR', 'CPT'];

export default function QuickAddProduct() {
  const { profileCompanyId, userId, user, capabilities, canLoadData, isSystemReady } = useDashboardKernel();
  const { id: productId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category_id: '',
    country_of_origin: '',
    min_order_quantity: '',
    moq_unit: 'pieces',
    price_min: '',
    price_max: '',
    currency: 'USD',
    lead_time_min_days: '',
    lead_time_max_days: '',
    supply_ability_qty: '',
    supply_ability_unit: 'tons/month',
    packaging_details: '',
    shipping_terms: ['FOB'],
    specifications: {},
    certifications: [],
    images: [],
    status: 'draft',
    is_standardized: false,
  });

  // UI state
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!canLoadData) return;
    loadData();
  }, [canLoadData, profileCompanyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load product if editing
      if (productId && profileCompanyId) {
        await loadProductData(productId, profileCompanyId);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductData = async (id, companyId) => {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      toast.error('Product not found');
      navigate('/dashboard/products');
      return;
    }

    const productImages = (product.product_images || []).map(img => ({
      url: img.url,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      sort_order: img.sort_order
    }));

    let specs = {};
    if (product.specifications) {
      specs = typeof product.specifications === 'string'
        ? JSON.parse(product.specifications)
        : product.specifications;
    }

    const specFieldsArray = Object.entries(specs).map(([key, value]) => ({ key, value: String(value) }));
    if (specFieldsArray.length === 0) specFieldsArray.push({ key: '', value: '' });
    setSpecFields(specFieldsArray);

    setFormData({
      title: product.title || '',
      short_description: product.short_description || '',
      description: product.description || '',
      category_id: product.category_id || '',
      country_of_origin: product.country_of_origin || '',
      min_order_quantity: product.min_order_quantity || '',
      moq_unit: product.moq_unit || 'pieces',
      price_min: product.price_min || '',
      price_max: product.price_max || '',
      currency: product.currency || 'USD',
      lead_time_min_days: product.lead_time_min_days || '',
      lead_time_max_days: product.lead_time_max_days || '',
      supply_ability_qty: product.supply_ability_qty || '',
      supply_ability_unit: product.supply_ability_unit || 'tons/month',
      packaging_details: product.packaging_details || '',
      shipping_terms: product.shipping_terms || ['FOB'],
      specifications: specs,
      certifications: product.certifications || [],
      images: productImages,
      status: product.status || 'draft',
      is_standardized: product.is_standardized || false,
    });

    // Show details section when editing (user likely wants to see everything)
    setShowMoreDetails(true);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // AI Description Generator
  const handleGenerateAI = async () => {
    if (!formData.title?.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const { generateProductListing } = await import('@/ai/aiFunctions');
      const selectedCategory = categories.find(c => c.id === formData.category_id);

      const { success, data } = await generateProductListing({
        title: formData.title,
        description: formData.description,
        category: selectedCategory?.name,
        country: formData.country_of_origin,
        specifications: formData.specifications,
        certifications: formData.certifications,
        moq: formData.min_order_quantity ? `${formData.min_order_quantity} ${formData.moq_unit}` : null,
        price: formData.price_min ? `${formData.currency} ${formData.price_min}` : null,
      });

      if (success && data) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          is_standardized: true,
        }));

        if (!formData.category_id && data.suggestedCategory) {
          const matchedCat = categories.find(c =>
            c.name.toLowerCase().includes(data.suggestedCategory.toLowerCase())
          );
          if (matchedCat) {
            setFormData(prev => ({ ...prev, category_id: matchedCat.id }));
          }
        }

        toast.success('AI generated a description for your product!');
      } else {
        toast.error('AI could not generate description. Please try again.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('Failed to generate description');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Photo-to-Listing: Upload photo → AI extracts product info
  const handlePhotoToListing = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setIsAnalyzingPhoto(true);
    try {
      // Convert image to base64 for AI vision
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const { callChat } = await import('@/ai/aiClient');
      const result = await callChat({
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an African B2B product listing expert. Analyze the product photo and extract: title, description (2-3 sentences), suggested category name, estimated price range in USD, and country of origin if visible. Return JSON: { "title": "", "description": "", "category": "", "price_estimate": "", "country": "" }'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this product photo and generate a B2B listing. Return JSON only.' },
              { type: 'image_url', image_url: { url: base64 } }
            ]
          }
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      if (result.success && result.content) {
        // Parse JSON from response
        let parsed;
        try {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          parsed = null;
        }

        if (parsed) {
          setFormData(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            country_of_origin: parsed.country || prev.country_of_origin,
          }));

          // Try to match category
          if (parsed.category && categories.length > 0) {
            const matchedCat = categories.find(c =>
              c.name.toLowerCase().includes(parsed.category.toLowerCase()) ||
              parsed.category.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matchedCat) {
              setFormData(prev => ({ ...prev, category_id: matchedCat.id }));
            }
          }

          // Try to set price
          if (parsed.price_estimate) {
            const priceMatch = String(parsed.price_estimate).match(/[\d.]+/);
            if (priceMatch) {
              setFormData(prev => ({ ...prev, price_min: priceMatch[0] }));
            }
          }

          // Also add the photo as a product image
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, { url: base64, alt_text: parsed.title || 'Product photo', is_primary: prev.images.length === 0, sort_order: prev.images.length }]
          }));

          setShowMoreDetails(true);
          toast.success('AI analyzed your photo and filled in the details!');
        } else {
          toast.error('Could not extract product info from this photo. Try a clearer image.');
        }
      } else {
        toast.error('Photo analysis failed. You can still fill in the details manually.');
      }
    } catch (err) {
      console.error('[QuickAddProduct] Photo analysis error:', err);
      toast.error('Photo analysis failed. Fill in the details manually.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Handle certifications
  const handleCertificationAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const cert = sanitizeString(e.target.value.trim());
      if (!formData.certifications.includes(cert)) {
        setFormData(prev => ({
          ...prev,
          certifications: [...prev.certifications, cert]
        }));
      }
      e.target.value = '';
    }
  };

  // Handle specifications
  const handleSpecFieldChange = (index, field, value) => {
    const newFields = [...specFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setSpecFields(newFields);

    const specs = {};
    newFields.forEach(f => {
      if (f.key && f.value) specs[f.key] = f.value;
    });
    setFormData(prev => ({ ...prev, specifications: specs }));
  };

  const addSpecField = () => setSpecFields([...specFields, { key: '', value: '' }]);
  const removeSpecField = (index) => {
    const newFields = specFields.filter((_, i) => i !== index);
    if (newFields.length === 0) newFields.push({ key: '', value: '' });
    setSpecFields(newFields);
  };

  // Toggle shipping term
  const toggleShippingTerm = (term) => {
    setFormData(prev => ({
      ...prev,
      shipping_terms: prev.shipping_terms.includes(term)
        ? prev.shipping_terms.filter(t => t !== term)
        : [...prev.shipping_terms, term]
    }));
  };

  // Save product
  const handleSave = async (publish = false) => {
    const validationErrors = validateProductForm(formData);
    const requiredFields = ['title', 'category_id', 'price_min', 'min_order_quantity'];
    const criticalErrors = requiredFields.filter(f => validationErrors[f]);

    if (publish && criticalErrors.length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in: Title, Category, Price, and MOQ');
      return;
    }

    setIsSaving(true);
    try {
      const result = productId
        ? await updateProduct({ user, productId, formData, companyId: profileCompanyId, publish })
        : await createProduct({ user, formData, companyId: profileCompanyId, publish });

      if (!result.success) {
        toast.error(result.error || 'Failed to save product');
        return;
      }

      toast.success(publish ? 'Product published!' : 'Product saved as draft');
      navigate('/dashboard/products');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading states
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-afrikoni-chestnut">
              {productId ? 'Edit Product' : 'Quick Add Product'}
            </h1>
            <p className="text-sm text-afrikoni-deep mt-1">
              4 fields to publish. Add more details anytime.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Photo-to-Listing: AI Speed Layer */}
          {!productId && (
            <div className="border-2 border-dashed border-afrikoni-gold/30 rounded-lg p-4 text-center hover:border-afrikoni-gold transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoToListing}
                className="hidden"
                id="photo-to-listing"
                disabled={isAnalyzingPhoto}
              />
              <label htmlFor="photo-to-listing" className="cursor-pointer">
                {isAnalyzingPhoto ? (
                  <div className="flex items-center justify-center gap-2 text-afrikoni-gold">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">AI analyzing your photo...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-afrikoni-deep/70">
                    <Camera className="w-5 h-5 text-afrikoni-gold" />
                    <span className="text-sm">
                      <span className="font-medium text-afrikoni-gold">Upload a photo</span> and AI will fill in the details
                    </span>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* REQUIRED: Title */}
          <div>
            <Label htmlFor="title">
              Product Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Premium Grade A Cocoa Beans"
              className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* REQUIRED: Category */}
          <div>
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleChange('category_id', value)}
            >
              <SelectTrigger className={`mt-1 ${errors.category_id ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* REQUIRED: Price + MOQ in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Price per Unit <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.price_min}
                  onChange={(e) => handleChange('price_min', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`flex-1 ${errors.price_min ? 'border-red-500' : ''}`}
                />
              </div>
            </div>

            <div>
              <Label>
                MOQ <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={formData.min_order_quantity}
                  onChange={(e) => handleChange('min_order_quantity', e.target.value)}
                  placeholder="100"
                  min="1"
                  className={`flex-1 ${errors.min_order_quantity ? 'border-red-500' : ''}`}
                />
                <Select
                  value={formData.moq_unit}
                  onValueChange={(value) => handleChange('moq_unit', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOQ_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons - prominent placement right after required fields */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Publish Product</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Draft
            </Button>
          </div>

          {/* OPTIONAL: Expandable "More Details" section */}
          <div className="border border-afrikoni-gold/20 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full flex items-center justify-between p-4 hover:bg-afrikoni-cream/50 transition-colors text-sm"
            >
              <span className="font-medium text-afrikoni-chestnut">
                More details (description, images, shipping, specs)
              </span>
              {showMoreDetails ? (
                <ChevronUp className="w-4 h-4 text-afrikoni-deep" />
              ) : (
                <ChevronDown className="w-4 h-4 text-afrikoni-deep" />
              )}
            </button>

            {showMoreDetails && (
              <div className="p-4 pt-0 border-t border-afrikoni-gold/10 space-y-5">
                {/* Description with AI */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="description">Description</Label>
                    <div className="flex gap-2">
                      {formData.description && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleGenerateAI}
                          disabled={isGeneratingAI}
                          className="text-xs"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI || !formData.title}
                        className="text-xs border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                      >
                        {isGeneratingAI ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        {isGeneratingAI ? 'Generating...' : 'AI Write'}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your product or let AI write it for you..."
                    rows={4}
                  />
                </div>

                {/* Images */}
                <div>
                  <Label className="mb-2 block">Product Images</Label>
                  <ProductImageUploader
                    images={formData.images}
                    onImagesChange={(images) => handleChange('images', images)}
                    productId={productId}
                  />
                </div>

                {/* Country + Max Price row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Country of Origin</Label>
                    <Select
                      value={formData.country_of_origin}
                      onValueChange={(value) => handleChange('country_of_origin', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Price (for range)</Label>
                    <Input
                      type="number"
                      value={formData.price_max}
                      onChange={(e) => handleChange('price_max', e.target.value)}
                      placeholder="Optional"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Lead Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lead Time (Min Days)</Label>
                    <Input
                      type="number"
                      value={formData.lead_time_min_days}
                      onChange={(e) => handleChange('lead_time_min_days', e.target.value)}
                      placeholder="e.g., 7"
                      min="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Lead Time (Max Days)</Label>
                    <Input
                      type="number"
                      value={formData.lead_time_max_days}
                      onChange={(e) => handleChange('lead_time_max_days', e.target.value)}
                      placeholder="e.g., 14"
                      min="1"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Shipping Terms */}
                <div>
                  <Label>Shipping Terms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SHIPPING_TERMS.map(term => (
                      <Button
                        key={term}
                        type="button"
                        variant={formData.shipping_terms.includes(term) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleShippingTerm(term)}
                        className={formData.shipping_terms.includes(term) ? 'bg-afrikoni-gold hover:bg-afrikoni-gold/90' : ''}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <Label>Certifications</Label>
                  <Input
                    placeholder="Type and press Enter (e.g., ISO 9001)"
                    onKeyDown={handleCertificationAdd}
                    className="mt-1"
                  />
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map(cert => (
                        <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                          {cert}
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter(c => c !== cert)
                            }))}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specifications */}
                <div>
                  <Label>Specifications</Label>
                  <div className="space-y-2 mt-2">
                    {specFields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Spec name"
                          value={field.key}
                          onChange={(e) => handleSpecFieldChange(index, 'key', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => handleSpecFieldChange(index, 'value', e.target.value)}
                          className="flex-1"
                        />
                        {specFields.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeSpecField(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSpecField}>
                      <Plus className="w-4 h-4 mr-1" /> Add Spec
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
