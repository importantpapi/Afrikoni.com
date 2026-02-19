import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Logo } from '@/components/shared/ui/Logo';
import { useAuth } from '@/contexts/AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { SecureIdentity } from '@/components/shared/ui/SecureIdentity';
import {
  Building,
  Globe,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Zap,
  ShieldCheck,
  Palette,
  CheckCircle2,
  Lock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

export default function SupplierOnboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { palette, setPalette } = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    description: '',
    country: '',
    city: ''
  });

  const isSeller = ['seller', 'hybrid', 'services'].includes(profile?.role);
  const totalSteps = isSeller ? 3 : 2;

  const handleNext = () => {
    setDirection(1);
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          country: formData.country,
          city: formData.city,
          onboarding_completed: true,
          os_palette: palette
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (isSeller) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            company_name: formData.company_name,
            business_type: formData.industry,
            website: formData.website,
            description: formData.description,
            user_id: user.id
          });
      }

      toast.success('Profile setup complete');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('[Onboarding] Finalization error:', error);
      toast.error('Could not save your profile. Please try again.');
      setLoading(false);
    }
  };

  const palettes = [
    { id: 'gold', name: 'Classic Gold', color: '#D4A937', desc: 'The heritage of Afrikoni Trust.' },
    { id: 'cobalt', name: 'Enterprise Cobalt', color: '#007AFF', desc: 'Engineered for high-volume scale.' },
    { id: 'emerald', name: 'Sustainable Emerald', color: '#34C759', desc: 'Built for the green trade future.' },
    { id: 'crimson', name: 'Market Crimson', color: '#FF3B30', desc: 'Bold power for market leaders.' }
  ];

  return (
    <div className="min-h-screen bg-os-bg flex flex-col justify-center items-center p-6">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <Logo type="symbol" size="md" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Set up your profile
            </h1>
            <p className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (direction) => ({ x: direction < 0 ? 60 : -60, opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-10 border border-black/[0.06]">

              {/* STEP 1: Business details */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-700 block flex items-center gap-2">
                          <Building className="w-3.5 h-3.5" /> Company name
                        </label>
                        <Input
                          placeholder="Your company's legal name"
                          className="h-12 rounded-[12px] border-gray-300 text-[15px] px-4 focus:ring-os-accent/20 focus:border-os-accent"
                          value={formData.company_name}
                          onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-700 block flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" /> Industry
                        </label>
                        <Input
                          placeholder="e.g. Agriculture, Logistics"
                          className="h-12 rounded-[12px] border-gray-300 text-[15px] px-4"
                          value={formData.industry}
                          onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-700 block flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" /> Location
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Country"
                            className="h-12 rounded-[12px] border-gray-300 text-[15px] px-4"
                            value={formData.country}
                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                          />
                          <Input
                            placeholder="City"
                            className="h-12 rounded-[12px] border-gray-300 text-[15px] px-4"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-gray-700 block">Company website</label>
                        <Input
                          placeholder="https://..."
                          className="h-12 rounded-[12px] border-gray-300 text-[15px] px-4"
                          value={formData.website}
                          onChange={e => setFormData({ ...formData, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Business description (sellers only) */}
              {step === 2 && isSeller && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700 block flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" /> About your business
                    </label>
                    <textarea
                      placeholder="Describe what you trade and your key capabilities..."
                      className="w-full h-40 rounded-[12px] border border-gray-300 text-[15px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent resize-none text-gray-900"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Verified Source', 'Trade Bonded', 'Escrow Protected'].map(feature => (
                      <div key={feature} className="p-4 bg-gray-50 rounded-[12px] border border-gray-200 flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-os-accent flex-shrink-0" />
                        <span className="text-[13px] font-medium text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINAL STEP: Choose colour theme */}
              {((step === 2 && !isSeller) || (step === 3)) && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-3">
                          <Palette className="w-5 h-5 text-os-accent" /> Choose your theme
                        </h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                          Select the colour that best represents your business.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {palettes.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setPalette(p.id)}
                            className={`p-4 rounded-[14px] border text-left transition-all ${palette === p.id
                              ? 'bg-os-accent/5 border-os-accent ring-2 ring-os-accent/20'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="w-7 h-7 rounded-lg mb-3" style={{ backgroundColor: p.color }} />
                            <h4 className="text-[13px] font-semibold text-gray-900">{p.name}</h4>
                            <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <SecureIdentity size="lg" className="scale-110" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex justify-between items-center pt-8 border-t border-gray-100">
                <Button
                  onClick={handleBack}
                  disabled={step === 1 || loading}
                  variant="ghost"
                  className="h-12 px-6 text-[13px] font-medium text-gray-500 hover:text-gray-800 disabled:opacity-0"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>

                {step === totalSteps ? (
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                    className="h-12 px-10 bg-os-accent hover:bg-os-accent-dark text-black font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete setup
                        <CheckCircle2 className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="h-12 px-10 bg-os-accent hover:bg-os-accent-dark text-black font-semibold text-[15px] rounded-[14px] transition-all"
                  >
                    Continue
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-10 text-center text-[13px] text-gray-400">
        <Lock className="inline-block w-3 h-3 mr-1.5 mb-0.5" />
        Your information is encrypted and protected.
      </p>
    </div>
  );
}
