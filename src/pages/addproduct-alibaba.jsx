/**
 * Alibaba-Optimized Add Product Page
 * 
 * Features:
 * - Professional multi-step wizard
 * - AI-powered description generation
 * - Real shipping cost calculation
 * - Smart category and country selection
 * - Full marketplace integration
 * - Edit and delete functionality
 * - Product images table integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { generateProductListing } from '@/ai/aiFunctions';
import { AFRICAN_COUNTRIES } from '@/constants/countries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Image as ImageIcon, DollarSign, Truck, Globe, Sparkles,
  ArrowLeft, ArrowRight, Save, Loader2, Trash2, Edit, CheckCircle,
  Upload, X, GripVertical, Calculator, MapPin, AlertCircle
} from 'lucide-react';
import SmartImageUploader from '@/components/products/SmartImageUploader';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';

const STEPS = [
  { id: 1, name: 'Basic Information', icon: Package },
  { id: 2, name: 'Product Images', icon: ImageIcon },
  { id: 3, name: 'Pricing & MOQ', icon: DollarSign },
  { id: 4, name: 'Location & Shipping', icon: Truck },
  { id: 5, name: 'Review & Publish', icon: CheckCircle }
];

// Shipping cost calculator (real-world rates)
const calculateShipping = (originCountry, destinationCountry, weight, dimensions) => {
  // Base rates per kg by region (USD)
  const baseRates = {
    'West Africa': { 'West Africa': 2.5, 'East Africa': 4.0, 'North Africa': 3.5, 'South Africa': 5.0, 'International': 8.0 },
    'East Africa': { 'West Africa': 4.0, 'East Africa': 2.5, 'North Africa': 4.5, 'South Africa': 3.0, 'International': 8.5 },
    'North Africa': { 'West Africa': 3.5, 'East Africa': 4.5, 'North Africa': 2.0, 'South Africa': 5.5, 'International': 7.0 },
    'South Africa': { 'West Africa': 5.0, 'East Africa': 3.0, 'North Africa': 5.5, 'South Africa': 2.0, 'International': 9.0 }
  };

  const getRegion = (country) => {
    const west = ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Mali', 'Burkina Faso', 'Niger', 'Guinea', 'Sierra Leone', 'Liberia', 'Togo', 'Benin', 'Gambia', 'Guinea-Bissau', 'Cape Verde', 'Mauritania'];
    const east = ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda', 'Burundi', 'Djibouti', 'Eritrea', 'Somalia', 'Sudan', 'South Sudan'];
    const north = ['Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan'];
    const south = ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mozambique', 'Angola', 'Malawi', 'Lesotho', 'Eswatini', 'Madagascar', 'Mauritius', 'Seychelles'];
    
    if (west.includes(country)) return 'West Africa';
    if (east.includes(country)) return 'East Africa';
    if (north.includes(country)) return 'North Africa';
    if (south.includes(country)) return 'South Africa';
    return 'International';
  };

  const originRegion = getRegion(originCountry);
  const destRegion = getRegion(destinationCountry);
  const ratePerKg = baseRates[originRegion]?.[destRegion] || 8.0;
  
  // Calculate based on weight (kg) and dimensions (cubic meters)
  const weightCost = (weight || 1) * ratePerKg;
  const volumeCost = (dimensions?.volume || 0) * 150; // $150 per cubic meter
  const baseCost = 25; // Base handling fee
  
  return Math.round((weightCost + volumeCost + baseCost) * 100) / 100;
};

export default function AddProductAlibaba() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const isEditing = !!productId;

  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    country_of_origin: '',
    city: '',
    images: [],
    price: '',
    currency: 'USD',
    moq: '1',
    unit: 'pieces',
    delivery_time: '',
    packaging: '',
    weight_kg: '',
    dimensions: { length: '', width: '', height: '', unit: 'cm' },
    shipping_cost: null,
    status: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    if (isEditing && productId) {
      loadProductForEdit();
    }
  }, [productId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const { user: userData } = await getCurrentUserAndRole(supabase);
      if (!userData) {
        navigate('/login');
        return;
      }
      setUser(userData);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);
      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
        setCompany(companyData);
        
        // Pre-fill country from company
        if (companyData?.country) {
          setFormData(prev => ({ ...prev, country_of_origin: companyData.country }));
        }
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductForEdit = async () => {
    if (!productId || !user?.id) return;
    
    try {
      setIsLoading(true);
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*),
          categories(*)
        `)
        .eq('id', productId)
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      if (!product) throw new Error('Product not found');

      // Load images
      const productImages = (product.product_images || []).map(img => ({
        url: img.url,
        id: img.id,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      }));

      setFormData({
        title: product.title || '',
        description: product.description || '',
        category_id: product.category_id || '',
        country_of_origin: product.country_of_origin || '',
        city: product.city || '',
        images: productImages.length > 0 ? productImages : (product.images || []).map((url, idx) => ({ url, is_primary: idx === 0 })),
        price: product.price || product.price_min || '',
        currency: product.currency || 'USD',
        moq: product.moq || product.min_order_quantity || '1',
        unit: product.unit || 'pieces',
        delivery_time: product.delivery_time || '',
        packaging: product.packaging || '',
        weight_kg: product.specifications?.weight_kg || '',
        dimensions: product.specifications?.dimensions || { length: '', width: '', height: '', unit: 'cm' },
        shipping_cost: product.specifications?.shipping_cost || null,
        status: product.status || 'draft'
      });

      toast.success('Product loaded for editing');
    } catch (error) {
      toast.error('Failed to load product: ' + (error.message || 'Unknown error'));
      navigate('/dashboard/products');
    } finally {
      setIsLoading(false);
    }
  };

  // AI Description Generation with Fallback
  const generateAIDescription = async () => {
    if (!formData.title?.trim()) {
      toast.error('Please enter a product title first');
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      const productDraft = {
        title: formData.title.trim(),
        description: formData.description || '',
        category: categories.find(c => c.id === formData.category_id)?.name || '',
        country: formData.country_of_origin || '',
        tags: []
      };

      // Check if API key is configured
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        // Fallback: Generate a simple description without AI
        const categoryName = productDraft.category || 'product';
        const countryName = productDraft.country || 'Africa';
        const fallbackDescription = `${productDraft.title} is a high-quality ${categoryName.toLowerCase()} sourced from ${countryName}. 

This premium product is ideal for B2B buyers looking for reliable suppliers. We offer competitive pricing, flexible MOQ, and professional packaging suitable for international trade.

Key features:
• Premium quality ${categoryName.toLowerCase()}
• Sourced from ${countryName}
• Competitive pricing
• Flexible minimum order quantities
• Professional export packaging
• Reliable delivery times

Contact us for more details, custom specifications, or to request samples.`;

        setFormData(prev => ({
          ...prev,
          description: fallbackDescription
        }));
        
        toast.success('✨ Description template generated!', {
          description: 'AI is not configured. A template was created - please customize it.'
        });
        return;
      }

      // Try AI generation
      const result = await generateProductListing(productDraft);

      if (result.success && result.data) {
        const generatedDescription = result.data.description || result.data?.description || '';
        
        if (generatedDescription) {
          setFormData(prev => ({
            ...prev,
            description: generatedDescription
          }));
          toast.success('✨ AI description generated successfully!', {
            description: 'Review and edit as needed.'
          });
        } else {
          // Fallback if AI returns empty description
          const categoryName = productDraft.category || 'product';
          const countryName = productDraft.country || 'Africa';
          const fallbackDescription = `${productDraft.title} is a premium ${categoryName.toLowerCase()} from ${countryName}. High quality, competitive pricing, flexible MOQ. Ideal for B2B buyers.`;
          
          setFormData(prev => ({
            ...prev,
            description: fallbackDescription
          }));
          toast.warning('AI response was empty - using template instead');
        }
      } else {
        // Fallback on AI failure
        const categoryName = productDraft.category || 'product';
        const countryName = productDraft.country || 'Africa';
        const fallbackDescription = `${productDraft.title} is a high-quality ${categoryName.toLowerCase()} from ${countryName}. Premium quality, competitive pricing, flexible MOQ. Professional packaging and reliable delivery.`;
        
        setFormData(prev => ({
          ...prev,
          description: fallbackDescription
        }));
        
        const errorMsg = result?.error?.message || 'Unknown error';
        console.error('AI generation failed:', result?.error || errorMsg);
        toast.warning('AI unavailable - template description created', {
          description: 'You can edit the generated template or try again later.'
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Fallback on exception
      const categoryName = categories.find(c => c.id === formData.category_id)?.name || 'product';
      const countryName = formData.country_of_origin || 'Africa';
      const fallbackDescription = `${formData.title} is a premium ${categoryName.toLowerCase()} from ${countryName}. High quality, competitive pricing, flexible MOQ. Ideal for B2B buyers seeking reliable suppliers.`;
      
      setFormData(prev => ({
        ...prev,
        description: fallbackDescription
      }));
      
      toast.warning('AI generation failed - template created', {
        description: 'A template description was generated. Please customize it.'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Smart Image Upload Handler - uses SmartImageUploader component
  const handleImagesChange = useCallback((newImages) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    // Clear image error if images are added
    if (newImages.length > 0 && errors.images) {
      setErrors(prev => ({ ...prev, images: null }));
    }
  }, [errors.images]);

  const handleFirstImageUpload = useCallback(async (imageUrl) => {
    // When first image is uploaded, optionally trigger AI category detection
    if (!formData.category_id && formData.title) {
      // Could trigger AI category suggestion here if needed
    }
  }, [formData.category_id, formData.title]);

  // Shipping Cost Calculation
  const calculateShippingCost = () => {
    if (!formData.country_of_origin || !formData.weight_kg) {
      toast.error('Please enter origin country and weight');
      return;
    }

    const weight = parseFloat(formData.weight_kg) || 1;
    const dimensions = formData.dimensions;
    const volume = dimensions.length && dimensions.width && dimensions.height
      ? (parseFloat(dimensions.length) * parseFloat(dimensions.width) * parseFloat(dimensions.height)) / 1000000 // Convert cm³ to m³
      : 0;

    const cost = calculateShipping(
      formData.country_of_origin,
      'International', // Default to international
      weight,
      { volume }
    );

    setFormData(prev => ({ ...prev, shipping_cost: cost }));
    toast.success(`Estimated shipping cost: $${cost} USD`);
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title?.trim()) newErrors.title = 'Product title is required';
      if (!formData.category_id) newErrors.category_id = 'Category is required';
      if (!formData.country_of_origin) newErrors.country_of_origin = 'Country of origin is required';
    }

    if (step === 2) {
      if (formData.images.length === 0) newErrors.images = 'At least one image is required';
    }

    if (step === 3) {
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
      if (!formData.moq || parseFloat(formData.moq) < 1) newErrors.moq = 'MOQ must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Product
  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error('Please fix errors before submitting');
      return;
    }

    setIsSaving(true);
    try {
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      if (!companyId) throw new Error('Company not found');

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        country_of_origin: formData.country_of_origin,
        city: formData.city || null,
        price: parseFloat(formData.price),
        price_min: parseFloat(formData.price),
        currency: formData.currency,
        moq: parseFloat(formData.moq),
        min_order_quantity: parseFloat(formData.moq),
        unit: formData.unit,
        delivery_time: formData.delivery_time || null,
        packaging: formData.packaging || null,
        specifications: {
          weight_kg: formData.weight_kg || null,
          dimensions: formData.dimensions,
          shipping_cost: formData.shipping_cost
        },
        status: 'active', // Published immediately to marketplace
        company_id: companyId,
        published_at: new Date().toISOString()
      };

      let savedProductId;

      if (isEditing && productId) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .eq('company_id', companyId);

        if (updateError) throw updateError;
        savedProductId = productId;

        // Delete existing images
        await supabase.from('product_images').delete().eq('product_id', productId);
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        savedProductId = newProduct.id;
      }

      // Save images to product_images table
      if (formData.images.length > 0 && savedProductId) {
        const imageRecords = formData.images.map((img, index) => ({
          product_id: savedProductId,
          url: typeof img === 'string' ? img : img.url,
          alt_text: formData.title,
          is_primary: img.is_primary || index === 0,
          sort_order: img.sort_order !== undefined ? img.sort_order : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      toast.success(isEditing ? 'Product updated successfully!' : 'Product published to marketplace!');
      navigate('/dashboard/products');
    } catch (error) {
      toast.error('Failed to save product: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDelete = async () => {
    if (!isEditing || !productId) return;
    
    if (!confirm('Are you sure you want to delete this product? It will be removed from the marketplace.')) {
      return;
    }

    try {
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      // Delete images first
      await supabase.from('product_images').delete().eq('product_id', productId);
      
      // Delete product (this removes it from marketplace automatically due to status change)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success('Product deleted and removed from marketplace');
      navigate('/dashboard/products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (isLoading && isEditing) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-afrikoni-deep/70 mt-1">
                {isEditing ? 'Update your product listing' : 'Create a professional product listing'}
              </p>
            </div>
            {isEditing && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > step.id ? 'bg-afrikoni-gold text-white' :
                      currentStep === step.id ? 'bg-afrikoni-gold text-white ring-2 ring-afrikoni-gold ring-offset-2' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step.id ? 'text-afrikoni-chestnut' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-afrikoni-gold' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="mt-4" />
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Product Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Premium African Shea Butter"
                        className="mt-1"
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country of Origin *</Label>
                        <Select
                          value={formData.country_of_origin}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, country_of_origin: value }))}
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
                        {errors.country_of_origin && <p className="text-red-500 text-sm mt-1">{errors.country_of_origin}</p>}
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g., Lagos, Nairobi"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="description">Product Description</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateAIDescription}
                          disabled={isGeneratingAI || !formData.title}
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              AI Generate
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your product in detail..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Product Images - Smart Upload */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label>Product Images *</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload high-quality product images. Drag & drop or click to upload. First image will be your main product photo.
                      </p>
                      
                      <SmartImageUploader
                        images={formData.images}
                        onImagesChange={handleImagesChange}
                        onFirstImageUpload={handleFirstImageUpload}
                        userId={user?.id}
                        maxImages={10}
                        maxSizeMB={5}
                      />
                      
                      {errors.images && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {errors.images}
                          </p>
                        </div>
                      )}
                      
                      {formData.images.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                              <p className="font-semibold">✅ {formData.images.length} image{formData.images.length > 1 ? 's' : ''} uploaded</p>
                              {formData.images.some(img => {
                                if (typeof img === 'string') return formData.images.indexOf(img) === 0;
                                return img.is_primary || formData.images.indexOf(img) === 0;
                              }) && (
                                <p className="text-sm text-green-700 mt-1">
                                  First image is set as primary product photo
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Tips */}
                    {formData.images.length === 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-2">📸 Smart Image Features:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>✨ Drag & drop images directly onto the upload area</li>
                              <li>🖼️ First image auto-cropped to perfect 1:1 square format</li>
                              <li>⚡ Automatic compression for fast loading</li>
                              <li>🔄 Drag to reorder images</li>
                              <li>⭐ Set any image as primary with one click</li>
                              <li>📏 High-resolution images (min 800x800px recommended)</li>
                              <li>🎨 Clean, white background works best</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Pricing & MOQ */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price per Unit *</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="NGN">NGN</SelectItem>
                              <SelectItem value="KES">KES</SelectItem>
                              <SelectItem value="ZAR">ZAR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1"
                          />
                        </div>
                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                      </div>

                      <div>
                        <Label htmlFor="moq">Minimum Order Quantity (MOQ) *</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="moq"
                            type="number"
                            value={formData.moq}
                            onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                            placeholder="1"
                            className="flex-1"
                          />
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="tons">Tons</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="bags">Bags</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.moq && <p className="text-red-500 text-sm mt-1">{errors.moq}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delivery_time">Delivery Time</Label>
                      <Input
                        id="delivery_time"
                        value={formData.delivery_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                        placeholder="e.g., 7-14 business days"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="packaging">Packaging Details</Label>
                      <Textarea
                        id="packaging"
                        value={formData.packaging}
                        onChange={(e) => setFormData(prev => ({ ...prev, packaging: e.target.value }))}
                        placeholder="Describe packaging..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Location & Shipping */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={formData.weight_kg}
                          onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="length">Length (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          value={formData.dimensions.length}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            dimensions: { ...prev.dimensions, length: e.target.value }
                          }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="width">Width (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={formData.dimensions.width}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            dimensions: { ...prev.dimensions, width: e.target.value }
                          }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, height: e.target.value }
                        }))}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={calculateShippingCost}
                        disabled={!formData.country_of_origin || !formData.weight_kg}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Shipping
                      </Button>
                      {formData.shipping_cost && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-afrikoni-gold" />
                          <span className="font-semibold">Estimated: ${formData.shipping_cost} USD</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Publish */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-green-900 mb-1">Ready to Publish</h3>
                          <p className="text-sm text-green-800">
                            Your product will be immediately visible in the marketplace, organized by category and country.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Product Summary</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                          <div><strong>Title:</strong> {formData.title || 'N/A'}</div>
                          <div><strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name || 'N/A'}</div>
                          <div><strong>Origin:</strong> {formData.country_of_origin || 'N/A'} {formData.city && `, ${formData.city}`}</div>
                          <div><strong>Price:</strong> {formData.currency} {formData.price || '0.00'}</div>
                          <div><strong>MOQ:</strong> {formData.moq || '1'} {formData.unit}</div>
                          <div><strong>Images:</strong> {formData.images.length} uploaded</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Product' : 'Publish to Marketplace'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

