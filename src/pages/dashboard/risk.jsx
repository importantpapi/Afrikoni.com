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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
// Removed mock data imports - using real database queries
// NOTE: Admin check done at route level - removed isAdmin import
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';
import { useRealTimeSubscription } from '@/hooks/useRealTimeData';
import { toast } from 'sonner';

export default function RiskManagementDashboard() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  
  // ✅ KERNEL COMPLIANCE: Derive role from capabilities instead of role field
  const derivedRole = capabilities?.can_sell && capabilities?.can_buy ? 'hybrid' 
    : capabilities?.can_sell ? 'seller' 
    : capabilities?.can_logistics ? 'logistics' 
    : 'buyer';
  
  // All hooks must be at the top - before any conditional returns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [allUsers, setAllUsers] = useState([]); // All users (no time filter)
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false); // Toggle between recent and all
  const [searchEmail, setSearchEmail] = useState(''); // Search by email
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [contactSubmissions, setContactSubmissions] = useState([]); // Contact form submissions

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading risk dashboard..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check admin access using kernel
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      return;
    }

    loadRiskData();
    loadNewRegistrations();
    loadAllUsers(); // Also load all users
  }, [canLoadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!hasAccess || !autoRefresh || !authReady) return;

    const interval = setInterval(() => {
      console.log('[Risk Dashboard] Auto-refreshing data...');
      loadRiskData();
      loadNewRegistrations();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [hasAccess, autoRefresh, isSystemReady]);

  // Load ALL users (no time filter) for search and complete visibility
  const loadAllUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('[Risk Dashboard] Loading ALL users...');

      // Query profiles - using public read policy (should work for all authenticated users)
      const { data: allUsersData, error: allUsersError } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (
            id,
            company_name,
            country,
            city,
            phone,
            email,
            verification_status,
            verified,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5000); // Increased limit to show all users

      if (allUsersError) {
        console.error('❌ Error fetching all users:', allUsersError);
        console.error('Error details:', {
          message: allUsersError.message,
          code: allUsersError.code,
          details: allUsersError.details,
          hint: allUsersError.hint
        });
        
        // Show user-friendly error message
        if (allUsersError.message?.includes('infinite recursion')) {
          toast.error('Database policy error. Please refresh the page.', {
            description: 'If the issue persists, contact support.'
          });
        } else if (allUsersError.code === '42501' || allUsersError.message?.includes('permission')) {
          toast.error('Permission denied. Admin access required to view all users.', {
            description: 'Please ensure you have admin privileges.'
          });
        } else {
          toast.error('Failed to load users', {
            description: allUsersError.message || 'Unknown error occurred'
          });
        }
        setAllUsers([]);
        setIsLoadingUsers(false);
        return; // Don't throw - just return empty array
      }

      console.log(`[Risk Dashboard] ✅ Found ${allUsersData?.length || 0} total users from profiles table`);
      
      // Debug: Log all user emails to verify we're getting all users
      if (allUsersData && allUsersData.length > 0) {
        console.log('📋 All user emails from database:', allUsersData.map(u => ({
          email: u.email || 'No email',
          id: u.id,
          created: u.created_at,
          role: u.role
        })));
        console.log(`✅ Successfully loaded ${allUsersData.length} users from Supabase`);
      } else {
        console.warn('⚠️ No users found in profiles table - this might be an RLS issue');
        toast.warning('No users found. Check RLS policies or admin access.');
      }

      // Process users with activity
      const processedUsers = await Promise.all((allUsersData || []).map(async (user) => {
        let orderCount = 0;
        let rfqCount = 0;
        let productCount = 0;

        try {
          if (user.company_id) {
            // Get orders count
            const { count: orders } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .or(`buyer_company_id.eq.${user.company_id},seller_company_id.eq.${user.company_id}`);
            orderCount = orders || 0;

            // RFQs use buyer_company_id, not company_id
            const { count: rfqs } = await supabase
              .from('rfqs')
              .select('*', { count: 'exact', head: true })
              .eq('buyer_company_id', user.company_id);
            rfqCount = rfqs || 0;

            // Get products count
            const { count: products } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', user.company_id);
            productCount = products || 0;
          } else {
            // If no company_id, check RFQs by buyer email (for RFQs created without company)
            try {
              if (user.email) {
                const { count: rfqsByEmail } = await supabase
                  .from('rfqs')
                  .select('*', { count: 'exact', head: true })
                  .eq('buyer_email', user.email);
                if (rfqsByEmail && rfqsByEmail > 0) {
                  rfqCount = rfqsByEmail;
                }
              }
            } catch (emailRfqError) {
              // Ignore - not all RFQs have buyer_email
              console.debug('No RFQs found by email:', emailRfqError);
            }
          }
        } catch (activityError) {
          console.warn('Error fetching user activity:', activityError);
        }

        // ✅ KERNEL COMPLIANCE: Derive role from user's company capabilities if available
        // Default to 'buyer' since most users are buyers and we don't have capabilities for all users
        let userRole = 'buyer'; // Default
        if (user.company_id) {
          // Try to get capabilities for this user's company (non-blocking)
          try {
            const { data: userCapabilities } = await supabase
              .from('company_capabilities')
              .select('can_buy, can_sell, can_logistics')
              .eq('company_id', user.company_id)
              .maybeSingle();
            
            if (userCapabilities) {
              if (userCapabilities.can_sell && userCapabilities.can_buy) {
                userRole = 'hybrid';
              } else if (userCapabilities.can_sell) {
                userRole = 'seller';
              } else if (userCapabilities.can_logistics) {
                userRole = 'logistics';
              }
            }
          } catch (capError) {
            // Non-critical - use default 'buyer'
            console.debug('Could not fetch capabilities for user:', user.id, capError);
          }
        }

        return {
          id: user.id,
          email: user.email || 'No email',
          fullName: user.full_name || user.email?.split('@')[0] || 'Unknown User',
          companyId: user.company_id,
          companyName: user.companies?.company_name || user.company_name || 'No company yet',
          country: user.companies?.country || user.country || 'Not specified',
          city: user.companies?.city || user.city || 'Not specified',
          verificationStatus: user.companies?.verification_status || 'unverified',
          isVerified: user.companies?.verified || false,
          createdAt: user.created_at,
          role: userRole, // ✅ KERNEL COMPLIANCE: Derived from capabilities, defaults to 'buyer'
          orderCount,
          rfqCount,
          productCount,
          totalActivity: orderCount + rfqCount + productCount,
          phone: user.companies?.phone || user.phone || 'N/A',
          isAdmin: user.is_admin || false
        };
      }));

      setAllUsers(processedUsers);
      console.log(`[Risk Dashboard] Processed ${processedUsers.length} total users`);
      
      // Log all users for complete visibility
      console.log('✅ ALL USERS LOADED:', processedUsers.map(u => ({
        email: u.email,
        name: u.fullName,
        role: u.role,
        activity: u.totalActivity,
        registered: u.createdAt
      })));
      
      console.log(`📊 Total: ${processedUsers.length} users | Active: ${processedUsers.filter(u => u.totalActivity > 0).length} | Inactive: ${processedUsers.filter(u => u.totalActivity === 0).length}`);

      setIsLoadingUsers(false);
    } catch (error) {
      console.error('Error loading all users:', error);
      toast.error('Failed to load users', { description: error.message });
      setAllUsers([]);
      setIsLoadingUsers(false);
    }
  };

  // Load new user registrations (last 30 days to catch all recent users)
  const loadNewRegistrations = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log('[Risk Dashboard] Loading registrations since:', thirtyDaysAgo.toISOString());

      // Get users from last 30 days (with LEFT join to companies)
      // Use auth.users joined with profiles for complete user data
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (
            id,
            company_name,
            country,
            city,
            phone,
            email,
            verification_status,
            verified,
            created_at
          )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000); // Increased limit to get all users

      if (usersError) {
        console.error('Error fetching registrations:', usersError);
        throw usersError;
      }

      console.log(`[Risk Dashboard] ✅ Found ${recentUsers?.length || 0} registrations from last 30 days`);
      
      // Debug: Log all user emails to verify we're getting all users
      if (recentUsers && recentUsers.length > 0) {
        console.log('📋 User emails from database (last 30 days):', recentUsers.map(u => ({
          email: u.email || 'No email',
          id: u.id,
          created: u.created_at,
          role: u.role
        })));
        console.log(`✅ Successfully loaded ${recentUsers.length} recent users from Supabase`);
      } else {
        console.warn('⚠️ No users found in last 30 days. This might be normal if all users are older.');
        // Don't show warning toast for this - it's expected if users are older than 30 days
      }

      // Get user activity (orders, RFQs, products)
      const registrations = await Promise.all((recentUsers || []).map(async (user) => {
        // Get user activity counts
        let orderCount = 0;
        let rfqCount = 0;
        let productCount = 0;

        try {
          // Get orders count (check both buyer and seller company IDs)
          if (user.company_id) {
            const { count: orders } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .or(`buyer_company_id.eq.${user.company_id},seller_company_id.eq.${user.company_id}`);
            orderCount = orders || 0;

            // Get RFQs count - RFQs use buyer_company_id, not company_id
            const { count: rfqs } = await supabase
              .from('rfqs')
              .select('*', { count: 'exact', head: true })
              .eq('buyer_company_id', user.company_id);
            rfqCount = rfqs || 0;

            // Get products count
            const { count: products } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', user.company_id);
            productCount = products || 0;
          } else {
            // If no company_id, check RFQs by buyer email (for RFQs created without company)
            // This handles users who created RFQs before company creation
            try {
              const { count: rfqsByEmail } = await supabase
                .from('rfqs')
                .select('*', { count: 'exact', head: true })
                .eq('buyer_email', user.email || '');
              if (rfqsByEmail > 0) {
                rfqCount = rfqsByEmail;
              }
            } catch (emailRfqError) {
              // Ignore - not all RFQs have buyer_email
            }
          }
        } catch (activityError) {
          console.warn('Error fetching user activity:', activityError);
        }

        return {
          id: user.id,
          email: user.email || 'No email',
          fullName: user.full_name || user.email?.split('@')[0] || 'Unknown User',
          companyId: user.company_id,
          companyName: user.companies?.company_name || user.company_name || 'No company yet',
          country: user.companies?.country || user.country || 'Not specified',
          city: user.companies?.city || user.city || 'Not specified',
          verificationStatus: user.companies?.verification_status || 'unverified',
          isVerified: user.companies?.verified || false,
          createdAt: user.created_at,
          role: 'buyer', // ✅ KERNEL COMPLIANCE: Default to buyer (capabilities would require per-user query)
          // Activity stats
          orderCount,
          rfqCount,
          productCount,
          totalActivity: orderCount + rfqCount + productCount,
          // Additional info
          phone: user.companies?.phone || user.phone || 'N/A',
          isAdmin: user.is_admin || false
        };
      }));

      // Sort by creation date (newest first)
      registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNewRegistrations(registrations);

      console.log(`[Risk Dashboard] Processed ${registrations.length} registrations with activity data`);
      
      // Log all recent registrations for complete visibility
      console.log('📋 RECENT REGISTRATIONS (Last 30 days):', registrations.map(r => ({
        email: r.email,
        name: r.fullName,
        company: r.companyName,
        role: r.role,
        activity: r.totalActivity,
        registered: r.createdAt
      })));
      
      console.log(`📊 Summary: ${registrations.length} recent users | ${registrations.filter(r => r.totalActivity > 0).length} active | ${registrations.filter(r => r.totalActivity === 0).length} need attention`);

    } catch (error) {
      console.error('Error loading new registrations:', error);
      toast.error('Failed to load registrations', {
        description: error.message
      });
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
      setLoading(true);
      setError(null);
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

      // Load recent contact form submissions (last 7 days, unread)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: contactSubmissionsData } = await supabase
        .from('contact_submissions')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      
      setContactSubmissions(contactSubmissionsData || []);

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

      // Add contact form submission alerts
      if (contactSubmissionsData && contactSubmissionsData.length > 0) {
        contactSubmissionsData.forEach(submission => {
          // Determine severity based on category
          let severity = 'low';
          if (['complaint', 'dispute', 'fraud', 'security'].includes(submission.category?.toLowerCase())) {
            severity = 'high';
          } else if (['support', 'technical', 'billing'].includes(submission.category?.toLowerCase())) {
            severity = 'medium';
          }

          alerts.push({
            id: `contact-${submission.id}`,
            timestamp: submission.created_at,
            type: 'Contact Submission',
            category: 'Customer Service',
            severity: severity,
            title: `${submission.name} - ${submission.category || 'General'} Inquiry`,
            message: submission.subject || submission.message?.substring(0, 100) || 'No subject',
            description: submission.message?.substring(0, 200) || '',
            entity: `${submission.name} (${submission.email})`,
            action: 'Respond',
            actionRequired: severity === 'high',
            acknowledged: false,
            metadata: submission // Store full submission data
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

    } catch (err) {
      console.error('[RiskDashboard] Error loading risk data:', err);
      setError(err.message || 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (loading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadRiskData}
      />
    );
  }

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
    <>
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

        {/* New Registrations - COMPLETE USER VISIBILITY WITH SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="border-afrikoni-gold/40 bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-gold/5 rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-afrikoni-gold/30 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-afrikoni-text-dark">
                      {showAllUsers ? 'All Users' : 'Recent Registrations (Last 30 Days)'}
                    </h3>
                    <p className="text-sm text-afrikoni-text-dark/70">
                      {showAllUsers 
                        ? `${allUsers.length} total users • Complete activity tracking` 
                        : `${newRegistrations.length} recent users • Complete activity tracking`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAllUsers ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setShowAllUsers(!showAllUsers);
                      if (!showAllUsers && allUsers.length === 0) {
                        loadAllUsers();
                      }
                    }}
                    className={showAllUsers ? 'bg-afrikoni-gold hover:bg-afrikoni-gold/90' : 'border-afrikoni-gold/30'}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {showAllUsers ? 'All Users' : 'Show All'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadNewRegistrations();
                      loadAllUsers();
                    }}
                    className="border-afrikoni-gold/30"
                    disabled={isLoadingUsers}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    Reload
                  </Button>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-gold" />
                  <Input
                    type="text"
                    placeholder="Search by email (e.g., binoscientific@gmail.com)..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold"
                  />
                </div>
                {searchEmail && (
                  <p className="text-xs text-afrikoni-text-dark/60 mt-2">
                    Searching for: <span className="font-semibold">{searchEmail}</span>
                    <button 
                      onClick={() => setSearchEmail('')}
                      className="ml-2 text-afrikoni-gold hover:underline"
                    >
                      Clear
                    </button>
                  </p>
                )}
              </div>

              {(() => {
                // Filter users based on search and view mode
                let displayUsers = showAllUsers ? allUsers : newRegistrations;
                
                if (searchEmail) {
                  displayUsers = displayUsers.filter(u => 
                    u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
                    u.fullName?.toLowerCase().includes(searchEmail.toLowerCase()) ||
                    u.companyName?.toLowerCase().includes(searchEmail.toLowerCase())
                  );
                }

                if (displayUsers.length === 0) {
                  return (
                    <div className="text-center py-8 text-afrikoni-text-dark/60">
                      <Users className="w-12 h-12 mx-auto mb-3 text-afrikoni-gold/40" />
                      {searchEmail ? (
                        <div>
                          <p className="font-semibold mb-2">No users found matching "{searchEmail}"</p>
                          <p className="text-sm">Try searching with a different email or name</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchEmail('')}
                            className="mt-4 border-afrikoni-gold/30"
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold mb-2">
                            {showAllUsers ? 'No users in database' : 'No new registrations in the last 30 days'}
                          </p>
                          <p className="text-sm">
                            {showAllUsers 
                              ? 'The database appears to be empty or users are not being created properly.'
                              : 'Click "Show All" to see all users regardless of registration date.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                <>
                  {/* Results Count */}
                  <div className="mb-3 p-3 bg-white rounded-lg border border-afrikoni-gold/20">
                    <p className="text-sm font-medium text-afrikoni-text-dark">
                      📊 Showing <span className="text-afrikoni-gold font-bold">{displayUsers.length}</span> {displayUsers.length === 1 ? 'user' : 'users'}
                      {searchEmail && <span className="text-afrikoni-text-dark/70"> matching your search</span>}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {displayUsers.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-5 bg-white border border-afrikoni-gold/20 rounded-lg hover:shadow-md transition-all hover:border-afrikoni-gold/40"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* User Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-afrikoni-gold">
                                {reg.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Name & Status */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-bold text-afrikoni-text-dark">{reg.fullName}</h4>
                                <Badge variant="outline" className="text-xs capitalize bg-afrikoni-gold/10">
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
                                {reg.isAdmin && (
                                  <Badge className="text-xs bg-red-50 text-red-700 border-red-200">
                                    ADMIN
                                  </Badge>
                                )}
                              </div>

                              {/* Contact & Company */}
                              <div className="space-y-1 mb-3">
                                <p className="text-sm text-afrikoni-text-dark/80 font-medium">
                                  📧 {reg.email}
                                </p>
                                <p className="text-sm text-afrikoni-text-dark/70">
                                  🏢 {reg.companyName}
                                </p>
                                <p className="text-sm text-afrikoni-text-dark/70">
                                  🌍 {reg.country}
                                </p>
                                {reg.phone !== 'N/A' && (
                                  <p className="text-sm text-afrikoni-text-dark/70">
                                    📱 {reg.phone}
                                  </p>
                                )}
                              </div>

                              {/* Activity Stats - WHAT THEY DO */}
                              <div className="bg-afrikoni-ivory/50 rounded-lg p-3 mb-3">
                                <p className="text-xs font-semibold text-afrikoni-text-dark/70 mb-2 uppercase tracking-wide">
                                  Activity Summary
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-afrikoni-text-dark">
                                      {reg.orderCount}
                                    </div>
                                    <div className="text-xs text-afrikoni-text-dark/60">Orders</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-afrikoni-text-dark">
                                      {reg.rfqCount}
                                    </div>
                                    <div className="text-xs text-afrikoni-text-dark/60">RFQs</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-afrikoni-text-dark">
                                      {reg.productCount}
                                    </div>
                                    <div className="text-xs text-afrikoni-text-dark/60">Products</div>
                                  </div>
                                </div>
                                {reg.totalActivity === 0 && (
                                  <p className="text-xs text-center text-afrikoni-text-dark/50 mt-2 italic">
                                    No activity yet
                                  </p>
                                )}
                                {reg.totalActivity > 0 && (
                                  <p className="text-xs text-center text-afrikoni-gold font-medium mt-2">
                                    ✓ Active user ({reg.totalActivity} total actions)
                                  </p>
                                )}
                              </div>

                              {/* Registration Time */}
                              <div className="text-xs text-afrikoni-text-dark/50">
                                📅 Registered: {new Date(reg.createdAt).toLocaleString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Link to={`/dashboard/admin/users`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="whitespace-nowrap border-afrikoni-gold/30 hover:bg-afrikoni-gold/10"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </Button>
                            </Link>
                            {reg.companyId && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(reg.id)}
                                className="whitespace-nowrap text-xs"
                              >
                                Copy ID
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {displayUsers.length > 10 && (
                    <div className="mt-4 text-center">
                      <Link to="/dashboard/admin/users">
                        <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold">
                          View All Users in Admin Panel
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
            </CardContent>
          </Card>
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
                {filteredAlerts.map((alert) => {
                  const isContactSubmission = alert.type === 'Contact Submission';
                  const submission = alert.metadata;
                  
                  return (
                  <div
                    key={alert.id}
                    className={`p-5 border-2 rounded-lg transition-all ${
                      isContactSubmission
                        ? 'border-afrikoni-gold bg-gradient-to-r from-afrikoni-cream/50 to-afrikoni-ivory/30 hover:shadow-lg hover:border-afrikoni-gold/60'
                        : 'border-afrikoni-gold/20 hover:bg-afrikoni-sand/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-4 h-4 rounded-full mt-1.5 flex-shrink-0 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {isContactSubmission && (
                              <div className="w-10 h-10 bg-gradient-to-br from-afrikoni-gold to-afrikoni-chestnut rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                📧
                              </div>
                            )}
                            <h3 className={`font-bold text-afrikoni-text-dark ${isContactSubmission ? 'text-lg' : ''}`}>
                              {alert.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize font-semibold ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-300 shadow-sm' :
                                alert.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm' :
                                'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                              }`}
                            >
                              {alert.severity}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-semibold ${
                                isContactSubmission 
                                  ? 'bg-afrikoni-gold/20 text-afrikoni-chestnut border-afrikoni-gold/40' 
                                  : ''
                              }`}
                            >
                              {alert.category}
                            </Badge>
                            {isContactSubmission && submission?.category && (
                              <Badge className="bg-afrikoni-gold text-white border-0 text-xs font-bold px-3 py-1">
                                {submission.category}
                              </Badge>
                            )}
                          </div>
                          
                          {isContactSubmission && submission ? (
                            <div className="space-y-3 mb-3">
                              <div className="bg-white/80 rounded-lg p-4 border border-afrikoni-gold/20">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide mb-1">Contact</div>
                                    <div className="text-sm font-bold text-afrikoni-chestnut">{submission.name}</div>
                                    <a 
                                      href={`mailto:${submission.email}`}
                                      className="text-xs text-afrikoni-gold hover:underline font-medium"
                                    >
                                      {submission.email}
                                    </a>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide mb-1">Submitted</div>
                                    <div className="text-sm text-afrikoni-text-dark">
                                      {new Date(submission.created_at).toLocaleString('en-US', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                {submission.subject && (
                                  <div className="mb-2">
                                    <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide mb-1">Subject</div>
                                    <div className="text-sm font-semibold text-afrikoni-chestnut">{submission.subject}</div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide mb-2">Message</div>
                                  <div className="text-sm text-afrikoni-text-dark/80 bg-afrikoni-cream/30 p-3 rounded border-l-3 border-afrikoni-gold line-clamp-3">
                                    {submission.message}
                                  </div>
                                </div>
                                {submission.attachments && submission.attachments.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-afrikoni-gold/20">
                                    <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide mb-2">Attachments</div>
                                    <div className="flex flex-wrap gap-2">
                                      {submission.attachments.map((att, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs bg-afrikoni-ivory/50">
                                          📎 {typeof att === 'string' ? att.split('/').pop() : att.name || 'Attachment'}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-afrikoni-text-dark/70 mb-2">{alert.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/50">
                            <span className="font-medium">{new Date(alert.timestamp).toLocaleString()}</span>
                            {alert.actionRequired && (
                              <span className="text-afrikoni-red font-bold bg-red-50 px-2 py-1 rounded">⚡ Action Required</span>
                            )}
                            {alert.acknowledged && (
                              <span className="text-afrikoni-green">Acknowledged</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isContactSubmission ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white border-afrikoni-gold font-semibold shadow-md"
                            onClick={() => {
                              if (submission?.email) {
                                window.location.href = `mailto:${submission.email}?subject=Re: ${submission.subject || 'Your Inquiry'}`;
                              }
                            }}
                          >
                            📧 Reply
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="ml-4">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
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
    </>
  );
}

