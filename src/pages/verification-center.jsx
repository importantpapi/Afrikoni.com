import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Mail, Phone, Building2, CreditCard, Shield, Lock, FileText, Clock, Upload, X, Globe, Hash, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { toast } from 'sonner';

const verificationSteps = [
  {
    id: 'email',
    label: 'Email Verification',
    icon: Mail,
    description: 'Verify your email address',
    docType: null,
    required: true
  },
  {
    id: 'phone',
    label: 'Phone Verification',
    icon: Phone,
    description: 'Verify your phone number',
    docType: null,
    required: true
  },
  {
    id: 'business_registration',
    label: 'Business Registration',
    icon: Building2,
    description: 'Upload business registration documents',
    docType: 'business_registration',
    required: true
  },
  {
    id: 'kyc',
    label: 'ID / KYC Verification',
    icon: CreditCard,
    description: 'Upload government-issued ID',
    docType: 'kyc',
    required: true
  },
  {
    id: 'bank',
    label: 'Bank Account Verification',
    icon: CreditCard,
    description: 'Verify your bank account details',
    docType: 'bank_statement',
    required: true
  },
  {
    id: 'trade',
    label: 'Trade Assurance',
    icon: Shield,
    description: 'Enable trade protection features',
    docType: null,
    required: false
  }
];

