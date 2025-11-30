/**
 * Centralized Query Builder Helpers
 * 
 * Provides reusable query builders for:
 * - Products
 * - Orders
 * - RFQs
 * - Shipments
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Build product query with filters
 */
export function buildProductQuery(filters = {}) {
  const {
    companyId = null,
    status = 'active',
    categoryId = null,
    country = null,
    searchQuery = null
  } = filters;
  
  let query = supabase
    .from('products')
    .select(`
      *,
      categories(*),
      product_images(*)
    `);
  
  // Filter by company
  if (companyId) {
    query = query.or(`supplier_id.eq.${companyId},company_id.eq.${companyId}`);
  }
  
  // Filter by status
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }
  
  // Filter by category
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  // Filter by country
  if (country) {
    query = query.eq('country_of_origin', country);
  }
  
  // Search query (client-side for now, can be moved to server)
  // Note: Supabase full-text search would be better
  
  return query;
}

/**
 * Build order query with filters
 */
export function buildOrderQuery(filters = {}) {
  const {
    buyerCompanyId = null,
    sellerCompanyId = null,
    status = null,
    searchQuery = null
  } = filters;
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      products(*)
    `);
  
  // Filter by buyer
  if (buyerCompanyId) {
    query = query.eq('buyer_company_id', buyerCompanyId);
  }
  
  // Filter by seller
  if (sellerCompanyId) {
    query = query.eq('seller_company_id', sellerCompanyId);
  }
  
  // Filter by status
  if (status) {
    if (status === 'all') {
      // No filter
    } else if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }
  
  return query;
}

/**
 * Build RFQ query with filters
 */
export function buildRFQQuery(filters = {}) {
  const {
    buyerCompanyId = null,
    status = 'open',
    categoryId = null,
    country = null
  } = filters;
  
  let query = supabase
    .from('rfqs')
    .select(`
      *,
      categories(*)
    `);
  
  // Filter by buyer
  if (buyerCompanyId) {
    query = query.eq('buyer_company_id', buyerCompanyId);
  }
  
  // Filter by status
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }
  }
  
  // Filter by category
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  // Filter by country
  if (country) {
    query = query.eq('target_country', country);
  }
  
  return query;
}

/**
 * Build shipment query with filters
 */
export function buildShipmentQuery(filters = {}) {
  const {
    logisticsCompanyId = null,
    status = null,
    orderId = null
  } = filters;
  
  let query = supabase
    .from('shipments')
    .select(`
      *,
      orders(*)
    `);
  
  // Filter by logistics company
  if (logisticsCompanyId) {
    query = query.eq('logistics_partner_id', logisticsCompanyId);
  }
  
  // Filter by order
  if (orderId) {
    query = query.eq('order_id', orderId);
  }
  
  // Filter by status
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }
  }
  
  return query;
}

