import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from './useDashboardKernel';

type RiskLevel = 'low' | 'medium' | 'high';

type TradeKernelState = {
  loading: boolean;
  trustScore: number;
  kycStatus: 'verified' | 'pending' | 'unknown';
  escrowLockedValue: number;
  pipelineValue: number;
  shipmentsInTransit: number;
  afcftaReady: boolean;
  riskLevel: RiskLevel;
  updatedAt: string | null;
  activeTrades: any[]; // Using any[] for simplicity, ideally define Trade type
};

const defaultState: TradeKernelState = {
  loading: false,
  // ✅ KERNEL REALIGNMENT: Purged fake trust formula (55 + length * 4)
  trustScore: 0, // Trigger recalculation in engine
  kycStatus: 'unknown',
  escrowLockedValue: 0,
  pipelineValue: 0,
  shipmentsInTransit: 0,
  afcftaReady: false,
  riskLevel: 'low',
  updatedAt: null,
  activeTrades: [],
};

export function useTradeKernelState(): TradeKernelState {
  const { profileCompanyId, canLoadData, isSystemReady, organization } = useDashboardKernel();
  const [state, setState] = useState<TradeKernelState>(defaultState);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    if (!canLoadData || !profileCompanyId) {
      // ✅ MOBILE FIX: Show loading if system is still booting up
      // Only set to defaultState if system is ready but no companyId (shouldn't happen)
      if (isSystemReady) {
        setState(defaultState);
      } else {
        setState(prev => ({ ...prev, loading: true }));
      }
      return () => {
        isMounted = false;
        if (channel) channel.unsubscribe();
      };
    }

    const load = async () => {
      setState(prev => ({ ...prev, loading: true }));

      const results: Partial<TradeKernelState> = {};

      try {
        if (organization) {
          if (typeof organization.trust_score === 'number') {
            results.trustScore = Math.round(organization.trust_score);
          }
          if (organization.verification_status) {
            results.kycStatus = organization.verification_status === 'verified' ? 'verified' : 'pending';
          }
          if (typeof organization.afcfta_ready === 'boolean') {
            results.afcftaReady = organization.afcfta_ready;
          }
        }
      } catch (error) {
        console.warn('[useTradeKernelState] Company fetch failed', error);
      }

      try {
        // Step 1: fetch trades with product_id
        const tradesRes = await supabase
          .from('trades')
          .select('id, status, origin_country, destination_country, target_price, price_min, price_max, buyer_id, seller_id, product_id, product_name, milestones')
          .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`)
          .order('created_at', { ascending: false });

        let productsMap = {};
        if (tradesRes.data) {
          // Step 2: fetch products for all product_ids
          const productIds = Array.from(new Set(tradesRes.data.filter(t => t.product_id).map(t => t.product_id)));
          if (productIds.length) {
            const { data: pData, error: pError } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);
            if (!pError && Array.isArray(pData)) {
              productsMap = Object.fromEntries(pData.map(p => [p.id, p.name]));
            }
          }

          const activeTradesList = tradesRes.data
            .filter(trade => !['closed', 'settled'].includes(trade.status))
            .map(trade => ({
              id: trade.id,
              productName: (trade.product_id && productsMap[trade.product_id])
                ? productsMap[trade.product_id]
                : trade.product_name || 'Unknown Product',
              status: trade.status,
              corridor: {
                originCountry: trade.origin_country || 'Unknown',
                destinationCountry: trade.destination_country || 'Unknown',
              },
              milestones: trade.milestones || [
                { status: 'completed' },
                { status: trade.status === 'draft' ? 'pending' : 'completed' },
                { status: 'pending' },
                { status: 'pending' },
              ]
            }));

          const pipelineValue = activeTradesList.reduce((sum, trade) => {
            const raw = tradesRes.data.find(t => t.id === trade.id);
            const value = raw?.target_price ?? raw?.price_max ?? raw?.price_min ?? 0;
            return sum + Number(value || 0);
          }, 0);

          results.pipelineValue = pipelineValue;
          results.activeTrades = activeTradesList;

          if (results.trustScore === undefined) {
            // REMOVED: Heuristic score (55 + length * 4). 
            // Only use the real score from the database.
            results.trustScore = 0;
          }

          if (activeTradesList.length === 0 && results.afcftaReady === undefined) {
            results.afcftaReady = false;
          }
        }
      } catch (error) {
        console.warn('[useTradeKernelState] Trade fetch failed', error);
      }

      try {
        const escrowRes = await supabase
          .from('escrows')
          .select('id, amount, balance, status, buyer_id, seller_id')
          .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`);

        if (escrowRes.data) {
          const locked = escrowRes.data
            .filter(row => ['pending', 'funded', 'disputed'].includes(row.status))
            .reduce((sum, row) => sum + Number(row.balance ?? row.amount ?? 0), 0);
          results.escrowLockedValue = locked;
        }
      } catch (error) {
        console.warn('[useTradeKernelState] Escrow fetch failed', error);
      }

      try {
        const shipmentRes = await supabase
          .from('shipments')
          .select('id, status')
          .in('status', ['pickup_scheduled', 'in_transit', 'delivery_scheduled']);
        if (shipmentRes.data) {
          results.shipmentsInTransit = shipmentRes.data.length;
        }
      } catch (error) {
        console.warn('[useTradeKernelState] Shipment fetch failed', error);
      }

      if (isMounted) {
        setState(prev => ({
          ...defaultState,
          ...results,
          loading: false,
          updatedAt: new Date().toISOString(),
        }));
      }
    };

    load();

    // ✅ KERNEL CONSOLIDATION: Listen for unified realtime events from DashboardRealtimeManager
    // This removes the duplicate channel subscription and ensures single-point-of-truth updates.
    const handleRealtimeUpdate = (e: any) => {
      const { table, event } = e.detail || {};
      const relevantTables = ['trades', 'escrows', 'shipments', 'companies'];

      if (relevantTables.includes(table)) {
        console.log(`[useTradeKernelState] 🔄 Update triggered by ${table}.${event}`);
        if (isMounted) load();
      }
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    };
  }, [canLoadData, profileCompanyId, isSystemReady, organization]); // ✅ KERNEL SYNC: Added organization

  return useMemo(() => state, [state]);
}
