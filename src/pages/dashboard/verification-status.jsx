import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, CheckCircle2, Clock, AlertCircle, Upload,
  Building2, FileCheck, Award, TrendingUp, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { Badge } from '@/components/shared/ui/badge';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useCompanyInfo } from '@/hooks/queries/useCompanyInfo';
import { useVerifications } from '@/hooks/queries/useVerifications';
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
  // ✅ REACT QUERY MIGRATION: Use query hooks for auto-refresh
  const { profileCompanyId, userId, isSystemReady } = useDashboardKernel();
  const { data: company, isLoading: companyLoading, error: companyError } = useCompanyInfo();
  const { data: allVerifications = [], isLoading: verificationsLoading, error: verificationsError } = useVerifications();
  const navigate = useNavigate();

  // Get latest verification
  const verificationData = allVerifications[0] || null;
  const isLoading = companyLoading || verificationsLoading;
  const error = companyError || verificationsError;

  // ✅ REACT QUERY MIGRATION: Calculate profile strength from real-time data
  const { profileStrength, completedSteps } = useMemo(() => {
    if (!company) {
      return { profileStrength: 0, completedSteps: [] };
    }

    let strength = 0;
    const completed = [];

    // Basic company profile (10%)
    if (company.company_name && company.country && company.description) {
      strength += 10;
    }

    // Check verification steps
    if (verificationData) {
      if (verificationData.business_license_url || verificationData.registration_document_url) {
        strength += 25;
        completed.push('business_registration');
      }
      if (verificationData.id_document_url) {
        strength += 25;
        completed.push('identity_verification');
      }
      if (verificationData.tax_document_url) {
        strength += 20;
        completed.push('tax_compliance');
      }
      if (verificationData.certification_urls && (verificationData.certification_urls?.length || 0) > 0) {
        strength += 15;
        completed.push('product_quality');
      }
      if (verificationData.bank_statement_url) {
        strength += 15;
        completed.push('bank_verification');
      }
    }

    return { 
      profileStrength: Math.min(strength, 100),
      completedSteps: completed
    };
  }, [company, verificationData]);

  const getVerificationStatus = () => {
    if (!company) return { label: 'Unknown', color: 'gray', icon: Clock };

    if (company.verified && company.verification_status === 'verified') {
      return { label: 'Verified', color: 'green', icon: CheckCircle2 };
    }

    if (verificationData?.status === 'in_review' || company.verification_status === 'in_review') {
      return { label: 'Under Review', color: 'blue', icon: Clock };
    }

    return { label: 'Not Verified', color: 'yellow', icon: AlertCircle };
  };

  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  if (error) {
    return <ErrorState message={error?.message || 'Failed to load verification status'} />;
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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Verification Status
          </h1>
          <p className="">
            Complete verification to unlock buyer trust and increased visibility
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${status.color}-100`}>
                  <StatusIcon className={`w-6 h-6 text-${status.color}-600`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">
                      {status.label}
                    </h2>
                    <Badge variant={status.color === 'green' ? 'success' : 'secondary'}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">
                    {company?.verified
                      ? 'Your business is verified. Buyers see you as a trusted supplier.'
                      : 'Complete the steps below to become a verified supplier and build buyer trust.'
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Profile Strength: {profileStrength}%
                    </span>
                  </div>
                  <Progress value={profileStrength} className="w-full max-w-xs mt-2" />
                </div>
              </div>

              {!company?.verified && (
                <Button
                  onClick={() => navigate('/dashboard/verification-center')}
                  className="hover:bg-afrikoni-gold/90"
                >
                  {verificationData ? 'Continue Verification' : 'Start Verification'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Why Verification Matters */}
        <Card className="mb-6 bg-gradient-to-br">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Why Verification Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold mb-1">3x</p>
              <p className="text-sm">
                More buyer inquiries for verified suppliers
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">Priority</p>
              <p className="text-sm">
                Shown first in search and RFQ matches
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">Trust</p>
              <p className="text-sm">
                Verified badge builds institutional confidence
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="">Verification Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {VERIFICATION_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      {step.required && !isCompleted && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="success" className="text-xs">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm mb-3">{step.description}</p>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/dashboard/verification-center')}
                        className="text-xs"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Documents
                      </Button>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    +{step.weight}%
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {!company?.verified && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Upload all required documents in the Verification Center</li>
                <li>Afrikoni team reviews your submission (typically 24-48 hours)</li>
                <li>You receive verification status update via email and dashboard notification</li>
                <li>Once verified, your profile immediately shows the verified badge</li>
              </ol>
              <Button
                onClick={() => navigate('/dashboard/verification-center')}
                className="mt-4 hover:bg-afrikoni-gold/90"
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

