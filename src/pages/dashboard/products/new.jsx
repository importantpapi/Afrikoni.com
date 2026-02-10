import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Rocket, X } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import {
  initialProductFormData,
  ProductWizardProgress,
  ProductBasicsStep,
  ProductMediaStep,
  ProductPricingStep,
  ProductPreviewCard,
  ProductReviewStep,
  ProductSuccessScreen,
} from '@/components/add-product';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Basics', description: 'Name & category' },
  { id: 2, title: 'Media', description: 'Photos & video' },
  { id: 3, title: 'Pricing', description: 'Price & delivery' },
  { id: 4, title: 'Review', description: 'Publish your product' },
];

import { createProduct } from '@/services/productService';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { findOrCreateCategory } from '@/utils/productCategoryIntelligence';
import { CATEGORIES } from '@/components/add-product/types';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user, profileCompanyId } = useDashboardKernel();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialProductFormData);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const completionPercent = useMemo(() => {
    let score = 0;
    const weights = {
      name: 10,
      category: 10,
      description: 15,
      images: 20,
      price: 15,
      moq: 10,
      deliveryRegions: 15,
      leadTime: 5,
    };

    // Calculate score based on formData presence
    if (formData.name) score += weights.name;
    if (formData.category) score += weights.category;
    if (formData.description?.length >= 50) score += weights.description;
    else if (formData.description?.length > 0) score += weights.description * 0.5;
    if (formData.imageUrls?.length >= 3) score += weights.images;
    else if (formData.imageUrls?.length > 0) score += weights.images * (formData.imageUrls.length / 3);
    if (formData.price) score += weights.price;
    if (formData.moq) score += weights.moq;
    if (formData.deliveryRegions?.length > 0) score += weights.deliveryRegions;
    if (formData.leadTime) score += weights.leadTime;

    return Math.round(score);
  }, [formData]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.name?.trim() && formData.category && formData.description?.trim();
      case 2:
        return formData.imageUrls?.length > 0;
      case 3:
        return formData.price && formData.moq && formData.deliveryRegions?.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => currentStep < STEPS.length && setCurrentStep((prev) => prev + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep((prev) => prev - 1);
  const handleGoToStep = (step) => setCurrentStep(step);

  // Helper to get category ID
  const getCategoryId = async () => {
    if (!formData.category) return null;
    const catLabel = CATEGORIES.find(c => c.value === formData.category)?.label || formData.category;
    return await findOrCreateCategory(supabase, catLabel);
  };

  const handleSaveDraft = async () => {
    if (!profileCompanyId || !user) {
      toast.error("You must be logged in to save a draft.");
      return;
    }

    setIsSaving(true);
    try {
      const categoryId = await getCategoryId();

      // Map UI form data to Service expected format
      const serviceFormData = {
        title: formData.name,
        description: formData.description,
        // Since we don't have IDs for categories from the UI yet, likely passing the slug/value as ID or relying on auto-assignment
        // Ideally we should look up the ID, but for now passing the value
        category_id: categoryId,
        price: formData.price,
        min_order_quantity: formData.moq,
        moq_unit: formData.unit,
        currency: formData.currency,
        images: formData.imageUrls,
        status: 'draft',
        shipping_terms: formData.deliveryRegions
      };

      const result = await createProduct({
        user,
        formData: serviceFormData,
        companyId: profileCompanyId,
        publish: false
      });

      if (result.success) {
        toast.success('Draft saved', {
          description: 'You can continue editing later from your product drafts.',
        });
      } else {
        toast.error(result.error || "Failed to save draft");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to upload images
  const uploadImages = async () => {
    const uploadedUrls = [];
    const filesToUpload = formData.images || []; // Expecting File objects here if they were kept

    // If we only have URLs (strings) in formData.images, we can't upload them if they are blobs
    // We need to access the File objects. 
    // ProductMediaStep stores File objects in formData.images

    for (const file of filesToUpload) {
      if (typeof file === 'string') {
        // Already a string (maybe existing URL), keep it
        if (!file.startsWith('blob:')) uploadedUrls.push(file);
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profileCompanyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('[AddProduct] Image upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('[AddProduct] Failed to upload image:', error);
      }
    }
    return uploadedUrls;
  };

  const handlePublish = async () => {
    console.log('[AddProduct] Handle publish triggered');
    if (!profileCompanyId || !user) {
      console.error('[AddProduct] No user or company ID');
      toast.error("You must be logged in to publish.");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Resolve Category
      console.log('[AddProduct] Step 1: Resolving category...');
      const categoryId = await getCategoryId();
      console.log('[AddProduct] Resolved category ID:', categoryId);

      // 2. Upload Images
      console.log('[AddProduct] Step 2: Uploading images...');
      const publicImageUrls = await uploadImages();
      console.log('[AddProduct] Uploaded images:', publicImageUrls);

      if (publicImageUrls.length === 0 && formData.images?.length > 0) {
        console.warn('[AddProduct] No images successfully uploaded, but images were present.');
        // Proceeding, but maybe warn user? 
      }

      // Map UI form data to Service expected format
      const serviceFormData = {
        title: formData.name,
        description: formData.description,
        category_id: categoryId,
        price: formData.price,
        min_order_quantity: formData.moq,
        moq_unit: formData.unit,
        currency: formData.currency,
        images: publicImageUrls, // Use the public URLs
        shipping_terms: formData.deliveryRegions,
        lead_time_min_days: formData.leadTime,
        status: 'active'
      };

      console.log('[AddProduct] Step 3: Calling createProduct service');

      // Add timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 20000)
      );

      const result = await Promise.race([
        createProduct({
          user,
          formData: serviceFormData,
          companyId: profileCompanyId,
          publish: true
        }),
        timeoutPromise
      ]);

      console.log('[AddProduct] createProduct result:', result);

      if (result.success) {
        setIsPublished(true);
        toast.success('Product published successfully!');
      } else {
        console.error('[AddProduct] User error:', result.error);
        toast.error(result.error || "Failed to publish product");
      }
    } catch (err) {
      console.error('[AddProduct] Unexpected error:', err);
      toast.error("An unexpected error occurred: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAnother = () => {
    setFormData(initialProductFormData);
    setCurrentStep(1);
    setIsPublished(false);
  };

  const handleViewProducts = () => {
    navigate('/dashboard/products');
  };

  const handleClose = () => {
    navigate('/dashboard/products');
  };

  if (isPublished) {
    return (
      <div className="os-page os-stagger">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <ProductSuccessScreen
            formData={formData}
            onAddAnother={handleAddAnother}
            onViewProducts={handleViewProducts}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="os-page os-stagger min-h-screen">
      <div className="sticky top-0 z-40 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9">
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-[var(--os-text-primary)]">Add New Product</h1>
                <p className="text-xs text-[var(--os-text-secondary)]">List your product in under 60 seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="hidden sm:flex"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="lg:hidden"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>

          <ProductWizardProgress
            currentStep={currentStep}
            steps={STEPS}
            completionPercent={completionPercent}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className={cn('lg:col-span-3', showPreview && 'hidden lg:block')}>
            <Surface className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[var(--os-text-primary)]">
                  {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-sm text-[var(--os-text-secondary)] mt-1">
                  {currentStep === 1 && "Tell buyers what you're selling"}
                  {currentStep === 2 && 'Add photos to showcase your product'}
                  {currentStep === 3 && 'Set your pricing and delivery details'}
                  {currentStep === 4 && 'Review and publish your listing'}
                </p>
              </div>

              {currentStep === 1 && (
                <ProductBasicsStep formData={formData} onUpdate={updateFormData} />
              )}
              {currentStep === 2 && (
                <ProductMediaStep formData={formData} onUpdate={updateFormData} />
              )}
              {currentStep === 3 && (
                <ProductPricingStep formData={formData} onUpdate={updateFormData} />
              )}
              {currentStep === 4 && (
                <ProductReviewStep formData={formData} onGoToStep={handleGoToStep} />
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  {currentStep === STEPS.length ? (
                    <Button
                      onClick={handlePublish}
                      disabled={isSaving || completionPercent < 50}
                      className="gap-2 min-w-[160px]"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 rounded-full animate-spin" />
                          Publishing...
                        </span>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Publish Product
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={!canProceed} className="gap-2 min-w-[110px]">
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Surface>
          </div>

          <div className={cn('lg:col-span-2', !showPreview && 'hidden lg:block')}>
            <div className="sticky top-36">
              <p className="text-sm font-medium text-[var(--os-text-secondary)] mb-3">Live Preview</p>
              <ProductPreviewCard formData={formData} />

              <div className="mt-4 space-y-2">
                {formData.name && formData.category && (
                  <div className="text-xs rounded-lg px-3 py-2">
                    ✨ Nice! Your product is looking professional.
                  </div>
                )}
                {formData.imageUrls.length > 0 && formData.imageUrls.length < 3 && (
                  <div className="text-xs rounded-lg px-3 py-2">
                    📸 Buyers prefer listings with 3+ photos
                  </div>
                )}
                {formData.imageUrls.length >= 3 && (
                  <div className="text-xs rounded-lg px-3 py-2">
                    📸 Great photo coverage!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
