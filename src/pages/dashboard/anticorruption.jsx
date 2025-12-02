/**
 * Afrikoni Shield™ - Anti-Corruption Dashboard
 * Phase 4: Anti-bribery enforcement, transparency, whistleblowing, anomaly detection,
 * immutable audit logs, and compliance oversight across 54 African countries
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Lock, ArrowLeft, AlertTriangle, Shield, FileText, Users, Globe,
  TrendingUp, CheckCircle, XCircle, Clock, Filter, Search, Eye,
  ChevronDown, ChevronUp, Upload, BarChart3, MapPin, UserCheck,
  ExternalLink, AlertCircle, Flag, Building2
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  LineChart, Line
} from 'recharts';
import {
  antiCorruptionKPIs, whistleblowerReports, aiAnomalies, auditTrail,
  riskProfiles, regionalRiskZones, zeroBribePolicy, activeCases
} from '@/data/antiCorruptionDemo';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';

export default function AntiCorruption() {
  // All hooks must be at the top - before any conditional returns
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState({ severity: 'all', status: 'all', category: 'all' });
  const [auditFilter, setAuditFilter] = useState({ user: 'all', action: 'all' });
  const [auditSearch, setAuditSearch] = useState('');
  const [expandedAuditRows, setExpandedAuditRows] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(null);

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

  const filteredReports = whistleblowerReports.filter(report => {
    if (reportFilter.severity !== 'all' && report.severity !== reportFilter.severity) return false;
    if (reportFilter.status !== 'all' && report.status !== reportFilter.status) return false;
    if (reportFilter.category !== 'all' && report.category !== reportFilter.category) return false;
    return true;
  });

  const filteredAuditTrail = auditTrail.filter(entry => {
    if (auditFilter.user !== 'all' && entry.user !== auditFilter.user) return false;
    if (auditFilter.action !== 'all' && entry.action !== auditFilter.action) return false;
    if (auditSearch && !entry.action.toLowerCase().includes(auditSearch.toLowerCase()) && 
        !entry.user.toLowerCase().includes(auditSearch.toLowerCase())) return false;
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (score) => {
    if (score < 30) return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
    if (score < 60) return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
    return 'bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30';
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'medium': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'extreme': return 'bg-afrikoni-clay/20 text-afrikoni-clay border-afrikoni-clay/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'in_review': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'investigating': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'escalated': return 'bg-red-50 text-red-700 border-red-200';
      case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const toggleAuditRow = (id) => {
    const newExpanded = new Set(expandedAuditRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAuditRows(newExpanded);
  };

  // Regional Risk Chart Data
  const regionalChartData = regionalRiskZones.reduce((acc, country) => {
    const existing = acc.find(item => item.riskLevel === country.riskLevel);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ riskLevel: country.riskLevel, count: 1 });
    }
    return acc;
  }, []);

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
          <Link to="/dashboard/risk" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Risk Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Anti-Corruption Dashboard
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Zero-bribe policy enforcement, whistleblowing, and transparency across 54 African countries
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section A: Anti-Corruption Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Anti-Corruption Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Reports Filed */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.totalReports30Days}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Reports (30d)
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Open Cases */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.openCases}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Open Cases
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Closed Cases */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.closedCases}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Closed Cases
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI-Flagged Anomalies */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.aiFlaggedAnomalies}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    AI Anomalies
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* High-Risk Partners */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.highRiskPartners}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    High-Risk Partners
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zero-Bribe Compliance Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Excellent
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {antiCorruptionKPIs.zeroBribeComplianceScore}%
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Compliance Score
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Section B: Whistleblower Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Whistleblower Reports
            </h2>
            <Button
              className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni"
              onClick={() => setShowReportModal(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Anonymous Report
            </Button>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
                  <select
                    value={reportFilter.severity}
                    onChange={(e) => setReportFilter({ ...reportFilter, severity: e.target.value })}
                    className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <select
                  value={reportFilter.status}
                  onChange={(e) => setReportFilter({ ...reportFilter, status: e.target.value })}
                  className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={reportFilter.category}
                  onChange={(e) => setReportFilter({ ...reportFilter, category: e.target.value })}
                  className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                >
                  <option value="all">All Categories</option>
                  <option value="fraud">Fraud</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="abuse">Abuse of Power</option>
                </select>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Report ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Reporter</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-afrikoni-text-dark">{report.id}</td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{report.reportType}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`${
                              report.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              report.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              report.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {report.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{report.reporter}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === 'in_review' ? 'In Review' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {new Date(report.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                            <Eye className="w-3 h-3 mr-1" />
                            View Case
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: AI-Anomaly Detection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            AI-Anomaly Detection (Red Flag Analysis)
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Entity Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">ID / Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Anomaly Score</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Flag Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Risk Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiAnomalies.map((anomaly) => (
                      <tr key={anomaly.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{anomaly.entityType}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-afrikoni-text-dark">{anomaly.entityName}</div>
                          <div className="text-xs text-afrikoni-text-dark/50">{anomaly.entityId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold text-afrikoni-text-dark">{anomaly.anomalyScore}</div>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  anomaly.riskLevel === 'high' ? 'bg-red-500' :
                                  anomaly.riskLevel === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${anomaly.anomalyScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{anomaly.flagType}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`${
                              anomaly.riskLevel === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              anomaly.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {anomaly.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section D: Immutable Audit Trail Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Immutable Audit Trail Viewer
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              {/* Filters and Search */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-gold" />
                    <Input
                      placeholder="Search audit trail..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                    />
                  </div>
                </div>
                <select
                  value={auditFilter.user}
                  onChange={(e) => setAuditFilter({ ...auditFilter, user: e.target.value })}
                  className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                >
                  <option value="all">All Users</option>
                  <option value="user_abc123">user_abc123</option>
                  <option value="admin_xyz789">admin_xyz789</option>
                  <option value="system">System</option>
                </select>
                <select
                  value={auditFilter.action}
                  onChange={(e) => setAuditFilter({ ...auditFilter, action: e.target.value })}
                  className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                >
                  <option value="all">All Actions</option>
                  <option value="Document Upload">Document Upload</option>
                  <option value="Payment Release">Payment Release</option>
                  <option value="Anomaly Detection">Anomaly Detection</option>
                </select>
              </div>

              {/* Audit Trail Table */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">User / System</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Metadata</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Integrity Hash</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditTrail.map((entry) => (
                      <React.Fragment key={entry.id}>
                        <tr className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                          <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {entry.system ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  System
                                </Badge>
                              ) : (
                                <span className="text-sm text-afrikoni-text-dark">{entry.user}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-afrikoni-text-dark">{entry.action}</td>
                          <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                            <div className="space-y-1">
                              {entry.metadata.ip && <div>IP: {entry.metadata.ip}</div>}
                              {entry.metadata.country && <div>Country: {entry.metadata.country}</div>}
                              {entry.metadata.document && <div>Doc: {entry.metadata.document}</div>}
                              {entry.metadata.transactionId && <div>TXN: {entry.metadata.transactionId}</div>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs text-afrikoni-text-dark/50 font-mono">
                              {entry.integrityHash.substring(0, 20)}...
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleAuditRow(entry.id)}
                              className="text-afrikoni-gold hover:text-afrikoni-gold/80"
                            >
                              {expandedAuditRows.has(entry.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedAuditRows.has(entry.id) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 bg-afrikoni-ivory">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-afrikoni-text-dark">Details: </span>
                                  <span className="text-sm text-afrikoni-text-dark/70">{entry.details}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-afrikoni-text-dark">Full Hash: </span>
                                  <code className="text-xs text-afrikoni-text-dark/50 font-mono">{entry.integrityHash}</code>
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

        {/* Section E: Employee & Partner Risk Profiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Employee & Partner Risk Profiles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {riskProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg ${
                  profile.riskScore >= 60 ? 'border-red-300' : ''
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-full flex items-center justify-center">
                        {profile.role === 'Internal' ? (
                          <UserCheck className="w-6 h-6 text-afrikoni-gold" />
                        ) : (
                          <Building2 className="w-6 h-6 text-afrikoni-gold" />
                        )}
                      </div>
                      <Badge className={getRiskColor(profile.riskScore)}>
                        {profile.riskScore}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-afrikoni-text-dark mb-1">{profile.name}</h3>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-2">{profile.position}</p>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-afrikoni-text-dark/70">Role:</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.role}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-afrikoni-text-dark/70">ID:</span>
                        <span className="text-afrikoni-text-dark/70">{profile.entityId}</span>
                      </div>
                      {profile.lastAnomalyDate && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-afrikoni-text-dark/70">Last Anomaly:</span>
                          <span className="text-afrikoni-text-dark/70">
                            {new Date(profile.lastAnomalyDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {profile.flags.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-afrikoni-text-dark/70 mb-1">Flags:</div>
                        <div className="flex flex-wrap gap-1">
                          {profile.flags.map((flag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full border-afrikoni-gold/30 rounded-afrikoni">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section F: Regional Corruption Risk Zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Regional Corruption Risk Zones
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Risk Distribution by Level</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionalChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                    <XAxis dataKey="riskLevel" stroke="#2E2A1F" fontSize={12} />
                    <YAxis stroke="#2E2A1F" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FDF8F0',
                        border: '1px solid #D4A937',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#D4A937" radius={[8, 8, 0, 0]}>
                      {regionalChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.riskLevel === 'low' ? '#3AB795' :
                          entry.riskLevel === 'medium' ? '#D4A937' :
                          entry.riskLevel === 'high' ? '#E84855' :
                          '#C9A77B'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Country Risk Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {regionalRiskZones.map((country, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-afrikoni-text-dark/50" />
                        <div>
                          <div className="font-medium text-afrikoni-text-dark">{country.country}</div>
                          <div className="text-xs text-afrikoni-text-dark/50">Risk Score: {country.riskScore}</div>
                        </div>
                      </div>
                      <Badge className={getRiskLevelColor(country.riskLevel)}>
                        {country.riskLevel.charAt(0).toUpperCase() + country.riskLevel.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section G: Zero-Bribe Policy Enforcement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Zero-Bribe Policy Enforcement
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Compliance Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-afrikoni-text-dark/70">Suppliers Accepted Policy</span>
                        <span className="text-sm font-bold text-afrikoni-text-dark">{zeroBribePolicy.suppliersAccepted}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-afrikoni-green h-2 rounded-full transition-all"
                          style={{ width: `${zeroBribePolicy.suppliersAccepted}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-afrikoni-text-dark/70">Employees Trained</span>
                        <span className="text-sm font-bold text-afrikoni-text-dark">{zeroBribePolicy.employeesTrained}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-afrikoni-gold h-2 rounded-full transition-all"
                          style={{ width: `${zeroBribePolicy.employeesTrained}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                        <div className="text-xs text-afrikoni-text-dark/70 mb-1">Violations Detected</div>
                        <div className="text-2xl font-bold text-afrikoni-text-dark">{zeroBribePolicy.violationsDetected}</div>
                      </div>
                      <div className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                        <div className="text-xs text-afrikoni-text-dark/70 mb-1">Violations Resolved</div>
                        <div className="text-2xl font-bold text-afrikoni-green">{zeroBribePolicy.violationsResolved}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-afrikoni-text-dark mb-4">Policy Information</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                      <div className="text-xs text-afrikoni-text-dark/70 mb-1">Policy Version</div>
                      <div className="text-lg font-bold text-afrikoni-text-dark">v{zeroBribePolicy.policyVersion}</div>
                    </div>
                    <div className="p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                      <div className="text-xs text-afrikoni-text-dark/70 mb-1">Last Updated</div>
                      <div className="text-sm font-medium text-afrikoni-text-dark">
                        {new Date(zeroBribePolicy.lastUpdateDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-afrikoni-gold/30 rounded-afrikoni"
                      onClick={() => setShowPolicyModal(true)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Policy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section H: Case Management (Active Investigations) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Case Management (Active Investigations)
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Case ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Assigned Officer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Last Update</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCases.map((caseItem) => (
                      <tr key={caseItem.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-afrikoni-text-dark">{caseItem.id}</td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{caseItem.type}</td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{caseItem.assignedOfficer}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status === 'in_review' ? 'In Review' :
                             caseItem.status === 'investigating' ? 'Investigating' :
                             caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`${
                              caseItem.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              caseItem.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              caseItem.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {caseItem.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {new Date(caseItem.lastUpdate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-afrikoni-gold/30 rounded-afrikoni"
                            onClick={() => setShowCaseModal(caseItem.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Open Case File
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      {/* Submit Anonymous Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-afrikoni-lg shadow-premium-lg max-w-2xl w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-afrikoni-text-dark">Submit Anonymous Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-afrikoni-text-dark mb-2 block">Report Type</label>
                <select className="w-full border border-afrikoni-gold/30 rounded-afrikoni px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20">
                  <option>Bribe Solicitation</option>
                  <option>Fraud</option>
                  <option>Misconduct</option>
                  <option>Abuse of Power</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-afrikoni-text-dark mb-2 block">Description</label>
                <textarea
                  className="w-full border border-afrikoni-gold/30 rounded-afrikoni px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                  rows={4}
                  placeholder="Describe the incident in detail..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni">
                  Submit Report
                </Button>
                <Button variant="outline" onClick={() => setShowReportModal(false)} className="border-afrikoni-gold/30 rounded-afrikoni">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-afrikoni-lg shadow-premium-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-afrikoni-text-dark">Zero-Bribe Policy v{zeroBribePolicy.policyVersion}</h3>
              <button onClick={() => setShowPolicyModal(false)} className="text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-afrikoni-text-dark/80 leading-relaxed">{zeroBribePolicy.policyText}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Case Detail Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-afrikoni-lg shadow-premium-lg max-w-2xl w-full p-6"
          >
            {(() => {
              const caseItem = activeCases.find(c => c.id === showCaseModal);
              if (!caseItem) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-afrikoni-text-dark">Case File: {caseItem.id}</h3>
                    <button onClick={() => setShowCaseModal(null)} className="text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-afrikoni-text-dark mb-1 block">Type</label>
                      <p className="text-sm text-afrikoni-text-dark/70">{caseItem.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-afrikoni-text-dark mb-1 block">Description</label>
                      <p className="text-sm text-afrikoni-text-dark/70">{caseItem.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-afrikoni-text-dark mb-1 block">Assigned Officer</label>
                      <p className="text-sm text-afrikoni-text-dark/70">{caseItem.assignedOfficer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-afrikoni-text-dark mb-1 block">Related Report</label>
                      <p className="text-sm text-afrikoni-text-dark/70">{caseItem.relatedReport}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-afrikoni-text-dark mb-1 block">Related Entities</label>
                      <div className="flex flex-wrap gap-2">
                        {caseItem.relatedEntities.map((entity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowCaseModal(null)} className="w-full border-afrikoni-gold/30 rounded-afrikoni">
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
