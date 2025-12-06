/**
 * Product Specs & Performance Queries
 * Handles product_specs, product_views, supplier_performance
 */

import { supabase } from '@/api/supabaseClient';

// ============ PRODUCT SPECS ============

export async function getProductSpecs(productId) {
  const { data, error } = await supabase
    .from('product_specs')
    .select('*')
    .eq('product_id', productId)
    .order('spec_key');
  
  if (error) throw error;
  return data;
}

export async function createProductSpec(specData) {
  const { data, error } = await supabase
    .from('product_specs')
    .insert(specData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProductSpec(specId, updates) {
  const { data, error } = await supabase
    .from('product_specs')
    .update(updates)
    .eq('id', specId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProductSpec(specId) {
  const { error } = await supabase
    .from('product_specs')
    .delete()
    .eq('id', specId);
  
  if (error) throw error;
  return true;
}

export async function bulkUpdateProductSpecs(productId, specs) {
  // Delete existing specs
  await supabase
    .from('product_specs')
    .delete()
    .eq('product_id', productId);
  
  // Insert new specs
  if (specs.length > 0) {
    const specsWithProductId = specs.map(spec => ({
      ...spec,
      product_id: productId
    }));
    
    const { data, error } = await supabase
      .from('product_specs')
      .insert(specsWithProductId)
      .select();
    
    if (error) throw error;
    return data;
  }
  
  return [];
}

// ============ PRODUCT VIEWS ============

export async function trackProductView(productId, viewerData = {}) {
  const { data, error } = await supabase
    .from('product_views')
    .insert({
      product_id: productId,
      viewer_profile_id: viewerData.profile_id,
      viewer_company_id: viewerData.company_id,
      source_page: viewerData.source_page || 'unknown'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getProductViews(productId, filters = {}) {
  let query = supabase
    .from('product_views')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  
  if (filters.start_date) query = query.gte('created_at', filters.start_date);
  if (filters.end_date) query = query.lte('created_at', filters.end_date);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductViewStats(productId, period = '30d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const views = await getProductViews(productId, {
    start_date: startDate.toISOString()
  });
  
  return {
    total_views: views.length,
    unique_viewers: new Set(views.map(v => v.viewer_profile_id || v.viewer_company_id)).size,
    views_by_source: views.reduce((acc, v) => {
      acc[v.source_page] = (acc[v.source_page] || 0) + 1;
      return acc;
    }, {})
  };
}

// ============ SUPPLIER PERFORMANCE ============

export async function getSupplierPerformance(companyId) {
  const { data, error } = await supabase
    .from('supplier_performance')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function calculateSupplierPerformance(companyId) {
  // Get orders for this supplier
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_company_id', companyId);
  
  // Get reviews
  const { getCompanyReviews } = await import('./reviews');
  const reviews = await getCompanyReviews(companyId);
  
  // Get shipments
  const { data: shipments } = await supabase
    .from('shipments')
    .select('*')
    .eq('sender_company_id', companyId);
  
  // Calculate metrics
  const onTimeDeliveries = shipments?.filter(s => {
    if (!s.estimated_delivery_date || !s.delivered_at) return false;
    return new Date(s.delivered_at) <= new Date(s.estimated_delivery_date);
  }).length || 0;
  
  const onTimeDeliveryRate = shipments?.length > 0 
    ? (onTimeDeliveries / shipments.length) * 100 
    : 0;
  
  // Calculate average response time (from RFQs)
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('*, quotes(*)')
    .eq('seller_company_id', companyId);
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  rfqs?.forEach(rfq => {
    if (rfq.quotes && rfq.quotes.length > 0) {
      const firstQuote = rfq.quotes[0];
      const responseTime = new Date(firstQuote.created_at) - new Date(rfq.created_at);
      totalResponseTime += responseTime / (1000 * 60 * 60); // Convert to hours
      responseCount++;
    }
  });
  
  const responseTimeHours = responseCount > 0 ? totalResponseTime / responseCount : 0;
  
  // Calculate dispute rate
  const { data: disputes } = await supabase
    .from('disputes')
    .select('*')
    .eq('seller_company_id', companyId);
  
  const disputeRate = orders?.length > 0 
    ? (disputes?.length || 0) / orders.length * 100 
    : 0;
  
  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) / reviews.length
    : 0;
  
  // Update supplier performance
  const { data, error } = await supabase
    .from('supplier_performance')
    .upsert({
      company_id: companyId,
      on_time_delivery_rate: onTimeDeliveryRate,
      response_time_hours: responseTimeHours,
      dispute_rate: disputeRate,
      average_rating: averageRating,
      last_calculated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

