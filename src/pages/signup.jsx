import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/shared/ui/button';
import { Mail, Lock, Loader2, User, ShoppingCart, Package, RefreshCw, Truck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';
import { isNetworkError, handleNetworkError } from '@/utils/networkErrorHandler';
import { Surface } from '@/components/system/Surface';

export default function Signup() {
  const { t } = useLanguage();
  const { authReady, hasUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // ✅ HORIZON FLOW: Orchestrated Role Selection
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', confirmPassword: '', general: '' });
  const [signupAttempted, setSignupAttempted] = useState(false);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  // 🚨 REDIRECT LAW: Logged-in users are sent to Post-Login Router
  useEffect(() => {
    if (!authReady || awaitingEmailVerification) return;
    if (hasUser) {
      navigate('/auth/post-login', { replace: true });
    }
  }, [authReady, hasUser, awaitingEmailVerification, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setFieldErrors({ email: '', password: '', confirmPassword: '', general: '' });

    if (!selectedRole) {
      setFieldErrors(prev => ({ ...prev, general: 'Please select your role in the trade corridor.' }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      return;
    }

    setIsLoading(true);
    try {
      const emailRedirectUrl = `${window.location.origin}/auth/callback?intended_role=${encodeURIComponent(selectedRole)}`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            intended_role: selectedRole,
          },
          emailRedirectTo: emailRedirectUrl,
        },
      });

      if (error && !data?.user) throw error;

      setSignupAttempted(true);

      if (data.user && !data.session) {
        setAwaitingEmailVerification(true);
        setVerificationEmail(formData.email.trim());
        toast.success('Sequence Initiated. Verify your email to complete.');
      } else {
        toast.success('Registration Sovereign. Welcome.');
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setFieldErrors(prev => ({ ...prev, general: handleNetworkError(error) }));
      } else {
        setFieldErrors(prev => ({ ...prev, general: error.message || 'Identity Generation Failed' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    return redirectUrl && redirectUrl !== createPageUrl('Home') ? redirectUrl : '/dashboard';
  };

  if (awaitingEmailVerification) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center py-12 px-4 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-os-accent/5 blur-[120px]" />
        <Surface variant="glass" className="p-12 max-w-md w-full border-os-accent/10">
          <div className="w-20 h-20 mx-auto mb-8 bg-os-accent/10 rounded-3xl flex items-center justify-center border border-os-accent/20">
            <Mail className="w-10 h-10 text-os-accent" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-os-text-primary mb-4">Check Corridor</h1>
          <p className="text-sm text-os-text-secondary/80 mb-8 leading-relaxed">
            We've sent a secure handshake link to <span className="text-os-accent font-bold">{verificationEmail}</span>. Verify to activate your node.
          </p>
          <Button
            variant="ghost"
            onClick={() => setAwaitingEmailVerification(false)}
            className="text-xs font-black uppercase tracking-widest text-os-text-secondary hover:text-os-accent"
          >
            Use different coordinate
          </Button>
        </Surface>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* 🎬 CINEMATIC DEPTH */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4A937]/5 rounded-full blur-[100px] animate-pulse delay-700" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl z-10"
      >
        <Surface variant="glass" className="p-10 border-white/[0.05] shadow-2xl backdrop-blur-3xl relative overflow-visible">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-os-accent to-transparent" />

          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo type="symbol" size="lg" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.4em] text-os-text-primary mb-3 leading-none">
              Apply for <span className="text-os-accent">Access</span>
            </h1>
            <p className="text-[10px] font-bold text-os-text-secondary/60 uppercase tracking-[0.2em]">
              Join the Sovereign African Trade Network
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-10">
            {/* ROLE SELECTION RIG */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block text-center mb-6">
                Select your functional domain
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'buyer', icon: ShoppingCart, label: 'Buyer', sub: 'Import/Source' },
                  { id: 'seller', icon: Package, label: 'Seller', sub: 'Export/Supply' },
                  { id: 'hybrid', icon: RefreshCw, label: 'Hybrid', sub: 'Full Trade' },
                  { id: 'services', icon: Truck, label: 'Logistics', sub: 'Infrastructure' },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 group relative overflow-hidden",
                      selectedRole === role.id
                        ? "bg-os-accent/10 border-os-accent shadow-glow"
                        : "bg-white/[0.02] border-white/[0.05] hover:border-os-accent/30 hover:bg-white/[0.05]"
                    )}
                  >
                    {selectedRole === role.id && (
                      <div className="absolute inset-0 bg-os-accent/5 animate-pulse" />
                    )}
                    <role.icon className={cn(
                      "w-6 h-6 transition-colors",
                      selectedRole === role.id ? "text-os-accent" : "text-os-text-secondary/40 group-hover:text-os-text-secondary"
                    )} />
                    <div className="text-center relative z-10">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        selectedRole === role.id ? "text-os-text-primary" : "text-os-text-secondary/60"
                      )}>{role.label}</p>
                      <p className="text-[8px] font-bold text-os-text-secondary/30 mt-1 uppercase tracking-tighter">{role.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block ml-1">Identity Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40"
                    placeholder="Full Legal Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block ml-1">Command Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block ml-1">Access Pass</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-12 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-os-text-secondary/40 hover:text-os-text-primary transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block ml-1">Confirm Protocol</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-12 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40"
                    placeholder="Confirm password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-os-text-secondary/40 hover:text-os-text-primary transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {fieldErrors.general && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center">
                {fieldErrors.general}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                  Initiating...
                </>
              ) : (
                'Create Sovereign Identity'
              )}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.05]" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-black text-os-text-secondary/40 bg-transparent px-4">
              <span className="bg-[#0A0A0B] px-4">Rapid Enrollment</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <GoogleSignIn redirectTo={getOAuthRedirectPath()} intendedRole={selectedRole} className="h-12 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all" />
            <FacebookSignIn redirectTo={getOAuthRedirectPath()} intendedRole={selectedRole} className="h-12 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all" />
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.2em] font-black text-os-text-secondary/60">
            Node already active?{' '}
            <Link to="/login" className="text-os-accent hover:underline ml-1">
              Initialize Handshake
            </Link>
          </p>
        </Surface>

        <p className="mt-10 text-center text-os-text-secondary/20 text-[8px] font-black uppercase tracking-[0.5em] animate-pulse">
          &copy; 2026 HORIZON PROTOCOL &bull; Distributed Economic Matrix
        </p>
      </motion.div>
    </div>
  );
}
