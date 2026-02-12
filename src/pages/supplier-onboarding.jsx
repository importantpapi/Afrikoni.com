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
import { Card, CardContent } from '@/components/shared/ui/card';
import { Progress } from '@/components/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import {
  CheckCircle, ArrowRight, ArrowLeft, Building2, Shield, Package,
  DollarSign, Phone, Mail, Loader2
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
  'Manufacturer', 'Wholesaler', 'Distributor', 'Trader', 'Exporter', 'Service Provider', 'Other'
];

// Phase 3: Streamlined step configuration
// Buyer: 1 step (preferences) → auto-complete
// Seller/Hybrid/Services: 2 steps (company+categories → complete)
const STEPS_BY_ROLE = {
  buyer: [
    { id: 1, title: 'Your Preferences', icon: Building2 },
  ],
  seller: [
    { id: 1, title: 'Company & Categories', icon: Building2 },
    { id: 2, title: 'All Set', icon: CheckCircle },
  ],
  hybrid: [
    { id: 1, title: 'Company & Categories', icon: Building2 },
    { id: 2, title: 'All Set', icon: CheckCircle },
  ],
  services: [
    { id: 1, title: 'Company & Categories', icon: Building2 },
    { id: 2, title: 'All Set', icon: CheckCircle },
  ],
};

