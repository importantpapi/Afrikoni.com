import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Rocket, X, Loader2 } from 'lucide-react';
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
} from '@/components/add-product';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateProduct } from '@/services/productService';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { findOrCreateCategory } from '@/utils/productCategoryIntelligence';
import { CATEGORIES } from '@/components/add-product/types';

const STEPS = [
    { id: 1, title: 'Basics', description: 'Name & category' },
    { id: 2, title: 'Media', description: 'Photos & video' },
    { id: 3, title: 'Pricing', description: 'Price & delivery' },
    { id: 4, title: 'Review', description: 'Update your product' },
];

export default function EditProduct() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, profileCompanyId } = useDashboardKernel();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialProductFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    // Load existing product data
    useEffect(() => {
        async function loadProduct() {
            if (!productId) return;

            try {
                const { data: product, error } = await supabase
                    .from('products')
                    .select(`
            *,
            categories(id, name)
          `)
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                if (product) {
                    // Map database structure back to form structure
                    setFormData({
                        ...initialProductFormData,
                        productId: product.id,
                        name: product.name,
                        description: product.description,
                        short_description: product.short_description,
                        category: product.categories?.id || '',
                        price: product.price_min || product.price_max,
                        currency: product.currency || 'USD',
                        moq: product.min_order_quantity,
                        unit: product.moq_unit,
                        imageUrls: Array.isArray(product.images) ? product.images : [],
                        images: Array.isArray(product.images) ? product.images : [], // Treat as existing
                        deliveryRegions: product.shipping_terms || [],
                        leadTime: product.lead_time_min_days,
                        status: product.status
                    });
                }
            } catch (err) {
                console.error('[EditProduct] Failed to load product:', err);
                toast.error("Failed to load product details");
                navigate('/dashboard/products');
            } finally {
                setIsLoading(false);
            }
        }

        loadProduct();
    }, [productId, navigate]);

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

    const getCategoryId = async () => {
        if (!formData.category) return null;
        try {
            // If it's already a UUID (from load), use it
            if (formData.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                return formData.category;
            }
            const catLabel = CATEGORIES.find(c => c.value === formData.category)?.label || formData.category;
            return await findOrCreateCategory(supabase, catLabel);
        } catch (error) {
            return null;
        }
    };

    const uploadImages = async () => {
        const uploadedUrls = [];
        const filesToUpload = formData.images || [];

        for (const file of filesToUpload) {
            if (typeof file === 'string') {
                // Keep existing URLs (even if blobs, but should only be full URLs from DB)
                if (!file.startsWith('blob:')) uploadedUrls.push(file);
                continue;
            }

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${profileCompanyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) continue;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            } catch (error) {
                console.error('[EditProduct] Image upload failed:', error.message);
            }
        }
        return uploadedUrls;
    };

    const handleUpdate = async () => {
        if (!profileCompanyId || !user) return;

        setIsSaving(true);
        try {
            const categoryId = await getCategoryId();
            const publicImageUrls = await uploadImages();

            const serviceFormData = {
                title: formData.name,
                description: formData.description,
                category_id: categoryId,
                price_min: formData.price,
                price_max: formData.price,
                min_order_quantity: formData.moq,
                moq_unit: formData.unit,
                currency: formData.currency,
                images: publicImageUrls,
                shipping_terms: formData.deliveryRegions,
                lead_time_min_days: formData.leadTime,
                status: formData.status === 'draft' ? 'draft' : 'active'
            };

            const result = await updateProduct({
                user,
                productId,
                formData: serviceFormData,
                companyId: profileCompanyId,
                publish: serviceFormData.status === 'active'
            });

            if (result.success) {
                if (window.queryClient) {
                    window.queryClient.invalidateQueries({
                        predicate: (query) => query.queryKey[0] === 'products'
                    });
                }
                toast.success('Product updated successfully');
                navigate('/dashboard/products');
            } else {
                toast.error(result.error || "Failed to update product");
            }
        } catch (err) {
            toast.error("Unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
            </div>
        );
    }

    return (
        <div className="os-page os-stagger min-h-screen">
            <div className="sticky top-0 z-40 backdrop-blur border-b">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/products')} className="h-9 w-9">
                                <X className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-os-lg font-semibold text-[var(--os-text-primary)]">Edit Product</h1>
                                <p className="text-os-xs text-[var(--os-text-secondary)]">Update your listing details</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                                <h2 className="text-os-xl font-semibold text-[var(--os-text-primary)]">
                                    {STEPS[currentStep - 1].title}
                                </h2>
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
                                <ProductReviewStep formData={formData} onGoToStep={handleGoToStep} isEdit={true} />
                            )}

                            <div className="flex items-center justify-between mt-8 pt-6 border-t">
                                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Button>

                                <div className="flex items-center gap-2">
                                    {currentStep === STEPS.length ? (
                                        <Button
                                            onClick={handleUpdate}
                                            disabled={isSaving || completionPercent < 50}
                                            className="gap-2 min-w-[160px]"
                                        >
                                            {isSaving ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Updating...
                                                </span>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save Changes
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
                            <p className="text-os-sm font-medium text-[var(--os-text-secondary)] mb-3">Live Preview</p>
                            <ProductPreviewCard formData={formData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
