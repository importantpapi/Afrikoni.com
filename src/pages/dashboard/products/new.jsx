import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole } from '@/utils/roleHelpers';
import { validateProductForm } from '@/utils/validation';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import ProductImageUploader from '@/components/products/ProductImageUploader';
import { sanitizeString } from '@/utils/security';

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
const MOQ_UNITS = ['pieces', 'kg', 'tons', 'containers', 'pallets', 'boxes', 'bags', 'units'];
const SUPPLY_UNITS = ['tons/month', 'containers/month', 'kg/month', 'pieces/month', 'units/month'];

export default function ProductForm() {
  const { id: routeProductId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('id');
  // Prefer route param over query param for better URL structure
  const productId = routeProductId || queryProductId;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentRole, setCurrentRole] = useState('seller');
  const [companyId, setCompanyId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});
  
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
    featured: false
  });

  const [specFields, setSpecFields] = useState([
    { key: '', value: '' }
  ]);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user: userData, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData) {
        navigate('/login');
        return;
      }

      const normalizedRole = getUserRole(profile || userData);
      setCurrentRole(normalizedRole);

      // Allow all users to create products - no role restriction
      // Role is just for display purposes

      // Use companyId from getCurrentUserAndRole, or create if needed
      if (!userCompanyId) {
        const { getOrCreateCompany } = await import('@/utils/companyHelper');
        const createdCompanyId = await getOrCreateCompany(supabase, userData);
        setCompanyId(createdCompanyId);
      } else {
        setCompanyId(userCompanyId);
      }
      
      // If no company exists, create a minimal one automatically
      if (!userCompanyId && userData.email) {
        try {
          const { data: newCompany, error: companyErr } = await supabase
            .from('companies')
            .insert({
              company_name: userData.company_name || userData.full_name || 'My Company',
              owner_email: userData.email,
              role: role === 'hybrid' ? 'hybrid' : role,
              country: userData.country || '',
              email: userData.email
            })
            .select('id')
            .single();
          
          if (!companyErr && newCompany) {
            // Update profile with company_id
            await supabase
              .from('profiles')
              .upsert({
                id: userData.id,
                company_id: newCompany.id
              }, { onConflict: 'id' });
            
            setCompanyId(newCompany.id);
          }
        } catch (err) {
          // Continue anyway - company is optional
        }
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // If editing, load product data
      if (productId) {
        await loadProductData(productId, userCompanyId);
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
    try {
      // Only validate critical issues for publishing
      if (publish) {
        if (!formData.title.trim()) {
          toast.warning('Product title is recommended for publishing');
          // Don't block, just warn
        }
        if (formData.price_max && formData.price_min && parseFloat(formData.price_max) < parseFloat(formData.price_min)) {
          toast.error('Please fix price range before publishing');
          return; // Only block if price range is invalid
        }
        // Images are optional - don't block
      }

      setIsSaving(true);

      // Prepare product data
      const productData = {
        company_id: companyId,
        title: sanitizeString(formData.title),
        short_description: sanitizeString(formData.short_description),
        description: sanitizeString(formData.description),
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        country_of_origin: formData.country_of_origin || null,
        min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : null,
        moq_unit: formData.moq_unit,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        currency: formData.currency,
        lead_time_min_days: formData.lead_time_min_days ? parseInt(formData.lead_time_min_days) : null,
        lead_time_max_days: formData.lead_time_max_days ? parseInt(formData.lead_time_max_days) : null,
        supply_ability_qty: formData.supply_ability_qty ? parseFloat(formData.supply_ability_qty) : null,
        supply_ability_unit: formData.supply_ability_unit,
        packaging_details: sanitizeString(formData.packaging_details),
        shipping_terms: formData.shipping_terms,
        certifications: formData.certifications,
        specifications: formData.specifications,
        status: publish ? 'active' : formData.status,
        featured: formData.featured,
        published_at: publish ? new Date().toISOString() : null
      };

      let savedProductId = productId;

      // Save or update product
      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (error) throw error;
        savedProductId = data.id;
      }

      // Save images
      if (formData.images.length > 0) {
        // Delete existing images if editing
        if (productId) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', savedProductId);
        }

        // Insert new images
        const imageRecords = formData.images.map((img, index) => ({
          product_id: savedProductId,
          url: img.url,
          alt_text: img.alt_text || formData.title,
          is_primary: img.is_primary || index === 0,
          sort_order: img.sort_order !== undefined ? img.sort_order : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      toast.success(publish ? 'Product published successfully!' : 'Product saved as draft');
      navigate('/dashboard/products');
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
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
    <DashboardLayout currentRole={currentRole}>
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
                {productId ? 'Update your product listing' : 'Create a new product listing'}
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

                  <div>
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Detailed product description, features, uses, etc."
                      className="mt-1"
                      rows={6}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category_id">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => handleChange('category_id', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price_min">Minimum Price *</Label>
                      <Input
                        id="price_min"
                        type="number"
                        value={formData.price_min}
                        onChange={(e) => handleChange('price_min', e.target.value)}
                        placeholder="0.00"
                        className={`mt-1 ${errors.price_min ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                      {errors.price_min && (
                        <p className="text-red-500 text-sm mt-1">{errors.price_min}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="price_max">Maximum Price</Label>
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
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleChange('currency', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="NGN">NGN (₦)</SelectItem>
                          <SelectItem value="GHS">GHS (₵)</SelectItem>
                          <SelectItem value="ZAR">ZAR (R)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.price_min && formData.price_max && (
                    <div className="p-3 bg-afrikoni-gold/10 rounded-lg">
                      <p className="text-sm text-afrikoni-deep">
                        Price Range: <span className="font-semibold text-afrikoni-gold">
                          {formData.currency} {formData.price_min} – {formData.price_max}
                        </span>
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
                    onClick={() => handleSave(true)}
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
    </DashboardLayout>
  );
}

