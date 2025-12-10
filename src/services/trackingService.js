/**
 * Tracking Service
 * Handles real-time tracking events and updates
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Create a tracking event
 */
export async function createTrackingEvent(shipmentId, eventData) {
  try {
    const { data, error } = await supabase
      .from('shipment_tracking_events')
      .insert({
        shipment_id: shipmentId,
        event_type: eventData.event_type,
        status: eventData.status || eventData.event_type,
        location: eventData.location,
        description: eventData.description,
        notes: eventData.notes || null,
        latitude: eventData.latitude || null,
        longitude: eventData.longitude || null,
        metadata: eventData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating tracking event:', error);
    throw error;
  }
}

/**
 * Get tracking events for a shipment
 */
export async function getTrackingEvents(shipmentId) {
  try {
    const { data, error } = await supabase
      .from('shipment_tracking_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('event_timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting tracking events:', error);
    return [];
  }
}

/**
 * Subscribe to real-time tracking updates
 */
export function subscribeToTracking(shipmentId, callback) {
  const channel = supabase
    .channel(`tracking:${shipmentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shipment_tracking_events',
        filter: `shipment_id=eq.${shipmentId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

