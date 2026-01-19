import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle2, Clock, AlertCircle, Upload, 
  Building2, FileCheck, Award, TrendingUp, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { Badge } from '@/components/shared/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { toast } from 'sonner';

/**
 * Supplier Verification Status Dashboard
 * Shows suppliers exactly what they need to do to become verified
 * Reduces verification drop-off and increases platform trust
 */

const VERIFICATION_STEPS = [
  {
    id: 'business_registration',
    title: 'Business Registration',
    description: 'Upload government-issued business license or certificate of incorporation',
    icon: Building2,
    required: true,
    weight: 25
  },
  {
    id: 'identity_verification',
    title: 'Identity Verification',
    description: 'Verify company directors and beneficial owners',
    icon: FileCheck,
    required: true,
    weight: 25
  },
  {
    id: 'tax_compliance',
    title: 'Tax Registration',
    description: 'Provide valid tax identification number (TIN) and registration documents',
    icon: Shield,
    required: true,
    weight: 20
  },
  {
    id: 'product_quality',
    title: 'Product Quality Standards',
    description: 'Upload certifications, quality standards, or sample documentation',
    icon: Award,
    required: false,
    weight: 15
  },
  {
    id: 'bank_verification',
    title: 'Bank Account Verification',
    description: 'Verify business bank account for secure payments',
    icon: TrendingUp,
    required: true,
    weight: 15
  }
];

export default function VerificationStatus() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [profileStrength, setProfileStrength] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading verification status..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        setLoading(false);
        return;
      }
      return;
    }

    loadVerificationStatus();
  }, [canLoadData, userId, profileCompanyId]);

  const loadVerificationStatus = async () => {
    if (!profileCompanyId) {
      console.log('[VerificationStatus] No company_id - cannot load verification status');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel

      // Load company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Load verification submission data
      const { data: verifData, error: verifError } = await supabase
        .from('verifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!verifError && verifData) {
        setVerificationData(verifData);
      }

      // Calculate profile strength
      calculateProfileStrength(companyData, verifData);
    } catch (error) {
      console.error('Error loading verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileStrength = (companyData, verifData) => {
    let strength = 0;
    const completed = [];

    // Basic company profile (10%)
    if (companyData.company_name && companyData.country && companyData.description) {
      strength += 10;
    }

    // Check verification steps
    if (verifData) {
      if (verifData.business_license_url || verifData.registration_document_url) {
        strength += 25;
        completed.push('business_registration');
      }
      if (verifData.id_document_url) {
        strength += 25;
        completed.push('identity_verification');
      }
      if (verifData.tax_document_url) {
        strength += 20;
        completed.push('tax_compliance');
      }
      if (verifData.certification_urls && verifData.certification_urls.length > 0) {
        strength += 15;
        completed.push('product_quality');
      }
      if (verifData.bank_statement_url) {
        strength += 15;
        completed.push('bank_verification');
      }
    }

    setProfileStrength(Math.min(strength, 100));
    setCompletedSteps(completed);
  };

  const getVerificationStatus = () => {
    if (!company) return { label: 'Unknown', color: 'gray', icon: Clock };
    
    if (company.verified && company.verification_status === 'verified') {
      return { label: 'Verified', color: 'green', icon: CheckCircle2 };
    }
    
    if (verificationData?.status === 'in_review' || company.verification_status === 'in_review') {
      return { label: 'Under Review', color: 'blue', icon: Clock };
    }
    
    if (verificationData?.status === 'rejected' || company.verification_status === 'rejected') {
      return { label: 'Needs Attention', color: 'red', icon: AlertCircle };
    }

    return { label: 'Not Started', color: 'gray', icon: Shield };
  };

  const status = getVerificationStatus();
  const StatusIcon = status.icon;

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (loading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadVerificationStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
            Verification Status
          </h1>
          <p className="text-afrikoni-deep/70">
            Complete verification to unlock buyer trust and increased visibility
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="mb-6 border-afrikoni-gold/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${status.color}-100`}>
                  <StatusIcon className={`w-6 h-6 text-${status.color}-600`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-afrikoni-chestnut">
                      {status.label}
                    </h2>
                    <Badge variant={status.color === 'green' ? 'success' : 'secondary'}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-afrikoni-deep/70 mb-3">
                    {company?.verified 
                      ? 'Your business is verified. Buyers see you as a trusted supplier.'
                      : 'Complete the steps below to become a verified supplier and build buyer trust.'
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-afrikoni-deep">
                      Profile Strength: {profileStrength}%
                    </span>
                  </div>
                  <Progress value={profileStrength} className="w-full max-w-xs mt-2" />
                </div>
              </div>

              {!company?.verified && (
                <Button
                  onClick={() => navigate('/verification-center')}
                  className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                >
                  {verificationData ? 'Continue Verification' : 'Start Verification'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Why Verification Matters */}
        <Card className="mb-6 bg-gradient-to-br from-amber-50 to-white border-afrikoni-gold/30">
          <CardHeader>
            <CardTitle className="text-lg text-afrikoni-chestnut flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-afrikoni-gold" />
              Why Verification Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-afrikoni-gold mb-1">3x</p>
              <p className="text-sm text-afrikoni-deep/70">
                More buyer inquiries for verified suppliers
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-afrikoni-gold mb-1">Priority</p>
              <p className="text-sm text-afrikoni-deep/70">
                Shown first in search and RFQ matches
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-afrikoni-gold mb-1">Trust</p>
              <p className="text-sm text-afrikoni-deep/70">
                Verified badge builds institutional confidence
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-afrikoni-chestnut">Verification Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {VERIFICATION_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <StepIcon className="w-5 h-5 text-afrikoni-deep/60" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-afrikoni-chestnut">{step.title}</h3>
                      {step.required && !isCompleted && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="success" className="text-xs">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-afrikoni-deep/70 mb-3">{step.description}</p>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/verification-center')}
                        className="text-xs"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Documents
                      </Button>
                    )}
                  </div>
                  <div className="text-sm font-medium text-afrikoni-deep/50">
                    +{step.weight}%
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {!company?.verified && (
          <Card className="mt-6 border-afrikoni-gold/30">
            <CardContent className="p-6">
              <h3 className="font-semibold text-afrikoni-chestnut mb-3">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-afrikoni-deep/80">
                <li>Upload all required documents in the Verification Center</li>
                <li>Afrikoni team reviews your submission (typically 24-48 hours)</li>
                <li>You receive verification status update via email and dashboard notification</li>
                <li>Once verified, your profile immediately shows the verified badge</li>
              </ol>
              <Button
                onClick={() => navigate('/verification-center')}
                className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-gold/90"
              >
                Go to Verification Center
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

