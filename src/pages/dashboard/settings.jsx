import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { cn } from '@/lib/utils';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { LogOut } from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card } from '@/components/shared/ui/card'; // Keep distinct Card import just in case, but replace major implementations
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Settings, User, Building, Bell, Shield, CreditCard, Globe, Save, Key, Lock, Upload, X, Image as ImageIcon, Cookie, ShieldCheck, Truck, TrendingUp, Zap, Sparkles, Check, Monitor, Activity, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/shared/ui/switch';
import { useTranslation } from 'react-i18next';
import CookieSettingsModal from '@/components/shared/ui/CookieSettingsModal';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { LiteModeToggle } from '@/components/system/LiteModeToggle';
import { useOSSettings } from '@/hooks/useOSSettings';

// Helper function to safely get translations with fallback
const getTranslation = (t, key, fallback) => {
  const translation = t(key);
  // If translation equals the key, it means translation is missing, use fallback
  return translation === key ? fallback : translation;
};

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

export default function DashboardSettings() {
  const { t } = useTranslation();
  // Helper function to safely get translations with fallback
  const translate = (key, fallback) => {
    const translation = t(key);
    // If translation equals the key, it means translation is missing, use fallback
    return translation === key ? fallback : translation;
  };
  const [currentRole, setCurrentRole] = useState('buyer');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    name: '',
    email: '',
    phone: '',
    company_name: '',
    business_type: '',
    country: '',
    city: '',
    business_email: '',
    website: '',
    year_established: '',
    company_size: '',
    company_description: ''
  });
  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'USD',
    email_notifications: true,
    in_app_notifications: true,
    order_updates: true,
    new_messages: true,
    rfq_responses: true,
    reviews: true,
    payments: true
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const avatarInputRef = useRef(null);

  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, user, profile } = useDashboardKernel();

  // ✅ OS SETTINGS: Management of premium effects
  const { liteMode, reducedMotion, glassOpacity, updateSettings } = useOSSettings();

  // ✅ GLOBAL HARDENING: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading settings..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        navigate('/login');
      }
      return;
    }

    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale ||
      !lastLoadTimeRef.current ||
      (Date.now() - lastLoadTimeRef.current > 30000);

    if (shouldRefresh) {
      loadUserData();
    }
  }, [canLoadData, userId, profileCompanyId, location.pathname, isStale, navigate]);

  const loadUserData = async () => {
    if (!user || !profile) {
      return;
    }

    try {
      // ✅ STALE-WHILE-REVALIDATE: Only set loading on first load
      // During background refresh, keep existing data visible
      if (!userData) {
        setIsLoading(true);
      }
      setError(null);

      // ✅ KERNEL MIGRATION: Derive role from capabilities
      const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
      const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
      const normalizedRole = isLogistics ? 'logistics' : (isSeller ? 'seller' : 'buyer');
      setCurrentRole(normalizedRole);

      setUserData(user);

      // Use profile from kernel (already loaded)
      const profileData = profile || {};

      setFormData({
        full_name: profile?.name || user?.full_name || user?.name || '',
        name: profile?.name || user?.name || '',
        email: user?.email || '',
        phone: profile?.phone || user?.phone || '',
        company_name: profile?.company_name || user?.company_name || '',
        business_type: profile?.business_type || user?.business_type || '',
        country: profile?.country || user?.country || '',
        city: profile?.city || user?.city || '',
        business_email: profile?.business_email || user?.business_email || '',
        website: profile?.website || user?.website || '',
        year_established: profile?.year_established || user?.year_established || '',
        company_size: profile?.company_size || user?.company_size || '',
        company_description: profile?.company_description || user?.company_description || ''
      });

      setAvatarUrl(profile?.avatar_url || user?.avatar_url || '');
      setApiKey(profile?.api_key || '');

      // Load notification preferences
      if (profile?.notification_preferences) {
        const prefs = typeof profile.notification_preferences === 'string'
          ? JSON.parse(profile.notification_preferences)
          : profile.notification_preferences;
        setPreferences({
          language: profile?.language || 'en',
          currency: profile?.currency || 'USD',
          email_notifications: prefs?.email !== false,
          in_app_notifications: prefs?.in_app !== false,
          order_updates: prefs?.order_updates !== false,
          new_messages: prefs?.new_messages !== false,
          rfq_responses: prefs?.rfq_responses !== false,
          reviews: prefs?.reviews !== false,
          payments: prefs?.payments !== false
        });
      }

      // ✅ GLOBAL HARDENING: Mark fresh ONLY on successful load
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      // ✅ KERNEL MIGRATION: Enhanced error handling
      console.error('[DashboardSettings] Error loading user data:', err);
      setError(err.message || 'Failed to load settings');
      logError('loadUserData', err, {
        table: 'profiles',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canLoadData || !userId) {
      toast.error('You must be logged in to upload an avatar');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    // Validate file type - accept common image formats and HEIC
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = file.type.startsWith('image/') || fileExtension === 'heic' || fileExtension === 'heif';

    if (!isValidType) {
      toast.error('Please upload an image file (JPEG, PNG, WebP, GIF, or HEIC)');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      let fileToUpload = file;

      // Convert HEIC to JPEG if needed
      if (fileExtension === 'heic' || fileExtension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          toast.info('Converting HEIC image to JPEG...');
          const heic2any = (await import('heic2any')).default;

          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
          });

          // heic2any might return an array if multiple images
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToUpload = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), {
            type: 'image/jpeg'
          });
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError);
          toast.error('HEIC conversion failed. Please use JPEG, PNG, or WebP instead.');
          if (avatarInputRef.current) avatarInputRef.current.value = '';
          setUploadingAvatar(false);
          return;
        }
      }

      // Generate unique filename - always use .jpg extension for consistency
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `avatars/${timestamp}-${randomStr}.jpg`;

      const { file_url } = await supabaseHelpers.storage.uploadFile(fileToUpload, 'files', fileName, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

      if (!file_url) throw new Error('Upload did not return a file URL');

      // Persist immediately so profile stays in sync even if user navigates away
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: file_url })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(file_url);
      toast.success('Avatar uploaded successfully');

      // Force page reload to refresh all kernel data and prevent cache issues
      window.location.reload();
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleAvatarUpload', error, {
        table: 'profiles',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error(`Failed to upload avatar: ${error.message || 'Please try again'}`);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ P2 HARDENING: Robust Logout All Devices
  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to logout from all devices? This will invalidate sessions on other browsers.')) return;

    setIsSaving(true);
    try {
      // Attempt server-side invalidation
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      toast.success('Logged out from all devices');
    } catch (error) {
      toast.warning('Logged out locally. Server session will expire shortly.');
    } finally {
      // CRITICAL: Always clear local state and redirect, even if network fails
      // This prevents "zombie" sessions on the client
      navigate('/login');
      setIsSaving(false);
    }
  };

  const generateApiKey = async () => {
    if (!confirm('Regenerating API key will invalidate the current key. Continue?')) return;

    // ✅ KERNEL MIGRATION: Check canLoadData instead of authReady
    if (!canLoadData || !user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      // ✅ KERNEL MIGRATION: Use userId from kernel
      const newApiKey = `afk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newApiKey })
        .eq('id', userId);

      if (error) throw error;

      setApiKey(newApiKey);
      toast.success('API key regenerated successfully');
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (tab = 'profile') => {
    // ✅ KERNEL MIGRATION: Check canLoadData instead of authReady
    if (!canLoadData || !user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      // ✅ KERNEL MIGRATION: Use userId from kernel
      if (tab === 'profile') {
        // Update profile with name and avatar
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: formData.name || formData.full_name,
            phone: formData.phone,
            avatar_url: avatarUrl,
            language: preferences.language,
            currency: preferences.currency
          }, { onConflict: 'id' });
      }

      if (tab === 'company') {
        // Update company info if user has a company
        if (profileCompanyId) {
          // Update company table
          const { error: companyError } = await supabase
            .from('companies')
            .update({
              company_name: formData.company_name,
              business_type: formData.business_type,
              country: formData.country || null,
              city: formData.city || null,
              phone: formData.phone || null,
              email: formData.business_email || null,
              website: formData.website || null,
              year_established: formData.year_established ? parseInt(formData.year_established) : null,
              employee_count: formData.company_size || null,
              description: formData.company_description || null
            })
            .eq('id', profileCompanyId);

          if (companyError) throw companyError;
        }

        // Update profile with company info
        await supabase
          .from('profiles')
          .update({
            name: formData.name || formData.full_name,
            phone: formData.phone,
            company_name: formData.company_name,
            business_type: formData.business_type,
            country: formData.country,
            city: formData.city,
            business_email: formData.business_email,
            website: formData.website,
            year_established: formData.year_established,
            company_size: formData.company_size,
            company_description: formData.company_description
          })
          .eq('id', userId);
      }

      if (tab === 'notifications') {
        // Save preferences to profile
        await supabase
          .from('profiles')
          .update({
            language: preferences.language,
            currency: preferences.currency,
            notification_preferences: {
              email: preferences.email_notifications,
              in_app: preferences.in_app_notifications,
              order_updates: preferences.order_updates,
              new_messages: preferences.new_messages,
              rfq_responses: preferences.rfq_responses,
              reviews: preferences.reviews,
              payments: preferences.payments
            }
          })
          .eq('id', userId);
      }

      if (tab === 'security') {
        // Save language and currency
        await supabase
          .from('profiles')
          .update({
            language: preferences.language,
            currency: preferences.currency
          })
          .eq('id', userId);
      }

      toast.success('Settings saved successfully');

      // Reload page after short delay to show toast and refresh kernel data
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ STALE-WHILE-REVALIDATE: Only show skeleton on first load
  // If userData exists, keep showing it even during background refresh
  if (isLoading && !userData) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadUserData}
      />
    );
  }

  return (
    <>
      <div className="space-y-10">
        {/* 2026 OS Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[0_32px_120px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-afrikoni-gold/10 blur-[120px]" />
            <div className="absolute -left-48 -bottom-48 h-[30rem] w-[30rem] rounded-full bg-blue-500/5 blur-[160px]" />

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-afrikoni-gold/20 blur-xl rounded-2xl" />
                    <div className="relative rounded-2xl border border-afrikoni-gold/30 bg-black/40 p-4 backdrop-blur-xl">
                      <Settings className="h-8 w-8 text-afrikoni-gold" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-px w-8 bg-afrikoni-gold/40" />
                      <span className="text-[10px] uppercase font-black tracking-[0.4em] text-afrikoni-gold/80">
                        System Control
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                      Identity <span className="text-white/40">&</span> Control
                    </h1>
                    <p className="text-sm md:text-base text-white/50 max-w-lg font-medium">
                      Manage your global enterprise presence and cryptographic security settings.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: 'Kernel 4.0', color: 'emerald' },
                    { label: 'High-Trust', color: 'afrikoni-gold' },
                    { label: 'Obsidian', color: 'blue' }
                  ].map((tag) => (
                    <div key={tag.label} className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md",
                      tag.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        tag.color === 'afrikoni-gold' ? "bg-afrikoni-gold/10 border-afrikoni-gold/20 text-afrikoni-gold" :
                          "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full animate-pulse",
                        tag.color === 'emerald' ? "bg-emerald-400" :
                          tag.color === 'afrikoni-gold' ? "bg-afrikoni-gold" :
                            "bg-blue-400"
                      )} />
                      {tag.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2026 OS Tabs */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="border-none bg-black/40 backdrop-blur-2xl rounded-[2rem] p-2 shadow-[0_24px_100px_rgba(0,0,0,0.6)] grid grid-cols-3 md:grid-cols-6 gap-2 sticky top-4 z-50 mb-12">
            {[
              { id: 'profile', label: 'Identity', icon: User },
              { id: 'company', label: 'Enterprise', icon: Building },
              { id: 'role', label: 'Policy', icon: ShieldCheck },
              { id: 'notifications', label: 'Push', icon: Bell },
              { id: 'security', label: 'Vault', icon: Lock },
              { id: 'system', label: 'Hardware', icon: Monitor },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:scale-[1.05] data-[state=active]:shadow-[0_12px_40px_rgba(255,255,255,0.15)] rounded-2xl font-black transition-all duration-300 min-h-[52px] text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group"
              >
                <tab.icon className="w-4 h-4 group-data-[state=active]:text-black text-white/40 transition-colors" />
                <span className="hidden lg:inline">{translate(`settings.${tab.id}`, tab.label)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Identity Surface */}
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-afrikoni-gold/10 border border-afrikoni-gold/30">
                    <User className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  {translate('settings.personalInformation', 'Institutional Identity')}
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-10">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row items-center gap-10 p-8 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-afrikoni-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div className="absolute -inset-4 bg-afrikoni-gold/20 blur-3xl rounded-full opacity-50" />
                    <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-2 border-afrikoni-gold/40 shadow-2xl">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/60">
                          <User className="w-12 h-12 text-white/20" />
                        </div>
                      )}

                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-afrikoni-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">Cryptographic Avatar</h4>
                      <p className="text-sm text-white/40 font-medium max-w-sm">
                        This image represents your enterprise handle across the Pan-African trade network.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                        id="avatar-upload"
                        ref={avatarInputRef}
                      />
                      <label htmlFor="avatar-upload">
                        <Button type="button" variant="outline" size="lg" disabled={uploadingAvatar} asChild className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6">
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingAvatar ? 'Uploading...' : 'Update Signature'}
                          </span>
                        </Button>
                      </label>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAvatarUrl('')}
                          className="h-12 px-6 text-red-400/60 hover:text-red-400 hover:bg-red-400/5 font-bold uppercase tracking-widest text-[10px]"
                        >
                          <X className="w-4 h-4 mr-2" /> Clear Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Account Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name || formData.full_name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Aliko Dangote"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-afrikoni-gold/40 focus:ring-afrikoni-gold/10 text-lg font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1 text-emerald-400/60 flex items-center gap-2">
                      Verified Email Root
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-14 bg-white/[0.02] border-white/5 rounded-2xl text-white/40 cursor-not-allowed font-mono italic"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Lock className="w-4 h-4 text-white/10 group-hover:text-white/20 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Localization (OS Language)</Label>
                    <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                      <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                        <SelectItem value="en">English (Continental)</SelectItem>
                        <SelectItem value="fr">Français (Maghreb/West)</SelectItem>
                        <SelectItem value="ar">العربية (North)</SelectItem>
                        <SelectItem value="pt">Português (Lusophone)</SelectItem>
                        <SelectItem value="sw">Swahili (East/Central)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Trade Currency (Settlement)</Label>
                    <Select value={preferences.currency} onValueChange={(v) => setPreferences({ ...preferences, currency: v })}>
                      <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                        <SelectItem value="USD">USD ($) - International</SelectItem>
                        <SelectItem value="NGN">NGN (₦) - Nigeria</SelectItem>
                        <SelectItem value="ZAR">ZAR (R) - South Africa</SelectItem>
                        <SelectItem value="KES">KES (KSh) - Kenya</SelectItem>
                        <SelectItem value="GHS">GHS (₵) - Ghana</SelectItem>
                        <SelectItem value="EUR">EUR (€) - European Union</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold">Commit Changes to Kernel</h4>
                      <p className="text-xs text-white/40">Persistence will be propagated across all active sessions.</p>
                    </div>
                    <Button
                      onClick={() => handleSave('profile')}
                      disabled={isSaving}
                      className="h-14 px-12 bg-afrikoni-gold hover:bg-afrikoni-gold/80 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_12px_44px_-8px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-3" />
                          Commit Identity
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-afrikoni-gold/10 border border-afrikoni-gold/30">
                    <Building className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  Enterprise Infrastructure
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                {/* Institutional Grid */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Registry Details</h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label htmlFor="company_name" className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Legal Entity Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="e.g. Dangote Cement PLC"
                        className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-medium"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="business_type" className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Enterprise Architecture</Label>
                      <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl font-medium">
                          <SelectValue placeholder="Select structure" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                          <SelectItem value="manufacturer">Industrial Manufacturer</SelectItem>
                          <SelectItem value="wholesaler">Bulk Wholesaler</SelectItem>
                          <SelectItem value="distributor">Regional Distributor</SelectItem>
                          <SelectItem value="trading_company">Global Trading Node</SelectItem>
                          <SelectItem value="logistics_provider">Fulfillment Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                      <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Base Jurisdicton</Label>
                      <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl font-medium">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10 max-h-80">
                          {AFRICAN_COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Principal City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="e.g. Lagos"
                        className="h-14 bg-white/5 border-white/10 rounded-2xl"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Foundation Year</Label>
                      <Input
                        id="year_established"
                        type="number"
                        value={formData.year_established}
                        onChange={(e) => handleChange('year_established', e.target.value)}
                        placeholder="Year"
                        className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Operative Network</h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Enterprise Scale</Label>
                      <Select value={formData.company_size} onValueChange={(v) => handleChange('company_size', v)}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl font-medium">
                          <SelectValue placeholder="Human Capital Scale" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="1-10">1-10 (Micro)</SelectItem>
                          <SelectItem value="11-50">11-50 (SME)</SelectItem>
                          <SelectItem value="51-200">51-200 (Mid-Market)</SelectItem>
                          <SelectItem value="201-500">201-500 (Enterprise)</SelectItem>
                          <SelectItem value="500+">500+ (Institutional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Digital Presence (URL)</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://..."
                        className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Capability Description</Label>
                    <Textarea
                      id="company_description"
                      value={formData.company_description}
                      onChange={(e) => handleChange('company_description', e.target.value)}
                      rows={5}
                      placeholder="Detail your industrial capacity and trade corridors..."
                      className="bg-white/5 border-white/10 rounded-2xl p-6 text-lg"
                    />
                  </div>
                </div>

                {/* Trust Gate Link */}
                <div className="p-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 group hover:bg-blue-500/10 transition-all duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">Trust Verification Hub</h4>
                      <p className="text-sm text-blue-200/50 font-medium">
                        Institutional badges, tax IDs, and trade compliance papers are managed via the Verification Gate.
                      </p>
                    </div>
                    <Link to="/dashboard/verification-center" className="w-full md:w-auto">
                      <Button type="button" variant="outline" className="w-full h-14 px-8 rounded-2xl border-blue-500/30 text-blue-400 font-bold uppercase tracking-widest text-[11px] hover:bg-blue-500/10">
                        Launch Verification Gate
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave('company')}
                    disabled={isSaving}
                    className="h-14 px-12 bg-afrikoni-gold hover:bg-afrikoni-gold/80 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_12px_44px_-8px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        Deploy Enterprise Specs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="role" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-afrikoni-gold/10 border border-afrikoni-gold/30">
                    <ShieldCheck className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  Network Access <span className="text-white/40">&</span> Policy
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                {/* Active Persona Surface */}
                <div className="p-10 rounded-[2.5rem] border border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/[0.15] to-transparent relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-48 bg-afrikoni-gold/10 rounded-full blur-[100px] -mr-24 -mt-24 group-hover:bg-afrikoni-gold/20 transition-colors duration-700" />

                  <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-afrikoni-gold">Active Persona</span>
                        {isSystemReady ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            NETWORK LIVE
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20">
                            OFFLINE SYNC
                          </span>
                        )}
                      </div>
                      <h2 className="text-5xl md:text-6xl font-black text-white mb-4 capitalize tracking-tighter">{currentRole}</h2>
                      <p className="text-base text-white/50 max-w-sm font-medium leading-relaxed">
                        {currentRole === 'buyer' && "Authorized for global sourcing, high-value RFQ issuance, and trade finance protocols."}
                        {currentRole === 'seller' && "Certified for global inventory distribution, trade listing, and RFQ fulfillment."}
                        {currentRole === 'logistics' && "Operational lead for fleet logistics, multi-modal freight booking, and tracking."}
                      </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-6">
                      <div className="text-center md:text-right">
                        <div className="text-[10px] uppercase text-white/30 font-black tracking-[0.2em] mb-2">Cryptographic Node ID</div>
                        <div className="font-mono text-sm bg-black/60 px-4 py-2 rounded-xl text-afrikoni-gold border border-white/5 shadow-inner">
                          {profileCompanyId?.split('-')[0]?.toUpperCase() || 'NODE-001'}
                        </div>
                      </div>

                      <Link to="/dashboard?switch=true">
                        <Button className="h-12 px-8 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 text-[10px]">
                          Switch Environment
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Switcher & Defaults (Hybrid Only) */}
                {(capabilities?.can_buy && capabilities?.can_sell) && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Startup Handlers</h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'buyer', label: 'Global Sourcing', icon: ShoppingCart },
                        { id: 'seller', label: 'Trade Exchange', icon: Package },
                        { id: 'logistics', label: 'Fleet Ops', icon: Truck, disabled: !capabilities?.can_logistics }
                      ].map(role => (
                        <button
                          key={role.id}
                          disabled={role.disabled}
                          onClick={() => setPreferences({ ...preferences, default_mode: role.id })}
                          className={`
                            relative flex flex-col items-center gap-4 p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden
                            ${preferences.default_mode === role.id
                              ? 'bg-afrikoni-gold text-black border-afrikoni-gold shadow-[0_20px_50px_rgba(212,175,55,0.3)] scale-[1.05] z-10'
                              : 'bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                            }
                            ${role.disabled ? 'opacity-20 grayscale cursor-not-allowed' : ''}
                          `}
                        >
                          {preferences.default_mode === role.id && (
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-black animate-ping" />
                          )}
                          <role.icon className={cn("w-8 h-8", preferences.default_mode === role.id ? "text-black" : "text-white/20")} />
                          <span className="text-[11px] font-black uppercase tracking-widest truncate w-full text-center">{role.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capabilities Grid */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Active System Privileges</h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'trade', label: 'Corridor Access', active: true, icon: Globe, desc: '54-country Continental trade gates' },
                      { id: 'finance', label: 'Trade Finance', active: capabilities?.can_finance, icon: CreditCard, desc: 'LC and escrow issuance protocols' },
                      { id: 'logistics', label: 'Logistics Matrix', active: capabilities?.can_logistics, icon: Truck, desc: 'Fleet node management access' },
                      { id: 'verification', label: 'High-Trust Badge', active: profile?.verification_status === 'verified', icon: ShieldCheck, desc: 'Verified status in global search' },
                      { id: 'analytics', label: 'Deep Data Engine', active: true, icon: TrendingUp, desc: 'Real-time market volatility indexing' },
                      { id: 'ai', label: 'Copilot AI', active: true, icon: Zap, desc: 'Algorithmic matching & risk scoring' }
                    ].map((cap) => (
                      <div key={cap.id} className={cn(
                        "p-6 rounded-[2rem] border flex flex-col items-start gap-4 transition-all group",
                        cap.active
                          ? "bg-white/[0.03] border-white/10 hover:border-afrikoni-gold/30 shadow-lg"
                          : "bg-black/20 border-transparent opacity-20 grayscale"
                      )}>
                        <div className={cn(
                          "p-3 rounded-2xl transition-all duration-500",
                          cap.active ? "bg-afrikoni-gold/10 text-afrikoni-gold group-hover:bg-afrikoni-gold group-hover:text-black" : "bg-white/5 text-white/20"
                        )}>
                          <cap.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-black text-[11px] uppercase tracking-wider text-white">{cap.label}</h4>
                            {cap.active && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <p className="text-xs text-white/40 font-medium leading-relaxed">{cap.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Callout */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">Unlock Enterprise Hub</h4>
                      <p className="text-sm text-blue-200/50 font-medium">Gain API access, dedicated bandwidth, and deep market analytics.</p>
                    </div>
                  </div>
                  <Button className="h-14 px-10 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_12px_44px_-8px_rgba(59,130,246,0.5)] transition-all">
                    Upgrade Protocol
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-afrikoni-gold/10 border border-afrikoni-gold/30">
                    <Bell className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  Omnichannel Push Settings
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-8">
                <div className="grid gap-4">
                  {[
                    { title: "Email Broadcasts", desc: "Institutional trade alerts via SMTP", key: "email_notifications", icon: Mail },
                    { title: "Dashboard HUD", desc: "In-app holographic notifications", key: "in_app_notifications", icon: Monitor },
                    { title: "Order Lifecycle", desc: "Sourcing & settlement events", key: "order_updates", icon: Package },
                    { title: "Neural Messages", desc: "Encrypted P2P trade chat alerts", key: "new_messages", icon: MessageSquare },
                    { title: "RFQ Pulse", desc: "Instant response on issuing quotes", key: "rfq_responses", icon: FileText },
                    { title: "Trust Reviews", desc: "Network reputation score updates", key: "reviews", icon: Star },
                    { title: "Escrow Events", desc: "Critical payment and release triggers", key: "payments", icon: CreditCard },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/[0.03] group hover:bg-white/[0.05] transition-all duration-300">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-xl bg-white/5 text-white/40 group-hover:text-afrikoni-gold group-hover:bg-afrikoni-gold/10 transition-all duration-500">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">{item.title}</h4>
                          <p className="text-xs text-white/40 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences[item.key]}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, [item.key]: checked })}
                        className="data-[state=checked]:bg-afrikoni-gold scale-125"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold">Sync Communication Matrix</h4>
                      <p className="text-xs text-white/40">Broadcasting will be normalized across your connected devices.</p>
                    </div>
                    <Button
                      onClick={() => handleSave('notifications')}
                      disabled={isSaving}
                      className="h-14 px-12 bg-afrikoni-gold hover:bg-afrikoni-gold/80 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_12px_44px_-8px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-3" />
                          Commit Push Logic
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-red-400/10 border border-red-400/30">
                    <Lock className="w-6 h-6 text-red-400" />
                  </div>
                  Cryptographic Vault
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                {/* Password Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Keys Rotation</h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <Label htmlFor="currentPassword" title="Current Key" className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">Current Key</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="newPassword" title="New Key" className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-1">New Strategic Key</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono"
                      />
                    </div>
                    <div className="space-y-4 flex flex-col justify-end">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving || !passwordData.newPassword}
                        variant="outline"
                        className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]"
                      >
                        Rotate Key Now
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Session & Crypto Hub */}
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Session Management</h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="p-8 rounded-[2rem] border border-red-500/20 bg-red-500/5 space-y-4">
                      <p className="text-sm text-red-200/50 font-medium">Clear all active cryptographic tokens from all devices in your network.</p>
                      <Button onClick={handleLogoutAllDevices} variant="outline" className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[10px] rounded-xl">
                        Universal Logout
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">External Connectivity</h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white font-bold uppercase tracking-widest text-[10px]">Trade API Key</Label>
                        <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="text-afrikoni-gold h-auto p-0 font-black text-[10px] uppercase tracking-widest">
                          {showApiKey ? '[ Hide ]' : '[ Reveal ]'}
                        </Button>
                      </div>
                      <div className="relative group">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey || 'UNGENERATED'}
                          readOnly
                          className="h-12 font-mono bg-black/60 border-white/5 rounded-xl text-afrikoni-gold text-center tracking-widest"
                        />
                      </div>
                      <Button variant="outline" onClick={generateApiKey} disabled={isSaving} className="w-full h-10 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10">
                        Regenerate Connection Token
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Final Commit */}
                <div className="pt-8 border-t border-white/10 text-right">
                  <Button
                    onClick={() => handleSave('security')}
                    disabled={isSaving}
                    className="h-14 px-12 bg-afrikoni-gold hover:bg-afrikoni-gold/80 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_12px_44px_-8px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        Seal Security Vault
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-[2rem] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.5)] bg-black/20 backdrop-blur-3xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent p-8">
                <div className="flex items-center gap-4 text-xl font-black text-white uppercase tracking-tighter">
                  <div className="p-3 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/20">
                    <Monitor className="w-6 h-6 text-blue-400" />
                  </div>
                  Trade OS Hardware
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                {/* Kernel Status */}
                <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />

                  <div className="relative flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
                      <div className="relative w-24 h-24 rounded-full border-4 border-blue-500/20 flex items-center justify-center">
                        <Activity className="w-10 h-10 text-blue-400 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">Kernel Pulse Active</h4>
                        <p className="text-sm text-white/40 font-medium">Monitoring GPU load and cryptographic throughput in real-time.</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">Latency: 24ms</div>
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">Uptime: 99.99%</div>
                        <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest">Buffer: 4.2GB</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Performance Mode */}
                  <div className="flex items-start justify-between p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 group hover:bg-white/[0.05] transition-all">
                    <div className="space-y-3">
                      <div className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Lite Engine Execution
                      </div>
                      <p className="text-xs text-white/40 max-w-sm font-medium leading-relaxed">
                        Reduces visual fidelity by disabling blur effects and heavy gradients. Essential for low-latency trade executions.
                      </p>
                    </div>
                    <Switch
                      checked={liteMode}
                      onCheckedChange={(v) => updateSettings({ liteMode: v })}
                      className="data-[state=checked]:bg-amber-500 scale-125"
                    />
                  </div>

                  {/* Reduced Motion */}
                  <div className="flex items-start justify-between p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 group hover:bg-white/[0.05] transition-all">
                    <div className="space-y-3">
                      <div className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Static UI Mode
                      </div>
                      <p className="text-xs text-white/40 max-w-sm font-medium leading-relaxed">
                        Disables micro-interactions and spring animations for a more persistent, infrastructure-grade interface.
                      </p>
                    </div>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={(v) => updateSettings({ reducedMotion: v })}
                      className="data-[state=checked]:bg-emerald-500 scale-125"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-4">
                  <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="text-[10px] text-blue-200/50 leading-relaxed uppercase tracking-widest font-black">
                    Hardware acceleration and sensory preferences are synchronized with your local machine's GPU profile.
                  </div>
                </div>
              </div>
            </Surface>
          </TabsContent>
        </Tabs>

        {/* Cookie Settings Modal */}
        <CookieSettingsModal
          isOpen={showCookieModal}
          onClose={() => setShowCookieModal(false)}
          onSave={(preferences) => {
            setShowCookieModal(false);
            toast.success('Cookie preferences saved successfully');
          }}
        />
      </div>
    </>
  );
}
