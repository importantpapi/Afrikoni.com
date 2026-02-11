/**
 * Product Service - Kernel Architecture
 * 
 * Centralized business logic for product operations.
 * Frontend components should only handle UI concerns and delegate
 * all business logic to this service layer.
 */

import { supabase } from '@/api/supabaseClient';
import { sanitizeString } from '@/utils/security';
import { checkProductLimit } from '@/utils/subscriptionLimits';
import { autoAssignCategory } from '@/utils/productCategoryIntelligence';

/**
 * Create a new product
 * 
 * This is the Kernel method - handles all business logic:
 * - Product limit checking
 * - Validation
 * - Category auto-assignment
 * - Completeness scoring
 * - Data sanitization
 * - Database insertion
 * - Image management
 * 
 * @param {Object} params - Product creation parameters
 * @param {Object} params.user - Authenticated user object (must have id)
 * @param {Object} params.formData - Product form data
 * @param {string} params.companyId - Company ID (from kernel)
 * @param {boolean} params.publish - Whether to publish immediately
 * @returns {Promise<{success: boolean, data?: Object, error?: string, needsUpgrade?: boolean, imagesSaved?: boolean}>}
 */
export async function createProduct({ user, formData, companyId, publish = false }) {
  try {
    // ✅ KERNEL: Validate inputs
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required. Please log in.'
      };
    }

    if (!companyId) {
      return {
        success: false,
        error: 'Company profile required. Please complete your company profile first.'
      };
    }

    // ✅ KERNEL: Check product limit
    const limitInfo = await checkProductLimit(companyId);
    if (!limitInfo.canAdd) {
      return {
        success: false,
        error: limitInfo.message || 'Product limit reached',
        needsUpgrade: limitInfo.needsUpgrade
      };
    }

    // ✅ KERNEL: Validate required fields
    if (!formData.title || !formData.title.trim()) {
      return {
        success: false,
        error: 'Product title is required'
      };
    }

    // ✅ KERNEL: Auto-assign category if missing
    let finalCategoryId = formData.category_id;
    if (!finalCategoryId && formData.title) {
      try {
        const autoCategoryId = await autoAssignCategory(
          supabase,
          formData.title,
          formData.description || formData.short_description || '',
          null
        );
        if (autoCategoryId) {
          finalCategoryId = autoCategoryId;
        }
      } catch (error) {
        console.warn('[productService] Auto-category assignment failed:', error);
        // Continue without auto-assignment
      }
    }

    // ✅ KERNEL: Category is recommended but not strictly required for drafts
    if (!finalCategoryId && publish) {
      return {
        success: false,
        error: 'Please select a category before publishing'
      };
    }

    // ✅ KERNEL: Validate pricing
    const priceMin = formData.price_min ? parseFloat(formData.price_min) : null;
    const priceMax = formData.price_max ? parseFloat(formData.price_max) : null;

    if (!priceMin && !priceMax) {
      return {
        success: false,
        error: 'Please enter at least one price (minimum or maximum)'
      };
    }

    if (priceMin && priceMin <= 0) {
      return {
        success: false,
        error: 'Minimum price must be greater than 0'
      };
    }

    if (priceMax && priceMax <= 0) {
      return {
        success: false,
        error: 'Maximum price must be greater than 0'
      };
    }

    if (priceMin && priceMax && priceMin > priceMax) {
      return {
        success: false,
        error: 'Minimum price cannot be greater than maximum price'
      };
    }

    // ✅ KERNEL: Validate publish requirements
    if (publish) {
      if (!formData.description || !formData.description.trim()) {
        return {
          success: false,
          error: 'Product description is required for publishing'
        };
      }
      if (!formData.images || formData.images.length === 0) {
        return {
          success: false,
          error: 'At least one product image is required for publishing'
        };
      }
    }

    // ✅ KERNEL: Calculate completeness score
    const completenessScore = calculateCompletenessScore(formData);

    // ✅ KERNEL: Calculate price (use price_min if available, otherwise price_max)
    const price = priceMin || priceMax || 0;

    // ✅ KERNEL: Prepare product data
    const productData = {
      company_id: companyId,
      title: sanitizeString(formData.title),
      short_description: sanitizeString(formData.short_description || ''),
      description: sanitizeString(formData.description || ''),
      category_id: finalCategoryId,
      subcategory_id: formData.subcategory_id || null,
      country_of_origin: formData.country_of_origin || null,
      min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : null,
      moq_unit: formData.moq_unit || 'pieces',
      price: price,
      price_min: priceMin,
      price_max: priceMax,
      currency: formData.currency || 'USD',
      lead_time_min_days: formData.lead_time_min_days ? parseInt(formData.lead_time_min_days) : null,
      lead_time_max_days: formData.lead_time_max_days ? parseInt(formData.lead_time_max_days) : null,
      supply_ability_qty: formData.supply_ability_qty ? parseFloat(formData.supply_ability_qty) : null,
      supply_ability_unit: formData.supply_ability_unit || null,
      packaging_details: sanitizeString(formData.packaging_details || ''),
      shipping_terms: formData.shipping_terms || [],
      certifications: formData.certifications || [],
      specifications: formData.specifications || {},
      is_standardized: formData.is_standardized || false,
      completeness_score: completenessScore,
      status: publish ? 'active' : (formData.status || 'draft'),
      featured: formData.featured || false,
      published_at: publish ? new Date().toISOString() : null,
      views: 0,
      inquiries: 0
    };

    // ✅ KERNEL: Insert product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single();

    if (insertError) {
      console.error('[productService] Product insert error:', insertError);

      // ✅ KERNEL: Handle RLS errors gracefully
      const isRLSError = insertError.code === '42501' ||
        insertError.code === 'PGRST301' ||
        insertError.message?.includes('permission denied') ||
        insertError.message?.includes('row-level security') ||
        insertError.status === 403;

      if (isRLSError) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and have permission to create products. If this persists, please contact support.'
        };
      }

      return {
        success: false,
        error: insertError.message || 'Failed to create product. Please try again.'
      };
    }

    if (!newProduct || !newProduct.id) {
      return {
        success: false,
        error: 'Product creation failed. No product ID returned.'
      };
    }

    // ✅ KERNEL: Save images to product_images table
    let imagesSaved = false;
    if (formData.images && formData.images.length > 0) {
      try {
        const imageRecords = formData.images.map((img, index) => ({
          product_id: newProduct.id,
          url: typeof img === 'string' ? img : (img.url || img),
          alt_text: typeof img === 'string' ? formData.title : (img.alt_text || formData.title),
          is_primary: typeof img === 'object' ? (img.is_primary || index === 0) : (index === 0),
          sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : index) : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('[productService] Failed to save product images:', imagesError);
          // Don't fail the whole operation - product is saved, images can be added later
        } else {
          imagesSaved = true;
        }
      } catch (imageError) {
        console.error('[productService] Image save error:', imageError);
        // Product is saved, images can be added later
      }
    }

    // ✅ KERNEL: Return success with product data
    return {
      success: true,
      data: {
        id: newProduct.id,
        ...productData
      },
      imagesSaved: imagesSaved
    };

  } catch (error) {
    console.error('[productService] Unexpected error creating product:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Update an existing product
 * 
 * This is the Kernel method - handles all business logic:
 * - Ownership verification
 * - Validation
 * - Completeness scoring
 * - Data sanitization
 * - Database update
 * - Image management
 * 
 * @param {Object} params - Product update parameters
 * @param {Object} params.user - Authenticated user object (must have id)
 * @param {string} params.productId - Product ID to update
 * @param {Object} params.formData - Updated product form data
 * @param {string} params.companyId - Company ID (from kernel)
 * @param {boolean} params.publish - Whether to publish
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updateProduct({ user, productId, formData, companyId, publish = false }) {
  try {
    // ✅ KERNEL: Validate inputs
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }

    if (!companyId) {
      return {
        success: false,
        error: 'Company profile required'
      };
    }

    // ✅ KERNEL: Verify product ownership
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, company_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    if (existingProduct.company_id !== companyId) {
      return {
        success: false,
        error: 'You do not have permission to update this product'
      };
    }

    // ✅ KERNEL: Validate required fields
    if (!formData.title || !formData.title.trim()) {
      return {
        success: false,
        error: 'Product title is required'
      };
    }

    // ✅ KERNEL: Validate pricing (same as create)
    const priceMin = formData.price_min ? parseFloat(formData.price_min) : null;
    const priceMax = formData.price_max ? parseFloat(formData.price_max) : null;

    if (!priceMin && !priceMax) {
      return {
        success: false,
        error: 'Please enter at least one price (minimum or maximum)'
      };
    }

    if (priceMin && priceMin <= 0) {
      return {
        success: false,
        error: 'Minimum price must be greater than 0'
      };
    }

    if (priceMax && priceMax <= 0) {
      return {
        success: false,
        error: 'Maximum price must be greater than 0'
      };
    }

    if (priceMin && priceMax && priceMin > priceMax) {
      return {
        success: false,
        error: 'Minimum price cannot be greater than maximum price'
      };
    }

    // ✅ KERNEL: Validate publish requirements
    if (publish) {
      if (!formData.description || !formData.description.trim()) {
        return {
          success: false,
          error: 'Product description is required for publishing'
        };
      }
      if (!formData.images || formData.images.length === 0) {
        return {
          success: false,
          error: 'At least one product image is required for publishing'
        };
      }
    }

    // ✅ KERNEL: Calculate completeness score
    const completenessScore = calculateCompletenessScore(formData);

    // ✅ KERNEL: Calculate price
    const price = priceMin || priceMax || 0;

    // ✅ KERNEL: Prepare update data
    const updateData = {
      title: sanitizeString(formData.title),
      short_description: sanitizeString(formData.short_description || ''),
      description: sanitizeString(formData.description || ''),
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      country_of_origin: formData.country_of_origin || null,
      min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : null,
      moq_unit: formData.moq_unit || 'pieces',
      price: price,
      price_min: priceMin,
      price_max: priceMax,
      currency: formData.currency || 'USD',
      lead_time_min_days: formData.lead_time_min_days ? parseInt(formData.lead_time_min_days) : null,
      lead_time_max_days: formData.lead_time_max_days ? parseInt(formData.lead_time_max_days) : null,
      supply_ability_qty: formData.supply_ability_qty ? parseFloat(formData.supply_ability_qty) : null,
      supply_ability_unit: formData.supply_ability_unit || null,
      packaging_details: sanitizeString(formData.packaging_details || ''),
      shipping_terms: formData.shipping_terms || [],
      certifications: formData.certifications || [],
      specifications: formData.specifications || {},
      is_standardized: formData.is_standardized || false,
      completeness_score: completenessScore,
      status: publish ? 'active' : (formData.status || 'draft'),
      featured: formData.featured || false,
      published_at: publish ? new Date().toISOString() : null
    };

    // ✅ KERNEL: Update product
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('[productService] Product update error:', updateError);

      // ✅ KERNEL: Handle RLS errors gracefully
      const isRLSError = updateError.code === '42501' ||
        updateError.code === 'PGRST301' ||
        updateError.message?.includes('permission denied') ||
        updateError.message?.includes('row-level security') ||
        updateError.status === 403;

      if (isRLSError) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you have permission to update this product.'
        };
      }

      return {
        success: false,
        error: updateError.message || 'Failed to update product. Please try again.'
      };
    }

    // ✅ KERNEL: Update images (delete old, insert new)
    if (formData.images && formData.images.length > 0) {
      try {
        // Delete existing images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        // Insert new images
        const imageRecords = formData.images.map((img, index) => ({
          product_id: productId,
          url: typeof img === 'string' ? img : (img.url || img),
          alt_text: typeof img === 'string' ? formData.title : (img.alt_text || formData.title),
          is_primary: typeof img === 'object' ? (img.is_primary || index === 0) : (index === 0),
          sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : index) : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('[productService] Failed to update product images:', imagesError);
          // Product is updated, images can be fixed later
        }
      } catch (imageError) {
        console.error('[productService] Image update error:', imageError);
      }
    }

    return {
      success: true,
      data: {
        id: productId,
        ...updateData
      }
    };

  } catch (error) {
    console.error('[productService] Unexpected error updating product:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Helper: Calculate product completeness score
 * @param {Object} formData - Product form data
 * @returns {number} Completeness score (0-100)
 */
function calculateCompletenessScore(formData) {
  let score = 0;
  if (formData.description && formData.description.trim().length > 100) score += 25;
  if (formData.images && formData.images.length > 0) score += 25;
  if (formData.min_order_quantity && parseFloat(formData.min_order_quantity) > 0) score += 15;
  if (formData.price_min || formData.price_max) score += 15;
  if (formData.specifications && Object.keys(formData.specifications || {}).length > 0) score += 10;
  if (formData.certifications && formData.certifications.length > 0) score += 10;
  return Math.min(score, 100);
}
