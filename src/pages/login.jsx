import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/shared/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';
import { login as authServiceLogin } from '@/services/AuthService';
import { isNetworkError, handleNetworkError } from '@/utils/networkErrorHandler';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔐 AUTH STATE
  const { authReady, hasUser, profile, user } = useAuth();

  // ✅ CAPABILITY HANDSHAKE
  const { ready, refreshCapabilities, kernelError } = useCapability();

  // ✅ FORM STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  // 🚨 REDIRECT LAW: Logged-in users are sent to Mission Control
  useEffect(() => {
    if (authReady !== true || ready !== true || !hasUser) return;

    if (!profile) {
      navigate('/onboarding/company', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, ready, hasUser, profile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.fillFields'));
      return;
    }

    setIsLoading(true);
    try {
      await authServiceLogin(email.trim(), password);
      toast.success(t('login.success') || 'Sovereign Handshake Complete');
      navigate('/auth/post-login', { replace: true });
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error(handleNetworkError(err));
      } else {
        toast.error(err.message || 'Identity Resolution Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    return redirectUrl && redirectUrl !== createPageUrl('Home') ? redirectUrl : '/dashboard';
  };

  if (typeof ready === 'undefined') {
    return (
      <div className="min-h-screen bg-os-surface-solid flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-os-accent/10 border-t-os-accent rounded-full animate-spin mb-6" />
        <p className="text-os-text-secondary uppercase tracking-[0.3em] font-black text-[10px]">Initializing Identity Kernel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* 🎬 CINEMATIC DEPTH: Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4A937]/5 rounded-full blur-[100px] animate-pulse delay-700" />

      {/* Grid Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Surface variant="glass" className="p-10 border-white/[0.05] shadow-2xl backdrop-blur-3xl relative overflow-visible">
          {/* Top Gold Accent Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-os-accent to-transparent" />

          <div className="text-center mb-10">
            <div className="flex justify-center mb-8">
              <div className="p-3 bg-os-accent/10 rounded-2xl border border-os-accent/20">
                <Logo type="symbol" size="lg" />
              </div>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-os-text-primary mb-3">
              Identity <span className="text-os-accent">Gateway</span>
            </h1>
            <p className="text-xs font-bold text-os-text-secondary/60 uppercase tracking-widest">
              Access the OS Trade Kernel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em] block ml-1">
                Command Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40 transition-all"
                  placeholder="name@company.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-os-text-secondary uppercase tracking-[0.3em]">
                  Security Protocol
                </label>
                <Link to="/forgot-password" title="Forgot Password" className="text-[9px] font-black text-os-accent uppercase tracking-widest hover:opacity-80 transition-opacity">
                  Recovery
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary/40 group-focus-within:text-os-accent transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-12 text-sm text-os-text-primary placeholder:text-os-text-secondary/20 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40 transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-os-text-secondary/40 hover:text-os-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-glow transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                  Resolving...
                </>
              ) : (
                'Initialize Handshake'
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.05]" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-black text-os-text-secondary/40 bg-transparent px-4">
              <span className="bg-[#0A0A0B] px-4">Satellite Auth</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <GoogleSignIn redirectTo={getOAuthRedirectPath()} className="h-12 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all" />
            <FacebookSignIn redirectTo={getOAuthRedirectPath()} className="h-12 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all" />
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.2em] font-black text-os-text-secondary/60">
            New Entity?{' '}
            <Link to="/signup" className="text-os-accent hover:opacity-80 transition-opacity ml-1">
              Apply for Access
            </Link>
          </p>
        </Surface>

        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 opacity-30">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-os-accent" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-os-text-secondary">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-os-accent" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-os-text-secondary">Verified Node</span>
            </div>
          </div>
          <p className="text-os-text-secondary/20 text-[8px] font-black uppercase tracking-[0.5em]">
            &copy; 2026 HORIZON PROTOCOL &bull; Trade is Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}
