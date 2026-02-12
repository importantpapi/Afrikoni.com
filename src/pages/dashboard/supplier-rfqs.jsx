import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  FileText, Search, MapPin, Package,
  Calendar, ArrowRight, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RFQ_STATUS_LABELS } from '@/constants/status';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

function SupplierRFQsInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();

  const navigate = useNavigate();
  const location = useLocation();
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('matched');

  // ✅ GLOBAL HARDENING: Data freshness tracking (30 second threshold)
  const { isStale, markFresh, refresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading RFQs..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData
  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate - First line must check canLoadData
    if (!canLoadData) {
      if (!userId) {
        navigate('/login');
        return;
      }
      return;
    }

    // ✅ FOUNDATION FIX: Check capabilities instead of role
    const isSellerApproved = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
    if (!isSellerApproved) {
      toast.error('Supplier access required');
      navigate('/dashboard');
      return;
    }

    // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // ✅ KERNEL MANIFESTO: Rule 4 - Timeout with query cancellation
    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        console.warn('[SupplierRFQs] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale ||
      !lastLoadTimeRef.current ||
      (Date.now() - lastLoadTimeRef.current > 30000);

    if (shouldRefresh) {
      console.log('[SupplierRFQs] Data is stale or first load - refreshing');
      loadRFQs(abortSignal).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[SupplierRFQs] Load error:', err);
        }
      });
    } else {
      console.log('[SupplierRFQs] Data is fresh - skipping reload');
    }

    return () => {
      // ✅ KERNEL MANIFESTO: Rule 4 - Cleanup AbortController on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate, capabilities]);

  const loadRFQs = async (abortSignal) => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData (checked in useEffect)
    try {
      setIsLoading(true);
      setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal before queries
      if (abortSignal?.aborted) return;

      // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId for all queries
      // Load RFQs that are matched AND supplier is in shortlist
      // Note: Buyer identity is NOT shown - only RFQ details
      // ✅ KERNEL MIGRATION: Querying trades table for RFQs
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('trades')
        .select(`
          *,
          categories:category_id(*)
        `)
        .eq('status', 'rfq_created')
        .eq('trade_type', 'rfq')
        .order('created_at', { ascending: false });

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal after queries
      if (abortSignal?.aborted) return;

      // ✅ GLOBAL HARDENING: Enhanced error logging
      if (rfqsError) {
        logError('loadRFQs', rfqsError, {
          table: 'rfqs',
          companyId: profileCompanyId, // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId
          userId: userId
        });
        setError('Failed to load RFQs. Please try again.'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
        toast.error('Failed to load RFQs');
        return; // Don't mark fresh on error
      }

      // Filter to only RFQs where this supplier is in matched_supplier_ids
      const matchedRFQs = (rfqsData || []).filter(rfq => {
        if (!rfq.matched_supplier_ids || !Array.isArray(rfq.matched_supplier_ids)) {
          return false;
        }
        return rfq.matched_supplier_ids.includes(profileCompanyId); // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId
      });

      setRfqs(matchedRFQs);

      // ✅ GLOBAL HARDENING: Mark fresh ONLY on successful load
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (error) {
      // ✅ KERNEL MANIFESTO: Rule 4 - Handle abort errors properly
      if (error.name === 'AbortError' || abortSignal?.aborted) return;
      logError('loadRFQs', error, {
        table: 'rfqs',
        companyId: profileCompanyId, // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId
        userId: userId
      });
      setError('Failed to load RFQs. Please try again.'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      toast.error('Failed to load RFQs');
    } finally {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - always clean up
      if (!abortSignal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = !searchQuery ||
      rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.delivery_location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="os-page os-stagger">
      <div className="space-y-6">
        <Surface className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em]">Trade OS</p>
              <h1 className="text-2xl md:text-3xl font-semibold mt-2">RFQs Received</h1>
              <p className="mt-1">
                Matched RFQs curated for your verified capacity.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  refresh();
                  lastLoadTimeRef.current = null;
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/dashboard/rfqs')} variant="outline">
                View All RFQs
              </Button>
            </div>
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="os-input pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="os-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold">How Matching Works</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong className="">RFQs are matched based on relevance and capacity.</strong>
            </p>
            <p>We match only verified suppliers who:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Operate in relevant product categories</li>
              <li>Have capacity for requested quantities</li>
              <li>Can deliver to the specified destination</li>
              <li>Meet quality and verification standards</li>
            </ul>
            <p className="mt-3 text-xs">
              This keeps the signal high and improves conversion rates.
            </p>
          </div>
        </Surface>

        <div className="grid gap-4">
          {/* ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Error state checked FIRST */}
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setError(null);
                // useEffect will retry automatically when canLoadData is true
              }}
            />
          ) : isLoading ? (
            <CardSkeleton count={3} />
          ) : filteredRFQs.length === 0 ? (
            <Surface className="p-12">
              <EmptyState
                icon={FileText}
                title="No matched RFQs"
                description="You'll see RFQs here once your company is matched on relevance and capacity."
              />
            </Surface>
          ) : (
            filteredRFQs.map((rfq) => (
              <Surface
                key={rfq.id}
                className="p-6 os-panel-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {rfq.title}
                      </h3>
                      <StatusBadge tone="info">
                        {RFQ_STATUS_LABELS[rfq.status] || 'Matched'}
                      </StatusBadge>
                      <SignalChip tone="emerald">
                        Match
                      </SignalChip>
                    </div>

                    {rfq.description && (
                      <p className="text-sm mb-4 line-clamp-2">
                        {rfq.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="">
                          {rfq.quantity} {rfq.unit || 'units'}
                        </span>
                      </div>
                      {rfq.delivery_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="">{rfq.delivery_location}</span>
                        </div>
                      )}
                      {rfq.categories && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="">{rfq.categories.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="">
                          {format(new Date(rfq.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 mb-4">
                      <p className="text-xs">
                        <strong className="">Privacy:</strong> Buyer identity is hidden until you submit an offer and it is accepted.
                      </p>
                    </div>

                    <Link to={`/dashboard/one-flow/${rfq.id}`}>
                      <Button className="w-full sm:w-auto hover:bg-afrikoni-goldDark">
                        Provide Quote
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Surface>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupplierRFQs() {
  return (
    <>
      {/* PHASE 5B: Supplier RFQs page requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <SupplierRFQsInner />
      </RequireCapability>
    </>
  );
}
