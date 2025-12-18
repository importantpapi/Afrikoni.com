import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { LogOut } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, User, Building2, Bell, Shield, CreditCard, Globe, Save, Key, Lock, Upload, X, Image as ImageIcon, Cookie } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import CookieSettingsModal from '@/components/ui/CookieSettingsModal';

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
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      const role = user.role || user.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      setUserData(user);
      
      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const profile = profileData || {};
      
      setFormData({
        full_name: profile.name || user.full_name || user.name || '',
        name: profile.name || user.name || '',
        email: user.email || '',
        phone: profile.phone || user.phone || '',
        company_name: profile.company_name || user.company_name || '',
        business_type: profile.business_type || user.business_type || '',
        country: profile.country || user.country || '',
        city: profile.city || user.city || '',
        business_email: profile.business_email || user.business_email || '',
        website: profile.website || user.website || '',
        year_established: profile.year_established || user.year_established || '',
        company_size: profile.company_size || user.company_size || '',
        company_description: profile.company_description || user.company_description || ''
      });
      
      setAvatarUrl(profile.avatar_url || user.avatar_url || '');
      setApiKey(profile.api_key || '');
      
      // Load notification preferences
      if (profile.notification_preferences) {
        const prefs = typeof profile.notification_preferences === 'string' 
          ? JSON.parse(profile.notification_preferences)
          : profile.notification_preferences;
        setPreferences({
          language: profile.language || 'en',
          currency: profile.currency || 'USD',
          email_notifications: prefs.email !== false,
          in_app_notifications: prefs.in_app !== false,
          order_updates: prefs.order_updates !== false,
          new_messages: prefs.new_messages !== false,
          rfq_responses: prefs.rfq_responses !== false,
          reviews: prefs.reviews !== false,
          payments: prefs.payments !== false
        });
      }
    } catch (error) {
      // Error logged (removed for production)
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

    setUploadingAvatar(true);
    try {
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', `avatars/${Date.now()}-${file.name}`);
      setAvatarUrl(file_url);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
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

    setIsSaving(true);
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) return;

      const newApiKey = `afk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newApiKey })
        .eq('id', user.id);

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
    setIsSaving(true);
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        toast.error('User not found');
        return;
      }

      if (tab === 'profile') {
        // Update profile with name and avatar
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: formData.name || formData.full_name,
            phone: formData.phone,
            avatar_url: avatarUrl,
            language: preferences.language,
            currency: preferences.currency
          }, { onConflict: 'id' });
      }

      if (tab === 'company') {
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
          .eq('id', user.id);
      }

      if (tab === 'security') {
        // Save language and currency
        await supabase
          .from('profiles')
          .update({
            language: preferences.language,
            currency: preferences.currency
          })
          .eq('id', user.id);
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

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Settings</h1>
          <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Manage your account and preferences</p>
        </motion.div>

        {/* v2.5: Premium Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">{t('settings.profile')}</TabsTrigger>
            <TabsTrigger value="company" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">{t('settings.company') || 'Company'}</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">{t('settings.notifications')}</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200">{t('settings.security')}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* v2.5: Premium Settings Cards */}
            <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
                  <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
                    <User className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {t('settings.personalInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Avatar Upload */}
                <div>
                  <Label>{t('settings.profilePicture')}</Label>
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
                            {uploadingAvatar ? t('settings.uploading') : avatarUrl ? t('settings.changeAvatar') : t('settings.uploadAvatar')}
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
                  <Label htmlFor="name">{t('settings.fullName') || 'Full Name'}</Label>
                  <Input
                    id="name"
                    value={formData.name || formData.full_name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('settings.fullNamePlaceholder') || 'Your full name'}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-afrikoni-cream"
                  />
                  <p className="text-xs text-afrikoni-text-dark/70 mt-1">{t('settings.emailCannotChange') || 'Email cannot be changed'}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">{t('common.language')}</Label>
                    <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                      <SelectTrigger className="mt-1">
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
                    <Label htmlFor="currency">{t('common.currency')}</Label>
                    <Select value={preferences.currency} onValueChange={(v) => setPreferences({ ...preferences, currency: v })}>
                      <SelectTrigger className="mt-1">
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
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <Button onClick={() => handleSave('profile')} disabled={isSaving} className="bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
                  <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  {t('settings.companyInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <Label htmlFor="company_name">{t('settings.companyName')}</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_type">{t('settings.businessType')}</Label>
                    <Select value={formData.business_type} onValueChange={(v) => handleChange('business_type', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings.selectBusinessType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">{t('onboarding.businessType.manufacturer')}</SelectItem>
                        <SelectItem value="wholesaler">{t('onboarding.businessType.wholesaler')}</SelectItem>
                        <SelectItem value="distributor">{t('onboarding.businessType.distributor')}</SelectItem>
                        <SelectItem value="trading_company">{t('onboarding.businessType.trader')}</SelectItem>
                        <SelectItem value="logistics_provider">{t('onboarding.businessType.serviceProvider')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="country">{t('onboarding.country')}</Label>
                    <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('onboarding.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">{t('onboarding.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_email">{t('settings.businessEmail')}</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => handleChange('business_email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">{t('onboarding.website')}</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_established">Year Established</Label>
                    <Input
                      id="year_established"
                      type="number"
                      value={formData.year_established}
                      onChange={(e) => handleChange('year_established', e.target.value)}
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
                  />
                </div>
                <Button onClick={handleSave} disabled={isSaving} variant="primary">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
                  <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
                    <Bell className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  Notification Preferences
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
                <Button onClick={() => handleSave('notifications')} disabled={isSaving} className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-goldDark w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Notification Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader className="border-b border-afrikoni-gold/20 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
                    <Shield className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  Security Settings
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

                <Button onClick={() => handleSave('security')} disabled={isSaving} className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
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
    </DashboardLayout>
  );
}

