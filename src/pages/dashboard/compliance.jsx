/**
 * Afrikoni Shield™ - Compliance Center
 * Phase 2: Document compliance, tax filings, supplier verification, and regulatory management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileCheck, ArrowLeft, Upload, Download, Shield, CheckCircle, XCircle,
  Clock, AlertTriangle, FileText, Building2, Globe, Calendar, Filter,
  Search, Eye, RefreshCw, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  complianceKPIs, documentCompliance, taxFilings, complianceByHub,
  verificationSteps, countryRegulatoryMatrix, complianceTasks, certificates
} from '@/data/complianceDemo';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';

export default function ComplianceCenter() {
  // All hooks must be at the top - before any conditional returns
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docFilter, setDocFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [taskSort, setTaskSort] = useState('dueDate');
  const [expandedCountries, setExpandedCountries] = useState(new Set());

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setHasAccess(isAdmin(userData));
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const filteredDocuments = docFilter === 'all'
    ? documentCompliance
    : documentCompliance.filter(doc => doc.status === docFilter);

  const filteredCountries = countryFilter === 'all'
    ? countryRegulatoryMatrix
    : countryRegulatoryMatrix.filter(country => {
        if (countryFilter === 'allowed') return country.marketplaceAllowed;
        if (countryFilter === 'highRisk') return country.riskLevel === 'high';
        if (countryFilter === 'restricted') return !country.marketplaceAllowed;
        if (countryFilter === 'manualReview') return country.riskLevel === 'high' || !country.marketplaceAllowed;
        return true;
      });

  const sortedTasks = [...complianceTasks].sort((a, b) => {
    if (taskSort === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (taskSort === 'riskLevel') {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    if (taskSort === 'status') {
      const statusOrder = { open: 0, in_progress: 1, done: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'pending': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'rejected': return 'bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30';
      case 'expired': return 'bg-afrikoni-clay/20 text-afrikoni-clay border-afrikoni-clay/30';
      case 'missing': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'active': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getFilingStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'upcoming': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'overdue': return 'bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date();
  };

  const toggleCountry = (countryCode) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedCountries(newExpanded);
  };

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Premium Header - v2.5 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard/risk" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80">
              <ArrowLeft className="w-4 h-4" />
              Back to Risk Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Link to="/dashboard/audit">
                <Button variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                  <FileText className="w-4 h-4 mr-2" />
                  View Audit Logs
                </Button>
              </Link>
              <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Compliance Center
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Tax filings, regulatory compliance, and document management across 54 African countries
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section A: Compliance Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Compliance Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Overall Compliance Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Good
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {complianceKPIs.overallComplianceScore}%
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Compliance Score
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Submitted */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {complianceKPIs.documentsSubmitted}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Documents Submitted
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Missing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {complianceKPIs.documentsMissing}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Documents Missing
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tax Filings Due */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {complianceKPIs.taxFilingsDue}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Tax Filings Due
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Verification Level */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-clay/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-afrikoni-clay" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    Tier {complianceKPIs.verificationLevel}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Verification Level
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Escrow Eligibility */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {complianceKPIs.escrowEligibility ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Escrow Eligible
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Section B: Document Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Document Compliance
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
              >
                <option value="all">All Documents</option>
                <option value="pending">Pending</option>
                <option value="missing">Missing</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Document Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Last Uploaded</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-afrikoni-text-dark">{doc.name}</div>
                          {doc.rejectionReason && (
                            <div className="text-xs text-afrikoni-red mt-1">{doc.rejectionReason}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{doc.type}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {doc.lastUploaded ? new Date(doc.lastUploaded).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          {doc.status === 'missing' ? (
                            <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni">
                              <Upload className="w-3 h-3 mr-1" />
                              Upload
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Replace
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: Tax & Filing Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Tax & Regulatory Filings — Hub Overview
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {taxFilings.map((filing) => (
              <Card key={filing.id} className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-afrikoni-text-dark">{filing.country}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-afrikoni-text-dark">{filing.hub}</h3>
                        <p className="text-sm text-afrikoni-text-dark/70">{filing.filingType}</p>
                      </div>
                    </div>
                    <Badge className={getFilingStatusColor(filing.status)}>
                      {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-afrikoni-text-dark/70">Deadline:</span>
                      <span className="font-medium text-afrikoni-text-dark">
                        {new Date(filing.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-afrikoni-text-dark/70">Period:</span>
                      <span className="font-medium text-afrikoni-text-dark">{filing.period}</span>
                    </div>
                    {filing.daysUntil < 0 && (
                      <div className="text-xs text-afrikoni-red font-medium">
                        {Math.abs(filing.daysUntil)} days overdue
                      </div>
                    )}
                    {filing.daysUntil >= 0 && filing.daysUntil <= 7 && (
                      <div className="text-xs text-afrikoni-gold font-medium">
                        {filing.daysUntil} days remaining
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-afrikoni-gold/30 rounded-afrikoni">
                    View Details
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-base font-semibold">Compliance Completion by Hub</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={complianceByHub}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                  <XAxis dataKey="hub" stroke="#2E2A1F" fontSize={12} />
                  <YAxis stroke="#2E2A1F" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FDF8F0',
                      border: '1px solid #D4A937',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#3AB795" name="Completed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#D4A937" name="Pending" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="overdue" fill="#E84855" name="Overdue" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section D: Supplier Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Supplier Verification Status
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {verificationSteps.map((step, idx) => (
                  <div key={step.id} className="relative">
                    {idx < verificationSteps.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-afrikoni-gold/20" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === 'verified' ? 'bg-afrikoni-green/20' :
                        step.status === 'pending' ? 'bg-afrikoni-gold/20' :
                        step.status === 'in_progress' ? 'bg-afrikoni-purple/20' :
                        'bg-gray-100'
                      }`}>
                        {step.status === 'verified' ? (
                          <CheckCircle className="w-6 h-6 text-afrikoni-green" />
                        ) : step.status === 'in_progress' ? (
                          <Clock className="w-6 h-6 text-afrikoni-purple" />
                        ) : (
                          <Clock className="w-6 h-6 text-afrikoni-gold" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-afrikoni-text-dark">{step.step}</h3>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status === 'in_progress' ? 'In Progress' : step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                          </Badge>
                        </div>
                        {step.completedAt && (
                          <p className="text-sm text-afrikoni-text-dark/70 mb-1">
                            Completed: {new Date(step.completedAt).toLocaleString()} by {step.verifiedBy}
                          </p>
                        )}
                        {step.issue && (
                          <p className="text-sm text-afrikoni-red mb-2">{step.issue}</p>
                        )}
                        {step.progress && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-afrikoni-purple h-2 rounded-full transition-all"
                              style={{ width: `${step.progress}%` }}
                            />
                          </div>
                        )}
                        <p className="text-sm text-afrikoni-text-dark/60">{step.notes}</p>
                        {step.status !== 'verified' && (
                          <Button size="sm" variant="outline" className="mt-2 border-afrikoni-gold/30 rounded-afrikoni">
                            {step.issue ? 'Fix Issue' : 'Re-upload'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-afrikoni-text-dark">Verification Tier:</span>
                  <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30 text-lg px-4 py-2">
                    Tier {complianceKPIs.verificationLevel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section E: Country Regulatory Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Country Regulatory Matrix
            </h2>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-afrikoni-text-dark/70" />
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
              >
                <option value="all">All Countries</option>
                <option value="allowed">Marketplace Allowed</option>
                <option value="highRisk">High Risk</option>
                <option value="restricted">Restricted</option>
                <option value="manualReview">Requires Manual Review</option>
              </select>
            </div>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Country</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Marketplace Allowed?</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">KYC Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Tax Rules</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Risk Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((country) => (
                      <React.Fragment key={country.code}>
                        <tr className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-afrikoni-text-dark">{country.country}</div>
                            <div className="text-xs text-afrikoni-text-dark/50">{country.code}</div>
                          </td>
                          <td className="py-3 px-4">
                            {country.marketplaceAllowed ? (
                              <Badge className="bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30">
                                Yes
                              </Badge>
                            ) : (
                              <Badge className="bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30">
                                No
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{country.kycLevel}</td>
                          <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{country.taxRules}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${
                                country.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                                country.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {country.riskLevel.charAt(0).toUpperCase() + country.riskLevel.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleCountry(country.code)}
                              className="text-afrikoni-gold hover:text-afrikoni-gold/80"
                            >
                              {expandedCountries.has(country.code) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedCountries.has(country.code) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 bg-afrikoni-ivory">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-afrikoni-text-dark">Restricted Products: </span>
                                  <span className="text-sm text-afrikoni-text-dark/70">{country.restrictedProducts.join(', ')}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-afrikoni-text-dark">Notes: </span>
                                  <span className="text-sm text-afrikoni-text-dark/70">{country.notes}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section F: Compliance Tasks & Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Compliance Tasks & Deadlines
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
              <select
                value={taskSort}
                onChange={(e) => setTaskSort(e.target.value)}
                className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="riskLevel">Sort by Risk Level</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-3">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-afrikoni transition-all ${
                      isOverdue(task.dueDate) && task.status !== 'done'
                        ? 'border-afrikoni-red/50 bg-red-50/50'
                        : 'border-afrikoni-gold/20 hover:bg-afrikoni-sand/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getRiskColor(task.riskLevel)}`} />
                          <h3 className="font-semibold text-afrikoni-text-dark">{task.title}</h3>
                          <Badge
                            className={`${
                              task.riskLevel === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              task.riskLevel === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              task.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {task.riskLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/70 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/60">
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>Assigned: {task.assignedTo}</span>
                          <Badge
                            variant="outline"
                            className={`${
                              task.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                              task.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      {task.status !== 'done' && (
                        <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni ml-4">
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section G: Certificates & Legal Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Certificates & Legal Documents
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-afrikoni-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-afrikoni-text-dark mb-1">{cert.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-afrikoni-text-dark/70">
                          <span>Type: {cert.type}</span>
                          {cert.expiryDate && (
                            <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                          )}
                          {cert.fileSize && <span>Size: {cert.fileSize}</span>}
                        </div>
                      </div>
                      <Badge className={getStatusColor(cert.status)}>
                        {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {cert.status === 'missing' ? (
                        <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni">
                          <Upload className="w-3 h-3 mr-1" />
                          Upload PDF
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                            <Eye className="w-3 h-3 mr-1" />
                            View PDF
                          </Button>
                          <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                            <Upload className="w-3 h-3 mr-1" />
                            Replace
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
