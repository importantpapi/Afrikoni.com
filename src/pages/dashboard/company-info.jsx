import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { SearchableSelect } from '@/components/shared/ui/SearchableSelect';
import { Surface } from '@/components/system/Surface';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Building, Save, CheckCircle, AlertCircle, Upload, X,
  ImageIcon, Users, Plus, Trash2, Sparkles,
  Zap, Globe, Activity, ShieldCheck, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { useTrustScore } from '@/hooks/useTrustScore';
import TrustScoreCard from '@/components/trust/TrustScoreCard';

// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibe', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

const CITY_BY_COUNTRY = {
  'DR Congo': ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 'Bukavu', 'Goma', 'Likasi', 'Tshikapa', 'Kindu', 'Uvira', 'Matadi', 'Mbandaka', 'Beni', 'Butembo', 'Kolwezi', 'Isiro', 'Mwene-Ditu', 'Kikwit', 'Kalemie', 'Kamina', 'Gandajika', 'Bandundu', 'Gemena', 'Kipushi', 'Boma', 'Kasongo', 'Bunia', 'Mbanza-Ngungu'],
  'Congo': ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Madingou', 'Ouenze', 'Loandjili'],
  'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Onitsha', 'Warri', 'Sokoto', 'Ikorodu', 'Oshogbo', 'Calabar'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Ruiru', 'Kikuyu', 'Kangundo-Tala', 'Malindi'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Ethekwini', 'Ekurhuleni', 'Tshwane', 'Nelson Mandela Bay', 'Buffalo City', 'Manguang', 'Emfuleni', 'Polokwane'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshie', 'Tema'],
  'Morocco': ['Casablanca', 'Fez', 'Tangier', 'Marrakech', 'Salé', 'Meknes', 'Rabat', 'Oujda', 'Kenitra', 'Agadir'],
  'Ethiopia': ['Addis Ababa', 'Gondar', 'Mek\'ele', 'Adama', 'Awasa', 'Bahir Dar', 'Dire Dawa', 'Dessie', 'Jimma', 'Jijiga'],
  'Tanzania': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Zanzibar City'],
  'Angola': ['Luanda', 'N\'dalatando', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soy'],
  "Côte d'Ivoire": ['Abidjan', 'Bouaké', 'Daloa', 'Korhogo', 'Yamoussoukro', 'San-Pédro', 'Gagnoa', 'Man', 'Divo', 'Anyama'],
  'Senegal': ['Dakar', 'Touba', 'Thiès', 'Rufisque', 'Kaolack', 'M\'bour', 'Ziguinchor', 'Saint-Louis', 'Diourbel', 'Louga'],
  'Cameroon': ['Douala', 'Yaoundé', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'Ngaoundéré', 'Kumba', 'Nkongsamba', 'Buea'],
  'Uganda': ['Kampala', 'Nansana', 'Kira', 'Ssabagabo', 'Mbarara', 'Mukono', 'Gulu', 'Lugazi', 'Masaka', 'Kasese'],
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El Oued'],
  'Gabon': ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
  'Togo': ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Kpalimé'],
  'Benin': ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Djougou'],
  'Mali': ['Bamako', 'Sikasso', 'Kalabancoro', 'Koutiala', 'Mopti'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
  'Guinea': ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Khums'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan'],
  'Sudan': ['Khartoum', 'Omdurman', 'Nyala', 'Port Sudan', 'Kassala'],
  'Zambia': ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola'],
  'Zimbabwe': ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Epworth']
};

