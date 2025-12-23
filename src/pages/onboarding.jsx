import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isWelcomeCompleting, setIsWelcomeCompleting] = useState(false);
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
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkOnboardingStatus();
    
    // Check for role query param (from logistics partner onboarding)
    const roleParam = searchParams.get('role');
    if (roleParam && ['buyer', 'seller', 'hybrid', 'logistics', 'logistics_partner'].includes(roleParam)) {
      const normalizedRole = roleParam === 'logistics_partner' ? 'logistics' : roleParam;
      setSelectedRole(normalizedRole);
      // If role is provided, skip to step 2
      setCurrentStep(2);
    }
  }, [searchParams]);

  const checkOnboardingStatus = async () => {
    try {
      // Check email verification first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login', { replace: true });
        return;
      }

      if (!session.user.email_confirmed_at) {
        navigate('/verify-email', { replace: true });
        return;
      }

      const { user, onboardingCompleted, profile, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // If already completed (has onboarding_completed=true AND company_id), redirect to dashboard
      if (onboardingCompleted && companyId) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // No role pre-selection - user must select role in Step 1

      // Load existing profile data if available
      if (profile) {
        setFormData({
          company_name: profile.company_name || '',
          country: profile.country || '',
          phone: profile.phone || '',
          website: profile.website || '',
          business_type: profile.business_type || '',
          city: profile.city || ''
        });
      }
    } catch (error) {
      console.error('Onboarding check error:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Auto-align business type with role to avoid confusing options
    setFormData(prev => {
      // For logistics partners, default to service/logistics provider
      if (role === 'logistics' || role === 'logistics_partner') {
        return { ...prev, business_type: 'service_provider' };
      }
      // For other roles, let the user choose explicitly
      return { ...prev, business_type: prev.business_type || '' };
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
      if (currentStep === 1 && !selectedRole) {
      toast.error(t('onboarding.pleaseSelectRole'));
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  /**
   * One-time welcome completion handler.
   * Marks onboarding as completed and sends the user directly
   * to their role-specific dashboard, without asking for extra
   * company details.
   */
  const handleWelcomeComplete = async () => {
    setIsWelcomeCompleting(true);
    try {
      const { user, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      const normalizedRole = selectedRole || profile?.role || user.user_metadata?.role || 'buyer';

      // Best-effort: mark onboarding as completed in profiles table
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, role: normalizedRole, user_role: normalizedRole })
          .eq('id', user.id);
      } catch (profileError) {
        console.warn('Welcome completion profile update failed (non-blocking):', profileError);
      }

      toast.success('Welcome to Afrikoni! Your account is ready.');

      // Redirect to role-specific dashboard
      const dashboardPath = `/${normalizedRole}/dashboard`;
      console.log('[Onboarding] Redirecting to dashboard:', {
        normalizedRole,
        dashboardPath
      });
      navigate(dashboardPath, { replace: true });

      // Hard fallback in case React Router navigation is blocked
      setTimeout(() => {
        if (window.location.pathname.includes('/onboarding')) {
          window.location.assign(dashboardPath);
        }
      }, 300);
    } catch (error) {
      console.error('Welcome completion error:', error);
      toast.error('Something went wrong finishing setup. Please try again.');
    } finally {
      setIsWelcomeCompleting(false);
    }
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

      // ATOMIC COMPANY CREATION: Only update profile if company creation succeeds
      let companyId = null;
      try {
        companyId = await getOrCreateCompany(supabase, {
          ...formData,
          id: user.id,
          email: user.email,
          role: selectedRole
        });
        
        if (!companyId) {
          throw new Error('Company creation returned null');
        }
      } catch (companyError) {
        console.error('Company creation failed:', companyError);
        toast.error('Failed to create company. Please try again.');
        setIsSubmitting(false);
        return; // STOP HERE - don't update profile if company creation fails
      }

      // ONLY update profile if company creation succeeded
      const updateData = {
        role: selectedRole,
        user_role: selectedRole,
        company_id: companyId, // Required - onboarding only completes with company_id
        onboarding_completed: true // ONLY set to true AFTER company creation succeeds
      };

      // Update profile with role and onboarding completion
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update failed during onboarding:', profileError);
        toast.error('Failed to update profile. Please try again.');
        setIsSubmitting(false);
        return; // Don't proceed if profile update fails
      }

      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('@/services/emailService');
        await sendWelcomeEmail(user.email, formData.full_name || user.email?.split('@')[0] || 'there');
      } catch (emailError) {
        // Don't block onboarding if email fails
        console.log('Welcome email not sent:', emailError);
      }

      // Notify admins that user completed onboarding (with company info)
      try {
        const { notifyAdminOfOnboardingCompletion } = await import('@/services/riskMonitoring');
        await notifyAdminOfOnboardingCompletion(
          user.id,
          user.email,
          formData.full_name || user.email?.split('@')[0],
          formData.company_name || null
        );
      } catch (notifyError) {
        // Don't block onboarding if notification fails
        console.warn('Failed to notify admins of onboarding completion:', notifyError);
      }

      toast.success('Onboarding completed! Welcome to Afrikoni.');
      
      // Redirect to dashboard (which will detect role and show appropriate content)
      navigate('/dashboard', { replace: true });
      
      // Show community invite after redirect (non-blocking)
      setTimeout(async () => {
        const shouldShowCommunity = window.confirm('🎉 Welcome to Afrikoni! Would you like to join our WhatsApp Community to connect with verified buyers, suppliers & logistics partners?');
        if (shouldShowCommunity) {
          const { openWhatsAppCommunity } = await import('@/utils/whatsappCommunity');
          openWhatsAppCommunity('onboarding_success');
        }
      }, 1000);
      
      // Redirect to role-specific dashboard
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Onboarding error:', error);
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
      label: t('onboarding.role.buyer'),
      description: t('onboarding.role.buyerDesc'),
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      id: 'seller',
      label: t('onboarding.role.seller'),
      description: t('onboarding.role.sellerDesc'),
      icon: Package,
      color: 'blue'
    },
    {
      id: 'hybrid',
      label: t('onboarding.role.hybrid') || 'Hybrid',
      description: t('onboarding.role.hybridDesc') || 'Buy & Sell Products - Access both buying and selling tools',
      icon: Building2,
      color: 'purple'
    },
    {
      id: 'logistics',
      label: t('onboarding.role.logistics'),
      description: t('onboarding.role.logisticsDesc'),
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
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">{t('onboarding.completeProfile')}</h1>
          <p className="text-afrikoni-deep">{t('onboarding.setupAccount')}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-afrikoni-deep">
              {t('onboarding.step')} {currentStep} {t('onboarding.of')} 2
            </span>
            <span className="text-sm text-afrikoni-deep/70">
              {Math.round((currentStep / 2) * 100)}% {t('onboarding.complete')}
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
                <CardTitle className="text-2xl text-afrikoni-chestnut">{t('onboarding.chooseRole')}</CardTitle>
                <p className="text-afrikoni-deep/70 mt-2">{t('onboarding.selectHowUse')}</p>
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
                    {t('onboarding.continue')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: One-time Welcome Page (replaces company form) */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle className="text-2xl text-afrikoni-chestnut">
                  Welcome to Afrikoni
                </CardTitle>
                <p className="text-afrikoni-deep/70 mt-3">
                  Your account is now set up. You can start exploring your dashboard, connect with trusted
                  buyers, suppliers and logistics partners across Africa, and manage your trade with confidence.
                </p>
                <p className="text-afrikoni-deep/70 mt-3">
                  If you ever have questions or something doesn’t feel right, you can always reach out directly
                  at <span className="font-semibold text-afrikoni-chestnut">hello@afrikoni.com</span> and we’ll
                  take care of you.
                </p>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <div className="space-y-6">
                  <div className="bg-afrikoni-cream/60 border border-afrikoni-gold/30 rounded-lg p-4 text-sm text-afrikoni-deep/80">
                    <p className="mb-1">
                      Afrikoni is built for serious trade: sourcing, selling and moving products across Africa with
                      protection at every step.
                    </p>
                    <p>
                      You’ll be able to update your company details later from your dashboard settings whenever you’re
                      ready.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1"
                    >
                      {t('onboarding.previous')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleWelcomeComplete}
                      disabled={isWelcomeCompleting}
                      variant="primary"
                      className="flex-1 min-w-[160px]"
                    >
                      {isWelcomeCompleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          Start using Afrikoni
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

