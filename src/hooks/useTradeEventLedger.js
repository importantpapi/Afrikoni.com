import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const EVENT_LABELS = {
  state_transition: 'State transition',
  rfq_created: 'RFQ created',
  rfq_published: 'RFQ published',
  quote_received: 'Quote received',
  quote_selected: 'Quote selected',
  contract_generated: 'Contract generated',
  contract_signed: 'Contract signed',
  escrow_created: 'Escrow created',
  escrow_funded: 'Escrow funded',
  payment_released: 'Escrow released',
  shipment_created: 'Shipment created',
  pickup_scheduled: 'Pickup scheduled',
  pickup_confirmed: 'Pickup confirmed',
  in_transit: 'In transit',
  delivery_scheduled: 'Delivery scheduled',
  delivered: 'Delivered',
  delivery_accepted: 'Delivery accepted',
  dispute_created: 'Dispute opened',
  dispute_resolved: 'Dispute resolved',
  compliance_check_passed: 'Compliance passed',
  compliance_check_failed: 'Compliance failed',
  error_occurred: 'Kernel error',
  automation_triggered: 'Automation triggered'
};

function formatEventLabel(event) {
  if (!event) return 'Kernel event';
  if (event.event_type === 'state_transition') {
    const fromState = event?.metadata?.from_state || event?.payload?.from_state;
    const toState = event?.metadata?.to_state || event?.payload?.to_state;
    if (fromState && toState) {
      return `State ${String(fromState).toUpperCase()} → ${String(toState).toUpperCase()}`;
    }
  }
  return EVENT_LABELS[event.event_type] || event.event_type?.replace(/_/g, ' ') || 'Kernel event';
}

function formatEventTime(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useTradeEventLedger(tradeId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tradeId) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('trade_events')
          .select('*')
          .eq('trade_id', tradeId)
          .order('created_at', { ascending: false })
          .limit(12);

        if (fetchError) throw fetchError;
        if (!active) return;
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load kernel ledger');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    // ✅ REACTIVE LEDGER: Listen for global signals to refresh history live
    const handleGlobalUpdate = (event) => {
      const { table, data } = event.detail || {};
      const relevantTables = ['trades', 'shipments', 'escrows', 'payments'];

      // If the signal is relevant to this trade specifically, or just a general refresh
      if (relevantTables.includes(table)) {
        // Optimization: check if data.trade_id matches if available
        const signalTradeId = data?.trade_id || data?.id;
        if (!tradeId || !signalTradeId || signalTradeId === tradeId) {
          console.log(`[useTradeEventLedger] 📜 Signal received for ${table} - Refreshing ledger...`);
          load();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dashboard-realtime-update', handleGlobalUpdate);
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('dashboard-realtime-update', handleGlobalUpdate);
      }
    };
  }, [tradeId]);

  const timeline = useMemo(() => (
    events.map((event) => ({
      id: event.id,
      label: formatEventLabel(event),
      time: formatEventTime(event.created_at),
      type: event.event_type,
      raw: event
    }))
  ), [events]);

  return { events, timeline, loading, error };
}