const validateCompanyForm = (formData) => {
  const errors = {};
  if (!formData.company_name || formData.company_name.trim().length < 2) {
    errors.company_name = 'Company name must be at least 2 characters';
  }
  if (!formData.country) {
    errors.country = 'Please select a country';
  }
  if (formData.phone && formData.phone.trim().length < 5) {
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
  const { profileCompanyId, userId, user, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  const { trustData, loading: trustLoading } = useTrustScore(profileCompanyId);
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') || '/dashboard';
  const navigate = useNavigate();
  const location = useLocation();
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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
  const [errors, setErrors] = useState({});

  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading company information..." ready={isSystemReady} />
      </div>
    );
  }

  useEffect(() => {
    if (isSystemReady && !userId) {
      navigate('/login');
    }
  }, [isSystemReady, userId, navigate]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }
    setUploadingLogo(true);
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `company-logos/${timestamp}-${randomStr}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      setLogoUrl(file_url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      logError('handleLogoUpload', error, { table: 'companies', companyId: profileCompanyId, userId });
      toast.error(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const loadData = async () => {
    if (!profileCompanyId) return;
    try {
      if (!formData.company_name) setIsLoading(true);
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileCompanyId)
        .single();
      if (companyError) throw companyError;
      if (companyData) {
        setFormData({
          company_name: companyData.company_name || '',
          business_type: companyData.business_type || 'manufacturer',
          country: companyData.country || '',
          city: companyData.city || '',
          phone: companyData.phone || '',
          business_email: companyData.email || user?.email || '',
          website: companyData.website || '',
          year_established: companyData.year_established || '',
          company_size: companyData.employee_count || '1-10',
          company_description: companyData.description || ''
        });
        setLogoUrl(companyData.logo_url || '');
        setCoverUrl(companyData.cover_image_url || '');
        setGalleryImages(Array.isArray(companyData.gallery_images) ? companyData.gallery_images : []);
      }
      const { data: teamData } = await supabase.from('company_team').select('*').eq('company_id', profileCompanyId).order('created_at', { ascending: false });
      setTeamMembers(teamData || []);
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      logError('loadData', err, { profileCompanyId });
      toast.error('Failed to load company information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canLoadData && (isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000))) {
      loadData();
    }
  }, [canLoadData, profileCompanyId, userId, isStale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCompanyForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before saving');
      return;
    }

    setErrors({});
    setIsSaving(true);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out')), 30000);
    });

    try {
      if (!userId) {
        navigate('/login');
        return;
      }

      const userEmail = user?.email || '';
      let finalCompanyId = profileCompanyId;
      let yearEstablishedValue = null;
      if (formData.year_established) {
        const year = parseInt(formData.year_established, 10);
        if (!isNaN(year)) yearEstablishedValue = year;
      }

      // 1. IDENTITY RECOVERY
      if (!finalCompanyId && userEmail) {
        const { data: existingMatch } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_email', userEmail)
          .maybeSingle();
        if (existingMatch) finalCompanyId = existingMatch.id;
      }

      // 2. CREATE OR UPDATE COMPANY
      const companyPayload = {
        company_name: formData.company_name,
        business_type: formData.business_type,
        country: formData.country || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.business_email || userEmail || null,
        owner_email: userEmail || null,
        website: formData.website || null,
        year_established: yearEstablishedValue,
        employee_count: formData.company_size || '1-10',
        description: formData.company_description || null,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        gallery_images: galleryImages || null
      };

      if (finalCompanyId) {
        const { error: updateErr } = await Promise.race([
          supabase.from('companies').update(companyPayload).eq('id', finalCompanyId),
          timeoutPromise
        ]);
        if (updateErr) {
          if (updateErr.code === '42501' || updateErr.message?.includes('permission denied')) {
            throw new Error(`Permission Denied (RLS): Your account is not authorized to update this record. Please apply the latest migrations.`);
          }
          throw updateErr;
        }
      } else {
        const { data: newCompany, error: insertErr } = await Promise.race([
          supabase.from('companies').insert(companyPayload).select('id').single(),
          timeoutPromise
        ]);
        if (insertErr) throw insertErr;
        finalCompanyId = newCompany.id;
      }

      // 3. SECURE LINKING (RPC)
      const { error: linkErr } = await Promise.race([
        supabase.rpc('link_user_to_company', {
          target_user_id: String(userId),
          target_company_id: String(finalCompanyId)
        }),
        timeoutPromise
      ]);

      if (linkErr) {
        console.warn('[CompanyInfo] RPC Link failed, using direct update fallback', linkErr);
        await supabase.from('profiles').update({ company_id: finalCompanyId }).eq('id', userId);
      }

      // 4. SECONDARY SYNC (Hardened)
      const { error: profileErr } = await Promise.race([
        supabase.from('profiles').update({
          company_name: formData.company_name,
          business_type: formData.business_type,
          country: formData.country || null,
          city: formData.city || null,
          phone: formData.phone || null,
          website: formData.website || null,
          year_established: String(yearEstablishedValue || ''),
          company_size: formData.company_size || '1-10',
          company_description: formData.company_description || null,
          role: 'trader',
          onboarding_completed: true
        }).eq('id', userId),
        timeoutPromise
      ]);

      if (profileErr) console.warn("Profile sync issues:", profileErr.message);

      toast.success('Company information saved successfully!');
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('company-profile-updated', { detail: { companyId: finalCompanyId } }));
      }

      setTimeout(() => {
        setIsSaving(false);
        navigate(returnUrl);
      }, 800);
    } catch (error) {
      logError('saveCompanyInfo', error, { profileCompanyId, userId });
      toast.error(error.message || 'Failed to save company information');
      setIsSaving(false);
    }
  };

  if (isLoading && !formData.company_name) return <CardSkeleton count={3} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="os-page os-stagger space-y-10 max-w-[1600px] mx-auto pb-24 px-4 py-8">
      {/* Header & Identity Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-os-accent/10 rounded-os-lg border border-os-accent/30">
              <Building className="w-10 h-10 text-os-accent" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-4">
                Company Profile
                <Badge variant="outline" className="text-xs font-semibold uppercase border-os-stroke text-os-text-secondary px-3 py-1">
                  Trade Identity
                </Badge>
              </h1>
              <p className="text-os-text-secondary text-base">Your business profile shown to buyers and sellers on Afrikoni.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-6 py-4 flex items-center gap-6">
            <TrustScoreCard score={trustData?.trust_score} size="sm" />
            <div className="w-px h-8 bg-os-stroke" />
            <Button
              variant="ghost"
              onClick={handleSubmit}
              disabled={isSaving}
              className="h-10 px-5 gap-3 text-white font-bold bg-os-accent hover:bg-os-accent/90 transition-all rounded-lg shadow-os-sm border-none"
            >
              <Save className={cn("w-3.5 h-3.5", isSaving && "animate-spin")} />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Surface>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Core Identity Management */}
        <div className="lg:col-span-8 space-y-8">
          <Surface variant="ivory" className="p-8 relative" overflow="visible">
            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-4 border-b border-os-stroke pb-5">
                <div className="p-2.5 bg-os-accent/10 rounded-lg border border-os-accent/20">
                  <Zap className="w-5 h-5 text-os-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Basic Information</h3>
                  <p className="text-sm text-os-text-secondary">This is what buyers and sellers see when they find your company.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-sm font-semibold">Company Name</Label>
                    <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))} className={cn("h-12", errors.company_name && "border-red-500")} placeholder="e.g. Afrikoni Trading Ltd" />
                    {errors.company_name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.company_name}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="business_type" className="text-sm font-semibold opacity-80">Business Type</Label>
                    <Select value={formData.business_type} onValueChange={(v) => setFormData(prev => ({ ...prev, business_type: v }))}>
                      <SelectTrigger className="h-12 bg-os-surface-solid border-os-stroke"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="trading_company">Trading Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold">Country</Label>
                    <SearchableSelect value={formData.country} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v, city: '' }))} options={AFRICAN_COUNTRIES} placeholder="Select country" className={cn("bg-os-surface-solid", errors.country ? "border-red-500" : "")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                    <SearchableSelect value={formData.city} onValueChange={(v) => setFormData(prev => ({ ...prev, city: v }))} options={CITY_BY_COUNTRY[formData.country] || []} placeholder="Select city" icon={MapPin} allowCustom={true} className="bg-os-surface-solid" />
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          {/* Contact Details Surface */}
          <Surface variant="ivory" className="p-8 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-os-text-secondary flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Contact Details
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="business_email" className="text-sm font-semibold">Business Email</Label><Input id="business_email" value={formData.business_email} onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))} placeholder="contact@company.com" /></div>
                <div className="space-y-1.5"><Label htmlFor="website" className="text-sm font-semibold">Website</Label><Input id="website" value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} placeholder="https://company.com" /></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+234..." /></div>
              </div>
            </div>
          </Surface>

          {/* Logo Upload Surface */}
          <Surface variant="ivory" className="p-8 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-os-text-secondary flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-os-accent" />
              Visual Identity
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="relative group/logo">
                <div className="w-36 h-36 rounded-2xl bg-os-surface-solid border-2 border-dashed border-os-stroke flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <Building className="w-10 h-10 text-os-text-secondary opacity-40" />}
                  {uploadingLogo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
                </div>
                <input type="file" onChange={handleLogoUpload} className="hidden" id="logo-up" accept="image/*" />
                <label htmlFor="logo-up" className="absolute -bottom-2 -right-2 p-2.5 bg-os-accent text-black rounded-lg cursor-pointer shadow-os-lg"><Upload className="w-4 h-4" /></label>
              </div>
            </div>
          </Surface>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          <TrustScoreCard score={trustData?.trust_score} variant="sidebar" />
          <Surface variant="ivory" className="p-6 border border-os-accent/20 bg-os-accent/5">
            <div className="flex items-center gap-3 mb-4"><Activity className="w-4 h-4 text-os-accent" /><h3 className="text-sm font-semibold text-os-accent">Profile Tip</h3></div>
            <p className="text-sm text-os-text-secondary leading-relaxed">Verified contact info increases your trust score.</p>
          </Surface>
          <Surface variant="ivory" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4"><h3 className="text-sm font-bold">Your Team</h3><Users className="w-4 h-4 text-os-text-secondary" /></div>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-os-surface-solid border rounded-lg text-sm">
                  <span>{member.member_email}</span>
                  <Badge variant="outline">Member</Badge>
                </div>
              ))}
              <Button variant="ghost" onClick={() => navigate('/dashboard/team-members')} className="w-full border border-dashed text-xs font-bold gap-2"><Plus className="w-3 h-3" />Manage Team</Button>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
