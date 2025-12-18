/**
 * Afrikoni Shield™ - Risk Management Dashboard
 * Enterprise-grade command center for real-time compliance, fraud, logistics,
 * anti-corruption, KYC/AML, and operational risk management across 54 African countries
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, FileCheck, Lock,
  Truck, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Filter, Search, Eye, ExternalLink, RefreshCw, UserPlus,
  Users, Bell
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
// Removed mock data imports - using real database queries
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
import { useRealTimeSubscription } from '@/hooks/useRealTimeData';
import { toast } from 'sonner';

export default function RiskManagementDashboard() {
  // All hooks must be at the top - before any conditional returns
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('all'); // all, critical, high, medium, low
  const [riskKPIs, setRiskKPIs] = useState({
    platformRiskScore: 0,
    openIncidents: 0,
    complianceTasksDue: 0,
    kycPending: 0,
    fraudAlerts24h: 0,
    shipmentsAtRisk: 0
  });
  const [earlyWarningAlerts, setEarlyWarningAlerts] = useState([]);
  const [taxCompliance, setTaxCompliance] = useState([]);
  const [antiCorruptionData, setAntiCorruptionData] = useState({
    whistleblowerReports: 0,
    aiFlaggedAnomalies: 0,
    attemptedBribeAlerts: 0,
    suspiciousDocumentEdits: 0,
    employeeRedFlags: 0,
    partnerRedFlags: 0,
    auditTrail: []
  });
  const [logisticsRisk, setLogisticsRisk] = useState({
    shipmentsDelayed: [],
    highRiskRoutes: []
  });
  const [fraudData, setFraudData] = useState({
    items: [],
    dailyFraudScore: [],
    chargebacks7Days: 0,
    suspiciousVelocity: 0,
    stolenCardAttempts: 0,
    escrowAnomalies: 0
  });
  const [riskScoreHistory, setRiskScoreHistory] = useState([]);
  const [complianceByHub, setComplianceByHub] = useState([]);
  const [newRegistrations, setNewRegistrations] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadRiskData();
      loadNewRegistrations();
    }
  }, [hasAccess]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!hasAccess || !autoRefresh) return;

    const interval = setInterval(() => {
      console.log('[Risk Dashboard] Auto-refreshing data...');
      loadRiskData();
      loadNewRegistrations();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [hasAccess, autoRefresh]);

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

  // Load new user registrations (last 24 hours)
  const loadNewRegistrations = async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Get new users from auth.users (metadata)
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*, companies!inner(company_name, country, verification_status)')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const registrations = (recentUsers || []).map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name || 'Unknown',
        companyName: user.companies?.company_name || 'No company',
        country: user.companies?.country || 'Unknown',
        verificationStatus: user.companies?.verification_status || 'pending',
        createdAt: user.created_at,
        role: user.role || 'buyer'
      }));

      setNewRegistrations(registrations);

      // If there are new registrations, show a summary notification
      if (registrations.length > 0) {
        console.log(`[Risk Dashboard] ${registrations.length} new registrations in last 24h`);
      }

    } catch (error) {
      console.error('Error loading new registrations:', error);
      setNewRegistrations([]);
    }
  };

  // Real-time handler for new user registrations
  const handleNewRegistration = useCallback((payload) => {
    console.log('[Risk Dashboard] New user registered!', payload);
    
    // Show instant notification
    toast.success('New User Registration', {
      description: `A new user just registered on the platform.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = '/dashboard/admin/users'
      },
      duration: 10000 // Show for 10 seconds
    });

    // Reload registrations
    loadNewRegistrations();
  }, []);

  // Real-time handler for risk changes
  const handleRiskDataChange = useCallback((payload) => {
    console.log('[Risk Dashboard] Risk data changed:', payload.table, payload.eventType);
    
    // Show alert for critical events
    if (payload.table === 'disputes' && payload.eventType === 'INSERT') {
      toast.error('New Dispute Created', {
        description: 'A new dispute has been created and requires attention.',
        duration: 10000
      });
    } else if (payload.table === 'audit_log' && payload.data?.new?.risk_level === 'critical') {
      toast.error('Critical Risk Alert', {
        description: `${payload.data?.new?.action || 'Critical event'} detected`,
        duration: 10000
      });
    }

    // Reload risk data
    loadRiskData();
  }, []);

  // Subscribe to real-time updates
  useRealTimeSubscription('profiles', handleNewRegistration, null, [handleNewRegistration]);
  useRealTimeSubscription('disputes', handleRiskDataChange, null, [handleRiskDataChange]);
  useRealTimeSubscription('audit_log', handleRiskDataChange, null, [handleRiskDataChange]);
  useRealTimeSubscription('shipments', handleRiskDataChange, null, [handleRiskDataChange]);
  useRealTimeSubscription('companies', handleRiskDataChange, null, [handleRiskDataChange]);

  const loadRiskData = async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Load disputes (open incidents)
      const { data: disputes, count: disputesCount } = await supabase
        .from('disputes')
        .select('*', { count: 'exact' })
        .in('status', ['open', 'under_review']);

      // Load pending verifications (KYC/AML pending)
      const { data: pendingVerifications, count: kycPendingCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .eq('verification_status', 'pending');

      // Load high-risk audit logs (fraud alerts 24h)
      const { data: fraudAlerts } = await supabase
        .from('audit_log')
        .select('*')
        .in('risk_level', ['high', 'critical'])
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .in('status', ['failed', 'warning']);

      // Load shipments at risk (delayed or problematic)
      const { data: shipmentsAtRisk } = await supabase
        .from('shipments')
        .select('*')
        .in('status', ['pending', 'picked_up'])
        .lt('estimated_delivery', new Date().toISOString());

      // Load all disputes for risk score calculation
      const { data: allDisputes } = await supabase
        .from('disputes')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Load failed orders/payments
      const { data: failedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'refunded')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate Platform Risk Score (0-100, lower is better)
      // Based on: disputes, failed payments, high-risk audit logs
      const disputeWeight = allDisputes?.length || 0;
      const failedPaymentWeight = failedOrders?.length || 0;
      const fraudWeight = fraudAlerts?.length || 0;
      const riskScore = Math.min(100, Math.round(
        (disputeWeight * 5) + (failedPaymentWeight * 3) + (fraudWeight * 10)
      ));

      // Load compliance tasks (verifications pending review)
      const { data: complianceTasks } = await supabase
        .from('verifications')
        .select('*')
        .eq('status', 'pending');

      // Build early warning alerts from real data
      const alerts = [];
      
      // Add dispute alerts
      if (disputes && disputes.length > 0) {
        disputes.forEach(dispute => {
          alerts.push({
            id: `dispute-${dispute.id}`,
            timestamp: dispute.created_at,
            type: 'Dispute',
            category: 'Dispute',
            severity: dispute.status === 'open' ? 'high' : 'medium',
            title: `Open dispute: ${dispute.reason}`,
            message: `Open dispute: ${dispute.reason}`,
            description: `Order ${dispute.order_id?.slice(0, 8)} - ${dispute.reason}`,
            entity: `Order ${dispute.order_id?.slice(0, 8)}`,
            action: 'Review Dispute',
            actionRequired: dispute.status === 'open',
            acknowledged: false
          });
        });
      }

      // Add fraud alerts
      if (fraudAlerts && fraudAlerts.length > 0) {
        fraudAlerts.forEach(alert => {
          alerts.push({
            id: `fraud-${alert.id}`,
            timestamp: alert.created_at,
            type: 'Fraud Alert',
            category: 'Fraud',
            severity: alert.risk_level,
            title: `Suspicious activity: ${alert.action}`,
            message: `Suspicious activity: ${alert.action}`,
            description: `Suspicious activity detected: ${alert.action}`,
            entity: alert.entity_type || 'System',
            action: 'Investigate',
            actionRequired: alert.risk_level === 'critical' || alert.risk_level === 'high',
            acknowledged: false
          });
        });
      }

      // Add verification alerts
      if (pendingVerifications && pendingVerifications.length > 0) {
        pendingVerifications.slice(0, 5).forEach(company => {
          alerts.push({
            id: `verification-${company.id}`,
            timestamp: company.created_at,
            type: 'Verification Pending',
            category: 'KYC',
            severity: 'medium',
            title: `Company verification pending: ${company.company_name}`,
            message: `Company verification pending: ${company.company_name}`,
            description: `Company verification pending: ${company.company_name}`,
            entity: company.company_name,
            action: 'Review Verification',
            actionRequired: true,
            acknowledged: false
          });
        });
      }

      setRiskKPIs({
        platformRiskScore: riskScore,
        openIncidents: disputesCount || 0,
        complianceTasksDue: complianceTasks?.length || 0,
        kycPending: kycPendingCount || 0,
        fraudAlerts24h: fraudAlerts?.length || 0,
        shipmentsAtRisk: shipmentsAtRisk?.length || 0
      });

      setEarlyWarningAlerts(alerts.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ));

      // Load tax compliance data (placeholder - would need tax_filings table)
      setTaxCompliance([]);

      // Load anti-corruption data from audit logs
      const { data: corruptionLogs } = await supabase
        .from('audit_log')
        .select('*')
        .or('action.ilike.%bribe%,action.ilike.%corruption%,action.ilike.%fraud%')
        .gte('created_at', thirtyDaysAgo.toISOString());

      setAntiCorruptionData({
        whistleblowerReports: 0, // Would need separate table
        aiFlaggedAnomalies: corruptionLogs?.filter(log => 
          log.metadata?.ai_flagged === true
        ).length || 0,
        attemptedBribeAlerts: corruptionLogs?.filter(log => 
          log.action.toLowerCase().includes('bribe')
        ).length || 0,
        suspiciousDocumentEdits: corruptionLogs?.filter(log => 
          log.action.toLowerCase().includes('document')
        ).length || 0,
        employeeRedFlags: 0, // Would need separate table
        partnerRedFlags: 0, // Would need separate table
        auditTrail: (corruptionLogs || []).slice(0, 10).map(log => ({
          id: log.id,
          timestamp: log.created_at,
          user: log.actor_user?.full_name || log.actor_company?.company_name || 'System',
          action: log.action,
          resource: log.entity_type || 'N/A',
          status: log.status === 'failed' ? 'flagged' : 'normal',
          reason: log.metadata?.reason || 'Suspicious activity detected',
          severity: log.risk_level || 'medium'
        }))
      });

      // Load logistics risk data
      const { data: logisticsData } = await supabase
        .from('shipments')
        .select('*')
        .in('status', ['pending', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(10);

      const logisticsMapped = (logisticsData || []).map(shipment => ({
        id: shipment.id,
        orderId: shipment.order_id,
        status: shipment.status,
        riskLevel: shipment.estimated_delivery && 
          new Date(shipment.estimated_delivery) < new Date() ? 'high' : 'medium',
        carrier: shipment.carrier,
        origin: shipment.origin_address,
        destination: shipment.destination_address,
        delayHours: shipment.estimated_delivery ? 
          Math.floor((new Date() - new Date(shipment.estimated_delivery)) / (1000 * 60 * 60)) : 0,
        reason: 'Delivery delayed'
      }));

      setLogisticsRisk({
        shipmentsDelayed: logisticsMapped.filter(s => s.riskLevel === 'high'),
        highRiskRoutes: [] // Would need route aggregation logic
      });

      // Load fraud data from audit logs
      const { data: fraudLogs } = await supabase
        .from('audit_log')
        .select('*')
        .or('action.ilike.%fraud%,action.ilike.%payment%,action.ilike.%transaction%')
        .in('risk_level', ['high', 'critical'])
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      const fraudMapped = (fraudLogs || []).map(log => ({
        id: log.id,
        timestamp: log.created_at,
        type: log.action,
        severity: log.risk_level,
        actor: log.actor_user?.full_name || log.actor_company?.company_name || 'Unknown',
        amount: log.metadata?.amount || null,
        status: log.status
      }));

      // Calculate daily fraud scores for the last 7 days
      const dailyFraudScore = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayFraud = fraudMapped.filter(f => {
          const fraudDate = new Date(f.timestamp);
          return fraudDate >= dayStart && fraudDate <= dayEnd;
        }).length;
        
        dailyFraudScore.push({
          date: dayStart.toISOString().split('T')[0],
          score: dayFraud * 10
        });
      }

      setFraudData({
        items: fraudMapped,
        dailyFraudScore,
        chargebacks7Days: fraudMapped.filter(f => f.type?.includes('refund') || f.type?.includes('chargeback')).length,
        suspiciousVelocity: fraudMapped.filter(f => f.type?.includes('payment') && f.severity === 'high').length,
        stolenCardAttempts: fraudMapped.filter(f => f.type?.includes('card') || f.type?.includes('payment')).length,
        escrowAnomalies: fraudMapped.filter(f => f.type?.includes('escrow') || f.type?.includes('order')).length
      });

      // Risk score history (last 30 days)
      const dailyScores = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        // Calculate risk for this day
        const dayDisputes = allDisputes?.filter(d => 
          new Date(d.created_at) >= dayStart && new Date(d.created_at) <= dayEnd
        ).length || 0;
        const dayScore = Math.min(100, dayDisputes * 10);
        
        dailyScores.push({
          date: dayStart.toISOString().split('T')[0],
          score: dayScore
        });
      }
      setRiskScoreHistory(dailyScores);

      // Compliance by hub (group by country)
      const { data: companiesByCountry } = await supabase
        .from('companies')
        .select('country, verification_status')
        .not('country', 'is', null);

      const hubCompliance = {};
      (companiesByCountry || []).forEach(company => {
        if (!hubCompliance[company.country]) {
          hubCompliance[company.country] = {
            total: 0,
            verified: 0,
            pending: 0,
            rejected: 0
          };
        }
        hubCompliance[company.country].total++;
        if (company.verification_status === 'verified') hubCompliance[company.country].verified++;
        else if (company.verification_status === 'pending') hubCompliance[company.country].pending++;
        else if (company.verification_status === 'rejected') hubCompliance[company.country].rejected++;
      });

      setComplianceByHub(Object.entries(hubCompliance).map(([country, data]) => ({
        hub: country,
        country: country,
        complianceRate: data.total > 0 ? Math.round((data.verified / data.total) * 100) : 0,
        totalCompanies: data.total,
        verified: data.verified,
        pending: data.pending
      })));

    } catch (error) {
      console.error('Error loading risk data:', error);
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

  const filteredAlerts = Array.isArray(earlyWarningAlerts)
    ? (alertFilter === 'all'
        ? earlyWarningAlerts
        : earlyWarningAlerts.filter(alert => alert.severity === alertFilter))
    : [];

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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-afrikoni-text-dark/60">Last updated</div>
                <div className="text-sm font-medium text-afrikoni-text-dark">
                  {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadRiskData();
                  loadNewRegistrations();
                  setLastRefresh(new Date());
                  toast.success('Data refreshed');
                }}
                className="border-afrikoni-gold/30 hover:bg-afrikoni-gold/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-afrikoni-gold hover:bg-afrikoni-gold/90' : 'border-afrikoni-gold/30'}
              >
                <Bell className="w-4 h-4 mr-2" />
                {autoRefresh ? 'Live' : 'Paused'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* New Registrations Alert (Last 24h) */}
        {newRegistrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="border-afrikoni-gold/40 bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-gold/5 rounded-afrikoni-lg shadow-premium">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-afrikoni-gold/30 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-afrikoni-text-dark">
                      New User Registrations (Last 24h)
                    </h3>
                    <p className="text-sm text-afrikoni-text-dark/70">
                      {newRegistrations.length} new {newRegistrations.length === 1 ? 'user' : 'users'} registered in the last 24 hours
                    </p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {newRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 bg-white border border-afrikoni-gold/20 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-afrikoni-gold" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-afrikoni-text-dark">{reg.fullName}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {reg.role}
                              </Badge>
                              <Badge
                                className={`text-xs ${
                                  reg.verificationStatus === 'verified'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : reg.verificationStatus === 'pending'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {reg.verificationStatus}
                              </Badge>
                            </div>
                            <p className="text-sm text-afrikoni-text-dark/70 mb-1">{reg.email}</p>
                            <div className="flex items-center gap-3 text-xs text-afrikoni-text-dark/60">
                              <span>{reg.companyName}</span>
                              <span>•</span>
                              <span>{reg.country}</span>
                              <span>•</span>
                              <span>{new Date(reg.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <Link to={`/dashboard/admin/users`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {newRegistrations.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/dashboard/admin/users">
                      <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold">
                        View All Users
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                  {Array.isArray(logisticsRisk?.shipmentsDelayed) ? logisticsRisk.shipmentsDelayed.map((shipment) => (
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
                  )) : (
                    <div className="text-center text-afrikoni-text-dark/70 py-8">
                      No delayed shipments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">High-Risk Routes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Array.isArray(logisticsRisk?.highRiskRoutes) ? logisticsRisk.highRiskRoutes : []}>
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
                  <AreaChart data={Array.isArray(fraudData?.dailyFraudScore) ? fraudData.dailyFraudScore : []}>
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
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData?.chargebacks7Days || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Suspicious Velocity</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData?.suspiciousVelocity || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Stolen Card Attempts</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData?.stolenCardAttempts || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-1">Escrow Anomalies</p>
                    <p className="text-2xl font-bold text-afrikoni-text-dark">{fraudData?.escrowAnomalies || 0}</p>
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
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#D4A937"
                    strokeWidth={2}
                    dot={{ fill: '#D4A937', r: 4 }}
                    activeDot={{ r: 6 }}
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

