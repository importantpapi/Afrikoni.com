/**
 * Afrikoni Shield™ - Risk Management Dashboard
 * Enterprise-grade command center for real-time compliance, fraud, logistics,
 * anti-corruption, KYC/AML, and operational risk management across 54 African countries
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, FileCheck, Lock,
  Truck, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Filter, Search, Eye, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  riskKPIs, taxCompliance, antiCorruptionData, logisticsRisk,
  fraudData, earlyWarningAlerts, riskScoreHistory, complianceByHub
} from '@/data/riskDemo';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';

export default function RiskManagementDashboard() {
  // All hooks must be at the top - before any conditional returns
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('all'); // all, critical, high, medium, low

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (userData) {
        setUser(userData);
        // Check admin access - CEO email always works (case-insensitive)
        const admin = isAdmin(userData);
        setHasAccess(admin);
        if (admin) {
          console.log('✅ Admin access granted for:', userData.email);
        } else {
          console.log('❌ Access denied for:', userData.email);
        }
      } else {
        console.log('❌ No user data found');
        setHasAccess(false);
      }
    } catch (error) {
      console.error('❌ Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show access denied if not admin
  if (!hasAccess) {
    return <AccessDenied />;
  }

  // If we get here, user is admin - render the page

  const filteredAlerts = alertFilter === 'all'
    ? earlyWarningAlerts
    : earlyWarningAlerts.filter(alert => alert.severity === alertFilter);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'upcoming': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'overdue': return 'bg-afrikoni-red/20 text-afrikoni-red border-afrikoni-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Afrikoni Shield™
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Risk Management & Compliance Command Center
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section A: Real-Time Risk Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Real-Time Risk Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Platform Risk Score */}
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
                      Low
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {riskKPIs.platformRiskScore}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Platform Risk Score
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Open Incidents */}
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
                    {riskKPIs.openIncidents}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Open Incidents
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Compliance Tasks Due */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {riskKPIs.complianceTasksDue}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Compliance Tasks Due
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* KYC/AML Pending */}
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
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {riskKPIs.kycPending}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    KYC/AML Pending
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fraud Alerts 24h */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {riskKPIs.fraudAlerts24h}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Fraud Alerts (24h)
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipments at Risk */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {riskKPIs.shipmentsAtRisk}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Shipments at Risk
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Section B: Tax & Compliance Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Tax & Compliance Tracking
            </h2>
            <Link to="/dashboard/compliance">
              <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni">
                View Compliance Center
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {taxCompliance.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-afrikoni-text-dark">{item.country}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-afrikoni-text-dark">{item.hub}</h3>
                        <p className="text-sm text-afrikoni-text-dark/70">{item.type}</p>
                        <p className="text-xs text-afrikoni-text-dark/50 mt-1">
                          Deadline: {new Date(item.deadline).toLocaleDateString()}
                          {item.daysUntil < 0 && ` (${Math.abs(item.daysUntil)} days overdue)`}
                          {item.daysUntil >= 0 && item.daysUntil <= 7 && ` (${item.daysUntil} days remaining)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                      {item.reminderSent && (
                        <Badge variant="outline" className="text-xs">
                          Reminder Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: Anti-Corruption Monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Anti-Corruption Monitoring
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Whistleblower Reports</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{antiCorruptionData.whistleblowerReports}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">AI Flagged Anomalies</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{antiCorruptionData.aiFlaggedAnomalies}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Attempted Bribes</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{antiCorruptionData.attemptedBribeAlerts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Suspicious Edits</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{antiCorruptionData.suspiciousDocumentEdits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardContent className="p-5">
                <h3 className="font-semibold text-afrikoni-text-dark mb-4">Recent Audit Trail</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {antiCorruptionData.auditTrail.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border border-afrikoni-gold/20 rounded-lg bg-afrikoni-ivory"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-afrikoni-text-dark">{entry.action}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            entry.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            entry.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            entry.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {entry.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-afrikoni-text-dark/70">{entry.resource}</p>
                      <p className="text-xs text-afrikoni-text-dark/50 mt-1">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section D: Logistics & Customs Risk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Logistics & Customs Risk
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Delayed Shipments</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {logisticsRisk.shipmentsDelayed.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="p-4 border border-afrikoni-gold/20 rounded-afrikoni"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-afrikoni-text-dark">{shipment.id}</span>
                        <Badge className={`${getRiskLevelColor(shipment.riskLevel)} bg-opacity-10 border`}>
                          {shipment.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-afrikoni-text-dark/70 mb-1">
                        {shipment.origin} → {shipment.destination}
                      </p>
                      <p className="text-xs text-afrikoni-text-dark/50">
                        Delay: {shipment.delayHours}h • {shipment.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">High-Risk Routes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={logisticsRisk.highRiskRoutes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                    <XAxis dataKey="route" stroke="#2E2A1F" fontSize={10} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="#2E2A1F" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FDF8F0',
                        border: '1px solid #D4A937',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="riskScore" fill="#D4A937" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section E: Fraud Detection & Payments Integrity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Fraud Detection & Payments Integrity
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Fraud Score Trend (7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fraudData.dailyFraudScore}>
                    <defs>
                      <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E84855" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E84855" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                    <XAxis dataKey="date" stroke="#2E2A1F" fontSize={10} />
                    <YAxis stroke="#2E2A1F" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FDF8F0',
                        border: '1px solid #D4A937',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#E84855"
                      fillOpacity={1}
                      fill="url(#fraudGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Payment Integrity Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Chargebacks (7d)</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData.chargebacks7Days}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Suspicious Velocity</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData.suspiciousVelocity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Stolen Card Attempts</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData.stolenCardAttempts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Escrow Anomalies</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData.escrowAnomalies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section F: Early-Warning Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Early-Warning Alerts
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-afrikoni-text-dark">{alert.title}</h3>
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                alert.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-afrikoni-text-dark/70 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/50">
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            {alert.actionRequired && (
                              <span className="text-afrikoni-red font-medium">Action Required</span>
                            )}
                            {alert.acknowledged && (
                              <span className="text-afrikoni-green">Acknowledged</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-4">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Score Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
                Platform Risk Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskScoreHistory}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A937" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A937" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                  <XAxis dataKey="date" stroke="#2E2A1F" fontSize={12} />
                  <YAxis stroke="#2E2A1F" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FDF8F0',
                      border: '1px solid #D4A937',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#D4A937"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#riskGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

