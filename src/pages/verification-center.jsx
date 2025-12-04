import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Mail, Phone, Building2, CreditCard, Shield, Lock, FileText, Clock, Upload, X, Globe, Hash
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
        // Load verification status
        const { data: verificationData, error } = await supabase
          .from('verifications')
          .select('*')
          .eq('company_id', finalCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw error;
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
      }
    } catch (error) {
      console.error('Load verification data error:', error);
      toast.error('Failed to load verification status. Please refresh the page.');
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

      toast.success('Document uploaded successfully. Pending admin review.');
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
          <Card>
            <CardHeader>
              <CardTitle>Verification Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * idx }}
                    >
                      <div className={`
                        flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                        ${isCompleted 
                          ? 'border-afrikoni-gold/50 bg-afrikoni-gold/5' 
                          : isRejected
                          ? 'border-red-200 bg-red-50'
                          : 'border-afrikoni-gold/20 bg-afrikoni-offwhite hover:border-afrikoni-gold/40'
                        }
                      `}>
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isCompleted 
                            ? 'bg-afrikoni-gold/20' 
                            : 'bg-afrikoni-cream'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-afrikoni-gold" />
                          ) : (
                            <Icon className={`w-6 h-6 ${step.required ? 'text-afrikoni-gold' : 'text-afrikoni-deep/70'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-afrikoni-chestnut">{step.label}</h3>
                            {step.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="success" className="text-xs">✓ Verified</Badge>
                            )}
                            {isPending && (
                              <Badge variant="warning" className="text-xs">Pending</Badge>
                            )}
                            {isRejected && (
                              <Badge variant="destructive" className="text-xs">Rejected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-afrikoni-deep">{step.description}</p>
                          {hasFile && step.docType && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <FileText className="w-3 h-3 text-afrikoni-gold flex-shrink-0" />
                              <p className="text-xs text-afrikoni-deep/70">
                                Document uploaded: {typeof hasFile === 'string' ? (hasFile.split('/').pop() || hasFile.split('\\').pop() || 'Document') : 'Document'}
                              </p>
                              {typeof hasFile === 'string' && (
                                <a
                                  href={hasFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-afrikoni-gold hover:underline flex-shrink-0"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          {isCompleted ? (
                            <div className="flex items-center gap-1 text-afrikoni-gold text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              <span>Done</span>
                            </div>
                          ) : step.docType ? (
                            <div className="flex flex-col gap-2">
                              <label className="cursor-pointer">
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
                                  variant="primary" 
                                  size="sm"
                                  disabled={uploading[step.id]}
                                  as="span"
                                >
                                  {uploading[step.id] ? (
                                    <>Uploading...</>
                                  ) : hasFile ? (
                                    <>Replace</>
                                  ) : (
                                    <><Upload className="w-4 h-4 mr-1" />Upload</>
                                  )}
                                </Button>
                              </label>
                            </div>
                          ) : (
                            <Button variant="primary" size="sm">
                              {step.id === 'email' || step.id === 'phone' ? 'Verify' : 'Enable'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
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
