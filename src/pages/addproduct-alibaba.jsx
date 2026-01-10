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
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { generateProductListing, autoDetectProductLocation } from '@/ai/aiFunctions';
import { AFRICAN_COUNTRIES } from '@/constants/countries';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Progress } from '@/components/shared/ui/progress';
import { Badge } from '@/components/shared/ui/badge';
import { 
  Package, Image as ImageIcon, DollarSign, Truck, Globe, Sparkles,
  ArrowLeft, ArrowRight, Save, Loader2, Trash2, Edit, CheckCircle,
  Upload, X, GripVertical, Calculator, MapPin, AlertCircle
} from 'lucide-react';
import SmartImageUploader from '@/components/products/SmartImageUploader';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/i18n/LanguageContext';

// STEPS will be defined inside component to use translations

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
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const isEditing = !!productId;

  // Define STEPS with translations
  const STEPS = [
    { id: 1, name: t('addProductAlibaba.stepBasicInfo') || 'Basic Information', icon: Package },
    { id: 2, name: t('addProductAlibaba.stepImages') || 'Product Images', icon: ImageIcon },
    { id: 3, name: t('addProductAlibaba.stepPricing') || 'Pricing & MOQ', icon: DollarSign },
    { id: 4, name: t('addProductAlibaba.stepLocation') || 'Location & Shipping', icon: Globe },
    { id: 5, name: t('addProductAlibaba.stepReview') || 'Review & Publish', icon: Sparkles },
  ];

  const [currentStep, setCurrentStep] = useState(1);
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
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[AddProductAlibaba] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      console.log('[AddProductAlibaba] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadInitialData();
  }, [authReady, authLoading, user, profile, navigate]);

  // Load product for editing after user and company are loaded
  useEffect(() => {
    if (isEditing && productId && user?.id && company?.id) {
      loadProductForEdit();
    }
  }, [productId, user?.id, company?.id, isEditing]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Use auth from context (no duplicate call)

      const companyId = profile?.company_id || null;
      if (!companyId) {
        navigate('/onboarding/company', { replace: true });
        return;
      }
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
    if (!productId || !user?.id || !company?.id) {
      console.log('loadProductForEdit: Missing required data', { productId, userId: user?.id, companyId: company?.id });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading product for edit:', { productId, companyId: company.id });
      
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*),
          categories(*)
        `)
        .eq('id', productId)
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading product:', error);
        throw error;
      }
      
      if (error) {
        console.error('Error loading product:', error);
        throw error;
      }
      
      if (!product) {
        console.error('Product not found:', { productId, companyId: company.id });
        throw new Error('Product not found or you do not have permission to edit it');
      }

      console.log('Product loaded successfully:', { 
        id: product.id, 
        title: product.title, 
        imageCount: product.product_images?.length || 0 
      });

      // Load images - ensure format matches SmartImageUploader expectations
      const productImages = (product.product_images || [])
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img, idx) => ({
          url: img.url,
          id: img.id,
          is_primary: img.is_primary || idx === 0,
          sort_order: img.sort_order !== undefined ? img.sort_order : idx
        }));

      // Fallback to legacy images array if no product_images
      const fallbackImages = Array.isArray(product.images) 
        ? product.images.map((url, idx) => ({
            url: typeof url === 'string' ? url : url?.url || url,
            is_primary: idx === 0,
            sort_order: idx
          }))
        : [];

      // Parse specifications if it's a string
      let specs = {};
      if (product.specifications) {
        if (typeof product.specifications === 'string') {
          try {
            specs = JSON.parse(product.specifications);
          } catch (e) {
            specs = {};
          }
        } else {
          specs = product.specifications;
        }
      }

      const loadedFormData = {
        title: product.title || '',
        description: product.description || '',
        category_id: product.category_id || '',
        country_of_origin: product.country_of_origin || '',
        city: product.city || '',
        images: productImages.length > 0 ? productImages : fallbackImages,
        price: product.price || product.price_min || '',
        currency: product.currency || 'USD',
        moq: product.moq || product.min_order_quantity || '1',
        unit: product.unit || 'pieces',
        delivery_time: product.delivery_time || '',
        packaging: product.packaging || '',
        weight_kg: specs?.weight_kg || '',
        dimensions: specs?.dimensions || { length: '', width: '', height: '', unit: 'cm' },
        shipping_cost: specs?.shipping_cost || null,
        status: product.status || 'draft'
      };

      console.log('Setting form data:', loadedFormData);
      setFormData(loadedFormData);

      toast.success('Product loaded for editing');
    } catch (error) {
      console.error('Failed to load product for editing:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error('Failed to load product: ' + errorMessage);
      
      // Don't navigate immediately - let user see the error
      setTimeout(() => {
        navigate('/dashboard/products');
      }, 3000);
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

      // Add unique seed to ensure different descriptions each time
      // Use multiple sources of randomness for maximum uniqueness
      const timestamp = Date.now();
      const random1 = Math.random() * 1000000;
      const random2 = Math.random() * 1000000;
      const titleHash = formData.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const uniqueSeed = timestamp + random1 + random2 + titleHash;
      
      const enhancedDraft = {
        ...productDraft,
        uniqueSeed: uniqueSeed.toString(),
        timestamp: new Date().toISOString(),
        // Add more context for uniqueness
        context: {
          productTitle: productDraft.title,
          category: productDraft.category,
          country: productDraft.country,
          city: formData.city || productDraft.city || '',
          sellerLocation: company?.country || '',
          companyName: company?.company_name || '',
          uniqueId: uniqueSeed,
          randomSeed1: random1,
          randomSeed2: random2,
          titleHash: titleHash
        },
        // Add city if available
        city: formData.city || productDraft.city || ''
      };

      // Try AI generation with enhanced draft
      console.log('🤖 Generating AI description with unique seed:', uniqueSeed);
      const result = await generateProductListing(enhancedDraft);

      if (result.success && result.data) {
        const generatedDescription = result.data.description || result.data?.description || '';
        
        if (generatedDescription && generatedDescription.trim().length > 50) {
          console.log('✅ AI description generated successfully, length:', generatedDescription.length);
          setFormData(prev => ({
            ...prev,
            description: generatedDescription
          }));
          toast.success(t('addProductAlibaba.aiDescriptionSuccess') || '✨ AI description generated successfully!', {
            description: 'Review and edit as needed. Each description is unique.'
          });
        } else {
          // Fallback if AI returns empty description - create unique fallback
          const categoryName = productDraft.category || 'product';
          const countryName = productDraft.country || 'Africa';
          const cityName = formData.city || '';
          const locationText = cityName ? `${cityName}, ${countryName}` : countryName;
          
          // Create a unique fallback based on product title hash
          const titleWords = formData.title.toLowerCase().split(' ');
          const uniquePhrase = titleWords.length > 0 ? titleWords[0] : 'premium';
          const fallbackDescription = `${formData.title} represents exceptional ${categoryName.toLowerCase()} sourced directly from ${locationText}. 

This ${uniquePhrase} product offers outstanding quality and reliability for B2B buyers seeking authentic African goods. We provide competitive pricing structures, flexible minimum order quantities, and professional export-grade packaging.

Key advantages include consistent quality standards, reliable supply chain management, and direct sourcing from ${locationText}. Ideal for importers, distributors, and businesses looking to expand their product range with premium African products.

Contact us to discuss your specific requirements, request samples, or negotiate custom specifications.`;
          
          setFormData(prev => ({
            ...prev,
            description: fallbackDescription
          }));
          toast.warning('AI response was empty - using unique template instead');
        }
      } else {
        // Fallback on AI failure - create unique fallback
        const categoryName = productDraft.category || 'product';
        const countryName = productDraft.country || 'Africa';
        const cityName = formData.city || '';
        const locationText = cityName ? `${cityName}, ${countryName}` : countryName;
        const titleWords = formData.title.toLowerCase().split(' ');
        const uniquePhrase = titleWords.length > 0 ? titleWords[0] : 'high-quality';
        
        const fallbackDescription = `${formData.title} is a ${uniquePhrase} ${categoryName.toLowerCase()} originating from ${locationText}. 

This product features premium quality standards, making it an excellent choice for B2B buyers and international traders. We offer competitive pricing, flexible minimum order quantities, and professional packaging suitable for export markets.

Our supply chain ensures consistent quality and reliable delivery times. Perfect for businesses looking to source authentic products directly from ${locationText}.

For inquiries, custom specifications, or to request product samples, please contact us.`;
        
        setFormData(prev => ({
          ...prev,
          description: fallbackDescription
        }));
        
        const errorMsg = result?.error?.message || 'Unknown error';
        console.error('AI generation failed:', result?.error || errorMsg);
        toast.warning(t('addProductAlibaba.aiDescriptionError') || 'AI unavailable - unique template description created', {
          description: 'You can edit the generated template or try again later.'
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Fallback on exception - create unique fallback
      const categoryName = categories.find(c => c.id === formData.category_id)?.name || 'product';
      const countryName = formData.country_of_origin || 'Africa';
      const cityName = formData.city || '';
      const locationText = cityName ? `${cityName}, ${countryName}` : countryName;
      const titleWords = formData.title.toLowerCase().split(' ');
      const uniquePhrase = titleWords.length > 0 ? titleWords[0] : 'exceptional';
      const randomSuffix = Math.floor(Math.random() * 1000);
      
      const fallbackDescription = `${formData.title} is an ${uniquePhrase} ${categoryName.toLowerCase()} sourced from ${locationText} (ID: ${randomSuffix}). 

This product offers superior quality and reliability for B2B buyers. We provide competitive pricing, flexible minimum order quantities, and professional export packaging.

Key features include direct sourcing from ${locationText}, consistent quality control, and reliable supply chain management. Suitable for importers, distributors, and businesses seeking authentic African products.

Contact us for more information, custom specifications, or to request samples.`;
      
      setFormData(prev => ({
        ...prev,
        description: fallbackDescription
      }));
      
      toast.error(t('addProductAlibaba.aiDescriptionError') || 'AI generation failed - unique template created');
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

    // If step is 5 or higher, validate all required fields
    if (step >= 5) {
      // Validate all required fields for final submission
      if (!formData.title?.trim()) newErrors.title = t('addProductAlibaba.titleRequired') || 'Product title is required';
      if (!formData.category_id) newErrors.category_id = t('addProductAlibaba.categoryRequired') || 'Category is required';
      if (!formData.country_of_origin) newErrors.country_of_origin = t('addProductAlibaba.countryRequired') || 'Country of origin is required';
      if (formData.images.length === 0) newErrors.images = t('addProductAlibaba.atLeastOneImage') || 'At least one image is required';
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = t('addProductAlibaba.validPriceRequired') || 'Valid price is required';
      if (!formData.moq || parseFloat(formData.moq) < 1) newErrors.moq = t('addProductAlibaba.validMOQRequired') || 'MOQ must be at least 1';
    } else if (step === 1) {
      if (!formData.title?.trim()) newErrors.title = t('addProductAlibaba.titleRequired') || 'Product title is required';
      if (!formData.category_id) newErrors.category_id = t('addProductAlibaba.categoryRequired') || 'Category is required';
      if (!formData.country_of_origin) newErrors.country_of_origin = t('addProductAlibaba.countryRequired') || 'Country of origin is required';
    } else if (step === 2) {
      if (formData.images.length === 0) newErrors.images = t('addProductAlibaba.atLeastOneImage') || 'At least one image is required';
    } else if (step === 3) {
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = t('addProductAlibaba.validPriceRequired') || 'Valid price is required';
      if (!formData.moq || parseFloat(formData.moq) < 1) newErrors.moq = t('addProductAlibaba.validMOQRequired') || 'MOQ must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes (for editing - can be called from any step)
  const handleSaveChanges = async (skipValidation = false) => {
    if (!isEditing || !productId) {
      // If not editing, use regular submit
      return handleSubmit();
    }

    if (!user?.id) {
      toast.error('You must be logged in to save a product');
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const companyId = profile?.company_id || null;
      if (!companyId) {
        navigate('/onboarding/company', { replace: true });
        return;
      }

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        country_of_origin: formData.country_of_origin,
        city: formData.city || null,
        price: parseFloat(formData.price) || 0,
        price_min: parseFloat(formData.price) || 0,
        currency: formData.currency,
        moq: parseFloat(formData.moq) || 1,
        min_order_quantity: parseFloat(formData.moq) || 1,
        unit: formData.unit,
        delivery_time: formData.delivery_time || null,
        packaging: formData.packaging || null,
        company_id: companyId,
        specifications: {
          weight_kg: formData.weight_kg || null,
          dimensions: formData.dimensions,
          shipping_cost: formData.shipping_cost
        },
        updated_at: new Date().toISOString()
        // Keep existing status when saving changes
      };

      let savedProductId;

      if (isEditing && productId) {
        // Update existing product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .eq('company_id', companyId)
          .select('id')
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(updateError.message || 'Failed to update product');
        }
        
        if (!updatedProduct) {
          throw new Error('Product not found or you do not have permission to edit it');
        }
        
        savedProductId = updatedProduct.id;
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message || 'Failed to create product');
        }
        
        if (!newProduct || !newProduct.id) {
          throw new Error('Product was created but ID was not returned');
        }
        
        savedProductId = newProduct.id;
        
        // Verify the product was created and is accessible
        console.log('✅ Product created:', savedProductId);
        const { data: verifyProduct, error: verifyError } = await supabase
          .from('products')
          .select('id, company_id, title')
          .eq('id', savedProductId)
          .single();
        
        if (verifyError) {
          console.error('❌ Cannot verify product:', verifyError);
        } else {
          console.log('✅ Product verified:', verifyProduct);
        }
      }

      // Small delay to ensure product is fully committed
      // Increased delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save images to product_images table
      console.log('💾 Saving product images:', {
        imageCount: formData.images.length,
        productId: savedProductId,
        isEditing,
        images: formData.images,
        imagesStructure: formData.images.map((img, idx) => ({
          index: idx,
          type: typeof img,
          isString: typeof img === 'string',
          isObject: typeof img === 'object',
          keys: typeof img === 'object' ? Object.keys(img) : [],
          hasUrl: typeof img === 'object' ? 'url' in img : false,
          url: typeof img === 'string' ? img : img?.url,
          fullObject: img
        }))
      });
      
      // Only process images if we have images to save
      if (formData.images && formData.images.length > 0 && savedProductId) {
        const imageRecords = formData.images
          .map((img, index) => {
            // Extract URL - handle both string and object formats
            let imageUrl = null;
            
            if (typeof img === 'string') {
              imageUrl = img;
            } else if (typeof img === 'object' && img !== null) {
              // Try multiple possible URL properties (SmartImageUploader returns { url, thumbnail_url, path, ... })
              imageUrl = img.url || img.publicUrl || img.imageUrl || img.src || img.thumbnail_url || null;
            }
            
            console.log(`🖼️ Processing image ${index + 1}:`, { 
              index, 
              img, 
              imageUrl, 
              type: typeof img,
              imgKeys: typeof img === 'object' ? Object.keys(img) : [],
              hasUrl: !!imageUrl,
              urlType: imageUrl ? (imageUrl.startsWith('http') ? 'full URL' : imageUrl.startsWith('/') ? 'relative' : 'other') : 'none'
            });
            
            // Only include valid URLs
            if (!imageUrl) {
              console.warn(`⚠️ Skipping image ${index + 1} with no URL:`, img);
              toast.warning(`Image ${index + 1} skipped: No URL found`);
              return null;
            }
            
            // Validate URL format - Supabase storage URLs start with https://
            // Also accept relative paths and data URLs
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('data:')) {
              console.warn(`⚠️ Skipping invalid image URL format for image ${index + 1}:`, imageUrl);
              toast.warning(`Image ${index + 1} skipped: Invalid URL format`);
              return null;
            }
            
            const record = {
              product_id: savedProductId,
              url: imageUrl,
              alt_text: formData.title || 'Product image',
              is_primary: (typeof img === 'object' && img.is_primary === true) || index === 0,
              sort_order: (typeof img === 'object' && img.sort_order !== undefined) ? img.sort_order : index
            };
            
            console.log(`✅ Created image record ${index + 1}:`, record);
            return record;
          })
          .filter(Boolean); // Remove null entries

        console.log('📋 Image records to insert:', imageRecords.length, imageRecords);
        console.log('🔍 Product ID for images:', savedProductId);
        console.log('🔍 User ID:', user?.id);
        console.log('🔍 Company ID:', companyId);

        if (imageRecords.length > 0) {
          // Verify product exists and user has access before inserting images
          let canSaveImages = true;
          if (savedProductId) {
            const { data: productCheck, error: productCheckError } = await supabase
              .from('products')
              .select('id, company_id, status')
              .eq('id', savedProductId)
              .single();
            
            if (productCheckError || !productCheck) {
              console.error('❌ Product verification failed:', productCheckError);
              toast.error(t('addProductAlibaba.cannotSaveImages') || 'Cannot save images: Product not found or access denied');
              canSaveImages = false;
            } else {
              console.log('✅ Product verified:', {
                product_id: productCheck.id,
                company_id: productCheck.company_id,
                expected_company_id: companyId,
                match: productCheck.company_id === companyId
              });
              
              // If company_id doesn't match, update it (shouldn't happen, but safety check)
              if (productCheck.company_id !== companyId) {
                console.warn('⚠️ Company ID mismatch, updating product...');
                const { error: updateError } = await supabase
                  .from('products')
                  .update({ company_id: companyId })
                  .eq('id', savedProductId);
                
                if (updateError) {
                  console.error('❌ Failed to update product company_id:', updateError);
                  toast.error(t('addProductAlibaba.cannotSaveImages') || 'Cannot save images: Product ownership issue');
                  canSaveImages = false;
                }
              }
            }
          } else {
            canSaveImages = false;
          }
          
          // Only try to save images if we can
          if (!canSaveImages) {
            console.warn('⚠️ Skipping image save due to verification failure');
            toast.warning(t('addProductAlibaba.imagesSkipped') || 'Product saved but images could not be saved. Please add images later.');
          } else {
            // If editing, delete old images FIRST, then insert new ones
            if (isEditing && productId) {
            console.log('🗑️ Deleting old images before inserting new ones...');
            const { error: deleteImagesError } = await supabase
              .from('product_images')
              .delete()
              .eq('product_id', productId);
              
            if (deleteImagesError) {
              console.error('Delete images error:', deleteImagesError);
              // Continue anyway - we'll try to insert new images
            } else {
              console.log('✅ Old images deleted successfully');
            }
            
            // Small delay to ensure deletion is committed
            await new Promise(resolve => setTimeout(resolve, 200));
            }
          
            // Try batch insert first (more efficient)
          console.log('🔄 Attempting batch insert of images...');
          const { data: batchInserted, error: batchError } = await supabase
            .from('product_images')
            .insert(imageRecords)
            .select();
          
          if (batchError) {
            console.warn('⚠️ Batch insert failed, trying individual inserts:', {
              error: batchError,
              message: batchError.message,
              code: batchError.code,
              details: batchError.details,
              hint: batchError.hint
            });
            
            // Fallback: Insert images one by one
            const insertedImages = [];
            const errors = [];
            
            for (let i = 0; i < imageRecords.length; i++) {
              const record = imageRecords[i];
              console.log(`🔄 Inserting image ${i + 1}/${imageRecords.length}:`, record);
              
              const { data: inserted, error: err } = await supabase
                .from('product_images')
                .insert(record)
                .select()
                .single();
              
              if (err) {
                console.error(`❌ Failed to insert image ${i + 1}:`, {
                  error: err,
                  message: err.message,
                  details: err.details,
                  hint: err.hint,
                  code: err.code,
                  record: record,
                  product_id: savedProductId,
                  user_id: user?.id,
                  company_id: companyId
                });
                errors.push({ index: i, error: err, record });
              } else {
                console.log(`✅ Successfully inserted image ${i + 1}:`, inserted);
                insertedImages.push(inserted);
              }
            }
            
            // Handle results
            if (insertedImages.length > 0) {
              console.log(`✅ Successfully saved ${insertedImages.length}/${imageRecords.length} image(s):`, insertedImages);
              toast.success(`Product saved with ${insertedImages.length} image(s)`);
            }
            
            if (errors.length > 0) {
              console.error(`❌ Failed to save ${errors.length} image(s):`, errors);
              const errorMessages = errors.map(e => e.error.message || e.error.code || 'Unknown error').join(', ');
              toast.error(`Failed to save ${errors.length} image(s): ${errorMessages}`);
              
              // Log detailed error information
              errors.forEach(({ index, error, record }) => {
                console.error(`Image ${index + 1} error:`, {
                  error,
                  record,
                  product_id: record.product_id,
                  url: record.url
                });
              });
            }
          } else if (batchInserted && batchInserted.length > 0) {
            console.log(`✅ Successfully saved ${batchInserted.length} image(s) via batch insert:`, batchInserted);
            toast.success(t('addProductAlibaba.imagesSaved', { count: batchInserted.length }) || `Product saved with ${batchInserted.length} image(s)`);
          } else {
            // Batch insert might succeed but return no data - verify in database
            console.warn('⚠️ Batch insert returned no data - verifying in database...');
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait for DB commit
            
            const { data: verifyImages, error: verifyError } = await supabase
              .from('product_images')
              .select('id, url, is_primary')
              .eq('product_id', savedProductId);
            
            if (verifyError) {
              console.error('❌ Error verifying saved images:', verifyError);
              toast.warning(t('addProductAlibaba.imagesMayNotBeSaved') || 'Images may not have been saved. Please check your product.');
            } else if (verifyImages && verifyImages.length > 0) {
              console.log(`✅ Verified ${verifyImages.length} image(s) in database:`, verifyImages);
              toast.success(t('addProductAlibaba.imagesSaved', { count: verifyImages.length }) || `Product saved with ${verifyImages.length} image(s)`);
            } else {
              console.warn('⚠️ No images found in database after insert attempt');
              toast.warning(t('addProductAlibaba.imagesMayNotBeSaved') || 'Images may not have been saved. Please check your product.');
            }
          }
          }
        } else {
          console.warn('⚠️ No valid image URLs to save after filtering');
          if (isEditing) {
            // If editing and no valid images, don't delete existing ones
            console.log('ℹ️ No new images to save, keeping existing images');
            toast.success('Product updated (images unchanged)');
          } else {
            toast.warning('Product saved but no valid images were found to upload.');
          }
        }
      } else {
        console.warn('⚠️ Cannot save images:', {
          hasImages: formData.images?.length > 0,
          hasProductId: !!savedProductId,
          imageCount: formData.images?.length || 0,
          savedProductId: savedProductId
        });
        
        if (formData.images?.length > 0 && !savedProductId) {
          toast.error('Product ID missing - cannot save images');
        } else if (!formData.images || formData.images.length === 0) {
          if (isEditing) {
            console.log('ℹ️ No images in formData, keeping existing images');
          } else {
            console.log('ℹ️ No images to save (this is OK if user didn\'t upload any)');
          }
        }
      }

      // Only navigate away if this is the final submit (Step 5), not for quick save
      if (currentStep === STEPS.length) {
        toast.success(isEditing ? t('addProductAlibaba.updateSuccess') : t('addProductAlibaba.publishSuccess'));
        setTimeout(() => {
          navigate('/dashboard/products');
        }, 1000);
      } else {
        // Quick save - stay on current step
        toast.success('Changes saved successfully!');
      }
    } catch (error) {
      console.error('Save product error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(t('addProductAlibaba.saveError') + ': ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDelete = async () => {
    if (!isEditing || !productId) return;
    
    if (!confirm(t('addProductAlibaba.deleteConfirm'))) {
      return;
    }

    try {
      const companyId = profile?.company_id || null;
      if (!companyId) {
        navigate('/onboarding/company', { replace: true });
        return;
      }

      // Delete images first
      await supabase.from('product_images').delete().eq('product_id', productId);

      // Delete product (this removes it from marketplace automatically due to status change)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success(t('addProductAlibaba.deleteSuccess'));
      navigate('/dashboard/products');
    } catch (error) {
      toast.error(t('addProductAlibaba.deleteError'));
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

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading product form..." />;
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return <SpinnerWithTimeout message="Redirecting to login..." />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut">
                {isEditing ? t('addProductAlibaba.editProduct') : t('addProductAlibaba.addNewProduct')}
              </h1>
              <p className="text-afrikoni-deep/70 mt-1">
                {isEditing ? t('addProductAlibaba.updateListing') : t('addProductAlibaba.createListing')}
              </p>
            </div>
            {isEditing && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('addProductAlibaba.deleteProduct')}
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      // Allow clicking on completed steps or current step
                      // When editing, allow jumping to any step
                      if (isEditing || currentStep >= step.id) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`flex items-center group ${
                      isEditing || currentStep >= step.id
                        ? 'cursor-pointer hover:opacity-80 transition-opacity'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    disabled={!isEditing && currentStep < step.id}
                    title={
                      isEditing || currentStep >= step.id
                        ? `Go to ${step.name}`
                        : 'Complete previous steps first'
                    }
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id ? 'bg-afrikoni-gold text-white' :
                      currentStep === step.id ? 'bg-afrikoni-gold text-white ring-2 ring-afrikoni-gold ring-offset-2' :
                      'bg-gray-200 text-gray-600'
                    } ${isEditing || currentStep >= step.id ? 'group-hover:scale-110' : ''}`}>
                      {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step.id ? 'text-afrikoni-chestnut' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-afrikoni-gold' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="mt-4" />
            {isEditing && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Tip: Click on any step above to jump directly to it
              </p>
            )}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {isLoading && isEditing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold mr-3" />
                <span className="text-lg text-afrikoni-deep">{t('addProductAlibaba.loadingProduct')}</span>
              </div>
            ) : (
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
                      <Label htmlFor="title">{t('addProductAlibaba.productTitle')}</Label>
                      <div className="relative">
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={async (e) => {
                            const newTitle = e.target.value;
                            setFormData(prev => ({ ...prev, title: newTitle }));
                            
                            // Auto-detect category, country, city when title is entered
                            if (newTitle.trim().length > 5 && !formData.category_id && !formData.country_of_origin) {
                              try {
                                const detection = await autoDetectProductLocation({
                                  title: newTitle,
                                  description: formData.description || '',
                                  sellerCountry: company?.country || '',
                                  sellerCity: company?.city || ''
                                });
                                
                                if (detection.success && detection.confidence > 0.5) {
                                  // Auto-set category if found
                                  if (detection.category) {
                                    const matchedCategory = categories.find(c => 
                                      c.name.toLowerCase() === detection.category.toLowerCase()
                                    );
                                    if (matchedCategory) {
                                      setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
                                      toast.success(`✨ AI detected category: ${matchedCategory.name}`, { duration: 2000 });
                                    }
                                  }
                                  
                                  // Auto-set country if found
                                  if (detection.country) {
                                    const matchedCountry = AFRICAN_COUNTRIES.find(c => 
                                      c.toLowerCase() === detection.country.toLowerCase()
                                    );
                                    if (matchedCountry) {
                                      setFormData(prev => ({ ...prev, country_of_origin: matchedCountry }));
                                      toast.success(`🌍 AI detected country: ${matchedCountry}`, { duration: 2000 });
                                    }
                                  }
                                  
                                  // Auto-set city if found
                                  if (detection.city) {
                                    setFormData(prev => ({ ...prev, city: detection.city }));
                                    toast.success(`📍 AI detected city: ${detection.city}`, { duration: 2000 });
                                  }
                                }
                              } catch (error) {
                                // Silently fail - AI is optional
                              }
                            }
                          }}
                          placeholder={t('addProductAlibaba.productTitlePlaceholder')}
                          className="mt-1"
                        />
                        {formData.title && formData.title.length > 5 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Sparkles className="w-4 h-4 text-afrikoni-gold animate-pulse" />
                          </div>
                        )}
                      </div>
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <Label htmlFor="category">{t('addProductAlibaba.category')}</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue 
                            placeholder={t('addProductAlibaba.selectCategory')}
                            displayValue={formData.category_id ? categories.find(c => c.id === formData.category_id)?.name : undefined}
                          />
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
                        <Label htmlFor="country">{t('addProductAlibaba.countryOfOrigin')}</Label>
                        <Select
                          value={formData.country_of_origin}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, country_of_origin: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('addProductAlibaba.selectCountry')} />
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
                        <Label htmlFor="city">{t('addProductAlibaba.city')}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder={t('addProductAlibaba.cityPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="description">{t('addProductAlibaba.description')}</Label>
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
                              {t('addProductAlibaba.generating')}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {t('addProductAlibaba.aiGenerate')}
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={async (e) => {
                          const newDescription = e.target.value;
                          setFormData(prev => ({ ...prev, description: newDescription }));
                          
                          // Re-detect category/country/city when description is updated (if not already set)
                          if (newDescription.trim().length > 20 && formData.title && (!formData.category_id || !formData.country_of_origin)) {
                            try {
                              const detection = await autoDetectProductLocation({
                                title: formData.title,
                                description: newDescription,
                                sellerCountry: company?.country || '',
                                sellerCity: company?.city || ''
                              });
                              
                              if (detection.success && detection.confidence > 0.6) {
                                // Auto-set category if not already set (but don't override if user manually set it)
                                if (detection.category && !formData.category_id) {
                                  const matchedCategory = categories.find(c => 
                                    c.name.toLowerCase() === detection.category.toLowerCase()
                                  );
                                  if (matchedCategory) {
                                    setFormData(prev => {
                                      // Only set if not already set (prevent overwriting user selection)
                                      if (!prev.category_id) {
                                        return { ...prev, category_id: matchedCategory.id };
                                      }
                                      return prev;
                                    });
                                    toast.success(`✨ AI detected category: ${matchedCategory.name}`, { duration: 2000 });
                                  }
                                }
                                
                                // Auto-set country if not already set
                                if (detection.country && !formData.country_of_origin) {
                                  const matchedCountry = AFRICAN_COUNTRIES.find(c => 
                                    c.toLowerCase() === detection.country.toLowerCase()
                                  );
                                  if (matchedCountry) {
                                    setFormData(prev => ({ ...prev, country_of_origin: matchedCountry }));
                                    toast.success(`🌍 AI detected country: ${matchedCountry}`, { duration: 2000 });
                                  }
                                }
                                
                                // Auto-set city if not already set
                                if (detection.city && !formData.city) {
                                  setFormData(prev => ({ ...prev, city: detection.city }));
                                  toast.success(`📍 AI detected city: ${detection.city}`, { duration: 2000 });
                                }
                              }
                            } catch (error) {
                              // Silently fail - AI is optional
                            }
                          }
                        }}
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
                      <Label>{t('addProductAlibaba.productImages')}</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('addProductAlibaba.uploadHint')}
                      </p>
                      
                      {user?.id ? (
                        <SmartImageUploader
                          images={formData.images}
                          onImagesChange={handleImagesChange}
                          onFirstImageUpload={handleFirstImageUpload}
                          userId={user.id}
                          maxImages={10}
                          maxSizeMB={5}
                        />
                      ) : (
                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold mx-auto mb-4" />
                          <p className="text-gray-600">Loading user information...</p>
                        </div>
                      )}
                      
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
                              <p className="font-semibold">✅ {t('addProductAlibaba.imagesUploaded', { count: formData.images.length })}</p>
                              {formData.images && Array.isArray(formData.images) && formData.images.some(img => {
                                if (typeof img === 'string') return formData.images.indexOf(img) === 0;
                                return img.is_primary || formData.images.indexOf(img) === 0;
                              }) && (
                                <p className="text-sm text-green-700 mt-1">
                                  {t('addProductAlibaba.firstImagePrimary')}
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
                        <Label htmlFor="price">{t('addProductAlibaba.pricePerUnit')}</Label>
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
                        <Label htmlFor="moq">{t('addProductAlibaba.moq')}</Label>
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
                        <Label htmlFor="delivery_time">{t('addProductAlibaba.deliveryTime')}</Label>
                      <Input
                        id="delivery_time"
                        value={formData.delivery_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                        placeholder="e.g., 7-14 business days"
                        className="mt-1"
                      />
                    </div>

                    <div>
                        <Label htmlFor="packaging">{t('addProductAlibaba.packaging')}</Label>
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
                        <Label htmlFor="weight">{t('addProductAlibaba.weight')}</Label>
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
                        <Label htmlFor="length">{t('addProductAlibaba.length')}</Label>
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
                        <Label htmlFor="width">{t('addProductAlibaba.width')}</Label>
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
                      <Label htmlFor="height">{t('addProductAlibaba.height')}</Label>
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
                        {t('addProductAlibaba.calculateShipping')}
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
                          <h3 className="font-semibold text-green-900 mb-1">{t('addProductAlibaba.reviewTitle')}</h3>
                          <p className="text-sm text-green-800">
                            {t('addProductAlibaba.reviewSubtitle')}
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
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {/* Save Changes button - shown when editing on any step */}
                {isEditing && currentStep < STEPS.length && (
                  <Button
                    variant="outline"
                    onClick={() => handleSaveChanges(true)}
                    disabled={isSaving}
                    className="bg-afrikoni-gold/10 hover:bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}

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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

