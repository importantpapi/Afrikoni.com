import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { LogOut } from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Settings, User, Building2, Bell, Shield, CreditCard, Globe, Save, Key, Lock, Upload, X, Image as ImageIcon, Cookie } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/shared/ui/switch';
import { useTranslation } from 'react-i18next';
import CookieSettingsModal from '@/components/shared/ui/CookieSettingsModal';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';

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

  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, user, profile } = useDashboardKernel();

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
      setIsLoading(true);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      e.target.value = '';
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
      setAvatarUrl(file_url);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleAvatarUpload', error, {
        table: 'profiles',
        companyId: userCompanyId,
        userId: userId
      });
      toast.error(`Failed to upload avatar: ${error.message || 'Please try again'}`);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      e.target.value = '';
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

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to logout from all devices?')) return;

    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Logged out from all devices');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout from all devices');
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

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
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
      <div className="space-y-8">
        {/* Premium Header with Improved Typography */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-afrikoni-gold/10 rounded-xl">
              <Settings className="w-6 h-6 md:w-7 md:h-7 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-chestnut tracking-tight leading-tight">
                Account Settings
              </h1>
              <p className="text-sm md:text-base text-afrikoni-deep/70 mt-1.5 font-normal">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </motion.div>

        {/* v2.5: Premium Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.profile', 'Profile')}
            </TabsTrigger>
            <TabsTrigger 
              value="company" 
              className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.company', 'Company')}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.notifications', 'Notifications')}
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              {translate('settings.security', 'Security')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Premium Settings Cards */}
            <Card className="border-afrikoni-gold/20 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-afrikoni-gold/10 bg-gradient-to-r from-afrikoni-offwhite to-white pb-5 pt-6">
                <CardTitle className="flex items-center gap-3 text-base md:text-lg font-semibold text-afrikoni-chestnut">
                  <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                    <User className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {translate('settings.personalInformation', 'Personal Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Avatar Upload */}
                <div>
                  <Label>{translate('settings.profilePicture', 'Profile Picture')}</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-afrikoni-gold/20" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-afrikoni-cream flex items-center justify-center border border-afrikoni-gold/20">
                        <User className="w-10 h-10 text-afrikoni-text-dark/50" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label htmlFor="avatar-upload">
                        <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} asChild>
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
                          className="ml-2 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">{translate('settings.fullName', 'Full Name')}</Label>
                  <Input
                    id="name"
                    value={formData.name || formData.full_name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={translate('settings.fullNamePlaceholder', 'Your full name')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{translate('auth.email', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-afrikoni-cream"
                  />
                  <p className="text-xs text-afrikoni-text-dark/70 mt-1">{translate('settings.emailCannotChange', 'Email cannot be changed')}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">{translate('common.language', 'Language')}</Label>
                    <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                      <SelectTrigger className="mt-1 min-h-[44px] md:min-h-0">
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
                    <Label htmlFor="currency">{translate('common.currency', 'Currency')}</Label>
                    <Select value={preferences.currency} onValueChange={(v) => setPreferences({ ...preferences, currency: v })}>
                      <SelectTrigger className="mt-1 min-h-[44px] md:min-h-0">
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
                  <Label htmlFor="phone">{translate('settings.phone', 'Phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder={translate('settings.phonePlaceholder', '+234 800 000 0000')}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('profile')} 
                  disabled={isSaving} 
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark min-h-[44px] touch-manipulation w-full md:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-afrikoni-gold/10 bg-gradient-to-r from-afrikoni-offwhite to-white pb-5 pt-6">
                <CardTitle className="flex items-center gap-3 text-base md:text-lg font-semibold text-afrikoni-chestnut">
                  <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {translate('settings.companyInformation', 'Company Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Company Basic Information */}
                <div className="space-y-5">
                  <h3 className="text-base font-semibold text-afrikoni-chestnut border-b border-afrikoni-gold/20 pb-2.5">Basic Information</h3>
                  
                  <div>
                    <Label htmlFor="company_name">{translate('settings.companyName', 'Company Name')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Enter your company name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_type">{translate('settings.businessType', 'Business Type')}</Label>
                      <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                        <SelectTrigger>
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
                      <Label htmlFor="country">{translate('onboarding.country', 'Country')}</Label>
                      <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                        <SelectTrigger>
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
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">{translate('onboarding.city', 'City')}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Enter city"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-5 pt-6 border-t border-afrikoni-gold/20">
                  <h3 className="text-base font-semibold text-afrikoni-chestnut border-b border-afrikoni-gold/20 pb-2.5">Contact Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_email">{translate('settings.businessEmail', 'Business Email')}</Label>
                      <Input
                        id="business_email"
                        type="email"
                        value={formData.business_email}
                        onChange={(e) => handleChange('business_email', e.target.value)}
                        placeholder="business@company.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">{translate('onboarding.website', 'Website')}</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-5 pt-6 border-t border-afrikoni-gold/20">
                  <h3 className="text-base font-semibold text-afrikoni-chestnut border-b border-afrikoni-gold/20 pb-2.5">Company Details</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year_established">Year Established</Label>
                      <Input
                        id="year_established"
                        type="number"
                        value={formData.year_established}
                        onChange={(e) => handleChange('year_established', e.target.value)}
                        placeholder="e.g. 2010"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select value={formData.company_size} onValueChange={(v) => handleChange('company_size', v)}>
                        <SelectTrigger>
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
                    <Label htmlFor="company_description">Company Description</Label>
                    <Textarea
                      id="company_description"
                      value={formData.company_description}
                      onChange={(e) => handleChange('company_description', e.target.value)}
                      rows={4}
                      placeholder="Describe your company, products, and services..."
                      className="mt-1"
                    />
                    <p className="text-xs text-afrikoni-deep/60 mt-1">This helps buyers understand your business better</p>
                  </div>
                </div>

                {/* Legal & Compliance (Link to Verification Center) */}
                <div className="pt-6 border-t border-afrikoni-gold/20">
                  <div className="p-4 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-afrikoni-chestnut mb-1">Legal & Compliance</h4>
                        <p className="text-sm text-afrikoni-deep/70 mb-3">
                          Update business registration, tax ID, and verification documents in the Verification Center.
                        </p>
                        <Link to="/verification-center">
                          <Button type="button" variant="outline" size="sm" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                            Go to Verification Center
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => handleSave('company')} 
                    disabled={isSaving} 
                    variant="primary" 
                    className="w-full md:w-auto min-h-[44px] touch-manipulation"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-afrikoni-gold/10 bg-gradient-to-r from-afrikoni-offwhite to-white pb-5 pt-6">
                <CardTitle className="flex items-center gap-3 text-base md:text-lg font-semibold text-afrikoni-chestnut">
                  <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                    <Bell className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {translate('settings.notifications', 'Notification Preferences')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">Email Notifications</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">In-App Notifications</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Show notifications in the dashboard</p>
                  </div>
                  <Switch
                    checked={preferences.in_app_notifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, in_app_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">Order Updates</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Notify me when order status changes</p>
                  </div>
                  <Switch
                    checked={preferences.order_updates}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, order_updates: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">New Messages</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Notify me when I receive messages</p>
                  </div>
                  <Switch
                    checked={preferences.new_messages}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, new_messages: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">RFQ Responses</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Notify me when I receive RFQ quotes</p>
                  </div>
                  <Switch
                    checked={preferences.rfq_responses}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, rfq_responses: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">Reviews</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Notify me when I receive new reviews</p>
                  </div>
                  <Switch
                    checked={preferences.reviews}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, reviews: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                  <div>
                    <h4 className="font-semibold text-afrikoni-text-dark">Payment Events</h4>
                    <p className="text-sm text-afrikoni-text-dark/70">Notify me about payment receipts and escrow releases</p>
                  </div>
                  <Switch
                    checked={preferences.payments}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, payments: checked })}
                  />
                </div>
                <div className="pt-4 border-t border-afrikoni-gold/20">
                  <p className="text-xs text-afrikoni-text-dark/60 mb-4">
                    💡 <strong>Tip:</strong> Email notifications are sent for important events like order updates, payments, and messages. 
                    You can control which types of notifications you receive via email above.
                  </p>
                </div>
                <Button 
                  onClick={() => handleSave('notifications')} 
                  disabled={isSaving} 
                  className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-goldDark w-full min-h-[44px] touch-manipulation"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-afrikoni-gold/10 bg-gradient-to-r from-afrikoni-offwhite to-white pb-5 pt-6">
                <CardTitle className="flex items-center gap-3 text-base md:text-lg font-semibold text-afrikoni-chestnut">
                  <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                    <Shield className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {translate('settings.security', 'Security Settings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Change Password */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-afrikoni-text-dark">Change Password</h4>
                  <div className="space-y-3">
                <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                </div>
                <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                      />
                </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                        id="confirmPassword"
                      type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                    />
                    </div>
                    <Button onClick={handleChangePassword} disabled={isSaving || !passwordData.newPassword} variant="outline">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-afrikoni-gold/20">
                  <h4 className="font-semibold text-afrikoni-text-dark mb-4">Two-Factor Authentication</h4>
                  <div className="p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-cream">
                    <p className="text-sm text-afrikoni-text-dark/70">
                      Two-factor authentication will be available in a future update. This feature will add an extra layer of security to your account.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-afrikoni-gold/20">
                  <h4 className="font-semibold text-afrikoni-text-dark mb-4">Session Management</h4>
                  <Button onClick={handleLogoutAllDevices} variant="outline" className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout from All Devices
                  </Button>
                  <p className="text-xs text-afrikoni-text-dark/70 mt-2">
                    This will sign you out from all devices and browsers
                  </p>
                </div>

                <div className="pt-4 border-t border-afrikoni-gold/20">
                  <h4 className="font-semibold text-afrikoni-text-dark mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Key (for future integrations)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey || 'Not generated yet'}
                        readOnly
                        className="font-mono"
                      />
                      <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? 'Hide' : 'Show'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={generateApiKey} disabled={isSaving}>
                        Regenerate
                      </Button>
                    </div>
                    <div className="p-4 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg">
                      <p className="text-xs text-afrikoni-text-dark font-semibold mb-1">⚠️ Keep this key secret</p>
                      <p className="text-xs text-afrikoni-text-dark/70">
                        This API key provides full access to your marketplace data. Never share it publicly or commit it to version control.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-afrikoni-gold/20">
                  <h4 className="font-semibold text-afrikoni-text-dark mb-4 flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-afrikoni-gold" />
                    Cookie Preferences
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm text-afrikoni-text-dark/70 mb-4">
                      Manage your cookie consent preferences. You can control which types of cookies we use to enhance your experience.
                    </p>
                    <Button 
                      onClick={() => setShowCookieModal(true)}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <Cookie className="w-4 h-4 mr-2" />
                      Manage Consent
                    </Button>
                    <p className="text-xs text-afrikoni-text-dark/70 mt-2">
                      Your preferences are saved locally and will be remembered across sessions.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave('security')} 
                  disabled={isSaving} 
                  className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-goldDark w-full md:w-auto min-h-[44px] touch-manipulation"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? translate('settings.saving', 'Saving...') : translate('settings.saveChanges', 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
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

