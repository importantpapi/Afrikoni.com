/**
 * Afrikoni Shield™ - KYC/AML Tracker
 * Phase 3: Full verification journey for suppliers and buyers
 * Identity checks, business verification, AML screening, PEP checks, sanctions lists, risk scoring
 */

import React, { useState, useEffect } from 'react';
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
import {
  kycSummary, identityVerification, businessVerification, amlScreening,
  pepScreening, riskScoreBreakdown, requiredDocuments, verificationTimeline
} from '@/data/kycDemo';
// NOTE: Admin check done at route level - removed isAdmin import
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';

export default function KYCTracker() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  
  // All hooks must be at the top - before any conditional returns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOcrPreview, setShowOcrPreview] = useState(false);
  const [showBusinessDoc, setShowBusinessDoc] = useState(false);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading KYC tracker..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check admin access using kernel
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (loading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          setLoading(true);
        }}
      />
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
        return <CheckCircle className="w-5 h-5 text-afrikoni-green" />;
      case 'pending':
      case 'review':
        return <Clock className="w-5 h-5 text-afrikoni-gold" />;
      case 'failed':
      case 'fail':
      case 'detected':
        return <XCircle className="w-5 h-5 text-afrikoni-red" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  // Risk Score Data for Radial Chart
  const riskScoreData = [
    { name: 'Identity Risk', value: riskScoreBreakdown.identityRisk, fill: '#D4A937' },
    { name: 'Business Risk', value: riskScoreBreakdown.businessLegitimacyRisk, fill: '#8140FF' },
    { name: 'AML Risk', value: riskScoreBreakdown.amlRisk, fill: '#3AB795' },
    { name: 'PEP Risk', value: riskScoreBreakdown.pepRisk, fill: '#E84855' },
    { name: 'Document Risk', value: riskScoreBreakdown.documentCompleteness, fill: '#C9A77B' },
    { name: 'Behavior Risk', value: riskScoreBreakdown.behaviorAnomalyScore, fill: '#2E2A1F' }
  ];

  // Risk Score Bar Chart Data
  const riskBarData = [
    { category: 'Identity', risk: riskScoreBreakdown.identityRisk },
    { category: 'Business', risk: riskScoreBreakdown.businessLegitimacyRisk },
    { category: 'AML', risk: riskScoreBreakdown.amlRisk },
    { category: 'PEP', risk: riskScoreBreakdown.pepRisk },
    { category: 'Documents', risk: riskScoreBreakdown.documentCompleteness },
    { category: 'Behavior', risk: riskScoreBreakdown.behaviorAnomalyScore }
  ];

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
          <Link to="/dashboard/risk" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Risk Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                KYC/AML Tracker
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Summary Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Overall Verification Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      {getStatusIcon(kycSummary.overallVerificationStatus)}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-2 capitalize">
                    {kycSummary.overallVerificationStatus.replace('_', ' ')}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-2 capitalize">
                    {kycSummary.identityCheckResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-2 capitalize">
                    {kycSummary.businessCheckResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-2 capitalize">
                    {kycSummary.amlScreeningResult}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-2 capitalize">
                    {kycSummary.pepStatus}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Low
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {kycSummary.finalRiskScore}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Identity Verification
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Full Name</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.personalInfo.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Date of Birth</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.personalInfo.dateOfBirth}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Address</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.personalInfo.address}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Nationality</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.personalInfo.nationality}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Phone / Email</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">
                        {identityVerification.personalInfo.phone} / {identityVerification.personalInfo.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID Document */}
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">ID Document</h3>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Document Type</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.idDocument.type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Document Number</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{identityVerification.idDocument.documentNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Expiry Date</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">
                        {new Date(identityVerification.idDocument.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(identityVerification.idDocument.status)}>
                      {identityVerification.idDocument.status.charAt(0).toUpperCase() + identityVerification.idDocument.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni" onClick={() => setShowOcrPreview(true)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View OCR Data
                    </Button>
                    <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Re-upload
                    </Button>
                  </div>
                </div>
              </div>

              {/* OCR Results Preview */}
              {showOcrPreview && (
                <div className="mt-6 p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-afrikoni-text-dark">OCR Extraction Results</h4>
                    <button onClick={() => setShowOcrPreview(false)} className="text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(identityVerification.ocrResults.extractedData).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <p className="text-sm font-medium text-afrikoni-text-dark">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Confidence: {(identityVerification.ocrResults.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Badge className="bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Business Verification (KYB)
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Business Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Business Name</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.businessInfo.businessName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Registration Number</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.businessInfo.registrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Jurisdiction / Country</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">
                        {businessVerification.businessInfo.jurisdiction} ({businessVerification.businessInfo.country})
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">License Number</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.businessInfo.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Tax Number</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.businessInfo.taxNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Business Address</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.businessInfo.address}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Certificate Status</h3>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Certificate Type</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.certificate.type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Expiry Date</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">
                        {new Date(businessVerification.certificate.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-afrikoni-text-dark/70 uppercase tracking-wide">Verified By</label>
                      <p className="text-sm font-medium text-afrikoni-text-dark">{businessVerification.certificate.verifiedBy}</p>
                    </div>
                    <Badge className={getStatusColor(businessVerification.certificate.status)}>
                      {businessVerification.certificate.status.charAt(0).toUpperCase() + businessVerification.certificate.status.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-afrikoni-gold/30 rounded-afrikoni"
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            AML & Sanctions Screening
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Screening Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-text-dark/70">Overall Result:</span>
                      <Badge className={getStatusColor(amlScreening.overallResult)}>
                        {amlScreening.overallResult.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-text-dark/70">OFAC Screening:</span>
                      <Badge className={getStatusColor(amlScreening.ofacScreening.result)}>
                        {amlScreening.ofacScreening.matches} matches
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-text-dark/70">Interpol Red Flags:</span>
                      <Badge className={getStatusColor('clear')}>
                        {amlScreening.interpolRedFlags.matches} matches
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-text-dark/70">FATF High-Risk Country:</span>
                      <Badge className={amlScreening.fatfHighRiskCountry.isHighRisk ? getStatusColor('fail') : getStatusColor('pass')}>
                        {amlScreening.fatfHighRiskCountry.riskLevel}
                      </Badge>
                    </div>
                    <div className="text-xs text-afrikoni-text-dark/50 mt-2">
                      Screened: {new Date(amlScreening.screeningDate).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {amlScreening.suspiciousActivity.map((activity) => (
                      <div key={activity.id} className="p-3 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-ivory">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-afrikoni-text-dark">{activity.type}</span>
                          <Badge className={activity.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                            {activity.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-afrikoni-text-dark/70">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-afrikoni-text-dark mb-4">Screening Matches</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Match Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Source</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Result</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amlScreening.matches.map((match) => (
                      <tr key={match.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark">{match.matchType}</td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{match.source}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(match.status)}>
                            {match.result}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            PEP (Politically Exposed Person) Screening
          </h2>
          <Card className={`border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium ${
            pepScreening.result === 'detected' ? 'border-red-300 bg-red-50/30' : ''
          }`}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Screening Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-text-dark/70">PEP Check Result:</span>
                      <Badge className={getStatusColor(pepScreening.result)}>
                        {pepScreening.result.toUpperCase()}
                      </Badge>
                    </div>
                    {pepScreening.relation && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-text-dark/70">Relation:</span>
                        <span className="text-sm font-medium text-afrikoni-text-dark capitalize">{pepScreening.relation}</span>
                      </div>
                    )}
                    {pepScreening.pepCategory && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-text-dark/70">PEP Category:</span>
                        <span className="text-sm font-medium text-afrikoni-text-dark">{pepScreening.pepCategory}</span>
                      </div>
                    )}
                    {pepScreening.countryOfExposure && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-text-dark/70">Country of Exposure:</span>
                        <span className="text-sm font-medium text-afrikoni-text-dark">{pepScreening.countryOfExposure}</span>
                      </div>
                    )}
                    <div className="text-xs text-afrikoni-text-dark/50 mt-2">
                      Screened: {new Date(pepScreening.screeningDate).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Screening Sources</h3>
                  <div className="space-y-2">
                    {pepScreening.checkedSources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-ivory">
                        <CheckCircle className="w-4 h-4 text-afrikoni-green" />
                        <span className="text-sm text-afrikoni-text-dark">{source}</span>
                      </div>
                    ))}
                  </div>
                  {pepScreening.notes && (
                    <div className="mt-4 p-3 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-ivory">
                      <p className="text-sm text-afrikoni-text-dark/70">{pepScreening.notes}</p>
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Risk Score Breakdown
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
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
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Final Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-afrikoni-text-dark mb-2">
                    {riskScoreBreakdown.finalRiskScore}
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${
                    riskScoreBreakdown.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
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
                        <span className="text-sm text-afrikoni-text-dark/70">{item.name}</span>
                        <span className="text-sm font-medium text-afrikoni-text-dark">{item.value}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${item.value}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-afrikoni-text-dark/50">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Required Documents & Uploads
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Document Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requiredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-afrikoni-text-dark">{doc.name}</div>
                          {doc.notes && (
                            <div className="text-xs text-afrikoni-text-dark/50 mt-1">{doc.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{doc.category}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {doc.status === 'uploaded' ? (
                              <>
                                <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                                  <Upload className="w-3 h-3 mr-1" />
                                  Replace
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni">
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
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Verification Timeline
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {verificationTimeline.map((step, idx) => (
                  <div key={step.id} className="relative">
                    {idx < verificationTimeline.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-afrikoni-gold/20" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === 'completed' ? 'bg-afrikoni-green/20' : 'bg-gray-100'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-afrikoni-green" />
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-afrikoni-text-dark">{step.step}</h3>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/70 mb-1">{step.details}</p>
                        <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/50">
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
