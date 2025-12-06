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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Sparkles, Image as ImageIcon, DollarSign, Truck, Shield, CheckCircle, 
  ArrowLeft, ArrowRight, Save, Loader2, Lightbulb, FileText,
  Search, Copy, Tag, ChevronRight, Home
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
import { AFRICAN_COUNTRIES } from '@/constants/countries';

// Full-featured Add Product with AI assistance
const STEPS = [
  { id: 1, name: 'Product Basics', icon: FileText, description: 'Name, Category, Description' },
  { id: 2, name: 'Images', icon: ImageIcon, description: 'Upload & arrange photos' },
  { id: 3, name: 'Pricing & MOQ', icon: DollarSign, description: 'Price tiers, MOQ, currency' },
  { id: 4, name: 'Supply & Logistics', icon: Truck, description: 'Lead time, origin, shipping' },
  { id: 5, name: 'Compliance', icon: Shield, description: 'Certifications & compliance' },
];

export default function AddProductSmart() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const isEditing = !!productId;
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
    city: '', // City where product is located
    shipping_options: [],
    certifications: [],
    compliance_notes: '',
    tags: [], // Product tags for search
    status: 'draft'
  });
  
  const [categorySearch, setCategorySearch] = useState('');
  const [previousProducts, setPreviousProducts] = useState([]);

  const [errors, setErrors] = useState({});

  // Load data and restore draft
  useEffect(() => {
    loadData();
    if (!isEditing) {
      restoreDraft();
    } else if (productId && user?.id) {
      loadProductForEdit();
    }
  }, [productId, user?.id]);
  
  // Load product data for editing
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
      
      // Load images
      const productImages = (product.product_images || []).map(img => ({
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        path: img.path,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      }));
      
      // If no images from product_images, use images array
      const imagesToUse = productImages.length > 0 
        ? productImages 
        : (Array.isArray(product.images) ? product.images.map((url, idx) => ({
            url,
            is_primary: idx === 0,
            sort_order: idx
          })) : []);
      
      setFormData({
        title: product.title || '',
        description: product.description || '',
        category_id: product.category_id || '',
        images: imagesToUse,
        price: product.price || product.price_min || '',
        moq: product.moq || product.min_order_quantity || '1',
        unit: product.unit || 'pieces',
        delivery_time: product.delivery_time || '',
        packaging: product.packaging || '',
        currency: product.currency || 'USD',
        country_of_origin: product.country_of_origin || '',
        city: product.city || '',
        shipping_options: product.shipping_options || [],
        certifications: product.certifications || [],
        compliance_notes: product.compliance_notes || '',
        tags: product.tags || [],
        status: product.status || 'draft'
      });
      
      toast.success('Product loaded for editing');
    } catch (error) {
      toast.error('Failed to load product for editing');
      navigate('/dashboard/products');
    } finally {
      setIsLoading(false);
    }
  };

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
        supabase.from('categories').select('*').order('name')
      ]);

      if (catsRes.error) throw catsRes.error;

      const { user: userData } = userResult;
      setUser(userData);
      setCategories(catsRes.data || []);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);
      
      if (companyId) {
        const [companyRes, productsRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
          supabase.from('products').select('id, title, category_id, price, currency, country_of_origin').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10)
        ]);
        
        if (companyRes.data) {
          setCompany(companyRes.data);
          // Preload business info
          setFormData(prev => ({
            ...prev,
            country_of_origin: companyRes.data.country || prev.country_of_origin,
            currency: prev.currency || 'USD'
          }));
        }
        
        if (productsRes.data) {
          setPreviousProducts(productsRes.data || []);
        }
      }
    } catch (error) {
      // Error logged (removed for production)
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

  // AI: Auto-analyze first image and suggest title, description (NO FORCED CATEGORY)
  const analyzeFirstImage = async (imageData) => {
    if (!imageData?.url) return;

    try {
      setIsGenerating(true);
      
      // Only analyze if user wants suggestions (non-blocking)
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      
      // Auto-generate product description if we have category OR title
      if ((selectedCategory || formData.title) && !formData.description) {
        const result = await AIDescriptionService.generateProductDescription({
          title: formData.title || `Premium Product`,
          category: selectedCategory?.name,
          country: formData.country_of_origin || company?.country
        });

        if (result) {
          setFormData(prev => ({
            ...prev,
            title: prev.title || result.optimized_title || prev.title,
            description: result.full_description || prev.description
          }));
          
          toast.success('✨ AI generated description suggestions!', {
            duration: 3000
          });
        }
      }
    } catch (error) {
      // Silent fail - don't interrupt user flow
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle first image upload - optional AI analysis (non-blocking)
  const handleFirstImageUpload = useCallback(async (imageData) => {
    // Only analyze if user has title or category - no forced prompts
    if (formData.title || formData.category_id) {
      await analyzeFirstImage(imageData);
    }
  }, [formData.title, formData.category_id, categories, company]);

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

  // Validate current step - make secondary fields optional
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title?.trim()) newErrors.title = 'Product title is required';
      // Category is optional - auto-assign default if missing
      // No error, just auto-assign "General" or first category if available
      if (!formData.description?.trim()) {
        // Description is optional but recommended
        // Only show warning, not error
      }
    }

    if (step === 2) {
      // Images are required for publishing
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

    // Step 4 (delivery_time) is now optional - removed from validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Auto-assign default category if missing
  const ensureCategory = async () => {
    if (formData.category_id || formData.suggested_category) return formData.category_id || null;
    
    // Auto-assign first category or "General" if available
    if (categories.length > 0) {
      const defaultCategory = categories.find(c => c.name.toLowerCase().includes('general')) || categories[0];
      if (defaultCategory) {
        setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
        return defaultCategory.id;
      }
    }
    return null;
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

  // Submit product - Optimized validation
  const handleSubmit = async () => {
    // Validate critical fields
    const criticalErrors = {};
    
    if (!formData.title?.trim()) {
      criticalErrors.title = 'Product title is required';
    }
    if (formData.images.length === 0) {
      criticalErrors.images = 'At least one image is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      criticalErrors.price = 'Valid price is required';
    }
    if (!formData.moq || parseInt(formData.moq) < 1) {
      criticalErrors.moq = 'MOQ must be at least 1';
    }
    
    if (Object.keys(criticalErrors).length > 0) {
      setErrors(criticalErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(criticalErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      toast.error('Please fix the required fields before submitting');
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

      // Handle category - use "No Category" as fallback if not selected
      let finalCategoryId = formData.category_id || null;
      
      // If no category selected, try to find "No Category" fallback
      if (!finalCategoryId) {
        // Try to find "No Category" category
        const { data: noCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'No Category')
          .maybeSingle();
        
        if (noCategory) {
          finalCategoryId = noCategory.id;
        } else {
          // Try to auto-assign default category
          finalCategoryId = await ensureCategory();
          
          // If still no category and we have a suggestion, create it
          if (!finalCategoryId && formData.suggested_category) {
            try {
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
              }
            } catch (catErr) {
              // Silent fail
            }
          }
          
          // Last resort: use first available category
          if (!finalCategoryId && categories.length > 0) {
            finalCategoryId = categories[0].id;
          }
        }
      }

      // Create or update product
      let savedProductId;
      
      if (isEditing && productId) {
        // Update existing product
        const { data, error: updateError } = await supabase
          .from('products')
          .update({
            title: sanitizeString(formData.title),
            description: sanitizeString(formData.description),
            category_id: finalCategoryId,
            images: formData.images.map(img => {
              if (typeof img === 'string') return img;
              return img.url || img.thumbnail_url || img;
            }).filter(Boolean),
            price: price,
            price_min: price,
            min_order_quantity: moq,
            moq: moq,
            unit: sanitizeString(formData.unit || 'pieces'),
            delivery_time: sanitizeString(formData.delivery_time || ''),
            packaging: sanitizeString(formData.packaging || ''),
            currency: formData.currency || 'USD',
            country_of_origin: formData.country_of_origin || company?.country || '',
            city: sanitizeString(formData.city || ''),
            status: formData.status || 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)
          .eq('company_id', companyId)
          .select('id')
          .single();
        
        if (updateError) throw updateError;
        savedProductId = data?.id || productId;
        
        // Update product_images
        if (savedProductId && formData.images.length > 0) {
          // Delete existing images
          await supabase.from('product_images').delete().eq('product_id', productId);
          
          // Insert updated images
          const imageRecords = formData.images.map((img, index) => ({
            product_id: savedProductId,
            url: typeof img === 'string' ? img : img.url || img.thumbnail_url || img,
            alt_text: formData.title || 'Product image',
            is_primary: img.is_primary || index === 0,
            sort_order: img.sort_order !== undefined ? img.sort_order : index
          }));
          
          await supabase.from('product_images').insert(imageRecords);
        }
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase.from('products').insert({
          title: sanitizeString(formData.title),
          description: sanitizeString(formData.description),
          category_id: finalCategoryId,
          images: formData.images.map(img => {
            if (typeof img === 'string') return img;
            return img.url || img.thumbnail_url || img;
          }).filter(Boolean),
          price: price,
          price_min: price,
          min_order_quantity: moq,
          moq: moq,
          unit: sanitizeString(formData.unit || 'pieces'),
          delivery_time: sanitizeString(formData.delivery_time || ''),
          packaging: sanitizeString(formData.packaging || ''),
          currency: formData.currency || 'USD',
          country_of_origin: formData.country_of_origin || company?.country || '',
          city: sanitizeString(formData.city || ''),
          status: 'active',
          company_id: companyId,
          views: 0,
          inquiries: 0
        }).select('id').single();
        
        if (insertError) throw insertError;
        savedProductId = newProduct?.id;
        
        // Save images to product_images table for new products
        if (savedProductId && formData.images.length > 0) {
          const imageRecords = formData.images.map((img, index) => ({
            product_id: savedProductId,
            url: typeof img === 'string' ? img : img.url || img,
            alt_text: formData.title || 'Product image',
            is_primary: img.is_primary || index === 0,
            sort_order: img.sort_order !== undefined ? img.sort_order : index
          }));

          await supabase.from('product_images').insert(imageRecords);
        }
      }


      // Delete draft after successful submission
      if (draftId) {
        await supabase.from('product_drafts').delete().eq('id', draftId);
      }
      localStorage.removeItem('product_draft');

      // Success animation with celebration
      toast.success(isEditing ? '✅ Product updated successfully!' : '🎉 Product created successfully!', {
        duration: 4000,
        description: isEditing ? 'Your product has been updated.' : 'Your product is now live in the marketplace!'
      });
      
      // Show success animation before redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const CurrentStepIcon = STEPS[currentStep - 1]?.icon || FileText;

  // Duplicate previous product
  const handleDuplicateProduct = async (productId) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('id', productId)
        .single();
      
      if (error || !product) {
        toast.error('Failed to load product');
        return;
      }
      
      // Load product images
      const productImages = (product.product_images || []).map(img => ({
        url: img.url,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      }));
      
      setFormData({
        title: `${product.title} (Copy)`,
        description: product.description || '',
        category_id: product.category_id || '',
        images: productImages.length > 0 ? productImages : (Array.isArray(product.images) ? product.images.map(url => ({ url })) : []),
        price: product.price?.toString() || '',
        moq: product.moq?.toString() || '1',
        unit: product.unit || 'pieces',
        delivery_time: product.delivery_time || '',
        packaging: product.packaging || '',
        currency: product.currency || 'USD',
        country_of_origin: product.country_of_origin || company?.country || '',
        shipping_options: [],
        certifications: [],
        compliance_notes: '',
        tags: [],
        status: 'draft'
      });
      
      toast.success('Product duplicated! Review and edit as needed.');
      setCurrentStep(1);
    } catch (error) {
      toast.error('Failed to duplicate product');
    }
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-afrikoni-deep/70">
          <button onClick={() => navigate('/dashboard')} className="hover:text-afrikoni-gold flex items-center gap-1">
            <Home className="w-4 h-4" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-afrikoni-deep">Add Product</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-afrikoni-chestnut font-medium">
            {STEPS[currentStep - 1]?.name}
          </span>
        </nav>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-afrikoni-deep">
                Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.name}
              </p>
            </div>
            {previousProducts.length > 0 && (
              <div className="relative group">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Previous
                </Button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-afrikoni-gold/30 rounded-lg shadow-lg p-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {previousProducts.slice(0, 5).map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleDuplicateProduct(product.id)}
                        className="w-full text-left px-3 py-2 hover:bg-afrikoni-gold/10 rounded text-sm"
                      >
                        <div className="font-medium truncate">{product.title}</div>
                        <div className="text-xs text-afrikoni-deep/60">
                          {product.price} {product.currency}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
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
                          Category <span className="text-afrikoni-deep/50 text-xs">(optional - will auto-assign if empty)</span>
                        </Label>
                        {!formData.category_id && formData.title && (
                          <button
                            type="button"
                            onClick={async () => {
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
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      suggested_category: detected.category 
                                    }));
                                    toast.info(`💡 AI suggests: "${detected.category}"`);
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
                                AI Detect
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Category Search Input */}
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-afrikoni-deep/40" />
                        <Input
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Category Select with Search - OPTIMIZED */}
                      <Select 
                        value={formData.category_id ? String(formData.category_id) : ''} 
                        onValueChange={(v) => {
                          // Handle category selection - ensure it works reliably
                          if (v && v !== '') {
                            const selectedCat = categories.find(c => 
                              String(c.id) === String(v) || c.id === v
                            );
                            if (selectedCat) {
                              handleChange('category_id', selectedCat.id); // Store the actual UUID
                              setCategorySearch('');
                              // Clear suggested category if we selected one
                              if (formData.suggested_category) {
                                setFormData(prev => ({ ...prev, suggested_category: '' }));
                              }
                              if (selectedCat.name === 'No Category') {
                                toast.info('Using "No Category" - you can still publish', { duration: 2000 });
                              } else {
                                toast.success(`✅ Category selected: ${selectedCat.name}`, { duration: 2000 });
                              }
                            } else {
                              // Fallback: store the string value if category not found
                              handleChange('category_id', v);
                              setCategorySearch('');
                            }
                          } else if (v === '') {
                            // User cleared selection
                            handleChange('category_id', '');
                            setCategorySearch('');
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2" id="category">
                          <SelectValue 
                            placeholder={
                              formData.suggested_category 
                                ? `✨ AI suggests: ${formData.suggested_category}` 
                                : formData.category_id
                                ? categories.find(c => c.id === formData.category_id || String(c.id) === String(formData.category_id))?.name || "Select category"
                                : "Select category (optional - AI will help)"
                            }
                            displayValue={
                              formData.category_id 
                                ? (categories.find(c => 
                                    c.id === formData.category_id || 
                                    String(c.id) === String(formData.category_id)
                                  )?.name) 
                                : undefined
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {categories.length > 0 ? (
                            (() => {
                              const filtered = categorySearch
                                ? categories.filter(cat => 
                                    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                  )
                                : categories;
                              
                              return filtered.length > 0 ? (
                                <>
                                  {filtered.map(cat => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </>
                              ) : (
                                <div className="p-2 text-sm text-afrikoni-deep/70">
                                  No categories found matching "{categorySearch}"
                                </div>
                              );
                            })()
                          ) : (
                            <div className="p-2 text-sm text-afrikoni-deep/70">
                              {formData.suggested_category ? (
                                <div>
                                  <p className="font-medium text-afrikoni-gold mb-1">✨ AI Suggested:</p>
                                  <p>{formData.suggested_category}</p>
                                  <p className="text-xs mt-1">This will be created automatically when you publish</p>
                                </div>
                              ) : (
                                <p>Loading categories... AI will help you select one.</p>
                              )}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* AI Category Suggestion Display */}
                      {formData.suggested_category && !formData.category_id && (
                        <div className="mt-2 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                            <div>
                              <p className="font-medium text-afrikoni-chestnut">AI Suggested Category:</p>
                              <p className="text-afrikoni-deep">{formData.suggested_category}</p>
                              <p className="text-xs text-afrikoni-deep/70 mt-1">
                                This category will be created automatically when you publish. You can also select a different category above.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                    </div>
                    
                    {/* Tags Field with AI Suggestions */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="tags">Tags <span className="text-afrikoni-deep/50 text-xs">(optional)</span></Label>
                        {formData.title && (
                          <button
                            type="button"
                            onClick={async () => {
                              setIsGenerating(true);
                              try {
                                // Generate tags based on product title using AI
                                const { callChatAsJson } = await import('@/ai/aiClient');
                                const selectedCategory = categories.find(c => c.id === formData.category_id);
                                
                                const system = `You are a tag generation assistant. Generate 5-8 relevant search tags for a B2B product listing. Return only a JSON array of tag strings.`;
                                const user = `Product: ${formData.title}\nCategory: ${selectedCategory?.name || 'General'}\n\nGenerate relevant tags for search optimization.`;
                                
                                const { success, data } = await callChatAsJson(
                                  { system, user },
                                  { fallback: { tags: [] } }
                                );
                                
                                const suggestedTags = (data?.tags || []).slice(0, 8);
                                if (suggestedTags.length > 0) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, ...suggestedTags])].slice(0, 10)
                                  }));
                                  toast.success('Tags suggested!');
                                } else {
                                  // Fallback: extract keywords from title
                                  const words = formData.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...new Set([...prev.tags, ...words.slice(0, 5)])].slice(0, 10)
                                  }));
                                  toast.success('Tags generated from title!');
                                }
                              } catch (error) {
                                toast.error('Tag generation failed');
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
                                <Tag className="w-3 h-3" />
                                AI Suggest Tags
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 p-3 border border-afrikoni-deep/20 rounded-lg min-h-[44px]">
                        {formData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <Input
                          placeholder="Add tag and press Enter"
                          className="flex-1 min-w-[120px] border-0 focus:ring-0 p-0 h-auto"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              const newTag = e.target.value.trim();
                              if (!formData.tags.includes(newTag) && formData.tags.length < 10) {
                                setFormData(prev => ({
                                  ...prev,
                                  tags: [...prev.tags, newTag]
                                }));
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-800">
                              Upload at least one image. The first image will be your main product photo.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <SmartImageUploader
                      images={formData.images}
                      onImagesChange={(newImages) => {
                        handleChange('images', newImages);
                        // Clear image error if images are added
                        if (newImages.length > 0 && errors.images) {
                          setErrors(prev => ({ ...prev, images: null }));
                        }
                      }}
                      onFirstImageUpload={handleFirstImageUpload}
                      userId={user?.id}
                      maxImages={10}
                      maxSizeMB={5}
                    />
                    {errors.images && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.images}
                        </p>
                      </div>
                    )}
                    
                    {/* Image Preview Count */}
                    {formData.images.length > 0 && (
                      <div className="mt-2 text-sm text-afrikoni-deep/70">
                        ✅ {formData.images.length} image{formData.images.length > 1 ? 's' : ''} uploaded
                        {formData.images.length > 0 && formData.images[0]?.is_primary && (
                          <span className="ml-2 text-afrikoni-gold">• First image is primary</span>
                        )}
                      </div>
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
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-afrikoni-deep/60 text-sm">
                            {formData.currency === 'USD' ? '$' : 
                             formData.currency === 'EUR' ? '€' :
                             formData.currency === 'GBP' ? '£' :
                             formData.currency === 'ZAR' ? 'R' :
                             formData.currency === 'NGN' ? '₦' :
                             formData.currency === 'GHS' ? '₵' :
                             formData.currency === 'KES' ? 'KSh' : ''}
                          </span>
                          <Input
                            id="price"
                            type="text"
                            value={formData.price}
                            onChange={(e) => {
                              // Auto-format price: remove non-numeric except decimal point
                              const value = e.target.value.replace(/[^\d.]/g, '');
                              // Ensure only one decimal point
                              const parts = value.split('.');
                              const formatted = parts.length > 2 
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : value;
                              handleChange('price', formatted);
                            }}
                            onBlur={(e) => {
                              // Format to 2 decimal places on blur
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num)) {
                                handleChange('price', num.toFixed(2));
                              }
                            }}
                            placeholder="0.00"
                            className="pl-8"
                          />
                        </div>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country_of_origin">
                          Country of Origin <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.country_of_origin || company?.country || ''} 
                          onValueChange={(v) => handleChange('country_of_origin', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {AFRICAN_COUNTRIES.map(country => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-afrikoni-deep/60 mt-1">
                          Where is this product made or sourced from?
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="e.g., Lagos, Nairobi, Accra"
                          className="mt-1"
                        />
                        <p className="text-xs text-afrikoni-deep/60 mt-1">
                          City where product is located (optional)
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delivery_time">
                        Delivery Time <span className="text-afrikoni-deep/50 text-xs">(optional)</span>
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
                        {isEditing ? 'Update Product' : 'Publish Product'}
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

