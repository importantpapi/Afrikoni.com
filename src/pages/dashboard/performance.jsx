/**
 * Supplier Performance Dashboard
 * View performance metrics and analytics
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Package, AlertTriangle, Star, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { 
  getSupplierPerformance,
  calculateSupplierPerformance
} from '@/lib/supabaseQueries/products';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import RequireCapability from '@/guards/RequireCapability';

function PerformanceDashboardInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading performance..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData
  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate - First line must check canLoadData
    if (!canLoadData) {
      if (!userId) {
        console.log('[PerformanceDashboard] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // ✅ KERNEL MANIFESTO: Rule 4 - Timeout with query cancellation
    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        console.warn('[PerformanceDashboard] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[PerformanceDashboard] Data is stale or first load - refreshing');
      loadData(abortSignal).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[PerformanceDashboard] Load error:', err);
        }
      });
    } else {
      console.log('[PerformanceDashboard] Data is fresh - skipping reload');
    }

    return () => {
      // ✅ KERNEL MANIFESTO: Rule 4 - Cleanup AbortController on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [canLoadData, userId, profileCompanyId, location.pathname, isStale, navigate]);

  const loadData = async (abortSignal) => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData (checked in useEffect)
    if (!profileCompanyId) {
      console.log('[PerformanceDashboard] No company_id - cannot load performance');
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal before queries
      if (abortSignal?.aborted) return;
      
      // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId for all queries
      // Calculate and get performance
      await calculateSupplierPerformance(profileCompanyId);
      const perf = await getSupplierPerformance(profileCompanyId);

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal after queries
      if (abortSignal?.aborted) return;

      setPerformance(perf);
      
      // ✅ REACTIVE READINESS FIX: Mark data as fresh ONLY after successful response
      if (perf && typeof perf === 'object') {
        lastLoadTimeRef.current = Date.now();
        markFresh();
      }
    } catch (err) {
      // ✅ KERNEL MANIFESTO: Rule 4 - Handle abort errors properly
      if (err.name === 'AbortError' || abortSignal?.aborted) return;
      console.error('[PerformanceDashboard] Error loading performance data:', err);
      setError(err.message || 'Failed to load performance data'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      toast.error('Failed to load performance data');
    } finally {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - always clean up
      if (!abortSignal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Error state checked BEFORE loading state
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // useEffect will retry automatically when canLoadData is true
        }}
      />
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  const metrics = [
    {
      label: 'On-Time Delivery Rate',
      value: performance?.on_time_delivery_rate?.toFixed(1) || '0',
      unit: '%',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Average Response Time',
      value: performance?.response_time_hours?.toFixed(1) || '0',
      unit: ' hours',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Dispute Rate',
      value: performance?.dispute_rate?.toFixed(2) || '0',
      unit: '%',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Average Rating',
      value: performance?.average_rating?.toFixed(1) || '0',
      unit: '/5',
      icon: Star,
      color: 'text-afrikoni-gold',
      bgColor: 'bg-afrikoni-gold/20'
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Performance Metrics</h1>
          <p className="text-afrikoni-text-dark/70">Track your supplier performance and KPIs</p>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full ${metric.bgColor}`}>
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">{metric.label}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {metric.value}{metric.unit}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-2">On-Time Delivery</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{ width: `${performance?.on_time_delivery_rate || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                      {performance?.on_time_delivery_rate?.toFixed(1) || 0}% of orders delivered on time
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-2">Average Rating</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-afrikoni-gold h-4 rounded-full"
                        style={{ width: `${((performance?.average_rating || 0) / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                      {performance?.average_rating?.toFixed(1) || 0} / 5.0 average rating
                    </p>
                  </div>
                </div>
              </div>

              {performance?.last_calculated_at && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-afrikoni-text-dark/60">
                    Last calculated: {new Date(performance.last_calculated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function PerformanceDashboard() {
  return (
    <>
      {/* PHASE 5B: Performance requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <PerformanceDashboardInner />
      </RequireCapability>
    </>
  );
}

