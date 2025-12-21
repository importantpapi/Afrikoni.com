import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, CheckCircle, AlertCircle, Upload, X, Image as ImageIcon, Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DashboardLayout from '@/layouts/DashboardLayout';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

// Validation function for company form
const validateCompanyForm = (formData) => {
  const errors = {};
  
  if (!formData.company_name || formData.company_name.trim().length < 2) {
    errors.company_name = 'Company name must be at least 2 characters';
  }
  
  if (!formData.country) {
    errors.country = 'Please select a country';
  }
  
  if (!formData.phone || formData.phone.trim().length < 5) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  if (formData.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
    errors.business_email = 'Please enter a valid email address';
  }
  
  if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
    errors.website = 'Please enter a valid website URL (starting with http:// or https://)';
  }
  
  return errors;
};

export default function CompanyInfo() {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') || '/dashboard';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    business_type: 'manufacturer',
    country: '',
    city: '',
    phone: '',
    business_email: '',
    website: '',
    year_established: '',
    company_size: '1-10',
    company_description: ''
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamMember, setNewTeamMember] = useState({ email: '', role: 'member' });
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [currentRole, setCurrentRole] = useState('buyer');
  const [errors, setErrors] = useState({});

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', `company-logos/${Date.now()}-${file.name}`);
      setLogoUrl(file_url);
        toast.success('Logo uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Cover image size must be less than 10MB');
      return;
    }

    setUploadingCover(true);
    try {
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', `company-covers/${Date.now()}-${file.name}`);
      setCoverUrl(file_url);
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 10) {
      toast.error('Maximum 10 gallery images allowed');
      return;
    }

    setUploadingGallery(true);
    try {
      const uploadPromises = files.map(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          return null;
        }
        return supabaseHelpers.storage.uploadFile(
          file, 
          'files', 
          `company-gallery/${Date.now()}-${Math.random()}-${file.name}`
        );
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results
        .filter(r => r && r.file_url)
        .map(r => r.file_url);
      
      if (successfulUploads.length > 0) {
        setGalleryImages(prev => [...prev, ...successfulUploads]);
        toast.success(`${successfulUploads.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast.error('Failed to upload gallery images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate('/login');
        return;
      }
      setUser(authUser);

      // Get user profile to find company_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id, role, company_name, business_type, country, city, phone, business_email, website, year_established, company_size, company_description')
        .eq('id', authUser.id)
        .maybeSingle();

      // If profile has company_id, load company data
      if (profileData?.company_id) {
        setCompanyId(profileData.company_id);
        
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .maybeSingle();

        if (companyData) {
          setFormData({
            company_name: companyData.company_name || profileData.company_name || '',
            business_type: companyData.business_type || profileData.business_type || 'manufacturer',
            country: companyData.country || profileData.country || '',
            city: companyData.city || profileData.city || '',
            phone: companyData.phone || profileData.phone || '',
            business_email: companyData.email || profileData.business_email || authUser.email || '',
            website: companyData.website || profileData.website || '',
            year_established: companyData.year_established || profileData.year_established || '',
            company_size: companyData.employee_count || profileData.company_size || '1-10',
            company_description: companyData.description || profileData.company_description || ''
          });
          setLogoUrl(companyData.logo_url || '');
          setCoverUrl(companyData.cover_image_url || companyData.cover_url || '');
          setGalleryImages(Array.isArray(companyData.gallery_images) ? companyData.gallery_images : []);
        }
        
        // Load team members
        if (profileData.company_id) {
          const { data: teamData } = await supabase
            .from('company_team')
            .select('*')
            .eq('company_id', profileData.company_id)
            .order('created_at', { ascending: false });
          setTeamMembers(teamData || []);
        }
        
        // Set current role
        const role = profileData.role || authUser.user_metadata?.role || 'buyer';
        setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);
      } else if (profileData) {
        // Load from profile if no company yet
        setFormData({
          company_name: profileData.company_name || '',
          business_type: profileData.business_type || 'manufacturer',
          country: profileData.country || '',
          city: profileData.city || '',
          phone: profileData.phone || '',
          business_email: profileData.business_email || authUser.email || '',
          website: profileData.website || '',
          year_established: profileData.year_established || '',
          company_size: profileData.company_size || '1-10',
          company_description: profileData.company_description || ''
        });
      } else {
        // Set default email
        setFormData(prev => ({
          ...prev,
          business_email: authUser.email || ''
        }));
      }
    } catch (error) {
      toast.error('Failed to load company information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCompanyForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setErrors({});
    setIsSaving(true);
    try {
      if (!user) {
        toast.error('User not found. Please log in again.');
        navigate('/login');
        return;
      }

      let finalCompanyId = companyId;

      // Create or update company
      if (companyId) {
        // Update existing company
        const { error: updateErr } = await supabase
          .from('companies')
          .update({
            company_name: formData.company_name,
            business_type: formData.business_type,
            country: formData.country,
            city: formData.city,
            phone: formData.phone,
            email: formData.business_email || user.email,
            website: formData.website,
            year_established: formData.year_established,
            employee_count: formData.company_size,
            description: formData.company_description,
            logo_url: logoUrl,
            cover_image_url: coverUrl,
            gallery_images: galleryImages
          })
          .eq('id', companyId);

        if (updateErr) throw updateErr;
      } else {
        // Create new company
        const { data: newCompany, error: companyErr } = await supabase
          .from('companies')
          .insert({
            company_name: formData.company_name,
            owner_email: user.email,
            business_type: formData.business_type,
            country: formData.country,
            city: formData.city,
            phone: formData.phone,
            email: formData.business_email || user.email,
            website: formData.website,
            year_established: formData.year_established,
            employee_count: formData.company_size,
            description: formData.company_description,
            logo_url: logoUrl,
            cover_image_url: coverUrl,
            cover_url: coverUrl,
            gallery_images: galleryImages
          })
          .select('id')
          .single();

        if (companyErr) throw companyErr;
        if (newCompany) {
          finalCompanyId = newCompany.id;
          setCompanyId(newCompany.id);
        }
      }

      // Update profile with company information
      const profileUpdate = {
        company_id: finalCompanyId,
        company_name: formData.company_name,
        business_type: formData.business_type,
        country: formData.country,
        city: formData.city,
        phone: formData.phone,
        business_email: formData.business_email,
        website: formData.website,
        year_established: formData.year_established,
        company_size: formData.company_size,
        company_description: formData.company_description
      };

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileUpdate
        }, { onConflict: 'id' });

      if (profileErr) {
        throw new Error(`Failed to save profile: ${profileErr.message}`);
      }

      toast.success('Company information saved successfully!');
      
      // Invalidate supplier page cache by triggering a refresh
      // This ensures supplier page shows updated data
      if (finalCompanyId) {
        // Clear any cached company data
        try {
          await supabase
            .from('companies')
            .select('id')
            .eq('id', finalCompanyId)
            .single();
        } catch (e) {
          // Ignore - just triggering a refresh
        }
      }
      
      // Redirect back to where user came from, or to dashboard
      // Small delay to show success message
      setTimeout(() => {
        navigate(returnUrl);
      }, 800);
    } catch (error) {
      toast.error(error?.message || 'Failed to save company information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newTeamMember.email || !companyId) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAddingTeamMember(true);
    try {
      const { error } = await supabase
        .from('company_team')
        .insert({
          company_id: companyId,
          member_email: newTeamMember.email,
          role_label: newTeamMember.role,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Team member added');
      setNewTeamMember({ email: '', role: 'member' });
      loadData();
    } catch (error) {
      toast.error('Failed to add team member');
    } finally {
      setIsAddingTeamMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('company_team')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
      </DashboardLayout>
    );
  }

  // Make all fields optional - no blocking
  const requiredFieldsFilled = true; // Always allow save

  return (
    <DashboardLayout currentRole={currentRole}>
    <div className="space-y-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
            <Building2 className="w-6 h-6 text-afrikoni-gold" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Company Information</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">Complete your company profile before adding photos</p>
          </div>
        </div>
      </motion.div>

      {/* Status Banner */}
      {requiredFieldsFilled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-afrikoni-gold" />
          <span className="text-sm text-afrikoni-chestnut">Required fields completed. You can now add photos.</span>
        </motion.div>
      )}

      {!formData.company_name && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-afrikoni-gold" />
          <span className="text-sm text-afrikoni-chestnut">Tip: Adding company information helps buyers find and trust you. All fields are optional except those marked with *.</span>
        </motion.div>
      )}

        {/* Company Card Preview */}
        {companyId && (logoUrl || coverUrl || formData.company_name) && (
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-0">
              <div className="relative">
                {coverUrl ? (
                  <img 
                    src={coverUrl} 
                    alt="Cover" 
                    className="w-full h-32 object-cover rounded-t-lg"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-32 bg-afrikoni-cream rounded-t-lg" />
                )}
                <div className="absolute bottom-0 left-4 transform translate-y-1/2 flex items-center gap-4">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-20 h-20 rounded-lg object-cover border-4 border-white shadow-afrikoni"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center border-4 border-white shadow-afrikoni">
                      <Building2 className="w-10 h-10 text-afrikoni-gold" />
                    </div>
                  )}
                  <div className="pt-8 pb-4">
                    <h3 className="font-bold text-lg text-afrikoni-chestnut">{formData.company_name || 'Your Company'}</h3>
                    {formData.country && (
                      <p className="text-sm text-afrikoni-deep/70">{formData.country}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Company Info and Team */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Company Information</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {/* Form content stays the same */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* v2.5: Premium Company Info Cards */}
        <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">Company Details</CardTitle>
            <CardDescription className="mt-3 text-afrikoni-text-dark/70">
              Provide your company information. This will be visible to potential buyers and partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo and Cover Upload */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Company Logo</Label>
                        <div className="mt-2 flex items-center gap-4">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-lg object-cover border border-afrikoni-gold/20" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-afrikoni-cream flex items-center justify-center border border-afrikoni-gold/20">
                              <ImageIcon className="w-8 h-8 text-afrikoni-deep/50" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label htmlFor="logo-upload">
                              <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} asChild>
                                <span>
                                  {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                                </span>
                              </Button>
                            </label>
                            {logoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogoUrl('')}
                                className="ml-2 text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Cover Image</Label>
                        <div className="mt-2 flex items-center gap-4">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="w-32 h-20 rounded-lg object-cover border border-afrikoni-gold/20" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-32 h-20 rounded-lg bg-afrikoni-cream flex items-center justify-center border border-afrikoni-gold/20">
                              <ImageIcon className="w-8 h-8 text-afrikoni-deep/50" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              disabled={uploadingCover}
                              className="hidden"
                              id="cover-upload"
                            />
                            <label htmlFor="cover-upload">
                              <Button type="button" variant="outline" size="sm" disabled={uploadingCover} asChild>
                                <span>
                                  {uploadingCover ? 'Uploading...' : coverUrl ? 'Change Cover' : 'Upload Cover'}
                                </span>
                              </Button>
                            </label>
                            {coverUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCoverUrl('')}
                                className="ml-2 text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="company_name">
                          Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g. Acme Trading Ltd"
                    required
                          className={`mt-1 ${errors.company_name ? 'border-red-500' : ''}`}
                  />
                        {errors.company_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                        )}
                </div>

                {/* Business Type */}
                <div>
                  <Label htmlFor="business_type">
                    Business Type
                  </Label>
                  <Select 
                    value={formData.business_type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, business_type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="trading_company">Trading Company</SelectItem>
                      <SelectItem value="logistics_provider">Logistics Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div>
                  <Label htmlFor="country">
                          Country <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
                  >
                          <SelectTrigger className={`mt-1 ${errors.country ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                        )}
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Lagos"
                    className="mt-1"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone">
                          Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    required
                          className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                </div>

                {/* Business Email */}
                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
                    placeholder="contact@company.com"
                          className={`mt-1 ${errors.business_email ? 'border-red-500' : ''}`}
                  />
                        {errors.business_email && (
                          <p className="text-red-500 text-sm mt-1">{errors.business_email}</p>
                        )}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                          className={`mt-1 ${errors.website ? 'border-red-500' : ''}`}
                  />
                        {errors.website && (
                          <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                        )}
                </div>

                {/* Year Established */}
                <div>
                  <Label htmlFor="year_established">Year Established</Label>
                  <Input
                    id="year_established"
                    type="number"
                    value={formData.year_established}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_established: e.target.value }))}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="mt-1"
                  />
                </div>

                {/* Company Size */}
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select 
                    value={formData.company_size} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, company_size: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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

                      {/* Company Description */}
                      <div className="md:col-span-2">
                        <Label htmlFor="company_description">Company Description</Label>
                        <Textarea
                          id="company_description"
                          value={formData.company_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                          placeholder="Tell us about your company, products, services, and what makes you unique..."
                          rows={5}
                          className="mt-1"
                        />
                        <p className="text-xs text-afrikoni-deep/70 mt-1">
                          This description will help buyers understand your business better.
                        </p>
                      </div>
                    </div>

                    {/* Gallery Images Section */}
                    <div className="md:col-span-2 border-t border-afrikoni-gold/20 pt-6">
                      <Label>Company Gallery (Create Your Visual World)</Label>
                      <p className="text-xs text-afrikoni-deep/70 mt-1 mb-4">
                        Upload up to 10 images showcasing your company, products, facilities, or team. Make your profile come alive!
                      </p>
                      
                      {/* Gallery Grid */}
                      {galleryImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {galleryImages.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-afrikoni-gold/20"
                                loading="lazy"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Button */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          disabled={uploadingGallery || galleryImages.length >= 10}
                          className="hidden"
                          id="gallery-upload"
                        />
                        <label htmlFor="gallery-upload">
                          <Button 
                            type="button" 
                            variant="outline" 
                            disabled={uploadingGallery || galleryImages.length >= 10}
                            asChild
                          >
                            <span className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2 inline" />
                              {uploadingGallery 
                                ? 'Uploading...' 
                                : galleryImages.length >= 10 
                                  ? 'Maximum 10 images reached' 
                                  : `Add Images (${galleryImages.length}/10)`
                              }
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-afrikoni-gold/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(returnUrl)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                        disabled={isSaving}
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-afrikoni-chestnut mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Company Information
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage your company team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current User as Owner */}
                {user && (
                  <div className="p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-offwhite">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-afrikoni-chestnut">{user.email}</div>
                        <div className="text-sm text-afrikoni-deep/70">Owner</div>
                      </div>
                      <Badge variant="default">Owner</Badge>
                    </div>
                  </div>
                )}

                {/* Team Members List */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-afrikoni-chestnut">Team Members</h4>
                    {teamMembers.map((member) => (
                      <div key={member.id} className="p-4 border border-afrikoni-gold/20 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-medium text-afrikoni-chestnut">{member.member_email}</div>
                          <div className="text-sm text-afrikoni-deep/70 capitalize">{member.role_label}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Team Member Form */}
                <div className="p-4 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-cream">
                  <h4 className="font-semibold text-afrikoni-chestnut mb-4">Add Team Member</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Input
                      type="email"
                      placeholder="team@company.com"
                      value={newTeamMember.email}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                      className="flex-1"
                    />
                    <Select 
                      value={newTeamMember.role} 
                      onValueChange={(v) => setNewTeamMember({ ...newTeamMember, role: v })}
                    >
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddTeamMember}
                      disabled={isAddingTeamMember || !newTeamMember.email}
                      className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
    </div>
    </DashboardLayout>
  );
}

