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
import { Settings, User, Building2, Bell, Shield, CreditCard, Globe, Save, Key, Lock, Upload, X, Image as ImageIcon, Cookie, ShieldCheck, Truck, TrendingUp, Zap, Sparkles, Check, Monitor, Activity, ShoppingCart, Package } from 'lucide-react';
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
        console.log('[DashboardSettings] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale ||
      !lastLoadTimeRef.current ||
      (Date.now() - lastLoadTimeRef.current > 30000);

    if (shouldRefresh) {
      console.log('[DashboardSettings] Data is stale or first load - refreshing');
      loadUserData();
    } else {
      console.log('[DashboardSettings] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, location.pathname, isStale, navigate]);

  const loadUserData = async () => {
    if (!user || !profile) {
      console.log('[DashboardSettings] User or profile not available');
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      // Generate unique filename with proper sanitization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `avatars/${timestamp}-${randomStr}-${cleanFileName}`;

      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      if (!file_url) throw new Error('Upload did not return a file URL');

      // Persist immediately so profile stays in sync even if user navigates away
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: file_url })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(file_url);
      toast.success('Avatar uploaded successfully');
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
      console.warn('[Logout] Server signout failed, clearing local session anyway:', error);
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
        // Note: supabaseHelpers.auth.updateMe may need profileCompanyId
        // Keeping original for now as it may handle company updates differently
        const { supabaseHelpers } = await import('@/api/supabaseClient');
        await supabaseHelpers.auth.updateMe(formData);
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
      loadUserData();
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 md:mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full blur-3xl" />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border p-3 backdrop-blur">
                    <Settings className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em]">
                      Afrikoni Trade OS
                    </div>
                    <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
                      Identity & Control Panel
                    </h1>
                    <p className="text-sm md:text-base mt-2">
                      Secure, high-trust settings for a live trade network.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs">
                    Kernel-Synced
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    Compliance Ready
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    Real-time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2026 OS Tabs */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="border rounded-2xl p-2 shadow-[0_18px_60px_rgba(0,0,0,0.35)] grid grid-cols-2 md:grid-cols-4 gap-2 backdrop-blur">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.profile', 'Profile')}
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.company', 'Company')}
            </TabsTrigger>
            <TabsTrigger
              value="role"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              Role & Permissions
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.notifications', 'Notifications')}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.security', 'Security')}
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.25)] rounded-xl font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Card */}
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-afrikoni-cream/20 backdrop-blur-sm border border-afrikoni-gold/20">
                    <User className="w-5 h-5" />
                  </div>
                  {translate('settings.personalInformation', 'Personal Information')}
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                {/* Avatar Upload */}
                <div>
                  <Label className="text-os-muted">{translate('settings.profilePicture', 'Profile Picture')}</Label>
                  <div className="mt-4 flex items-center gap-5">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-afrikoni-gold/20 shadow-lg" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-afrikoni-gold/20 bg-afrikoni-cream/20">
                        <User className="w-8 h-8 text-os-muted" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
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
                        <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} asChild className="border-afrikoni-gold/20 hover:bg-afrikoni-cream/20">
                          <span>
                            {uploadingAvatar ? translate('settings.uploading', 'Uploading...') : avatarUrl ? translate('settings.changeAvatar', 'Change Avatar') : translate('settings.uploadAvatar', 'Upload Avatar')}
                          </span>
                        </Button>
                      </label>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAvatarUrl('')}
                          className="justify-start px-0 text-red-400 hover:text-red-300 hover:bg-transparent h-auto text-xs"
                        >
                          <X className="w-3 h-3 mr-1" /> Remove photo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-os-muted">{translate('settings.fullName', 'Full Name')}</Label>
                    <Input
                      id="name"
                      value={formData.name || formData.full_name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={translate('settings.fullNamePlaceholder', 'Your full name')}
                      className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20 focus:border-white/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-os-muted">{translate('auth.email', 'Email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20 opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs mt-1.5 text-os-muted opacity-60">{translate('settings.emailCannotChange', 'Email cannot be changed')}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="language" className="text-os-muted">{translate('common.language', 'Language')}</Label>
                    <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                      <SelectTrigger className="mt-1.5 min-h-[44px] md:min-h-0 bg-afrikoni-cream/20 border-afrikoni-gold/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-os-muted">{translate('common.currency', 'Currency')}</Label>
                    <Select value={preferences.currency} onValueChange={(v) => setPreferences({ ...preferences, currency: v })}>
                      <SelectTrigger className="mt-1.5 min-h-[44px] md:min-h-0 bg-afrikoni-cream/20 border-afrikoni-gold/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="ZAR">ZAR (R)</SelectItem>
                        <SelectItem value="KES">KES (KSh)</SelectItem>
                        <SelectItem value="GHS">GHS (₵)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-os-muted">{translate('settings.phone', 'Phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder={translate('settings.phonePlaceholder', '+234 800 000 0000')}
                    className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => handleSave('profile')}
                    disabled={isSaving}
                    className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-semibold min-h-[44px] touch-manipulation w-full md:w-auto px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-afrikoni-cream/20 backdrop-blur-sm border border-afrikoni-gold/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {translate('settings.companyInformation', 'Company Information')}
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                {/* Company Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-os-muted uppercase tracking-wider border-b border-white/5 pb-2">Basic Information</h3>

                  <div>
                    <Label htmlFor="company_name" className="text-os-muted">{translate('settings.companyName', 'Company Name')} <span className="text-afrikoni-gold">*</span></Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Enter your company name"
                      className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="business_type" className="text-os-muted">{translate('settings.businessType', 'Business Type')}</Label>
                      <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                        <SelectTrigger className="mt-1.5 min-h-[44px] md:min-h-0 bg-afrikoni-cream/20 border-afrikoni-gold/20">
                          <SelectValue placeholder={translate('settings.selectBusinessType', 'Select business type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturer">{translate('onboarding.businessType.manufacturer', 'Manufacturer')}</SelectItem>
                          <SelectItem value="wholesaler">{translate('onboarding.businessType.wholesaler', 'Wholesaler')}</SelectItem>
                          <SelectItem value="distributor">{translate('onboarding.businessType.distributor', 'Distributor')}</SelectItem>
                          <SelectItem value="trading_company">{translate('onboarding.businessType.trader', 'Trading Company')}</SelectItem>
                          <SelectItem value="logistics_provider">{translate('onboarding.businessType.serviceProvider', 'Logistics Provider')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="country" className="text-os-muted">{translate('onboarding.country', 'Country')}</Label>
                      <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                        <SelectTrigger className="mt-1.5 min-h-[44px] md:min-h-0 bg-afrikoni-cream/20 border-afrikoni-gold/20">
                          <SelectValue placeholder={translate('onboarding.selectCountry', 'Select country')} />
                        </SelectTrigger>
                        <SelectContent>
                          {AFRICAN_COUNTRIES.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="city" className="text-os-muted">{translate('onboarding.city', 'City')}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Enter city"
                        className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-os-muted">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-os-muted uppercase tracking-wider border-b border-white/5 pb-2">Contact Information</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="business_email" className="text-os-muted">{translate('settings.businessEmail', 'Business Email')}</Label>
                      <Input
                        id="business_email"
                        type="email"
                        value={formData.business_email}
                        onChange={(e) => handleChange('business_email', e.target.value)}
                        placeholder="business@company.com"
                        className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-os-muted">{translate('onboarding.website', 'Website')}</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-os-muted uppercase tracking-wider border-b border-white/5 pb-2">Company Details</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="year_established" className="text-os-muted">Year Established</Label>
                      <Input
                        id="year_established"
                        type="number"
                        value={formData.year_established}
                        onChange={(e) => handleChange('year_established', e.target.value)}
                        placeholder="e.g. 2010"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_size" className="text-os-muted">Company Size</Label>
                      <Select value={formData.company_size} onValueChange={(v) => handleChange('company_size', v)}>
                        <SelectTrigger className="mt-1.5 min-h-[44px] md:min-h-0 bg-afrikoni-cream/20 border-afrikoni-gold/20">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company_description" className="text-os-muted">Company Description</Label>
                    <Textarea
                      id="company_description"
                      value={formData.company_description}
                      onChange={(e) => handleChange('company_description', e.target.value)}
                      rows={4}
                      placeholder="Describe your company, products, and services..."
                      className="mt-1.5 bg-afrikoni-cream/20 border-afrikoni-gold/20"
                    />
                    <p className="text-xs mt-1.5 text-os-muted opacity-60">This helps buyers understand your business better</p>
                  </div>
                </div>

                {/* Legal & Compliance (Link to Verification Center) */}
                <div className="pt-6 border-t border-white/5">
                  <div className="p-4 rounded-xl border border-afrikoni-gold/20 bg-afrikoni-cream/20">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-afrikoni-cream/20 text-afrikoni-gold">
                        <Shield className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[var(--os-text-primary)] mb-1">Legal & Compliance</h4>
                        <p className="text-sm text-os-muted mb-4 leading-relaxed">
                          Update business registration, tax ID, and verification documents in the Verification Center.
                        </p>
                        <Link to="/dashboard/verification-center">
                          <Button type="button" variant="outline" size="sm" className="hover:bg-afrikoni-cream/20 border-afrikoni-gold/20">
                            Go to Verification Center
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => handleSave('company')}
                    disabled={isSaving}
                    variant="primary"
                    className="w-full md:w-auto min-h-[44px] touch-manipulation bg-[#D4AF37] hover:bg-[#C5A028] text-black font-semibold px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="role" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-afrikoni-cream/20 backdrop-blur-sm border border-afrikoni-gold/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  Role & Capabilities
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                {/* Current Role Card */}
                <div className="p-6 rounded-2xl border border-afrikoni-gold/20 bg-gradient-to-br from-afrikoni-cream/10 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-afrikoni-gold/5 rounded-full blur-3xl -mr-16 -mt-16" />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-afrikoni-gold">Active Persona</span>
                        {isSystemReady ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold text-[var(--os-text-primary)] mb-2 capitalize">{currentRole}</h2>
                      <p className="text-sm text-os-muted max-w-md">
                        {currentRole === 'buyer' && "You have full access to global sourcing, RFQ creation, and trade finance tools."}
                        {currentRole === 'seller' && "You can list products, manage inventory, and respond to RFQs from global buyers."}
                        {currentRole === 'logistics' && "You manage fleet operations, shipments, and freight bidding."}
                      </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-os-muted tracking-wider mb-1">Account ID</div>
                        <div className="font-mono text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-[var(--os-text-primary)]">
                          {profileCompanyId?.split('-')[0] || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hybrid Mode & Default Persona */}
                {(capabilities?.can_buy && capabilities?.can_sell) && (
                  <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--os-text-primary)]">Hybrid Workspace Mode</h4>
                          <p className="text-xs text-os-muted">Toggle between Sourcing (Buyer) and Trading (Seller) workflows.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-blue-400">HYBRID ACTIVE</span>
                        <div className="h-6 w-px bg-blue-500/20" />
                        <Link to="/dashboard?switch=true">
                          <Button size="sm" variant="outline" className="h-8 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                            Switch Role Now
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-os-muted">Default Startup Persona</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: 'buyer', label: 'Global Buyer', icon: ShoppingCart },
                          { id: 'seller', label: 'Trade Seller', icon: Package },
                          { id: 'logistics', label: 'Logistics Op', icon: Truck, disabled: !capabilities?.can_logistics }
                        ].map(role => (
                          <button
                            key={role.id}
                            disabled={role.disabled}
                            onClick={() => setPreferences({ ...preferences, default_mode: role.id })}
                            className={`
                              flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                              ${preferences.default_mode === role.id
                                ? 'bg-afrikoni-gold text-black border-afrikoni-gold shadow-lg shadow-afrikoni-gold/10 scale-[1.02]'
                                : 'bg-white/5 border-white/10 text-os-muted hover:bg-white/10 hover:text-white'
                              }
                              ${role.disabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                            `}
                          >
                            <role.icon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase truncate w-full text-center">{role.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Capabilities Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-os-muted uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Active Capabilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'trade', label: 'Global Trade Access', active: true, icon: Globe, desc: 'Access to 54-country corridor network' },
                      { id: 'finance', label: 'Trade Finance', active: capabilities?.can_finance, icon: CreditCard, desc: 'Access to LC and trade financing tools' },
                      { id: 'logistics', label: 'Logistics Network', active: capabilities?.can_logistics, icon: Truck, desc: 'Fleet management and freight booking' },
                      { id: 'verification', label: 'Verification Badge', active: profile?.verification_status === 'verified', icon: ShieldCheck, desc: 'Trust score visibility and verified badge' },
                      { id: 'analytics', label: 'Market Analytics', active: true, icon: TrendingUp, desc: 'Real-time price & volume data' },
                      { id: 'ai', label: 'AI Copilot', active: true, icon: Zap, desc: 'Smart deal matching & risk assessment' }
                    ].map((cap) => (
                      <div key={cap.id} className={cn(
                        "p-4 rounded-xl border flex items-start gap-4 transition-all",
                        cap.active
                          ? "bg-afrikoni-cream/10 border-afrikoni-gold/20"
                          : "bg-gray-50 dark:bg-white/5 border-transparent opacity-60 grayscale"
                      )}>
                        <div className={cn(
                          "p-2 rounded-lg",
                          cap.active ? "bg-afrikoni-gold/10 text-afrikoni-gold" : "bg-gray-200 dark:bg-white/10 text-gray-400"
                        )}>
                          <cap.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-[var(--os-text-primary)]">{cap.label}</h4>
                            {cap.active && <Check className="w-3 h-3 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-os-muted leading-relaxed">{cap.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade Callout */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-blue-400">Unlock Enterprise Features</h4>
                      <p className="text-xs text-blue-400/80">Get advanced analytics, API access, and dedicated support.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)] bg-white">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-afrikoni-cream/20 backdrop-blur-sm border border-afrikoni-gold/20">
                    <Bell className="w-5 h-5" />
                  </div>
                  {translate('settings.notifications', 'Notification Preferences')}
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                {[
                  { title: "Email Notifications", desc: "Receive notifications via email", key: "email_notifications" },
                  { title: "In-App Notifications", desc: "Show notifications in the dashboard", key: "in_app_notifications" },
                  { title: "Order Updates", desc: "Notify me when order status changes", key: "order_updates" },
                  { title: "New Messages", desc: "Notify me when I receive messages", key: "new_messages" },
                  { title: "RFQ Responses", desc: "Notify me when I receive RFQ quotes", key: "rfq_responses" },
                  { title: "Reviews", desc: "Notify me when I receive new reviews", key: "reviews" },
                  { title: "Payment Events", desc: "Notify me about payment receipts and escrow releases", key: "payments" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-afrikoni-gold/20 bg-afrikoni-cream/20">
                    <div>
                      <h4 className="font-semibold text-[var(--os-text-primary)]">{item.title}</h4>
                      <p className="text-sm text-os-muted">{item.desc}</p>
                    </div>
                    <Switch
                      checked={preferences[item.key]}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, [item.key]: checked })}
                      className="data-[state=checked]:bg-[#D4AF37]"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs mb-4 text-os-muted leading-relaxed">
                    💡 <strong className="text-[var(--os-text-primary)]">Tip:</strong> Email notifications are sent for important events like order updates, payments, and messages.
                    You can control which types of notifications you receive via email above.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleSave('notifications')}
                    disabled={isSaving}
                    className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-semibold min-h-[44px] touch-manipulation w-full md:w-auto px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)] bg-white">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-afrikoni-cream/20 backdrop-blur-sm border border-afrikoni-gold/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  {translate('settings.security', 'Security Settings')}
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                {/* Change Password */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-[var(--os-text-primary)] border-b border-white/5 pb-2">Change Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        className="bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                        className="bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className="bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                    </div>
                    <Button onClick={handleChangePassword} disabled={isSaving || !passwordData.newPassword} variant="outline" className="border-afrikoni-gold/20 hover:bg-afrikoni-cream/20">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="font-semibold text-[var(--os-text-primary)] mb-4">Two-Factor Authentication</h4>
                  <div className="p-4 rounded-xl border border-afrikoni-gold/20 bg-afrikoni-cream/20">
                    <p className="text-sm text-os-muted">
                      Two-factor authentication will be available in a future update. This feature will add an extra layer of security to your account.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="font-semibold text-[var(--os-text-primary)] mb-4">Session Management</h4>
                  <Button onClick={handleLogoutAllDevices} variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout from All Devices
                  </Button>
                  <p className="text-xs mt-2 text-os-muted opacity-70">
                    This will sign you out from all devices and browsers
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="font-semibold text-[var(--os-text-primary)] mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key (for future integrations)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey || 'Not generated yet'}
                        readOnly
                        className="font-mono bg-afrikoni-cream/20 border-afrikoni-gold/20"
                      />
                      <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="border-afrikoni-gold/20 hover:bg-afrikoni-cream/20">
                        {showApiKey ? 'Hide' : 'Show'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={generateApiKey} disabled={isSaving} className="border-afrikoni-gold/20 hover:bg-afrikoni-cream/20">
                        Regenerate
                      </Button>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-xs font-semibold mb-1 text-amber-500">⚠️ Keep this key secret</p>
                      <p className="text-xs text-amber-500/80">
                        This API key provides full access to your marketplace data. Never share it publicly or commit it to version control.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h4 className="font-semibold text-[var(--os-text-primary)] mb-4 flex items-center gap-2">
                    <Cookie className="w-4 h-4" />
                    Cookie Preferences
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm text-os-muted">
                      Manage your cookie consent preferences. You can control which types of cookies we use to enhance your experience.
                    </p>
                    <Button
                      onClick={() => setShowCookieModal(true)}
                      variant="outline"
                      className="w-full sm:w-auto border-afrikoni-gold/20 hover:bg-afrikoni-cream/20"
                    >
                      <Cookie className="w-4 h-4 mr-2" />
                      Manage Consent
                    </Button>
                    <p className="text-xs mt-2 text-os-muted opacity-70">
                      Your preferences are saved locally and will be remembered across sessions.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave('security')}
                    disabled={isSaving}
                    className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-semibold min-h-[44px] touch-manipulation w-full md:w-auto px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </Surface>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Surface variant="glass" className="overflow-hidden p-0 rounded-2xl border-none shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-6">
                <div className="flex items-center gap-3 text-base md:text-lg font-semibold text-[var(--os-text-primary)]">
                  <div className="p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm border border-blue-500/20">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>
                  OS Engine Preferences
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                <div className="grid gap-6">
                  {/* Performance Mode */}
                  <div className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Lite Performance Mode
                      </div>
                      <p className="text-xs text-os-muted max-w-sm">
                        Reduces visual fidelity by disabling blur effects and heavy gradients. Recommended for older hardware or slower connections.
                      </p>
                    </div>
                    <Switch
                      checked={liteMode}
                      onCheckedChange={(v) => updateSettings({ liteMode: v })}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>

                  {/* Reduced Motion */}
                  <div className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Reduced Motion
                      </div>
                      <p className="text-xs text-os-muted max-w-sm">
                        Disables spring animations and transitions for a more static interface.
                      </p>
                    </div>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={(v) => updateSettings({ reducedMotion: v })}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="text-[11px] text-blue-200/70 leading-relaxed uppercase tracking-wider font-bold">
                    These settings are local to this machine's GPU performance capabilities.
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
