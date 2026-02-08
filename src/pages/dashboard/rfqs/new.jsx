import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useSearchParams } from 'react-router-dom';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Calendar } from '@/components/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover';
import { CalendarIcon, Upload, ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { validateNumeric, sanitizeString } from '@/utils/security';
import { createRFQ } from '@/services/rfqService';
import SeriousModeGate from '@/components/serious-mode/SeriousModeGate';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

const UNITS = ['pieces', 'kg', 'grams', 'tons', 'containers', 'pallets', 'boxes', 'bags', 'units', 'liters', 'meters'];

export default function CreateRFQ() {
  // ✅ KERNEL COMPLIANCE: Use useDashboardKernel as single source of truth
  const { user, profile, userId, capabilities, isSystemReady, canLoadData } = useDashboardKernel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null); // ✅ FIX: Add missing error state
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  // ✅ FIX: Derive role from capabilities (no undefined role variable)
  const derivedRole = capabilities.can_buy ? 'buyer' : 'seller';
  const [currentRole, setCurrentRole] = useState(derivedRole);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    quantity: '',
    unit: 'pieces',
    target_price: '',
    currency: 'USD',
    delivery_location: '',
    target_country: '',
    target_city: '',
    closing_date: null,
    attachments: []
  });

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading RFQ form..." ready={isSystemReady} />
      </div>
    );
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }

    // Now safe to load data
    loadData();
  }, [canLoadData, user, profile, capabilities, navigate]);

  // Phase 4: Pre-fill form from URL params (AI QuickRFQBar)
  useEffect(() => {
    const aiParam = searchParams.get('ai');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const quantity = searchParams.get('quantity');
    const unit = searchParams.get('unit');
    const deliveryLocation = searchParams.get('delivery_location');

    if (title || description || quantity) {
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        description: description || prev.description,
        quantity: quantity || prev.quantity,
        unit: unit || prev.unit,
        delivery_location: deliveryLocation || prev.delivery_location,
      }));

      if (aiParam) {
        // Show optional fields if AI pre-filled delivery info
        if (deliveryLocation) setShowOptionalFields(true);
      }
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      setError(null);
      // ✅ KERNEL MIGRATION: Use capabilities-based role
      const normalizedRole = capabilities?.can_buy ? 'buyer' : 'seller';
      setCurrentRole(normalizedRole === 'logistics_partner' ? 'logistics' : normalizedRole);

      // ✅ FORENSIC FIX: Load categories - NO LIMIT, fetch ALL marketplace categories
      // ✅ DEBUG: Check table name - should be 'categories' not 'product_categories'
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        // ✅ NO .limit() - fetches complete list

      // ✅ DEBUG: Log categories data to verify fetch and state setting
      console.log('[CreateRFQ] Categories data:', categoriesData);
      console.log('[CreateRFQ] Categories count:', categoriesData?.length || 0);
      console.log('[CreateRFQ] Categories error:', categoriesError);

      if (categoriesError) {
        // ✅ DATABASE SYNC GUARD: Check for missing column/table errors
        const isMissingColumn = categoriesError.code === '42703' || 
                               categoriesError.message?.includes('column') && categoriesError.message?.includes('does not exist');
        const isMissingTable = categoriesError.code === 'PGRST116' || 
                              categoriesError.message?.includes('does not exist') ||
                              categoriesError.message?.includes('relation');
        
        if (isMissingTable || isMissingColumn) {
          console.error('🔴 [CreateRFQ] Database sync error - missing table/column:', {
            code: categoriesError.code,
            message: categoriesError.message,
            hint: 'Run migrations: supabase migration up'
          });
          console.error('📋 Migration instructions:', {
            step1: 'Check if categories table exists: SELECT * FROM information_schema.tables WHERE table_name = \'categories\';',
            step2: 'If missing, run: supabase migration up',
            step3: 'Or apply migration manually in Supabase Dashboard SQL Editor'
          });
          toast.error('Database sync required. Please contact support or run migrations.');
        } else {
          console.error('[CreateRFQ] Category fetch error:', {
            code: categoriesError.code,
            message: categoriesError.message,
            details: categoriesError.details,
            hint: categoriesError.hint
          });
          toast.error(`Failed to load categories: ${categoriesError.message || 'Unknown error'}`);
        }
        setCategories([]);
        console.log('[CreateRFQ] Set categories to empty array due to error');
        setIsLoading(false); // ✅ Ensure loading stops even on error
        return;
      } else {
        // ✅ CRITICAL: Set categories even if empty array (prevents infinite loading)
        const categoriesToSet = categoriesData || [];
        console.log('[CreateRFQ] Setting categories state:', categoriesToSet.length, 'categories');
        setCategories(categoriesToSet);
        // ✅ Loading will be stopped in finally block
      }

      // ✅ FORENSIC FIX: Load countries from database (fallback to static list if table doesn't exist)
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (countriesError) {
        const isTableMissing = countriesError.code === 'PGRST116' || 
                              countriesError.message?.includes('does not exist') ||
                              countriesError.message?.includes('relation');
        const isMissingColumn = countriesError.code === '42703' || 
                               countriesError.message?.includes('column') && countriesError.message?.includes('does not exist');
        
        if (isTableMissing || isMissingColumn) {
          console.warn('[CreateRFQ] Countries table/column not found, using static list');
          console.warn('📋 To enable database countries:', {
            migration: 'Run: supabase migration up',
            file: 'Check: supabase/migrations/20260120_create_countries_and_cities.sql'
          });
          // Use static AFRICAN_COUNTRIES list as fallback
          setCountries(AFRICAN_COUNTRIES.map(name => ({ id: name, name })));
        } else {
          console.error('[CreateRFQ] Countries fetch error:', {
            code: countriesError.code,
            message: countriesError.message,
            details: countriesError.details
          });
          // Fallback to static list
          setCountries(AFRICAN_COUNTRIES.map(name => ({ id: name, name })));
        }
      } else {
        // ✅ CRITICAL: Set countries even if empty array (prevents infinite loading)
        setCountries(countriesData || AFRICAN_COUNTRIES.map(name => ({ id: name, name })));
      }
    } catch (error) {
      console.error('[CreateRFQ] Unexpected error loading form data:', error);
      toast.error('Failed to load form data');
      setCategories([]);
      setCountries(AFRICAN_COUNTRIES.map(name => ({ id: name, name })));
    } finally {
      // ✅ CRITICAL: Always stop loading, even if data is empty or error occurred
      setIsLoading(false);
    }
  };

  // ✅ FORENSIC FIX: Load cities when country is selected (dependent dropdown logic)
  useEffect(() => {
    const loadCities = async () => {
      // ✅ CRITICAL: City input enabled when country is chosen (not disabled on empty)
      if (!formData.target_country) {
        setCities([]);
        setFormData(prev => ({ ...prev, target_city: '' })); // Reset city input when country cleared
        setIsLoadingCities(false); // ✅ Ensure loading stops
        return;
      }

      // ✅ CRITICAL: Don't fetch if countries list is not loaded yet
      if (!countries || countries.length === 0) {
        setCities([]);
        setIsLoadingCities(false);
        return;
      }

      setIsLoadingCities(true);
      try {
        // Find country ID from countries list
        const selectedCountry = countries.find(c => c.name === formData.target_country || c.id === formData.target_country);
        if (!selectedCountry || !selectedCountry.id) {
          console.warn('[CreateRFQ] Selected country not found in countries list:', formData.target_country);
          setCities([]);
          // Note: Loading will be stopped in finally block
          return;
        }

        const countryId = selectedCountry.id;

        // ✅ FORENSIC FIX: Fetch cities filtered by country_id
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('id, name, state_code')
          .eq('country_id', countryId)
          .order('name');
          // ✅ NO LIMIT - fetch all cities for selected country

        if (citiesError) {
          const isTableMissing = citiesError.code === 'PGRST116' || 
                                citiesError.message?.includes('does not exist') ||
                                citiesError.message?.includes('relation');
          const isMissingColumn = citiesError.code === '42703' || 
                                 citiesError.message?.includes('column') && citiesError.message?.includes('does not exist');
          
          if (isTableMissing || isMissingColumn) {
            console.warn('[CreateRFQ] Cities table/column not found - allowing manual entry');
            console.warn('📋 To enable cities feature:', {
              migration: 'Run: supabase migration up',
              file: 'Check: supabase/migrations/20260120_create_countries_and_cities.sql',
              step: 'Then populate cities table with data'
            });
            setCities([]); // ✅ Empty array - user can still type manually
          } else {
            console.error('[CreateRFQ] Cities fetch error:', {
              code: citiesError.code,
              message: citiesError.message,
              details: citiesError.details
            });
            setCities([]); // ✅ Empty array - user can still type manually
          }
        } else {
          // ✅ CRITICAL: Set cities even if empty array (allows manual typing)
          setCities(citiesData || []);
        }
      } catch (error) {
        // ✅ FIX: Wrap entire logic in try/catch - catch any unexpected errors
        console.error('[CreateRFQ] Unexpected error loading cities:', error);
        setCities([]); // ✅ Empty array - user can still type manually
      } finally {
        // ✅ CRITICAL FIX: In finally block, MUST call setIsLoadingCities(false)
        // This is the "Safety Valve" - ensures loading stops no matter what happens
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, [formData.target_country, countries]);

  // ✅ DEBUG: Log categories state changes to verify useEffect is setting state
  useEffect(() => {
    console.log('[CreateRFQ] Categories state updated:', categories.length, 'categories');
    if (categories.length > 0) {
      console.log('[CreateRFQ] First few categories:', categories.slice(0, 3).map(c => c.name));
    }
  }, [categories]);

  // ✅ Filter cities based on input for suggestions
  const filteredCitySuggestions = cities.filter(city =>
    city.name.toLowerCase().includes((formData.target_city || '').toLowerCase())
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      // Generate unique filename with proper sanitization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `rfq-attachments/${timestamp}-${randomStr}-${cleanFileName}`;

      // ✅ FIX: Use 'rfqs' bucket for RFQ attachments
      const bucketName = 'rfqs';
      console.log('[CreateRFQ] Uploading to bucket:', bucketName);

      // ✅ FIX: Ensure supabaseHelpers is correctly handled - if upload fails, ensure it does not crash handleSubmit
      let file_url;
      try {
        if (supabaseHelpers && supabaseHelpers.storage && supabaseHelpers.storage.uploadFile) {
          const result = await supabaseHelpers.storage.uploadFile(file, bucketName, fileName);
          file_url = result.file_url;
        } else {
          // Fallback to standard supabase storage API
          const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);
          file_url = urlData.publicUrl;
        }

        setFormData(prev => ({ ...prev, attachments: [...prev.attachments, file_url] }));
        toast.success('File uploaded successfully');
      } catch (uploadErr) {
        // ✅ FIX: File upload errors are caught here and don't crash handleSubmit
        throw uploadErr; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      // ✅ FIX: Log specific Supabase storage error to check for 'Bucket not found' error
      console.error('[CreateRFQ] File upload error:', {
        message: error.message,
        error: error,
        bucket: 'rfqs',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        stack: error.stack
      });
      
      // ✅ FIX: Check for bucket not found error
      const isBucketNotFound = error.message?.includes('Bucket not found') ||
                              error.message?.includes('bucket') && error.message?.includes('not found') ||
                              error.message?.includes('does not exist') ||
                              error.message?.includes('not_found') ||
                              error.code === '404';
      
      if (isBucketNotFound) {
        console.error('🔴 [CreateRFQ] Bucket "rfqs" not found. Storage error:', error);
        console.error('📋 [CreateRFQ] To fix: Create "rfqs" bucket in Supabase Storage or use existing bucket name');
        toast.error('Storage bucket "rfqs" not found. Please contact support or check bucket configuration.');
      } else {
        toast.error(`Failed to upload file: ${error.message || 'Please try again'}`);
      }
      // ✅ CRITICAL: File upload failure does NOT prevent form submission
      // User can still submit RFQ without attachments
    } finally {
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ KERNEL ALIGNMENT: Frontend only validates UI concerns (required fields)
    // Business logic validation happens in rfqService
    if (!formData.title || !formData.description || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // ✅ STATE MANAGEMENT FIX: Set loading state before async operation
    setIsLoading(true);
    setIsLoadingCities(false); // Ensure city loading is also reset
    
    try {
      setError(null);
      
      // ✅ KERNEL COMPLIANCE: Use userId from kernel instead of direct auth API call
      if (!userId || !user) {
        toast.error('User not found. Please log in again.');
        navigate('/login');
        return;
      }
      
      const userObj = user;
      
      // ✅ KERNEL ALIGNMENT: Delegate all business logic to rfqService
      // Frontend only sends user-inputted fields - Kernel handles the rest
      const result = await createRFQ({
        user: userObj,
        formData: {
          // ✅ KERNEL ALIGNMENT: Only user-inputted fields (no status, buyer_company_id, unit_type)
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          quantity: formData.quantity,
          unit: formData.unit,
          target_price: formData.target_price,
          delivery_location: formData.delivery_location,
          target_country: formData.target_country,
          target_city: formData.target_city,
          closing_date: formData.closing_date,
          attachments: formData.attachments
        }
      });

      if (!result.success) {
        // ✅ KERNEL MIGRATION: Enhanced error handling
        const errorMsg = result.error || 'Failed to create RFQ. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        // ✅ FORENSIC FIX: Reset state before early return to prevent spinner zombie
        setIsLoading(false);
        setIsLoadingCities(false);
        return;
      }

      // ✅ LAZY PROFILE: Show success message even with minimal profile
      toast.success('RFQ created successfully!');
      
      // ✅ FORENSIC FIX: Reset state BEFORE navigation to prevent state zombies
      setIsLoading(false);
      setIsLoadingCities(false);
      
      // ✅ LAZY PROFILE: Show reminder toast if profile was auto-created
      if (result.isMinimalProfile) {
        // Delay the reminder toast slightly so success message is visible first
        setTimeout(() => {
          toast.info('Complete your company profile to unlock more features', {
            description: 'Add your company details to improve supplier matching and trust scores.',
            duration: 5000
          });
        }, 1500);
      }
      
      // ✅ FORENSIC FIX: Small delay to ensure state updates before navigation
      // This prevents component unmounting before state cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ ROUTER FIX: Ensure redirect points to stable /dashboard/rfqs path (not legacy /rfq/create)
      navigate(`/dashboard/rfqs/${result.data.id}`);
    } catch (error) {
      // ✅ CRITICAL FIX: Catch all errors, show toast, and log for debugging
      // This is the "Safety Valve" - ensures button becomes clickable again even if code crashes
      console.error('[CreateRFQ] Error creating RFQ:', error);
      toast.error(`Failed to create RFQ: ${error.message || 'Please try again'}`);
    } finally {
      // ✅ STATE MANAGEMENT FIX: Wrap submit logic in try/catch/finally block
      // In finally block, ALWAYS set setIsLoading(false) and setIsLoadingCities(false)
      // This ensures the UI never stays stuck in a loading state if a database error occurs
      // The finally block ALWAYS executes, even if we return early or throw an error
      setIsLoading(false);
      setIsLoadingCities(false);
    }
  };

  const handleGenerateRFQ = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Start with one or two simple sentences about what you need.');
      return;
    }
    setIsGenerating(true);
    try {
      const brief = {
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        delivery_location: formData.delivery_location,
        target_country: formData.target_country,
      };
      const result = await AIDescriptionService.generateRFQFromBrief(brief);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        quantity: result.quantity || prev.quantity,
        unit: result.unit || prev.unit,
        delivery_location: result.delivery_location || prev.delivery_location,
        target_country: result.target_country || prev.target_country,
      }));
      toast.success('Afrikoni AI structured your RFQ. Please review before publishing.');
    } catch (error) {
      toast.error('Afrikoni AI could not generate the RFQ. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          loadData();
        }}
      />
    );
  }

  return (
    <SeriousModeGate
      requiredAction="rfq"
      userId={userId}
      companyId={profile?.company_id}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/rfqs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Create Request for Quote</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              Describe what you need and get competitive quotes from trusted African suppliers.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* REQUIRED FIELDS - Always visible */}
              <div>
                <Label htmlFor="title">What are you looking for? *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1000 units of printed packaging boxes"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Detailed Requirements *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleGenerateRFQ}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-xs border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGenerating ? 'Generating...' : 'Afrikoni AI help'}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your need in your own words. Afrikoni AI will help you turn it into a clear RFQ."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger>
                      {categories.find(c => c.id === formData.category_id)?.name || "Select Category"}
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* OPTIONAL FIELDS - Expandable section */}
              <div className="border border-afrikoni-gold/20 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="w-full flex items-center justify-between p-4 hover:bg-afrikoni-cream/50 transition-colors text-sm"
                >
                  <span className="font-medium text-afrikoni-chestnut">
                    Additional details (pricing, delivery, attachments)
                  </span>
                  {showOptionalFields ? (
                    <ChevronUp className="w-4 h-4 text-afrikoni-deep" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-afrikoni-deep" />
                  )}
                </button>

                {showOptionalFields && (
                  <div className="p-4 pt-0 border-t border-afrikoni-gold/10 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_price">Target Price per Unit</Label>
                        <Input
                          id="target_price"
                          type="number"
                          step="0.01"
                          value={formData.target_price}
                          onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="NGN">NGN</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="target_country">Delivery Country</Label>
                        <Select
                          value={formData.target_country}
                          onValueChange={(v) => {
                            setFormData({ ...formData, target_country: v, target_city: '' });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.length > 0 ? (
                              countries.map(country => (
                                <SelectItem key={country.id || country.name} value={country.name}>
                                  {country.name}
                                </SelectItem>
                              ))
                            ) : (
                              AFRICAN_COUNTRIES.map(country => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative">
                        <Label htmlFor="target_city">City</Label>
                        {formData.target_country ? (
                          <div className="relative">
                            <Input
                              id="target_city"
                              value={formData.target_city}
                              onChange={(e) => {
                                setFormData({ ...formData, target_city: e.target.value });
                                setShowCitySuggestions(true);
                              }}
                              onFocus={() => setShowCitySuggestions(true)}
                              onBlur={() => {
                                setTimeout(() => setShowCitySuggestions(false), 200);
                              }}
                              placeholder={isLoadingCities ? "Loading cities..." : "Type city name"}
                              disabled={isLoadingCities}
                              className="w-full"
                            />
                            {showCitySuggestions && formData.target_city && filteredCitySuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-afrikoni-gold/30 rounded-md shadow-lg max-h-60 overflow-auto">
                                {filteredCitySuggestions.map((city) => (
                                  <div
                                    key={city.id}
                                    className="px-4 py-2 hover:bg-afrikoni-gold/10 cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setFormData({ ...formData, target_city: city.name });
                                      setShowCitySuggestions(false);
                                    }}
                                  >
                                    {city.name}{city.state_code ? `, ${city.state_code}` : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Input
                            id="target_city"
                            placeholder="Select country first"
                            disabled
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="delivery_location">Delivery Address</Label>
                        <Input
                          id="delivery_location"
                          value={formData.delivery_location}
                          onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                          placeholder="Street address, landmark, etc."
                        />
                      </div>

                      <div>
                        <Label>Closing Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.closing_date && typeof formData.closing_date !== 'string'
                                ? format(formData.closing_date, 'PPP')
                                : formData.closing_date || 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.closing_date}
                              onSelect={(date) => setFormData({ ...formData, closing_date: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label>Attachments</Label>
                      <div className="border-2 border-dashed border-afrikoni-gold/30 rounded-lg p-4 text-center hover:border-afrikoni-gold transition">
                        <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-afrikoni-deep/70 mx-auto mb-1" />
                          <div className="text-sm text-afrikoni-deep">Upload specs, drawings, or reference files</div>
                        </label>
                      </div>
                      {formData.attachments.length > 0 && (
                        <div className="mt-2 text-sm text-afrikoni-deep">{formData.attachments.length} file(s) uploaded</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/rfqs')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Publish RFQ'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SeriousModeGate>
  );
}

