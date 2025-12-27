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
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { isEmailVerified } from '@/utils/authHelpers';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { isSeller, isHybrid } from '@/utils/roleHelpers';
import { toast } from 'sonner';
import { logVerificationEvent } from '@/utils/auditLogger';
import SEO from '@/components/SEO';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageCTA } from '@/components/system/SystemPageLayout';

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
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState(null);
  const [verification, setVerification] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [uploading, setUploading] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [businessIdNumber, setBusinessIdNumber] = useState('');
  const [countryOfRegistration, setCountryOfRegistration] = useState('');
  const [verificationResults, setVerificationResults] = useState({});
  const [verifying, setVerifying] = useState({});
  const [submittingStep, setSubmittingStep] = useState(null);
  const [stepSubmissions, setStepSubmissions] = useState({}); // Track which steps have been submitted
  const [expandedSteps, setExpandedSteps] = useState(new Set()); // Track which steps are expanded (progressive disclosure)
  
  // ✅ Bank Account Information Fields
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankCountry, setBankCountry] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  
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
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[VerificationCenter] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Use company_id from profile
    const cid = profile?.company_id || null;
    setCompanyId(cid);

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, profile, navigate]);

  // Auto-save business info with debounce
  useEffect(() => {
    if (companyId && (businessIdNumber || countryOfRegistration)) {
      const timer = setTimeout(async () => {
        // Silent auto-save
        if (!companyId) return;
        try {
          const verificationData = {
            company_id: companyId,
            business_id_number: businessIdNumber || null,
            country_of_registration: countryOfRegistration || null,
            documents: uploadedFiles || {},
            status: verification?.status || 'pending'
          };
          if (verification) {
            await supabase.from('verifications').update(verificationData).eq('id', verification.id);
          } else {
            const { data } = await supabase.from('verifications').insert(verificationData).select().single();
            if (data) setVerification(data);
          }
        } catch (error) {
          // Silently fail for auto-save
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessIdNumber, countryOfRegistration, companyId]);

  // Refresh verification status periodically (silent background refresh)
  useEffect(() => {
    if (!user?.email || !companyId) return;
    
    const interval = setInterval(async () => {
      try {
        // Only check email verification status, don't reload everything
        const emailVerified = await isEmailVerified(supabase);
        const currentVerified = user?.email_verified || user?.email_confirmed_at;
        
        if (emailVerified !== !!currentVerified) {
        // Email verification status tracked in auth context - no local state needed
        }
        
        // Silently refresh verification status from database (no loading state)
        const { data: verificationData } = await supabase
          .from('verifications')
          .select('status, documents, business_id_number, country_of_registration')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (verificationData) {
          // Only update if status actually changed
          if (verification?.status !== verificationData.status) {
            setVerification(prev => prev ? { ...prev, ...verificationData } : verificationData);
          }
        }
      } catch (error) {
        // Silently fail - just refresh on next interval
      }
    }, 60000); // Check every 60 seconds (less frequent, more professional)

    return () => clearInterval(interval);
  }, [user?.email, companyId, verification?.status]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Use auth from context (no duplicate call)
      
      // Check if user is supplier or hybrid - only they can verify
      const userRole = role || profile?.role || 'buyer';
      if (!isSeller(userRole) && !isHybrid(userRole)) {
        toast.error('Verification is only available for suppliers and hybrid accounts.');
        navigate('/dashboard');
        return;
      }
      
      // Get or create company
      const cid = profile?.company_id || null;
      const finalCompanyId = cid || await getOrCreateCompany(supabase, user);
      
      if (!finalCompanyId) {
        toast.error('Unable to create company profile. Please select your role first.');
        navigate('/auth/post-login');
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
        const { error: updateError } = await supabase
          .from('companies')
          .update({ owner_email: userData.email })
          .eq('id', finalCompanyId);
        
        if (updateError) {
          console.warn('Could not update company owner_email (may be RLS restricted):', updateError);
        }
      }

      if (finalCompanyId) {
        // Check email verification status
        const emailVerified = await isEmailVerified(supabase);
        if (emailVerified && userData) {
          // Update user state to reflect email verification
          // Email verification status tracked in auth context - no local state needed
        }

        // Load verification status from verifications table
        const { data: verificationData, error: verificationError } = await supabase
          .from('verifications')
          .select('*')
          .eq('company_id', finalCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (verificationError && verificationError.code !== 'PGRST116') {
          console.warn('Verification query error (non-critical):', verificationError);
        }

        if (verificationData) {
          setVerification(verificationData);
          if (verificationData.documents && typeof verificationData.documents === 'object') {
            // ✅ Extract document URLs (for backward compatibility)
            const docUrls = {};
            Object.keys(verificationData.documents).forEach(key => {
              if (key !== 'bank_account_info' && typeof verificationData.documents[key] === 'string') {
                docUrls[key] = verificationData.documents[key];
              }
            });
            setUploadedFiles(docUrls);
            
            // ✅ Load bank account information from documents JSONB
            if (verificationData.documents.bank_account_info) {
              const bankInfo = verificationData.documents.bank_account_info;
              setBankAccountNumber(bankInfo.account_number || '');
              setBankName(bankInfo.bank_name || '');
              setAccountHolderName(bankInfo.account_holder_name || '');
              setSwiftCode(bankInfo.swift_code || '');
              setBankCountry(bankInfo.bank_country || '');
              setBankAddress(bankInfo.bank_address || '');
            }
          }
          if (verificationData.business_id_number) {
            setBusinessIdNumber(verificationData.business_id_number);
          }
          if (verificationData.country_of_registration) {
            setCountryOfRegistration(verificationData.country_of_registration);
          }
          // Load step submission status
          if (verificationData.step_submissions && typeof verificationData.step_submissions === 'object') {
            setStepSubmissions(verificationData.step_submissions);
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
        }

        if (companyData && !verificationData) {
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
      const isNonCriticalError = 
        error.code === 'PGRST116' || 
        error.message?.includes('PGRST116') ||
        error.message?.includes('no rows') ||
        error.message?.includes('permission denied') ||
        error.code === '42501';
      
      if (!isNonCriticalError) {
        console.warn('Non-critical verification load error (user can still proceed):', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusinessInfo = async (showToast = true) => {
    if (!companyId) {
      console.warn('No company ID available');
      return;
    }

    try {
      // ✅ Preserve existing documents structure including bank_account_info
      let documentsData = uploadedFiles || {};
      if (verification?.documents && typeof verification.documents === 'object') {
        // Preserve bank_account_info if it exists
        if (verification.documents.bank_account_info) {
          documentsData.bank_account_info = verification.documents.bank_account_info;
        }
        // Preserve other document URLs
        Object.keys(verification.documents).forEach(key => {
          if (key !== 'bank_account_info' && typeof verification.documents[key] === 'string' && !documentsData[key]) {
            documentsData[key] = verification.documents[key];
          }
        });
      }
      
      const verificationData = {
        company_id: companyId,
        business_id_number: businessIdNumber || null,
        country_of_registration: countryOfRegistration || null,
        documents: documentsData,
        status: verification?.status || 'pending'
      };

      if (verification) {
        const { error } = await supabase
          .from('verifications')
          .update(verificationData)
          .eq('id', verification.id);

        if (error) {
          console.error('Update verification error:', error);
          throw error;
        }
        if (showToast) {
        toast.success('Business information saved');
        }
      } else {
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
        if (showToast) {
        toast.success('Business information saved');
        }
      }
    } catch (error) {
      console.error('Failed to save business info:', error);
      if (showToast) {
      toast.error('Failed to save business information. Please try again.');
      }
    }
  };

  // Auto-save business info with debounce
  useEffect(() => {
    if (businessIdNumber || countryOfRegistration) {
      const timer = setTimeout(() => {
        handleSaveBusinessInfo(false); // Silent save
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [businessIdNumber, countryOfRegistration]);

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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, or PNG file');
      return;
    }

    setUploading(prev => ({ ...prev, [stepId]: true }));

    try {
      const filePath = `verifications/${companyId}/${step.docType}_${Date.now()}_${file.name}`;
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', filePath);
      
      // ✅ For bank statement, include bank account info in documents structure
      const newFiles = {
        ...uploadedFiles,
        [step.docType]: file_url
      };
      
      // ✅ If this is bank statement upload, include bank account information
      if (step.docType === 'bank_statement') {
        newFiles.bank_account_info = {
          account_number: bankAccountNumber || null,
          bank_name: bankName || null,
          account_holder_name: accountHolderName || null,
          swift_code: swiftCode || null,
          bank_country: bankCountry || null,
          bank_address: bankAddress || null
        };
      }
      
      setUploadedFiles(newFiles);

      // AI Verification
      setVerifying(prev => ({ ...prev, [stepId]: true }));
      try {
        const { verifyDocument, compareDocuments } = await import('@/ai/documentVerification');
        
        const previousDoc = verification?.documents?.[step.docType] 
          ? { url: verification.documents[step.docType], type: step.docType, uploaded_at: verification.created_at, status: verification.status }
          : null;

        const { data: companyData } = await supabase
          .from('companies')
          .select('company_name, country, business_type')
          .eq('id', companyId)
          .single();

        const verificationResult = await verifyDocument({
          documentUrl: file_url,
          documentType: step.docType,
          previousDocument: previousDoc,
          companyInfo: companyData || {}
        });

        setVerificationResults(prev => ({
          ...prev,
          [step.docType]: verificationResult
        }));

        if (previousDoc && previousDoc.url) {
          const comparisonResult = await compareDocuments({
            document1Url: previousDoc.url,
            document2Url: file_url,
            documentType: step.docType
          });

          setVerificationResults(prev => ({
            ...prev,
            [step.docType]: {
              ...verificationResult,
              comparison: comparisonResult
            }
          }));

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

        if (verificationResult.recommendations && verificationResult.recommendations.length > 0) {
          setTimeout(() => {
            toast.info('💡 Recommendations', {
              description: verificationResult.recommendations.join(' • ')
            });
          }, 1000);
        }
      } catch (aiError) {
        console.error('AI verification error:', aiError);
        toast.info('Document uploaded. AI verification unavailable - will be reviewed manually.');
      } finally {
        setVerifying(prev => ({ ...prev, [stepId]: false }));
      }

      // ✅ Prepare documents structure with all information
      const documentsData = {
        ...newFiles
      };
      
      // ✅ Ensure bank account info is included if we have it
      if (step.docType === 'bank_statement' || (verification?.documents?.bank_account_info)) {
        documentsData.bank_account_info = {
          account_number: bankAccountNumber || verification?.documents?.bank_account_info?.account_number || null,
          bank_name: bankName || verification?.documents?.bank_account_info?.bank_name || null,
          account_holder_name: accountHolderName || verification?.documents?.bank_account_info?.account_holder_name || null,
          swift_code: swiftCode || verification?.documents?.bank_account_info?.swift_code || null,
          bank_country: bankCountry || verification?.documents?.bank_account_info?.bank_country || null,
          bank_address: bankAddress || verification?.documents?.bank_account_info?.bank_address || null
        };
      }
      
      const verificationData = {
        company_id: companyId,
        documents: documentsData,
        business_id_number: businessIdNumber || null,
        country_of_registration: countryOfRegistration || null,
        step_submissions: stepSubmissions || {},
        status: 'pending'
      };

      if (verification) {
        const { error } = await supabase
          .from('verifications')
          .update(verificationData)
          .eq('id', verification.id);

        if (error) {
          console.error('Update verification error:', error);
          throw error;
        }
      } else {
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

      if (!verificationResults[step.docType]) {
        toast.success('Document uploaded successfully. Pending admin review.');
      }

      if (Object.keys(newFiles).length === 1) {
        try {
          const { notifyVerificationStatusChange } = await import('@/services/notificationService');
          await notifyVerificationStatusChange(companyId, 'pending');
          
          const { createNotification } = await import('@/services/notificationService');
          const { sendEmail } = await import('@/services/emailService');
          
          const { data: company } = await supabase
            .from('companies')
            .select('company_name, owner_email, country')
            .eq('id', companyId)
            .single();
          
          const companyName = company?.company_name || 'Unknown Company';
          const ownerEmail = company?.owner_email || user?.email || 'Unknown';
          
          await createNotification({
            company_id: null,
            user_email: 'hello@afrikoni.com',
            title: `📋 New KYC Verification Submission: ${companyName}`,
            message: `${companyName} (${ownerEmail}) has submitted KYC verification documents for review. Business ID: ${businessIdNumber || 'N/A'}, Country: ${countryOfRegistration || company?.country || 'N/A'}`,
            type: 'verification',
            link: `/dashboard/admin/verification-review?verification=${verification?.id || 'new'}`,
            sendEmail: true,
            emailSubject: `📋 New KYC Verification: ${companyName}`
          });
          
          await sendEmail({
            to: 'hello@afrikoni.com',
            subject: `📋 New KYC Verification Submission: ${companyName}`,
            template: 'default',
            data: {
              title: 'New KYC Verification Submission',
              message: `
                <h3>Company Information</h3>
                <p><strong>Company Name:</strong> ${companyName}</p>
                <p><strong>Owner Email:</strong> ${ownerEmail}</p>
                <p><strong>Country:</strong> ${countryOfRegistration || company?.country || 'N/A'}</p>
                <p><strong>Business ID Number:</strong> ${businessIdNumber || 'N/A'}</p>
                
                <h3>Documents Submitted</h3>
                <ul>
                  ${Object.keys(newFiles).map(docType => `<li>${docType}</li>`).join('')}
                </ul>
                
                <p><strong>Action Required:</strong> Review the verification documents in the admin dashboard.</p>
                <p><a href="https://afrikoni.com/dashboard/admin/verification-review?verification=${verification?.id || 'new'}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Review Verification</a></p>
              `
            }
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      const verificationId = verification?.id || (verification ? null : (await supabase
        .from('verifications')
        .select('id')
        .eq('company_id', companyId)
        .single())?.data?.id);
      
      await logVerificationEvent({
        action: 'document_uploaded',
        verification_id: verificationId,
        company_id: companyId,
        user,
        profile: user,
        metadata: {
          document_type: step.docType,
          step_id: stepId,
          file_size: file.size,
          file_type: file.type,
          ai_verified: !!verificationResults[step.docType]?.verified
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error?.message || 'Failed to upload document. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(prev => ({ ...prev, [stepId]: false }));
    }
  };

  const handleEmailVerification = async () => {
    try {
      if (!user?.email) {
        toast.error('No email address found. Please update your profile.');
        return;
      }

      // Check if already verified
      const emailVerified = await isEmailVerified(supabase);
      if (emailVerified) {
        toast.success('Email is already verified!');
        await loadData(); // Refresh to update status
        return;
      }

      // Resend confirmation email via Supabase Auth
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        // If resend fails, try alternative method
        const { sendEmail } = await import('@/services/emailService');
        const verificationLink = `${window.location.origin}/auth-callback?token=verify&email=${encodeURIComponent(user.email)}`;
        
        const emailResult = await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - Afrikoni',
          template: 'accountVerification',
          data: {
            verificationLink,
            userName: user.name || user.email
          }
        });

        if (emailResult.success) {
          toast.success('Verification email sent! Please check your inbox and click the verification link.');
        } else {
          throw new Error(emailResult.error || 'Failed to send verification email');
        }
      } else {
        toast.success('Verification email sent! Please check your inbox and click the verification link.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to send verification email. Please try again or contact support.');
    }
  };

  const handlePhoneVerification = async () => {
    try {
      if (!user?.phone) {
        toast.error('No phone number found. Please update your profile first.');
        navigate('/dashboard/profile');
        return;
      }

      // For now, we'll use a simple OTP system or mark as verified
      // In production, integrate with SMS service (Twilio, etc.)
      const phoneNumber = user.phone;
      
      // Check if phone is already verified
      if (user.phone_verified) {
        toast.success('Phone number is already verified!');
        await loadData();
        return;
      }

      // Update phone verification status (in production, this would be done after OTP verification)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_verified: true })
        .eq('id', user.id);

      if (updateError) {
        // If profile update fails, show instructions
        toast.info('Phone verification requires SMS. Please contact support to complete phone verification.', {
          duration: 5000
        });
      } else {
        toast.success('Phone verification initiated. You will receive an SMS with a verification code.');
        await loadData();
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      toast.error('Failed to initiate phone verification. Please try again or contact support.');
    }
  };

  const handleTradeAssurance = async () => {
    try {
      // Check if required verifications are complete
      if (requiredCompleted < requiredTotal) {
        toast.warning(`Please complete all required verification steps (${requiredCompleted}/${requiredTotal}) before enabling Trade Assurance.`);
        return;
      }

      // Update verification record to enable trade assurance
      if (!verification) {
        toast.error('Please complete business information first.');
        return;
      }

      const { error } = await supabase
        .from('verifications')
        .update({ trade_assurance_enabled: true })
        .eq('id', verification.id);

      if (error) {
        throw error;
      }

      setVerification(prev => ({ ...prev, trade_assurance_enabled: true }));
      toast.success('Trade Assurance enabled! You now have access to premium trade protection features.');
      await loadData();
    } catch (error) {
      console.error('Trade Assurance error:', error);
      toast.error('Failed to enable Trade Assurance. Please try again.');
    }
  };

  const getStepStatus = (step) => {
    if (!step.docType) {
      if (step.id === 'email') {
        return user?.email_verified || user?.email_confirmed_at ? true : false;
      }
      if (step.id === 'phone') {
        return user?.phone_verified || false;
      }
      if (step.id === 'trade') {
        return verification?.trade_assurance_enabled || false;
      }
      return false;
    }

    const hasDocument = uploadedFiles[step.docType];
    if (!hasDocument) return false;

    if (verification?.status === 'verified') {
      return true;
    }
    if (verification?.status === 'rejected') {
      return 'rejected';
    }
    return 'pending';
  };

  // Check if a step can be accessed (sequential workflow)
  const canAccessStep = (stepIndex) => {
    if (stepIndex === 0) return true; // First step is always accessible
    
    // Check if all previous required steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const prevStep = verificationSteps[i];
      if (prevStep.required) {
        const prevStatus = getStepStatus(prevStep);
        if (prevStatus !== true) {
          return false; // Previous required step not completed
        }
      }
    }
    return true;
  };

  // Get the next actionable step (for progressive disclosure)
  const getNextActionableStep = () => {
    for (let i = 0; i < verificationSteps.length; i++) {
      const step = verificationSteps[i];
      const status = getStepStatus(step);
      const accessible = canAccessStep(i);
      
      if (accessible && status !== true) {
        return i; // This is the next step to complete
      }
    }
    return null; // All steps complete
  };

  // Initialize expanded steps (show next actionable step + completed steps)
  useEffect(() => {
    const nextStep = getNextActionableStep();
    const expanded = new Set();
    
    // Always show completed steps
    verificationSteps.forEach((step, idx) => {
      const status = getStepStatus(step);
      if (status === true) {
        expanded.add(idx);
      }
    });
    
    // Show next actionable step
    if (nextStep !== null) {
      expanded.add(nextStep);
    }
    
    setExpandedSteps(expanded);
  }, [verification, user, uploadedFiles, stepSubmissions]);

  // Check if step is submitted for review
  const isStepSubmitted = (stepId) => {
    return stepSubmissions[stepId] === true;
  };

  // Submit individual step for admin review
  const handleSubmitStep = async (step) => {
    if (!companyId) {
      toast.error('Please ensure you have a company profile.');
      return;
    }

    setSubmittingStep(step.id);

    try {
      // Mark step as submitted
      const newSubmissions = {
        ...stepSubmissions,
        [step.id]: true,
        [`${step.id}_submitted_at`]: new Date().toISOString()
      };

      // ✅ Prepare documents with bank account info if this is bank step
      let documentsData = verification?.documents || uploadedFiles || {};
      if (step.docType === 'bank_statement') {
        documentsData = {
          ...documentsData,
          bank_statement: uploadedFiles.bank_statement || documentsData.bank_statement,
          bank_account_info: {
            account_number: bankAccountNumber || documentsData.bank_account_info?.account_number || null,
            bank_name: bankName || documentsData.bank_account_info?.bank_name || null,
            account_holder_name: accountHolderName || documentsData.bank_account_info?.account_holder_name || null,
            swift_code: swiftCode || documentsData.bank_account_info?.swift_code || null,
            bank_country: bankCountry || documentsData.bank_account_info?.bank_country || null,
            bank_address: bankAddress || documentsData.bank_account_info?.bank_address || null
          }
        };
      }
      
      // Update verification record
      const updateData = {
        step_submissions: newSubmissions,
        documents: documentsData,
        status: 'pending'
      };

      if (verification) {
        const { error } = await supabase
          .from('verifications')
          .update(updateData)
          .eq('id', verification.id);

        if (error) throw error;
      } else {
        // ✅ Prepare documents with bank account info if this is bank step
        let initialDocuments = uploadedFiles || {};
        if (step.docType === 'bank_statement') {
          initialDocuments = {
            ...initialDocuments,
            bank_account_info: {
              account_number: bankAccountNumber || null,
              bank_name: bankName || null,
              account_holder_name: accountHolderName || null,
              swift_code: swiftCode || null,
              bank_country: bankCountry || null,
              bank_address: bankAddress || null
            }
          };
        }
        
        // Create verification record if it doesn't exist
        const { data: newVerification, error } = await supabase
          .from('verifications')
          .insert({
            company_id: companyId,
            step_submissions: newSubmissions,
            business_id_number: businessIdNumber || null,
            country_of_registration: countryOfRegistration || null,
            documents: initialDocuments,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        setVerification(newVerification);
      }

      setStepSubmissions(newSubmissions);

      // Get company info for admin notification
      const { data: company } = await supabase
        .from('companies')
        .select('company_name, owner_email, country')
        .eq('id', companyId)
        .single();

      const companyName = company?.company_name || 'Unknown Company';
      const ownerEmail = company?.owner_email || user?.email || 'Unknown';

      // Send admin notification for this step
      const { createNotification } = await import('@/services/notificationService');
      const { sendEmail } = await import('@/services/emailService');

      await createNotification({
        company_id: null,
        user_email: 'hello@afrikoni.com',
        title: `📋 Verification Step Submitted: ${step.label} - ${companyName}`,
        message: `${companyName} has completed and submitted "${step.label}" for review. Company: ${companyName}, Email: ${ownerEmail}`,
        type: 'verification',
        link: `/dashboard/admin/verification-review?verification=${verification?.id || 'new'}&step=${step.id}`,
        sendEmail: true,
        emailSubject: `📋 Verification Step: ${step.label} - ${companyName}`
      });

      // Send structured email to admin
      await sendEmail({
        to: 'hello@afrikoni.com',
        subject: `📋 Verification Step Submitted: ${step.label} - ${companyName}`,
        template: 'default',
        data: {
          title: `Verification Step: ${step.label}`,
          message: `
            <h3>Step Information</h3>
            <p><strong>Step:</strong> ${step.label}</p>
            <p><strong>Description:</strong> ${step.description}</p>
            <p><strong>Required:</strong> ${step.required ? 'Yes' : 'No'}</p>
            
            <h3>Company Information</h3>
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Owner Email:</strong> ${ownerEmail}</p>
            <p><strong>Country:</strong> ${company?.country || 'N/A'}</p>
            
            ${step.docType ? `
              <h3>Document Submitted</h3>
              <p><strong>Document Type:</strong> ${step.docType}</p>
              <p><strong>Document URL:</strong> ${uploadedFiles[step.docType] ? `<a href="${uploadedFiles[step.docType]}">View Document</a>` : 'N/A'}</p>
              
              ${step.docType === 'bank_statement' && verification?.documents?.bank_account_info ? `
              <h3>Bank Account Information</h3>
              <ul>
                ${verification.documents.bank_account_info.account_number ? `<li><strong>Account Number:</strong> ${verification.documents.bank_account_info.account_number}</li>` : ''}
                ${verification.documents.bank_account_info.bank_name ? `<li><strong>Bank Name:</strong> ${verification.documents.bank_account_info.bank_name}</li>` : ''}
                ${verification.documents.bank_account_info.account_holder_name ? `<li><strong>Account Holder:</strong> ${verification.documents.bank_account_info.account_holder_name}</li>` : ''}
                ${verification.documents.bank_account_info.swift_code ? `<li><strong>SWIFT Code:</strong> ${verification.documents.bank_account_info.swift_code}</li>` : ''}
                ${verification.documents.bank_account_info.bank_country ? `<li><strong>Bank Country:</strong> ${verification.documents.bank_account_info.bank_country}</li>` : ''}
              </ul>
              ` : ''}
            ` : ''}
            
            <p><strong>Action Required:</strong> Review this verification step in the admin dashboard.</p>
            <p><a href="https://afrikoni.com/dashboard/admin/verification-review?verification=${verification?.id || 'new'}&step=${step.id}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Review Step</a></p>
          `
        }
      });

      toast.success(`${step.label} submitted for review! Admin will review it shortly.`);

      // Check if all required steps are now submitted
      const allRequiredSubmitted = verificationSteps
        .filter(s => s.required)
        .every(s => {
          const status = getStepStatus(s);
          return status === true || isStepSubmitted(s.id) || newSubmissions[s.id];
        });

      if (allRequiredSubmitted && requiredCompleted === requiredTotal) {
        // Send final comprehensive summary to admin
        setTimeout(async () => {
          await sendFinalVerificationSummary();
        }, 2000);
      }

      await loadData(); // Refresh to show updated status
    } catch (error) {
      console.error('Submit step error:', error);
      toast.error('Failed to submit step. Please try again.');
    } finally {
      setSubmittingStep(null);
    }
  };

  // Send comprehensive summary when all steps are complete
  const sendFinalVerificationSummary = async () => {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('company_name, owner_email, country')
        .eq('id', companyId)
        .single();

      const companyName = company?.company_name || 'Unknown Company';
      const ownerEmail = company?.owner_email || user?.email || 'Unknown';

      const { createNotification } = await import('@/services/notificationService');
      const { sendEmail } = await import('@/services/emailService');

      // Calculate progress metrics
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

      // Get all completed steps
      const completedSteps = verificationSteps
        .map(step => {
          const status = getStepStatus(step);
          return {
            step: step.label,
            status: status === true ? 'Completed' : status === 'pending' ? 'Pending Review' : 'Not Started',
            hasDocument: step.docType ? !!uploadedFiles[step.docType] : false,
            documentUrl: step.docType ? uploadedFiles[step.docType] : null
          };
        })
        .filter(s => s.status !== 'Not Started');

      await createNotification({
        company_id: null,
        user_email: 'hello@afrikoni.com',
        title: `✅ Complete Verification Ready for Review: ${companyName}`,
        message: `${companyName} has completed all required verification steps. Ready for final admin review.`,
        type: 'verification',
        link: `/dashboard/admin/verification-review?verification=${verification?.id || 'new'}`,
        sendEmail: true,
        emailSubject: `✅ Complete Verification Ready: ${companyName}`
      });

      await sendEmail({
        to: 'hello@afrikoni.com',
        subject: `✅ Complete Verification Ready for Review: ${companyName}`,
        template: 'default',
        data: {
          title: 'Complete Verification Submission - Ready for Review',
          message: `
            <h3>Company Information</h3>
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Owner Email:</strong> ${ownerEmail}</p>
            <p><strong>Country:</strong> ${company?.country || 'N/A'}</p>
            <p><strong>Business ID:</strong> ${businessIdNumber || 'N/A'}</p>
            <p><strong>Country of Registration:</strong> ${countryOfRegistration || 'N/A'}</p>
            
            <h3>Verification Progress</h3>
            <p><strong>Profile Completeness:</strong> ${profileCompleteness}% (${completedCount}/${verificationSteps.length})</p>
            <p><strong>Verification Progress:</strong> ${verificationProgress}% (${requiredCompleted}/${requiredTotal} required)</p>
            
            <h3>Completed Steps</h3>
            <ul>
              ${completedSteps.map(s => `
                <li>
                  <strong>${s.step}:</strong> ${s.status}
                  ${s.documentUrl ? ` - <a href="${s.documentUrl}">View Document</a>` : ''}
                </li>
              `).join('')}
            </ul>
            
            <h3>Documents Submitted</h3>
            <ul>
              ${Object.keys(uploadedFiles).filter(key => key !== 'bank_account_info').map(docType => `
                <li><strong>${docType}:</strong> <a href="${uploadedFiles[docType]}">View Document</a></li>
              `).join('')}
            </ul>
            
            ${verification?.documents?.bank_account_info ? `
            <h3>Bank Account Information</h3>
            <ul>
              ${verification.documents.bank_account_info.account_number ? `<li><strong>Account Number:</strong> ${verification.documents.bank_account_info.account_number}</li>` : ''}
              ${verification.documents.bank_account_info.bank_name ? `<li><strong>Bank Name:</strong> ${verification.documents.bank_account_info.bank_name}</li>` : ''}
              ${verification.documents.bank_account_info.account_holder_name ? `<li><strong>Account Holder:</strong> ${verification.documents.bank_account_info.account_holder_name}</li>` : ''}
              ${verification.documents.bank_account_info.swift_code ? `<li><strong>SWIFT Code:</strong> ${verification.documents.bank_account_info.swift_code}</li>` : ''}
              ${verification.documents.bank_account_info.bank_country ? `<li><strong>Bank Country:</strong> ${verification.documents.bank_account_info.bank_country}</li>` : ''}
              ${verification.documents.bank_account_info.bank_address ? `<li><strong>Bank Address:</strong> ${verification.documents.bank_account_info.bank_address}</li>` : ''}
            </ul>
            ` : ''}
            
            <p><strong>Action Required:</strong> Review all verification documents and information, then approve or request changes.</p>
            <p><a href="https://afrikoni.com/dashboard/admin/verification-review?verification=${verification?.id || 'new'}" style="background: #D4A574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Review Complete Verification</a></p>
          `
        }
      });

      toast.success('All steps complete! Admin has been notified for final review.');
    } catch (error) {
      console.error('Final summary error:', error);
      // Don't show error to user - this is background process
    }
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

  const whyVerifyReasons = [
    {
      icon: Shield,
      title: 'Protect Your Business',
      description: 'We check that each company and contact person is real to reduce fraud and fake profiles.'
    },
    {
      icon: Building2,
      title: 'Unlock Bigger Opportunities',
      description: 'Verified suppliers get higher visibility, larger order limits and access to premium buyers across Africa and the world.'
    },
    {
      icon: Lock,
      title: 'Simple, One-Time Process',
      description: 'Upload your key documents once (ID, business registration, bank proof). Afrikoni Shield™ keeps them encrypted and reviews them for you.'
    }
  ];

  const benefits = [
    'Access to premium features',
    'Higher trust score with partners',
    'Priority customer support',
    'Trade protection enabled',
    'Verified badge on profile',
    'Increased order limits'
  ];

  return (
    <>
      <SEO
        title="Verification Center - Complete Your KYC Verification | Afrikoni"
        description="Complete your KYC verification to unlock all Afrikoni features and build trust with serious buyers and suppliers."
        url="/verification-center"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section with Dominant CTA */}
        <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-afrikoni-gold/20 text-afrikoni-goldLight border-afrikoni-gold/30">
                <Shield className="w-4 h-4 mr-2" />
                KYC Verification
              </Badge>
              <h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6">
                Verification Center
              </h1>
              <p className="text-body font-normal leading-[1.6] text-white/95 max-w-3xl mx-auto mb-8">
                Complete your verification to unlock buyers, higher limits, and trade protection.
              </p>
              
              {/* Dominant CTA */}
              {getNextActionableStep() !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-4"
                >
                  <Button
                    size="lg"
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white text-lg px-8 py-6 shadow-lg"
                    onClick={() => {
                      const nextStep = getNextActionableStep();
                      if (nextStep !== null) {
                        const element = document.getElementById(`step-${nextStep}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          // Expand the step
                          setExpandedSteps(prev => new Set([...prev, nextStep]));
                        }
                      }
                    }}
                  >
                    Continue Verification →
                  </Button>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Estimated time: 10–15 minutes</span>
          </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Documents needed: ID, Business registration, Bank proof</span>
                </div>
                </div>
        </motion.div>
              )}

              {getNextActionableStep() === null && (
        <motion.div
                  initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 bg-afrikoni-gold/20 text-afrikoni-goldLight px-6 py-3 rounded-lg border border-afrikoni-gold/30">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-body font-medium">All steps complete! Your verification is under review.</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Progress Overview - Moved up for visibility */}
        <SystemPageSection
          title="Your Verification Progress"
          subtitle="Track your progress and see what's needed"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream">
            <CardHeader>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut flex items-center gap-2">
                  <Shield className="w-6 h-6 text-afrikoni-gold" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-h1-mobile md:text-h1 font-bold text-afrikoni-gold">{profileCompleteness}%</span>
                    <span className="text-meta font-medium text-afrikoni-chestnut/70">{completedCount} of {verificationSteps.length} completed</span>
                </div>
                <Progress value={profileCompleteness} className="h-3" />
              </div>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                Complete all steps to maximize your account benefits
              </p>
            </CardContent>
          </Card>

            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream">
            <CardHeader>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut flex items-center gap-2">
                  <Lock className="w-6 h-6 text-afrikoni-gold" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-h1-mobile md:text-h1 font-bold text-afrikoni-gold">{verificationProgress}%</span>
                    <span className="text-meta font-medium text-afrikoni-chestnut/70">{requiredCompleted} of {requiredTotal} required</span>
                </div>
                <Progress value={verificationProgress} className="h-3" />
              </div>
              {verification?.status === 'verified' ? (
                  <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Fully Verified
                  </Badge>
              ) : verification?.status === 'rejected' ? (
                <Badge variant="destructive" className="text-xs">Rejected - Please resubmit</Badge>
              ) : verification?.status === 'pending' ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pending Review</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Not Started</Badge>
              )}
            </CardContent>
          </Card>
          </div>
        </SystemPageSection>

        {/* Business Information Form */}
        <SystemPageSection
          title="Business Information"
          subtitle="Provide your business registration details to complete verification"
        >
          <Card className="border-afrikoni-gold/30 bg-afrikoni-cream mb-12">
            <CardHeader>
              <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut flex items-center gap-2">
                <Building2 className="w-6 h-6 text-afrikoni-gold" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_id" className="flex items-center gap-2 mb-2 text-meta font-medium text-afrikoni-chestnut">
                  <Hash className="w-4 h-4 text-afrikoni-gold" />
                  Business ID / Registration Number
                </Label>
                <Input
                  id="business_id"
                  type="text"
                  placeholder="Enter your business registration number"
                  value={businessIdNumber}
                  onChange={(e) => setBusinessIdNumber(e.target.value)}
                  onBlur={() => handleSaveBusinessInfo(true)}
                  className="border-afrikoni-gold/30 bg-white"
                />
                <p className="text-meta font-medium text-afrikoni-chestnut/70 mt-1">
                  This is the official registration number from your business certificate. Your information is saved automatically.
                </p>
              </div>
              
              <div>
                <Label htmlFor="country_registration" className="flex items-center gap-2 mb-2 text-meta font-medium text-afrikoni-chestnut">
                  <Globe className="w-4 h-4 text-afrikoni-gold" />
                  Country of Registration
                </Label>
                <Select
                  value={countryOfRegistration}
                  onValueChange={(value) => {
                    setCountryOfRegistration(value);
                    handleSaveBusinessInfo(true);
                  }}
                >
                  <SelectTrigger id="country_registration" className="border-afrikoni-gold/30 bg-white">
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
                <p className="text-meta font-medium text-afrikoni-chestnut/70 mt-1">
                  The country where your business is legally registered. Your information is saved automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </SystemPageSection>

        {/* Verification Checklist with Progressive Disclosure */}
        <SystemPageSection
          title="Next Steps"
          subtitle={`${requiredCompleted} of ${requiredTotal} required steps complete`}
        >
          <Card className="border-afrikoni-gold/30 bg-afrikoni-cream mb-12">
            <CardContent className="p-6">
              <div className="space-y-4">
                {verificationSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const status = getStepStatus(step);
                  const isCompleted = status === true;
                  const isPending = status === 'pending';
                  const isRejected = status === 'rejected';
                  const hasFile = uploadedFiles[step.docType];
                  const accessible = canAccessStep(idx);
                  const isExpanded = expandedSteps.has(idx);
                  const isNextStep = getNextActionableStep() === idx;

                  return (
                    <motion.div
                      key={step.id}
                      id={`step-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 * idx }}
                    >
                      {/* Collapsed view for locked/future steps */}
                      {!isExpanded && !isCompleted && (
                        <div
                          className={`
                            p-4 rounded-xl border-2 transition-all cursor-pointer
                            ${accessible
                              ? 'border-afrikoni-gold/30 bg-white hover:border-afrikoni-gold/50 hover:shadow-md'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                            }
                          `}
                          onClick={() => {
                            if (accessible) {
                              setExpandedSteps(prev => new Set([...prev, idx]));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {accessible ? (
                                <div className="w-8 h-8 rounded-full bg-afrikoni-gold/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-afrikoni-gold font-bold text-sm">{idx + 1}</span>
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h3 className={`text-h3 font-semibold leading-[1.3] ${accessible ? 'text-afrikoni-chestnut' : 'text-gray-500'}`}>
                                  {step.label}
                                  {isNextStep && accessible && (
                                    <Badge className="ml-2 bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30 text-xs">
                                      Next Step
                                    </Badge>
                                  )}
                                </h3>
                                {!accessible && (
                                  <p className="text-meta font-medium text-gray-400 mt-1">
                                    This step will unlock automatically once the previous one is approved.
                                  </p>
                                )}
                              </div>
                            </div>
                            {accessible && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-afrikoni-gold hover:text-afrikoni-goldDark"
                              >
                                Expand ↓
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expanded view */}
                      {(isExpanded || isCompleted) && (
                        <>
                          {/* Improved locked step message */}
                          {!accessible && !isCompleted && (
                            <div className="mb-4 p-3 bg-afrikoni-cream/50 rounded-lg border border-afrikoni-gold/20">
                              <p className="text-meta font-medium text-afrikoni-chestnut/70">
                                <Lock className="w-4 h-4 inline mr-2" />
                                This step will unlock automatically once the previous one is approved.
                              </p>
                            </div>
                          )}
                          
                          <div className={`
                            relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all
                            ${!accessible 
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : isCompleted 
                              ? 'border-afrikoni-gold bg-afrikoni-gold/10' 
                              : isRejected
                              ? 'border-red-300 bg-red-50/50'
                              : isPending
                              ? 'border-amber-300 bg-amber-50/50'
                              : isNextStep
                              ? 'border-afrikoni-gold bg-afrikoni-gold/5 shadow-md'
                              : 'border-afrikoni-gold/20 bg-white hover:border-afrikoni-gold/40 hover:shadow-md'
                            }
                          `}>
                            <div className={`
                              relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                              ${isCompleted 
                            ? 'bg-afrikoni-gold/20 ring-2 ring-afrikoni-gold' 
                            : isRejected
                            ? 'bg-red-100 ring-2 ring-red-300'
                            : isPending
                            ? 'bg-amber-100 ring-2 ring-amber-300'
                            : 'bg-afrikoni-gold/10 ring-2 ring-afrikoni-gold/20'
                              }
                            `}>
                              {isCompleted ? (
                                <CheckCircle className="w-7 h-7 text-afrikoni-gold" />
                              ) : isRejected ? (
                                <XCircle className="w-7 h-7 text-red-600" />
                              ) : isPending ? (
                                <Clock className="w-7 h-7 text-amber-600" />
                              ) : (
                                <Icon className={`w-7 h-7 ${step.required ? 'text-afrikoni-gold' : 'text-afrikoni-chestnut/50'}`} />
                              )}
                              {!isCompleted && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-afrikoni-chestnut text-white text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut">{step.label}</h3>
                                {step.required && (
                                  <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30 text-xs">
                                    Required
                                  </Badge>
                                )}
                                {!step.required && (
                                  <Badge variant="outline" className="text-xs">Optional</Badge>
                                )}
                              </div>
                              <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80 mb-2">{step.description}</p>
                              
                              {/* Helpful instructions for each step */}
                              {!isCompleted && !hasFile && step.docType && (
                                <div className="mt-2 p-3 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                                  <p className="text-meta font-medium text-afrikoni-chestnut/70">
                                    <strong>Tip:</strong> {step.docType === 'business_registration' 
                                      ? 'Upload your official business registration certificate or license.'
                                      : step.docType === 'kyc'
                                      ? 'Upload a clear photo of your government-issued ID (passport, national ID, or driver\'s license).'
                                      : step.docType === 'bank_statement'
                                      ? 'Upload a recent bank statement (last 3 months) showing your account details.'
                                      : 'Upload a clear, readable document.'}
                                  </p>
                                </div>
                              )}
                              
                              {isCompleted && (
                                <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-gold">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Verified and complete</span>
                                </div>
                              )}
                              {isRejected && (
                                <div className="flex items-center gap-2 text-meta font-medium text-red-700">
                                  <XCircle className="w-4 h-4" />
                                  <span>Rejected - Please resubmit</span>
                                </div>
                              )}
                              {isPending && (
                                <div className="flex items-center gap-2 text-meta font-medium text-amber-700">
                                  <Clock className="w-4 h-4" />
                                  <span>Under review - Our team will review this within 1-3 business days</span>
                                </div>
                              )}
                              {hasFile && !isCompleted && !isPending && !isRejected && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-chestnut">
                                    <FileText className="w-4 h-4" />
                                    <span>Document uploaded - pending review</span>
                                  </div>
                                  {verificationResults[step.docType] && (
                                    <div className={`mt-2 p-3 rounded-lg border text-sm ${
                                      verificationResults[step.docType].verified
                                        ? 'bg-afrikoni-gold/10 border-afrikoni-gold/30 text-afrikoni-chestnut'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                    }`}>
                                      <div className="flex items-start gap-2">
                                        {verificationResults[step.docType].verified ? (
                                          <CheckCircle className="w-4 h-4 text-afrikoni-gold flex-shrink-0 mt-0.5" />
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
                                            </div>
                                      </div>
                                    </div>
                                  )}
                                  {verifying[step.id] && (
                                    <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-chestnut">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-afrikoni-gold"></div>
                                      <span>AI is verifying document...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {/* ✅ Bank Account Information Form Fields - Show for bank verification step */}
                            {!isCompleted && step.docType === 'bank_statement' && canAccessStep(idx) && (
                              <Card className="mb-4 border-afrikoni-gold/30 bg-afrikoni-cream">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg font-semibold text-afrikoni-chestnut">
                                    Bank Account Details
                                  </CardTitle>
                                  <p className="text-sm text-afrikoni-chestnut/70">
                                    Please provide your bank account information. All fields are required.
                                  </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="bank_account_number" className="mb-2">
                                        Account Number <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        id="bank_account_number"
                                        type="text"
                                        placeholder="Enter account number"
                                        value={bankAccountNumber}
                                        onChange={(e) => setBankAccountNumber(e.target.value)}
                                        className="border-afrikoni-gold/30"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="bank_name" className="mb-2">
                                        Bank Name <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        id="bank_name"
                                        type="text"
                                        placeholder="Enter bank name"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="border-afrikoni-gold/30"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="account_holder_name" className="mb-2">
                                        Account Holder Name <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        id="account_holder_name"
                                        type="text"
                                        placeholder="Enter account holder name"
                                        value={accountHolderName}
                                        onChange={(e) => setAccountHolderName(e.target.value)}
                                        className="border-afrikoni-gold/30"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="swift_code" className="mb-2">
                                        SWIFT/BIC Code <span className="text-red-500">*</span>
                                      </Label>
                                      <Input
                                        id="swift_code"
                                        type="text"
                                        placeholder="Enter SWIFT code"
                                        value={swiftCode}
                                        onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                                        className="border-afrikoni-gold/30"
                                        maxLength={11}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="bank_country" className="mb-2">
                                        Bank Country <span className="text-red-500">*</span>
                                      </Label>
                                      <Select
                                        value={bankCountry}
                                        onValueChange={setBankCountry}
                                      >
                                        <SelectTrigger id="bank_country" className="border-afrikoni-gold/30">
                                          <SelectValue placeholder="Select bank country" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                          {AFRICAN_COUNTRIES.map((country) => (
                                            <SelectItem key={country} value={country}>
                                              {country}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="bank_address" className="mb-2">
                                        Bank Address
                                      </Label>
                                      <Input
                                        id="bank_address"
                                        type="text"
                                        placeholder="Enter bank address (optional)"
                                        value={bankAddress}
                                        onChange={(e) => setBankAddress(e.target.value)}
                                        className="border-afrikoni-gold/30"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {!isCompleted && step.docType && canAccessStep(idx) && (
                              <>
                              <label className="cursor-pointer inline-block">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(step.id, file);
                                  }}
                                    disabled={uploading[step.id] || !canAccessStep(idx)}
                                />
                                <Button
                                  variant={isRejected ? "destructive" : "default"}
                                  size="sm"
                                    disabled={uploading[step.id] || !canAccessStep(idx)}
                                  className={`
                                    ${isRejected 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white'
                                    }
                                    min-h-[44px] touch-manipulation
                                  `}
                                  as="span"
                                >
                                  {uploading[step.id] ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                        Uploading...
                                      </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      {hasFile ? 'Re-upload Document' : 'Upload Document'}
                                    </>
                                  )}
                                </Button>
                              </label>
                                
                                {/* Submit for Review Button - Show after document is uploaded (and bank info if bank step) */}
                                {hasFile && !isStepSubmitted(step.id) && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // ✅ Validate bank account fields if this is bank step
                                      if (step.docType === 'bank_statement') {
                                        if (!bankAccountNumber || !bankName || !accountHolderName || !swiftCode || !bankCountry) {
                                          toast.error('Please fill in all required bank account fields');
                                          return;
                                        }
                                      }
                                      handleSubmitStep(step);
                                    }}
                                    disabled={submittingStep === step.id || !canAccessStep(idx)}
                                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white ml-2 min-h-[44px] touch-manipulation"
                                  >
                                    {submittingStep === step.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                        Submitting...
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Submit for Review
                                      </>
                                    )}
                                  </Button>
                                )}
                                
                                {/* Show submitted status */}
                                {isStepSubmitted(step.id) && !isCompleted && (
                                  <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-gold">
                                    <Clock className="w-4 h-4" />
                                    <span>Submitted - Awaiting admin review</span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {!accessible && step.docType && (
                              <div className="text-meta font-medium text-afrikoni-chestnut/60">
                                <Lock className="w-4 h-4 inline mr-2" />
                                This step will unlock automatically once the previous one is approved.
                              </div>
                            )}
                            
                            {/* Non-document steps (email, phone, trade) */}
                            {!isCompleted && !step.docType && accessible && (
                              <div className="space-y-2">
                              <Button
                                variant="default"
                                size="sm"
                                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white min-h-[44px] touch-manipulation"
                                  onClick={async () => {
                                  if (step.id === 'email') {
                                      await handleEmailVerification();
                                  } else if (step.id === 'phone') {
                                      await handlePhoneVerification();
                                  } else if (step.id === 'trade') {
                                      await handleTradeAssurance();
                                  }
                                }}
                                  disabled={!canAccessStep(idx)}
                              >
                                  {step.id === 'email' && 'Send Verification Email'}
                                  {step.id === 'phone' && 'Verify Phone Number'}
                                {step.id === 'trade' && 'Enable Trade Assurance'}
                              </Button>
                                
                                {/* Submit button for email/phone after verification initiated */}
                                {(step.id === 'email' || step.id === 'phone') && !isStepSubmitted(step.id) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSubmitStep(step)}
                                    disabled={submittingStep === step.id || !canAccessStep(idx)}
                                    className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10 ml-2"
                                  >
                                    {submittingStep === step.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-afrikoni-gold mr-2 inline-block"></div>
                                        Submitting...
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Submit for Review
                                      </>
                                    )}
                                  </Button>
                                )}
                                
                                {step.id === 'email' && (
                                  <p className="text-xs text-afrikoni-chestnut/60">
                                    We'll send a verification link to <strong>{user?.email}</strong>. After verifying, click "Submit for Review".
                                  </p>
                                )}
                                {step.id === 'phone' && !user?.phone && (
                                  <p className="text-xs text-afrikoni-chestnut/60">
                                    <strong>Note:</strong> Please add your phone number in your profile first.
                                  </p>
                                )}
                                {step.id === 'trade' && requiredCompleted < requiredTotal && (
                                  <p className="text-xs text-afrikoni-chestnut/60">
                                    Complete all required steps ({requiredCompleted}/{requiredTotal}) to enable Trade Assurance.
                                  </p>
                                )}
                                
                                {/* Show submitted status */}
                                {isStepSubmitted(step.id) && !isCompleted && (
                                  <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-gold">
                                    <Clock className="w-4 h-4" />
                                    <span>Submitted - Awaiting admin review</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!accessible && !step.docType && (
                              <div className="text-meta font-medium text-afrikoni-chestnut/60">
                                <Lock className="w-4 h-4 inline mr-2" />
                                This step will unlock automatically once the previous one is approved.
                              </div>
                            )}
                            
                            {/* Collapse button for expanded steps */}
                            {isExpanded && !isCompleted && accessible && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpandedSteps(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(idx);
                                    return newSet;
                                  });
                                }}
                                className="mt-2 text-afrikoni-chestnut/60 hover:text-afrikoni-chestnut"
                              >
                                Collapse ↑
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    </motion.div>
                  );
                })}
              </div>

              {requiredCompleted === requiredTotal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-afrikoni-gold/10 border-2 border-afrikoni-gold rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-afrikoni-gold flex-shrink-0" />
                    <div>
                      <h4 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-1">All Required Steps Complete!</h4>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                        Your verification is being reviewed by our team. You'll receive a notification once the review is complete.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </SystemPageSection>

        {/* Benefits Section */}
        <SystemPageSection
          title="Benefits of Full Verification"
          subtitle="Unlock premium features and build trust with partners"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 p-4 bg-afrikoni-cream rounded-lg border border-afrikoni-gold/30">
                    <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                <span className="text-body font-normal leading-[1.6] text-afrikoni-chestnut">{benefit}</span>
                  </div>
                ))}
              </div>
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Need Help with Verification?"
          description="Our support team is here to help you complete your verification process"
          ctaLabel="Contact Support"
          ctaTo="/contact"
        />
      </div>
    </>
  );
}
