/**
 * Image URL Helper - Normalizes image URLs for Supabase Storage
 * Ensures all image URLs are in the correct format for display
 * 
 * NOTE: This file is being replaced by src/utils/productImages.js
 * which is the new single source of truth for product image handling.
 * This file is kept for backward compatibility.
 * 
 * @deprecated Use productImages.js helpers instead
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const BUCKET_NAME = 'product-images';

/**
 * Normalize image URL to full Supabase Storage public URL
 * @param {string|null|undefined} imageUrl - The image URL from database
 * @returns {string|null} - Normalized full URL or null
 */
export function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If starts with /, it's a relative path - construct full URL
  if (imageUrl.startsWith('/')) {
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}${imageUrl}`;
    }
    return imageUrl; // Fallback to relative if no supabaseUrl
  }
  
  // If it's just a filename or path, construct full URL
  if (supabaseUrl) {
    // Remove leading slash if present
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
  }
  
  return imageUrl;
}

/**
 * Get primary image URL from product data
 * @param {object} product - Product object
 * @returns {string|null} - Primary image URL or null
 */
export function getProductPrimaryImage(product) {
  if (!product) return null;
  
  let imageUrl = null;
  
  // 1. Check product_images table (preferred)
  if (product.product_images) {
    const images = Array.isArray(product.product_images) ? product.product_images : [product.product_images];
    if (images.length > 0) {
      const primary = images.find(img => img?.is_primary === true);
      imageUrl = primary?.url || images[0]?.url || null;
    }
  }
  
  // 2. Fallback to legacy images array
  if (!imageUrl && product.images) {
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
      imageUrl = typeof firstImg === 'string' ? firstImg : firstImg?.url || null;
    }
  }
  
  // Normalize the URL
  return normalizeImageUrl(imageUrl);
}

/**
 * Get all image URLs from product data
 * @param {object} product - Product object
 * @returns {string[]} - Array of image URLs
 */
export function getProductAllImages(product) {
  if (!product) return [];
  
  const allImages = [];
  
  // From product_images table
  if (product.product_images) {
    const images = Array.isArray(product.product_images) ? product.product_images : [product.product_images];
    images.forEach(img => {
      const url = img?.url;
      if (url) {
        const normalized = normalizeImageUrl(url);
        if (normalized && !allImages.includes(normalized)) {
          allImages.push(normalized);
        }
      }
    });
  }
  
  // From legacy images array
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
        const normalized = normalizeImageUrl(url);
        if (normalized && !allImages.includes(normalized)) {
          allImages.push(normalized);
        }
      }
    });
  }
  
  return allImages;
}

