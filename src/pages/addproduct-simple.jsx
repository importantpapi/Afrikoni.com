/**
 * SIMPLE Add Product - Made Easy for Africa
 * 
 * Only 3 steps:
 * 1. Product Name & Price (that's it!)
 * 2. Add Photos (optional but recommended)
 * 3. Publish (one click)
 * 
 * Everything else is auto-filled with smart defaults
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, ArrowRight, Image as ImageIcon, 
  Lightbulb, Sparkles, Loader2, Home
} from 'lucide-react';
import SmartImageUploader from '@/components/products/SmartImageUploader';
import { toast } from 'sonner';
import { sanitizeString } from '@/utils/security';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, name: 'Basic Info', icon: '📝', description: 'Product name & price' },
  { id: 2, name: 'Photos', icon: '📷', description: 'Add photos (optional)' },
  { id: 3, name: 'Publish', icon: '✅', description: 'Review & publish' },
];

export default function AddProductSimple() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    currency: 'USD',
    images: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error('Please log in to add a product');
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Get company
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      setCompany(companyData);

      // Get categories (for auto-assignment)
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePublish = async () => {
    // Only require title - everything else is optional
    if (!formData.title?.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    setIsPublishing(true);
    try {
      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      if (!companyId) {
        toast.error('Company profile required');
        setIsPublishing(false);
        return;
      }

      // Auto-assign "No Category" if no category selected
      let categoryId = null;
      const noCategory = categories.find(c => c.name === 'No Category');
      if (noCategory) {
        categoryId = noCategory.id;
      } else if (categories.length > 0) {
        categoryId = categories[0].id;
      }

      // Smart defaults
      const price = formData.price ? parseFloat(formData.price) || 0 : 0;
      const description = `Product: ${formData.title}`;
      const images = formData.images.map(img => img.url || img);

      // Create product
      const { data: newProduct, error } = await supabase.from('products').insert({
        title: sanitizeString(formData.title),
        description: sanitizeString(description),
        category_id: categoryId,
        images: images,
        price: price,
        price_min: price,
        min_order_quantity: 1,
        moq: 1,
        unit: 'pieces',
        currency: formData.currency || 'USD',
        country_of_origin: company?.country || '',
        status: 'draft', // New products start as draft, admin can activate later
        company_id: companyId,
        views: 0,
        inquiries: 0
      }).select('id').single();
      
      if (error) throw error;

      // Save images to product_images table
      if (newProduct?.id && images.length > 0) {
        const imageRecords = images.map((img, index) => ({
          product_id: newProduct.id,
          url: typeof img === 'string' ? img : img.url || img,
          alt_text: formData.title || 'Product image',
          is_primary: index === 0,
          sort_order: index
        }));
        await supabase.from('product_images').insert(imageRecords);
      }

      toast.success('✅ Product published successfully!');
      navigate('/dashboard/products');
    } catch (error) {
      toast.error(error.message || 'Failed to publish product');
    } finally {
      setIsPublishing(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-white to-afrikoni-cream py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/products')}
            className="mb-4"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-2">
            Add New Product
          </h1>
          <p className="text-afrikoni-deep/70 text-lg">
            Simple & Easy - Just 3 Steps!
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-2 border-afrikoni-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-xl
                      ${isActive ? 'bg-afrikoni-gold text-white' : 
                        isCompleted ? 'bg-green-600 text-white' : 
                        'bg-afrikoni-deep/10 text-afrikoni-deep/40'}
                      transition-all
                    `}>
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`
                        flex-1 h-1 mx-2
                        ${isCompleted ? 'bg-green-600' : 'bg-afrikoni-deep/10'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-afrikoni-chestnut">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg">
          <CardContent className="p-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                      What are you selling?
                    </h2>
                    <p className="text-afrikoni-deep/70">
                      Just tell us the name and price - we'll handle the rest!
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-lg font-semibold">
                        Product Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Premium African Coffee Beans"
                        className="mt-2 text-lg h-14"
                        autoFocus
                      />
                      <p className="text-sm text-afrikoni-deep/60 mt-2">
                        💡 Tip: Be specific! Include brand, color, or size if relevant.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-lg font-semibold">
                          Price (Optional)
                        </Label>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-afrikoni-deep/60">
                            {formData.currency === 'USD' ? '$' : 
                             formData.currency === 'EUR' ? '€' :
                             formData.currency === 'NGN' ? '₦' :
                             formData.currency === 'ZAR' ? 'R' : '$'}
                          </span>
                          <Input
                            id="price"
                            type="text"
                            value={formData.price}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d.]/g, '');
                              handleChange('price', value);
                            }}
                            placeholder="0.00"
                            className="pl-10 text-lg h-14"
                          />
                        </div>
                        <p className="text-sm text-afrikoni-deep/60 mt-2">
                          Leave empty if you want buyers to contact you for pricing
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="currency" className="text-lg font-semibold">
                          Currency
                        </Label>
                        <select
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => handleChange('currency', e.target.value)}
                          className="mt-2 w-full h-14 px-4 border border-afrikoni-gold/30 rounded-md focus:outline-none focus:ring-2 focus:ring-afrikoni-gold text-lg"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="NGN">NGN (₦)</option>
                          <option value="ZAR">ZAR (R)</option>
                          <option value="GHS">GHS (₵)</option>
                          <option value="KES">KES (KSh)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">✨ Smart Defaults Enabled</p>
                          <p>We'll automatically add a category, description, and set MOQ to 1. You can edit these later!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Photos */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                      Add Photos
                    </h2>
                    <p className="text-afrikoni-deep/70">
                      Photos help buyers see what you're selling (optional but recommended)
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <SmartImageUploader
                      images={formData.images}
                      onImagesChange={(newImages) => handleChange('images', newImages)}
                      userId={user?.id}
                      maxImages={10}
                      maxSizeMB={5}
                    />

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-semibold mb-1">📸 Photo Tips</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>First photo will be your main product image</li>
                            <li>Take photos from different angles</li>
                            <li>Good lighting makes products look better</li>
                            <li>You can skip this step and add photos later</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Publish */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                      Ready to Publish!
                    </h2>
                    <p className="text-afrikoni-deep/70">
                      Review your product and click publish
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="border-2 border-afrikoni-gold/30">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-xl mb-4 text-afrikoni-chestnut">
                          {formData.title || 'Untitled Product'}
                        </h3>
                        
                        <div className="space-y-3">
                          {formData.price && (
                            <div className="flex justify-between">
                              <span className="text-afrikoni-deep/70">Price:</span>
                              <span className="font-semibold">
                                {formData.currency === 'USD' ? '$' : 
                                 formData.currency === 'EUR' ? '€' :
                                 formData.currency === 'NGN' ? '₦' :
                                 formData.currency === 'ZAR' ? 'R' : '$'}
                                {parseFloat(formData.price || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span className="text-afrikoni-deep/70">Photos:</span>
                            <span className="font-semibold">
                              {formData.images.length} {formData.images.length === 1 ? 'photo' : 'photos'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-afrikoni-deep/70">Category:</span>
                            <span className="font-semibold">Auto-assigned</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">💡 After Publishing</p>
                          <p>You can edit your product anytime to add more details, photos, or update pricing!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-afrikoni-gold/20">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                ← Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || !formData.title?.trim()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Publish Product
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