export default function SupplierOnboarding() {
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState(null);

  const userRole = role || profile?.role || user?.user_metadata?.intended_role || 'seller';
  const roleSteps = STEPS_BY_ROLE[userRole] || STEPS_BY_ROLE.seller;

  const [formData, setFormData] = useState({
    // Company essentials (sellers)
    company_name: '',
    business_type: '',
    country: '',
    phone: '',
    business_email: '',
    // Categories
    categories: [],
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!authReady || authLoading) return;
    if (!user) { navigate('/login'); return; }
    setCompanyId(profile?.company_id || null);
    checkUserAndLoadData();
  }, [authReady, authLoading, user, profile, navigate]);

  useEffect(() => {
    if (authReady) loadCategories();
  }, [authReady]);

  const checkUserAndLoadData = async () => {
    try {
      setIsLoading(true);
      const currentCompanyId = profile?.company_id;
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
            phone: companyData.phone || '',
            business_email: companyData.email || '',
            categories: companyData.categories || [],
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
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
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

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1 && userRole !== 'buyer') {
      if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
      if (!formData.business_type) newErrors.business_type = 'Business type is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.business_email.trim()) newErrors.business_email = 'Business email is required';
      if (formData.categories.length === 0) newErrors.categories = 'Select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCompanyInfo = async () => {
    try {
      if (!companyId) {
        const result = await getOrCreateCompany(supabase, {
          ...formData,
          email: user.email,
        }, { returnError: true });
        if (result.error) {
          toast.error(result.error);
          return false;
        }
        setCompanyId(result.companyId);

        // Save categories on new company
        if (result.companyId && Array.isArray(formData.categories) && formData.categories.length > 0) {
          await supabase.from('companies').update({ categories: formData.categories }).eq('id', result.companyId);
        }
        return true;
      } else {
        const { error } = await supabase.from('companies').update({
          company_name: formData.company_name,
          business_type: formData.business_type,
          country: formData.country || null,
          phone: formData.phone || null,
          email: formData.business_email || null,
          categories: Array.isArray(formData.categories) && formData.categories.length > 0 ? formData.categories : [],
        }).eq('id', companyId);
        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Failed to save company info:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    // Save company data on step 1 for sellers
    if (currentStep === 1 && userRole !== 'buyer') {
      const saved = await saveCompanyInfo();
      if (!saved) return;
    }

    if (currentStep < roleSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (userRole === 'buyer') {
        // Buyer: create company + update profile → dashboard
        let buyerCompanyId = companyId;
        if (!buyerCompanyId) {
          const result = await getOrCreateCompany(supabase, {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.email?.split('@')[0] || 'My Company',
            role: 'buyer',
            company_name: profile?.full_name || user.email?.split('@')[0] || 'My Company',
            country: formData.country || null,
          }, { returnError: true });
          if (result.error) console.warn('[Onboarding] Buyer company creation error:', result.error);
          buyerCompanyId = result.companyId;
        }

        const profileUpdate = { country: formData.country || null, onboarding_completed: true };
        if (buyerCompanyId) profileUpdate.company_id = buyerCompanyId;

        await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

        try {
          const { sendWelcomeEmail } = await import('@/services/emailService');
          await sendWelcomeEmail(user.email, profile?.full_name || user.email?.split('@')[0]);
        } catch (emailErr) {
          console.warn('[Onboarding] Welcome email failed:', emailErr);
        }

        toast.success('Welcome to Afrikoni! Start exploring.');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Sellers/Hybrid/Services: save company + mark complete → dashboard
      await saveCompanyInfo();

      if (companyId) {
        await supabase.from('companies').update({ onboarding_completed: true }).eq('id', companyId);
      }

      try {
        const { sendWelcomeEmail } = await import('@/services/emailService');
        await sendWelcomeEmail(user.email, profile?.full_name || formData.company_name || user.email?.split('@')[0]);
      } catch (emailErr) {
        console.warn('[Onboarding] Welcome email failed:', emailErr);
      }

      toast.success('Welcome to Afrikoni!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to complete onboarding');
      console.error('Completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-1">
                {userRole === 'buyer' ? 'Quick Setup' : 'Company Setup'}
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm">
                {userRole === 'buyer'
                  ? 'One quick step and you\'re ready to go'
                  : `Step ${currentStep} of ${roleSteps.length} — takes under 2 minutes`}
              </p>
            </div>
            <Logo type="icon" size="sm" />
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />
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

                {/* BUYER: Single step - preferences */}
                {currentStep === 1 && userRole === 'buyer' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-afrikoni-text-dark mb-2">
                        Your Preferences
                      </h2>
                      <p className="text-afrikoni-text-dark/70 text-sm">
                        Help us personalize your experience (all optional)
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Your Country</Label>
                        <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                          <SelectContent>
                            {AFRICAN_COUNTRIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="business_type">What best describes you?</Label>
                        <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                    <p className="text-xs text-afrikoni-deep/60">
                      You can update these anytime from Settings.
                    </p>
                  </div>
                )}

                {/* SELLER/HYBRID/SERVICES: Step 1 - Company essentials + categories */}
                {currentStep === 1 && userRole !== 'buyer' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-afrikoni-text-dark mb-2">
                        Company Essentials
                      </h2>
                      <p className="text-afrikoni-text-dark/70 text-sm">
                        5 fields to get started. Add more details anytime from your dashboard.
                      </p>
                    </div>

                    {/* Required company fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Company Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={formData.company_name}
                          onChange={(e) => handleChange('company_name', e.target.value)}
                          placeholder="e.g., Accra Trading Co."
                          className={errors.company_name ? 'border-red-500' : ''}
                        />
                        {errors.company_name && <p className="text-xs text-red-600 mt-1">{errors.company_name}</p>}
                      </div>
                      <div>
                        <Label>Business Type <span className="text-red-500">*</span></Label>
                        <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                          <SelectTrigger className={errors.business_type ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map(t => (
                              <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.business_type && <p className="text-xs text-red-600 mt-1">{errors.business_type}</p>}
                      </div>
                      <div>
                        <Label>Country <span className="text-red-500">*</span></Label>
                        <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                          <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {AFRICAN_COUNTRIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
                      </div>
                      <div>
                        <Label>Phone <span className="text-red-500">*</span></Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+234 800 123 4567"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label>Business Email <span className="text-red-500">*</span></Label>
                        <Input
                          type="email"
                          value={formData.business_email}
                          onChange={(e) => handleChange('business_email', e.target.value)}
                          placeholder="sales@company.com"
                          className={errors.business_email ? 'border-red-500' : ''}
                        />
                        {errors.business_email && <p className="text-xs text-red-600 mt-1">{errors.business_email}</p>}
                      </div>
                    </div>

                    {/* Categories inline */}
                    <div>
                      <Label className="mb-2 block">
                        What do you sell? <span className="text-red-500">*</span>
                      </Label>
                      {errors.categories && (
                        <p className="text-xs text-red-600 mb-2">{errors.categories}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${formData.categories.includes(cat.id)
                              ? 'border-afrikoni-gold bg-afrikoni-gold/10 font-medium'
                              : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-afrikoni-chestnut">{cat.name}</span>
                              {formData.categories.includes(cat.id) && (
                                <CheckCircle className="w-4 h-4 text-afrikoni-gold flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {categories.length === 0 && (
                        <p className="text-center py-4 text-afrikoni-deep/50 text-sm">Loading categories...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SELLER: Step 2 - All Set */}
                {currentStep === 2 && userRole !== 'buyer' && (
                  <div className="text-center space-y-6 py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-2">
                        You're all set!
                      </h2>
                      <p className="text-afrikoni-text-dark/70 mb-4">
                        Your company profile is ready. Here's what to do next:
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-left">
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Package className="w-5 h-5 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut text-sm mb-1">Add Products</h3>
                        <p className="text-xs text-afrikoni-deep/70">
                          Use Quick Add to list your first product in under 1 minute
                        </p>
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <Shield className="w-5 h-5 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut text-sm mb-1">Get Verified</h3>
                        <p className="text-xs text-afrikoni-deep/70">
                          Upload documents to earn the verified badge
                        </p>
                      </div>
                      <div className="p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                        <DollarSign className="w-5 h-5 text-afrikoni-gold mb-2" />
                        <h3 className="font-semibold text-afrikoni-chestnut text-sm mb-1">Payment Setup</h3>
                        <p className="text-xs text-afrikoni-deep/70">
                          Configure payouts from Settings when you're ready
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
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isSubmitting}
              className="border-afrikoni-gold/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {/* Buyer: single step → complete immediately */}
          {userRole === 'buyer' && currentStep === 1 && (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
              ) : (
                <>Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}

          {/* Seller step 1: next */}
          {userRole !== 'buyer' && currentStep === 1 && (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Seller step 2 (final): complete */}
          {userRole !== 'buyer' && currentStep === 2 && (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Completing...</>
              ) : (
                <>Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
