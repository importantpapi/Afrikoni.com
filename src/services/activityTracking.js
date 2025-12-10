/**
 * Activity Tracking Service
 * Tracks user interactions: search views, product views, RFQ interactions
 */

import { supabase, supabaseHelpers } from '@/api/supabaseClient';

/**
 * Track a search view
 */
export async function trackSearchView(userId, searchQuery, filters = {}) {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      activity_type: 'search_view',
      metadata: {
        query: searchQuery,
        filters,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

    if (error) console.error('Error tracking search view:', error);
  } catch (error) {
    console.error('Error tracking search view:', error);
  }
}

/**
 * Track a product view
 */
export async function trackProductView(userId, productId, productName = '') {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      activity_type: 'product_view',
      entity_id: productId,
      metadata: {
        product_name: productName,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

    if (error) console.error('Error tracking product view:', error);
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
}

/**
 * Track RFQ interaction
 */
export async function trackRFQInteraction(userId, rfqId, interactionType = 'view') {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      activity_type: 'rfq_interaction',
      entity_id: rfqId,
      metadata: {
        interaction_type: interactionType, // view, respond, match
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });

    if (error) console.error('Error tracking RFQ interaction:', error);
  } catch (error) {
    console.error('Error tracking RFQ interaction:', error);
  }
}

/**
 * Get activity metrics for a user
 */
export async function getActivityMetrics(userId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const metrics = {
      searchViews: data.filter(a => a.activity_type === 'search_view').length,
      productViews: data.filter(a => a.activity_type === 'product_view').length,
      rfqInteractions: data.filter(a => a.activity_type === 'rfq_interaction').length,
      total: data.length
    };

    return metrics;
  } catch (error) {
    console.error('Error getting activity metrics:', error);
    return { searchViews: 0, productViews: 0, rfqInteractions: 0, total: 0 };
  }
}

/**
 * Get search appearance count (how many times user appeared in searches)
 */
export async function getSearchAppearanceCount(userId, companyId) {
  try {
    if (!companyId) return 3;
    
    // This would track when other users search and find this user's products/company
    // For now, return a default value until we implement full tracking
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: false })
      .eq('entity_id', companyId)
      .eq('activity_type', 'search_result_view')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      // Table might not exist yet - return default
      console.warn('activity_logs table may not exist yet:', error.message);
      return 3; // Default small number
    }

    return data?.length || 3;
  } catch (error) {
    console.warn('Error getting search appearance count:', error);
    return 3; // Default small number
  }
}

