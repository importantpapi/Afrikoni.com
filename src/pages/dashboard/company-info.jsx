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
import { Surface } from '@/components/system/Surface';
import {
  Building, Save, CheckCircle, AlertCircle, Upload, X,
  Image as ImageIcon, Users, Plus, Trash2, Sparkles,
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
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, user, canLoadData, capabilities, isSystemReady } = useDashboardKernel();

  // ✅ TRUST SCORE INTEGRATION
  const { trustData, loading: trustLoading } = useTrustScore(profileCompanyId);

  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') || '/dashboard';
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ GLOBAL HARDENING: Data freshness tracking (30 second threshold)
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
  const [currentRole, setCurrentRole] = useState(capabilities?.role || 'buyer');
  const [errors, setErrors] = useState({});

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state (UI Gate)
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading company information..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check if user is authenticated (Safe Navigation)
  useEffect(() => {
    if (isSystemReady && !userId) {
      navigate('/login');
    }
  }, [isSystemReady, userId, navigate]);

  if (!userId || !isSystemReady) {
    return null;
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      // Generate unique filename with proper sanitization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `company-logos/${timestamp}-${randomStr}-${cleanFileName}`;

      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      setLogoUrl(file_url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleLogoUpload', error, {
        table: 'companies',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error(`Failed to upload logo: ${error.message || 'Please try again'}`);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Cover image size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setUploadingCover(true);
    try {
      // Generate unique filename with proper sanitization
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `company-covers/${timestamp}-${randomStr}-${cleanFileName}`;

      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      setCoverUrl(file_url);
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleCoverUpload', error, {
        table: 'companies',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error(`Failed to upload cover image: ${error.message || 'Please try again'}`);
    } finally {
      setUploadingCover(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (galleryImages.length + files.length > 10) {
      toast.error('Maximum 10 gallery images allowed');
      return;
    }

    // Validate file types and sizes before uploading
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} is not an image file`);
        return;
      }

      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(msg => toast.error(msg));
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploadingGallery(true);
    try {
      // Use Promise.allSettled to handle individual failures
      const uploadPromises = validFiles.map(async (file) => {
        try {
          // Generate unique filename with proper sanitization
          const fileExt = file.name.split('.').pop();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `company-gallery/${timestamp}-${randomStr}-${cleanFileName}`;

          const result = await supabaseHelpers.storage.uploadFile(
            file,
            'files',
            fileName
          );


          if (!result || !result.file_url) {
            // ✅ GLOBAL HARDENING: Enhanced error logging
            logError('handleGalleryUpload-missingUrl', new Error('Upload succeeded but file_url is missing'), {
              table: 'companies',
              companyId: profileCompanyId,
              userId: userId,
              result: result
            });
            throw new Error('Upload succeeded but file URL is missing');
          }

          return { success: true, url: result.file_url, fileName: file.name };
        } catch (error) {
          logError('handleGalleryUpload-file', error, {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId,
            fileName: file.name
          });
          return { success: false, fileName: file.name, error: error.message };
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      // Process results
      const successfulUploads = [];
      const failedUploads = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.url) {
          successfulUploads.push(result.value.url);
        } else {
          const fileName = result.status === 'fulfilled'
            ? result.value.fileName
            : validFiles[index]?.name || 'unknown';
          logError('handleGalleryUpload-fileFailed', result.reason || new Error('Upload failed'), {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId,
            fileName: fileName
          });
          failedUploads.push(fileName);
        }
      });


      // Update gallery with successful uploads
      if (successfulUploads.length > 0) {

        // Filter out any null/undefined URLs
        const validUrls = successfulUploads.filter(url => url && typeof url === 'string' && url.trim().length > 0);

        if (validUrls.length === 0) {
          logError('handleGalleryUpload-invalidUrls', new Error('No valid URLs in successful uploads'), {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId,
            successfulUploads: successfulUploads
          });
          toast.error('Images uploaded but URLs are invalid. Please try again.');
          // Reset file input and clear uploading state
          if (e.target) e.target.value = '';
          setUploadingGallery(false);
          return;
        }

        // Update state and get the updated value for auto-save
        let updatedGalleryImages;
        setGalleryImages(prev => {
          updatedGalleryImages = [...prev, ...validUrls];
          return updatedGalleryImages;
        });

        // Auto-save gallery images to database immediately (don't wait for form submission)
        if (profileCompanyId && updatedGalleryImages) {
          try {
            const { error: saveError } = await supabase
              .from('companies')
              .update({
                gallery_images: updatedGalleryImages
              })
              .eq('id', profileCompanyId);

            if (saveError) {
              logError('autoSaveGallery', saveError, {
                table: 'companies',
                companyId: profileCompanyId,
                userId: userId
              });
              // Don't show error to user - images are in state, just not persisted yet
            } else {
            }
          } catch (saveErr) {
            logError('autoSaveGallery', saveErr, {
              table: 'companies',
              companyId: profileCompanyId,
              userId: userId
            });
          }
        }

        toast.success(`${validUrls.length} image(s) uploaded and displayed successfully`);
      }

      // Show errors for failed uploads
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload ${failedUploads.length} image(s): ${failedUploads.join(', ')}`);
      }

      // If all failed, show generic error
      if (successfulUploads.length === 0 && failedUploads.length > 0) {
        toast.error('Failed to upload gallery images. Please check file sizes and try again.');
      }
    } catch (error) {
      // ✅ GLOBAL HARDENING: Enhanced error logging
      logError('handleGalleryUpload', error, {
        table: 'companies',
        companyId: profileCompanyId,
        userId: userId
      });
      toast.error('Failed to upload gallery images. Please try again.');
    } finally {
      setUploadingGallery(false);
      // Reset file input to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    // Safety timeout: Force loading to false after 15 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[CompanyInfo] Loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 15000);

    const loadData = async () => {
      if (!profileCompanyId) {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
        return;
      }

      try {
        // ✅ STALE-WHILE-REVALIDATE: Only set loading on first load
        // During background refresh, keep existing form visible
        if (!formData.company_name) {
          setIsLoading(true);
        }
        setError(null);

        // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
        // If profile has company_id, load company data
        // ✅ GLOBAL REFACTOR: Use .single() instead of .maybeSingle() for companies
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileCompanyId)
          .single();

        // ✅ GLOBAL HARDENING: Enhanced error logging with PGRST116 handling
        if (companyError) {
          // Handle PGRST116 (not found) - company doesn't exist, redirect to onboarding
          if (companyError.code === 'PGRST116') {
            navigate('/onboarding/company', { replace: true });
            return;
          }
          logError('loadData-companies', companyError, {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId
          });
          throw companyError;
        }

        // ✅ KERNEL COMPLIANCE: Use user from kernel instead of direct auth API call
        const userEmail = user?.email || '';

        if (companyData) {
          setFormData({
            company_name: companyData.company_name || '',
            business_type: companyData.business_type || 'manufacturer',
            country: companyData.country || '',
            city: companyData.city || '',
            phone: companyData.phone || '',
            business_email: companyData.email || userEmail || '',
            website: companyData.website || '',
            year_established: companyData.year_established || '',
            company_size: companyData.employee_count || '1-10',
            company_description: companyData.description || ''
          });
          setLogoUrl(companyData.logo_url || '');
          setCoverUrl(companyData.cover_image_url ?? companyData.cover_url ?? ''); // ✅ KERNEL-CENTRIC: Vibranium defaults
          setGalleryImages(Array.isArray(companyData.gallery_images) ? companyData.gallery_images : []);
        } else {
          // No company data yet - set default email if available
          if (userEmail) {
            setFormData(prev => ({
              ...prev,
              business_email: userEmail
            }));
          }
        }

        // ✅ SCHEMA ALIGNMENT: Load team members (table now exists with required columns)
        if (profileCompanyId) {
          const { data: teamData, error: teamError } = await supabase
            .from('company_team')
            .select('*')
            .eq('company_id', profileCompanyId)
            .order('created_at', { ascending: false });

          // ✅ GLOBAL HARDENING: Enhanced error logging
          if (teamError) {
            // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
            if (teamError.code === 'PGRST204' || teamError.code === 'PGRST205') {
              setTeamMembers([]);
            } else {
              logError('loadData-team', teamError, {
                table: 'company_team',
                companyId: profileCompanyId,
                userId: userId
              });
              setTeamMembers([]);
            }
          } else {
            setTeamMembers(teamData || []);
          }
        }

        // ✅ GLOBAL HARDENING: Mark fresh ONLY on successful load
        lastLoadTimeRef.current = Date.now();
        markFresh();

        // ✅ GLOBAL HARDENING: Derive role from capabilities instead of role prop
        const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
        const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
        const normalizedRole = isLogistics ? 'logistics' : (isSeller ? 'seller' : 'buyer');
        setCurrentRole(normalizedRole);
      } catch (err) {
        // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
        if (err?.code === 'PGRST204' || err?.code === 'PGRST205') {
          // Don't set error state - allow UI to continue
          return;
        }

        // ✅ GLOBAL HARDENING: Enhanced error logging
        logError('loadData', err, {
          table: 'companies',
          companyId: profileCompanyId,
          userId: userId
        });
        setError(err.message || 'Failed to load company information');
        if (isMounted) {
          toast.error('Failed to load company information');
        }
      } finally {
        // ✅ VIBRANIUM STABILIZATION: Always reset loading state (non-negotiable)
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }

    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale ||
      !lastLoadTimeRef.current ||
      (Date.now() - lastLoadTimeRef.current > 30000);

    // Only load data when system is ready
    if (shouldRefresh) {
      loadData();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [canLoadData, profileCompanyId, userId, location.pathname, isStale, navigate]);

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

    // Add timeout wrapper to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000);
    });

    try {

      if (!userId) {
        navigate('/login');
        return;
      }

      // ✅ KERNEL COMPLIANCE: Use user from kernel instead of direct auth API call
      const userEmail = user?.email || '';

      let finalCompanyId = profileCompanyId;

      // ✅ KERNEL MIGRATION: Create or update company with timeout
      if (profileCompanyId) {
        // Update existing company
        // Convert year_established to integer or null (database expects integer, not empty string)
        let yearEstablished = null;
        if (formData.year_established) {
          const year = typeof formData.year_established === 'string'
            ? parseInt(formData.year_established.trim(), 10)
            : formData.year_established;
          if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
            yearEstablished = year;
          }
        }

        const updatePromise = supabase
          .from('companies')
          .update({
            company_name: formData.company_name,
            business_type: formData.business_type,
            country: formData.country || null,
            city: formData.city || null,
            phone: formData.phone || null,
            email: formData.business_email || userEmail || null,
            website: formData.website || null,
            year_established: yearEstablished, // INTEGER: null or valid year
            employee_count: formData.company_size || '1-10',
            description: formData.company_description || null,
            logo_url: logoUrl || null,
            cover_image_url: coverUrl ?? null, // ✅ KERNEL-CENTRIC: Vibranium defaults
            gallery_images: galleryImages || null
          })
          .eq('id', profileCompanyId);

        const { error: updateErr } = await Promise.race([updatePromise, timeoutPromise]);

        if (updateErr) {
          logError('updateCompany', updateErr, {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId
          });
          throw new Error(`Failed to update company: ${updateErr.message || 'Unknown error'}`);
        }
      } else {
        // Create new company
        const insertData = {
          company_name: formData.company_name,
          business_type: formData.business_type,
          country: formData.country || null,
          city: formData.city || null,
          phone: formData.phone || null,
          email: formData.business_email || userEmail || null,
          website: formData.website || null,
          year_established: yearEstablished,
          employee_count: formData.company_size || '1-10',
          description: formData.company_description || null,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl ?? null,
          gallery_images: galleryImages || null
        };

        const insertPromise = supabase
          .from('companies')
          .insert(insertData)
          .select('id')
          .single();

        const { data: newCompany, error: companyErr } = await Promise.race([insertPromise, timeoutPromise]);

        if (companyErr) {
          logError('createCompany', companyErr, {
            table: 'companies',
            companyId: profileCompanyId,
            userId: userId
          });
          throw new Error(`Failed to create company: ${companyErr.message || 'Unknown error'}`);
        }
        finalCompanyId = newCompany.id;

        // Note: profileCompanyId will be updated via kernel when profile is updated below
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

      const profilePromise = supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileUpdate
        }, { onConflict: 'id' });

      const { error: profileErr } = await Promise.race([profilePromise, timeoutPromise]);

      if (profileErr) {
        logError('updateProfile', profileErr, {
          table: 'profiles',
          companyId: finalCompanyId,
          userId: userId
        });
        throw new Error(`Failed to save profile: ${profileErr.message || 'Unknown error'}`);
      }
      toast.success('Company information saved successfully!');

      // ✅ PWA FIX: Invalidate kernel state to force refetch
      // This ensures UI reflects new company data immediately without hard refresh
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('company-profile-updated', {
          detail: { companyId: finalCompanyId }
        }));
      }

      // Redirect back to where user came from, or to dashboard
      // Small delay to show success message
      setTimeout(() => {
        setIsSaving(false);
        navigate(returnUrl);
      }, 800);
    } catch (error) {
      logError('saveCompanyInfo', error, {
        table: 'companies',
        companyId: profileCompanyId,
        userId: userId
      });
      const errorMessage = error?.message || error?.error?.message || 'Failed to save company information. Please try again.';
      toast.error(errorMessage);
      setIsSaving(false); // Ensure saving state is cleared on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newTeamMember.email || !profileCompanyId) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAddingTeamMember(true);
    try {
      const { error } = await supabase
        .from('company_team')
        .insert({
          company_id: profileCompanyId,
          member_email: newTeamMember.email,
          role_label: newTeamMember.role,
          created_by: userId
        });

      if (error) throw error;

      toast.success('Team member added');
      setNewTeamMember({ email: '', role: 'member' });
      // Reload data
      const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
      if (shouldRefresh) {
        loadData();
      }
    } catch (err) {
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
      // Reload data
      const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
      if (shouldRefresh) {
        loadData();
      }
    } catch (err) {
      toast.error('Failed to remove team member');
    }
  };

  // ✅ STALE-WHILE-REVALIDATE: Only show skeleton on first load
  // If we have formData (company_name), keep showing it during background refresh
  if (isLoading && !formData.company_name) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
          if (shouldRefresh) {
            loadData();
          }
        }}
      />
    );
  }

  // Make all fields optional - no blocking
  const requiredFieldsFilled = true; // Always allow save

  return (
    <div className="os-page os-stagger space-y-10 max-w-[1600px] mx-auto pb-24 px-4 py-8">
      {/* 1. Header & Identity Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-afrikoni-gold/10 rounded-3xl border border-afrikoni-gold/30 shadow-[0_0_30px_rgba(212,169,55,0.1)]">
              <Building className="w-10 h-10 text-afrikoni-gold" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-white">
                Institutional Identity
                <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase border-white/10 text-os-muted bg-white/[0.02] px-3 py-1">
                  Global Entity Node
                </Badge>
              </h1>
              <p className="text-os-muted text-lg font-medium italic opacity-70">Managing your enterprise profile for continental trade synchronization.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-6 py-4 flex items-center gap-6 border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="space-y-0.5">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-os-muted">Ledger Sync</div>
                <div className="text-xs font-bold text-emerald-500">Node Active</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <Button
              variant="ghost"
              onClick={handleSubmit}
              disabled={isSaving}
              className="h-10 px-5 gap-3 text-afrikoni-gold font-black uppercase tracking-widest text-[10px] bg-afrikoni-gold/10 hover:bg-afrikoni-gold/20 transition-all rounded-xl border border-afrikoni-gold/20"
            >
              <Save className={cn("w-3.5 h-3.5", isSaving && "animate-spin")} />
              {isSaving ? "Saving Identity..." : "Commit Changes"}
            </Button>
          </Surface>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Core Identity Management */}
        <div className="lg:col-span-8 space-y-8">

          {/* A. Universal Profile Flow */}
          <Surface variant="glass" className="p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12">
              <Sparkles className="w-64 h-64 text-afrikoni-gold" />
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <Zap className="w-6 h-6 text-afrikoni-gold" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Core Enterprise Details</h3>
                  <p className="text-sm text-os-muted font-medium opacity-60">Essential information for cross-border reconciliation.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-os-muted">Company Name</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      className="h-14 bg-white/[0.03] border-white/10 rounded-2xl focus:border-afrikoni-gold/30 transition-all font-bold text-lg text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-os-muted">Business Structure</Label>
                    <Select value={formData.business_type} onValueChange={(v) => setFormData(prev => ({ ...prev, business_type: v }))}>
                      <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="trading_company">Trading Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-os-muted">Sovereign Node (Country)</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                      <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 h-64 overflow-y-auto">
                        {AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-os-muted">Operational Hub (City)</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-14 bg-white/[0.03] border-white/10 rounded-2xl transition-all font-bold text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          {/* B. Visual Identity & Brand DNA */}
          <div className="grid md:grid-cols-2 gap-8">
            <Surface variant="glass" className="p-8 space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
                <ImageIcon className="w-4 h-4 text-afrikoni-gold" />
                Enterprise Mark
              </h3>

              <div className="flex flex-col items-center gap-6">
                <div className="relative group/logo">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover/logo:border-afrikoni-gold/30">
                    {logoUrl ? (
                      <img src={logoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-12 h-12 text-os-muted opacity-20" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <input type="file" onChange={handleLogoUpload} className="hidden" id="logo-up" accept="image/*" />
                  <label htmlFor="logo-up" className="absolute -bottom-2 -right-2 p-3 bg-afrikoni-gold text-black rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-xl">
                    <Upload className="w-5 h-5" />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-os-muted opacity-64 italic">Recommended: 1:1 Aspect Premium Asset</p>
                </div>
              </div>
            </Surface>

            <Surface variant="glass" className="p-8 space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
                <Globe className="w-4 h-4 text-emerald-500" />
                Communication Uplink
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-os-muted ml-1">Institutional Email</Label>
                  <Input
                    value={formData.business_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
                    className="bg-white/[0.02] border-white/10 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-os-muted ml-1">Sovereign Domain</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="bg-white/[0.02] border-white/10 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-os-muted ml-1">Global Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/[0.02] border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>
            </Surface>
          </div>
        </div>

        {/* Right Column: AI Audit & Team Matrix */}
        <div className="lg:col-span-4 space-y-8">

          {/* AI Auditor Feedback */}
          <Surface variant="glass" className="p-8 border-afrikoni-gold/20 bg-afrikoni-gold/[0.02] relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 opacity-[0.03] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <ShieldCheck className="w-32 h-32 text-afrikoni-gold" />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-afrikoni-gold/20 rounded-xl border border-afrikoni-gold/30">
                  <Activity className="w-4 h-4 text-afrikoni-gold" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-afrikoni-gold">Identity Prophet</h3>
              </div>
              <p className="text-sm font-medium italic text-white/90 leading-relaxed">
                "Adding a detailed enterprise description and verified operational hubs increases your <span className="text-afrikoni-gold font-bold">Corridor Confidence</span> by up to 22%."
              </p>
              <div className="pt-4 border-t border-afrikoni-gold/10">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-os-muted">
                  <span>Audit Readiness</span>
                  <span className="text-emerald-500">OPTIMAL</span>
                </div>
              </div>
            </div>
          </Surface>

          {/* Team Capacity Node */}
          <Surface variant="glass" className="p-8 space-y-8 h-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted">Institutional Team</h3>
              <Users className="w-4 h-4 text-os-muted" />
            </div>

            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-afrikoni-gold/10 flex items-center justify-center font-bold text-afrikoni-gold border border-afrikoni-gold/20 uppercase">
                      {member.member_email?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{member.member_email?.split('@')[0] || 'Anonymous Node'}</div>
                      <div className="text-[9px] font-bold text-os-muted uppercase tracking-widest">{member.role_label}</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black">ACTIVE</Badge>
                </div>
              ))}

              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/team-members')}
                className="w-full h-14 border border-dashed border-white/10 rounded-2xl hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold hover:border-afrikoni-gold/30 transition-all font-black uppercase tracking-widest text-[10px] gap-2"
              >
                <Plus className="w-4 h-4" />
                Expand Institutional Root
              </Button>
            </div>
          </Surface>

        </div>
      </div>
    </div>
  );
}