export default function VerificationCenter() {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [verification, setVerification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [businessIdNumber, setBusinessIdNumber] = useState('');
  const [countryOfRegistration, setCountryOfRegistration] = useState('');
  const [verificationResults, setVerificationResults] = useState({}); // Store AI verification results
  const [verifying, setVerifying] = useState({}); // Track which documents are being verified
  const navigate = useNavigate();
  
  const AFRICAN_COUNTRIES = [
    'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Ethiopia',
    'Tanzania', 'Uganda', 'Rwanda', 'Senegal', 'Algeria', 'Sudan', 'Mozambique',
    'Madagascar', 'Angola', 'Cameroon', 'Ivory Coast', 'Niger', 'Mali', 'Burkina Faso',
    'Malawi', 'Zambia', 'Zimbabwe', 'Somalia', 'Guinea', 'Benin', 'Burundi',
    'Tunisia', 'Togo', 'Sierra Leone', 'Libya', 'Liberia', 'Central African Republic',
    'Mauritania', 'Eritrea', 'Gambia', 'Botswana', 'Namibia', 'Gabon', 'Lesotho',
    'Guinea-Bissau', 'Equatorial Guinea', 'Mauritius', 'Eswatini', 'Djibouti',
    'Comoros', 'Cape Verde', 'Sao Tome and Principe', 'Seychelles'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user: userData, profile, companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(profile || userData);
      
      // Get or create company
      const finalCompanyId = cid || await getOrCreateCompany(supabase, profile || userData);
      
      if (!finalCompanyId) {
        toast.error('Unable to create company profile. Please complete onboarding first.');
        navigate('/onboarding');
        return;
      }
      
      setCompanyId(finalCompanyId);

      // Verify company ownership for RLS policies
      const { data: companyCheck, error: companyError } = await supabase
        .from('companies')
        .select('id, owner_email')
        .eq('id', finalCompanyId)
        .single();

      if (companyError) {
        console.error('Error checking company:', companyError);
      } else if (companyCheck && companyCheck.owner_email !== userData.email) {
        // Update owner_email to match current user (if allowed by RLS)
        const { error: updateError } = await supabase
          .from('companies')
          .update({ owner_email: userData.email })
          .eq('id', finalCompanyId);
        
        if (updateError) {
          console.warn('Could not update company owner_email (may be RLS restricted):', updateError);
          // Continue anyway - RLS might still allow verification if user is linked via profile
        }
      }

      if (finalCompanyId) {
        // Load verification status from verifications table
        const { data: verificationData, error: verificationError } = await supabase
          .from('verifications')
          .select('*')
          .eq('company_id', finalCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // PGRST116 = no rows returned, which is fine (user hasn't started verification yet)
        if (verificationError && verificationError.code !== 'PGRST116') {
          console.warn('Verification query error (non-critical):', verificationError);
          // Don't throw - allow page to load without verification data
        }

        if (verificationData) {
          setVerification(verificationData);
          // Parse documents if they exist
          if (verificationData.documents && typeof verificationData.documents === 'object') {
            setUploadedFiles(verificationData.documents);
          }
          // Load business info
          if (verificationData.business_id_number) {
            setBusinessIdNumber(verificationData.business_id_number);
          }
          if (verificationData.country_of_registration) {
            setCountryOfRegistration(verificationData.country_of_registration);
          }
        }

        // Also load verification status from companies table (fallback)
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('verification_status, business_license, tax_number, address_country, certificate_uploads')
          .eq('id', finalCompanyId)
          .maybeSingle();

        if (companyError && companyError.code !== 'PGRST116') {
          console.warn('Company verification status query error (non-critical):', companyError);
          // Don't throw - allow page to load
        }

        // If we have company data but no verification record, use company data
        if (companyData && !verificationData) {
          // Create a verification object from company data
          const companyVerification = {
            company_id: finalCompanyId,
            status: companyData.verification_status || 'unverified',
            business_id_number: companyData.business_license || null,
            country_of_registration: companyData.address_country || null,
            documents: companyData.certificate_uploads && companyData.certificate_uploads.length > 0 
              ? { certificates: companyData.certificate_uploads }
              : {}
          };
          setVerification(companyVerification);
          if (companyData.business_license) {
            setBusinessIdNumber(companyData.business_license);
          }
          if (companyData.address_country) {
            setCountryOfRegistration(companyData.address_country);
          }
          if (companyData.certificate_uploads && companyData.certificate_uploads.length > 0) {
            setUploadedFiles({ certificates: companyData.certificate_uploads });
          }
        }
      }
    } catch (error) {
      console.error('Load verification data error:', error);
      // Only show error for critical failures, not for missing verification data
      // Missing verification data is normal for new users who haven't started verification
      // RLS permission errors are also non-critical - user can still proceed
      const isNonCriticalError = 
        error.code === 'PGRST116' || 
        error.message?.includes('PGRST116') ||
        error.message?.includes('no rows') ||
        error.message?.includes('permission denied') ||
        error.code === '42501'; // Permission denied error code
      
      if (!isNonCriticalError) {
        // Only show error for unexpected critical failures
        console.warn('Non-critical verification load error (user can still proceed):', error);
        // Don't show toast - allow page to load normally even without verification data
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!companyId) {
      console.warn('No company ID available');
      return;
    }

    try {
      const verificationData = {
        company_id: companyId,
        business_id_number: businessIdNumber || null,
        country_of_registration: countryOfRegistration || null,
        documents: uploadedFiles || {},
        status: verification?.status || 'pending'
      };

      if (verification) {
        // Update existing
        const { error } = await supabase
          .from('verifications')
          .update(verificationData)
          .eq('id', verification.id);

        if (error) {
          console.error('Update verification error:', error);
          throw error;
        }
        toast.success('Business information saved');
      } else {
        // Create new
        const { data: newVerification, error } = await supabase
          .from('verifications')
          .insert(verificationData)
          .select()
          .single();

        if (error) {
          console.error('Insert verification error:', error);
          throw error;
        }
        setVerification(newVerification);
        toast.success('Business information saved');
      }
    } catch (error) {
      console.error('Failed to save business info:', error);
      toast.error('Failed to save business information. Please try again.');
    }
  };

  const handleFileUpload = async (stepId, file) => {
    if (!file || !companyId) {
      toast.error('Please ensure you have a company profile before uploading documents');
      return;
    }

    const step = verificationSteps.find(s => s.id === stepId);
    if (!step || !step.docType) {
      toast.error('Invalid verification step');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, or PNG file');
      return;
    }

    setUploading(prev => ({ ...prev, [stepId]: true }));

    try {
      // Upload to Supabase Storage using 'files' bucket with organized path
      const filePath = `verifications/${companyId}/${step.docType}_${Date.now()}_${file.name}`;
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', filePath);
      
      // Update uploaded files state
      const newFiles = {
        ...uploadedFiles,
        [step.docType]: file_url
      };
      setUploadedFiles(newFiles);

      // AI Verification - Check if document matches previous and requirements
      setVerifying(prev => ({ ...prev, [stepId]: true }));
      try {
        const { verifyDocument, compareDocuments } = await import('@/ai/documentVerification');
        
        // Get previous document if exists
        const previousDoc = verification?.documents?.[step.docType] 
          ? { url: verification.documents[step.docType], type: step.docType, uploaded_at: verification.created_at, status: verification.status }
          : null;

        // Get company info for context
        const { data: companyData } = await supabase
          .from('companies')
          .select('company_name, country, business_type')
          .eq('id', companyId)
          .single();

        // Verify document with AI
        const verificationResult = await verifyDocument({
          documentUrl: file_url,
          documentType: step.docType,
          previousDocument: previousDoc,
          companyInfo: companyData || {}
        });

        // Store verification result
        setVerificationResults(prev => ({
          ...prev,
          [step.docType]: verificationResult
        }));

        // If previous document exists, compare them
        if (previousDoc && previousDoc.url) {
          const comparisonResult = await compareDocuments({
            document1Url: previousDoc.url,
            document2Url: file_url,
            documentType: step.docType
          });

          // Update verification result with comparison
          setVerificationResults(prev => ({
            ...prev,
            [step.docType]: {
              ...verificationResult,
              comparison: comparisonResult
            }
          }));

          // Show comparison result
          if (comparisonResult.matches) {
            toast.success('✅ Document matches previous submission', {
              description: comparisonResult.summary
            });
          } else if (comparisonResult.isUpdatedVersion) {
            toast.info('📄 Document appears to be an updated version', {
              description: comparisonResult.summary
            });
          } else {
            toast.warning('⚠️ Document differs from previous submission', {
              description: comparisonResult.differences.join(', ')
            });
          }
        } else {
          // First time upload - just verify document
          if (verificationResult.verified) {
            toast.success('✅ Document verified successfully', {
              description: verificationResult.summary
            });
          } else {
            toast.warning('⚠️ Document uploaded but requires review', {
              description: verificationResult.issues.join(', ') || verificationResult.summary
            });
          }
        }

        // Show recommendations if any
        if (verificationResult.recommendations && verificationResult.recommendations.length > 0) {
          setTimeout(() => {
            toast.info('💡 Recommendations', {
              description: verificationResult.recommendations.join(' • ')
            });
          }, 1000);
        }
      } catch (aiError) {
        console.error('AI verification error:', aiError);
        // Don't block upload if AI verification fails
        toast.info('Document uploaded. AI verification unavailable - will be reviewed manually.');
      } finally {
        setVerifying(prev => ({ ...prev, [stepId]: false }));
      }

      // Create or update verification record
      const verificationData = {
        company_id: companyId,
        documents: newFiles,
        business_id_number: businessIdNumber || null,
        country_of_registration: countryOfRegistration || null,
        status: 'pending' // Admin will review
      };

      if (verification) {
        // Update existing
        const { error } = await supabase
          .from('verifications')
          .update(verificationData)
          .eq('id', verification.id);

        if (error) {
          console.error('Update verification error:', error);
          throw error;
        }
      } else {
        // Create new
        const { data: newVerification, error } = await supabase
          .from('verifications')
          .insert(verificationData)
          .select()
          .single();

        if (error) {
          console.error('Insert verification error:', error);
          throw error;
        }
        setVerification(newVerification);
      }

      // Final success message (if AI verification didn't already show one)
      if (!verificationResults[step.docType]) {
        toast.success('Document uploaded successfully. Pending admin review.');
      }

      // Send notification that verification is pending review (only once when first document is uploaded)
      if (Object.keys(newFiles).length === 1) {
        try {
          const { notifyVerificationStatusChange } = await import('@/services/notificationService');
          await notifyVerificationStatusChange(companyId, 'pending');
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error?.message || 'Failed to upload document. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(prev => ({ ...prev, [stepId]: false }));
    }
  };

  const getStepStatus = (step) => {
    if (!step.docType) {
      // Email/phone verification - check user profile
      if (step.id === 'email') {
        return user?.email_verified || false;
      }
      if (step.id === 'phone') {
        return user?.phone_verified || false;
      }
      if (step.id === 'trade') {
        return verification?.trade_assurance_enabled || false;
      }
      return false;
    }

    // Document-based verification
    const hasDocument = uploadedFiles[step.docType];
    if (!hasDocument) return false;

    // Check verification status
    if (verification?.status === 'verified') {
      return true;
    }
    if (verification?.status === 'rejected') {
      return 'rejected';
    }
    return 'pending';
  };

  const completedCount = verificationSteps.filter(s => {
    const status = getStepStatus(s);
    return status === true;
  }).length;

  const requiredCompleted = verificationSteps.filter(s => {
    if (!s.required) return false;
    const status = getStepStatus(s);
    return status === true;
  }).length;

  const requiredTotal = verificationSteps.filter(s => s.required).length;
  const profileCompleteness = Math.round((completedCount / verificationSteps.length) * 100);
  const verificationProgress = Math.round((requiredCompleted / requiredTotal) * 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 space-y-3"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">Verification Center</h1>
            <p className="text-lg text-afrikoni-deep">
              Complete your profile to unlock all Afrikoni features and build trust with serious buyers and suppliers.
            </p>
          </div>
          <Card className="border-afrikoni-gold/30 bg-white/80">
            <CardContent className="p-4 md:p-5">
              <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut uppercase tracking-wide mb-2">
                Why we verify on Afrikoni
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-xs md:text-sm text-afrikoni-deep">
                <div>
                  <p className="font-semibold text-afrikoni-chestnut mb-1">1. Protect your business</p>
                  <p>We check that each company and contact person is real to reduce fraud and fake profiles.</p>
                </div>
                <div>
                  <p className="font-semibold text-afrikoni-chestnut mb-1">2. Unlock bigger opportunities</p>
                  <p>
                    Verified suppliers get higher visibility, larger order limits and access to premium buyers across
                    Africa and the world.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-afrikoni-chestnut mb-1">3. Simple, one‑time process</p>
                  <p>
                    Upload your key documents once (ID, business registration, bank proof). Afrikoni Shield™ keeps them
                    encrypted and reviews them for you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-afrikoni-gold" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-afrikoni-chestnut">{profileCompleteness}%</span>
                  <span className="text-xs text-afrikoni-deep/70">{completedCount} of {verificationSteps.length} completed</span>
                </div>
                <Progress value={profileCompleteness} className="h-3" />
              </div>
              <p className="text-sm text-afrikoni-deep">
                Complete all steps to maximize your account benefits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-afrikoni-gold" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-afrikoni-chestnut">{verificationProgress}%</span>
                  <span className="text-xs text-afrikoni-deep/70">{requiredCompleted} of {requiredTotal} required</span>
                </div>
                <Progress value={verificationProgress} className="h-3" />
              </div>
              {verification?.status === 'verified' ? (
                <Badge variant="success" className="text-xs">✓ Fully Verified</Badge>
              ) : verification?.status === 'rejected' ? (
                <Badge variant="destructive" className="text-xs">Rejected - Please resubmit</Badge>
              ) : verification?.status === 'pending' ? (
                <Badge variant="warning" className="text-xs">Pending Review</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Not Started</Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Information Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <Card className="border-afrikoni-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-afrikoni-gold" />
                Business Information
              </CardTitle>
              <p className="text-sm text-afrikoni-deep/70 mt-2">
                Provide your business registration details to complete verification
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_id" className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-afrikoni-gold" />
                  Business ID / Registration Number
                </Label>
                <Input
                  id="business_id"
                  type="text"
                  placeholder="Enter your business registration number"
                  value={businessIdNumber}
                  onChange={(e) => setBusinessIdNumber(e.target.value)}
                  onBlur={handleSaveBusinessInfo}
                  className="border-afrikoni-gold/30"
                />
                <p className="text-xs text-afrikoni-deep/70 mt-1">
                  This is the official registration number from your business certificate
                </p>
              </div>
              
              <div>
                <Label htmlFor="country_registration" className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-afrikoni-gold" />
                  Country of Registration
                </Label>
                <Select
                  value={countryOfRegistration}
                  onValueChange={(value) => {
                    setCountryOfRegistration(value);
                    handleSaveBusinessInfo();
                  }}
                >
                  <SelectTrigger id="country_registration" className="border-afrikoni-gold/30">
                    <SelectValue placeholder="Select country where your business is registered" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-afrikoni-deep/70 mt-1">
                  The country where your business is legally registered
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Public explanation of verification levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-afrikoni-gold/20 bg-white/80">
            <CardContent className="p-4 md:p-5 space-y-2">
              <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut uppercase tracking-wide">
                How Afrikoni shows verification
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm text-afrikoni-deep/80 space-y-1.5">
                <li>
                  <span className="font-semibold">Not verified</span> – the company has not yet completed the basic KYC and
                  business registration checks. No badge is shown on the profile.
                </li>
                <li>
                  <span className="font-semibold">Verified supplier</span> – core documents (ID, business registration, bank
                  proof) have been reviewed by Afrikoni and the account passed manual checks. A verified badge is
                  shown to buyers.
                </li>
                <li>
                  <span className="font-semibold">Additional checks</span> – in some cases Afrikoni or partners may perform
                  extra checks (site visits, trade references, compliance checks). These are reflected in your trust
                  score and future &quot;Gold&quot; or advanced verification tiers as the program expands.
                </li>
              </ul>
              <p className="text-xs md:text-sm text-afrikoni-deep/70">
                All documents are stored securely and used only for verification, compliance and fraud-prevention
                purposes in line with Afrikoni&apos;s privacy policy.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-afrikoni-gold/20">
            <CardHeader className="border-b border-afrikoni-gold/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-afrikoni-chestnut">Verification Checklist</CardTitle>
                <Badge className="bg-afrikoni-gold/20 text-afrikoni-chestnut border-afrikoni-gold/30">
                  {requiredCompleted} of {requiredTotal} Required Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {verificationSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const status = getStepStatus(step);
                  const isCompleted = status === true;
                  const isPending = status === 'pending';
                  const isRejected = status === 'rejected';
                  const hasFile = uploadedFiles[step.docType];

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 * idx }}
                    >
                      <div className={`
                        relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer
                        ${isCompleted 
                          ? 'border-green-300 bg-green-50/50 shadow-sm' 
                          : isRejected
                          ? 'border-red-300 bg-red-50/50'
                          : isPending
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-afrikoni-gold/20 bg-white hover:border-afrikoni-gold/40 hover:shadow-md'
                        }
                      `}>
                        {/* Status Indicator */}
                        <div className={`
                          relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                          ${isCompleted 
                            ? 'bg-green-100 ring-2 ring-green-300' 
                            : isRejected
                            ? 'bg-red-100 ring-2 ring-red-300'
                            : isPending
                            ? 'bg-amber-100 ring-2 ring-amber-300'
                            : 'bg-afrikoni-gold/10 ring-2 ring-afrikoni-gold/20'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-7 h-7 text-green-600" />
                          ) : isRejected ? (
                            <XCircle className="w-7 h-7 text-red-600" />
                          ) : isPending ? (
                            <Clock className="w-7 h-7 text-amber-600" />
                          ) : (
                            <Icon className={`w-7 h-7 ${step.required ? 'text-afrikoni-gold' : 'text-afrikoni-deep/50'}`} />
                          )}
                          {/* Step Number Badge */}
                          {!isCompleted && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-afrikoni-chestnut text-white text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-afrikoni-chestnut">{step.label}</h3>
                                {step.required && (
                                  <Badge variant="outline" className="text-xs bg-afrikoni-gold/10 text-afrikoni-chestnut border-afrikoni-gold/30">
                                    Required
                                  </Badge>
                                )}
                                {!step.required && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    Optional
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-afrikoni-deep/70 mb-2">{step.description}</p>
                              
                              {/* Status Messages */}
                              {isCompleted && (
                                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Verified and complete</span>
                                </div>
                              )}
                              {isRejected && (
                                <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                                  <XCircle className="w-4 h-4" />
                                  <span>Rejected - Please resubmit</span>
                                </div>
                              )}
                              {isPending && (
                                <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                                  <Clock className="w-4 h-4" />
                                  <span>Under review</span>
                                </div>
                              )}
                              {hasFile && !isCompleted && !isPending && !isRejected && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                                    <FileText className="w-4 h-4" />
                                    <span>Document uploaded - pending review</span>
                                  </div>
                                  {/* AI Verification Results */}
                                  {verificationResults[step.docType] && (
                                    <div className={`mt-2 p-3 rounded-lg border text-sm ${
                                      verificationResults[step.docType].verified
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                    }`}>
                                      <div className="flex items-start gap-2">
                                        {verificationResults[step.docType].verified ? (
                                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                          <div className="font-semibold mb-1">
                                            AI Verification: {verificationResults[step.docType].verified ? 'Verified' : 'Needs Review'}
                                          </div>
                                          <p className="text-xs opacity-90 mb-1">
                                            {verificationResults[step.docType].summary}
                                          </p>
                                          {verificationResults[step.docType].matchesPrevious && (
                                            <div className="text-xs opacity-80 mt-1">
                                              ✓ Matches previous submission
                                            </div>
                                          )}
                                          {verificationResults[step.docType].comparison && (
                                            <div className="text-xs opacity-80 mt-1">
                                              {verificationResults[step.docType].comparison.isSameDocument 
                                                ? '✓ Same document detected'
                                                : verificationResults[step.docType].comparison.isUpdatedVersion
                                                ? '📄 Updated version detected'
                                                : '⚠️ Different from previous'}
                                            </div>
                                          )}
                                          {verificationResults[step.docType].issues && verificationResults[step.docType].issues.length > 0 && (
                                            <div className="mt-2 text-xs">
                                              <div className="font-semibold mb-1">Issues:</div>
                                              <ul className="list-disc list-inside space-y-0.5">
                                                {verificationResults[step.docType].issues.map((issue, idx) => (
                                                  <li key={idx}>{issue}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {verifying[step.id] && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                      <span>AI is verifying document...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-3">
                            {!isCompleted && step.docType && (
                              <label className="cursor-pointer inline-block">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(step.id, file);
                                  }}
                                  disabled={uploading[step.id]}
                                />
                                <Button
                                  variant={isRejected ? "destructive" : "default"}
                                  size="sm"
                                  disabled={uploading[step.id]}
                                  className={`
                                    ${isRejected 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                      : 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal'
                                    }
                                  `}
                                  as="span"
                                >
                                  {uploading[step.id] ? (
                                    <>Uploading...</>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      {hasFile ? 'Re-upload Document' : 'Upload Document'}
                                    </>
                                  )}
                                </Button>
                              </label>
                            )}
                            {!isCompleted && !step.docType && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                                onClick={() => {
                                  if (step.id === 'email') {
                                    toast.info('Email verification will be sent to your registered email address.');
                                  } else if (step.id === 'phone') {
                                    toast.info('Phone verification will be sent via SMS.');
                                  } else if (step.id === 'trade') {
                                    toast.info('Trade Assurance can be enabled after completing required verifications.');
                                  }
                                }}
                              >
                                {step.id === 'email' && 'Verify Email'}
                                {step.id === 'phone' && 'Verify Phone'}
                                {step.id === 'trade' && 'Enable Trade Assurance'}
                              </Button>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Completion Message */}
              {requiredCompleted === requiredTotal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-800 mb-1">All Required Steps Complete!</h4>
                      <p className="text-sm text-green-700">
                        Your verification is being reviewed by our team. You'll receive a notification once the review is complete.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-gold/5 border-afrikoni-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-afrikoni-gold" />
                Benefits of Full Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Access to premium features',
                  'Higher trust score with partners',
                  'Priority customer support',
                  'Trade protection enabled',
                  'Verified badge on profile',
                  'Increased order limits'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                    <span className="text-sm text-afrikoni-deep">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
