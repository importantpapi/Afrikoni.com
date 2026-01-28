import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Textarea } from '@/components/shared/ui/textarea';
import { 
  CheckCircle, ArrowRight, ArrowLeft, Building2, Shield, Package, 
  DollarSign, FileText, Upload, Globe, Phone, Mail, MapPin, 
  Calendar, Users, Award, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/shared/ui/Logo';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

const BUSINESS_TYPES = [
  'Manufacturer',
  'Wholesaler',
  'Distributor',
  'Trader',
  'Exporter',
  'Service Provider',
  'Other'
];

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
];

// ✅ ALIBABA FLOW: Role-based step configuration
const STEPS_BY_ROLE = {
  // Buyer: Minimal friction - just basic info
  buyer: [
    { id: 1, title: 'Welcome', icon: Building2 },
    { id: 2, title: 'Preferences', icon: Building2 },
    { id: 3, title: 'Complete', icon: CheckCircle },
  ],
  // Seller: Full onboarding with products and payment
  seller: [
    { id: 1, title: 'Welcome', icon: Building2 },
    { id: 2, title: 'Company Info', icon: Building2 },
    { id: 3, title: 'Verification', icon: Shield },
    { id: 4, title: 'Categories', icon: Package },
    { id: 5, title: 'First Product', icon: Package },
    { id: 6, title: 'Payment Setup', icon: DollarSign },
    { id: 7, title: 'Complete', icon: CheckCircle },
  ],
  // Hybrid: Same as seller (they want to sell too)
  hybrid: [
    { id: 1, title: 'Welcome', icon: Building2 },
    { id: 2, title: 'Company Info', icon: Building2 },
    { id: 3, title: 'Verification', icon: Shield },
    { id: 4, title: 'Categories', icon: Package },
    { id: 5, title: 'First Product', icon: Package },
    { id: 6, title: 'Payment Setup', icon: DollarSign },
    { id: 7, title: 'Complete', icon: CheckCircle },
  ],
  // Services: Company info + verification
  services: [
    { id: 1, title: 'Welcome', icon: Building2 },
    { id: 2, title: 'Company Info', icon: Building2 },
    { id: 3, title: 'Services', icon: Package },
    { id: 4, title: 'Verification', icon: Shield },
    { id: 5, title: 'Complete', icon: CheckCircle },
  ],
};

// Default to seller steps for backwards compatibility
const STEPS = STEPS_BY_ROLE.seller;

