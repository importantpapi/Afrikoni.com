import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole, hasCompletedOnboarding } from '@/utils/authHelpers';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { validateOnboardingForm } from '@/utils/validation';
import { sanitizeString } from '@/utils/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, Package, Building2, Truck, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    country: '',
    phone: '',
    website: '',
    business_type: '',
    city: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { user, onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user) {
        navigate('/login');
        return;
      }

      // If already completed, redirect to dashboard
      if (onboardingCompleted) {
        navigate('/dashboard');
        return;
      }

      // Load existing profile data if available
      if (user) {
        const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        if (profile) {
          setSelectedRole(profile.role || null);
          setFormData({
            company_name: profile.company_name || '',
            country: profile.country || '',
            phone: profile.phone || '',
            website: profile.website || '',
            business_type: profile.business_type || '',
            city: profile.city || ''
          });
        }
      }
    } catch (error) {
      // Error logged (removed for production)
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateOnboardingForm(formData, 2);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before continuing');
      return;
    }
    
    setErrors({});

    setIsSubmitting(true);
    try {
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      // Create or update company
      let companyId = null;
      try {
        companyId = await getOrCreateCompany(supabase, {
          ...formData,
          id: user.id,
          email: user.email,
          role: selectedRole
        });
      } catch (companyError) {
        // Continue even if company creation fails
      }

      // Update profile with role and onboarding completion
      const updateData = {
        role: selectedRole,
        user_role: selectedRole,
        onboarding_completed: true,
        company_name: formData.company_name,
        country: formData.country,
        phone: formData.phone,
        website: formData.website,
        business_type: formData.business_type,
        city: formData.city
      };

      if (companyId) {
        updateData.company_id = companyId;
      }

      // Try profiles table first; if it doesn't exist, ignore and rely on auth metadata only
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (profileError && profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      toast.success('Onboarding completed! Welcome to Afrikoni.');
      const { getDashboardPathForRole } = await import('@/utils/roleHelpers');
      const dashboardPath = getDashboardPathForRole(selectedRole || 'buyer');
      navigate(dashboardPath);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  const roles = [
    {
      id: 'buyer',
      label: 'Buyer',
      description: 'Source products and connect with verified suppliers',
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      id: 'seller',
      label: 'Seller',
      description: 'Sell products & services to buyers across Africa',
      icon: Package,
      color: 'blue'
    },
    {
      id: 'hybrid',
      label: 'Hybrid',
      description: 'Buy & Sell Products - Access both buying and selling tools',
      icon: Building2,
      color: 'purple'
    },
    {
      id: 'logistics',
      label: 'Logistics Partner',
      description: 'Provide shipping and delivery services on the platform',
      icon: Truck,
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" link={true} showTagline={true} />
          </div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Complete Your Profile</h1>
          <p className="text-afrikoni-deep">Let's set up your account to get started</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-afrikoni-deep">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-afrikoni-deep/70">
              {Math.round((currentStep / 2) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / 2) * 100} className="h-2" />
        </div>

        {/* Step 1: Role Selection */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle className="text-2xl text-afrikoni-chestnut">Choose Your Role</CardTitle>
                <p className="text-afrikoni-deep/70 mt-2">Select how you'll use Afrikoni</p>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <motion.button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleSelect(role.id)}
                        className={`
                          p-6 rounded-xl border-2 transition-all text-left
                          ${isSelected
                            ? 'border-afrikoni-gold bg-afrikoni-gold/10 shadow-afrikoni'
                            : 'border-afrikoni-gold/20 bg-afrikoni-offwhite hover:border-afrikoni-gold/40'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            p-3 rounded-lg
                            ${isSelected ? 'bg-afrikoni-gold/20' : 'bg-afrikoni-cream'}
                          `}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-afrikoni-gold' : 'text-afrikoni-deep/70'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-afrikoni-chestnut mb-1">{role.label}</h3>
                            <p className="text-sm text-afrikoni-deep/70">{role.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={!selectedRole}
                    variant="primary"
                    className="min-w-[120px]"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Company Information */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle className="text-2xl text-afrikoni-chestnut">Company Information</CardTitle>
                <p className="text-afrikoni-deep/70 mt-2">Tell us about your business</p>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="company_name" className="mb-2 block font-semibold">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Your company name"
                      required
                      className={errors.company_name ? 'border-red-500' : ''}
                    />
                    {errors.company_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country" className="mb-2 block font-semibold">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-afrikoni-offwhite text-afrikoni-chestnut focus:outline-none focus:ring-2 focus:ring-afrikoni-gold ${errors.country ? 'border-red-500' : 'border-afrikoni-gold/20'}`}
                        required
                      >
                        <option value="">Select country</option>
                        {AFRICAN_COUNTRIES.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city" className="mb-2 block font-semibold">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="mb-2 block font-semibold">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1234567890"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website" className="mb-2 block font-semibold">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://yourcompany.com"
                      className={errors.website ? 'border-red-500' : ''}
                    />
                    {errors.website && (
                      <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="business_type" className="mb-2 block font-semibold">Business Type</Label>
                    <select
                      id="business_type"
                      value={formData.business_type}
                      onChange={(e) => handleChange('business_type', e.target.value)}
                      className="w-full px-3 py-2 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite text-afrikoni-chestnut focus:outline-none focus:ring-2 focus:ring-afrikoni-gold"
                    >
                      <option value="">Select business type</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="retailer">Retailer</option>
                      <option value="distributor">Distributor</option>
                      <option value="trader">Trader</option>
                      <option value="service_provider">Service Provider</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                      className="flex-1 min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

