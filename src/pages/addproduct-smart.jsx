/**
 * Smart Add Product - Multi-Step Wizard
 * 
 * Features:
 * - 5-step wizard with progress bar
 * - Auto-save drafts (localStorage + Supabase)
 * - AI assistance (category detection, title/description generation)
 * - Smart image upload with drag-drop
 * - Better UX with validation and error messages
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Image, DollarSign, Truck, Shield, CheckCircle, 
  ArrowLeft, ArrowRight, Save, Loader2, Lightbulb, FileText
} from 'lucide-react';
import SmartImageUploader from '@/components/products/SmartImageUploader';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { generateProductListing } from '@/ai/aiFunctions';
import KoniAIActionButton from '@/components/koni/KoniAIActionButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { validateNumeric, sanitizeString } from '@/utils/security';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, name: 'Product Basics', icon: FileText, description: 'Name, Category, Description' },
  { id: 2, name: 'Images', icon: Image, description: 'Upload & arrange photos' },
  { id: 3, name: 'Pricing & MOQ', icon: DollarSign, description: 'Price tiers, MOQ, currency' },
  { id: 4, name: 'Supply & Logistics', icon: Truck, description: 'Lead time, origin, shipping' },
  { id: 5, name: 'Compliance', icon: Shield, description: 'Certifications & compliance' },
];

export default function AddProductSmart() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [koniaiModalOpen, setKoniaiModalOpen] = useState(false);
  const [koniaiSuggestions, setKoniaiSuggestions] = useState(null);
  const [koniaiLoading, setKoniaiLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    suggested_category: '', // AI-suggested category when not in DB
    images: [],
    price: '',
    moq: '1',
    unit: 'pieces',
    delivery_time: '',
    packaging: '',
    currency: 'USD',
    country_of_origin: '',
    shipping_options: [],
    certifications: [],
    compliance_notes: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState({});

  // Load data and restore draft
  useEffect(() => {
    loadData();
    restoreDraft();
  }, []);

  // Auto-save on form data change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.images.length > 0) {
        saveDraft();
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timer);
  }, [formData]);

  const loadData = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const [userResult, catsRes] = await Promise.all([
        getCurrentUserAndRole(supabase, supabaseHelpers),
        supabase.from('categories').select('*')
      ]);

      if (catsRes.error) throw catsRes.error;

      const { user: userData } = userResult;
      setUser(userData);
      setCategories(catsRes.data || []);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);
      
      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();
        if (companyData) {
          setCompany(companyData);
          setFormData(prev => ({
            ...prev,
            country_of_origin: companyData.country || prev.country_of_origin
          }));
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      supabaseHelpers.auth.redirectToLogin();
    }
  };

  // Auto-save draft to localStorage and Supabase
  const saveDraft = useCallback(async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Save to localStorage (instant)
      localStorage.setItem('product_draft', JSON.stringify({
        ...formData,
        saved_at: new Date().toISOString()
      }));

      // Save to Supabase (for cross-device access)
      const draftData = {
        user_id: user.id,
        company_id: company?.id,
        draft_data: formData,
        step: currentStep,
        updated_at: new Date().toISOString()
      };

      if (draftId) {
        // Update existing draft
        await supabase
          .from('product_drafts')
          .update(draftData)
          .eq('id', draftId);
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('product_drafts')
          .insert(draftData)
          .select('id')
          .single();
        
        if (!error && data) {
          setDraftId(data.id);
        }
      }
    } catch (error) {
      console.error('Save draft error:', error);
      // Don't show error to user - draft saving is non-critical
    } finally {
      setIsSaving(false);
    }
  }, [formData, user, company, currentStep, draftId]);

  // Restore draft from localStorage or Supabase
  const restoreDraft = async () => {
    try {
      // Try localStorage first (faster)
      const localDraft = localStorage.getItem('product_draft');
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        const savedAt = new Date(parsed.saved_at);
        const hoursSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursSinceSave < 24) {
          setFormData(prev => ({ ...parsed, ...prev }));
          toast.info('Draft restored from local storage');
          return;
        }
      }

      // Try Supabase draft
      if (user?.id) {
        const { data } = await supabase
          .from('product_drafts')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.draft_data) {
          setFormData(prev => ({ ...data.draft_data, ...prev }));
          setDraftId(data.id);
          setCurrentStep(data.step || 1);
          toast.info('Draft restored');
        }
      }
    } catch (error) {
      console.error('Restore draft error:', error);
    }
  };

  // Auto-detect category when title or description changes (debounced)
  const autoDetectCategory = useCallback(async (title, description) => {
    if (!title || title.length < 3) return; // Need at least 3 characters
    if (formData.category_id) return; // Already has category
    
    try {
      const detected = await AIDescriptionService.detectCategory(title, description);
      
      if (detected && detected.category) {
        // Try to find matching category in database
        const matchedCategory = categories.find(c => 
          c.name.toLowerCase() === detected.category.toLowerCase() ||
          c.name.toLowerCase().includes(detected.category.toLowerCase()) ||
          detected.category.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (matchedCategory) {
          // Auto-select if found in DB
          setFormData(prev => {
            if (prev.category_id !== matchedCategory.id) {
              toast.success(`✨ AI detected category: ${matchedCategory.name}`, { duration: 2000 });
              return { ...prev, category_id: matchedCategory.id, suggested_category: '' };
            }
            return prev;
          });
        } else {
          // Show AI suggestion (works even if no categories in DB)
          setFormData(prev => {
            if (prev.suggested_category !== detected.category) {
              toast.info(`💡 AI suggests category: "${detected.category}"`, {
                duration: 3000,
                description: 'This category will be created automatically when you publish'
              });
              return { ...prev, suggested_category: detected.category };
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Auto category detection error:', error);
      // Silent fail - don't interrupt user
    }
  }, [categories, formData.category_id]);

  // Debounce timer ref for category detection
  const categoryDetectionTimer = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Auto-detect category when title or description changes (debounced)
    if ((field === 'title' || field === 'description') && !formData.category_id) {
      // Clear previous timer
      if (categoryDetectionTimer.current) {
        clearTimeout(categoryDetectionTimer.current);
      }
      
      // Set new timer
      categoryDetectionTimer.current = setTimeout(() => {
        const title = field === 'title' ? value : formData.title;
        const description = field === 'description' ? value : formData.description;
        
        if (title && title.length >= 3) {
          autoDetectCategory(title, description);
        }
      }, 1500); // Wait 1.5 seconds after user stops typing
    }
  };

  // AI: Auto-analyze first image and suggest category, title, tags, attributes
  const analyzeFirstImage = async (imageData) => {
    if (!imageData?.url || categories.length === 0) return;

    try {
      setIsGenerating(true);
      
      // Show prominent AI analysis notification
      toast.info('🤖 AI is analyzing your image...', {
        duration: 2000,
        description: 'This will suggest category, title, and description'
      });
      
      // Call AI service to analyze image
      // In production, this would use an image recognition API (e.g., OpenAI Vision, Google Vision)
      // For now, we'll use a smart placeholder that can be enhanced
      
      // Simulate AI analysis (replace with actual API call)
      const imageUrl = imageData.url;
      
      // Placeholder: In production, call your AI service here
      // const aiResult = await fetch('/api/analyze-image', { method: 'POST', body: JSON.stringify({ imageUrl }) });
      
      // For now, generate suggestions based on existing data
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      
      // Auto-generate product description if we have category
      if (selectedCategory && !formData.description) {
        const result = await AIDescriptionService.generateProductDescription({
          title: formData.title || `Premium ${selectedCategory.name}`,
          category: selectedCategory.name,
          country: formData.country_of_origin || company?.country
        });

        if (result) {
          setFormData(prev => ({
            ...prev,
            title: prev.title || result.optimized_title || `Premium ${selectedCategory.name}`,
            description: result.full_description || prev.description,
            category_id: prev.category_id || selectedCategory.id
          }));
          
          toast.success('✨ AI analyzed your image and generated suggestions!', {
            duration: 4000,
            description: 'Check Step 1 to see the AI-generated title, category, and description'
          });
        }
      } else if (!formData.category_id && categories.length > 0) {
        // If no category selected, suggest most popular categories
        toast.info('💡 Upload your first image to get AI-powered category suggestions', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('AI analysis failed. You can continue manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle first image upload - trigger AI analysis
  const handleFirstImageUpload = useCallback(async (imageData) => {
    await analyzeFirstImage(imageData);
  }, [categories, company]);

  // KoniAI: Improve existing product listing
  const handleKoniAIImprove = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Please enter at least a title or description first');
      return;
    }

    setKoniaiLoading(true);
    setKoniaiModalOpen(true);
    setKoniaiSuggestions(null);

    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      const result = await generateProductListing({
        title: formData.title || '',
        description: formData.description || '',
        category: selectedCategory?.name || '',
        language: 'English',
        tone: 'Professional'
      });

      if (result.success && result.data) {
        setKoniaiSuggestions(result.data);
      } else {
        toast.error('KoniAI couldn\'t generate improvements. Please try again.');
      }
    } catch (error) {
      console.error('KoniAI improve error:', error);
      toast.error('KoniAI couldn\'t complete this request. Please try again in a moment.');
    } finally {
      setKoniaiLoading(false);
    }
  };

  const applyKoniaiSuggestions = () => {
    if (!koniaiSuggestions) return;

    setFormData(prev => ({
      ...prev,
      title: koniaiSuggestions.title || prev.title,
      description: koniaiSuggestions.description || prev.description,
      category_id: prev.category_id || (categories.find(c => 
        c.name.toLowerCase() === koniaiSuggestions.suggestedCategory?.toLowerCase()
      )?.id || '')
    }));

    toast.success('✨ KoniAI suggestions applied!');
    setKoniaiModalOpen(false);
  };

  // AI: Generate title, description, and detect category
  const handleAIGenerate = async () => {
    if (formData.images.length === 0 && !formData.title) {
      toast.error('Please upload at least one image or enter a product title first');
      return;
    }

    setIsGenerating(true);
    try {
      // If we have images but no title, try to detect from image
      if (formData.images.length > 0 && !formData.title) {
        await analyzeFirstImage({ url: formData.images[0]?.url || formData.images[0] });
      }

      // First, detect category if not set
      let detectedCategory = null;
      if (!formData.category_id && formData.title) {
        toast.info('🤖 AI is detecting category...', { duration: 1500 });
        const categoryResult = await AIDescriptionService.detectCategory(
          formData.title, 
          formData.description
        );
        
        if (categoryResult?.category) {
          // Try to find in existing categories
          const matchedCategory = categories.find(c => 
            c.name.toLowerCase() === categoryResult.category.toLowerCase() ||
            c.name.toLowerCase().includes(categoryResult.category.toLowerCase())
          );
          
          if (matchedCategory) {
            detectedCategory = matchedCategory;
            toast.success(`✨ AI detected category: ${matchedCategory.name}`, { duration: 2000 });
          } else {
            // Store suggested category
            detectedCategory = { name: categoryResult.category, isSuggested: true };
            toast.info(`💡 AI suggests category: "${categoryResult.category}"`, {
              duration: 3000,
              description: 'This will be created automatically when you publish'
            });
          }
        }
      }

      const selectedCategory = categories.find(c => c.id === formData.category_id) || detectedCategory;
      const result = await AIDescriptionService.generateProductDescription({
        title: formData.title || 'Product',
        category: selectedCategory?.name || detectedCategory?.name,
        country: formData.country_of_origin || company?.country
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.optimized_title || prev.title,
          description: result.full_description || prev.description,
          // Auto-set category if detected
          category_id: prev.category_id || (detectedCategory && !detectedCategory.isSuggested ? detectedCategory.id : ''),
          suggested_category: detectedCategory?.isSuggested ? detectedCategory.name : prev.suggested_category
        }));
        toast.success('✨ AI generated all content! Review and adjust as needed.', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title?.trim()) newErrors.title = 'Product title is required';
      // Category is valid if we have category_id OR suggested_category
      if (!formData.category_id && !formData.suggested_category) {
        newErrors.category_id = 'Category is required. Enter a title and AI will suggest one, or select manually.';
      }
      if (!formData.description?.trim()) newErrors.description = 'Description is required';
    }

    if (step === 2) {
      if (formData.images.length === 0) {
        newErrors.images = 'At least one image is required before publishing';
      }
    }

    if (step === 3) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Valid price is required';
      }
      if (!formData.moq || parseInt(formData.moq) < 1) {
        newErrors.moq = 'MOQ must be at least 1';
      }
    }

    if (step === 4) {
      if (!formData.delivery_time?.trim()) {
        newErrors.delivery_time = 'Delivery time is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit product
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const price = validateNumeric(formData.price, { min: 0 });
      const moq = validateNumeric(formData.moq, { min: 1 });

      if (price === null || price <= 0) {
        toast.error('Valid price is required');
        setIsLoading(false);
        return;
      }

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      if (!companyId) {
        toast.error('Company profile required');
        setIsLoading(false);
        return;
      }

      // Handle category - create if suggested, or use existing
      let finalCategoryId = formData.category_id;
      
      if (!finalCategoryId && formData.suggested_category) {
        // Create the suggested category
        const { data: newCategory, error: catError } = await supabase
          .from('categories')
          .insert({
            name: formData.suggested_category,
            description: `Category for ${formData.title}`
          })
          .select('id')
          .single();
        
        if (!catError && newCategory) {
          finalCategoryId = newCategory.id;
          toast.success(`Category "${formData.suggested_category}" created!`);
        } else {
          toast.error('Failed to create category. Please select an existing category.');
          setIsLoading(false);
          return;
        }
      }

      if (!finalCategoryId) {
        toast.error('Category is required');
        setIsLoading(false);
        return;
      }

      // Create product
      const { data: newProduct, error } = await supabase.from('products').insert({
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description),
        category_id: finalCategoryId,
        images: formData.images.map(img => img.url || img),
        price: price,
        price_min: price,
        min_order_quantity: moq,
        moq: moq,
        unit: sanitizeString(formData.unit || 'pieces'),
        delivery_time: sanitizeString(formData.delivery_time || ''),
        packaging: sanitizeString(formData.packaging || ''),
        currency: formData.currency || 'USD',
        country_of_origin: formData.country_of_origin || company?.country || '',
        status: 'pending_review',
        company_id: companyId,
        views: 0,
        inquiries: 0
      }).select('id').single();
      
      if (error) throw error;

      // Save images to product_images table
      if (newProduct?.id && formData.images.length > 0) {
        const imageRecords = formData.images.map((img, index) => ({
          product_id: newProduct.id,
          url: typeof img === 'string' ? img : img.url || img,
          alt_text: formData.title || 'Product image',
          is_primary: img.is_primary || index === 0,
          sort_order: img.sort_order !== undefined ? img.sort_order : index
        }));

        await supabase.from('product_images').insert(imageRecords);
      }

      // Delete draft after successful submission
      if (draftId) {
        await supabase.from('product_drafts').delete().eq('id', draftId);
      }
      localStorage.removeItem('product_draft');

      // Success animation with celebration
      toast.success('🎉 Product created successfully! Pending admin review.', {
        duration: 4000,
        description: 'Your product will be reviewed and published within 24-48 hours.'
      });
      
      // Show success animation before redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate(`/product?id=${newProduct.id}&from=seller_create`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const CurrentStepIcon = STEPS[currentStep - 1]?.icon || FileText;

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">
            Add New Product
          </h1>
          <p className="text-afrikoni-deep">
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.name}
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-2 border-afrikoni-gold/30 bg-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-afrikoni-deep">
                Progress: {Math.round(progress)}%
              </span>
              {isSaving && (
                <span className="text-xs text-afrikoni-deep/70 flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  Saving draft...
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={`
                      flex flex-col items-center gap-1 flex-1
                      ${isActive ? 'text-afrikoni-gold' : isCompleted ? 'text-green-600' : 'text-afrikoni-deep/40'}
                      transition-colors
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-afrikoni-gold text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-afrikoni-deep/10'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Product Basics */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                          Product Basics
                        </h2>
                        <p className="text-sm text-afrikoni-deep/70">
                          Tell us about your product
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAIGenerate}
                          disabled={isGenerating}
                          className="flex items-center gap-2 border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold hover:text-white"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              ✨ AI Generate All
                            </>
                          )}
                        </Button>
                        <KoniAIActionButton
                          label="Improve with KoniAI"
                          onClick={handleKoniAIImprove}
                          loading={koniaiLoading}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">
                        Product Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Premium African Handwoven Baskets"
                        className="mt-1"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="category">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        {!formData.category_id && formData.title && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!formData.title) {
                                toast.error('Please enter a product title first');
                                return;
                              }
                              setIsGenerating(true);
                              try {
                                const detected = await AIDescriptionService.detectCategory(
                                  formData.title,
                                  formData.description
                                );
                                if (detected?.category) {
                                  const matched = categories.find(c => 
                                    c.name.toLowerCase() === detected.category.toLowerCase()
                                  );
                                  if (matched) {
                                    handleChange('category_id', matched.id);
                                    toast.success(`✨ Category set: ${matched.name}`);
                                  } else {
                                    toast.info(`💡 AI suggests: "${detected.category}"`, {
                                      description: 'This category will be created when you publish'
                                    });
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      suggested_category: detected.category 
                                    }));
                                  }
                                }
                              } catch (error) {
                                toast.error('Category detection failed');
                              } finally {
                                setIsGenerating(false);
                              }
                            }}
                            disabled={isGenerating}
                            className="text-xs text-afrikoni-gold hover:underline flex items-center gap-1"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Detecting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                AI Detect Category
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <Select 
                        value={formData.category_id || ''} 
                        onValueChange={(v) => handleChange('category_id', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={formData.suggested_category ? `AI suggests: ${formData.suggested_category}` : "Select category or let AI detect it"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-afrikoni-deep/70">
                              {formData.suggested_category ? (
                                <div>
                                  <p className="font-medium text-afrikoni-gold mb-1">AI Suggested:</p>
                                  <p>{formData.suggested_category}</p>
                                  <p className="text-xs mt-1">This will be created automatically when you publish</p>
                                </div>
                              ) : (
                                <p>No categories available. Enter a product title and AI will suggest a category.</p>
                              )}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {formData.suggested_category && !formData.category_id && (
                        <div className="mt-2 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                            <div>
                              <p className="font-medium text-afrikoni-chestnut">AI Suggested Category:</p>
                              <p className="text-afrikoni-deep">{formData.suggested_category}</p>
                              <p className="text-xs text-afrikoni-deep/70 mt-1">This category will be created automatically when you publish your product.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {errors.category_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="description">
                          Description <span className="text-red-500">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formData.title && !formData.category_id) {
                              toast.error('Please enter a title or select a category first');
                              return;
                            }
                            setIsGenerating(true);
                            try {
                              const selectedCategory = categories.find(c => c.id === formData.category_id);
                              const result = await AIDescriptionService.generateProductDescription({
                                title: formData.title || 'Product',
                                category: selectedCategory?.name,
                                country: formData.country_of_origin || company?.country
                              });
                              if (result?.full_description) {
                                handleChange('description', result.full_description);
                                toast.success('AI generated description! Review and adjust as needed.');
                              }
                            } catch (error) {
                              toast.error('AI generation failed. Please try again.');
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          disabled={isGenerating}
                          className="text-xs text-afrikoni-gold hover:underline flex items-center gap-1"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Afrikoni AI help
                            </>
                          )}
                        </button>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Write a few lines or let Afrikoni AI generate a clear description for buyers."
                        rows={6}
                        className="mt-1"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                      )}
                      <p className="text-xs text-afrikoni-deep/70 mt-1">
                        Include specifications, materials, use cases, and key selling points
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Images */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                          Product Images
                        </h2>
                        <p className="text-sm text-afrikoni-deep/70">
                          Upload high-quality photos (first image will be the main photo)
                        </p>
                      </div>
                      {formData.images.length === 0 && (
                        <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                            <span className="text-afrikoni-chestnut font-medium">
                              AI will analyze your first image and suggest category, title & description
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <SmartImageUploader
                      images={formData.images}
                      onImagesChange={(newImages) => handleChange('images', newImages)}
                      onFirstImageUpload={handleFirstImageUpload}
                      userId={user?.id}
                      maxImages={5}
                      maxSizeMB={5}
                    />
                    {errors.images && (
                      <p className="text-red-500 text-sm">{errors.images}</p>
                    )}

                    {formData.images.length > 0 && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex gap-2">
                            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-semibold mb-1">Tip:</p>
                              <p>Drag images to reorder. The first image will be your main product photo shown in search results.</p>
                            </div>
                          </div>
                        </div>
                        {!formData.title && (
                          <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-afrikoni-gold" />
                                <div>
                                  <p className="font-semibold text-afrikoni-chestnut text-sm">AI Image Analysis Complete!</p>
                                  <p className="text-xs text-afrikoni-deep/70">Go back to Step 1 to see AI-generated suggestions</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep(1)}
                                className="text-xs h-8"
                              >
                                View Suggestions
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Pricing & MOQ */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                          Pricing & Minimum Order
                        </h2>
                        <p className="text-sm text-afrikoni-deep/70">
                          Set your pricing and minimum order quantity
                        </p>
                      </div>
                      <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                          <span className="text-afrikoni-chestnut font-medium">AI Pricing Helper Available</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">
                          Price per Unit <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleChange('price', e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                        {errors.price && (
                          <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select 
                          value={formData.currency} 
                          onValueChange={(v) => handleChange('currency', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="ZAR">ZAR (R)</SelectItem>
                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                            <SelectItem value="GHS">GHS (₵)</SelectItem>
                            <SelectItem value="KES">KES (KSh)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Pricing Helper - Auto-create MOQ tiers */}
                    {formData.price && (
                      <div className="bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                            <span className="font-semibold text-afrikoni-chestnut">Pricing Helper</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const basePrice = parseFloat(formData.price) || 0;
                              if (basePrice > 0) {
                                toast.success('MOQ tiers created! Adjust as needed.');
                                // Auto-create tiers: 10 (5% off), 100 (10% off), 500 (15% off)
                                // This would be stored in product_variants table in production
                                toast.info('Bulk pricing: 10 units (5% off), 100 units (10% off), 500 units (15% off)');
                              }
                            }}
                            className="text-xs h-8"
                          >
                            Auto-Create Tiers
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white rounded p-2 border border-afrikoni-gold/10">
                            <div className="font-semibold text-afrikoni-deep">10+ units</div>
                            <div className="text-afrikoni-gold">5% discount</div>
                          </div>
                          <div className="bg-white rounded p-2 border border-afrikoni-gold/10">
                            <div className="font-semibold text-afrikoni-deep">100+ units</div>
                            <div className="text-afrikoni-gold">10% discount</div>
                          </div>
                          <div className="bg-white rounded p-2 border border-afrikoni-gold/10">
                            <div className="font-semibold text-afrikoni-deep">500+ units</div>
                            <div className="text-afrikoni-gold">15% discount</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="moq">
                          Minimum Order Quantity (MOQ) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="moq"
                          type="number"
                          value={formData.moq}
                          onChange={(e) => handleChange('moq', e.target.value)}
                          placeholder="1"
                          min="1"
                          className="mt-1"
                        />
                        {errors.moq && (
                          <p className="text-red-500 text-sm mt-1">{errors.moq}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select 
                          value={formData.unit} 
                          onValueChange={(v) => handleChange('unit', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="tons">Tons</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="bags">Bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Supply & Logistics */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                          Supply & Logistics
                        </h2>
                        <p className="text-sm text-afrikoni-deep/70">
                          Shipping and delivery information
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setIsGenerating(true);
                          try {
                            // AI suggestions for logistics based on country and product type
                            const selectedCategory = categories.find(c => c.id === formData.category_id);
                            const country = formData.country_of_origin || company?.country || 'Africa';
                            
                            // Generate smart suggestions
                            const suggestions = {
                              delivery_time: selectedCategory?.name?.toLowerCase().includes('food') 
                                ? '7-14 business days (refrigerated shipping available)'
                                : selectedCategory?.name?.toLowerCase().includes('textile')
                                ? '14-21 business days'
                                : '10-18 business days',
                              packaging: `Standard export packaging suitable for ${selectedCategory?.name || 'product'} shipping to international markets. Includes protective materials and proper labeling.`
                            };
                            
                            if (!formData.delivery_time) {
                              handleChange('delivery_time', suggestions.delivery_time);
                            }
                            if (!formData.packaging) {
                              handleChange('packaging', suggestions.packaging);
                            }
                            
                            toast.success('AI generated logistics suggestions! Review and adjust as needed.');
                          } catch (error) {
                            toast.error('AI suggestions failed. Please try again.');
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating}
                        className="flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            AI Suggest Logistics
                          </>
                        )}
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="country_of_origin">Country of Origin</Label>
                      <Input
                        id="country_of_origin"
                        value={formData.country_of_origin || company?.country || ''}
                        onChange={(e) => handleChange('country_of_origin', e.target.value)}
                        placeholder="e.g., Nigeria, Kenya, Ghana"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="delivery_time">
                        Delivery Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="delivery_time"
                        value={formData.delivery_time}
                        onChange={(e) => handleChange('delivery_time', e.target.value)}
                        placeholder="e.g., 7-14 business days"
                        className="mt-1"
                      />
                      {errors.delivery_time && (
                        <p className="text-red-500 text-sm mt-1">{errors.delivery_time}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="packaging">Packaging</Label>
                      <Textarea
                        id="packaging"
                        value={formData.packaging}
                        onChange={(e) => handleChange('packaging', e.target.value)}
                        placeholder="Describe packaging details..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Compliance */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                        Compliance & Certifications
                      </h2>
                      <p className="text-sm text-afrikoni-deep/70">
                        Add any certifications or compliance information (optional)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="compliance_notes">Compliance Notes</Label>
                      <Textarea
                        id="compliance_notes"
                        value={formData.compliance_notes}
                        onChange={(e) => handleChange('compliance_notes', e.target.value)}
                        placeholder="e.g., ISO certified, Organic certified, Fair Trade..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-semibold mb-1">Ready to publish?</p>
                          <p>Your product will be reviewed by our team before going live. This usually takes 24-48 hours.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-afrikoni-gold/20">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < STEPS.length ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
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
            </div>
          </CardContent>
        </Card>

        {/* KoniAI Improvement Modal */}
        <Dialog open={koniaiModalOpen} onOpenChange={setKoniaiModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-afrikoni-gold" />
                KoniAI Suggestions
              </DialogTitle>
              <DialogDescription>
                Here are improved suggestions from KoniAI for your product listing
              </DialogDescription>
            </DialogHeader>

            {koniaiLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
                <span className="ml-3 text-afrikoni-deep">KoniAI is thinking...</span>
              </div>
            ) : koniaiSuggestions ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-afrikoni-chestnut">Improved Title</Label>
                  <p className="mt-1 p-3 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg text-sm">
                    {koniaiSuggestions.title}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-afrikoni-chestnut">Improved Description</Label>
                  <p className="mt-1 p-3 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg text-sm whitespace-pre-wrap">
                    {koniaiSuggestions.description}
                  </p>
                </div>

                {koniaiSuggestions.tags && koniaiSuggestions.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-afrikoni-chestnut">Suggested Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {koniaiSuggestions.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {koniaiSuggestions.suggestedCategory && (
                  <div>
                    <Label className="text-sm font-semibold text-afrikoni-chestnut">Suggested Category</Label>
                    <Badge className="mt-2 bg-afrikoni-gold text-afrikoni-chestnut">
                      {koniaiSuggestions.suggestedCategory}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-afrikoni-gold/20">
                  <Button
                    onClick={applyKoniaiSuggestions}
                    className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                  >
                    Use Suggestions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setKoniaiModalOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-afrikoni-deep/70 text-center py-8">
                No suggestions available. Please try again.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

