import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft, Sparkles, Send, Save, Image as ImageIcon,
  ChevronDown, ChevronUp, Check, Loader2, Wand2,
  Package, DollarSign, Truck, Award, Camera, Eye, Zap,
  RefreshCw, Info, X, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import ProductImageUploader from '@/components/products/ProductImageUploader';
import { sanitizeString } from '@/utils/security';
import { createProduct, updateProduct } from '@/services/productService';
import { AFRICAN_CURRENCIES, formatCurrency } from '@/utils/currencyConverter';
import { validateProductForm } from '@/utils/validation';

// Constants
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
const MOQ_UNITS = ['pieces', 'kg', 'grams', 'liters', 'tons', 'containers', 'pallets', 'boxes', 'bags', 'units'];

// AI Description Styles for uniqueness
const AI_STYLE_VARIATIONS = [
  { style: 'professional', focus: 'quality and reliability', tone: 'formal and detailed' },
  { style: 'concise', focus: 'key features and benefits', tone: 'direct and impactful' },
  { style: 'technical', focus: 'specifications and standards', tone: 'precise and informative' },
  { style: 'buyer-focused', focus: 'value proposition and ROI', tone: 'persuasive yet factual' },
  { style: 'story-driven', focus: 'origin and production process', tone: 'engaging and authentic' },
];

