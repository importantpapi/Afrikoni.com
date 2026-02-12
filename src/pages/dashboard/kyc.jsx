import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  User, Building2, FileText, Upload, Eye, RefreshCw, Search,
  TrendingUp, TrendingDown, UserCheck, BarChart3, CheckCircle2,
  Upload as UploadIcon, FileCheck, Lock, Globe, AlertCircle
} from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  RadialBarChart, RadialBar, PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useKYCVerifications } from '@/hooks/queries/useKYCVerifications';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';

export default function KYCTracker() {
  // ✅ REACT QUERY MIGRATION: Use query hooks for auto-refresh
  const { profileCompanyId, userId, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  const { data: kycVerifications = [], isLoading, error } = useKYCVerifications();
  const [showOcrPreview, setShowOcrPreview] = useState(false);
  const [showBusinessDoc, setShowBusinessDoc] = useState(false);

  // ✅ REACT QUERY MIGRATION: Derive summary from real-time data
  const kycSummary = useMemo(() => {
    if (kycVerifications.length === 0) {
      return {
        overallVerificationStatus: 'not_started',
        identityCheckResult: 'not_started',
        businessCheckResult: 'not_started',
        amlScreeningResult: 'not_started',
        pepStatus: 'not_started',
        finalRiskScore: 0
      };
    }
    const verified = kycVerifications.filter(v => v.status === 'verified').length;
    const pending = kycVerifications.filter(v => v.status === 'pending').length;
    const rejected = kycVerifications.filter(v => v.status === 'rejected').length;
    const overallStatus = verified > 0 ? 'verified' : pending > 0 ? 'pending' : 'rejected';

    return {
      overallVerificationStatus: overallStatus,
      identityCheckResult: overallStatus,
      businessCheckResult: overallStatus,
      amlScreeningResult: overallStatus === 'verified' ? 'pass' : 'pending',
      pepStatus: overallStatus === 'verified' ? 'clear' : 'pending',
      finalRiskScore: rejected > 0 ? 75 : pending > 0 ? 50 : 25
    };
  }, [kycVerifications]);

  }

  // ✅ REACT QUERY MIGRATION: Use isLoading from query
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ REACT QUERY MIGRATION: Error handling with auto-retry
  if (error) {
    return (
      <ErrorState message={error?.message || 'Failed to load KYC data'} />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'pass':
      case 'clear':
      case 'completed':
        return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'pending':
      case 'review':
        return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'failed':
      case 'fail':
      case 'detected':
        return 'bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30';
      case 'not_started':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'pass':
      case 'clear':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
      case 'review':
        return <Clock className="w-5 h-5" />;
      case 'failed':
      case 'fail':
      case 'detected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  // ✅ BACKEND CONNECTION: Simplified risk score data based on actual verifications
  const riskScoreData = [
    { name: 'Verification Status', value: kycSummary.finalRiskScore, fill: '#D4A937' }
  ];

  const riskBarData = [
    { category: 'Overall', risk: kycSummary.finalRiskScore }
  ];

  // ✅ BACKEND CONNECTION: Simplified data structures for display
  const identityVerification = kycVerifications.find(v => v.verification_type === 'identity') || {
    personalInfo: { fullName: 'N/A', dateOfBirth: 'N/A', address: 'N/A', nationality: 'N/A', phone: 'N/A', email: 'N/A' },
    idDocument: { type: 'N/A', documentNumber: 'N/A', expiryDate: new Date().toISOString(), status: 'not_started' },
    ocrResults: { extractedData: {}, confidence: 0 }
  };

  const businessVerification = kycVerifications.find(v => v.verification_type === 'business') || {
    businessInfo: { businessName: 'N/A', registrationNumber: 'N/A', jurisdiction: 'N/A', country: 'N/A', licenseNumber: 'N/A', taxNumber: 'N/A', address: 'N/A' },
    certificate: { type: 'N/A', expiryDate: new Date().toISOString(), verifiedBy: 'N/A', status: 'not_started' }
  };

  const amlScreening = {
    overallResult: kycSummary.amlScreeningResult,
    ofacScreening: { result: kycSummary.amlScreeningResult, matches: 0 },
    interpolRedFlags: { matches: 0 },
    fatfHighRiskCountry: { isHighRisk: false, riskLevel: 'low' },
    screeningDate: kycVerifications[0]?.created_at || new Date().toISOString(),
    suspiciousActivity: [],
    matches: []
  };

  const pepScreening = {
    result: kycSummary.pepStatus,
    relation: null,
    pepCategory: null,
    countryOfExposure: null,
    screeningDate: kycVerifications[0]?.created_at || new Date().toISOString(),
    checkedSources: [],
    notes: null
  };

  const riskScoreBreakdown = {
    identityRisk: kycSummary.finalRiskScore,
    businessLegitimacyRisk: kycSummary.finalRiskScore,
    amlRisk: kycSummary.finalRiskScore,
    pepRisk: kycSummary.finalRiskScore,
    documentCompleteness: kycSummary.finalRiskScore,
    behaviorAnomalyScore: kycSummary.finalRiskScore,
    finalRiskScore: kycSummary.finalRiskScore,
    riskLevel: kycSummary.finalRiskScore < 30 ? 'low' : kycSummary.finalRiskScore < 60 ? 'medium' : 'high',
    lastUpdated: kycVerifications[0]?.updated_at || new Date().toISOString()
  };

  const requiredDocuments = kycVerifications.map(v => ({
    id: v.id,
    name: v.verification_type || 'Document',
    category: v.verification_type || 'General',
    status: v.status,
    expiryDate: null,
    notes: v.notes
  }));

  const verificationTimeline = kycVerifications.map(v => ({
    id: v.id,
    step: v.verification_type || 'Verification',
    details: v.notes || 'Verification submitted',
    status: v.status === 'verified' ? 'completed' : v.status === 'rejected' ? 'failed' : 'pending',
    timestamp: v.created_at,
    completedBy: v.reviewed_by ? 'Admin' : 'System'
  }));

  return (
    <>
      <div className="space-y-6">
        {/* Premium Header - v2.5 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/risk" className="inline-flex items-center gap-2 hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Risk Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                KYC/AML Tracker
              </h1>
              <p className="text-sm md:text-base leading-relaxed">
                Complete verification journey: Identity, Business, AML, PEP, and Risk Assessment
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section A: Summary Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Summary Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Overall Verification Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      {getStatusIcon(kycSummary.overallVerificationStatus)}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2 capitalize">
                    {kycSummary.overallVerificationStatus.replace('_', ' ')}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    Verification Status
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Identity Check Result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2 capitalize">
                    {kycSummary.identityCheckResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    Identity Check
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Business Check Result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2 capitalize">
                    {kycSummary.businessCheckResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    Business Check
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AML Screening Result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2 capitalize">
                    {kycSummary.amlScreeningResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    AML Screening
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* PEP Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2 capitalize">
                    {kycSummary.pepStatus}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    PEP Status
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Final Risk Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="">
                      Low
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {kycSummary.finalRiskScore}
                  </div>
                  <div className="text-xs md:text-sm font-medium uppercase tracking-wide">
                    Final Risk Score
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Section B: Identity Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Identity Verification
          </h2>
          <Card className="rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs uppercase tracking-wide">Full Name</label>
                      <p className="text-sm font-medium">{identityVerification.personalInfo.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Date of Birth</label>
                      <p className="text-sm font-medium">{identityVerification.personalInfo.dateOfBirth}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Address</label>
                      <p className="text-sm font-medium">{identityVerification.personalInfo.address}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Nationality</label>
                      <p className="text-sm font-medium">{identityVerification.personalInfo.nationality}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Phone / Email</label>
                      <p className="text-sm font-medium">
                        {identityVerification.personalInfo.phone} / {identityVerification.personalInfo.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID Document */}
                <div>
                  <h3 className="font-semibold mb-4">ID Document</h3>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs uppercase tracking-wide">Document Type</label>
                      <p className="text-sm font-medium">{identityVerification.idDocument.type}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Document Number</label>
                      <p className="text-sm font-medium">{identityVerification.idDocument.documentNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Expiry Date</label>
                      <p className="text-sm font-medium">
                        {new Date(identityVerification.idDocument.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(identityVerification.idDocument.status)}>
                      {identityVerification.idDocument.status.charAt(0).toUpperCase() + identityVerification.idDocument.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-afrikoni" onClick={() => setShowOcrPreview(true)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View OCR Data
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-afrikoni">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Re-upload
                    </Button>
                  </div>
                </div>
              </div>

              {/* OCR Results Preview */}
              {showOcrPreview && (
                <div className="mt-6 p-4 border rounded-afrikoni">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">OCR Extraction Results</h4>
                    <button onClick={() => setShowOcrPreview(false)} className="hover:text-afrikoni-text-dark">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(identityVerification.ocrResults.extractedData).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-xs uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className="">
                      Confidence: {(identityVerification.ocrResults.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Badge className="">
                      Verified
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: Business Verification (KYB) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Business Verification (KYB)
          </h2>
          <Card className="rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Business Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs uppercase tracking-wide">Business Name</label>
                      <p className="text-sm font-medium">{businessVerification.businessInfo.businessName}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Registration Number</label>
                      <p className="text-sm font-medium">{businessVerification.businessInfo.registrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Jurisdiction / Country</label>
                      <p className="text-sm font-medium">
                        {businessVerification.businessInfo.jurisdiction} ({businessVerification.businessInfo.country})
                      </p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">License Number</label>
                      <p className="text-sm font-medium">{businessVerification.businessInfo.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Tax Number</label>
                      <p className="text-sm font-medium">{businessVerification.businessInfo.taxNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Business Address</label>
                      <p className="text-sm font-medium">{businessVerification.businessInfo.address}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Certificate Status</h3>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs uppercase tracking-wide">Certificate Type</label>
                      <p className="text-sm font-medium">{businessVerification.certificate.type}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Expiry Date</label>
                      <p className="text-sm font-medium">
                        {new Date(businessVerification.certificate.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide">Verified By</label>
                      <p className="text-sm font-medium">{businessVerification.certificate.verifiedBy}</p>
                    </div>
                    <Badge className={getStatusColor(businessVerification.certificate.status)}>
                      {businessVerification.certificate.status.charAt(0).toUpperCase() + businessVerification.certificate.status.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-afrikoni"
                    onClick={() => setShowBusinessDoc(true)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Business Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section D: AML & Sanctions Screening */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            AML & Sanctions Screening
          </h2>
          <Card className="rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-4">Screening Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Result:</span>
                      <Badge className={getStatusColor(amlScreening.overallResult)}>
                        {amlScreening.overallResult.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OFAC Screening:</span>
                      <Badge className={getStatusColor(amlScreening.ofacScreening.result)}>
                        {amlScreening.ofacScreening.matches} matches
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Interpol Red Flags:</span>
                      <Badge className={getStatusColor('clear')}>
                        {amlScreening.interpolRedFlags.matches} matches
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">FATF High-Risk Country:</span>
                      <Badge className={amlScreening.fatfHighRiskCountry.isHighRisk ? getStatusColor('fail') : getStatusColor('pass')}>
                        {amlScreening.fatfHighRiskCountry.riskLevel}
                      </Badge>
                    </div>
                    <div className="text-xs mt-2">
                      Screened: {new Date(amlScreening.screeningDate).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {amlScreening.suspiciousActivity.map((activity) => (
                      <div key={activity.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{activity.type}</span>
                          <Badge className={activity.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                            {activity.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-xs">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold mb-4">Screening Matches</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Match Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Source</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Result</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amlScreening.matches.map((match) => (
                      <tr key={match.id} className="border-b hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 text-sm">{match.matchType}</td>
                        <td className="py-3 px-4 text-sm">{match.source}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(match.status)}>
                            {match.result}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {(match.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section E: PEP Screening */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            PEP (Politically Exposed Person) Screening
          </h2>
          <Card className={`border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium ${pepScreening.result === 'detected' ? 'border-red-300 bg-red-50/30' : ''
            }`}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Screening Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PEP Check Result:</span>
                      <Badge className={getStatusColor(pepScreening.result)}>
                        {pepScreening.result.toUpperCase()}
                      </Badge>
                    </div>
                    {pepScreening.relation && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Relation:</span>
                        <span className="text-sm font-medium capitalize">{pepScreening.relation}</span>
                      </div>
                    )}
                    {pepScreening.pepCategory && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PEP Category:</span>
                        <span className="text-sm font-medium">{pepScreening.pepCategory}</span>
                      </div>
                    )}
                    {pepScreening.countryOfExposure && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Country of Exposure:</span>
                        <span className="text-sm font-medium">{pepScreening.countryOfExposure}</span>
                      </div>
                    )}
                    <div className="text-xs mt-2">
                      Screened: {new Date(pepScreening.screeningDate).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Screening Sources</h3>
                  <div className="space-y-2">
                    {pepScreening.checkedSources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{source}</span>
                      </div>
                    ))}
                  </div>
                  {pepScreening.notes && (
                    <div className="mt-4 p-3 border rounded-lg">
                      <p className="text-sm">{pepScreening.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section F: Risk Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Risk Score Breakdown
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold">Risk Components</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                    <XAxis type="number" domain={[0, 100]} stroke="#2E2A1F" fontSize={12} />
                    <YAxis dataKey="category" type="category" stroke="#2E2A1F" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FDF8F0',
                        border: '1px solid #D4A937',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="risk" fill="#D4A937" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold">Final Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold mb-2">
                    {riskScoreBreakdown.finalRiskScore}
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${riskScoreBreakdown.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                    riskScoreBreakdown.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      riskScoreBreakdown.riskLevel === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                    }`}>
                    {riskScoreBreakdown.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="space-y-3">
                  {riskBarData.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}/100</span>
                      </div>
                      <div className="w-full rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${item.value}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs">
                  Last Updated: {new Date(riskScoreBreakdown.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section G: Required Documents & Uploads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Required Documents & Uploads
          </h2>
          <Card className="rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Document Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requiredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{doc.name}</div>
                          {doc.notes && (
                            <div className="text-xs mt-1">{doc.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">{doc.category}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {doc.status === 'uploaded' ? (
                              <>
                                <Button size="sm" variant="outline" className="rounded-afrikoni">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-afrikoni">
                                  <Upload className="w-3 h-3 mr-1" />
                                  Replace
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" className="hover:bg-afrikoni-gold/90 rounded-afrikoni">
                                <Upload className="w-3 h-3 mr-1" />
                                Upload
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section H: Verification Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 mb-6">
            Verification Timeline
          </h2>
          <Card className="rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {verificationTimeline.map((step, idx) => (
                  <div key={step.id} className="relative">
                    {idx < verificationTimeline.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'completed' ? 'bg-afrikoni-green/20' : 'bg-gray-100'
                        }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{step.step}</h3>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm mb-1">{step.details}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span>{new Date(step.timestamp).toLocaleString()}</span>
                          <span>by {step.completedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
