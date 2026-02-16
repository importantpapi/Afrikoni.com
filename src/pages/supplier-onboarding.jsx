import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Logo } from '@/components/shared/ui/Logo';
import { useAuth } from '@/contexts/AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { SovereignIdentity } from '@/components/shared/ui/SovereignIdentity';
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
  Lock
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

  // Calculate steps based on role
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
      // 1. Update Profile & Persist Palette
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

      // 2. Create/Update Company if Seller
      if (isSeller) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.company_name,
            industry: formData.industry,
            website: formData.website,
            description: formData.description,
            owner_id: user.id
          });
        // Note: insert handles new companies, update would be a separate flow
        // In this simple onboarding, we insert. If they already have one, insert might fail or we handle it.
      }

      toast.success('IDENTITY GENESIS COMPLETE');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('[Onboarding] Finalization error:', error);
      toast.error('Identity handshake failed');
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
    <div className="min-h-screen bg-[#0A0A0B] relative overflow-hidden flex flex-col justify-center items-center p-6">
      {/* 🎬 CINEMATIC DEPTH */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-os-accent/5 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="max-w-4xl w-full z-10">
        <header className="text-center mb-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex p-4 bg-os-accent/10 border border-os-accent/20 rounded-3xl backdrop-blur-xl"
          >
            <Logo type="symbol" size="md" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-[0.4em] text-os-text-primary">
              OS <span className="text-os-accent">Initialization</span>
            </h1>
            <p className="text-[10px] font-bold text-os-text-secondary/40 uppercase tracking-[0.3em]">
              Sequence {step} of {totalSteps} &bull; Horizon Protocol 2026
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (direction) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Surface variant="glass" className="p-10 border-white/[0.05] shadow-2xl relative overflow-visible">

              {/* STEP 1: ENTITY PROTOCOLS */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60 ml-1 flex items-center gap-2">
                          <Building className="w-3 h-3" /> Corporate Entity
                        </label>
                        <Input
                          placeholder="Legal Business Name"
                          className="bg-white/5 border-white/10 h-14 rounded-xl text-lg px-6 focus:ring-os-accent/20"
                          value={formData.company_name}
                          onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60 ml-1 flex items-center gap-2">
                          <Globe className="w-3 h-3" /> Industry Vertical
                        </label>
                        <Input
                          placeholder="e.g. Agri-Tech, Logistics"
                          className="bg-white/5 border-white/10 h-14 rounded-xl text-lg px-6"
                          value={formData.industry}
                          onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60 ml-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Operational Hub
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Country"
                            className="bg-white/5 border-white/10 h-14 rounded-xl text-lg px-6"
                            value={formData.country}
                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                          />
                          <Input
                            placeholder="City"
                            className="bg-white/5 border-white/10 h-14 rounded-xl text-lg px-6"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60 ml-1">Company Website</label>
                        <Input
                          placeholder="https://..."
                          className="bg-white/5 border-white/10 h-14 rounded-xl text-lg px-6"
                          value={formData.website}
                          onChange={e => setFormData({ ...formData, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: NARRATIVE (SELLER ONLY) OR CALIBRATION (BUYER ONLY) */}
              {step === 2 && isSeller && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60 ml-1 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Business Narrative
                    </label>
                    <textarea
                      placeholder="Describe your trade capabilities..."
                      className="w-full h-40 bg-white/5 border-white/10 rounded-xl text-lg px-6 py-4 focus:outline-none focus:ring-1 focus:ring-os-accent/20 resize-none text-white border-white/10"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['verified_source', 'trade_bonded', 'secure_escrow'].map(feature => (
                      <div key={feature} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-os-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-os-text-primary">
                          {feature.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CALIBRATION STEP (Final Step for Everyone) */}
              {((step === 2 && !isSeller) || (step === 3)) && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-os-text-primary flex items-center gap-3">
                          <Palette className="w-5 h-5 text-os-accent" /> Aesthetic Calibration
                        </h3>
                        <p className="text-[10px] text-os-text-secondary/60 uppercase tracking-widest leading-relaxed">
                          Choose the digital personality of your sovereign environment.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {palettes.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setPalette(p.id)}
                            className={`p-4 rounded-2xl border text-left transition-all group ${palette === p.id
                              ? 'bg-os-accent/10 border-os-accent ring-4 ring-os-accent/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                              }`}
                          >
                            <div className="w-8 h-8 rounded-lg mb-3 shadow-glow" style={{ backgroundColor: p.color }} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-os-text-primary group-hover:text-os-accent transition-colors">
                              {p.name}
                            </h4>
                            <p className="text-[8px] text-os-text-secondary/40 uppercase tracking-tighter mt-1 leading-normal">
                              {p.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex justify-center">
                      <div className="absolute inset-0 bg-os-accent/5 blur-[80px] rounded-full animate-pulse" />
                      <SovereignIdentity size="lg" className="scale-110" />
                    </div>
                  </div>
                </div>
              )}

              <footer className="mt-12 flex justify-between items-center pt-8 border-t border-white/[0.05]">
                <Button
                  onClick={handleBack}
                  disabled={step === 1 || loading}
                  variant="ghost"
                  className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-os-text-secondary/40 hover:text-os-text-primary disabled:opacity-0"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Go Back
                </Button>

                {step === totalSteps ? (
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                    className="h-16 px-12 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-glow animate-pulse hover:animate-none"
                  >
                    {loading ? 'CALIBRATING...' : 'Identity Genesis'}
                    {!loading && <CheckCircle2 className="ml-3 w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="h-16 px-12 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl"
                  >
                    Next Sequence
                    <ChevronRight className="ml-3 w-4 h-4" />
                  </Button>
                )}
              </footer>
            </Surface>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-12 text-center text-os-text-secondary/10 text-[8px] font-black uppercase tracking-[0.5em]">
        <Lock className="inline-block w-2 H-2 mr-2" />
        Sovereign Handshake Protected &bull; Protocol V2026 Edition
      </footer>
    </div>
  );
}
