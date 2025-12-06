/**
 * Logistics & Fulfillment Queries
 * Handles shipments, shipment_events, order_fulfillment, warehouse_locations
 */

import { supabase } from '@/api/supabaseClient';

// ============ SHIPMENT EVENTS ============

export async function getShipmentEvents(shipmentId) {
  const { data, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('event_time', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createShipmentEvent(eventData) {
  const { data, error } = await supabase
    .from('shipment_events')
    .insert({
      ...eventData,
      event_time: eventData.event_time || new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ ORDER FULFILLMENT ============

export async function getOrderFulfillment(orderId) {
  const { data, error } = await supabase
    .from('order_fulfillment')
    .select(`
      *,
      warehouse:warehouse_locations(*)
    `)
    .eq('order_id', orderId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createOrderFulfillment(fulfillmentData) {
  const { data, error } = await supabase
    .from('order_fulfillment')
    .insert(fulfillmentData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateFulfillmentStatus(fulfillmentId, status, updates = {}) {
  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...updates
  };
  
  if (status === 'packed') updateData.packed_at = new Date().toISOString();
  if (status === 'handed_to_carrier') updateData.handed_to_carrier_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('order_fulfillment')
    .update(updateData)
    .eq('id', fulfillmentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ WAREHOUSE LOCATIONS ============

export async function getWarehouseLocations(companyId) {
  const { data, error } = await supabase
    .from('warehouse_locations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createWarehouseLocation(locationData) {
  const { data, error } = await supabase
    .from('warehouse_locations')
    .insert(locationData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWarehouseLocation(locationId, updates) {
  const { data, error } = await supabase
    .from('warehouse_locations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', locationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ SHIPMENTS (Enhanced) ============

export async function getShipmentWithEvents(shipmentId) {
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select(`
      *,
      orders(*),
      fulfillment:order_fulfillment(*)
    `)
    .eq('id', shipmentId)
    .single();
  
  if (shipmentError) throw shipmentError;
  
  const events = await getShipmentEvents(shipmentId);
  
  return {
    ...shipment,
    events
  };
}

export async function getShipmentsByCompany(companyId, filters = {}) {
  let query = supabase
    .from('shipments')
    .select(`
      *,
      orders(*),
      fulfillment:order_fulfillment(*)
    `)
    .or(`sender_company_id.eq.${companyId},receiver_company_id.eq.${companyId}`)
    .order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Enrich with events
  const shipmentsWithEvents = await Promise.all(
    data.map(async (shipment) => {
      const events = await getShipmentEvents(shipment.id);
      return { ...shipment, events };
    })
  );
  
  return shipmentsWithEvents;
}