// Smart Section Component
const CollapsibleSection = ({ title, icon: Icon, isOpen, onToggle, isComplete, children, badge }) => (
  <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isComplete ? 'border-green-200 bg-green-50/30' : 'border-afrikoni-gold/20'}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-afrikoni-cream/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-green-100 text-green-600' : 'bg-afrikoni-gold/10 text-afrikoni-gold'}`}>
          {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="text-left">
          <span className="font-semibold text-afrikoni-chestnut">{title}</span>
          {badge && <Badge variant="secondary" className="ml-2 text-xs">{badge}</Badge>}
        </div>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-afrikoni-deep" /> : <ChevronDown className="w-5 h-5 text-afrikoni-deep" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 pt-0 border-t border-afrikoni-gold/10">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Live Preview Component
const ProductPreview = ({ formData, categories }) => {
  const category = categories.find(c => c.id === formData.category_id);

  return (
    <div className="bg-white rounded-xl border border-afrikoni-gold/20 overflow-hidden">
      <div className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-cream p-3 border-b border-afrikoni-gold/20">
        <div className="flex items-center gap-2 text-sm font-medium text-afrikoni-chestnut">
          <Eye className="w-4 h-4" />
          Live Preview
        </div>
      </div>
      <div className="p-4">
        {/* Image Preview */}
        <div className="aspect-video bg-afrikoni-cream/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {formData.images?.[0]?.url ? (
            <img src={formData.images[0].url} alt="Product" className="w-full h-full object-cover" />
          ) : (
            <div className="text-afrikoni-deep/40 flex flex-col items-center">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-xs">Add images</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-afrikoni-chestnut mb-2 line-clamp-2">
          {formData.title || 'Your Product Title'}
        </h3>

        {/* Category & Origin */}
        <div className="flex flex-wrap gap-2 mb-3">
          {category && (
            <Badge variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          )}
          {formData.country_of_origin && (
            <Badge variant="outline" className="text-xs">
              📍 {formData.country_of_origin}
            </Badge>
          )}
        </div>

        {/* Price */}
        {formData.price_min && (
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-afrikoni-gold">
              {formatCurrency(parseFloat(formData.price_min), formData.currency)}
            </span>
            {formData.price_max && parseFloat(formData.price_max) > parseFloat(formData.price_min) && (
              <span className="text-afrikoni-deep/60">
                - {formatCurrency(parseFloat(formData.price_max), formData.currency)}
              </span>
            )}
            <span className="text-sm text-afrikoni-deep/60">/{formData.moq_unit}</span>
          </div>
        )}

        {/* MOQ */}
        {formData.min_order_quantity && (
          <div className="text-sm text-afrikoni-deep mb-3">
            MOQ: <span className="font-medium">{formData.min_order_quantity} {formData.moq_unit}</span>
          </div>
        )}

        {/* Description Preview */}
        {formData.description && (
          <p className="text-sm text-afrikoni-deep/80 line-clamp-3">
            {formData.description}
          </p>
        )}

        {/* Certifications */}
        {formData.certifications?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {formData.certifications.slice(0, 3).map(cert => (
              <Badge key={cert} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                ✓ {cert}
              </Badge>
            ))}
            {formData.certifications.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{formData.certifications.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [aiStyleIndex, setAiStyleIndex] = useState(0);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Section state - start with essentials open
  const [openSections, setOpenSections] = useState({
    essentials: true,
    pricing: false,
    details: false,
    images: false,
  });

  // Spec fields for dynamic specifications
  const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);

  // Check section completeness
  const sectionComplete = {
    essentials: !!(formData.title && formData.category_id),
    pricing: !!(formData.price_min && formData.min_order_quantity),
    details: !!(formData.shipping_terms?.length > 0),
    images: formData.images?.length > 0,
  };

  // Load initial data
  useEffect(() => {
    if (!canLoadData) return;
    loadData();
  }, [canLoadData, profileCompanyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load categories
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

    // Open all sections when editing
    setOpenSections({ essentials: true, pricing: true, details: true, images: true });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // AI Description Generator with unique variations
  const handleGenerateAI = async () => {
    if (!formData.title?.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    setIsGeneratingAI(true);

    try {
      const { generateProductListing } = await import('@/ai/aiFunctions');
      const selectedCategory = categories.find(c => c.id === formData.category_id);

      // Rotate through style variations for uniqueness
      const styleVariation = AI_STYLE_VARIATIONS[aiStyleIndex % AI_STYLE_VARIATIONS.length];
      setAiStyleIndex(prev => prev + 1);

      // Add unique seed based on title hash and timestamp
      const uniqueSeed = `${formData.title}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const { success, data } = await generateProductListing({
        title: formData.title,
        description: formData.description,
        category: selectedCategory?.name,
        country: formData.country_of_origin,
        specifications: formData.specifications,
        certifications: formData.certifications,
        // Pass style variation for unique descriptions
        style: styleVariation.style,
        focus: styleVariation.focus,
        tone: styleVariation.tone,
        uniqueSeed,
        // Include MOQ and price for context
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

        // Auto-detect category if not set
        if (!formData.category_id && data.suggestedCategory) {
          const matchedCat = categories.find(c =>
            c.name.toLowerCase().includes(data.suggestedCategory.toLowerCase())
          );
          if (matchedCat) {
            setFormData(prev => ({ ...prev, category_id: matchedCat.id }));
          }
        }

        toast.success('AI generated a unique description for your product!');
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

  // Regenerate AI with different style
  const handleRegenerateAI = () => {
    handleGenerateAI();
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

  // Handle shipping terms
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
    // Validate required fields
    const validationErrors = validateProductForm(formData);
    const requiredFields = ['title', 'category_id', 'price_min', 'min_order_quantity'];
    const criticalErrors = requiredFields.filter(f => validationErrors[f]);

    if (publish && criticalErrors.length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in the required fields: Title, Category, Price, and MOQ');

      // Open the section with errors
      if (!formData.title || !formData.category_id) {
        setOpenSections(prev => ({ ...prev, essentials: true }));
      } else if (!formData.price_min || !formData.min_order_quantity) {
        setOpenSections(prev => ({ ...prev, pricing: true }));
      }
      return;
    }

    setIsSaving(true);

    try {
      const result = productId
        ? await updateProduct({
            user,
            productId,
            formData,
            companyId: profileCompanyId,
            publish
          })
        : await createProduct({
            user,
            formData,
            companyId: profileCompanyId,
            publish
          });

      if (!result.success) {
        toast.error(result.error || 'Failed to save product');
        return;
      }

      toast.success(publish ? '🎉 Product published successfully!' : 'Product saved as draft');
      navigate('/dashboard/products');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick publish (validates and publishes in one click)
  const handleQuickPublish = () => handleSave(true);

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

  // Calculate completion percentage
  const completedSections = Object.values(sectionComplete).filter(Boolean).length;
  const completionPercent = Math.round((completedSections / 4) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
                {productId ? 'Edit Product' : 'Add Product'}
                <Badge variant="outline" className="text-xs font-normal">
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Mode
                </Badge>
              </h1>
              <p className="text-sm text-afrikoni-deep mt-1">
                Fill in the essentials and publish in seconds with AI assistance
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-afrikoni-chestnut">{completionPercent}% Complete</div>
              <div className="text-xs text-afrikoni-deep">{completedSections}/4 sections</div>
            </div>
            <div className="w-20 h-2 bg-afrikoni-cream rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-afrikoni-gold"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section 1: Essentials (Title, Category, Description with AI) */}
          <CollapsibleSection
            title="Product Essentials"
            icon={Package}
            isOpen={openSections.essentials}
            onToggle={() => toggleSection('essentials')}
            isComplete={sectionComplete.essentials}
            badge="Required"
          >
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
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

              {/* Category & Country Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
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

                <div>
                  <Label htmlFor="country" className="text-sm font-medium">Country of Origin</Label>
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
              </div>

              {/* AI-Powered Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Product Description
                  </Label>
                  <div className="flex gap-2">
                    {formData.description && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerateAI}
                        disabled={isGeneratingAI}
                        className="text-xs"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                        New Style
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
                  placeholder="Describe your product or let AI write a professional description for you..."
                  rows={5}
                  className={formData.is_standardized ? 'bg-green-50/50 border-green-200' : ''}
                />

                {formData.is_standardized && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <Sparkles className="w-3 h-3" />
                    AI-enhanced description • Click "New Style" for a different variation
                  </div>
                )}

                {!formData.description && (
                  <p className="text-xs text-afrikoni-deep/60 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Tip: Enter a title and click "AI Write" for a unique, professional description
                  </p>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Pricing & MOQ */}
          <CollapsibleSection
            title="Pricing & Quantity"
            icon={DollarSign}
            isOpen={openSections.pricing}
            onToggle={() => toggleSection('pricing')}
            isComplete={sectionComplete.pricing}
            badge="Required"
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <Label className="text-sm font-medium">
                    Price per Unit <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleChange('currency', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code}
                          </SelectItem>
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

                {/* Max Price (Optional) */}
                <div>
                  <Label className="text-sm font-medium">Max Price (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.price_max}
                    onChange={(e) => handleChange('price_max', e.target.value)}
                    placeholder="For price range"
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* MOQ */}
                <div>
                  <Label className="text-sm font-medium">
                    Minimum Order Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.min_order_quantity}
                    onChange={(e) => handleChange('min_order_quantity', e.target.value)}
                    placeholder="e.g., 100"
                    min="1"
                    className={`mt-1 ${errors.min_order_quantity ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* MOQ Unit */}
                <div>
                  <Label className="text-sm font-medium">Unit</Label>
                  <Select
                    value={formData.moq_unit}
                    onValueChange={(value) => handleChange('moq_unit', value)}
                  >
                    <SelectTrigger className="mt-1">
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
          </CollapsibleSection>

          {/* Section 3: Details (Shipping, Specs, Certs) */}
          <CollapsibleSection
            title="Additional Details"
            icon={Truck}
            isOpen={openSections.details}
            onToggle={() => toggleSection('details')}
            isComplete={sectionComplete.details}
            badge="Optional"
          >
            <div className="space-y-4">
              {/* Shipping Terms */}
              <div>
                <Label className="text-sm font-medium">Shipping Terms</Label>
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

              {/* Lead Time */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Lead Time (Min Days)</Label>
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
                  <Label className="text-sm font-medium">Lead Time (Max Days)</Label>
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

              {/* Certifications */}
              <div>
                <Label className="text-sm font-medium">Certifications</Label>
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
                <Label className="text-sm font-medium">Product Specifications</Label>
                <div className="space-y-2 mt-2">
                  {specFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Spec name (e.g., Moisture)"
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
          </CollapsibleSection>

          {/* Section 4: Images */}
          <CollapsibleSection
            title="Product Images"
            icon={Camera}
            isOpen={openSections.images}
            onToggle={() => toggleSection('images')}
            isComplete={sectionComplete.images}
            badge="Recommended"
          >
            <ProductImageUploader
              images={formData.images}
              onImagesChange={(images) => handleChange('images', images)}
              productId={productId}
            />
          </CollapsibleSection>
        </div>

        {/* Sidebar - Preview & Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Live Preview */}
          <div className="sticky top-4">
            <ProductPreview formData={formData} categories={categories} />

            {/* Action Buttons */}
            <div className="mt-4 space-y-3">
              <Button
                onClick={handleQuickPublish}
                disabled={isSaving}
                className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold py-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Product
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
            </div>

            {/* Quick Tips */}
            <Card className="mt-4 bg-afrikoni-cream/30 border-afrikoni-gold/20">
              <CardContent className="p-4">
                <h4 className="font-medium text-afrikoni-chestnut text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                  Quick Tips
                </h4>
                <ul className="text-xs text-afrikoni-deep space-y-1">
                  <li>• Use "AI Write" for unique, professional descriptions</li>
                  <li>• Add 3+ images to increase buyer interest by 40%</li>
                  <li>• Include certifications to build trust</li>
                  <li>• Set competitive MOQ for more inquiries</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
