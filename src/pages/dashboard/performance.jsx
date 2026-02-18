/**
 * Supplier Performance Dashboard
 * Shows how well you're doing as a seller — delivery, ratings, response time
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Package, AlertTriangle, Star, BarChart3, RefreshCw } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';
import { toast } from 'sonner';

export default function PerformanceDashboard() {
  const { profileCompanyId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();

  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const isSeller = capabilities?.can_sell === true;

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadData(signal);

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [canLoadData, profileCompanyId]);

  const loadData = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      // Load supplier performance from supplier_performance table
      const { data, error: dbError } = await supabase
        .from('supplier_performance')
        .select('*')
        .eq('company_id', profileCompanyId)
        .single();

      if (signal?.aborted) return;
      if (dbError && dbError.code !== 'PGRST116') throw dbError;

      setPerformance(data || null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err.message || 'Failed to load performance data');
      toast.error('Could not load performance data');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  if (!isSystemReady) return <SpinnerWithTimeout message="Loading performance..." ready={false} />;
  if (error) return <ErrorState message={error} onRetry={() => loadData()} />;

  const metrics = [
    {
      label: 'On-Time Delivery',
      description: 'How often you deliver on time',
      value: performance?.on_time_delivery_rate != null
        ? `${performance.on_time_delivery_rate.toFixed(1)}%`
        : '—',
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/20',
      bar: performance?.on_time_delivery_rate || 0,
      barColor: 'bg-emerald-500'
    },
    {
      label: 'Response Time',
      description: 'How fast you reply to buyers',
      value: performance?.response_time_hours != null
        ? `${performance.response_time_hours.toFixed(1)}h`
        : '—',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'border-blue-200 dark:border-blue-500/20',
      bar: performance?.response_time_hours ? Math.max(0, 100 - performance.response_time_hours * 4) : 0,
      barColor: 'bg-blue-500'
    },
    {
      label: 'Dispute Rate',
      description: 'Percentage of orders with disputes',
      value: performance?.dispute_rate != null
        ? `${performance.dispute_rate.toFixed(2)}%`
        : '—',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-500/10',
      border: 'border-red-200 dark:border-red-500/20',
      bar: performance?.dispute_rate ? Math.max(0, 100 - performance.dispute_rate * 10) : 100,
      barColor: 'bg-red-500'
    },
    {
      label: 'Buyer Rating',
      description: 'Average rating from your buyers',
      value: performance?.average_rating != null
        ? `${performance.average_rating.toFixed(1)} / 5`
        : '—',
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-500/20',
      bar: performance?.average_rating ? (performance.average_rating / 5) * 100 : 0,
      barColor: 'bg-amber-500'
    }
  ];

  return (
    <div className="os-page-layout space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Performance</h1>
          <p className="text-os-text-secondary mt-1">
            See how buyers rate your service and where you can improve.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      {isLoading && !performance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-xl bg-os-surface-solid animate-pulse" />
          ))}
        </div>
      ) : !performance ? (
        <EmptyState
          type="performance"
          title="No performance data yet"
          description="Complete your first trade to start building your performance score. Buyers will see this when deciding who to work with."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Surface className={`p-6 border ${metric.border} h-full`}>
                <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center mb-4`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <p className="text-sm text-os-text-secondary mb-1">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</p>
                <p className="text-xs text-os-text-secondary mb-3">{metric.description}</p>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-os-stroke rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.barColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${metric.bar}%` }}
                  />
                </div>
              </Surface>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tips Section */}
      {!isSeller && (
        <Surface variant="soft" className="p-6 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-400">Performance tracking is for sellers</p>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                Apply to become a verified seller on Afrikoni to start building your performance score and attract more buyers.
              </p>
            </div>
          </div>
        </Surface>
      )}

      {performance?.last_calculated_at && (
        <p className="text-xs text-os-text-secondary text-center">
          Last updated: {new Date(performance.last_calculated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
