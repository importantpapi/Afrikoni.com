/**
 * Product Images Utility
 * 
 * Centralized helpers for fetching and normalizing product images.
 * 
 * NOTE: product_images table is the single source of truth.
 * The products.images column is deprecated and should not be read in new code.
 */

import { supabase } from '@/api/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const BUCKET_NAME = 'product-images';

/**
 * Normalize a product image URL to full Supabase Storage URL
 * @param {string|null|undefined} rawUrl - The image URL from database (can be filename or full URL)
 * @returns {string|null} - Normalized full URL or null
 */
export function normalizeProductImageUrl(rawUrl) {
  if (!rawUrl) return null;
  
  // Filter out localhost/127.0.0.1 URLs (these are invalid in production)
  if (typeof rawUrl === 'string') {
    const lowerUrl = rawUrl.toLowerCase();
    if (lowerUrl.includes('localhost:') || lowerUrl.includes('127.0.0.1:')) {
      console.warn('Invalid image URL detected (localhost):', rawUrl);
      return null; // Return null to trigger fallback/placeholder
    }
  }
  
  // If already a full URL, return as-is (but only if it's a valid HTTPS URL)
  if (rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  
  // Reject HTTP URLs (insecure)
  if (rawUrl.startsWith('http://')) {
    console.warn('Insecure HTTP image URL detected:', rawUrl);
    return null;
  }
  
  // If it's a filename or relative path, construct full URL
  if (!SUPABASE_URL) {
    console.warn('VITE_SUPABASE_URL not set, cannot normalize image URL');
    return null; // Return null instead of rawUrl to trigger fallback
  }
  
  // Remove leading slash if present
  const cleanPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
  
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

/**
 * Fetch primary image for a product from product_images table
 * @param {string} productId - Product UUID
 * @returns {Promise<object|null>} - Image object with normalized URL or null
 */
export async function fetchPrimaryImageForProduct(productId) {
  if (!productId) return null;

  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product image', { productId, error });
      return null;
    }

    if (!data) return null;

    // Normalize URL (in case the DB only stores filename)
    const normalizedUrl = normalizeProductImageUrl(data.url);

    return {
      ...data,
      url: normalizedUrl,
    };
  } catch (error) {
    console.error('Exception fetching product image', { productId, error });
    return null;
  }
}

/**
 * Get primary image URL from product data (when images are already loaded via join)
 * @param {object} product - Product object with product_images relation
 * @returns {string|null} - Normalized primary image URL or null
 */
export function getPrimaryImageFromProduct(product) {
  if (!product) return null;
  
  // Check product_images table (preferred - single source of truth)
  if (product.product_images) {
    const images = Array.isArray(product.product_images) 
      ? product.product_images 
      : [product.product_images];
    
    if (images.length > 0) {
      // Find primary image, or use first image
      const primary = images.find(img => img?.is_primary === true) || images[0];
      if (primary?.url) {
        return normalizeProductImageUrl(primary.url);
      }
    }
  }
  
  // DEPRECATED: Fallback to products.images (legacy support)
  // TODO: Remove this fallback once all images are migrated
  if (product.images) {
    let images = [];
    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (typeof product.images === 'string') {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [product.images];
      }
    }
    
    if (images.length > 0) {
      const firstImg = images[0];
      const url = typeof firstImg === 'string' ? firstImg : firstImg?.url;
      if (url) {
        return normalizeProductImageUrl(url);
      }
    }
  }
  
  return null;
}

/**
 * Get all images from product data (when images are already loaded via join)
 * @param {object} product - Product object with product_images relation
 * @returns {string[]} - Array of normalized image URLs
 */
export function getAllImagesFromProduct(product) {
  if (!product) return [];
  
  const allImages = [];
  
  // From product_images table (preferred - single source of truth)
  if (product.product_images) {
    const images = Array.isArray(product.product_images) 
      ? product.product_images 
      : [product.product_images];
    
    images.forEach(img => {
      if (img?.url) {
        const normalized = normalizeProductImageUrl(img.url);
        if (normalized && !allImages.includes(normalized)) {
          allImages.push(normalized);
        }
      }
    });
  }
  
  // DEPRECATED: Fallback to products.images (legacy support)
  // TODO: Remove this fallback once all images are migrated
  if (product.images) {
    let images = [];
    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (typeof product.images === 'string') {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [product.images];
      }
    }
    
    images.forEach(img => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url) {
        const normalized = normalizeProductImageUrl(url);
        if (normalized && !allImages.includes(normalized)) {
          allImages.push(normalized);
        }
      }
    });
  }
  
  return allImages;
}