export default function SupplierOnboarding() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  // ✅ ALIBABA FLOW: Get role-specific steps
  // Priority: profile.role > user metadata > default to 'seller'
  const userRole = role || profile?.role || user?.user_metadata?.intended_role || 'seller';
  const roleSteps = STEPS_BY_ROLE[userRole] || STEPS_BY_ROLE.seller;
  
  const [formData, setFormData] = useState({
    // Step 2: Company Information
    company_name: '',
    business_type: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    business_email: '',
    website: '',
    year_established: '',
    company_size: '',
    company_description: '',
    
    // Step 3: Verification Documents
    business_license: null,
    tax_certificate: null,
    bank_statement: null,
    
    // Step 4: Product Categories
    categories: [],
    
    // Step 5: First Product (optional)
    first_product_title: '',
    first_product_description: '',
    first_product_price: '',
    first_product_category: '',
    
    // Step 6: Payment
    payment_method: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    swift_code: '',
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[SupplierOnboarding] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Use company_id from profile
    const userCompanyId = profile?.company_id || null;
    setCompanyId(userCompanyId);

    // Now safe to load data
    checkUserAndLoadData();
  }, [authReady, authLoading, user, profile, navigate]);

  useEffect(() => {
    if (authReady) {
      loadCategories();
    }
  }, [authReady]);

  const checkUserAndLoadData = async () => {
    try {
      setIsLoading(true);

      // ✅ FIX: Use profile.company_id directly (userCompanyId was out of scope)
      const currentCompanyId = profile?.company_id;

      // Load existing company data if available
      if (currentCompanyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', currentCompanyId)
          .single();

        if (companyData) {
          setFormData(prev => ({
            ...prev,
            company_name: companyData.company_name || '',
            business_type: companyData.business_type || '',
            country: companyData.country || '',
            city: companyData.city || '',
            address: companyData.address || '',
            phone: companyData.phone || '',
            business_email: companyData.business_email || '',
            website: companyData.website || '',
            year_established: companyData.year_established || '',
            company_size: companyData.company_size || '',
            company_description: companyData.company_description || '',
          }));
        }
      }
    } catch (error) {
      toast.error('Failed to load user data');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    // ✅ ALIBABA FLOW: Role-aware validation
    if (step === 2) {
      if (userRole === 'buyer') {
        // Buyer preferences are all optional
        // No required fields
      } else {
        // Sellers need company info
        if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
        if (!formData.business_type) newErrors.business_type = 'Business type is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.business_email.trim()) newErrors.business_email = 'Business email is required';
      }
    }

    if (step === 3) {
      // Verification is optional for all roles
    }

    if (step === 4) {
      if (userRole !== 'buyer' && userRole !== 'services') {
        if (formData.categories.length === 0) {
          newErrors.categories = 'Please select at least one product category';
        }
      }
    }

    if (step === 5) {
      // First product is optional
    }

    if (step === 6) {
      if (userRole !== 'buyer') {
        if (!formData.payment_method) {
          newErrors.payment_method = 'Payment method is required';
        }
        if (formData.payment_method === 'bank_transfer') {
          if (!formData.bank_name.trim()) newErrors.bank_name = 'Bank name is required';
          if (!formData.account_number.trim()) newErrors.account_number = 'Account number is required';
          if (!formData.account_holder_name.trim()) newErrors.account_holder_name = 'Account holder name is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    // Save step data if needed
    if (currentStep === 2) {
      await saveCompanyInfo();
    }

    if (currentStep < roleSteps.length) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => [...prev, currentStep]);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveCompanyInfo = async () => {
    try {
      if (!companyId) {
        const newCompanyId = await getOrCreateCompany(supabase, {
          ...formData,
          email: user.email,
        });
        setCompanyId(newCompanyId);
      } else {
        // Convert year_established to integer or null (database expects integer, not empty string)
        let yearEstablished = null;
        if (formData.year_established) {
          const year = typeof formData.year_established === 'string' 
            ? parseInt(formData.year_established.trim(), 10) 
            : formData.year_established;
          if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
            yearEstablished = year;
          }
        }
        
        const { error } = await supabase
          .from('companies')
          .update({
            company_name: formData.company_name,
            business_type: formData.business_type,
            country: formData.country || null,
            city: formData.city || null,
            address: formData.address || null,
            phone: formData.phone || null,
            email: formData.business_email || null,
            website: formData.website || null,
            year_established: yearEstablished, // INTEGER: null or valid year
            employee_count: formData.company_size || '1-10',
            description: formData.company_description || null,
          })
          .eq('id', companyId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to save company info:', error);
      // Continue anyway
    }
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    try {
      const { supabaseHelpers } = await import('@/api/supabaseClient');
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${field}_${timestamp}-${randomStr}.${fileExt}`;
      
      const { file_url } = await supabaseHelpers.storage.uploadFile(
        file,
        'files', // Use 'files' bucket for consistency
        `verification-documents/${fileName}`
      );

      handleChange(field, file_url);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload document: ${error.message || 'Please try again'}`);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // ✅ ALIBABA FLOW: Role-aware completion
      if (userRole === 'buyer') {
        // Buyers: minimal setup - just update profile with preferences
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            country: formData.country || null,
            onboarding_completed: true,
          })
          .eq('id', user.id);

        if (profileError) {
          console.warn('[Onboarding] Profile update error:', profileError);
        }

        toast.success('Welcome to Afrikoni! Start exploring.');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Sellers/Hybrid/Services: Full company setup
      await saveCompanyInfo();

      // Update company with categories and mark onboarding as completed
      if (companyId) {
        const updatePayload = {
          onboarding_completed: true,
        };

        if (formData.categories.length > 0) {
          updatePayload.categories = formData.categories;
        }

        const { error } = await supabase
          .from('companies')
          .update(updatePayload)
          .eq('id', companyId);

        if (error) throw error;
      }

      toast.success('Onboarding completed! Welcome to Afrikoni!');

      // If the supplier provided first-product info, guide them into the full product wizard
      if (formData.first_product_title && companyId) {
        const params = new URLSearchParams();
        params.set('fromOnboarding', '1');
        params.set('title', formData.first_product_title);

        if (formData.first_product_description) {
          params.set('description', formData.first_product_description);
        }
        if (formData.first_product_price) {
          params.set('price_min', formData.first_product_price);
        }
        if (formData.first_product_category) {
          params.set('category_id', formData.first_product_category);
        }

        navigate(`/dashboard/products/new?${params.toString()}`);
      } else {
        // Otherwise take them to their dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error('Failed to complete onboarding');
      console.error('Completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const progress = (currentStep / roleSteps.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div>
              {/* ✅ ALIBABA FLOW: Role-aware header */}
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2">
                {userRole === 'buyer' ? 'Getting Started' :
                 userRole === 'services' ? 'Partner Onboarding' :
                 userRole === 'hybrid' ? 'Trader Setup' : 'Seller Onboarding'}
              </h1>
              <p className="text-afrikoni-text-dark/70">
                {userRole === 'buyer'
                  ? 'Set up your buyer preferences to start sourcing on Afrikoni'
                  : userRole === 'services'
                  ? 'Set up your service provider profile on Afrikoni'
                  : userRole === 'hybrid'
                  ? 'Complete your profile to start buying and selling on Afrikoni'
                  : 'Complete your supplier profile to start selling on Afrikoni'}
              </p>
            </div>
            <Logo type="full" size="sm" />
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-afrikoni-text-dark">
                Step {currentStep} of {roleSteps.length}
              </span>
              <span className="text-sm text-afrikoni-text-dark/70">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
            {roleSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isPast = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted || isPast
                          ? 'bg-afrikoni-gold border-afrikoni-gold text-white'
                          : isCurrent
                          ? 'bg-afrikoni-gold/20 border-afrikoni-gold text-afrikoni-gold'
                          : 'bg-white border-afrikoni-gold/30 text-afrikoni-deep/50'
                      }`}
                    >
                      {isCompleted || isPast ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-[80px] ${
                      isCurrent ? 'font-semibold text-afrikoni-gold' : 'text-afrikoni-deep/70'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < roleSteps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      isPast ? 'bg-afrikoni-gold' : 'bg-afrikoni-gold/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardContent className="p-6 md:p-8">
                {/* Step 1: Welcome - Role-aware content */}
                {currentStep === 1 && (
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto">
                      <Building2 className="w-12 h-12 text-afrikoni-gold" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-4">
                        {userRole === 'buyer'
                          ? 'Welcome to Afrikoni!'
                          : userRole === 'services'
                          ? 'Welcome to Afrikoni Partner Network'
                          : 'Welcome to Afrikoni Supplier Platform'}
                      </h2>
                      <p className="text-afrikoni-text-dark/70 text-lg mb-6">
                        {userRole === 'buyer'
                          ? "Let's set up your preferences to find the best suppliers across Africa."
                          : userRole === 'services'
                          ? "Join our network of trusted logistics, finance, and service partners."
                          : "Let's get your business set up to start selling to buyers across Africa and beyond."}
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-left">
                      {userRole === 'buyer' ? (
                        <>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <Package className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Quality Products</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Source from verified African suppliers
                            </p>
                          </div>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <Shield className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Buyer Protection</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Escrow payments protect your orders
                            </p>
                          </div>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <DollarSign className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Best Prices</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Direct from manufacturers & exporters
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <Shield className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Verified Status</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Get verified and build trust with buyers
                            </p>
                          </div>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <Package className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Global Reach</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Access buyers from 54+ African countries
                            </p>
                          </div>
                          <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                            <DollarSign className="w-8 h-8 text-afrikoni-gold mb-2" />
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">Secure Payments</h3>
                            <p className="text-sm text-afrikoni-deep/70">
                              Escrow protection for all transactions
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-afrikoni-deep/70 mb-4">
                        {userRole === 'buyer'
                          ? 'This will take less than 1 minute.'
                          : 'This will take about 5-10 minutes to complete.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Role-aware - Preferences (buyer) or Company Info (seller) */}
                {currentStep === 2 && userRole === 'buyer' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Your Preferences
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Help us personalize your experience (optional)
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Your Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => handleChange('country', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {AFRICAN_COUNTRIES.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="business_type">What best describes you?</Label>
                        <Select
                          value={formData.business_type}
                          onValueChange={(value) => handleChange('business_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="wholesaler">Wholesaler</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="individual">Individual Buyer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-afrikoni-gold/5 rounded-lg p-4 border border-afrikoni-gold/20">
                      <p className="text-sm text-afrikoni-deep/70">
                        <Shield className="w-4 h-4 inline mr-1 text-afrikoni-gold" />
                        You can update these preferences anytime from your dashboard settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Company Information (for sellers/hybrid/services) */}
                {currentStep === 2 && userRole !== 'buyer' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Company Information
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Tell us about your business
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => handleChange('company_name', e.target.value)}
                          className={errors.company_name ? 'border-red-500' : ''}
                        />
                        {errors.company_name && (
                          <p className="text-sm text-red-600 mt-1">{errors.company_name}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="business_type">Business Type *</Label>
                        <Select
                          value={formData.business_type}
                          onValueChange={(value) => handleChange('business_type', value)}
                        >
                          <SelectTrigger className={errors.business_type ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map(type => (
                              <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.business_type && (
                          <p className="text-sm text-red-600 mt-1">{errors.business_type}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => handleChange('country', value)}
                        >
                          <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {AFRICAN_COUNTRIES.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && (
                          <p className="text-sm text-red-600 mt-1">{errors.country}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Business Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="business_email">Business Email *</Label>
                        <Input
                          id="business_email"
                          type="email"
                          value={formData.business_email}
                          onChange={(e) => handleChange('business_email', e.target.value)}
                          className={errors.business_email ? 'border-red-500' : ''}
                        />
                        {errors.business_email && (
                          <p className="text-sm text-red-600 mt-1">{errors.business_email}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="year_established">Year Established</Label>
                        <Input
                          id="year_established"
                          type="number"
                          value={formData.year_established}
                          onChange={(e) => handleChange('year_established', e.target.value)}
                          placeholder="e.g., 2020"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select
                          value={formData.company_size}
                          onValueChange={(value) => handleChange('company_size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_SIZES.map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="company_description">Company Description</Label>
                        <Textarea
                          id="company_description"
                          value={formData.company_description}
                          onChange={(e) => handleChange('company_description', e.target.value)}
                          rows={4}
                          placeholder="Tell us about your company, products, and expertise..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Complete for buyers, Verification for sellers */}
                {currentStep === 3 && userRole === 'buyer' && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-4">
                        You're All Set!
                      </h2>
                      <p className="text-afrikoni-text-dark/70 text-lg mb-6">
                        Start exploring products from verified African suppliers.
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Package className="w-6 h-6 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut mb-1">Browse Products</h3>
                        <p className="text-sm text-afrikoni-deep/70">
                          Explore thousands of products from African suppliers
                        </p>
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Shield className="w-6 h-6 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut mb-1">Request Quotes</h3>
                        <p className="text-sm text-afrikoni-deep/70">
                          Send RFQs to get competitive pricing from suppliers
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Verification (for sellers/hybrid/services) */}
                {currentStep === 3 && userRole !== 'buyer' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Business Verification
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Upload documents to get verified (optional but recommended)
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Label htmlFor="business_license" className="font-semibold text-afrikoni-chestnut">
                              Business License / Registration
                            </Label>
                            <p className="text-sm text-afrikoni-deep/70">
                              Upload your business registration certificate
                            </p>
                          </div>
                          {formData.business_license && (
                            <Badge className="bg-green-50 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        <Input
                          id="business_license"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('business_license', file);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Label htmlFor="tax_certificate" className="font-semibold text-afrikoni-chestnut">
                              Tax Certificate
                            </Label>
                            <p className="text-sm text-afrikoni-deep/70">
                              Upload your tax registration certificate
                            </p>
                          </div>
                          {formData.tax_certificate && (
                            <Badge className="bg-green-50 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        <Input
                          id="tax_certificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('tax_certificate', file);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Label htmlFor="bank_statement" className="font-semibold text-afrikoni-chestnut">
                              Bank Statement (Optional)
                            </Label>
                            <p className="text-sm text-afrikoni-deep/70">
                              Recent bank statement for verification
                            </p>
                          </div>
                          {formData.bank_statement && (
                            <Badge className="bg-green-50 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        <Input
                          id="bank_statement"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('bank_statement', file);
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Shield className="w-4 h-4 inline mr-1" />
                        Verification helps build trust with buyers. You can complete this later from your dashboard.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Product Categories */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Product Categories
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Select the categories you'll be selling in
                      </p>
                    </div>
                    {errors.categories && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{errors.categories}</p>
                      </div>
                    )}
                    <div className="grid md:grid-cols-3 gap-3">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.categories.includes(category.id)
                              ? 'border-afrikoni-gold bg-afrikoni-gold/10'
                              : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-afrikoni-chestnut">
                              {category.name}
                            </span>
                            {formData.categories.includes(category.id) && (
                              <CheckCircle className="w-5 h-5 text-afrikoni-gold" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {categories.length === 0 && (
                      <div className="text-center py-8 text-afrikoni-deep/70">
                        <Package className="w-12 h-12 mx-auto mb-2 text-afrikoni-deep/50" />
                        <p>No categories available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: First Product (Optional) */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Add Your First Product (Optional)
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        You can skip this and add products later from your dashboard
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="first_product_title">Product Title</Label>
                        <Input
                          id="first_product_title"
                          value={formData.first_product_title}
                          onChange={(e) => handleChange('first_product_title', e.target.value)}
                          placeholder="e.g., Premium Coffee Beans"
                        />
                      </div>
                      <div>
                        <Label htmlFor="first_product_category">Category</Label>
                        <Select
                          value={formData.first_product_category}
                          onValueChange={(value) => handleChange('first_product_category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter(cat => formData.categories.includes(cat.id))
                              .map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="first_product_description">Description</Label>
                        <Textarea
                          id="first_product_description"
                          value={formData.first_product_description}
                          onChange={(e) => handleChange('first_product_description', e.target.value)}
                          rows={4}
                          placeholder="Describe your product..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="first_product_price">Price (USD)</Label>
                        <Input
                          id="first_product_price"
                          type="number"
                          value={formData.first_product_price}
                          onChange={(e) => handleChange('first_product_price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                      <p className="text-sm text-afrikoni-deep/70">
                        <Package className="w-4 h-4 inline mr-1" />
                        You can add more details, images, and specifications after creating the product.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 6: Payment Setup */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        Payment Setup
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Configure how you'll receive payments
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment_method">Payment Method *</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(value) => handleChange('payment_method', value)}
                        >
                          <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.payment_method && (
                          <p className="text-sm text-red-600 mt-1">{errors.payment_method}</p>
                        )}
                      </div>
                      {formData.payment_method === 'bank_transfer' && (
                        <>
                          <div>
                            <Label htmlFor="bank_name">Bank Name *</Label>
                            <Input
                              id="bank_name"
                              value={formData.bank_name}
                              onChange={(e) => handleChange('bank_name', e.target.value)}
                              className={errors.bank_name ? 'border-red-500' : ''}
                            />
                            {errors.bank_name && (
                              <p className="text-sm text-red-600 mt-1">{errors.bank_name}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="account_number">Account Number *</Label>
                            <Input
                              id="account_number"
                              value={formData.account_number}
                              onChange={(e) => handleChange('account_number', e.target.value)}
                              className={errors.account_number ? 'border-red-500' : ''}
                            />
                            {errors.account_number && (
                              <p className="text-sm text-red-600 mt-1">{errors.account_number}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                            <Input
                              id="account_holder_name"
                              value={formData.account_holder_name}
                              onChange={(e) => handleChange('account_holder_name', e.target.value)}
                              className={errors.account_holder_name ? 'border-red-500' : ''}
                            />
                            {errors.account_holder_name && (
                              <p className="text-sm text-red-600 mt-1">{errors.account_holder_name}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="swift_code">SWIFT Code</Label>
                            <Input
                              id="swift_code"
                              value={formData.swift_code}
                              onChange={(e) => handleChange('swift_code', e.target.value)}
                              placeholder="e.g., CHASUS33"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                      <p className="text-sm text-afrikoni-deep/70">
                        <Shield className="w-4 h-4 inline mr-1" />
                        Your payment information is encrypted and secure. You can update this later from your settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 7: Completion */}
                {currentStep === 7 && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-4">
                        Onboarding Complete! 🎉
                      </h2>
                      <p className="text-afrikoni-text-dark/70 text-lg mb-6">
                        You're all set to start selling on Afrikoni!
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Package className="w-6 h-6 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut mb-1">Next Steps</h3>
                        <ul className="text-sm text-afrikoni-deep/70 space-y-1">
                          <li>• Add product listings</li>
                          <li>• Complete verification</li>
                          <li>• Set up your storefront</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Shield className="w-6 h-6 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut mb-1">Get Verified</h3>
                        <p className="text-sm text-afrikoni-deep/70">
                          Complete verification to get the verified badge and increase buyer trust.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="border-afrikoni-gold/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {currentStep < roleSteps.length ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
              >
                {currentStep === roleSteps.length - 1 ? 'Complete Setup' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Finish Onboarding
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

