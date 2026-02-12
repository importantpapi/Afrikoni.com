/**
 * Logistics Dispatch Service
 * 
 * READ-ONLY UI service for monitoring dispatch status.
 * All writes go through the kernel (trade-transition) or acceptance handler.
 */

import { supabase } from '@/lib/supabaseClient';

export interface DispatchEvent {
  id: string;
  trade_id: string;
  provider_id: string | null;
  shipment_id: string | null;
  event_type: 
    | 'DISPATCH_REQUESTED'
    | 'PROVIDER_NOTIFIED'
    | 'PROVIDER_ACCEPTED'
    | 'PROVIDER_REJECTED'
    | 'SHIPMENT_ASSIGNED';
  payload: Record<string, any>;
  created_at: string;
}

export interface DispatchNotification {
  id: string;
  trade_id: string;
  provider_id: string;
  notification_type: 'sms' | 'whatsapp' | 'push';
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  created_at: string;
}

export interface LogisticsProvider {
  id: string;
  company_id: string;
  city: string;
  vehicle_types: string[];
  is_available: boolean;
  response_score: number;
  total_jobs: number;
  accepted_jobs: number;
  last_active_at: string | null;
}

export interface ShipmentWithProvider {
  id: string;
  trade_id: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  logistics_provider_id: string | null;
  pickup_scheduled_at: string | null;
  tracking_number: string | null;
  provider?: LogisticsProvider;
}

/**
 * Get dispatch events for a trade (read-only)
 */
export async function getDispatchEvents(tradeId: string): Promise<DispatchEvent[]> {
  const { data, error } = await supabase
    .from('dispatch_events')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DispatchService] Failed to fetch events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get dispatch notifications for a trade (read-only)
 */
export async function getDispatchNotifications(tradeId: string): Promise<DispatchNotification[]> {
  const { data, error } = await supabase
    .from('dispatch_notifications')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DispatchService] Failed to fetch notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get shipment with provider details (read-only)
 */
export async function getShipmentWithProvider(tradeId: string): Promise<ShipmentWithProvider | null> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      provider:logistics_provider_id (
        id,
        company_id,
        city,
        vehicle_types,
        is_available,
        response_score,
        total_jobs,
        accepted_jobs,
        last_active_at
      )
    `)
    .eq('trade_id', tradeId)
    .maybeSingle();

  if (error) {
    console.error('[DispatchService] Failed to fetch shipment:', error);
    return null;
  }

  return data;
}

/**
 * Subscribe to real-time dispatch updates
 */
export function subscribeToDispatchUpdates(
  tradeId: string,
  onUpdate: (event: DispatchEvent) => void
) {
  const channel = supabase
    .channel(`dispatch:${tradeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dispatch_events',
        filter: `trade_id=eq.${tradeId}`,
      },
      (payload) => {
        onUpdate(payload.new as DispatchEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get human-readable dispatch status for a trade
 */
export async function getDispatchStatus(tradeId: string): Promise<{
  status: 'idle' | 'searching' | 'assigned' | 'in_transit' | 'delivered';
  message: string;
  provider?: LogisticsProvider;
  events: DispatchEvent[];
}> {
  const [shipment, events] = await Promise.all([
    getShipmentWithProvider(tradeId),
    getDispatchEvents(tradeId),
  ]);

  if (!shipment) {
    return {
      status: 'idle',
      message: 'No pickup scheduled yet',
      events: [],
    };
  }

  // Check if providers have been notified
  const dispatchRequested = events.some(e => e.event_type === 'DISPATCH_REQUESTED');
  const shipmentAssigned = events.some(e => e.event_type === 'SHIPMENT_ASSIGNED');

  if (shipment.status === 'delivered') {
    return {
      status: 'delivered',
      message: 'Shipment delivered',
      provider: shipment.provider as LogisticsProvider,
      events,
    };
  }

  if (shipment.status === 'in_transit') {
    return {
      status: 'in_transit',
      message: `In transit with ${(shipment.provider as any)?.company_id || 'logistics provider'}`,
      provider: shipment.provider as LogisticsProvider,
      events,
    };
  }

  if (shipmentAssigned && shipment.logistics_provider_id) {
    return {
      status: 'assigned',
      message: 'Pickup assigned - waiting for collection',
      provider: shipment.provider as LogisticsProvider,
      events,
    };
  }

  if (dispatchRequested) {
    const notifiedCount = events.filter(e => e.event_type === 'PROVIDER_NOTIFIED').length;
    return {
      status: 'searching',
      message: `Searching for pickup provider (${notifiedCount} contacted)`,
      events,
    };
  }

  return {
    status: 'idle',
    message: 'Pickup scheduled - dispatch pending',
    events,
  };
}
