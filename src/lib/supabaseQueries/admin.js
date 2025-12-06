/**
 * Admin Queries
 * Handles marketing_leads, channel_attribution, kyb_documents, audit_log
 */

import { supabase } from '@/api/supabaseClient';

// ============ MARKETING LEADS ============

export async function getMarketingLeads(filters = {}) {
  let query = supabase
    .from('marketing_leads')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.source) query = query.eq('source', filters.source);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMarketingLead(leadData) {
  const { data, error } = await supabase
    .from('marketing_leads')
    .insert(leadData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMarketingLead(leadId, updates) {
  const { data, error } = await supabase
    .from('marketing_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ CHANNEL ATTRIBUTION ============

export async function getChannelAttribution(userId) {
  const { data, error } = await supabase
    .from('channel_attribution')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createChannelAttribution(attributionData) {
  const { data, error } = await supabase
    .from('channel_attribution')
    .insert(attributionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getChannelStats(filters = {}) {
  let query = supabase
    .from('channel_attribution')
    .select('*');
  
  if (filters.campaign) query = query.eq('campaign', filters.campaign);
  if (filters.channel) query = query.eq('last_touch_channel', filters.channel);
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Aggregate stats
  const stats = data.reduce((acc, item) => {
    const channel = item.last_touch_channel || 'unknown';
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
  }, {});
  
  return stats;
}

// ============ KYB DOCUMENTS ============

export async function getKYBDocuments(companyId) {
  const { data, error } = await supabase
    .from('kyb_documents')
    .select(`
      *,
      reviewed_by:profiles(*)
    `)
    .eq('company_id', companyId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createKYBDocument(documentData) {
  const { data, error } = await supabase
    .from('kyb_documents')
    .insert(documentData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateKYBDocumentStatus(documentId, status, reviewerId, notes = '') {
  const { data, error } = await supabase
    .from('kyb_documents')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      notes
    })
    .eq('id', documentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllPendingKYBDocuments() {
  const { data, error } = await supabase
    .from('kyb_documents')
    .select(`
      *,
      company:companies(*),
      reviewed_by:profiles(*)
    `)
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

// ============ AUDIT LOG ============

export async function createAuditLog(logData) {
  const { data, error } = await supabase
    .from('audit_log')
    .insert(logData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAuditLogs(filters = {}) {
  let query = supabase
    .from('audit_log')
    .select(`
      *,
      actor_user:profiles(*),
      actor_company:companies(*)
    `)
    .order('created_at', { ascending: false });
  
  if (filters.actor_user_id) query = query.eq('actor_user_id', filters.actor_user_id);
  if (filters.actor_company_id) query = query.eq('actor_company_id', filters.actor_company_id);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

