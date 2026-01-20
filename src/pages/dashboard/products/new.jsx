import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { validateProductForm } from '@/utils/validation';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { ArrowLeft, ArrowRight, Save, Send, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ProductImageUploader from '@/components/products/ProductImageUploader';
import { sanitizeString } from '@/utils/security';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import ProductLimitGuard from '@/components/subscription/ProductLimitGuard';
import { createProduct, updateProduct } from '@/services/productService';
import { AFRICAN_CURRENCIES, convertCurrency, formatCurrency } from '@/utils/currencyConverter';

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
const SUPPLY_UNITS = ['tons/month', 'containers/month', 'kg/month', 'grams/month', 'liters/month', 'pieces/month', 'units/month'];

export default function ProductForm() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, user, capabilities, canLoadData, isSystemReady } = useDashboardKernel();
  
  const { id: routeProductId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('id');
  // Prefer route param over query param for better URL structure
  const productId = routeProductId || queryProductId;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // ✅ KERNEL MIGRATION: Derive role from capabilities
  const derivedRole = capabilities?.can_sell && capabilities?.sell_status === 'approved' ? 'seller' : 'buyer';
  const [currentRole, setCurrentRole] = useState(derivedRole);
  const [companyId, setCompanyId] = useState(profileCompanyId || null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    short_description: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    country_of_origin: '',
    
    // Step 2: Pricing & MOQ
    min_order_quantity: '',
    moq_unit: 'pieces',
    price_min: '',
    price_max: '',
    currency: 'USD',
    
    // Step 3: Supply Ability & Lead Time
    lead_time_min_days: '',
    lead_time_max_days: '',
    supply_ability_qty: '',
    supply_ability_unit: 'tons/month',
    packaging_details: '',
    
    // Step 4: Logistics & Terms
    shipping_terms: [],
    specifications: {},
    
    // Step 5: Certifications
    certifications: [],
    
    // Step 6: Images
    images: [],
    
    // Status
    status: 'draft',
    featured: false,
    // Governance flags
    is_standardized: false,
    completeness_score: 0
  });

  const [specFields, setSpecFields] = useState([
    { key: '', value: '' }
  ]);
  const [productLimitInfo, setProductLimitInfo] = useState(null);
  const [showLimitGuard, setShowLimitGuard] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      loadSubcategories(formData.category_id);
    } else {
      setSubcategories([]);
    }
  }, [formData.category_id]);

  useEffect(() => {
    if (companyId && !productId) {
      // Only check limit when creating new products, not editing
      checkLimit();
    }
  }, [companyId, productId]);

  const checkLimit = async (cid = companyId) => {
    if (!cid) return;
    
    try {
      const limitInfo = await checkProductLimit(cid);
      setProductLimitInfo(limitInfo);
      
      // Show guard if limit reached
      if (!limitInfo.canAdd && limitInfo.needsUpgrade) {
        setShowLimitGuard(true);
      }
    } catch (error) {
      console.error('Error checking product limit:', error);
    }
  };

  const loadData = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      if (profileCompanyId) {
        setCompanyId(profileCompanyId);
      } else {
        // ✅ KERNEL COMPLIANCE: Use user from kernel instead of direct auth API call
        const userEmail = user?.email || '';
        
        if (userEmail) {
          try {
            // ✅ KERNEL MIGRATION: Create company using kernel values
            const role = (capabilities?.can_buy && capabilities?.can_sell) ? 'hybrid' : 
                        (capabilities?.can_sell && capabilities?.sell_status === 'approved' ? 'seller' : 'buyer');
            
            const { data: newCompany, error: companyErr } = await supabase
              .from('companies')
              .insert({
                company_name: userEmail.split('@')[0] || 'My Company',
                owner_email: userEmail,
                role: role,
                country: '',
                email: userEmail
              })
              .select('id')
              .single();
            
            if (!companyErr && newCompany) {
              // Update profile with company_id
              await supabase
                .from('profiles')
                .upsert({
                  id: userId,
                  company_id: newCompany.id
                }, { onConflict: 'id' });
              
              setCompanyId(newCompany.id);
            }
          } catch (err) {
            console.error('Error creating company:', err);
            setError('Failed to initialize company. Please try again.');
          }
        }
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Failed to load categories:', categoriesError);
        toast.error('Failed to load categories. Please refresh the page.');
      } else {
        setCategories(categoriesData || []);
      }

      // ✅ KERNEL MIGRATION: If editing, load product data
      if (productId) {
        const finalCompanyId = profileCompanyId || companyId;
        await loadProductData(productId, finalCompanyId);
      } else {
        // If coming from supplier onboarding, pre-fill basic fields
        const fromOnboarding = searchParams.get('fromOnboarding') === '1';
        if (fromOnboarding) {
          const prefillTitle = searchParams.get('title') || '';
          const prefillDescription = searchParams.get('description') || '';
          const prefillPriceMin = searchParams.get('price_min') || '';
          const prefillCategoryId = searchParams.get('category_id') || '';

          setFormData(prev => ({
            ...prev,
            title: prefillTitle || prev.title,
            description: prefillDescription || prev.description,
            price_min: prefillPriceMin || prev.price_min,
            category_id: prefillCategoryId || prev.category_id,
          }));
        }
      }
    } catch (error) {
      toast.error('Failed to load form data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductData = async (id, userCompanyId) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*)
        `)
        .eq('id', id)
        .eq('company_id', userCompanyId)
        .single();

      if (error) throw error;

      // Load images
      const productImages = (product.product_images || []).map(img => ({
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      }));

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

      // Convert specs object to array for form
      const specFieldsArray = Object.entries(specs).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      if (specFieldsArray.length === 0) {
        specFieldsArray.push({ key: '', value: '' });
      }
      setSpecFields(specFieldsArray);

      setFormData({
        title: product.title || '',
        short_description: product.short_description || '',
        description: product.description || '',
        category_id: product.category_id || '',
        subcategory_id: product.subcategory_id || '',
        country_of_origin: product.country_of_origin || '',
        min_order_quantity: product.min_order_quantity || '',
        moq_unit: product.moq_unit || product.unit || 'pieces',
        price_min: product.price_min || product.price || '',
        price_max: product.price_max || product.price || '',
        currency: product.currency || 'USD',
        lead_time_min_days: product.lead_time_min_days || '',
        lead_time_max_days: product.lead_time_max_days || '',
        supply_ability_qty: product.supply_ability_qty || '',
        supply_ability_unit: product.supply_ability_unit || 'tons/month',
        packaging_details: product.packaging_details || product.packaging || '',
        shipping_terms: product.shipping_terms || [],
        specifications: specs,
        certifications: product.certifications || [],
        images: productImages,
        status: product.status || 'draft',
        featured: product.featured || false
      });
    } catch (error) {
      toast.error('Failed to load product data');
      navigate('/dashboard/products');
    }
  };

  const loadSubcategories = async (categoryId) => {
    // For now, subcategories are handled via product_categories table
    // This can be enhanced later
    setSubcategories([]);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecFieldChange = (index, field, value) => {
    const newFields = [...specFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setSpecFields(newFields);
    
    // Update specifications object
    const specs = {};
    newFields.forEach(field => {
      if (field.key && field.value) {
        specs[field.key] = field.value;
      }
    });
    setFormData(prev => ({ ...prev, specifications: specs }));
  };

  const addSpecField = () => {
    setSpecFields([...specFields, { key: '', value: '' }]);
  };

  const removeSpecField = (index) => {
    const newFields = specFields.filter((_, i) => i !== index);
    if (newFields.length === 0) {
      newFields.push({ key: '', value: '' });
    }
    setSpecFields(newFields);
    
    // Update specifications
    const specs = {};
    newFields.forEach(field => {
      if (field.key && field.value) {
        specs[field.key] = field.value;
      }
    });
    setFormData(prev => ({ ...prev, specifications: specs }));
  };

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

  const handleCertificationRemove = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  const handleShippingTermToggle = (term) => {
    setFormData(prev => ({
      ...prev,
      shipping_terms: prev.shipping_terms.includes(term)
        ? prev.shipping_terms.filter(t => t !== term)
        : [...prev.shipping_terms, term]
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.title.trim()) {
      toast.error('Please enter a product title first so Afrikoni AI understands what you sell.');
      return;
    }
    setIsGenerating(true);
    try {
      const selectedCategory = categories.find((c) => c.id === formData.category_id);
      // Use centralized KoniAI listing generator for standardized structure
      const { generateProductListing } = await import('@/ai/aiFunctions');
      const { success, data } = await generateProductListing({
        title: formData.title,
        description: formData.description,
        category: selectedCategory?.name,
        country: formData.country_of_origin,
        language: 'English',
        tone: 'Professional, neutral, trade-focused'
      });

      if (success && data) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          // Short description stays a controllable, factual teaser
          short_description: prev.short_description || prev.title || '',
          description: data.description || prev.description || '',
          is_standardized: true
        }));
        toast.success('Afrikoni AI standardized your product description.');
      } else {
        toast.error('Afrikoni AI could not standardize the description. Please try again.');
      }
    } catch (error) {
      // non-blocking
      toast.error('Afrikoni AI could not generate the description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const validateStep = (step) => {
    // Use centralized validation
    const validationErrors = validateProductForm(formData);
    setErrors(validationErrors);
    
    // Filter errors for current step
    const stepErrors = Object.keys(validationErrors).filter(key => {
      // Map field names to steps
      const step1Fields = ['title'];
      const step2Fields = ['price_min', 'price_max', 'min_order_quantity'];
      const step3Fields = ['lead_time_min_days', 'lead_time_max_days'];
      
      const fieldStep = step1Fields.includes(key) ? 1 : step2Fields.includes(key) ? 2 : step3Fields.includes(key) ? 3 : 0;
      return fieldStep === step;
    });
    
    if (stepErrors.length > 0) {
      toast.error('Please fix the errors before continuing');
      return false;
    }
    
    return true;
  };

  const handleSave = async (publish = false) => {
    // ✅ STATE MANAGEMENT FIX: Set loading state before async operation
    setIsSaving(true);
    
    try {
      // ✅ KERNEL ALIGNMENT: Delegate all business logic to productService
      // Frontend only sends user-inputted fields - Kernel handles the rest
      const result = productId
        ? await updateProduct({
            user,
            productId,
            formData,
            companyId: profileCompanyId || companyId,
            publish
          })
        : await createProduct({
            user,
            formData,
            companyId: profileCompanyId || companyId,
            publish
          });

      if (!result.success) {
        // ✅ KERNEL ALIGNMENT: Service returns clean error messages
        toast.error(result.error || 'Failed to save product. Please try again.');
        
        // ✅ KERNEL ALIGNMENT: Handle upgrade prompt if needed
        if (result.needsUpgrade) {
          setShowLimitGuard(true);
        }
        
        // ✅ FORENSIC FIX: Reset state before early return to prevent spinner zombie
        setIsSaving(false);
        return;
      }

      // ✅ SUCCESS: Show success message
      toast.success(publish ? 'Product published successfully!' : 'Product saved as draft');
      
      // ✅ FORENSIC FIX: Reset state BEFORE navigation to prevent state zombies
      setIsSaving(false);
      
      // ✅ FORENSIC FIX: Small delay to ensure state updates before navigation
      // This prevents component unmounting before state cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ NAVIGATION: Redirect to products list
      navigate('/dashboard/products');
      
    } catch (error) {
      // ✅ CRITICAL FIX: Catch all errors, show toast, and log for debugging
      // This is the "Safety Valve" - ensures button becomes clickable again even if code crashes
      console.error('[ProductForm] Error saving product:', error);
      toast.error(`Failed to save product: ${error.message || 'Please try again'}`);
    } finally {
      // ✅ STATE MANAGEMENT FIX: Wrap submit logic in try/catch/finally block
      // In finally block, ALWAYS set setIsSaving(false)
      // This ensures the UI never stays stuck in a loading state if a database error occurs
      // The finally block ALWAYS executes, even if we return early or throw an error
      setIsSaving(false);
    }
  };

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading product form..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          loadData();
        }}
      />
    );
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Pricing & MOQ', icon: '💰' },
    { number: 3, title: 'Supply & Lead Time', icon: '📦' },
    { number: 4, title: 'Logistics & Terms', icon: '🚚' },
    { number: 5, title: 'Certifications', icon: '✅' },
    { number: 6, title: 'Images', icon: '🖼️' }
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/products')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">
                {productId ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
                {productId ? 'Update your product listing' : 'Create a new product listing that follows Afrikoni’s standardized B2B format.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between overflow-x-auto">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        ${currentStep === step.number
                          ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                          : currentStep > step.number
                          ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                          : 'bg-afrikoni-cream text-afrikoni-deep'
                        }
                      `}
                    >
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <span className="text-xs text-afrikoni-deep mt-1 text-center hidden md:block">
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`
                        h-1 w-full mx-2
                        ${currentStep > step.number ? 'bg-afrikoni-gold' : 'bg-afrikoni-cream'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardContent className="p-5 md:p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="e.g., Premium Cocoa Beans from Ghana"
                      className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="short_description">Short Description</Label>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => handleChange('short_description', e.target.value)}
                      placeholder="Brief one-line description"
                      className="mt-1"
                      maxLength={150}
                    />
                    <p className="text-xs text-afrikoni-deep/70 mt-1">
                      {formData.short_description.length}/150 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Full Description</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating || !formData.title}
                        className="flex items-center gap-1 text-xs border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                      >
                        <Sparkles className="w-3 h-3" />
                        {isGenerating ? 'Generating…' : 'Afrikoni AI help'}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => {
                        // Hard boundary: once standardized, suppliers cannot free-edit description
                        if (formData.is_standardized) {
                          toast.error('Description is governed by Afrikoni standard. To change details, update factual fields such as MOQ, specifications, or packaging.');
                          return;
                        }
                        handleChange('description', e.target.value);
                      }}
                      placeholder={
                        formData.is_standardized
                          ? 'Description is managed by Afrikoni AI to keep the marketplace professional and consistent.'
                          : 'Write a few factual lines or let Afrikoni AI generate a standardized description for you.'
                      }
                      className={`mt-1 ${formData.is_standardized ? 'bg-afrikoni-cream/60 cursor-not-allowed' : ''}`}
                      rows={6}
                      disabled={formData.is_standardized}
                    />
                    {formData.is_standardized && (
                      <p className="text-[11px] text-afrikoni-deep/70 mt-1">
                        Afrikoni locks this section to protect buyers and help all entrepreneurs look equally professional.
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category_id">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => {
                          handleChange('category_id', value);
                          // Also clear subcategory when category changes
                          handleChange('subcategory_id', '');
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue 
                            placeholder="Select category"
                            displayValue={categories.find(c => c.id === formData.category_id)?.name}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-afrikoni-deep/70">
                              No categories available
                            </div>
                          ) : (
                            categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.category_id && (
                        <p className="text-sm text-red-600 mt-1">{errors.category_id}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="country_of_origin">Country of Origin</Label>
                      <Select
                        value={formData.country_of_origin}
                        onValueChange={(value) => handleChange('country_of_origin', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {AFRICAN_COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Pricing & MOQ */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_order_quantity">Minimum Order Quantity *</Label>
                      <Input
                        id="min_order_quantity"
                        type="number"
                        value={formData.min_order_quantity}
                        onChange={(e) => handleChange('min_order_quantity', e.target.value)}
                        placeholder="e.g., 100"
                        className={`mt-1 ${errors.min_order_quantity ? 'border-red-500' : ''}`}
                        min="1"
                      />
                      {errors.min_order_quantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.min_order_quantity}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="moq_unit">MOQ Unit *</Label>
                      <Select
                        value={formData.moq_unit}
                        onValueChange={(value) => handleChange('moq_unit', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOQ_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price_per_unit">Price per Unit *</Label>
                    <div className="flex gap-2 mt-1">
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleChange('currency', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {AFRICAN_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} ({currency.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="price_per_unit"
                        type="number"
                        value={formData.price_min || ''}
                        onChange={(e) => handleChange('price_min', e.target.value)}
                        placeholder="0.00"
                        className={`flex-1 ${errors.price_min ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.price_min && (
                      <p className="text-red-500 text-sm mt-1">{errors.price_min}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price_max">Maximum Price (Optional)</Label>
                    <Input
                      id="price_max"
                      type="number"
                      value={formData.price_max}
                      onChange={(e) => handleChange('price_max', e.target.value)}
                      placeholder="0.00"
                      className={`mt-1 ${errors.price_max ? 'border-red-500' : ''}`}
                      min="0"
                      step="0.01"
                    />
                    {errors.price_max && (
                      <p className="text-red-500 text-sm mt-1">{errors.price_max}</p>
                    )}
                    <p className="text-xs text-afrikoni-deep/70 mt-1">
                      Leave empty if you have a fixed price per unit
                    </p>
                  </div>

                  {formData.price_min && formData.price_max && (
                    <div className="p-3 bg-afrikoni-gold/10 rounded-lg space-y-2">
                      <p className="text-sm text-afrikoni-deep">
                        Price Range: <span className="font-semibold text-afrikoni-gold">
                          {formatCurrency(parseFloat(formData.price_min) || 0, formData.currency || 'USD')} – {formatCurrency(parseFloat(formData.price_max) || 0, formData.currency || 'USD')}
                        </span>
                      </p>
                      <p className="text-xs text-afrikoni-deep/70">
                        Buyers will see prices converted to their local currency automatically.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Supply Ability & Lead Time */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lead_time_min_days">Minimum Lead Time (days)</Label>
                      <Input
                        id="lead_time_min_days"
                        type="number"
                        value={formData.lead_time_min_days}
                        onChange={(e) => handleChange('lead_time_min_days', e.target.value)}
                        placeholder="e.g., 7"
                        className="mt-1"
                        min="1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lead_time_max_days">Maximum Lead Time (days)</Label>
                      <Input
                        id="lead_time_max_days"
                        type="number"
                        value={formData.lead_time_max_days}
                        onChange={(e) => handleChange('lead_time_max_days', e.target.value)}
                        placeholder="e.g., 14"
                        className={`mt-1 ${errors.lead_time_max_days ? 'border-red-500' : ''}`}
                        min="1"
                      />
                      {errors.lead_time_max_days && (
                        <p className="text-red-500 text-sm mt-1">{errors.lead_time_max_days}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supply_ability_qty">Supply Ability Quantity</Label>
                      <Input
                        id="supply_ability_qty"
                        type="number"
                        value={formData.supply_ability_qty}
                        onChange={(e) => handleChange('supply_ability_qty', e.target.value)}
                        placeholder="e.g., 1000"
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="supply_ability_unit">Supply Ability Unit</Label>
                      <Select
                        value={formData.supply_ability_unit}
                        onValueChange={(value) => handleChange('supply_ability_unit', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPLY_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="packaging_details">Packaging Details</Label>
                    <Textarea
                      id="packaging_details"
                      value={formData.packaging_details}
                      onChange={(e) => handleChange('packaging_details', e.target.value)}
                      placeholder="Describe packaging, containers, labeling, etc."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Logistics & Terms */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label>Shipping Terms</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SHIPPING_TERMS.map((term) => (
                        <Button
                          key={term}
                          type="button"
                          variant={formData.shipping_terms.includes(term) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleShippingTermToggle(term)}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-afrikoni-deep/70 mt-2">
                      Select all applicable shipping terms (FOB, CIF, etc.)
                    </p>
                  </div>

                  <div>
                    <Label>Product Specifications</Label>
                    <div className="space-y-2 mt-2">
                      {specFields.map((field, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Specification name (e.g., Moisture %)"
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpecField(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSpecField}
                      >
                        + Add Specification
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Certifications */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="certifications">Certifications & Standards</Label>
                    <Input
                      id="certifications"
                      placeholder="Type certification and press Enter (e.g., ISO 9001, Organic Certified)"
                      onKeyDown={handleCertificationAdd}
                      className="mt-1"
                    />
                    <p className="text-xs text-afrikoni-deep/70 mt-1">
                      Press Enter to add each certification
                    </p>
                  </div>

                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert) => (
                        <Badge
                          key={cert}
                          variant="primary"
                          className="flex items-center gap-1"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => handleCertificationRemove(cert)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 6: Images */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ProductImageUploader
                    images={formData.images}
                    onImagesChange={(images) => handleChange('images', images)}
                    productId={productId}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-afrikoni-gold/20">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                {currentStep === 6 ? (
                  <Button
                    variant="primary"
                    onClick={async () => {
                      // Validate before publishing
                      const validationErrors = validateProductForm(formData);
                      const criticalErrors = Object.keys(validationErrors).filter(key => 
                        ['title', 'category_id', 'price_min', 'price_max', 'min_order_quantity'].includes(key)
                      );
                      
                      if (criticalErrors.length > 0) {
                        setErrors(validationErrors);
                        toast.error('Please fix the required fields before publishing');
                        // Go back to first step with errors
                        if (!formData.title || !formData.category_id) {
                          setCurrentStep(1);
                        } else if ((!formData.price_min && !formData.price_max) || !formData.min_order_quantity) {
                          setCurrentStep(2);
                        }
                        return;
                      }
                      
                      await handleSave(true);
                    }}
                    disabled={isSaving}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSaving ? 'Publishing...' : 'Publish Product'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (validateStep(currentStep)) {
                        setCurrentStep(Math.min(6, currentStep + 1));
                      }
                    }}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
    </>
  );
}

